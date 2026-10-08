import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { transactionsService } from "./transactions.service";

export const transactionsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await transactionsService.list(req.query as never));
  }),
};
