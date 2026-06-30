import "server-only";
import { eq, and, sql, gte } from "drizzle-orm";
import { db, usageRecord, subscription, reviewRun, pullRequest, repository } from "@shipflow/db";
import { PLANS, type PlanKey } from "./razorpay";

function currentPeriodKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getOrCreateUsageRecord(workspaceId: string) {
  const periodKey = currentPeriodKey();
  const existing = await db.query.usageRecord.findFirst({
    where: and(eq(usageRecord.workspaceId, workspaceId), eq(usageRecord.periodKey, periodKey)),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(usageRecord)
    .values({ workspaceId, periodKey })
    .onConflictDoNothing()
    .returning();
  return (
    created ??
    (await db.query.usageRecord.findFirst({
      where: and(eq(usageRecord.workspaceId, workspaceId), eq(usageRecord.periodKey, periodKey)),
    }))!
  );
}

async function getPlanKey(workspaceId: string): Promise<PlanKey> {
  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.workspaceId, workspaceId),
  });
  return (sub?.plan as PlanKey) ?? "free";
}

/** Completed or in-progress AI reviews started today for this workspace. */
export async function getDailyReviewCount(workspaceId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviewRun)
    .innerJoin(pullRequest, eq(reviewRun.pullRequestId, pullRequest.id))
    .innerJoin(repository, eq(pullRequest.repositoryId, repository.id))
    .where(
      and(
        eq(repository.workspaceId, workspaceId),
        gte(reviewRun.createdAt, startOfToday()),
        sql`${reviewRun.status} != 'failed'`,
      ),
    );
  return row?.count ?? 0;
}

export class UsageLimitExceededError extends Error {
  constructor(
    public readonly resource: "aiReviewsPerMonth" | "aiReviewsPerDay" | "prdGenerationsPerMonth",
  ) {
    super(`Usage limit exceeded for ${resource}. Upgrade your plan to continue.`);
    this.name = "UsageLimitExceededError";
  }
}

export async function assertWithinLimit(
  workspaceId: string,
  resource: "aiReviewsPerMonth" | "prdGenerationsPerMonth",
) {
  const plan = await getPlanKey(workspaceId);
  const limits = PLANS[plan].limits;

  if (resource === "aiReviewsPerMonth") {
    const dailyLimit = limits.aiReviewsPerDay;
    if (dailyLimit !== -1) {
      const dailyUsed = await getDailyReviewCount(workspaceId);
      if (dailyUsed >= dailyLimit) {
        throw new UsageLimitExceededError("aiReviewsPerDay");
      }
    }
  }

  const limit = limits[resource];
  if (limit === -1) return;

  const usage = await getOrCreateUsageRecord(workspaceId);
  const used = resource === "aiReviewsPerMonth" ? usage.aiReviewsUsed : usage.prdGenerationsUsed;

  if (used >= limit) {
    throw new UsageLimitExceededError(resource);
  }
}

export async function incrementUsage(
  workspaceId: string,
  resource: "aiReviewsPerMonth" | "prdGenerationsPerMonth",
) {
  const periodKey = currentPeriodKey();
  await getOrCreateUsageRecord(workspaceId);

  const column = resource === "aiReviewsPerMonth" ? usageRecord.aiReviewsUsed : usageRecord.prdGenerationsUsed;

  await db
    .update(usageRecord)
    .set({
      [resource === "aiReviewsPerMonth" ? "aiReviewsUsed" : "prdGenerationsUsed"]: sql`${column} + 1`,
    })
    .where(and(eq(usageRecord.workspaceId, workspaceId), eq(usageRecord.periodKey, periodKey)));
}

export async function getUsageSnapshot(workspaceId: string) {
  const plan = await getPlanKey(workspaceId);
  const limits = PLANS[plan].limits;
  const usage = await getOrCreateUsageRecord(workspaceId);
  const aiReviewsUsedToday = await getDailyReviewCount(workspaceId);

  return {
    plan,
    limits,
    usage: {
      aiReviewsUsed: usage.aiReviewsUsed,
      prdGenerationsUsed: usage.prdGenerationsUsed,
      aiReviewsUsedToday,
    },
  };
}
