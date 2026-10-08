import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { vehicleCategoriesService } from "./vehicleCategories.service";

export const vehicleCategoriesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await vehicleCategoriesService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ category: await vehicleCategoriesService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await vehicleCategoriesService.create(req.body);
    await logActivity({ req, action: "CATEGORY_CREATED", entityType: "VehicleCategory", entityId: category.id });
    res.status(201).json({ category });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await vehicleCategoriesService.update(req.params.id, req.body);
    await logActivity({ req, action: "CATEGORY_UPDATED", entityType: "VehicleCategory", entityId: category.id });
    res.json({ category });
  }),
  archive: asyncHandler(async (req: Request, res: Response) => {
    const category = await vehicleCategoriesService.archive(req.params.id);
    await logActivity({ req, action: "CATEGORY_ARCHIVED", entityType: "VehicleCategory", entityId: category.id });
    res.json({ category });
  }),
};
