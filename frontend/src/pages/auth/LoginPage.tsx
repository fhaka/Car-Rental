import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { CarFront, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useLogin } from "../../features/auth/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
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
          <h1 className="text-xl font-bold text-slate-900">V Car Rent</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your fleet dashboard</p>
        </div>

        <form onSubmit={handleSubmit((values) => login.mutate(values))} className="card space-y-4">
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@company.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Password</label>
              <Link to="/forgot-password" className="mb-1.5 text-xs font-medium text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input className="input pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
            {login.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Demo accounts (after seeding): admin@vcarrent.al / manager@vcarrent.al / employee1@vcarrent.al — password Password123!
        </p>
      </div>
    </div>
  );
}
