import { api } from "../../lib/api";
import { AppNotification, Paginated } from "../../types";

export interface NotificationsResponse extends Paginated<AppNotification> {
  unreadCount: number;
}

export const notificationsApi = {
  list: (params: Record<string, unknown> = {}) => api.get<NotificationsResponse>("/notifications", { params }).then((r) => r.data),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post("/notifications/mark-all-read"),
};
