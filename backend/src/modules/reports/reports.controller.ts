import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { reportsService } from "./reports.service";

export const reportsController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    res.json(await reportsService.summary(req.query as never));
  }),
};
