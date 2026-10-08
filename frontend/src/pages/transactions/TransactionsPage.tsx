import { useState } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { useTransactions } from "../../features/transactions/useTransactions";
import { formatCurrency, formatDateTime } from "../../lib/format";
import clsx from "clsx";

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const { data, isLoading } = useTransactions({ page, pageSize: 15, type: type || undefined });

  const totalIncome = (data?.data ?? []).filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = (data?.data ?? []).filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <PageHeader title="Transactions" description="Full ledger of every income and expense transaction (auto-generated from payments and expenses)" />

      <div className="card mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className="input !w-48" value={type} onChange={(e) => (setType(e.target.value), setPage(1))}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <div className="ml-auto flex gap-6 text-sm">
            <span className="text-slate-500">
              Page income: <span className="font-semibold text-emerald-600">{formatCurrency(totalIncome)}</span>
            </span>
            <span className="text-slate-500">
              Page expense: <span className="font-semibold text-red-500">{formatCurrency(totalExpense)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(t) => t.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          emptyTitle="No transactions found"
          columns={[
            { header: "Date", accessor: (t) => formatDateTime(t.occurredAt) },
            { header: "Type", accessor: (t) => (
              <span className={clsx("badge", t.type === "INCOME" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>{t.type}</span>
            ) },
            { header: "Category", accessor: (t) => t.category.replace(/_/g, " ") },
            { header: "Description", accessor: (t) => t.description ?? "—" },
            { header: "Reference", accessor: (t) => t.relatedPayment?.paymentNumber ?? t.relatedExpense?.description ?? "—" },
            {
              header: "Amount",
              accessor: (t) => (
                <span className={clsx("font-medium", t.type === "INCOME" ? "text-emerald-600" : "text-red-500")}>
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </span>
              ),
            },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>
    </div>
  );
}
