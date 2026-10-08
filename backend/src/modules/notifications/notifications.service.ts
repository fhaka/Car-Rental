import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { ListNotificationsQuery } from "./notifications.schemas";

export const notificationsService = {
  /** Notifications visible to a user: their own plus system-wide (userId = null) broadcasts. */
  async list(userId: string, query: ListNotificationsQuery) {
    const { page, pageSize, isRead, type } = query;
    const where: Prisma.NotificationWhereInput = {
      OR: [{ userId }, { userId: null }],
      ...(isRead !== undefined ? { isRead } : {}),
      ...(type ? { type } : {}),
    };
    const [data, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, ...paginationSkipTake(page, pageSize) }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { OR: [{ userId }, { userId: null }], isRead: false } }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total), unreadCount };
  },

  async markAsRead(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw AppError.notFound("Notification not found");
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { OR: [{ userId }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
  },

  /** Creates a notification, but skips it if an unread one for the same type+entity was created recently (avoids spam from repeated scheduler runs). */
  async createOnce(params: {
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityType: string;
    relatedEntityId: string;
    userId?: string | null;
    dedupeWindowHours?: number;
  }) {
    const since = new Date(Date.now() - (params.dedupeWindowHours ?? 20) * 60 * 60 * 1000);
    const existing = await prisma.notification.findFirst({
      where: {
        type: params.type,
        relatedEntityType: params.relatedEntityType,
        relatedEntityId: params.relatedEntityId,
        createdAt: { gte: since },
      },
    });
    if (existing) return existing;
    return prisma.notification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        relatedEntityType: params.relatedEntityType,
        relatedEntityId: params.relatedEntityId,
        userId: params.userId ?? null,
      },
    });
  },
};
