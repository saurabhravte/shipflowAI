<div align="center">

<img src="apps/web/public/logo.png" alt="ShipFlow AI" width="88" />

# ShipFlow AI

### Review instantly.

**AI-assisted product delivery from feature request to reviewed, approved pull request.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![tRPC](https://img.shields.io/badge/tRPC-11-398CCB?style=flat-square&logo=trpc&logoColor=white)](https://trpc.io/)
[![Inngest](https://img.shields.io/badge/Inngest-durable_workflows-000000?style=flat-square)](https://www.inngest.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-PostgreSQL-C5F74F?style=flat-square&logo=postgresql&logoColor=black)](https://orm.drizzle.team/)

**[🚀 Live app](https://shipflow-ai.vercel.app/)** · **[📘 Docs](https://shipflow-ai.vercel.app/docs)** · **[🐛 Report an issue](https://github.com/saurabhravte/shipflowAI/issues)**

**[Pitch Video](https://www.youtube.com/shorts/IUWM6Zz005c)** · **[Demo Video](https://youtu.be/R--jPbLlYxU)**

</div>

---

## Table of contents

- [Overview](#overview)
- [The core loop](#the-core-loop)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Monorepo structure](#monorepo-structure)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [GitHub integration](#github-integration)
- [Inngest workflows](#inngest-workflows)
- [AI capabilities](#ai-capabilities)
- [SaaS & billing](#saas--billing)
- [Scripts](#scripts)
- [Author](#author)

---

## Overview

Great software is not shipped by code generation alone. Every successful feature follows a process:

**Request → Product thinking → PRD → Tasks → Implementation → Review → Fixes → Approval → Release**

**ShipFlow AI** is a full-stack SaaS platform that manages that entire lifecycle. Product and engineering teams use it to:

1. **Intake** a feature request (email, ticket, call transcript, or free text)
2. **Clarify** missing requirements with an AI agent
3. **Generate** a structured PRD and engineering task breakdown
4. **Connect** work to a GitHub repository via a GitHub App
5. **Track** implementation through pull requests
6. **Run** AI-powered code reviews against PRD requirements, acceptance criteria, and repo context
7. **Loop** fixes and re-reviews until the feature is ready
8. **Approve** release through human gates — only then mark the feature as **shipped**

Humans remain the final decision makers. The AI acts as a QA and engineering reviewer, not a syntax checker.

---

## The core loop

```
Feature Request
      │
      ▼
  Clarification (AI follow-up questions)
      │
      ▼
  PRD generation ──► Human PRD approval
      │
      ▼
  Task breakdown ──► Human plan approval
      │
      ▼
  Development (GitHub PR)
      │
      ▼
  AI review ◄──────┐
      │            │
      ▼            │ fix & re-review
  fix_needed ──────┘
      │
      ▼
  Human approval
      │
      ▼
   Shipped
```

**Status machine** (single source of truth on `feature_request.status`):

`draft` → `clarifying` → `prd_generating` → `prd_review` → `tasks_generating` → `tasks_review` → `in_development` → `ai_reviewing` ↔ `fix_needed` → `human_approval` → `shipped` | `rejected`

All transitions are enforced centrally in `apps/web/src/server/workflows/state-machine.ts`.

---

## Features

| Area                  | What ShipFlow does                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Product discovery** | AI clarifying questions; duplicate-feature education when applicable                                                    |
| **PRD editor**        | Structured PRD with problem statement, goals, non-goals, user stories, acceptance criteria, edge cases, success metrics |
| **Task board**        | Kanban columns generated from the PRD; human approves the plan before dev                                               |
| **GitHub App**        | Install app, list repos, receive webhooks, fetch diffs, post review comments                                            |
| **AI code review**    | Reviews PRs against PRD + tasks + diff + repo-aware context (Pinecone retrieval)                                        |
| **Review loop**       | Blocking / non-blocking findings; re-review on new pushes until clean                                                   |
| **Human gates**       | PRD approval, task-plan approval, final release approval                                                                |
| **Multi-tenant SaaS** | Workspaces, members, per-workspace projects and billing                                                                 |
| **Billing**           | Free / Pro / Enterprise plans with usage limits (Razorpay)                                                              |
| **Auth**              | Better Auth — email/password, Google, GitHub OAuth                                                                      |

---

## Tech stack

| Layer               | Technology                                                    |
| ------------------- | ------------------------------------------------------------- |
| **Monorepo**        | pnpm workspaces + Turborepo                                   |
| **Web app**         | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| **API**             | tRPC v11 + TanStack Query + SuperJSON                         |
| **Database**        | PostgreSQL + Drizzle ORM (`@shipflow/db`)                     |
| **Auth**            | Better Auth                                                   |
| **Background jobs** | Inngest (durable step functions)                              |
| **GitHub**          | Octokit GitHub App + webhooks                                 |
| **AI**              | Vercel AI SDK + OpenRouter (tiered fast / review models)      |
| **Vector search**   | Pinecone (repo-aware review context)                          |
| **Payments**        | Razorpay subscriptions                                        |
| **Deploy**          | Vercel                                                        |

**Typography:** Manrope (display / headings) · Geist (body / UI) · Geist Mono (code, IDs, diffs)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser — Next.js App Router (apps/web)                        │
│  Landing · Auth · Dashboard · PRD editor · Task board · Reviews │
└────────────────────────────┬────────────────────────────────────┘
                             │ tRPC (type-safe) + Better Auth cookies
┌────────────────────────────▼────────────────────────────────────┐
│  Next.js Route Handlers                                         │
│  /api/trpc/[trpc]   /api/auth/*   /api/inngest   /api/webhooks/* │
└──────┬──────────────────────────────┬─────────────────────────────┘
       │                              │
┌──────▼──────┐              ┌───────▼────────────────────────────┐
│  tRPC       │              │  Inngest worker (serverless)        │
│  routers    │──events─────►│  clarify · generate-prd ·           │
│  (9 domains)│              │  generate-tasks · review-pull-request│
└──────┬──────┘              └───────┬────────────────────────────┘
       │                              │
       │         ┌────────────────────┼────────────────────┐
       │         │                    │                    │
       ▼         ▼                    ▼                    ▼
  PostgreSQL  GitHub App API    OpenRouter (AI SDK)    Pinecone
  (Drizzle)   (Octokit)                              (embeddings)
```

**Design principles**

1. **Event-driven workflows** — long-running AI and GitHub work runs in Inngest; the UI stays responsive.
2. **Step-level retries** — each Inngest `step.run()` retries independently; a flaky model call does not restart the whole pipeline.
3. **Centralized state machine** — every status change goes through `transitionFeatureRequest()`.
4. **Workspace tenancy** — `workspaceProcedure` enforces multi-tenant isolation on all tRPC mutations.
5. **Real GitHub data** — pull request reviews use live webhooks and Octokit; no hardcoded PR data.

---

## Monorepo structure

```
shipflowAI/
├── apps/
│   └── web/                          # Next.js application
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── (auth)/           # Sign-in, sign-up
│       │   │   ├── (app)/dashboard/  # Protected product UI
│       │   │   ├── docs/             # In-app documentation
│       │   │   └── api/
│       │   │       ├── trpc/         # tRPC handler
│       │   │       ├── inngest/      # Inngest serve endpoint
│       │   │       ├── webhooks/
│       │   │       │   ├── github/   # GitHub App webhooks
│       │   │       │   └── razorpay/ # Billing webhooks
│       │   │       └── github/install/
│       │   ├── components/           # UI + marketing components
│       │   ├── lib/                  # AI, GitHub, billing, vector helpers
│       │   └── server/
│       │       ├── routers/          # tRPC domain routers (9)
│       │       ├── inngest/functions/
│       │       ├── workflows/        # Feature-request state machine
│       │       └── auth/
│       └── public/
├── packages/
│   ├── db/                           # Drizzle schema, migrations, client
│   └── typescript-config/            # Shared tsconfig bases
├── .env.example                      # Environment variable template
├── pnpm-workspace.yaml
└── turbo.json
```

### tRPC routers

| Router           | Responsibility                               |
| ---------------- | -------------------------------------------- |
| `workspace`      | Workspace CRUD, member management            |
| `project`        | Projects within a workspace                  |
| `featureRequest` | Intake, clarification, status                |
| `prd`            | PRD read/update and approval                 |
| `task`           | Kanban tasks and plan approval               |
| `github`         | App install, repo list, link repo to project |
| `pullRequest`    | PR listing and detail                        |
| `review`         | AI review runs and findings                  |
| `approval`       | Human approval gates                         |
| `billing`        | Plans, usage, Razorpay subscription          |

---

## Setup

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`npm install -g pnpm`)
- **PostgreSQL** (local, [Neon](https://neon.tech), or [Supabase](https://supabase.com))
- **Inngest** account (or local dev server)
- **GitHub OAuth App** (login) + **GitHub App** (repo access & webhooks)
- **OpenRouter** API key (AI inference)
- **Pinecone** index (1536 dimensions — for repo-aware review context)
- **Razorpay** keys (optional — billing)

### 1. Clone and install

```bash
git clone https://github.com/saurabhravte/shipflowAI.git
cd shipflowAI
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in every required value — see [Environment variables](#environment-variables) below.

### 3. Database

```bash
pnpm db:migrate
```

Optional — open Drizzle Studio:

```bash
pnpm db:studio
```

### 4. Run locally

**Terminal 1 — Next.js**

```bash
pnpm dev
```

App runs at [http://localhost:3000](http://localhost:3000).

**Terminal 2 — Inngest dev server**

```bash
pnpm inngest:dev
```

Dashboard at [http://localhost:8288](http://localhost:8288).

### 5. Expose webhooks locally (optional)

```bash
ngrok http 3000
```

Use the HTTPS URL as:

- `NEXT_PUBLIC_APP_URL` (for OAuth callbacks)
- GitHub App **Webhook URL**: `https://<tunnel>/api/webhooks/github`

---

## Environment variables

Copy `.env.example` to `.env` at the **repository root**.

| Variable                                                | Required | Description                                                                  |
| ------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                   | ✅       | Public app origin, no trailing slash (e.g. `https://shipflow-ai.vercel.app`) |
| `DATABASE_URL`                                          | ✅       | PostgreSQL connection string                                                 |
| `BETTER_AUTH_SECRET`                                    | ✅       | Session signing secret (`openssl rand -hex 32`)                              |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`             | ➖       | Google OAuth (optional social login)                                         |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | ➖       | GitHub OAuth for **login only** (separate from GitHub App)                   |
| `GITHUB_APP_ID`                                         | ✅       | GitHub App ID                                                                |
| `GITHUB_APP_PRIVATE_KEY`                                | ✅       | GitHub App PEM private key                                                   |
| `GITHUB_APP_WEBHOOK_SECRET`                             | ✅       | Webhook signature secret                                                     |
| `GITHUB_APP_SLUG`                                       | ✅       | App slug (install URL)                                                       |
| `OPENROUTER_API_KEY`                                    | ✅       | AI inference via OpenRouter                                                  |
| `PINECONE_API_KEY`                                      | ✅       | Vector store for repo-aware reviews                                          |
| `PINECONE_INDEX`                                        | ✅       | Pinecone index name (1536-dim embeddings)                                    |
| `INNGEST_EVENT_KEY`                                     | ✅       | Inngest event key                                                            |
| `INNGEST_SIGNING_KEY`                                   | ✅       | Inngest signing key                                                          |
| `INNGEST_DEV`                                           | ➖       | Set `1` when using local Inngest dev server                                  |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`               | ➖       | Razorpay API keys                                                            |
| `RAZORPAY_WEBHOOK_SECRET`                               | ➖       | Razorpay webhook verification                                                |
| `RAZORPAY_PRO_PLAN_ID` / `RAZORPAY_ENTERPRISE_PLAN_ID`  | ➖       | Subscription plan IDs from Razorpay dashboard                                |

**OAuth callback URLs** (replace with your `NEXT_PUBLIC_APP_URL`):

- Google: `<APP_URL>/api/auth/callback/google`
- GitHub login: `<APP_URL>/api/auth/callback/github`

Email/password sign-in works without OAuth credentials.

---

## Database schema

Schema lives in `packages/db/src/schema/`. Migrations in `packages/db/drizzle/`.

### Domain tables

| Table                                        | Purpose                                              |
| -------------------------------------------- | ---------------------------------------------------- |
| `user`, `session`, `account`, `verification` | Better Auth                                          |
| `workspace`, `member`                        | Multi-tenant organizations                           |
| `project`                                    | Projects inside a workspace                          |
| `feature_request`                            | Root of the core loop; authoritative `status` column |
| `clarifying_exchange`                        | AI Q&A during clarification phase                    |
| `prd`                                        | Structured product requirements document             |
| `task`                                       | Engineering tasks (Kanban)                           |
| `approval`                                   | Human approval records (PRD, plan, release)          |
| `github_installation`                        | GitHub App install per workspace                     |
| `repository`                                 | Connected repos; optional `project_id` link          |
| `pull_request`                               | Tracked PRs from webhooks                            |
| `review_run`                                 | One row per AI review execution                      |
| `review_finding`                             | Individual findings (severity, category, file/line)  |
| `subscription`, `usage_record`               | Billing plan and monthly usage counters              |

### Feature request statuses

```
draft | clarifying | prd_generating | prd_review | tasks_generating |
tasks_review | in_development | ai_reviewing | fix_needed |
human_approval | shipped | rejected
```

### Schema commands

```bash
# After editing packages/db/src/schema/*
pnpm db:generate   # create migration
pnpm db:migrate    # apply migrations
pnpm db:studio     # visual browser
```

---

## GitHub integration

ShipFlow uses a **GitHub App** (not a PAT) for repository access, webhooks, diff fetching, and posting review comments. Login uses a **separate GitHub OAuth App** so signing in does not require repo permissions.

### Step 1 — GitHub OAuth App (login)

1. [GitHub → Developer settings → OAuth Apps → New](https://github.com/settings/developers)
2. **Authorization callback URL:** `<NEXT_PUBLIC_APP_URL>/api/auth/callback/github`
3. Copy Client ID and Secret → `GITHUB_OAUTH_CLIENT_*` in `.env`

### Step 2 — GitHub App (repos & webhooks)

1. [Create a new GitHub App](https://github.com/settings/apps/new)
2. **Webhook URL:** `<NEXT_PUBLIC_APP_URL>/api/webhooks/github`
3. **Webhook secret:** set `GITHUB_APP_WEBHOOK_SECRET`
4. **Permissions:** Contents (read), Pull requests (read & write), Metadata (read)
5. **Subscribe to events:** Pull request, Installation
6. Generate a private key → `GITHUB_APP_PRIVATE_KEY`
7. Note App ID and slug → `GITHUB_APP_ID`, `GITHUB_APP_SLUG`

### Step 3 — Install in the dashboard

1. Sign in to ShipFlow → **Settings → GitHub**
2. Click **Install GitHub App** and authorize your org/account
3. Link a repository to a project (via `github.linkRepository` API / settings UI)

### Step 4 — Link PRs to feature requests

Include this tag in the PR **title or body**:

```
ShipFlow: fr_xxxxxxxx
```

Replace `fr_xxxxxxxx` with the feature request ID shown in the dashboard. Webhooks parse this convention to attach the PR to the correct request and trigger AI review.

---

## Inngest workflows

Handler: `apps/web/src/app/api/inngest/route.ts`

| Function                  | Trigger event                          | Steps (summary)                                                                                                                                                   |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clarify-feature-request` | `feature_request/clarify`              | Load request → AI questions → save exchanges → transition status                                                                                                  |
| `generate-prd`            | `feature_request/generate_prd`         | Load context → `generateObject` (Zod schema) → save PRD → `prd_review`                                                                                            |
| `generate-tasks`          | `feature_request/generate_tasks`       | Load PRD → generate tasks → save to board → `tasks_review`                                                                                                        |
| `review-pull-request`     | `github/pull_request.review_requested` | Check usage limit → fetch diff & files → Pinecone retrieval → AI review → post GitHub comments → update findings → transition to `fix_needed` or `human_approval` |

Each workflow uses **durable steps** — if the LLM call fails, only that step retries.

### Local Inngest

```bash
pnpm dev          # Terminal 1
pnpm inngest:dev  # Terminal 2 — dashboard at http://localhost:8288
```

Use the dashboard to inspect step input/output, replay events, and debug failures.

### GitHub → Inngest flow

```
GitHub webhook (PR opened / synchronize / reopened)
        │
        ▼
Webhook handler upserts pull_request row
        │
        ▼
inngest.send("github/pull_request.review_requested")
        │
        ▼
review-pull-request function runs (async)
```

---

## AI capabilities

Powered by the **Vercel AI SDK** with **structured outputs** (Zod schemas in `apps/web/src/lib/ai/schemas.ts`).

| Capability                | Model tier        | Output                                                                                      |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| Requirement clarification | Fast              | Follow-up questions, duplicate detection notes                                              |
| PRD generation            | Fast              | Problem statement, goals, non-goals, user stories, acceptance criteria, edge cases, metrics |
| Task generation           | Fast              | Kanban-ready engineering tasks with priorities                                              |
| Code review               | Review (stronger) | Findings with severity, category, file/line, rationale, suggestions                         |
| Repo context              | Embeddings        | Pinecone retrieval over indexed file chunks                                                 |

**Model routing** (`apps/web/src/lib/ai/models.ts`):

- **Fast** — PRD, tasks, clarification (`google/gemini-2.5-flash` via OpenRouter)
- **Review** — code review (`anthropic/claude-sonnet-4.5` via OpenRouter)
- **Bring your own key** — workspaces can store an encrypted OpenRouter key (Settings → API keys) that overrides the platform default; see [docs/bring-your-own-key](https://shipflow-ai.vercel.app/docs/bring-your-own-key)

Verify model slugs against the [OpenRouter catalog](https://openrouter.ai/models) before deploying.

The review agent evaluates:

- PRD requirements and acceptance criteria
- Engineering tasks
- Security and performance concerns
- Edge cases and code quality
- Whether the implementation is production-ready

Findings are categorized as **blocking** or **non-blocking** and posted as GitHub review comments.

---

## SaaS & billing

- **Multi-tenant workspaces** — each workspace has its own users, projects, repos, feature requests, and billing
- **Plans** — Free, Pro (₹599/mo), Enterprise (₹1,599/mo) with usage limits on AI reviews and PRD generations
- **Razorpay** — subscription creation and webhook handling (`/api/webhooks/razorpay`)
- **Usage metering** — checked before AI review and PRD generation (`usage_record` monthly buckets)

---

## Scripts

| Command            | Description                  |
| ------------------ | ---------------------------- |
| `pnpm dev`         | Start all apps in dev mode   |
| `pnpm build`       | Production build (Turborepo) |
| `pnpm lint`        | ESLint across packages       |
| `pnpm check-types` | TypeScript check             |
| `pnpm db:generate` | Generate Drizzle migration   |
| `pnpm db:migrate`  | Apply migrations             |
| `pnpm db:studio`   | Open Drizzle Studio          |
| `pnpm inngest:dev` | Local Inngest dev server     |

---

## Author

**Saurabh Ravte** — [GitHub](https://github.com/saurabhravte) · [LinkedIn](https://www.linkedin.com/in/saurabh-ravte/) · [X](https://x.com/iamsaurabhr)

Built as a hackathon submission demonstrating AI-assisted software delivery with real GitHub integration, durable workflows, and human-in-the-loop approval.

---

<div align="center">

⭐ **If ShipFlow AI helps your team ship faster, [star the repo](https://github.com/saurabhravte/shipflowAI) on GitHub.**

</div>
