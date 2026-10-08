import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { isProduction } from "../../config/env";
import { authService } from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body, req.ip);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ user, accessToken });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies?.[REFRESH_COOKIE_NAME],
      req.ip
    );
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ user, accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
    clearRefreshCookie(res);
    res.status(200).json({ message: "Logged out" });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const resetToken = await authService.forgotPassword(req.body.email);
    res.status(200).json({
      message: "If an account exists for this email, a password reset link has been sent.",
      // Only surfaced outside production so the flow can be exercised without a mail provider wired up.
      ...(isProduction ? {} : { devResetToken: resetToken }),
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    res.status(200).json({ message: "Password has been reset successfully" });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req.user!.sub, req.body);
    res.status(200).json({ message: "Password changed successfully" });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.sub);
    res.status(200).json({ user });
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.user!.sub, req.body);
    res.status(200).json({ user });
  }),
};
