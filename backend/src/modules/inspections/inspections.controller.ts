import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { inspectionsService } from "./inspections.service";

export const inspectionsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await inspectionsService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ inspection: await inspectionsService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const inspection = await inspectionsService.create(req.body, req.user!.sub);
    await logActivity({ req, action: "INSPECTION_CREATED", entityType: "VehicleInspection", entityId: inspection.id });
    res.status(201).json({ inspection });
  }),
};
