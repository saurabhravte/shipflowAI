import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { subscription, usageRecord } from "@shipflow/db";
import { workspaceProcedure, router, requireRole } from "../trpc/trpc";
import { getRazorpay, PLANS, type PlanKey } from "@/lib/billing/razorpay";

function currentPeriodKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const billingRouter = router({
  current: workspaceProcedure.query(async ({ ctx }) => {
    const sub = await ctx.db.query.subscription.findFirst({
      where: eq(subscription.workspaceId, ctx.workspaceId),
    });

    const usage = await ctx.db.query.usageRecord.findFirst({
      where: and(
        eq(usageRecord.workspaceId, ctx.workspaceId),
        eq(usageRecord.periodKey, currentPeriodKey()),
      ),
    });

    const planKey: PlanKey = (sub?.plan as PlanKey) ?? "free";

    return {
      plan: planKey,
      status: sub?.status ?? "active",
      limits: PLANS[planKey].limits,
      usage: {
        aiReviewsUsed: usage?.aiReviewsUsed ?? 0,
        prdGenerationsUsed: usage?.prdGenerationsUsed ?? 0,
      },
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    };
  }),

  createSubscription: workspaceProcedure
    .use(requireRole("owner", "admin"))
    .input(
      z.object({
        plan: z.enum(["pro", "enterprise"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const planConfig = PLANS[input.plan];

      if (!planConfig.razorpayPlanId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `No Razorpay plan configured for "${input.plan}"`,
        });
      }

      const razorpay = getRazorpay();

      const rpSubscription = await razorpay.subscriptions.create({
        plan_id: planConfig.razorpayPlanId,
        customer_notify: 1,
        total_count: 12,
        notes: {
          workspaceId: ctx.workspaceId,
          plan: input.plan,
        },
      });

      await ctx.db
        .update(subscription)
        .set({
          razorpaySubscriptionId: rpSubscription.id,
          status: "incomplete",
        })
        .where(eq(subscription.workspaceId, ctx.workspaceId));

      return {
        razorpaySubscriptionId: rpSubscription.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      };
    }),

  cancelSubscription: workspaceProcedure
    .use(requireRole("owner", "admin"))
    .mutation(async ({ ctx }) => {
      const sub = await ctx.db.query.subscription.findFirst({
        where: eq(subscription.workspaceId, ctx.workspaceId),
      });

      if (!sub?.razorpaySubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active paid subscription to cancel.",
        });
      }

      const razorpay = getRazorpay();

      await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId);

      return {
        ok: true as const,
      };
    }),
});
