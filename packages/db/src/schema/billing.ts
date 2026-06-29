import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "./id";
import { workspace } from "./auth";
import { planEnum, subscriptionStatusEnum, timestamps } from "./_shared";

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey().$defaultFn(() => createId("sub")),
  workspaceId: text("workspace_id")
    .notNull()
    .unique()
    .references(() => workspace.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
  razorpayCustomerId: text("razorpay_customer_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  ...timestamps,
});

/**
 * One row per workspace per calendar-month usage bucket. Kept simple and
 * additive (increment-only) rather than computing usage by counting review
 * runs at read time, since limits must be checked on the hot path before
 * an AI review is allowed to start.
 */
export const usageRecord = pgTable("usage_record", {
  id: text("id").primaryKey().$defaultFn(() => createId("use")),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  periodKey: text("period_key").notNull(), // "2026-06" — current month bucket
  aiReviewsUsed: integer("ai_reviews_used").notNull().default(0),
  prdGenerationsUsed: integer("prd_generations_used").notNull().default(0),
  ...timestamps,
});

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  workspace: one(workspace, { fields: [subscription.workspaceId], references: [workspace.id] }),
}));
