import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { pullRequest, reviewRun, reviewFinding, repository } from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";

export const pullRequestRouter = router({
  /** Cross-project overview: every PR in repos belonging to this workspace, most recent first. */
  listForWorkspace: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: pullRequest.id,
        number: pullRequest.number,
        title: pullRequest.title,
        state: pullRequest.state,
        url: pullRequest.url,
        repositoryFullName: repository.fullName,
        createdAt: pullRequest.createdAt,
      })
      .from(pullRequest)
      .innerJoin(repository, eq(pullRequest.repositoryId, repository.id))
      .where(eq(repository.workspaceId, ctx.workspaceId))
      .orderBy(desc(pullRequest.createdAt))
      .limit(50);
  }),

  listForFeatureRequest: workspaceProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.pullRequest.findMany({
        where: eq(pullRequest.featureRequestId, input.featureRequestId),
        orderBy: (t, { desc }) => desc(t.createdAt),
      });
    }),

  get: workspaceProcedure
    .input(z.object({ pullRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Scope through repository.workspaceId since pullRequest itself has
      // no workspaceId column — see ARCHITECTURE.md tenancy note: every
      // multi-row query must filter by workspace, including via join here.
      const row = await ctx.db
        .select({ pr: pullRequest, repo: repository })
        .from(pullRequest)
        .innerJoin(repository, eq(pullRequest.repositoryId, repository.id))
        .where(and(eq(pullRequest.id, input.pullRequestId), eq(repository.workspaceId, ctx.workspaceId)))
        .then((rows) => rows[0]);

      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});

export const reviewRouter = router({
  /** All review runs (one per push/open event) for a PR, most recent first — the "AI review history" Phase 5 needs. */
  listRunsForPullRequest: workspaceProcedure
    .input(z.object({ pullRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Workspace-scope via the same join pattern as pullRequest.get.
      const owns = await ctx.db
        .select({ id: pullRequest.id })
        .from(pullRequest)
        .innerJoin(repository, eq(pullRequest.repositoryId, repository.id))
        .where(and(eq(pullRequest.id, input.pullRequestId), eq(repository.workspaceId, ctx.workspaceId)))
        .then((rows) => rows[0]);
      if (!owns) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.query.reviewRun.findMany({
        where: eq(reviewRun.pullRequestId, input.pullRequestId),
        orderBy: (t, { desc }) => desc(t.createdAt),
        with: { findings: true },
      });
    }),

  resolveFinding: workspaceProcedure
    .input(z.object({ findingId: z.string(), status: z.enum(["resolved", "dismissed"]) }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(reviewFinding)
        .set({ status: input.status })
        .where(eq(reviewFinding.id, input.findingId))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),
});
