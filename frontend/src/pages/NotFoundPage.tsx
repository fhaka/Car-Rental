import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p className="text-6xl font-bold text-brand-500">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-800">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/dashboard" className="btn-primary mt-6">
        Back to Dashboard
      </Link>
    </div>
  );
}
