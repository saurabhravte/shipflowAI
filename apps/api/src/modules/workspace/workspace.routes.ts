import { Router } from "express";
import { requireAuth, requireWorkspaceMember } from "../../common/middleware/auth.middleware";
import { list, create, getOne } from "./workspace.controller";

export const workspaceRoutes = Router();

workspaceRoutes.use(requireAuth);
workspaceRoutes.get("/", list);
workspaceRoutes.post("/", create);
workspaceRoutes.get("/:id", getOne);
