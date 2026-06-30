import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { getMe } from "./auth.controller";

export const authRoutes = Router();

// Account creation and credential sign-in live exclusively in apps/web
// (Better Auth + dedicated /sign-up, /sign-in pages). This API only ever
// reads the resulting session — never issues or stores credentials itself.
authRoutes.get("/me", requireAuth, getMe);
