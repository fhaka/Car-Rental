import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { usersService } from "./users.service";

export const usersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await usersService.list(req.query as never);
    res.json(result);
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.get(req.params.id);
    res.json({ user });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.create(req.body);
    await logActivity({ req, action: "USER_CREATED", entityType: "User", entityId: user.id });
    res.status(201).json({ user });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await usersService.update(req.params.id, req.body, req.user!.sub);
    await logActivity({ req, action: "USER_UPDATED", entityType: "User", entityId: user.id, metadata: req.body });
    res.json({ user });
  }),
};
