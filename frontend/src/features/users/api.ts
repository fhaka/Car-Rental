import { api } from "../../lib/api";
import { Paginated, UserAccount } from "../../types";

export const usersApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<UserAccount>>("/users", { params }).then((r) => r.data),
  get: (id: string) => api.get<{ user: UserAccount }>(`/users/${id}`).then((r) => r.data.user),
  create: (input: Record<string, unknown>) => api.post<{ user: UserAccount }>("/users", input).then((r) => r.data.user),
  update: (id: string, input: Record<string, unknown>) => api.patch<{ user: UserAccount }>(`/users/${id}`, input).then((r) => r.data.user),
};
