import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { availabilityService } from "./availability.service";

export const availabilityController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    res.json(await availabilityService.search(req.query as never));
  }),
};
