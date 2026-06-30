import type { Request, Response, NextFunction } from "express";
import { ok } from "../../common/utils/apiResponse";

/**
 * Returns the currently authenticated user (from the Better Auth session,
 * validated by requireAuth). There is no /register or /login here —
 * account creation and credential sign-in happen exclusively through
 * apps/web's Better Auth instance (dedicated /sign-up and /sign-in pages).
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, req.user, "Authenticated user");
  } catch (error) {
    next(error);
  }
}
