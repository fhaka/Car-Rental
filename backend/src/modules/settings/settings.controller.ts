import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { settingsService } from "./settings.service";

export const settingsController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ settings: await settingsService.getSettings() });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.updateSettings(req.body);
    await logActivity({ req, action: "SETTINGS_UPDATED", entityType: "CompanySettings", entityId: settings.id, metadata: req.body });
    res.json({ settings });
  }),
};
