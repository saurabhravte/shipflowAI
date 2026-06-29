import "server-only";
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

/**
 * Plan definitions per the PRD's "Free vs paid plans / Usage limits / AI
 * review credits / Repository limits" requirement. `razorpayPlanId` is the
 * Plan created in the Razorpay Dashboard (Subscriptions > Plans) — paste
 * the real IDs here once created; null means "no Razorpay plan" (free tier
 * never talks to Razorpay at all).
 */
export const PLANS = {
  free: {
    name: "Free",
    razorpayPlanId: null as string | null,
    limits: { aiReviewsPerMonth: 25, prdGenerationsPerMonth: 10, repositories: 1 },
  },
  pro: {
    name: "Pro",
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID ?? null,
    limits: { aiReviewsPerMonth: 500, prdGenerationsPerMonth: 200, repositories: 10 },
  },
  enterprise: {
    name: "Enterprise",
    razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID ?? null,
    // -1 = unlimited, checked explicitly wherever limits are enforced
    limits: { aiReviewsPerMonth: -1, prdGenerationsPerMonth: -1, repositories: -1 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
