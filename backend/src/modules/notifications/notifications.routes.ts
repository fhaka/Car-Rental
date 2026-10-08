import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { notificationsController } from "./notifications.controller";
import { listNotificationsQuerySchema } from "./notifications.schemas";

export const notificationsRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

notificationsRouter.use(authenticate());
notificationsRouter.get("/", validate({ query: listNotificationsQuerySchema }), notificationsController.list);
notificationsRouter.patch("/:id/read", validate({ params: idParams }), notificationsController.markAsRead);
notificationsRouter.post("/mark-all-read", notificationsController.markAllAsRead);
