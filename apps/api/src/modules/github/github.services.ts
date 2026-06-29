import { db, createId } from "@shipflow/db";
import { githubInstallation, repository } from "@shipflow/db";
import { eq } from "drizzle-orm";

export async function getInstallUrl(workspaceId: string) {
  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) throw new Error("GITHUB_APP_SLUG env var is not set");
  return `https://github.com/apps/${slug}/installations/new?state=${workspaceId}`;
}

export async function getInstallation(workspaceId: string) {
  const [install] = await db
    .select()
    .from(githubInstallation)
    .where(eq(githubInstallation.workspaceId, workspaceId))
    .limit(1);
  return install ?? null;
}

export async function saveInstallation(
  workspaceId: string,
  installationId: number,
  accountLogin: string,
  accountType: string
) {
  const [row] = await db
    .insert(githubInstallation)
    .values({
      id: createId("ghi"),
      workspaceId,
      installationId,
      accountLogin,
      accountType,
    })
    .onConflictDoUpdate({
      target: githubInstallation.workspaceId,
      set: { installationId, accountLogin, accountType },
    })
    .returning();
  return row;
}

export async function listRepositories(workspaceId: string) {
  const install = await getInstallation(workspaceId);
  if (!install) return [];
  return db
    .select()
    .from(repository)
    .where(eq(repository.installationId, install.id));
}
