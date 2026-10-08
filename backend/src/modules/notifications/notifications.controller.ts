import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await notificationsService.list(req.user!.sub, req.query as never));
  }),
  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationsService.markAsRead(req.params.id);
    res.json({ notification });
  }),
  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationsService.markAllAsRead(req.user!.sub);
    res.json({ message: "All notifications marked as read" });
  }),
};
