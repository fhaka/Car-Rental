import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { dashboardController } from "./dashboard.controller";
import { dashboardQuerySchema } from "./dashboard.schemas";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate());
dashboardRouter.get("/", validate({ query: dashboardQuerySchema }), dashboardController.summary);
