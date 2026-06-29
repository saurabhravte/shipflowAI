import { db } from "@shipflow/db";
import { subscription, usageRecord } from "@shipflow/db";
import { eq, and } from "drizzle-orm";
import { NotFoundError } from "../../common/utils/apiError";

const PLANS = {
  free:       { aiReviewsPerMonth: 3,  prdGenerationsPerMonth: 5  },
  pro:        { aiReviewsPerMonth: 50, prdGenerationsPerMonth: 50 },
  enterprise: { aiReviewsPerMonth: -1, prdGenerationsPerMonth: -1 },
} as const;

export async function getSubscription(workspaceId: string) {
  const periodKey = new Date().toISOString().slice(0, 7); // "2026-06"

  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.workspaceId, workspaceId))
    .limit(1);

  const plan = (sub?.plan ?? "free") as keyof typeof PLANS;
  const limits = PLANS[plan];

  const [usage] = await db
    .select()
    .from(usageRecord)
    .where(
      and(
        eq(usageRecord.workspaceId, workspaceId),
        eq(usageRecord.periodKey, periodKey)
      )
    )
    .limit(1);

  return {
    plan,
    status: sub?.status ?? "active",
    currentPeriodEnd: sub?.currentPeriodEnd,
    limits,
    usage: {
      aiReviewsUsed: usage?.aiReviewsUsed ?? 0,
      prdGenerationsUsed: usage?.prdGenerationsUsed ?? 0,
    },
  };
}

export async function grantProAccess(
  workspaceId: string,
  plan: "pro" | "enterprise" = "pro",
  durationDays = 365
) {
  const currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  const [sub] = await db
    .insert(subscription)
    .values({ workspaceId, plan, status: "active", currentPeriodEnd })
    .onConflictDoUpdate({
      target: subscription.workspaceId,
      set: { plan, status: "active", currentPeriodEnd },
    })
    .returning();
  return sub;
}
