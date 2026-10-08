import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { expensesController } from "./expenses.controller";
import { createExpenseSchema, listExpensesQuerySchema, updateExpenseSchema } from "./expenses.schemas";

export const expensesRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

expensesRouter.use(authenticate());
expensesRouter.get("/", validate({ query: listExpensesQuerySchema }), expensesController.list);
expensesRouter.get("/:id", validate({ params: idParams }), expensesController.get);
expensesRouter.post("/", authorize(Role.ADMIN, Role.MANAGER), validate({ body: createExpenseSchema }), expensesController.create);
expensesRouter.patch(
  "/:id",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ params: idParams, body: updateExpenseSchema }),
  expensesController.update
);
expensesRouter.post("/:id/archive", authorize(Role.ADMIN, Role.MANAGER), validate({ params: idParams }), expensesController.archive);
