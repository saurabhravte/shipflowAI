import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@shipflow/db";
import * as schema from "@shipflow/db/schema";
import { createDefaultWorkspaceForUser } from "./post-signup";
import { resolveDefaultWorkspaceId } from "./active-workspace";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Only register a social provider when BOTH its id and secret are present.
 * Registering a provider with `undefined` credentials is what produces the
 * `client_id=undefined` GitHub 404 and the 500 on /api/auth/sign-in/social.
 * Leaving it unregistered makes Better Auth return a clean "provider not
 * configured" error instead of a generic crash, and surfaces misconfigured
 * deploys immediately in the logs below.
 */
function socialProviders() {
  const providers: NonNullable<
    Parameters<typeof betterAuth>[0]["socialProviders"]
  > = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  } else if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] Google login disabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set.",
    );
  }

  if (
    process.env.GITHUB_OAUTH_CLIENT_ID &&
    process.env.GITHUB_OAUTH_CLIENT_SECRET
  ) {
    // Note: this is the *login* GitHub OAuth App, distinct from the GitHub
    // App used for repo access/webhooks in Pass 3 (GITHUB_APP_ID etc).
    // Two separate GitHub apps, on purpose — login should not require
    // granting repo permissions, and repo access shouldn't require a
    // specific user to be signed in via GitHub.
    providers.github = {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    };
  } else if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] GitHub login disabled: GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET are not set.",
    );
  }

  return providers;
}

if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
  console.error(
    "[auth] BETTER_AUTH_SECRET is not set — sessions will be insecure and sign-in may 500.",
  );
}

/**
 * Single Better Auth instance for the whole app. Imported by:
 *  - apps/web/src/app/api/auth/[...all]/route.ts (the HTTP handler)
 *  - apps/web/src/server/auth/session.ts (server-side session reads)
 *  - apps/web/src/lib/auth-client.ts (client hooks, re-exports from here only types)
 */
export const auth = betterAuth({
  // Pin the canonical URL + secret explicitly so OAuth callback URLs and
  // signed cookies are correct in every environment (Vercel preview/prod),
  // not just whichever host the request happened to arrive on.
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  // Email/password is the primary credential-based path: dedicated /sign-up
  // and /sign-in pages both use this. Social providers below are additional
  // options, not replacements.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  // We map workspace/member/invitation ourselves (not Better Auth's built-in
  // "organization" plugin) because our domain model needs workspace to be the
  // tenant root for billing + GitHub installation, not a generic org concept
  // layered on top. See ARCHITECTURE.md Section 2.
  socialProviders: socialProviders(),

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day of activity
  },

  databaseHooks: {
    user: {
      create: {
        // First sign-in: give the user a personal workspace immediately so
        // there's never a "no workspace" empty state to design for.
        after: async (user) => {
          await createDefaultWorkspaceForUser(user.id, user.name ?? user.email);
        },
      },
    },
    session: {
      create: {
        // Seed activeWorkspaceId at session creation so every freshly
        // logged-in user already has a workspace context. Without this, the
        // session has a null activeWorkspaceId until the user explicitly
        // switches workspaces — which broke server routes that read it
        // directly (e.g. /api/github/install couldn't connect a repo right
        // after login). The user.create.after hook above has already created
        // the default workspace by the time this runs on first sign-up.
        before: async (session) => {
          const activeWorkspaceId = await resolveDefaultWorkspaceId(
            session.userId,
          );
          return { data: { ...session, activeWorkspaceId } };
        },
      },
    },
  },

  trustedOrigins: [appUrl],
});

export type Auth = typeof auth;
