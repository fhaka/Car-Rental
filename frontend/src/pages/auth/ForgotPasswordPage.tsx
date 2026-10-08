import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { CarFront, ArrowLeft } from "lucide-react";
import { useForgotPassword } from "../../features/auth/useAuth";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
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
          <h1 className="text-xl font-bold text-slate-900">Reset your password</h1>
          <p className="mt-1 text-center text-sm text-slate-500">Enter your email and we'll send you a reset link</p>
        </div>

        {forgotPassword.isSuccess ? (
          <div className="card text-center">
            <p className="text-sm text-slate-600">{forgotPassword.data?.message}</p>
            {forgotPassword.data?.devResetToken && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-left">
                <p className="text-xs font-medium text-slate-500">Development mode reset link:</p>
                <Link to={`/reset-password?token=${forgotPassword.data.devResetToken}`} className="break-all text-xs text-brand-600 underline">
                  /reset-password?token={forgotPassword.data.devResetToken}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => forgotPassword.mutate(values.email))} className="card space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@company.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> Back to login
        </Link>
      </div>
    </div>
  );
}
