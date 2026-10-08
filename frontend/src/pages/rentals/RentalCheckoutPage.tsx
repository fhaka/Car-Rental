import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { useBooking } from "../../features/bookings/useBookings";
import { useCustomers } from "../../features/customers/useCustomers";
import { useVehicles } from "../../features/vehicles/useVehicles";
import { useCheckoutRental } from "../../features/rentals/useRentals";
import { toDateTimeLocalValue } from "../../lib/format";

interface FormValues {
  customerId: string;
  vehicleId: string;
  expectedReturnAt: string;
  startMileage: number;
  startFuelLevel: number;
  cleanliness: string;
  exteriorCondition: string;
  interiorCondition: string;
  tireCondition: string;
  windshieldCondition: string;
  notes: string;
}

const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR"];

export default function RentalCheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get("bookingId") ?? undefined;
  const { data: booking } = useBooking(bookingId);
  const { data: customers } = useCustomers({ pageSize: 100, isActive: true });
  const { data: availableVehicles } = useVehicles({ pageSize: 100, status: "AVAILABLE", isActive: true });
  const checkout = useCheckoutRental();

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      customerId: "",
      vehicleId: "",
      expectedReturnAt: toDateTimeLocalValue(new Date(Date.now() + 3 * 86400000)),
      startMileage: 0,
      startFuelLevel: 100,
      cleanliness: "GOOD",
      exteriorCondition: "GOOD",
      interiorCondition: "GOOD",
      tireCondition: "GOOD",
      windshieldCondition: "GOOD",
      notes: "",
    },
  });

  useEffect(() => {
    if (booking) {
      reset((prev) => ({
        ...prev,
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        expectedReturnAt: toDateTimeLocalValue(new Date(booking.returnAt)),
        startMileage: prev.startMileage,
      }));
    }
  }, [booking, reset]);

  const vehicleOptions = booking?.vehicle ? [booking.vehicle] : availableVehicles?.data ?? [];

  function onSubmit(values: FormValues) {
    checkout.mutate(
      {
        bookingId,
        customerId: values.customerId,
        vehicleId: values.vehicleId,
        expectedReturnAt: new Date(values.expectedReturnAt).toISOString(),
        startMileage: values.startMileage,
        startFuelLevel: values.startFuelLevel,
        condition: {
          cleanliness: values.cleanliness,
          exteriorCondition: values.exteriorCondition,
          interiorCondition: values.interiorCondition,
          tireCondition: values.tireCondition,
          windshieldCondition: values.windshieldCondition,
        },
        notes: values.notes,
      },
      { onSuccess: (rental) => navigate(`/rentals/${rental.id}`) }
    );
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Checkout"
        description={booking ? `Converting booking ${booking.bookingNumber} into an active rental` : "Walk-in rental checkout"}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Customer & Vehicle</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Customer" required>
              <select className="input" {...register("customerId", { required: true })} disabled={!!booking}>
                <option value="">Select customer</option>
                {customers?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Vehicle" required>
              <select className="input" {...register("vehicleId", { required: true })} disabled={!!booking}>
                <option value="">Select vehicle</option>
                {vehicleOptions.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.plateNumber})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Expected return" required>
              <input type="datetime-local" className="input" {...register("expectedReturnAt", { required: true })} />
            </FormField>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Pre-Rental Inspection</h3>
          <p className="mb-4 text-xs text-slate-400">
            Verify the customer's driver's license before continuing — expired or missing licenses are rejected by the server.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Starting mileage (km)" required>
              <input type="number" className="input" {...register("startMileage", { required: true, valueAsNumber: true })} />
            </FormField>
            <FormField label="Starting fuel level (%)" required>
              <input type="number" min={0} max={100} className="input" {...register("startFuelLevel", { required: true, valueAsNumber: true })} />
            </FormField>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(["cleanliness", "exteriorCondition", "interiorCondition", "tireCondition", "windshieldCondition"] as const).map((field) => (
              <FormField key={field} label={fieldLabel(field)}>
                <select className="input" {...register(field)}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormField>
            ))}
          </div>
          <div className="mt-4">
            <FormField label="Inspection notes">
              <textarea className="input" rows={3} {...register("notes")} />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={checkout.isPending}>
            Complete Checkout
          </button>
        </div>
      </form>
    </div>
  );
}

function fieldLabel(field: string) {
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
