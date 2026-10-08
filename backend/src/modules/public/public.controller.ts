import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { publicService } from "./public.service";

export const publicController = {
  company: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await publicService.getCompany());
  }),
  categories: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await publicService.listCategories());
  }),
  listVehicles: asyncHandler(async (req: Request, res: Response) => {
    res.json(await publicService.listVehicles(req.query as never));
  }),
  getVehicle: asyncHandler(async (req: Request, res: Response) => {
    const { pickupAt, returnAt } = req.query as unknown as { pickupAt?: Date; returnAt?: Date };
    res.json(await publicService.getVehicle(req.params.id, { pickupAt, returnAt }));
  }),
  createBooking: asyncHandler(async (req: Request, res: Response) => {
    const result = await publicService.createBooking(req.body);
    res.status(201).json(result);
  }),
};
