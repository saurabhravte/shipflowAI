import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../utils/jwt.utils";
import { UnauthorizedError, ForbiddenError } from "../utils/apiError";
import { db } from "@shipflow/db";
import { member } from "@shipflow/db";
import { eq, and } from "drizzle-orm";

// Extend Express Request with user context
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verifies the Bearer token in Authorization header.
 * Attaches decoded payload to req.user.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
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
    .where(
      and(
        eq(member.workspaceId, workspaceId),
        eq(member.userId, req.user.userId)
      )
    )
    .limit(1);

  if (!row[0]) {
    throw new ForbiddenError("You are not a member of this workspace");
  }

  // Store workspaceId on user context for downstream use
  req.user.workspaceId = workspaceId;
  next();
}
