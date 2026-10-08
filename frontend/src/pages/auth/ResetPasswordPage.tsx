import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import { CarFront } from "lucide-react";
import { useResetPassword } from "../../features/auth/useAuth";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
            <CarFront size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Set a new password</h1>
        </div>

        {!token ? (
          <div className="card text-center text-sm text-slate-500">
            This link is missing a reset token. Please request a new one from the{" "}
            <Link to="/forgot-password" className="text-brand-600 underline">
              forgot password
            </Link>{" "}
            page.
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => resetPassword.mutate({ token, password: values.password }))} className="card space-y-4">
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" placeholder="••••••••" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? "Resetting…" : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
