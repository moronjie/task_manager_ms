import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";

// Standard success envelope: { success, message, data }.
export function sendSuccess(
  res: Response,
  data: unknown = null,
  message = "ok",
  statusCode = 200
) {
  return res.status(statusCode).json({ success: true, message, data });
}

// Wrap async handlers so rejected promises reach the error middleware.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// 404 fallthrough for unmatched routes.
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: "route not found", code: "NOT_FOUND" });
}

// Global error handler — standard error envelope: { success, message, code }.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message, code: err.code });
  }

  console.error("[error]", err);
  return res
    .status(500)
    .json({ success: false, message: "internal server error", code: "INTERNAL_ERROR" });
}
