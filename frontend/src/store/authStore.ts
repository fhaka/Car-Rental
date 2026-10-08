import { create } from "zustand";

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitializing: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string | null) => void;
  setInitializing: (v: boolean) => void;
  clear: () => void;
}

/**
 * Access token lives in memory only (never localStorage) - on a hard page
 * reload the app silently calls /auth/refresh using the httpOnly refresh
 * cookie to obtain a fresh one. See lib/api.ts and App.tsx.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitializing: true,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  clear: () => set({ user: null, accessToken: null }),
}));
