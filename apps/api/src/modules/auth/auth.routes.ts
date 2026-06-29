import { Router } from "express";
import { validate } from "../../common/middleware/validate.middleware";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { RegisterDto } from "./dto/register.dto";
import { register, getMe } from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", validate(RegisterDto), register);

authRoutes.get("/me", requireAuth, getMe);
