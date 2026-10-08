import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { authApi } from "./api";
import { useAuthStore } from "../../store/authStore";
import { getApiErrorMessage } from "../../lib/api";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Invalid email or password")),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clear();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success("Password reset successfully. Please log in.");
      navigate("/login", { replace: true });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "This reset link is invalid or has expired")),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => toast.success("Password changed successfully"),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateProfile() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      if (accessToken) setAuth(user, accessToken);
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
