import { boolean, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "./id";
import { workspace } from "./auth";
import {
  findingCategoryEnum,
  findingSeverityEnum,
  findingStatusEnum,
  pullRequestStateEnum,
  reviewRunStatusEnum,
  timestamps,
} from "./_shared";
import { featureRequest, project } from "./feature-request";

/** One GitHub App installation per workspace (a workspace connects exactly one GitHub org/account). */
export const githubInstallation = pgTable("github_installation", {
  id: text("id").primaryKey().$defaultFn(() => createId("ghi")),
  workspaceId: text("workspace_id")
    .notNull()
    .unique()
    .references(() => workspace.id, { onDelete: "cascade" }),
  installationId: integer("installation_id").notNull().unique(), // GitHub's numeric installation id
  accountLogin: text("account_login").notNull(), // org or user login the app is installed on
  accountType: text("account_type").notNull(), // "Organization" | "User"
  ...timestamps,
});

export const repository = pgTable(
  "repository",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("repo")),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    installationId: text("installation_id")
      .notNull()
      .references(() => githubInstallation.id, { onDelete: "cascade" }),
    githubRepoId: integer("github_repo_id").notNull(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(), // "owner/name"
    defaultBranch: text("default_branch").notNull().default("main"),
    isPrivate: boolean("is_private").notNull().default(false),
    /** Nullable until a human links this repo to a Project in the UI. */
    projectId: text("project_id").references(() => project.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [unique().on(t.workspaceId, t.githubRepoId)],
);

export const pullRequest = pgTable(
  "pull_request",
  {
    id: text("id").primaryKey().$defaultFn(() => createId("pr")),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repository.id, { onDelete: "cascade" }),
    featureRequestId: text("feature_request_id").references(() => featureRequest.id, {
      onDelete: "set null",
    }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    /** PR description text, used as review-prompt context — see lib/ai/prompts.ts reviewPrompt(). */
    body: text("body"),
    authorLogin: text("author_login").notNull(),
    headSha: text("head_sha").notNull(),
    baseBranch: text("base_branch").notNull(),
    headBranch: text("head_branch").notNull(),
    state: pullRequestStateEnum("state").notNull().default("open"),
    url: text("url").notNull(),
    ...timestamps,
  },
  (t) => [unique().on(t.repositoryId, t.number)],
);

/** One row per AI review execution (a PR can be reviewed multiple times — open, then each new push). */
export const reviewRun = pgTable("review_run", {
  id: text("id").primaryKey().$defaultFn(() => createId("rev")),
  pullRequestId: text("pull_request_id")
    .notNull()
    .references(() => pullRequest.id, { onDelete: "cascade" }),
  triggeredBySha: text("triggered_by_sha").notNull(),
  status: reviewRunStatusEnum("status").notNull().default("queued"),
  /** Free-form summary text posted as the top-level GitHub review comment. */
  summary: text("summary"),
  /** Raw model usage for cost tracking — tokens, model id, latency ms. */
  meta: jsonb("meta").$type<{
    model?: string;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs?: number;
  } | null>(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewFinding = pgTable("review_finding", {
  id: text("id").primaryKey().$defaultFn(() => createId("find")),
  reviewRunId: text("review_run_id")
    .notNull()
    .references(() => reviewRun.id, { onDelete: "cascade" }),
  category: findingCategoryEnum("category").notNull(),
  severity: findingSeverityEnum("severity").notNull(),
  status: findingStatusEnum("status").notNull().default("open"),
  filePath: text("file_path"),
  startLine: integer("start_line"),
  endLine: integer("end_line"),
  message: text("message").notNull(),
  rationale: text("rationale").notNull(),
  suggestion: text("suggestion"),
  /** GitHub review-comment id once posted, so we can update/resolve it later. */
  githubCommentId: integer("github_comment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---- Relations --------------------------------------------------------

export const repositoryRelations = relations(repository, ({ one, many }) => ({
  workspace: one(workspace, { fields: [repository.workspaceId], references: [workspace.id] }),
  installation: one(githubInstallation, {
    fields: [repository.installationId],
    references: [githubInstallation.id],
  }),
  project: one(project, { fields: [repository.projectId], references: [project.id] }),
  pullRequests: many(pullRequest),
}));

export const pullRequestRelations = relations(pullRequest, ({ one, many }) => ({
  repository: one(repository, {
    fields: [pullRequest.repositoryId],
    references: [repository.id],
  }),
  featureRequest: one(featureRequest, {
    fields: [pullRequest.featureRequestId],
    references: [featureRequest.id],
  }),
  reviewRuns: many(reviewRun),
}));

export const reviewRunRelations = relations(reviewRun, ({ one, many }) => ({
  pullRequest: one(pullRequest, {
    fields: [reviewRun.pullRequestId],
    references: [pullRequest.id],
  }),
  findings: many(reviewFinding),
}));

export const reviewFindingRelations = relations(reviewFinding, ({ one }) => ({
  reviewRun: one(reviewRun, {
    fields: [reviewFinding.reviewRunId],
    references: [reviewRun.id],
  }),
}));
