import { z } from "zod";
import { NotificationType } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  isRead: z.coerce.boolean().optional(),
  type: z.nativeEnum(NotificationType).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
