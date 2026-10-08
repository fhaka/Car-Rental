import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { prisma } from "../lib/prisma";

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Verifies the Bearer access token on the Authorization header.
 * Also re-checks that the user still exists and is active, so a
 * deactivated user's still-valid access token is rejected immediately.
 */
export function authenticate() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith("Bearer ")) {
        throw AppError.unauthorized("Missing or invalid Authorization header");
      }
      const token = header.slice("Bearer ".length);
      let payload: AccessTokenPayload;
      try {
        payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
      } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
          throw AppError.unauthorized("Access token expired", "TOKEN_EXPIRED");
        }
        throw AppError.unauthorized("Invalid access token", "TOKEN_INVALID");
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) {
        throw AppError.unauthorized("Account is inactive or no longer exists", "ACCOUNT_INACTIVE");
      }

      req.user = { sub: user.id, role: user.role, email: user.email };
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Restricts a route to the given set of roles. Must run after authenticate().
 * Authorization is enforced here on the backend - the frontend only hides UI.
 */
export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(AppError.forbidden(`This action requires one of the following roles: ${roles.join(", ")}`));
    }
    next();
  };
}
