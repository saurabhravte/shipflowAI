# ShipFlow AI — Architecture

This document is the canonical reference for how ShipFlow AI is structured. Code comments throughout the repo link here.

## 1. System overview

ShipFlow AI is a **tRPC monorepo** with one Next.js application (`apps/web`) and shared packages (`packages/db`, `packages/typescript-config`).

```
Browser (Next.js App Router)
        │ tRPC + Better Auth cookies
        ▼
Route handlers: /api/trpc · /api/auth · /api/inngest · /api/webhooks/*
        │
   ┌────┴────┐
   ▼         ▼
tRPC      Inngest workers
routers   clarify · generate-prd · generate-tasks · review-pull-request
   │         │
   └────┬────┘
        ▼
 PostgreSQL (Drizzle) · GitHub App (Octokit) · OpenRouter (AI SDK) · Pinecone
```

**Design principles**

1. **Event-driven workflows** — LLM and GitHub work runs in Inngest; HTTP handlers return immediately.
2. **Step-level retries** — each `step.run()` retries independently.
3. **Centralized state machine** — every `feature_request.status` change goes through `transitionFeatureRequest()`.
4. **Workspace tenancy** — `workspaceProcedure` enforces isolation on all domain APIs.
5. **Real GitHub data** — no hardcoded PR payloads; webhooks + Octokit only.

---

## 2. Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 16 app — UI, tRPC routers, Inngest functions, webhooks |
| `packages/db` | Drizzle schema, migrations, DB client (`@shipflow/db`) |
| `packages/typescript-config` | Shared `tsconfig` bases |

### tRPC routers (10)

`workspace` · `project` · `featureRequest` · `prd` · `task` · `github` · `pullRequest` · `review` · `approval` · `billing`

All domain routers use `workspaceProcedure` except auth (Better Auth routes).

---

## 3. Feature request state machine

**Single source of truth:** `feature_request.status` on the `feature_request` table.

Never infer workflow stage from whether a PRD or task row exists — always read `status`.

### States

| Status | Meaning |
|--------|---------|
| `draft` | Created; clarification may be pending or skipped |
| `clarifying` | AI asked follow-up questions; awaiting human answers |
| `prd_generating` | Inngest generating PRD |
| `prd_review` | PRD ready; human must approve or reject |
| `tasks_generating` | Inngest breaking PRD into tasks |
| `tasks_review` | Task plan ready; human must approve or reject |
| `in_development` | Plan approved; implementation in progress |
| `ai_reviewing` | AI review running on linked PR |
| `fix_needed` | Blocking review findings; developer must fix and push |
| `human_approval` | AI clean; human final release gate |
| `shipped` | Approved and released (terminal) |
| `rejected` | Rejected at a gate (terminal) |

### Legal transitions

Defined in `apps/web/src/server/workflows/state-machine.ts`:

```
draft → clarifying | prd_generating
clarifying → prd_generating
prd_generating → prd_review | draft          # draft = recoverable failure (usage limit)
prd_review → tasks_generating | rejected
tasks_generating → tasks_review
tasks_review → in_development | rejected
in_development → ai_reviewing
ai_reviewing → fix_needed | human_approval
fix_needed → ai_reviewing                    # re-review on new PR push
human_approval → shipped | rejected | fix_needed
shipped → (terminal)
rejected → (terminal)
```

### Human gates

1. **PRD approval** — `prd.approve` → `tasks_generating`
2. **Task plan approval** — `task.approvePlan` → `in_development`
3. **Final release** — `approval.decide` → `shipped` | `rejected` | `fix_needed`

Reject paths: `prd.reject`, `task.rejectPlan`, `approval.decide(rejected)`.

### Workflow errors

`feature_request.workflow_error` stores recoverable async failures (e.g. plan usage limits). Cleared on retry. UI shows `WorkflowErrorAlert`; PRD retry uses `featureRequest.retryPrdGeneration`.

---

## 4. Inngest workflows

Registered at `apps/web/src/app/api/inngest/route.ts`.

| Function | Trigger event | Purpose |
|----------|---------------|---------|
| `clarify-feature-request` | `feature_request/clarify_requested` | AI clarification or skip-to-PRD |
| `generate-prd` | `feature_request/prd_requested` | Structured PRD generation |
| `generate-tasks` | `prd/approved` | Kanban task breakdown |
| `review-pull-request` | `github/pull_request.review_requested` | Repo-aware AI code review |

Event types: `apps/web/src/server/inngest/client.ts`

**Progress visibility:** feature detail page polls `featureRequest.get` every 3s during generating/reviewing states. `PipelineStepper` collapses generating states into the next visual stage.

---

## 5. GitHub integration

- **GitHub App** (not OAuth) for repo access — `apps/web/src/lib/github/app.ts`
- **Webhooks** — `POST /api/webhooks/github` → upsert PR → emit Inngest review event
- **PR ↔ feature linking** — convention `ShipFlow: fr_xxx` in PR title or body
- **Tools layer** — `apps/web/src/lib/github/tools.ts` (diff, files, review, merge, list comments)
- **On ship** — `approval.decide(approved)` merges the latest open linked PR via `pulls.merge` (best-effort)

Repository plan limits enforced in `github.linkRepository` via `assertRepositoryLimit()`.

---

## 6. AI agents

Provider: OpenRouter via `@openrouter/ai-sdk-provider`. Workspace BYOK supported.

| Step | Model tier | SDK | Output schema |
|------|------------|-----|---------------|
| Clarification | `fast` | `generateObject` | `clarifyingQuestionsSchema` |
| PRD | `fast` | `generateObject` | `prdGenerationSchema` |
| Tasks | `fast` | `generateObject` | `taskGenerationSchema` |
| Code review | `review` | `generateObject` | `reviewFindingsSchema` |
| Embeddings | `embedding` | `embed` / `embedMany` | Pinecone indexing |

Prompts: `apps/web/src/lib/ai/prompts.ts`  
Schemas: `apps/web/src/lib/ai/schemas.ts`

### Review loop

- Findings: `blocking` | `non_blocking`
- Transition uses `readyForApproval` **and** zero blocking findings → `human_approval`; else → `fix_needed`
- Re-review: GitHub `synchronize` webhook re-fires review
- Findings persisted with `github_comment_id` after posting inline review comments

### Repo-aware context

Changed files are chunked, embedded, and stored in Pinecone. Review prompt includes diff + semantically related file paths from the same repository.

---

## 7. Multi-tenancy & billing

- **Tenant root:** `workspace`
- **Membership:** `member` (roles: owner, admin, member)
- **Session:** `session.activeWorkspaceId`
- **Plans:** Free / Pro / Enterprise — limits in `apps/web/src/lib/billing/razorpay.ts`
- **Metering:** `usage_record` monthly buckets; checked before PRD gen and AI review
- **Payments:** Razorpay subscriptions + webhook at `/api/webhooks/razorpay`

---

## 8. Database schema (summary)

See `packages/db/src/schema/` and README § Database schema.

Core loop tables: `feature_request` → `clarifying_exchange` | `prd` | `task` | `approval`  
GitHub tables: `github_installation` → `repository` → `pull_request` → `review_run` → `review_finding`

---

## 9. Security notes

- Webhook signatures verified (GitHub, Razorpay)
- Workspace scoping on every tRPC mutation/query
- BYOK keys encrypted at rest (`workspace.openrouterApiKeyEnc`)
- AI reviews post as `COMMENT` on GitHub — merge approval remains a human decision in ShipFlow (merge on ship is optional automation after human approval)
