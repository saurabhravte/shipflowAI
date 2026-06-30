import "server-only";
import { db, workspace, member, subscription } from "@shipflow/db";
import { randomUUID } from "crypto";

/**
 * Runs once, right after Better Auth creates a new user row.
 * Every workspace needs exactly one subscription row (defaults to "free")
 * so billing code never has to handle "subscription is missing" as a case —
 * see Pass 6 for how usage limits read this.
 */
export async function createDefaultWorkspaceForUser(
  userId: string,
  displayName: string
): Promise<string> {
  const slug = await uniqueSlugFor(displayName || "workspace");

  return await db.transaction(async (tx) => {
    const [ws] = await tx
      .insert(workspace)
      .values({
        name: `${displayName}'s Workspace`,
        slug,
      })
      .returning();

    if (!ws) throw new Error("Failed to create default workspace");

    await tx.insert(member).values({
      workspaceId: ws.id,
      userId,
      role: "owner",
    });

    await tx.insert(subscription).values({
      workspaceId: ws.id,
      plan: "free",
      status: "active",
    });

    return ws.id;
  });
}

async function uniqueSlugFor(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  // Slugs are cosmetic (used in URLs), so we don't need a collision-checking
  // loop against the DB on the hot signup path — a short random suffix makes
  // collisions astronomically unlikely without an extra query.
  const suffix = randomUUID().slice(0, 6);
  return `${base || "workspace"}-${suffix}`;
}
