import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

type ValidateTarget = "body" | "query" | "params";

/**
 * Zod validation middleware factory.
 * Usage: router.post('/route', validate(MyDto), controller)
 */
export function validate(schema: ZodSchema, target: ValidateTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    // Replace target with parsed (coerced + defaulted) values
    req[target] = result.data as typeof req[typeof target];
    next();
  };
}
