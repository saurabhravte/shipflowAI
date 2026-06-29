import { db } from "@shipflow/db";
import { user, workspace, member } from "@shipflow/db";
import { eq } from "drizzle-orm";
import { createId } from "@shipflow/db";
import { BadRequestError, NotFoundError } from "../../common/utils/apiError";
import { signToken } from "../../common/utils/jwt.utils";
import { createHmac } from "crypto";

function hashPassword(password: string): string {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "dev-secret")
    .update(password)
    .digest("hex");
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing[0]) throw new BadRequestError("Email already registered");

  const [newUser] = await db
    .insert(user)
    .values({
      id: createId("usr"),
      name,
      email,
      emailVerified: false,
      // NOTE: Better Auth handles password hashing natively.
      // This service is for the standalone Express API flow only.
    })
    .returning();

  if (!newUser) throw new Error("Failed to create user");

  // Auto-create personal workspace
  const slug = email.split("@")[0]!.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const [newWorkspace] = await db
    .insert(workspace)
    .values({ id: createId("ws"), name: `${name}'s Workspace`, slug })
    .returning();

  if (!newWorkspace) throw new Error("Failed to create workspace");

  await db.insert(member).values({
    id: createId("mem"),
    workspaceId: newWorkspace.id,
    userId: newUser.id,
    role: "owner",
  });

  const token = signToken({ userId: newUser.id, workspaceId: newWorkspace.id });
  return { user: { id: newUser.id, name: newUser.name, email: newUser.email }, token };
}

export async function getUserById(userId: string) {
  const row = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!row[0]) throw new NotFoundError("User");
  return row[0];
}
