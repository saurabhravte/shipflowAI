import { Router } from "express";
import { requireAuth, requireWorkspaceMember } from "../../common/middleware/auth.middleware";
import { getInstallUrl, getInstallation, listRepos } from "./github.controller";

export const githubRoutes = Router();
githubRoutes.use(requireAuth, requireWorkspaceMember);
githubRoutes.get("/install-url", getInstallUrl);
githubRoutes.get("/installation", getInstallation);
githubRoutes.get("/repos", listRepos);
