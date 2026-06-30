import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { prd, featureRequest, repository, type Database } from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";
import { inngest } from "@/server/inngest/client";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";

const userStorySchema = z.object({ id: z.string(), asA: z.string(), iWant: z.string(), soThat: z.string() });
const acceptanceCriterionSchema = z.object({ id: z.string(), description: z.string() });
const successMetricSchema = z.object({ id: z.string(), metric: z.string(), target: z.string() });

async function loadPrdScoped(db: Database, featureRequestId: string, workspaceId: string) {
  const fr = await db.query.featureRequest.findFirst({
    where: and(eq(featureRequest.id, featureRequestId), eq(featureRequest.workspaceId, workspaceId)),
  });
  if (!fr) throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found." });
  return fr;
}

export const prdRouter = router({
  get: workspaceProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      await loadPrdScoped(ctx.db, input.featureRequestId, ctx.workspaceId);
      const row = await ctx.db.query.prd.findFirst({
        where: eq(prd.featureRequestId, input.featureRequestId),
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "PRD not generated yet." });
      return row;
    }),

  /** Human edits to the structured PRD form — per your decision, fixed fields, not free markdown. */
  update: workspaceProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        problemStatement: z.string().optional(),
        goals: z.array(z.string()).optional(),
        nonGoals: z.array(z.string()).optional(),
        userStories: z.array(userStorySchema).optional(),
        acceptanceCriteria: z.array(acceptanceCriterionSchema).optional(),
        edgeCases: z.array(z.string()).optional(),
        successMetrics: z.array(successMetricSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await loadPrdScoped(ctx.db, input.featureRequestId, ctx.workspaceId);
      const { featureRequestId, ...fields } = input;

      const [row] = await ctx.db
        .update(prd)
        .set(fields)
        .where(eq(prd.featureRequestId, featureRequestId))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      return row;
    }),

  /** Phase 1 -> Phase 2 gate: human approves the PRD, task generation kicks off. */
  approve: workspaceProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await loadPrdScoped(ctx.db, input.featureRequestId, ctx.workspaceId);

      const [row] = await ctx.db
        .update(prd)
        .set({ approvedAt: new Date(), approvedByUserId: ctx.user.id })
        .where(eq(prd.featureRequestId, input.featureRequestId))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      await transitionFeatureRequest(input.featureRequestId, "tasks_generating");
      await inngest.send({
        name: "prd/approved",
        data: { featureRequestId: input.featureRequestId },
      });

      return row;
    }),

  /** Human rejects the PRD — feature request is terminated. */
  reject: workspaceProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await loadPrdScoped(ctx.db, input.featureRequestId, ctx.workspaceId);
      if (fr.status !== "prd_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reject PRD while status is "${fr.status}".`,
        });
      }
      await transitionFeatureRequest(input.featureRequestId, "rejected");
      return { ok: true as const, notes: input.notes };
    }),
});
