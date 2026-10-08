import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { activityController } from "./activity.controller";
import { listActivityQuerySchema } from "./activity.schemas";

export const activityRouter = Router();

activityRouter.use(authenticate(), authorize(Role.ADMIN, Role.MANAGER));
activityRouter.get("/", validate({ query: listActivityQuerySchema }), activityController.list);
