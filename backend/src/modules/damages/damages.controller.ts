import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { damagesService } from "./damages.service";

export const damagesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await damagesService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ damage: await damagesService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const damage = await damagesService.create(req.body);
    await logActivity({ req, action: "DAMAGE_REPORTED", entityType: "DamageReport", entityId: damage.id });
    res.status(201).json({ damage });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const damage = await damagesService.update(req.params.id, req.body);
    await logActivity({ req, action: "DAMAGE_UPDATED", entityType: "DamageReport", entityId: damage.id, metadata: req.body });
    res.json({ damage });
  }),
};
