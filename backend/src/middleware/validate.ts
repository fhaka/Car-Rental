import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";
import { AppError } from "../utils/AppError";

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/**
 * Validates and coerces req.body / req.query / req.params against Zod schemas.
 * On success, the parsed (and type-coerced) data replaces the original request
 * property, so controllers can trust the shape of what they receive.
 */
export function validate(schemas: { body?: Schema; query?: Schema; params?: Schema }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as unknown as Request["query"];
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as unknown as Request["params"];
      }
      next();
    } catch (err: unknown) {
      const zodErr = err as { errors?: unknown; flatten?: () => unknown };
      const details = typeof zodErr.flatten === "function" ? zodErr.flatten() : zodErr.errors;
      next(AppError.unprocessable("Validation failed", "VALIDATION_ERROR", details));
    }
  };
}
