import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { expensesService } from "./expenses.service";

export const expensesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await expensesService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ expense: await expensesService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const expense = await expensesService.create(req.body, req.user!.sub);
    await logActivity({ req, action: "EXPENSE_CREATED", entityType: "Expense", entityId: expense.id, metadata: { amount: expense.amount } });
    res.status(201).json({ expense });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const expense = await expensesService.update(req.params.id, req.body);
    await logActivity({ req, action: "EXPENSE_UPDATED", entityType: "Expense", entityId: expense.id });
    res.json({ expense });
  }),
  archive: asyncHandler(async (req: Request, res: Response) => {
    const expense = await expensesService.archive(req.params.id);
    await logActivity({ req, action: "EXPENSE_ARCHIVED", entityType: "Expense", entityId: expense.id });
    res.json({ expense });
  }),
};
