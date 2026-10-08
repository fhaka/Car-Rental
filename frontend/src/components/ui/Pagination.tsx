import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationMeta } from "../../types";

export function Pagination({ meta, onPageChange }: { meta: PaginationMeta; onPageChange: (page: number) => void }) {
  if (meta.totalPages <= 1) return null;
  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span>–<span className="font-medium text-slate-700">{to}</span> of{" "}
        <span className="font-medium text-slate-700">{meta.total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary !px-2.5 !py-1.5"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-slate-600">
          Page {meta.page} of {meta.totalPages}
        </span>
        <button
          className="btn-secondary !px-2.5 !py-1.5"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
