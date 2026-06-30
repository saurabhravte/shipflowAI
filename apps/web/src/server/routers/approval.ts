import { z } from "zod";
import { eq, and, inArray, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  approval,
  featureRequest,
  project,
  repository,
  pullRequest,
  prd,
  task,
} from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";
import { mergePullRequest } from "@/lib/github/tools";

const PENDING_STATUSES = ["prd_review", "tasks_review", "human_approval"] as const;

export const approvalRouter = router({
  /** All items awaiting human action across the workspace. */
  listPending: workspaceProcedure.query(async ({ ctx }) => {
    const requests = await ctx.db.query.featureRequest.findMany({
      where: and(
        eq(featureRequest.workspaceId, ctx.workspaceId),
        inArray(featureRequest.status, [...PENDING_STATUSES]),
      ),
      orderBy: [desc(featureRequest.updatedAt)],
      with: { project: true },
    });

    const projectIds = [...new Set(requests.map((r) => r.projectId))];
    const repos =
      projectIds.length > 0
        ? await ctx.db.query.repository.findMany({
            where: and(
              eq(repository.workspaceId, ctx.workspaceId),
              inArray(repository.projectId, projectIds),
            ),
          })
        : [];

    const reposByProject = new Map(repos.map((r) => [r.projectId!, r]));

    const enriched = await Promise.all(
      requests.map(async (fr) => {
        const repo = reposByProject.get(fr.projectId) ?? null;
        const prs = await ctx.db.query.pullRequest.findMany({
          where: eq(pullRequest.featureRequestId, fr.id),
          orderBy: (t, { desc: d }) => d(t.createdAt),
          limit: 3,
        });
        const prdRow = await ctx.db.query.prd.findFirst({
          where: eq(prd.featureRequestId, fr.id),
        });
        const taskCount = await ctx.db.query.task.findMany({
          where: eq(task.featureRequestId, fr.id),
          columns: { id: true },
        });

        const gate =
          fr.status === "prd_review"
            ? ("prd" as const)
            : fr.status === "tasks_review"
              ? ("tasks" as const)
              : ("release" as const);

        return {
          id: fr.id,
          title: fr.title,
          status: fr.status,
          gate,
          updatedAt: fr.updatedAt,
          project: fr.project,
          repository: repo
            ? {
                id: repo.id,
                fullName: repo.fullName,
                defaultBranch: repo.defaultBranch,
              }
            : null,
          pullRequests: prs.map((p) => ({
            id: p.id,
            number: p.number,
            title: p.title,
            state: p.state,
            url: p.url,
          })),
          prdReady: !!prdRow,
          taskCount: taskCount.length,
        };
      }),
    );

    return enriched;
  }),

  listForFeatureRequest: workspaceProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.approval.findMany({
        where: eq(approval.featureRequestId, input.featureRequestId),
        orderBy: (t, { desc }) => desc(t.createdAt),
      });
    }),

  /**
   * The Phase 5 gate from the PRD: human reviewer has seen PRD + tasks + PR
   * + AI review history + outstanding issues, and makes the final call.
   * "approved" ships the feature; "rejected" can either end the feature
   * request or (with notes) send it back to fix_needed for another round —
   * both are legal per the state machine's human_approval transitions.
   */
  decide: workspaceProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        decision: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
        /** Only meaningful when decision is "rejected": send back for fixes instead of terminating. */
        sendBackForFixes: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await ctx.db.query.featureRequest.findFirst({
        where: and(
          eq(featureRequest.id, input.featureRequestId),
          eq(featureRequest.workspaceId, ctx.workspaceId),
        ),
      });
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" });
      if (fr.status !== "human_approval") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot record an approval decision while status is "${fr.status}".`,
        });
      }

      const [row] = await ctx.db
        .insert(approval)
        .values({
          featureRequestId: input.featureRequestId,
          decidedByUserId: ctx.user.id,
          decision: input.decision,
          notes: input.notes,
        })
        .returning();
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (input.decision === "approved") {
        await transitionFeatureRequest(input.featureRequestId, "shipped");

        // Merge the latest open linked PR on GitHub (best-effort — ship status is authoritative).
        const openPr = await ctx.db.query.pullRequest.findFirst({
          where: and(
            eq(pullRequest.featureRequestId, input.featureRequestId),
            eq(pullRequest.state, "open"),
          ),
          orderBy: (t, { desc }) => desc(t.updatedAt),
          with: { repository: { with: { installation: true } } },
        });

        if (openPr?.repository?.installation) {
          try {
            const mergeResult = await mergePullRequest({
              installationId: openPr.repository.installation.installationId,
              owner: openPr.repository.owner,
              repo: openPr.repository.name,
              pullNumber: openPr.number,
              commitTitle: `Ship: ${fr.title}`,
            });
            if (mergeResult.data.merged) {
              await ctx.db
                .update(pullRequest)
                .set({ state: "merged" })
                .where(eq(pullRequest.id, openPr.id));
            }
          } catch (err) {
            console.warn(`[approval] GitHub merge failed for PR #${openPr.number}:`, err);
          }
        }
      } else if (input.sendBackForFixes) {
        await transitionFeatureRequest(input.featureRequestId, "fix_needed");
      } else {
        await transitionFeatureRequest(input.featureRequestId, "rejected");
      }

      return row;
    }),
});
