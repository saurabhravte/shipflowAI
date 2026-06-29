import { Router } from "express";
import { requireAuth, requireWorkspaceMember } from "../../common/middleware/auth.middleware";
import { getPlan, adminGrantPro } from "./billing.controller";

export const billingRoutes = Router();
billingRoutes.get("/plan", requireAuth, requireWorkspaceMember, getPlan);

// ADMIN: POST /api/billing/admin/grant-pro  { workspaceId, plan, durationDays }
// Protect this with your own admin token check in production!
billingRoutes.post("/admin/grant-pro", adminGrantPro);
