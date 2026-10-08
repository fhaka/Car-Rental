import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { paymentsController } from "./payments.controller";
import { createPaymentSchema, listPaymentsQuerySchema } from "./payments.schemas";

export const paymentsRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

paymentsRouter.use(authenticate());
paymentsRouter.get("/", validate({ query: listPaymentsQuerySchema }), paymentsController.list);
paymentsRouter.get("/:id", validate({ params: idParams }), paymentsController.get);
paymentsRouter.post("/", validate({ body: createPaymentSchema }), paymentsController.create);
