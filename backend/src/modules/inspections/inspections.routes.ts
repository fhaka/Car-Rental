import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { inspectionsController } from "./inspections.controller";
import { createInspectionSchema, listInspectionsQuerySchema } from "./inspections.schemas";

export const inspectionsRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

inspectionsRouter.use(authenticate());
inspectionsRouter.get("/", validate({ query: listInspectionsQuerySchema }), inspectionsController.list);
inspectionsRouter.get("/:id", validate({ params: idParams }), inspectionsController.get);
inspectionsRouter.post("/", validate({ body: createInspectionSchema }), inspectionsController.create);
