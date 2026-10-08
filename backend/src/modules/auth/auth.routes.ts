import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimiters";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.post(
  "/forgot-password",
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword
);
authRouter.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);

authRouter.use(authenticate());
authRouter.get("/me", authController.me);
authRouter.patch("/me", validate({ body: updateProfileSchema }), authController.updateProfile);
authRouter.post("/change-password", validate({ body: changePasswordSchema }), authController.changePassword);
