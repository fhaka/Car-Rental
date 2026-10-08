import { api } from "../../lib/api";
import { AuthUser } from "../../store/authStore";

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  login: (email: string, password: string) => api.post<LoginResponse>("/auth/login", { email, password }).then((r) => r.data),
  refresh: () => api.post<LoginResponse>("/auth/refresh").then((r) => r.data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<{ user: AuthUser }>("/auth/me").then((r) => r.data.user),
  forgotPassword: (email: string) => api.post<{ message: string; devResetToken?: string }>("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (token: string, password: string) => api.post("/auth/reset-password", { token, password }),
  changePassword: (currentPassword: string, newPassword: string) => api.post("/auth/change-password", { currentPassword, newPassword }),
  updateProfile: (input: Partial<Pick<AuthUser, "firstName" | "lastName" | "phone">>) =>
    api.patch<{ user: AuthUser }>("/auth/me", input).then((r) => r.data.user),
};
