import { ReactNode } from "react";
import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  changePct?: number;
  changeLabel?: string;
  icon?: ReactNode;
  tone?: "default" | "brand";
}

export function StatCard({ label, value, changePct, changeLabel, icon, tone = "default" }: StatCardProps) {
  const isPositive = (changePct ?? 0) >= 0;
  return (
    <div className={clsx("card flex flex-col gap-3", tone === "brand" && "bg-brand-500 text-white border-brand-500")}>
      <div className="flex items-center justify-between">
        <span className={clsx("text-sm font-medium", tone === "brand" ? "text-brand-50" : "text-slate-500")}>{label}</span>
        {icon && <div className={clsx("rounded-lg p-2", tone === "brand" ? "bg-white/15" : "bg-brand-50 text-brand-600")}>{icon}</div>}
      </div>
      <div className={clsx("text-2xl font-bold", tone === "brand" ? "text-white" : "text-slate-900")}>{value}</div>
      {changePct !== undefined && (
        <div className="flex items-center gap-1 text-xs">
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 font-semibold",
              tone === "brand" ? "text-white" : isPositive ? "text-emerald-600" : "text-red-500"
            )}
          >
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(changePct).toFixed(1)}%
          </span>
          <span className={tone === "brand" ? "text-brand-50" : "text-slate-400"}>{changeLabel ?? "vs yesterday"}</span>
        </div>
      )}
    </div>
  );
}
