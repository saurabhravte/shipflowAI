import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "./id";
import { workspace, user } from "./auth";
import {
  approvalDecisionEnum,
  featureRequestStatusEnum,
  taskPriorityEnum,
  taskStatusEnum,
  timestamps,
} from "./_shared";

export const project = pgTable("project", {
  id: text("id").primaryKey().$defaultFn(() => createId("proj")),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  ...timestamps,
});

/**
 * The root of the core loop. `status` is the single authoritative state —
 * see /ARCHITECTURE.md Section 3. Never derive UI state from PRD/Task rows
 * existing or not; always read this column.
 */
export const featureRequest = pgTable("feature_request", {
  id: text("id").primaryKey().$defaultFn(() => createId("fr")),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  title: text("title").notNull(),
  /** Raw intake — the original email / ticket / call transcript / free text. */
  rawRequest: text("raw_request").notNull(),
  /** Where the request came from — informational, not used for branching logic. */
  sourceChannel: text("source_channel").notNull().default("manual"), // "email" | "ticket" | "call" | "manual"
  status: featureRequestStatusEnum("status").notNull().default("draft"),
  /**
   * Set by the clarification step when the AI determines the request is a
   * duplicate of existing functionality. When non-null, the UI surfaces an
   * "this may already exist" notice but the human can still choose to proceed.
   */
  duplicateOfNote: text("duplicate_of_note"),
  ...timestamps,
});

/** One row per AI clarifying question asked during the `clarifying` phase, with the human's answer. */
export const clarifyingExchange = pgTable("clarifying_exchange", {
  id: text("id").primaryKey().$defaultFn(() => createId("clx")),
  featureRequestId: text("feature_request_id")
    .notNull()
    .references(() => featureRequest.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Structured PRD — fixed fields per your decision, not free markdown.
 * Array fields (goals, userStories, etc.) are jsonb string arrays / typed
 * objects rather than separate child tables, since they're edited as a unit
 * in the PRD editor form and never queried independently.
 */
export const prd = pgTable("prd", {
  id: text("id").primaryKey().$defaultFn(() => createId("prd")),
  featureRequestId: text("feature_request_id")
    .notNull()
    .unique()
    .references(() => featureRequest.id, { onDelete: "cascade" }),
  problemStatement: text("problem_statement").notNull().default(""),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  nonGoals: jsonb("non_goals").$type<string[]>().notNull().default([]),
  userStories: jsonb("user_stories")
    .$type<{ id: string; asA: string; iWant: string; soThat: string }[]>()
    .notNull()
    .default([]),
  acceptanceCriteria: jsonb("acceptance_criteria")
    .$type<{ id: string; description: string }[]>()
    .notNull()
    .default([]),
  edgeCases: jsonb("edge_cases").$type<string[]>().notNull().default([]),
  successMetrics: jsonb("success_metrics")
    .$type<{ id: string; metric: string; target: string }[]>()
    .notNull()
    .default([]),
  /** True once a human has explicitly approved the PRD to move into planning. */
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedByUserId: text("approved_by_user_id").references(() => user.id),
  ...timestamps,
});

export const task = pgTable("task", {
  id: text("id").primaryKey().$defaultFn(() => createId("task")),
  featureRequestId: text("feature_request_id")
    .notNull()
    .references(() => featureRequest.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("backlog"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  /** Kanban column ordering — float-style position so reordering doesn't require a full re-index. */
  position: integer("position").notNull().default(0),
  assigneeUserId: text("assignee_user_id").references(() => user.id),
  ...timestamps,
});

/** The Phase 5 human gate: PRD + tasks + PR + AI review history all visible, human decides. */
export const approval = pgTable("approval", {
  id: text("id").primaryKey().$defaultFn(() => createId("appr")),
  featureRequestId: text("feature_request_id")
    .notNull()
    .references(() => featureRequest.id, { onDelete: "cascade" }),
  decidedByUserId: text("decided_by_user_id")
    .notNull()
    .references(() => user.id),
  decision: approvalDecisionEnum("decision").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Relations --------------------------------------------------------

export const projectRelations = relations(project, ({ many }) => ({
  featureRequests: many(featureRequest),
  // Note: `repositories: many(repository)` is intentionally not declared here.
  // Declaring it would require importing `repository` from github.ts, which
  // already imports `project` from this file — Drizzle's relations() callback
  // pattern tolerates this (lazy table refs), but we keep the relation
  // single-directional from repository->project to avoid a confusing
  // bidirectional declaration split across two files. Query repos-for-project
  // via `db.select().from(repository).where(eq(repository.projectId, id))`.
}));

export const featureRequestRelations = relations(featureRequest, ({ one, many }) => ({
  project: one(project, { fields: [featureRequest.projectId], references: [project.id] }),
  prd: one(prd, { fields: [featureRequest.id], references: [prd.featureRequestId] }),
  tasks: many(task),
  clarifyingExchanges: many(clarifyingExchange),
  approvals: many(approval),
}));

export const prdRelations = relations(prd, ({ one }) => ({
  featureRequest: one(featureRequest, {
    fields: [prd.featureRequestId],
    references: [featureRequest.id],
  }),
}));

export const taskRelations = relations(task, ({ one }) => ({
  featureRequest: one(featureRequest, {
    fields: [task.featureRequestId],
    references: [featureRequest.id],
  }),
}));
