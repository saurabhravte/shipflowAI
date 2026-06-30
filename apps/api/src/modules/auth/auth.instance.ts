import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, user, session, account, verification } from "@shipflow/db";

/**
 * Better Auth instance for the standalone Express API.
 *
 * This is a SEPARATE process from apps/web, but both point at the same
 * Postgres database/session table and the same BETTER_AUTH_SECRET, so a
 * session cookie issued by the Next.js app (apps/web) is also valid here.
 * There is exactly one auth system (Better Auth) and one source of truth
 * for sessions (the `session` table) — this API never mints its own tokens.
 *
 * We intentionally do NOT register the emailAndPassword/socialProviders
 * config here: account creation only happens through apps/web. This
 * instance is read-only with respect to identity — it's used solely to
 * verify sessions on incoming requests.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});
