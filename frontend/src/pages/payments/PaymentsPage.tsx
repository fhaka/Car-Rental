import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";
import { usePayments, useCreatePayment } from "../../features/payments/usePayments";
import { useCustomers } from "../../features/customers/useCustomers";
import { useBookings } from "../../features/bookings/useBookings";
import { useRentals } from "../../features/rentals/useRentals";
import { formatCurrency, formatDateTime } from "../../lib/format";

const STATUS_OPTIONS = ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"];
const METHOD_OPTIONS = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"];

interface FormValues {
  customerId: string;
  bookingId: string;
  rentalId: string;
  amount: number;
  method: string;
  type: string;
  reference: string;
  notes: string;
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const { data, isLoading } = usePayments({ page, pageSize: 10, status: status || undefined, method: method || undefined });
  const { data: customers } = useCustomers({ pageSize: 200, isActive: true });

  const [modalOpen, setModalOpen] = useState(false);
  const createPayment = useCreatePayment();
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { customerId: "", bookingId: "", rentalId: "", amount: 0, method: "CASH", type: "PAYMENT", reference: "", notes: "" },
  });
  const watchedCustomerId = watch("customerId");

  const { data: customerBookings } = useBookings({ customerId: watchedCustomerId || undefined, pageSize: 50 });
  const { data: customerRentals } = useRentals({ customerId: watchedCustomerId || undefined, pageSize: 50 });

  function openCreate() {
    reset({ customerId: "", bookingId: "", rentalId: "", amount: 0, method: "CASH", type: "PAYMENT", reference: "", notes: "" });
    setModalOpen(true);
  }

  function onSubmit(values: FormValues) {
    createPayment.mutate(
      {
        customerId: values.customerId,
        bookingId: values.bookingId || undefined,
        rentalId: values.rentalId || undefined,
        amount: values.amount,
        method: values.method,
        type: values.type,
        reference: values.reference || undefined,
        notes: values.notes || undefined,
      },
      { onSuccess: () => setModalOpen(false) }
    );
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Record and track customer payments, deposits and refunds"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Record Payment
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <div className="flex flex-wrap gap-3">
          <select className="input !w-48" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select className="input !w-48" value={method} onChange={(e) => (setMethod(e.target.value), setPage(1))}>
            <option value="">All methods</option>
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(p) => p.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          emptyTitle="No payments found"
          columns={[
            { header: "Payment #", accessor: (p) => <span className="font-medium text-slate-800">{p.paymentNumber}</span> },
            { header: "Customer", accessor: (p) => (p.customer ? `${p.customer.firstName} ${p.customer.lastName}` : "—") },
            { header: "Amount", accessor: (p) => formatCurrency(p.amount) },
            { header: "Type", accessor: (p) => p.type.replace(/_/g, " ") },
            { header: "Method", accessor: (p) => p.method.replace(/_/g, " ") },
            { header: "Date", accessor: (p) => formatDateTime(p.createdAt) },
            { header: "Status", accessor: (p) => <StatusBadge status={p.status} /> },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Payment"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={createPayment.isPending}>
              Record Payment
            </button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="sm:col-span-2">
            <FormField label="Customer" required>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select className="input !pl-9" {...register("customerId", { required: true })}>
                  <option value="">Select customer</option>
                  {customers?.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} — {c.email}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>
          <FormField label="Related booking" hint="Optional">
            <select className="input" {...register("bookingId")} disabled={!watchedCustomerId}>
              <option value="">None</option>
              {customerBookings?.data.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bookingNumber} — {formatCurrency(b.remainingBalance)} due
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Related rental" hint="Optional">
            <select className="input" {...register("rentalId")} disabled={!watchedCustomerId}>
              <option value="">None</option>
              {customerRentals?.data.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rentalNumber} — {formatCurrency(r.finalAmount)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Amount" required>
            <input type="number" step="0.01" className="input" {...register("amount", { required: true, valueAsNumber: true })} />
          </FormField>
          <FormField label="Type">
            <select className="input" {...register("type")}>
              <option value="PAYMENT">Payment</option>
              <option value="DEPOSIT">Security deposit</option>
              <option value="DEPOSIT_REFUND">Deposit refund</option>
              <option value="REFUND">Refund</option>
            </select>
          </FormField>
          <FormField label="Method">
            <select className="input" {...register("method")}>
              {METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Reference / receipt #">
            <input className="input" {...register("reference")} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Notes">
              <textarea className="input" rows={2} {...register("notes")} />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
