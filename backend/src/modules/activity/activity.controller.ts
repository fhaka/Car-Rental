import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { activityService } from "./activity.service";

export const activityController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await activityService.list(req.query as never));
  }),
};
