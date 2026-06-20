// Application error carrying an HTTP status and a stable, machine-readable code.
// Throw these from controllers; the global error handler formats the response.
export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Common factory helpers for the codes used across the service.
export const Errors = {
  validation: (msg: string) => new AppError(msg, 400, "VALIDATION_ERROR"),
  unauthorized: (msg = "unauthorized") => new AppError(msg, 401, "UNAUTHORIZED"),
  forbidden: (msg = "forbidden") => new AppError(msg, 403, "FORBIDDEN"),
  notFound: (msg = "not found") => new AppError(msg, 404, "NOT_FOUND"),
  conflict: (msg: string) => new AppError(msg, 409, "CONFLICT"),
};
