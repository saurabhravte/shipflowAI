/**
 * Admin script: Grant Pro/Enterprise access directly from the database.
 *
 * Usage:
 *   pnpm tsx src/scripts/grant-pro.ts <workspaceId> [plan] [durationDays]
 *
 * Examples:
 *   pnpm tsx src/scripts/grant-pro.ts ws_abc123
 *   pnpm tsx src/scripts/grant-pro.ts ws_abc123 enterprise 30
 */
import "dotenv/config";
import { db, createId } from "@shipflow/db";
import { subscription } from "@shipflow/db";

const [, , workspaceId, plan = "pro", durationDaysStr = "365"] = process.argv;

if (!workspaceId) {
  console.error("❌  Usage: tsx src/scripts/grant-pro.ts <workspaceId> [pro|enterprise] [days]");
  process.exit(1);
}

if (plan !== "pro" && plan !== "enterprise") {
  console.error('❌  Plan must be "pro" or "enterprise"');
  process.exit(1);
}

const durationDays = parseInt(durationDaysStr, 10);
const currentPeriodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

console.log(`\n🔧 Granting ${plan} access to workspace: ${workspaceId}`);
console.log(`   Duration: ${durationDays} days (until ${currentPeriodEnd.toDateString()})\n`);

const [result] = await db
  .insert(subscription)
  .values({
    id: createId("sub"),
    workspaceId,
    plan: plan as "pro" | "enterprise",
    status: "active",
    currentPeriodEnd,
  })
  .onConflictDoUpdate({
    target: subscription.workspaceId,
    set: {
      plan: plan as "pro" | "enterprise",
      status: "active",
      currentPeriodEnd,
    },
  })
  .returning();

if (result) {
  console.log(`✅  Success! Workspace ${workspaceId} now has ${plan} access.`);
  console.log(`   Subscription ID: ${result.id}`);
  console.log(`   Valid until:     ${result.currentPeriodEnd?.toDateString()}\n`);
} else {
  console.error("❌  Failed to update subscription.");
  process.exit(1);
}

process.exit(0);
