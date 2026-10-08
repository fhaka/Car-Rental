import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export interface AccessTokenClaims {
  sub: string;
  role: Role;
  email: string;
}

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}

export interface RefreshTokenClaims {
  sub: string;
  jti: string; // unique id for this refresh token, used to find/revoke it in the DB
}

export function signRefreshToken(claims: RefreshTokenClaims): string {
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenClaims;
}

/** Refresh tokens are stored hashed (never plaintext) so a DB leak doesn't hand out live sessions. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function newTokenId(): string {
  return crypto.randomUUID();
}

export function parseExpiryToDate(expiresIn: string): Date {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  const now = Date.now();
  if (!match) return new Date(now + 15 * 60 * 1000);
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 60_000;
  return new Date(now + value * multiplier);
}
