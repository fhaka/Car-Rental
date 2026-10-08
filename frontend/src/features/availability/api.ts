import { api } from "../../lib/api";
import { Paginated, Vehicle } from "../../types";

export const availabilityApi = {
  search: (params: Record<string, unknown>) => api.get<Paginated<Vehicle>>("/availability", { params }).then((r) => r.data),
};
