import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { reportsController } from "./reports.controller";
import { reportsQuerySchema } from "./reports.schemas";

export const reportsRouter = Router();

reportsRouter.use(authenticate());
reportsRouter.get("/summary", validate({ query: reportsQuerySchema }), reportsController.summary);
