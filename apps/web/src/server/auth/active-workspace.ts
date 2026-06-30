import "server-only";
import { db, member } from "@shipflow/db";
import { eq } from "drizzle-orm";

/**
 * The workspace a user should be "inside" when their session doesn't name one
 * explicitly. Picks the oldest membership deterministically so the choice is
 * stable across requests. Shared by the session-create hook (which seeds
 * session.activeWorkspaceId) and any route handler that needs to resolve a
 * workspace without going through tRPC's workspaceProcedure.
 */
export async function resolveDefaultWorkspaceId(
  userId: string,
): Promise<string | undefined> {
  const membership = await db.query.member.findFirst({
    where: eq(member.userId, userId),
    orderBy: (t, { asc }) => asc(t.createdAt),
  });
  return membership?.workspaceId;
}
