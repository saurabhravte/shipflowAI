import "server-only";
import Razorpay from "razorpay";

export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured.",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Plan definitions
 */
export const PLANS = {
  free: {
    name: "Free",
    razorpayPlanId: null as string | null,
    limits: {
      aiReviewsPerDay: 5,
      aiReviewsPerMonth: 25,
      prdGenerationsPerMonth: 10,
      repositories: 1,
    },
  },
  pro: {
    name: "Pro",
    razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID ?? null,
    limits: {
      aiReviewsPerDay: -1,
      aiReviewsPerMonth: 500,
      prdGenerationsPerMonth: 200,
      repositories: 10,
    },
  },
  enterprise: {
    name: "Enterprise",
    razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID ?? null,
    limits: {
      aiReviewsPerDay: -1,
      aiReviewsPerMonth: -1,
      prdGenerationsPerMonth: -1,
      repositories: -1,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
