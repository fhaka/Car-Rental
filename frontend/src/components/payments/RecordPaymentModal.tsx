import { useForm } from "react-hook-form";
import { Modal } from "../ui/Modal";
import { FormField } from "../ui/FormField";
import { useCreatePayment } from "../../features/payments/usePayments";

interface FormValues {
  amount: number;
  method: string;
  type: string;
  reference: string;
  notes: string;
}

export function RecordPaymentModal({
  open,
  onClose,
  customerId,
  bookingId,
  rentalId,
  suggestedAmount,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  bookingId?: string;
  rentalId?: string;
  suggestedAmount?: number;
}) {
  const createPayment = useCreatePayment();
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { amount: suggestedAmount ?? 0, method: "CASH", type: "PAYMENT", reference: "", notes: "" },
  });

  function onSubmit(values: FormValues) {
    createPayment.mutate(
      { ...values, customerId, bookingId, rentalId },
      {
        onSuccess: () => {
          onClose();
          reset();
        },
      }
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={createPayment.isPending}>
            Record Payment
          </button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
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
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="OTHER">Other</option>
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
  );
}
