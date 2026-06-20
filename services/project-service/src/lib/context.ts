import { Request } from "express";
import { Errors } from "./AppError";

// The gateway forwards the verified user id; downstream we trust it.
export function requireUserId(req: Request): string {
  const userId = req.header("x-user-id");
  if (!userId) {
    throw Errors.unauthorized("missing user context");
  }
  return userId;
}
