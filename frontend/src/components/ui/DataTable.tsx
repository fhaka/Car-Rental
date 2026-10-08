import { ReactNode } from "react";
import { TableSkeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { Inbox } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}

export function DataTable<T>({ columns, data, isLoading, emptyTitle = "No records found", emptyDescription, onRowClick, rowKey }: DataTableProps<T>) {
  if (isLoading) return <TableSkeleton cols={columns.length} />;

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} icon={<Inbox size={40} strokeWidth={1.5} />} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left">
            {columns.map((col, i) => (
              <th key={i} className={`px-4 py-3 font-medium text-slate-500 whitespace-nowrap ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-50 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
            >
              {columns.map((col, i) => (
                <td key={i} className={`px-4 py-3.5 text-slate-700 whitespace-nowrap ${col.className ?? ""}`}>
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
