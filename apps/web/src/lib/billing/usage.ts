import "server-only";
import { eq, and, sql } from "drizzle-orm";
import { db, usageRecord, subscription } from "@shipflow/db";
import { PLANS, type PlanKey } from "./razorpay";

function currentPeriodKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
  // Race condition guard: if another request created it first, re-fetch.
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

export class UsageLimitExceededError extends Error {
  constructor(public readonly resource: "aiReviewsPerMonth" | "prdGenerationsPerMonth") {
    super(`Usage limit exceeded for ${resource}. Upgrade your plan to continue.`);
    this.name = "UsageLimitExceededError";
  }
}

/**
 * Call BEFORE running an AI review or PRD generation. Throws
 * UsageLimitExceededError if the workspace is at its plan limit — callers
 * (Inngest functions, tRPC mutations) should catch this and surface a
 * clear "upgrade your plan" message rather than silently failing.
 */
export async function assertWithinLimit(
  workspaceId: string,
  resource: "aiReviewsPerMonth" | "prdGenerationsPerMonth",
) {
  const plan = await getPlanKey(workspaceId);
  const limit = PLANS[plan].limits[resource];
  if (limit === -1) return; // unlimited

  const usage = await getOrCreateUsageRecord(workspaceId);
  const used = resource === "aiReviewsPerMonth" ? usage.aiReviewsUsed : usage.prdGenerationsUsed;

  if (used >= limit) {
    throw new UsageLimitExceededError(resource);
  }
}

/** Call AFTER successfully completing the AI work, to record the usage. */
export async function incrementUsage(
  workspaceId: string,
  resource: "aiReviewsPerMonth" | "prdGenerationsPerMonth",
) {
  const periodKey = currentPeriodKey();
  await getOrCreateUsageRecord(workspaceId); // ensure row exists first

  const column = resource === "aiReviewsPerMonth" ? usageRecord.aiReviewsUsed : usageRecord.prdGenerationsUsed;

  await db
    .update(usageRecord)
    .set({
      [resource === "aiReviewsPerMonth" ? "aiReviewsUsed" : "prdGenerationsUsed"]: sql`${column} + 1`,
    })
    .where(and(eq(usageRecord.workspaceId, workspaceId), eq(usageRecord.periodKey, periodKey)));
}
