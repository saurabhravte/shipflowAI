import type { Request, Response, NextFunction } from "express";
import { getSubscription, grantProAccess } from "./billing.services";
import { ok } from "../../common/utils/apiResponse";

export const getPlan = async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await getSubscription(req.user!.workspaceId!)); } catch (e) { next(e); }
};

// Admin-only: grant pro from API (protect with admin secret in production)
export const adminGrantPro = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const b = req.body as { workspaceId: string; plan?: "pro" | "enterprise"; durationDays?: number };
    ok(res, await grantProAccess(b.workspaceId, b.plan, b.durationDays));
  } catch (e) { next(e); }
};
