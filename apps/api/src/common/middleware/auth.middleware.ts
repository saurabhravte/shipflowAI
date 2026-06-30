import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../modules/auth/auth.instance";
import { UnauthorizedError, ForbiddenError } from "../utils/apiError";
import { db } from "@shipflow/db";
import { member } from "@shipflow/db";
import { eq, and } from "drizzle-orm";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  workspaceId?: string;
}

// Extend Express Request with user context
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates the Better Auth session cookie on the incoming request.
 * This is the same session created by apps/web on sign-in/sign-up — there is
 * no separate token system here, just a check against the shared session
 * table via the Better Auth instance in auth.instance.ts.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedError("Not signed in");
    }

    req.user = {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    next(new UnauthorizedError("Invalid or expired session"));
  }
}

/**
 * Checks that req.user is a member of the workspaceId from req.params or req.body.
 * Must be used after requireAuth.
 */
export async function requireWorkspaceMember(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const workspaceId =
    (req.params.workspaceId as string | undefined) ??
    (req.body as Record<string, string>).workspaceId ??
    req.user?.workspaceId;

  if (!workspaceId) {
    throw new ForbiddenError("workspaceId is required");
  }

  if (!req.user?.userId) {
    throw new UnauthorizedError();
  }

  const row = await db
    .select()
    .from(member)
    .where(and(eq(member.workspaceId, workspaceId), eq(member.userId, req.user.userId)))
    .limit(1);

  if (!row[0]) {
    throw new ForbiddenError("You are not a member of this workspace");
  }

  // Store workspaceId on user context for downstream use
  req.user.workspaceId = workspaceId;
  next();
}
