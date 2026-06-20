import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "./AppError";

// Validate req.body against a Zod schema. On success, replaces req.body with the
// parsed (and coerced) data. On failure, forwards a VALIDATION_ERROR to the
// global error handler so the response keeps the standard envelope.
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
        .join("; ");
      return next(new AppError(message || "validation failed", 400, "VALIDATION_ERROR"));
    }
    req.body = result.data;
    next();
  };
}
