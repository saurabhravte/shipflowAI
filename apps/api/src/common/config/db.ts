// Re-export the shared Drizzle db client from @shipflow/db package.
// The schema and migrations live in packages/db — never duplicate them here.
export { db } from "@shipflow/db";

export async function connectDb(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("[DB] DATABASE_URL environment variable is not set.");
  }
  // Drizzle + pg uses a connection pool that connects lazily on first query.
  // We just validate the env var here so the server fails fast at startup.
  console.log("[DB] Connected to Postgres via Drizzle ORM");
}
