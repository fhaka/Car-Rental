import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { transactionsController } from "./transactions.controller";
import { listTransactionsQuerySchema } from "./transactions.schemas";

export const transactionsRouter = Router();

transactionsRouter.use(authenticate());
transactionsRouter.get("/", validate({ query: listTransactionsQuerySchema }), transactionsController.list);
