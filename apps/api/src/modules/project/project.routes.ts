import { Router } from "express";
import { requireAuth, requireWorkspaceMember } from "../../common/middleware/auth.middleware";
import { list, create, getOne, update, remove } from "./project.controller";

export const projectRoutes = Router();
projectRoutes.use(requireAuth, requireWorkspaceMember);
projectRoutes.get("/", list);
projectRoutes.post("/", create);
projectRoutes.get("/:id", getOne);
projectRoutes.patch("/:id", update);
projectRoutes.delete("/:id", remove);
