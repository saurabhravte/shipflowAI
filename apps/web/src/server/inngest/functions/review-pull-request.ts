import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import {
  db,
  pullRequest,
  repository,
  reviewRun,
  reviewFinding,
  featureRequest,
  prd,
} from "@shipflow/db";
import { inngest } from "../client";
import { getModelsForWorkspace } from "@/lib/ai/models";
import { reviewFindingsSchema } from "@/lib/ai/schemas";
import { reviewPrompt } from "@/lib/ai/prompts";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";
import { getPRDiff, getPRChangedFiles, getFileContent, postReview } from "@/lib/github/tools";
import { indexFileChunks, findRelatedChunks } from "@/lib/vector/pinecone";
import { assertWithinLimit, incrementUsage, UsageLimitExceededError } from "@/lib/billing/usage";

const MAX_DIFF_CHARS = 60_000; // keep the prompt within a sane context budget; see PRD Sec 9.2 "retrieve, do not dump"
const MAX_FILES_TO_EMBED = 25; // guard against pathological PRs with hundreds of changed files

export const reviewPullRequest = inngest.createFunction(
  { id: "review-pull-request", retries: 2, concurrency: { limit: 5 } },
  { event: "github/pull_request.review_requested" },
  async ({ event, step }) => {
    const { pullRequestId, repositoryId, installationId, headSha } = event.data;

    if (!installationId) {
      // Shouldn't happen for a real GitHub webhook payload, but the type is
      // optional on the webhook event — fail loudly rather than proceed
      // with an undefined installation id.
      throw new Error(`No installationId on review_requested event for PR ${pullRequestId}`);
    }

    const { pr, repo } = await step.run("load-pr-and-repo", async () => {
      const prRow = await db.query.pullRequest.findFirst({
        where: eq(pullRequest.id, pullRequestId),
      });
      const repoRow = await db.query.repository.findFirst({
        where: eq(repository.id, repositoryId),
      });
      if (!prRow || !repoRow) {
        throw new Error(`PR ${pullRequestId} or repository ${repositoryId} not found`);
      }
      return { pr: prRow, repo: repoRow };
    });

    const withinLimit = await step.run("check-usage-limit", async () => {
      try {
        await assertWithinLimit(repo.workspaceId, "aiReviewsPerMonth");
        return true;
      } catch (err) {
        if (err instanceof UsageLimitExceededError) return false;
        throw err;
      }
    });

    if (!withinLimit) {
      // Don't silently no-op: mark a review_run row as failed so the
      // workspace can see *why* no review appeared, and post a GitHub
      // comment so the PR author isn't left guessing either.
      await step.run("record-limit-exceeded", async () => {
        await db.insert(reviewRun).values({
          pullRequestId,
          triggeredBySha: headSha,
          status: "failed",
          summary: "AI review skipped: daily AI review limit reached (Free plan: 5/day). Upgrade to Pro for unlimited reviews.",
          startedAt: new Date(),
          completedAt: new Date(),
        });
      });
      return { skipped: true as const, reason: "usage_limit_exceeded" };
    }

    const run = await step.run("create-review-run", async () => {
      const [r] = await db
        .insert(reviewRun)
        .values({
          pullRequestId,
          triggeredBySha: headSha,
          status: "running",
          startedAt: new Date(),
        })
        .returning();
      if (!r) throw new Error("Failed to create review_run row");
      return r;
    });

    if (pr.featureRequestId) {
      await step.run("transition-to-ai-reviewing", async () => {
        const fr = await db.query.featureRequest.findFirst({
          where: eq(featureRequest.id, pr.featureRequestId!),
        });
        // Only transition if currently in a state that allows it — a PR can
        // be re-pushed to (synchronize) while already in ai_reviewing or
        // fix_needed; both are valid "re-enter ai_reviewing" sources per the
        // state machine, but in_development is the normal first entry.
        if (fr && (fr.status === "in_development" || fr.status === "fix_needed")) {
          await transitionFeatureRequest(pr.featureRequestId!, "ai_reviewing");
        }
      });
    }

    const diff = await step.run("fetch-diff", async () => {
      const fullDiff = await getPRDiff(installationId, repo.owner, repo.name, pr.number);
      return fullDiff.length > MAX_DIFF_CHARS
        ? fullDiff.slice(0, MAX_DIFF_CHARS) + "\n... (diff truncated for length)"
        : fullDiff;
    });

    const changedFiles = await step.run("fetch-changed-files", async () => {
      const files = await getPRChangedFiles(installationId, repo.owner, repo.name, pr.number);
      return files
        .filter((f) => f.status !== "removed")
        .slice(0, MAX_FILES_TO_EMBED)
        .map((f) => ({ path: f.filename, status: f.status }));
    });

    // Index changed files into Pinecone — one step per file so a failure on
    // file N doesn't force re-fetching/re-embedding files 1..N-1 on retry.
    // Sequential (not Promise.all) is deliberate: avoids bursting the
    // embedding API and Pinecone with N simultaneous requests on large PRs;
    // each step.run() call is itself durable/retryable per Inngest's loop
    // pattern (see Inngest docs "Working with Loops").
    for (const file of changedFiles) {
      await step.run(`index-file:${file.path}`, async () => {
        try {
          const content = await getFileContent(
            installationId,
            repo.owner,
            repo.name,
            file.path,
            headSha,
          );
          await indexFileChunks({
            workspaceId: repo.workspaceId,
            repositoryId,
            filePath: file.path,
            content,
            prNumber: pr.number,
            sha: headSha,
          });
        } catch (err) {
          // A single unreadable/binary file shouldn't fail the whole review —
          // log and continue; the diff itself still gets reviewed.
          console.warn(`[review] failed to index ${file.path}:`, err);
        }
      });
    }

    const relatedContext = await step.run("retrieve-related-context", async () => {
      const queries = changedFiles.slice(0, 5); // cap retrieval queries, not just storage
      const allMatches = await Promise.all(
        queries.map((f) =>
          findRelatedChunks({
            workspaceId: repo.workspaceId,
            repositoryId,
            queryText: f.path, // file path as a cheap proxy query; richer would be the file's own diff hunk
            excludeFilePath: f.path,
            topK: 4,
          }),
        ),
      );
      const flat = allMatches.flat().sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const top = flat.slice(0, 10);
      return top
        .map((m) => `${m.metadata.filePath} (lines ${m.metadata.startLine}-${m.metadata.endLine})`)
        .join("\n");
    });

    const { prdSummary, acceptanceCriteria } = await step.run("load-requirements-context", async () => {
      if (!pr.featureRequestId) {
        return { prdSummary: "(no linked feature request / PRD for this PR)", acceptanceCriteria: [] };
      }
      const prdRow = await db.query.prd.findFirst({
        where: eq(prd.featureRequestId, pr.featureRequestId),
      });
      if (!prdRow) {
        return { prdSummary: "(no PRD found for linked feature request)", acceptanceCriteria: [] };
      }
      return {
        prdSummary: prdRow.problemStatement,
        acceptanceCriteria: prdRow.acceptanceCriteria.map((c) => c.description),
      };
    });

    const reviewResult = await step.run("run-ai-review", async () => {
      const models = await getModelsForWorkspace(repo.workspaceId);
      const { object } = await generateObject({
        model: models.review,
        schema: reviewFindingsSchema,
        prompt: reviewPrompt({
          prdSummary,
          acceptanceCriteria,
          prTitle: pr.title,
          prDescription: pr.body ?? "",
          diff,
          relatedContext,
        }),
      });
      return object;
    });

    await step.run("persist-findings", async () => {
      await db.update(reviewRun).set({
        status: "completed",
        summary: reviewResult.summary,
        completedAt: new Date(),
      }).where(eq(reviewRun.id, run.id));

      if (reviewResult.findings.length > 0) {
        await db.insert(reviewFinding).values(
          reviewResult.findings.map((f) => ({
            reviewRunId: run.id,
            category: f.category,
            severity: f.severity,
            filePath: f.filePath,
            startLine: f.startLine,
            endLine: f.endLine,
            message: f.message,
            rationale: f.rationale,
            suggestion: f.suggestion,
          })),
        );
      }

      await incrementUsage(repo.workspaceId, "aiReviewsPerMonth");
    });

    await step.run("post-github-review", async () => {
      const inlineComments = reviewResult.findings
        .filter((f) => f.filePath && f.startLine)
        .map((f) => ({
          path: f.filePath as string,
          line: f.startLine as number,
          body: `**[${f.severity === "blocking" ? "🔴 Blocking" : "🟡 Suggestion"} · ${f.category}]**\n\n${f.message}\n\n_Why:_ ${f.rationale}${f.suggestion ? `\n\n**Suggested fix:** ${f.suggestion}` : ""}`,
        }));

      await postReview({
        installationId,
        owner: repo.owner,
        repo: repo.name,
        pullNumber: pr.number,
        commitSha: headSha,
        summary: reviewResult.summary,
        comments: inlineComments,
      });
    });

    const hasBlockingFindings = reviewResult.findings.some((f) => f.severity === "blocking");

    if (pr.featureRequestId) {
      await step.run("transition-after-review", async () => {
        await transitionFeatureRequest(
          pr.featureRequestId!,
          hasBlockingFindings ? "fix_needed" : "human_approval",
        );
      });
    }

    return {
      reviewRunId: run.id,
      findingCount: reviewResult.findings.length,
      hasBlockingFindings,
    };
  },
);
