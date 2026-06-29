/**
 * These helpers exist so "forgot the workspaceId filter" is structurally
 * harder to do than to do right. They are intentionally thin — Drizzle's
 * query builder is still used directly everywhere — but every multi-row
 * fetch in apps/web/src/server should go through `withWorkspace` so a code
 * reviewer can grep for raw `db.select()` calls that skip it.
 */
import { and, eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export function withWorkspace(
  workspaceIdColumn: PgColumn,
  workspaceId: string,
  ...extra: (SQL | undefined)[]
): SQL {
  const conditions = [eq(workspaceIdColumn, workspaceId), ...extra].filter(
    (c): c is SQL => c !== undefined,
  );
  return and(...conditions)!;
}
