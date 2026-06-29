import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { featureRequest, project, clarifyingExchange } from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";
import { inngest } from "@/server/inngest/client";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";

export const featureRequestRouter = router({
  list: workspaceProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.featureRequest.findMany({
        where: input.projectId
          ? and(
              eq(featureRequest.workspaceId, ctx.workspaceId),
              eq(featureRequest.projectId, input.projectId),
            )
          : eq(featureRequest.workspaceId, ctx.workspaceId),
        orderBy: (t, { desc }) => desc(t.createdAt),
      });
    }),

  get: workspaceProcedure
    .input(z.object({ featureRequestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.featureRequest.findFirst({
        where: and(
          eq(featureRequest.id, input.featureRequestId),
          eq(featureRequest.workspaceId, ctx.workspaceId),
        ),
        with: {
          prd: true,
          tasks: true,
          clarifyingExchanges: true,
          approvals: true,
        },
      });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  /** Phase 1 entry point: human submits a raw request, AI clarification kicks off async. */
  create: workspaceProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1).max(200),
        rawRequest: z.string().min(1),
        sourceChannel: z.enum(["email", "ticket", "call", "manual"]).default("manual"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const proj = await ctx.db.query.project.findFirst({
        where: and(eq(project.id, input.projectId), eq(project.workspaceId, ctx.workspaceId)),
      });
      if (!proj) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });

      const [fr] = await ctx.db
        .insert(featureRequest)
        .values({
          workspaceId: ctx.workspaceId,
          projectId: input.projectId,
          createdByUserId: ctx.user.id,
          title: input.title,
          rawRequest: input.rawRequest,
          sourceChannel: input.sourceChannel,
          status: "draft",
        })
        .returning();
      if (!fr) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Cheap write done; hand the slow work to Inngest immediately —
      // this mutation must not block on an LLM call (ARCHITECTURE.md Sec 4).
      await inngest.send({
        name: "feature_request/clarify_requested",
        data: { featureRequestId: fr.id },
      });

      return fr;
    }),

  /** Human answers the AI's clarifying questions, then PRD generation kicks off. */
  submitClarifyingAnswers: workspaceProcedure
    .input(
      z.object({
        featureRequestId: z.string(),
        answers: z.array(z.object({ exchangeId: z.string(), answer: z.string() })),
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

      for (const a of input.answers) {
        await ctx.db
          .update(clarifyingExchange)
          .set({ answer: a.answer })
          .where(
            and(
              eq(clarifyingExchange.id, a.exchangeId),
              eq(clarifyingExchange.featureRequestId, input.featureRequestId),
            ),
          );
      }

      await transitionFeatureRequest(input.featureRequestId, "prd_generating");
      await inngest.send({
        name: "feature_request/prd_requested",
        data: { featureRequestId: input.featureRequestId },
      });

      return { ok: true as const };
    }),
});
