import type { Request, Response, NextFunction } from "express";
import { registerUser } from "./auth.services";
import { ok, created } from "../../common/utils/apiResponse";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };
    const result = await registerUser(name, email, password);
    created(res, result, "Registration successful");
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, req.user, "Authenticated user");
  } catch (error) {
    next(error);
  }
}
