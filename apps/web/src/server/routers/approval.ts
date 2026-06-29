import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { approval, featureRequest } from "@shipflow/db";
import { workspaceProcedure, router } from "../trpc/trpc";
import { transitionFeatureRequest } from "@/server/workflows/state-machine";

export const approvalRouter = router({
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
      } else if (input.sendBackForFixes) {
        await transitionFeatureRequest(input.featureRequestId, "fix_needed");
      } else {
        await transitionFeatureRequest(input.featureRequestId, "rejected");
      }

      return row;
    }),
});
