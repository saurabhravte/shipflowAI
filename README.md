<div align="center">

<img src="https://img.shields.io/badge/ShipFlow-AI-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsOSA1IDktNXYtNWwtOSA1LTktNXoiLz48L3N2Zz4=" alt="ShipflowAI" />

# ShipflowAI

### AI-Powered Developer Shipping Intelligence Platform

> Automatically analyze GitHub repositories, generate changelogs, summarize pull requests, and surface shipping insights — powered by AI with durable background workflows.

[![TypeScript](https://img.shields.io/badge/TypeScript-97%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![Inngest](https://img.shields.io/badge/Inngest-workflows-5865F2?style=flat-square)](https://www.inngest.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](./LICENSE)

---

**[🌐 Live Demo](https://shipflow-ai.vercel.app/)** · **[📹 Demo Video](#-demo)** · **[🎥 YC Pitch](#-yc-video)** · **[🐛 Report Bug](https://github.com/saurabhravte/shipflowAI/issues)**

</div>

---

## Demo

> **Watch the full product walkthrough:**

[![ShipflowAI Demo Video](https://img.shields.io/badge/▶%20Watch%20Demo-YouTube-FF0000?style=for-the-badge&logo=youtube)](https://youtube.com/watch?v=YOUR_DEMO_VIDEO_ID)

> ⚠️ **Replace** `YOUR_DEMO_VIDEO_ID` with your actual YouTube video ID.

---

## YC Video

> **Y Combinator pitch / presentation:**

[![YC Video](https://img.shields.io/badge/▶%20YC%20Video-YouTube-FF0000?style=for-the-badge&logo=youtube)](https://youtube.com/watch?v=YOUR_YC_VIDEO_ID)

> ⚠️ **Replace** `YOUR_YC_VIDEO_ID` with your actual YC YouTube link.

---

## Landing Page

> **[🌐 Visit shipflowai.vercel.app →](https://shipflow-ai.vercel.app/)**

The landing page highlights the core value proposition: connect your GitHub, let AI do the shipping intelligence — changelogs, PR summaries, release notes, and more — all automated in the background.

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Monorepo Structure](#-monorepo-structure)
- [Setup Instructions](#-setup-instructions)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [GitHub Integration Setup](#-github-integration-setup)
- [Inngest Workflow Explanation](#-inngest-workflow-explanation)
- [AI Features Implemented](#-ai-features-implemented)
- [Contributing](#-contributing)

---

## Overview

**ShipflowAI** is a developer productivity platform that connects to your GitHub repositories and uses AI to automate the most tedious parts of shipping software:

- **Auto-generated changelogs** from commit history and merged PRs
- **AI-summarized pull requests** with impact analysis
- **Release intelligence** that understands what shipped and why it matters
- **Background processing** via Inngest so nothing blocks your UI

Built as a hackathon project, ShipflowAI demonstrates how AI + event-driven workflows can transform the way engineering teams communicate about their work.

---

## Features

| Feature                 | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| GitHub OAuth            | Connect any public or private repository with one click               |
| AI Changelog Generator  | Automatically generate human-readable changelogs from commits and PRs |
| PR Summarizer           | Summarize pull requests using LLMs with code-aware context            |
| Release Notes           | Draft release notes ready for GitHub Releases or Notion               |
| Durable Background Jobs | Inngest-powered workflows that survive restarts and handle failures   |
| Persistent Storage      | All summaries and changelogs saved to Postgres via Drizzle ORM        |
| Authentication          | Secure auth with Clerk — supports GitHub, Google, email               |
| Modern UI               | Clean, responsive interface built with Tailwind CSS + shadcn/ui       |

---

## Tech Stack

### Frontend

| Technology                                    | Purpose                              |
| --------------------------------------------- | ------------------------------------ |
| [Next.js 16](https://nextjs.org/)             | React framework with App Router      |
| [Tailwind CSS](https://tailwindcss.com/)      | Utility-first styling                |
| [shadcn/ui](https://ui.shadcn.com/)           | Accessible, composable UI components |
| [TypeScript](https://www.typescriptlang.org/) | Full type safety across the stack    |

### Backend

| Technology                                                                                         | Purpose                                         |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) | API layer via App Router Route Handlers         |
| [Drizzle ORM](https://orm.drizzle.team/)                                                           | Type-safe SQL ORM                               |
| [PostgreSQL](https://www.postgresql.org/)                                                          | Primary relational database (via Neon/Supabase) |
| [Inngest](https://www.inngest.com/)                                                                | Durable background workflow orchestration       |

### Auth & Integrations

| Technology                                          | Purpose                                               |
| --------------------------------------------------- | ----------------------------------------------------- |
| [Clerk](https://clerk.com/)                         | Authentication — GitHub OAuth, Google, email/password |
| [GitHub REST API](https://docs.github.com/en/rest)  | Repository data, commits, PRs, releases               |
| [OpenAI / Claude API](https://platform.openai.com/) | LLM inference for summaries and changelogs            |

### Infrastructure & Tooling

| Technology                                            | Purpose                                   |
| ----------------------------------------------------- | ----------------------------------------- |
| [Turborepo](https://turbo.build/repo)                 | Monorepo build system with remote caching |
| [pnpm](https://pnpm.io/)                              | Fast, disk-efficient package manager      |
| [Vercel](https://vercel.com/)                         | Deployment and edge runtime               |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline                            |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        User Browser                      │
│              (Next.js App Router UI — /apps/web)         │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP / Server Actions
┌──────────────────────▼──────────────────────────────────┐
│              Next.js API Layer (Route Handlers)          │
│   /api/github/webhook   /api/inngest   /api/repos/...   │
└───────────┬───────────────────────┬─────────────────────┘
            │                       │
     ┌──────▼──────┐         ┌──────▼──────────────────┐
     │  Clerk Auth  │         │   Inngest SDK (trigger) │
     │  (JWT/Session)│        │   sends events →        │
     └─────────────┘         └──────────┬──────────────┘
                                         │
┌────────────────────────────────────────▼────────────────┐
│                   Inngest Worker (serverless)            │
│                                                          │
│  ┌─────────────────┐   ┌──────────────────────────────┐ │
│  │  repo.analyze   │   │  pr.summarize                │ │
│  │  (multi-step)   │   │  (multi-step)                │ │
│  └────────┬────────┘   └──────────────┬───────────────┘ │
│           │                           │                  │
│  step.run("fetch-commits") ──► GitHub REST API           │
│  step.run("generate-ai")   ──► OpenAI / Claude API       │
│  step.run("save-result")   ──► Drizzle ORM ──► Postgres  │
└─────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────┐
         │         PostgreSQL (Neon)        │
         │  users / repos / analyses /      │
         │  changelogs / pr_summaries       │
         └─────────────────────────────────┘
```

**Key Design Decisions:**

1. **Event-driven, not request-driven** — triggering an analysis sends an Inngest event. The UI responds immediately; work happens in the background.
2. **Step functions for AI** — each Inngest step is retried independently, so a flaky LLM call doesn't restart the whole pipeline.
3. **GitHub webhook + manual trigger** — analyses run on push/PR events automatically, or on demand from the dashboard.
4. **Monorepo with shared packages** — `@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config` are shared across apps.

---

## Monorepo Structure (tRPC)

```
shipflowAI/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/
│       │   ├── (dashboard)/    # Protected dashboard routes
│       │   ├── api/
│       │   │   ├── inngest/    # Inngest serve endpoint
│       │   │   ├── github/
│       │   │   │   └── webhook/  # GitHub webhook handler
│       │   │   └── repos/      # Repository API routes
│       │   └── layout.tsx
│       ├── components/         # React components
│       ├── lib/
│       │   ├── db/
│       │   │   ├── schema.ts   # Drizzle schema definitions
│       │   │   └── index.ts    # DB client
│       │   ├── inngest/
│       │   │   ├── client.ts   # Inngest client setup
│       │   │   └── functions/  # Background workflow functions
│       │   │       ├── analyze-repo.ts
│       │   │       └── summarize-pr.ts
│       │   ├── github.ts       # GitHub API helpers
│       │   └── ai.ts           # AI inference helpers
│       └── middleware.ts       # Clerk auth middleware
│
├── packages/
│   ├── ui/                     # Shared React component library
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared tsconfig bases
│
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json
```

---

## Setup Instructions

### Prerequisites

- **Node.js** 20.x or later
- **pnpm** 9.x or later (`npm install -g pnpm`)
- **PostgreSQL** database (local, [Neon](https://neon.tech), or [Supabase](https://supabase.com))
- **Inngest** account (optional for local dev — they have a local dev server)
- **GitHub OAuth App** — for repository access

### 1. Clone the repository

```bash
git clone https://github.com/saurabhravte/shipflowAI.git
cd shipflowAI
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in all required values (see [Environment Variables](#-environment-variables) below).

### 4. Set up the database

```bash
# Generate migration files
pnpm --filter web db:generate

# Apply migrations to your database
pnpm --filter web db:migrate
```

### 5. Start the development server

```bash
# Start all apps in parallel (recommended)
pnpm dev

# Or start only the web app
pnpm --filter web dev
```

### 6. Start the Inngest Dev Server (local background jobs)

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

This starts the local Inngest dashboard at `http://localhost:8288` where you can inspect and replay events.

### 7. Expose your local server to GitHub webhooks (optional)

```bash
# Using ngrok or cloudflared
ngrok http 3000
```

Copy the HTTPS URL and add it as a GitHub webhook (see [GitHub Integration Setup](#-github-integration-setup)).

---

## Environment Variables

Create `apps/web/.env.local` with the following:

```env
# ─── Database ────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:5432/shipflowai"

# ─── Clerk Authentication ────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# ─── Inngest ─────────────────────────────────────────────────────────────────
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"

# ─── GitHub OAuth App ────────────────────────────────────────────────────────
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"

# ─── AI Provider ─────────────────────────────────────────────────────────────
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# ─── App ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

| Variable                            | Required | Description                            |
| ----------------------------------- | -------- | -------------------------------------- |
| `DATABASE_URL`                      | ✅       | PostgreSQL connection string           |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅       | Clerk public key                       |
| `CLERK_SECRET_KEY`                  | ✅       | Clerk server-side secret               |
| `INNGEST_EVENT_KEY`                 | ✅       | Inngest API event key                  |
| `INNGEST_SIGNING_KEY`               | ✅       | Inngest webhook signing key            |
| `GITHUB_CLIENT_ID`                  | ✅       | GitHub OAuth App client ID             |
| `GITHUB_CLIENT_SECRET`              | ✅       | GitHub OAuth App secret                |
| `GITHUB_WEBHOOK_SECRET`             | ✅       | Secret to verify webhook payloads      |
| `OPENAI_API_KEY`                    | ✅       | OpenAI API key for LLM inference       |
| `ANTHROPIC_API_KEY`                 | ➖       | Alternative — Anthropic Claude API key |

---

## Database Schema

Managed with **Drizzle ORM**. Schema lives in `apps/web/lib/db/schema.ts`.

### Tables

#### `users`

Mirrors Clerk user data, synced via webhooks.

```sql
users (
  id          TEXT PRIMARY KEY,        -- Clerk user ID
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

#### `repositories`

GitHub repositories connected by users.

```sql
repositories (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT REFERENCES users(id),
  github_id     INTEGER NOT NULL,
  full_name     TEXT NOT NULL,           -- e.g. "owner/repo"
  name          TEXT NOT NULL,
  private       BOOLEAN DEFAULT FALSE,
  install_token TEXT,                    -- GitHub installation access token
  webhook_id    INTEGER,
  created_at    TIMESTAMP DEFAULT NOW()
)
```

#### `analyses`

Records of AI analysis runs.

```sql
analyses (
  id            SERIAL PRIMARY KEY,
  repo_id       INTEGER REFERENCES repositories(id),
  status        TEXT DEFAULT 'pending', -- pending | running | done | failed
  trigger       TEXT,                   -- 'push' | 'manual' | 'pr'
  inngest_run_id TEXT,
  started_at    TIMESTAMP,
  completed_at  TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
)
```

#### `changelogs`

AI-generated changelog entries.

```sql
changelogs (
  id          SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analyses(id),
  repo_id     INTEGER REFERENCES repositories(id),
  version     TEXT,                      -- e.g. "v1.2.0" or date-based
  content     TEXT NOT NULL,             -- Markdown changelog text
  from_sha    TEXT,
  to_sha      TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

#### `pr_summaries`

AI-summarized pull requests.

```sql
pr_summaries (
  id          SERIAL PRIMARY KEY,
  repo_id     INTEGER REFERENCES repositories(id),
  pr_number   INTEGER NOT NULL,
  pr_title    TEXT NOT NULL,
  summary     TEXT NOT NULL,             -- AI-generated summary
  impact      TEXT,                      -- "low" | "medium" | "high"
  labels      TEXT[],
  author      TEXT,
  merged_at   TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW()
)
```

### Migrations

```bash
# Generate a new migration after schema changes
pnpm --filter web db:generate

# Apply pending migrations
pnpm --filter web db:migrate

# View schema in Drizzle Studio
pnpm --filter web db:studio
```

---

## GitHub Integration Setup

### Step 1: Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set:
   - **Application name:** `ShipflowAI (local)` or `ShipflowAI`
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
3. Copy the **Client ID** and **Client Secret** → add to `.env.local`

### Step 2: Configure Clerk to use GitHub OAuth

1. In your [Clerk Dashboard](https://dashboard.clerk.com), go to **Social Connections**
2. Enable **GitHub** and paste the OAuth App credentials
3. Request scopes: `repo`, `read:user`, `user:email`

### Step 3: Set up a GitHub Webhook (for automatic analysis)

For each repository you want to monitor:

1. Go to **Repository → Settings → Webhooks → Add webhook**
2. Set:
   - **Payload URL:** `https://your-domain.com/api/github/webhook`
   - **Content type:** `application/json`
   - **Secret:** Your `GITHUB_WEBHOOK_SECRET` value
   - **Events:** Select `Push`, `Pull requests`
3. Click **Add webhook**

The webhook handler at `/api/github/webhook` will:

- Verify the `X-Hub-Signature-256` HMAC signature
- Parse the event type (`push` or `pull_request`)
- Send an Inngest event to trigger the appropriate workflow

### Step 4: Personal Access Token (for manual analysis)

Users can also connect repos using a GitHub Personal Access Token:

1. **GitHub → Settings → Developer settings → Personal access tokens → Tokens (fine-grained)**
2. Grant **Contents (read)** and **Pull requests (read)** permissions
3. Paste the token in the ShipflowAI dashboard → **Connect Repository**

---

## Inngest Workflow Explanation

[Inngest](https://www.inngest.com/) provides **durable execution** — workflows that survive server restarts, handle retries automatically, and give you step-level observability.

### How it's wired up

The Inngest serve handler is mounted at `/api/inngest`:

```typescript
// apps/web/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { analyzeRepo, summarizePR } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeRepo, summarizePR],
});
```

### Workflow 1: `repo/analyze` — Repository Changelog Generation

**Trigger:** `repo.analyze.requested` event (fired on push webhook or manual trigger)

```
Event received
    │
    ▼
step: "fetch-commits"
    │  GitHub API: list commits since last analysis
    ▼
step: "fetch-merged-prs"
    │  GitHub API: list PRs merged in this window
    ▼
step: "generate-changelog"
    │  LLM: given commits + PR titles + diffs → Markdown changelog
    ▼
step: "save-to-db"
    │  Drizzle: INSERT into changelogs table
    ▼
step: "update-analysis-status"
       Drizzle: mark analysis as "done"
```

Each `step.run()` is **individually retried** on failure. If the LLM call times out, only that step retries — not the whole workflow.

### Workflow 2: `pr/summarize` — Pull Request Summarizer

**Trigger:** `pr.opened` or `pr.merged` GitHub webhook event

```
Event received (PR number + repo)
    │
    ▼
step: "fetch-pr-details"
    │  GitHub API: get PR body, commits, file changes
    ▼
step: "generate-summary"
    │  LLM: summarize what changed, why it matters, blast radius
    ▼
step: "classify-impact"
    │  LLM: classify as low / medium / high impact
    ▼
step: "save-summary"
       Drizzle: INSERT into pr_summaries table
```

### Inngest Event Schema

```typescript
// Events sent to Inngest
type ShipflowEvents = {
  "repo.analyze.requested": {
    data: {
      repoId: number;
      userId: string;
      fromSha?: string;
      toSha?: string;
    };
  };
  "pr.opened": {
    data: {
      repoId: number;
      prNumber: number;
      action: "opened" | "closed";
      merged: boolean;
    };
  };
};
```

### Local Development with Inngest

```bash
# 1. Start Next.js
pnpm dev

# 2. Start Inngest Dev Server
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest

# 3. Open Inngest dashboard
open http://localhost:8288
```

In the dashboard you can: replay events, inspect each step's input/output, trigger test events, and view logs.

---

## AI Features Implemented

### 1. Changelog Generation

Given a list of commits and merged PRs, the LLM generates a structured, human-readable changelog grouped by type (Features, Bug Fixes, Performance, Breaking Changes).

**Prompt approach:** Few-shot prompting with examples of good changelogs. Commits are filtered for noise (Merge commits, chore: prefix) before being sent to the LLM.

### 2. Pull Request Summarization

Each PR is summarized with:

- **What changed** — plain-English description of the diff
- **Why it matters** — inferred business or technical impact
- **Files affected** — key files touched
- **Risk assessment** — potential blast radius

**Prompt approach:** Chain-of-thought prompting. The model reasons step-by-step about the changes before writing the final summary.

### 3. Impact Classification

PRs are classified as **Low / Medium / High** impact based on:

- Number and type of files changed
- Presence of database migrations
- Changes to public API surfaces
- Test coverage signals

### 4. Release Notes Drafting

Combines all changelogs and PR summaries for a given version window into a polished release note suitable for GitHub Releases, Slack announcements, or customer-facing communications.

### AI Model Configuration

```typescript
// apps/web/lib/ai.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateChangelog(commits: Commit[], prs: PR[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: CHANGELOG_SYSTEM_PROMPT },
      { role: "user", content: buildChangelogPrompt(commits, prs) },
    ],
    temperature: 0.3, // Lower temperature for consistent, factual output
    max_tokens: 2000,
  });
  return response.choices[0].message.content;
}
```

---

## CI/CD

GitHub Actions pipeline runs on every push to `master`:

```yaml
# .github/workflows/ci.yml
- Lint with ESLint
- Type check with tsc --noEmit
- Build all packages via Turborepo
- Deploy to Vercel (production on master, preview on PRs)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat: add X"`
4. Push and open a Pull Request

---

## License

MIT © [saurabhravte](https://github.com/saurabhravte)

---

<div align="center">

Built with ❤️ for a hackathon · Powered by Next.js, Inngest, Drizzle, and AI

**[⭐ Star this repo](https://github.com/saurabhravte/shipflowAI)** if you found it useful!

</div>
