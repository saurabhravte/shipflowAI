import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __shipflowPool: Pool | undefined;
}

/**
 * Reuse the pool across hot-reloads in dev (Next.js dev server re-evaluates
 * modules on every request otherwise, exhausting Postgres connections).
 */
const pool =
  globalThis.__shipflowPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__shipflowPool = pool;
}

export const db = drizzle(pool, { schema });
export type Database = typeof db;

export * from "./schema";
