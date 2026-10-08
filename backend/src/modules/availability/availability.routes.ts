import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { availabilityController } from "./availability.controller";
import { availabilitySearchSchema } from "./availability.schemas";

export const availabilityRouter = Router();

availabilityRouter.use(authenticate());
availabilityRouter.get("/", validate({ query: availabilitySearchSchema }), availabilityController.search);
