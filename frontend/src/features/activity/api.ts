import { api } from "../../lib/api";
import { ActivityLogEntry, Paginated } from "../../types";

export const activityApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<ActivityLogEntry>>("/activity", { params }).then((r) => r.data),
};
