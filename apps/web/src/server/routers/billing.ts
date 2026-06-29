import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { subscription, usageRecord } from "@shipflow/db";
import { workspaceProcedure, router, requireRole } from "../trpc/trpc";
import { razorpay, PLANS, type PlanKey } from "@/lib/billing/razorpay";

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
      where: and(eq(usageRecord.workspaceId, ctx.workspaceId), eq(usageRecord.periodKey, currentPeriodKey())),
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

  /**
   * Creates a Razorpay subscription and returns what the client needs to
   * open Razorpay Checkout (subscription_id + key_id) — actual payment
   * confirmation comes back via the checkout success handler AND via the
   * `subscription.activated` webhook (the source of truth; see
   * app/api/webhooks/razorpay/route.ts). Owner/admin only — billing changes
   * shouldn't be a plain member action.
   */
  createSubscription: workspaceProcedure
    .use(requireRole("owner", "admin"))
    .input(z.object({ plan: z.enum(["pro", "enterprise"]) }))
    .mutation(async ({ ctx, input }) => {
      const planConfig = PLANS[input.plan];
      if (!planConfig.razorpayPlanId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `No Razorpay plan configured for "${input.plan}" — set RAZORPAY_${input.plan.toUpperCase()}_PLAN_ID.`,
        });
      }

      const rpSubscription = await razorpay.subscriptions.create({
        plan_id: planConfig.razorpayPlanId,
        customer_notify: 1,
        // 12 monthly cycles ≈ 1 year. Razorpay subscriptions run for exactly
        // `total_count` cycles then stop — they do NOT auto-renew past that
        // count. Before going live, decide whether to re-subscribe
        // customers automatically near cycle 12 (via a scheduled check) or
        // require manual renewal, and verify current behavior against
        // https://razorpay.com/docs/payments/subscriptions/ since this can
        // vary by plan configuration.
        total_count: 12,
        notes: { workspaceId: ctx.workspaceId, plan: input.plan },
      });

      await ctx.db
        .update(subscription)
        .set({
          razorpaySubscriptionId: rpSubscription.id,
          status: "incomplete", // becomes "active" only once the webhook confirms payment
        })
        .where(eq(subscription.workspaceId, ctx.workspaceId));

      return {
        razorpaySubscriptionId: rpSubscription.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      };
    }),

  cancelSubscription: workspaceProcedure.use(requireRole("owner", "admin")).mutation(async ({ ctx }) => {
    const sub = await ctx.db.query.subscription.findFirst({
      where: eq(subscription.workspaceId, ctx.workspaceId),
    });
    if (!sub?.razorpaySubscriptionId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active paid subscription to cancel." });
    }

    await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId);
    // Actual status flip to "canceled" happens via webhook, not optimistically
    // here — Razorpay's cancellation can be "at cycle end" depending on
    // dashboard settings, and the webhook is the single source of truth.
    return { ok: true as const };
  }),
});
