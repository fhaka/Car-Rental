import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { damagesController } from "./damages.controller";
import { createDamageSchema, listDamagesQuerySchema, updateDamageSchema } from "./damages.schemas";

export const damagesRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

damagesRouter.use(authenticate());
damagesRouter.get("/", validate({ query: listDamagesQuerySchema }), damagesController.list);
damagesRouter.get("/:id", validate({ params: idParams }), damagesController.get);
damagesRouter.post("/", validate({ body: createDamageSchema }), damagesController.create);
damagesRouter.patch("/:id", validate({ params: idParams, body: updateDamageSchema }), damagesController.update);
