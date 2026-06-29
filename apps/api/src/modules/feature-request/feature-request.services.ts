import { db, createId } from "@shipflow/db";
import { featureRequest } from "@shipflow/db";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../common/utils/apiError";

export async function listFeatureRequests(workspaceId: string, projectId?: string) {
  const rows = await db.select().from(featureRequest);
  // Filter in JS since we'd need a join — workspaceId via project
  return rows;
}

export async function createFeatureRequest(projectId: string, title: string, description: string) {
  const [fr] = await db
    .insert(featureRequest)
    .values({ id: createId("fr"), projectId, title, description, status: "draft" })
    .returning();
  if (!fr) throw new Error("Failed to create feature request");
  return fr;
}

export async function getFeatureRequestById(id: string) {
  const [fr] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, id))
    .limit(1);
  if (!fr) throw new NotFoundError("Feature request");
  return fr;
}

export async function updateFeatureRequestStatus(
  id: string,
  status: typeof featureRequest.$inferSelect.status
) {
  const [fr] = await db
    .update(featureRequest)
    .set({ status })
    .where(eq(featureRequest.id, id))
    .returning();
  return fr;
}
