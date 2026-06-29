CREATE TYPE "public"."approval_decision" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."feature_request_status" AS ENUM('draft', 'clarifying', 'prd_generating', 'prd_review', 'tasks_generating', 'tasks_review', 'in_development', 'ai_reviewing', 'fix_needed', 'human_approval', 'shipped', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."finding_category" AS ENUM('requirements', 'acceptance_criteria', 'security', 'performance', 'edge_case', 'code_quality');--> statement-breakpoint
CREATE TYPE "public"."finding_severity" AS ENUM('blocking', 'non_blocking');--> statement-breakpoint
CREATE TYPE "public"."finding_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."pull_request_state" AS ENUM('open', 'closed', 'merged');--> statement-breakpoint
CREATE TYPE "public"."review_run_status" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'todo', 'in_progress', 'in_review', 'done');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"active_workspace_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "github_installation" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"installation_id" integer NOT NULL,
	"account_login" text NOT NULL,
	"account_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "github_installation_workspace_id_unique" UNIQUE("workspace_id"),
	CONSTRAINT "github_installation_installation_id_unique" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE "pull_request" (
	"id" text PRIMARY KEY NOT NULL,
	"repository_id" text NOT NULL,
	"feature_request_id" text,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"author_login" text NOT NULL,
	"head_sha" text NOT NULL,
	"base_branch" text NOT NULL,
	"head_branch" text NOT NULL,
	"state" "pull_request_state" DEFAULT 'open' NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pull_request_repository_id_number_unique" UNIQUE("repository_id","number")
);
--> statement-breakpoint
CREATE TABLE "repository" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"installation_id" text NOT NULL,
	"github_repo_id" integer NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"default_branch" text DEFAULT 'main' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"project_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repository_workspace_id_github_repo_id_unique" UNIQUE("workspace_id","github_repo_id")
);
--> statement-breakpoint
CREATE TABLE "review_finding" (
	"id" text PRIMARY KEY NOT NULL,
	"review_run_id" text NOT NULL,
	"category" "finding_category" NOT NULL,
	"severity" "finding_severity" NOT NULL,
	"status" "finding_status" DEFAULT 'open' NOT NULL,
	"file_path" text,
	"start_line" integer,
	"end_line" integer,
	"message" text NOT NULL,
	"rationale" text NOT NULL,
	"suggestion" text,
	"github_comment_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_run" (
	"id" text PRIMARY KEY NOT NULL,
	"pull_request_id" text NOT NULL,
	"triggered_by_sha" text NOT NULL,
	"status" "review_run_status" DEFAULT 'queued' NOT NULL,
	"summary" text,
	"meta" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_request_id" text NOT NULL,
	"decided_by_user_id" text NOT NULL,
	"decision" "approval_decision" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clarifying_exchange" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_request_id" text NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_request" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"raw_request" text NOT NULL,
	"source_channel" text DEFAULT 'manual' NOT NULL,
	"status" "feature_request_status" DEFAULT 'draft' NOT NULL,
	"duplicate_of_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prd" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_request_id" text NOT NULL,
	"problem_statement" text DEFAULT '' NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"non_goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"user_stories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"acceptance_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"edge_cases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"success_metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prd_feature_request_id_unique" UNIQUE("feature_request_id")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_request_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'backlog' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"assignee_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"razorpay_subscription_id" text,
	"razorpay_customer_id" text,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_workspace_id_unique" UNIQUE("workspace_id"),
	CONSTRAINT "subscription_razorpay_subscription_id_unique" UNIQUE("razorpay_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "usage_record" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"period_key" text NOT NULL,
	"ai_reviews_used" integer DEFAULT 0 NOT NULL,
	"prd_generations_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_workspace_id_workspace_id_fk" FOREIGN KEY ("active_workspace_id") REFERENCES "public"."workspace"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_feature_request_id_feature_request_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_request"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_installation_id_github_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_finding" ADD CONSTRAINT "review_finding_review_run_id_review_run_id_fk" FOREIGN KEY ("review_run_id") REFERENCES "public"."review_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_run" ADD CONSTRAINT "review_run_pull_request_id_pull_request_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_feature_request_id_feature_request_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval" ADD CONSTRAINT "approval_decided_by_user_id_user_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clarifying_exchange" ADD CONSTRAINT "clarifying_exchange_feature_request_id_feature_request_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request" ADD CONSTRAINT "feature_request_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request" ADD CONSTRAINT "feature_request_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request" ADD CONSTRAINT "feature_request_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prd" ADD CONSTRAINT "prd_feature_request_id_feature_request_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prd" ADD CONSTRAINT "prd_approved_by_user_id_user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_feature_request_id_feature_request_id_fk" FOREIGN KEY ("feature_request_id") REFERENCES "public"."feature_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;