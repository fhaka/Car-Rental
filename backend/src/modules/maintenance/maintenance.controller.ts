import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { maintenanceService } from "./maintenance.service";

export const maintenanceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await maintenanceService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ record: await maintenanceService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const record = await maintenanceService.create(req.body);
    await logActivity({ req, action: "MAINTENANCE_CREATED", entityType: "MaintenanceRecord", entityId: record.id });
    res.status(201).json({ record });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const record = await maintenanceService.update(req.params.id, req.body);
    await logActivity({ req, action: "MAINTENANCE_UPDATED", entityType: "MaintenanceRecord", entityId: record.id, metadata: req.body });
    res.json({ record });
  }),
};
