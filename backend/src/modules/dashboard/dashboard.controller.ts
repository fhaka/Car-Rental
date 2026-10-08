import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    res.json(await dashboardService.getSummary(req.query as never));
  }),
};
