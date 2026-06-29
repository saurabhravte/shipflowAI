import { db, createId } from "@shipflow/db";
import { workspace, member } from "@shipflow/db";
import { eq, and } from "drizzle-orm";
import { NotFoundError, ForbiddenError } from "../../common/utils/apiError";

export async function listWorkspacesForUser(userId: string) {
  return db
    .select({ workspace })
    .from(workspace)
    .innerJoin(member, and(eq(member.workspaceId, workspace.id), eq(member.userId, userId)));
}

export async function createWorkspace(name: string, userId: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const [ws] = await db
    .insert(workspace)
    .values({ id: createId("ws"), name, slug })
    .returning();
  if (!ws) throw new Error("Failed to create workspace");

  await db.insert(member).values({
    id: createId("mem"),
    workspaceId: ws.id,
    userId,
    role: "owner",
  });
  return ws;
}

export async function getWorkspaceById(id: string, userId: string) {
  const row = await db
    .select({ workspace })
    .from(workspace)
    .innerJoin(member, and(eq(member.workspaceId, workspace.id), eq(member.userId, userId)))
    .where(eq(workspace.id, id))
    .limit(1);
  if (!row[0]) throw new NotFoundError("Workspace");
  return row[0].workspace;
}
