import { pgEnum, timestamp } from "drizzle-orm/pg-core";

/**
 * Every table uses a text primary key generated with `createId()` (cuid2-style,
 * via crypto.randomUUID under the hood — see ./id.ts). This keeps IDs
 * sortable-enough, URL-safe, and avoids leaking sequential integers to a
 * multi-tenant SaaS frontend.
 */

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---- Enums shared across domains -----------------------------------------

export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);

export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

/**
 * The single authoritative state machine for a feature request.
 * See /ARCHITECTURE.md Section 3 — do not infer status from other tables.
 */
export const featureRequestStatusEnum = pgEnum("feature_request_status", [
  "draft",
  "clarifying",
  "prd_generating",
  "prd_review",
  "tasks_generating",
  "tasks_review",
  "in_development",
  "ai_reviewing",
  "fix_needed",
  "human_approval",
  "shipped",
  "rejected",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "urgent"]);

export const pullRequestStateEnum = pgEnum("pull_request_state", ["open", "closed", "merged"]);

export const reviewRunStatusEnum = pgEnum("review_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const findingSeverityEnum = pgEnum("finding_severity", ["blocking", "non_blocking"]);

export const findingCategoryEnum = pgEnum("finding_category", [
  "requirements",
  "acceptance_criteria",
  "security",
  "performance",
  "edge_case",
  "code_quality",
]);

export const findingStatusEnum = pgEnum("finding_status", ["open", "resolved", "dismissed"]);

export const approvalDecisionEnum = pgEnum("approval_decision", ["approved", "rejected"]);
