import { db, createId } from "@shipflow/db";
import { project } from "@shipflow/db";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../common/utils/apiError";

export async function listProjects(workspaceId: string) {
  return db.select().from(project).where(eq(project.workspaceId, workspaceId));
}

export async function createProject(
  workspaceId: string,
  name: string,
  description?: string,
) {
  const [p] = await db
    .insert(project)
    .values({
      workspaceId,
      name,
      description,
    })
    .returning();

  if (!p) throw new Error("Failed to create project");

  return p;
}

export async function getProjectById(id: string, workspaceId: string) {
  const [p] = await db
    .select()
    .from(project)
    .where(eq(project.id, id))
    .limit(1);
  if (!p || p.workspaceId !== workspaceId) throw new NotFoundError("Project");
  return p;
}

export async function updateProject(
  id: string,
  workspaceId: string,
  data: { name?: string; description?: string },
) {
  await getProjectById(id, workspaceId); // guard
  const [p] = await db
    .update(project)
    .set(data)
    .where(eq(project.id, id))
    .returning();
  return p;
}

export async function deleteProject(id: string, workspaceId: string) {
  await getProjectById(id, workspaceId); // guard
  await db.delete(project).where(eq(project.id, id));
}
