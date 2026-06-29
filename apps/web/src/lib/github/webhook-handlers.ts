import "server-only";
import type {
  PullRequestOpenedEvent,
  PullRequestSynchronizeEvent,
  PullRequestReopenedEvent,
  PullRequestClosedEvent,
  InstallationCreatedEvent,
  InstallationDeletedEvent,
} from "@octokit/webhooks-types";
import { db, repository, pullRequest, githubInstallation, featureRequest } from "@shipflow/db";
import { eq, and } from "drizzle-orm";
import { githubApp } from "./app";
import { inngest } from "@/server/inngest/client";

/**
 * Registered once at module load (this file is imported exactly once, from
 * the webhook route handler). Each handler does the minimum DB write needed
 * to have a row to attach state to, then hands off anything slow (fetching
 * diffs, calling the LLM) to Inngest — see ARCHITECTURE.md Section 4.
 */

/**
 * Convention for linking a PR to a ShipFlow feature request, since GitHub
 * has no native concept of our domain. Developers write
 * `ShipFlow: fr_abc123` anywhere in the PR title or body — same idea as
 * GitHub's own "Closes #123" convention. This is a v1 simplification
 * (Pass 5's PR-creation UI should auto-insert this when a human opens a PR
 * from a task card) rather than a robust general solution.
 */
function extractFeatureRequestId(title: string, body: string | null): string | null {
  const match = `${title}\n${body ?? ""}`.match(/ShipFlow:\s*(fr_[a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
}

githubApp.webhooks.on(
  ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"],
  async ({ payload }) => {
    const p = payload as
      | PullRequestOpenedEvent
      | PullRequestSynchronizeEvent
      | PullRequestReopenedEvent;

    const repo = await db.query.repository.findFirst({
      where: eq(repository.githubRepoId, p.repository.id),
    });

    // Repo isn't linked to a workspace/project yet — nothing to review against.
    if (!repo) return;

    const parsedFeatureRequestId = extractFeatureRequestId(
      p.pull_request.title,
      p.pull_request.body,
    );

    // Only trust the parsed id if it actually exists and belongs to this
    // repository's workspace — never link cross-tenant on a typo'd id.
    let featureRequestId: string | null = null;
    if (parsedFeatureRequestId) {
      const fr = await db.query.featureRequest.findFirst({
        where: and(
          eq(featureRequest.id, parsedFeatureRequestId),
          eq(featureRequest.workspaceId, repo.workspaceId),
        ),
      });
      featureRequestId = fr?.id ?? null;
    }

    const [pr] = await db
      .insert(pullRequest)
      .values({
        repositoryId: repo.id,
        featureRequestId,
        number: p.pull_request.number,
        title: p.pull_request.title,
        body: p.pull_request.body,
        authorLogin: p.pull_request.user.login,
        headSha: p.pull_request.head.sha,
        baseBranch: p.pull_request.base.ref,
        headBranch: p.pull_request.head.ref,
        state: "open",
        url: p.pull_request.html_url,
      })
      .onConflictDoUpdate({
        target: [pullRequest.repositoryId, pullRequest.number],
        set: {
          title: p.pull_request.title,
          body: p.pull_request.body,
          headSha: p.pull_request.head.sha,
          state: "open",
          // Re-resolve featureRequestId on every push too, in case the PR
          // description is edited to add the link after the PR was opened.
          featureRequestId,
        },
      })
      .returning();

    if (!pr) return;

    await inngest.send({
      name: "github/pull_request.review_requested",
      data: {
        pullRequestId: pr.id,
        repositoryId: repo.id,
        installationId: p.installation?.id,
        headSha: p.pull_request.head.sha,
      },
    });
  },
);

githubApp.webhooks.on("pull_request.closed", async ({ payload }) => {
  const p = payload as PullRequestClosedEvent;

  const repo = await db.query.repository.findFirst({
    where: eq(repository.githubRepoId, p.repository.id),
  });
  if (!repo) return;

  await db
    .update(pullRequest)
    .set({ state: p.pull_request.merged ? "merged" : "closed" })
    .where(and(eq(pullRequest.repositoryId, repo.id), eq(pullRequest.number, p.pull_request.number)));
});

githubApp.webhooks.on("installation.created", async ({ payload }) => {
  const p = payload as InstallationCreatedEvent;
  // The actual workspaceId<->installation link is finalized in the setup
  // callback route (Pass 3, install-callback/route.ts) where we have the
  // `state` param identifying which workspace initiated this. This handler
  // only logs/no-ops if that link doesn't exist yet — order of webhook vs.
  // callback delivery isn't guaranteed by GitHub.
  console.log(`[github webhook] installation.created for ${p.installation.account?.login}`);
});

githubApp.webhooks.on("installation.deleted", async ({ payload }) => {
  const p = payload as InstallationDeletedEvent;
  await db.delete(githubInstallation).where(eq(githubInstallation.installationId, p.installation.id));
});

export { githubApp };
