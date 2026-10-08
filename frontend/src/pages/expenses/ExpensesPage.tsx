import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Archive } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";
import { useArchiveExpense, useCreateExpense, useExpenses, useUpdateExpense } from "../../features/expenses/useExpenses";
import { useVehicles } from "../../features/vehicles/useVehicles";
import { formatCurrency, formatDate, toDateInputValue } from "../../lib/format";
import { Expense } from "../../types";

const CATEGORIES = [
  "MAINTENANCE",
  "REPAIRS",
  "FUEL",
  "INSURANCE",
  "REGISTRATION",
  "CLEANING",
  "SALARIES",
  "RENT",
  "UTILITIES",
  "MARKETING",
  "OPERATIONAL",
  "OTHER",
];

interface FormValues {
  date: string;
  amount: number;
  category: string;
  description: string;
  vendor: string;
  vehicleId: string;
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const { data, isLoading } = useExpenses({ page, pageSize: 10, category: category || undefined });
  const { data: vehicles } = useVehicles({ pageSize: 100 });

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const archiveExpense = useArchiveExpense();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Expense | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  function openCreate() {
    setEditing(null);
    reset({ date: toDateInputValue(new Date()), amount: 0, category: "OPERATIONAL", description: "", vendor: "", vehicleId: "" });
    setModalOpen(true);
  }
  function openEdit(expense: Expense) {
    setEditing(expense);
    reset({
      date: expense.date.slice(0, 10),
      amount: Number(expense.amount),
      category: expense.category,
      description: expense.description,
      vendor: expense.vendor ?? "",
      vehicleId: expense.vehicleId ?? "",
    });
    setModalOpen(true);
  }

  function onSubmit(values: FormValues) {
    const input = { ...values, vehicleId: values.vehicleId || undefined };
    if (editing) {
      updateExpense.mutate({ id: editing.id, input }, { onSuccess: () => setModalOpen(false) });
    } else {
      createExpense.mutate(input, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track operational costs; every expense is posted to the transaction ledger automatically"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Expense
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <select className="input !w-56" value={category} onChange={(e) => (setCategory(e.target.value), setPage(1))}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(e) => e.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={openEdit}
          emptyTitle="No expenses recorded"
          columns={[
            { header: "Date", accessor: (e) => formatDate(e.date) },
            { header: "Category", accessor: (e) => e.category.replace(/_/g, " ") },
            { header: "Description", accessor: (e) => e.description },
            { header: "Vehicle", accessor: (e) => (e.vehicle ? `${e.vehicle.brand} ${e.vehicle.model}` : "—") },
            { header: "Vendor", accessor: (e) => e.vendor ?? "—" },
            { header: "Amount", accessor: (e) => formatCurrency(e.amount) },
            {
              header: "",
              accessor: (e) => (
                <button
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                  title="Archive"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setArchiveTarget(e);
                  }}
                >
                  <Archive size={16} />
                </button>
              ),
            },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Expense" : "Add Expense"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)}>
              Save
            </button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Date" required>
            <input type="date" className="input" {...register("date", { required: true })} />
          </FormField>
          <FormField label="Amount" required>
            <input type="number" step="0.01" className="input" {...register("amount", { required: true, valueAsNumber: true })} />
          </FormField>
          <FormField label="Category" required>
            <select className="input" {...register("category", { required: true })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Related vehicle" hint="Optional">
            <select className="input" {...register("vehicleId")}>
              <option value="">None</option>
              {vehicles?.data.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.plateNumber})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Vendor">
            <input className="input" {...register("vendor")} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Description" required>
              <textarea className="input" rows={2} {...register("description", { required: true })} />
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && archiveExpense.mutate(archiveTarget.id, { onSuccess: () => setArchiveTarget(null) })}
        title="Archive expense"
        message={`Archive "${archiveTarget?.description}"? Archived expenses are hidden from lists but remain in reports.`}
        confirmLabel="Archive"
        loading={archiveExpense.isPending}
      />
    </div>
  );
}
