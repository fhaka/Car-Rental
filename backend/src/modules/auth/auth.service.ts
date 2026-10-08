import crypto from "crypto";
import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/password";
import {
  hashToken,
  newTokenId,
  parseExpiryToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { logActivity } from "../../utils/activityLog";
import {
  ChangePasswordInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from "./auth.schemas";

function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash, ...rest } = user;
  return rest;
}

async function issueTokenPair(user: { id: string; role: import("@prisma/client").Role; email: string }, ip?: string) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const jti = newTokenId();
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: parseExpiryToDate(env.REFRESH_TOKEN_EXPIRES_IN),
      createdByIp: ip,
    },
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async login(input: LoginInput, ip?: string) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const tokens = await issueTokenPair(user, ip);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await logActivity({ userId: user.id, action: "USER_LOGIN", entityType: "User", entityId: user.id });

    return { user: sanitizeUser(user), ...tokens };
  },

  async refresh(refreshTokenRaw: string | undefined, ip?: string) {
    if (!refreshTokenRaw) {
      throw AppError.unauthorized("Missing refresh token", "REFRESH_TOKEN_MISSING");
    }

    let claims;
    try {
      claims = verifyRefreshToken(refreshTokenRaw);
    } catch {
      throw AppError.unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { id: claims.jti } });
    const tokenHash = hashToken(refreshTokenRaw);

    if (!stored || stored.tokenHash !== tokenHash) {
      throw AppError.unauthorized("Refresh token not recognized", "REFRESH_TOKEN_INVALID");
    }
    if (stored.revokedAt) {
      // Reuse of a revoked/rotated token: possible token theft. Revoke the whole chain defensively.
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw AppError.unauthorized("Refresh token has been revoked", "REFRESH_TOKEN_REUSED");
    }
    if (stored.expiresAt < new Date()) {
      throw AppError.unauthorized("Refresh token expired", "REFRESH_TOKEN_EXPIRED");
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized("Account is inactive or no longer exists", "ACCOUNT_INACTIVE");
    }

    // Rotate: revoke the used token, issue a fresh pair.
    const tokens = await issueTokenPair(user, ip);
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedByToken: tokens.refreshToken.slice(-20) },
    });

    return { user: sanitizeUser(user), ...tokens };
  },

  async logout(refreshTokenRaw: string | undefined) {
    if (!refreshTokenRaw) return;
    try {
      const claims = verifyRefreshToken(refreshTokenRaw);
      await prisma.refreshToken.updateMany({
        where: { id: claims.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Already invalid/expired - nothing to revoke, logout still "succeeds" client-side.
    }
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always behave the same whether or not the email exists, to avoid user enumeration.
    if (!user || !user.isActive) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + env.RESET_TOKEN_EXPIRES_MIN * 60_000),
      },
    });

    // In production this token would be emailed to the user via a transactional email
    // provider. Returned here so the reset flow is testable end-to-end without one.
    return rawToken;
  },

  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = hashToken(input.token);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw AppError.badRequest("Reset link is invalid or has expired", "RESET_TOKEN_INVALID");
    }

    const passwordHash = await hashPassword(input.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await logActivity({ userId: resetToken.userId, action: "PASSWORD_RESET", entityType: "User", entityId: resetToken.userId });
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw AppError.badRequest("Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    }
    const passwordHash = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await logActivity({ userId, action: "PASSWORD_CHANGED", entityType: "User", entityId: userId });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return sanitizeUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({ where: { id: userId }, data: input });
    return sanitizeUser(user);
  },
};
