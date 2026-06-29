import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@shipflow/db";
import * as schema from "@shipflow/db/schema";
import { createDefaultWorkspaceForUser } from "./post-signup";

/**
 * Single Better Auth instance for the whole app. Imported by:
 *  - apps/web/src/app/api/auth/[...all]/route.ts (the HTTP handler)
 *  - apps/web/src/server/auth/session.ts (server-side session reads)
 *  - apps/web/src/lib/auth-client.ts (client hooks, re-exports from here only types)
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  // We map workspace/member/invitation ourselves (not Better Auth's built-in
  // "organization" plugin) because our domain model needs workspace to be the
  // tenant root for billing + GitHub installation, not a generic org concept
  // layered on top. See ARCHITECTURE.md Section 2.
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET as string,
      // Note: this is the *login* GitHub OAuth App, distinct from the GitHub
      // App used for repo access/webhooks in Pass 3 (GITHUB_APP_ID etc).
      // Two separate GitHub apps, on purpose — login should not require
      // granting repo permissions, and repo access shouldn't require a
      // specific user to be signed in via GitHub.
    },
  },

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
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});

export type Auth = typeof auth;
