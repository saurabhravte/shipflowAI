import { Router } from "express";
import { requireAuth, requireWorkspaceMember } from "../../common/middleware/auth.middleware";
import { validate } from "../../common/middleware/validate.middleware";
import { CreateFeatureRequestDto } from "./dto/create-feature-request.dto";
import { list, create, getOne } from "./feature-request.controller";

export const featureRequestRoutes = Router();
featureRequestRoutes.use(requireAuth, requireWorkspaceMember);
featureRequestRoutes.get("/", list);
featureRequestRoutes.post("/", validate(CreateFeatureRequestDto), create);
featureRequestRoutes.get("/:id", getOne);
