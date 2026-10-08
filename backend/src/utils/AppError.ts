/**
 * Standard application error carrying an HTTP status and a stable machine-readable
 * error code. Thrown anywhere in service/controller code and caught centrally by
 * the errorHandler middleware, which shapes the response as:
 *   { error: { message, code, details? } }
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown) {
    return new AppError(message, 400, code, details);
  }
  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED") {
    return new AppError(message, 401, code);
  }
  static forbidden(message = "You do not have permission to perform this action", code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  }
  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  }
  static conflict(message: string, code = "CONFLICT", details?: unknown) {
    return new AppError(message, 409, code, details);
  }
  static unprocessable(message: string, code = "VALIDATION_ERROR", details?: unknown) {
    return new AppError(message, 422, code, details);
  }
  static internal(message = "An unexpected error occurred", code = "INTERNAL_ERROR") {
    return new AppError(message, 500, code);
  }
}
