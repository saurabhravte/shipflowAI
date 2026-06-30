import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { task, featureRequest, type Database } from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";

async function assertFeatureRequestInWorkspace(
  ctx: { db: Database },
  featureRequestId: string,
  workspaceId: string,
) {
  const fr = await ctx.db.query.featureRequest.findFirst({
    where: and(eq(featureRequest.id, featureRequestId), eq(featureRequest.workspaceId, workspaceId)),
  });
  if (!fr) throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found." });
  return fr;
}

export const taskRouter = router({
  list: workspaceProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertFeatureRequestInWorkspace(ctx, input.featureRequestId, ctx.workspaceId);
      return ctx.db.query.task.findMany({
        where: eq(task.featureRequestId, input.featureRequestId),
        orderBy: (t, { asc }) => asc(t.position),
      });
    }),

  /** Kanban drag-and-drop: change status and/or position. */
  move: workspaceProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]),
        position: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(task)
        .set({ status: input.status, position: input.position })
        .where(eq(task.id, input.taskId))
        .returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  update: workspaceProcedure
    .input(
      z.object({
        taskId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        assigneeUserId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { taskId, ...fields } = input;
      const [row] = await ctx.db.update(task).set(fields).where(eq(task.id, taskId)).returning();
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /** Phase 2 -> Phase 3 gate: human approves the task plan, moves to in_development. */
  approvePlan: workspaceProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertFeatureRequestInWorkspace(ctx, input.featureRequestId, ctx.workspaceId);
      await transitionFeatureRequest(input.featureRequestId, "in_development");
      return { ok: true as const };
    }),

  /** Human rejects the task plan — feature request is terminated. */
  rejectPlan: workspaceProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const fr = await assertFeatureRequestInWorkspace(ctx, input.featureRequestId, ctx.workspaceId);
      if (fr.status !== "tasks_review") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot reject plan while status is "${fr.status}".`,
        });
      }
      await transitionFeatureRequest(input.featureRequestId, "rejected");
      return { ok: true as const, notes: input.notes };
    }),
});
