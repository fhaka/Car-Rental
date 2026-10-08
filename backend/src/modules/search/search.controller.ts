import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { searchService } from "./search.service";

export const searchController = {
  search: asyncHandler(async (req: Request, res: Response) => {
    res.json(await searchService.search(String(req.query.q)));
  }),
};
