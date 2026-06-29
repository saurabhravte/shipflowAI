# ShipFlow AI — Setup Guide

Read `/ARCHITECTURE.md` first for how the system fits together. This file is
purely about getting it running locally.

## 0. Prerequisites

- Node.js >= 20
- pnpm 9.x (`npm install -g pnpm`)
- A local or hosted PostgreSQL instance
- [ngrok](https://ngrok.com) (for GitHub/Razorpay webhook delivery in dev)
- Accounts: Google Cloud (OAuth), GitHub (App + OAuth App), OpenRouter,
  Pinecone, Razorpay

## 1. Install

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` as you complete each section below.

## 2. Database

```bash
# point DATABASE_URL at your Postgres instance, then:
pnpm db:generate   # generates SQL migrations from packages/db/src/schema
pnpm db:migrate    # applies them
pnpm db:studio     # optional — browse data via Drizzle Studio
```

## 3. ngrok (do this early — you'll need the URL for steps 4 and 7)

```bash
ngrok http 3000
```

Copy the `https://xxxx.ngrok-free.app` URL. Set `NEXT_PUBLIC_APP_URL` in
`.env` to this value for any OAuth/webhook testing (switch back to
`http://localhost:3000` for plain local browsing — or just leave it as the
ngrok URL throughout dev, since it forwards to localhost:3000 anyway).

## 4. Better Auth — Google + GitHub login

**Google:**
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth client ID (Web application).
2. Authorized redirect URI: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
3. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

**GitHub (OAuth App — login only, separate from the GitHub App in step 5):**
1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Authorization callback URL: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/github`
3. Set `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET`.

Generate `BETTER_AUTH_SECRET`: `openssl rand -hex 32`.

## 5. GitHub App — repo access + webhooks

This is a **separate** GitHub App from the OAuth App above — it's what
installs on repositories, not what users sign in with.

1. GitHub → Settings → Developer settings → GitHub Apps → New GitHub App.
2. **Homepage URL**: `{NEXT_PUBLIC_APP_URL}`
3. **Setup URL** (under "Post installation"): `{NEXT_PUBLIC_APP_URL}/api/github/setup` — check "Redirect on update" too.
4. **Webhook URL**: `{NEXT_PUBLIC_APP_URL}/api/webhooks/github`
5. **Webhook secret**: generate one, save as `GITHUB_APP_WEBHOOK_SECRET`.
6. **Permissions** (Repository): Contents (read), Pull requests (read & write), Metadata (read).
7. **Subscribe to events**: Pull request.
8. Create the app, then generate a private key (downloads a `.pem`).
9. Set:
   - `GITHUB_APP_ID` — from the app's settings page
   - `GITHUB_APP_PRIVATE_KEY` — paste the full `.pem` contents (multi-line is fine; the code unescapes `\n` automatically, see `lib/github/app.ts`)
   - `GITHUB_APP_SLUG` — the app's URL slug

Install the app on a test repo from its public page (`github.com/apps/your-app-slug`) to test the flow end to end.

## 6. OpenRouter + Pinecone

1. [OpenRouter](https://openrouter.ai) → API Keys → create one → `OPENROUTER_API_KEY`.
   **Check current model slugs** at openrouter.ai/models before relying on
   the defaults in `apps/web/src/lib/ai/models.ts` — they were a reasonable
   starting point at time of writing but OpenRouter's catalog changes.
2. [Pinecone](https://www.pinecone.io) → create a project → API key → `PINECONE_API_KEY`.
3. Create the index (must be **1536 dimensions** to match the embedding
   model — adjust both together if you change the embedding model):

   ```bash
   # one-time, via Pinecone's console UI is easiest, or via their API:
   curl -X POST "https://api.pinecone.io/indexes" \
     -H "Api-Key: $PINECONE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "shipflow-code-chunks",
       "dimension": 1536,
       "metric": "cosine",
       "spec": { "serverless": { "cloud": "aws", "region": "us-east-1" } }
     }'
   ```
4. Set `PINECONE_INDEX=shipflow-code-chunks`.

## 7. Inngest

```bash
pnpm inngest:dev
```

This runs the Inngest Dev Server (separate terminal, alongside `pnpm dev`)
and auto-discovers functions from `/api/inngest` on localhost:3000. You can
watch every workflow run — including each `step.run()` — at
`http://localhost:8288`.

For production, get `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` from the
[Inngest dashboard](https://app.inngest.com) once you deploy.

## 8. Razorpay

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys → generate test keys → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
2. Settings → Webhooks → Add New Webhook:
   - URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/razorpay`
   - Secret: generate one → `RAZORPAY_WEBHOOK_SECRET`
   - Events: `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`
3. Subscriptions → Plans → create a "Pro" plan and an "Enterprise" plan → copy their plan IDs into `RAZORPAY_PRO_PLAN_ID` / `RAZORPAY_ENTERPRISE_PLAN_ID`.

## 9. Run it

```bash
pnpm dev               # Next.js app on :3000
pnpm inngest:dev        # separate terminal — Inngest Dev Server on :8288
```

Visit `http://localhost:3000` (or your ngrok URL), sign in, create a
project, connect GitHub, link a repo, and submit a feature request to walk
the full pipeline.

---

## Known gaps / follow-ups worth your attention

These are deliberate v1 simplifications, not oversights — flagged so they
don't surprise you later:

1. **PR-to-feature-request linking is convention-based** (`ShipFlow: fr_xxx`
   in the title/body), not a UI-driven picker. Works, but a "copy this into
   your PR" button on the task board would close the loop better — natural
   next addition to `task-board-panel.tsx`.
2. **Razorpay Checkout's client-side popup isn't wired up.** `billing.createSubscription`
   returns `{ razorpaySubscriptionId, razorpayKeyId }`; the actual
   `new window.Razorpay({...}).open()` call (loading their checkout.js
   script and handling the success callback) is the part still needed in
   `billing/page.tsx` — same effort as any other Razorpay Checkout
   integration, just not built out here since it's pure frontend wiring
   with no architectural decisions left to make.
3. **Razorpay subscription renewal past `total_count` cycles** isn't
   automated — see the comment in `server/routers/billing.ts`.
4. **No Drizzle migration files are checked in** — `pnpm db:generate` creates
   them fresh from the schema; this is normal for a new project but means
   the very first migration run is also your first real correctness check
   on the schema.
5. **No automated tests.** Given the scope, this was prioritized as a
   working, reviewed implementation over a tested one — adding integration
   tests around the state machine (`server/workflows/state-machine.ts`) and
   the review pipeline would be the highest-leverage first tests to write.
6. **Model slugs in `lib/ai/models.ts` need a live check** against
   OpenRouter's current catalog before production use (flagged inline in
   that file too).

## Project structure reference

See `/ARCHITECTURE.md` Section 1 for the full directory layout and Section
10 (build passes) for what was built when.
