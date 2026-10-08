import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { settingsController } from "./settings.controller";
import { updateSettingsSchema } from "./settings.schemas";

export const settingsRouter = Router();

settingsRouter.use(authenticate());
settingsRouter.get("/", settingsController.get);
settingsRouter.patch("/", authorize(Role.ADMIN), validate({ body: updateSettingsSchema }), settingsController.update);
