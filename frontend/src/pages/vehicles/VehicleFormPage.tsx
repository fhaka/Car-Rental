import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { useCategories } from "../../features/categories/useCategories";
import { useCreateVehicle, useUpdateVehicle, useVehicle } from "../../features/vehicles/useVehicles";
import { toDateInputValue } from "../../lib/format";

const schema = z.object({
  plateNumber: z.string().min(1, "Required"),
  vin: z.string().min(1, "Required"),
  brand: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  year: z.coerce.number().int().min(1970).max(new Date().getFullYear() + 1),
  categoryId: z.string().min(1, "Required"),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"]),
  seats: z.coerce.number().int().min(1).max(30),
  doors: z.coerce.number().int().min(1).max(6),
  color: z.string().min(1, "Required"),
  mileage: z.coerce.number().int().min(0),
  dailyRate: z.coerce.number().positive("Must be greater than 0"),
  weeklyRate: z.coerce.number().optional(),
  securityDeposit: z.coerce.number().min(0),
  currentLocation: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  registrationExpiry: z.string().optional(),
  lastServiceDate: z.string().optional(),
  nextServiceDate: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function VehicleFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: vehicle } = useVehicle(id);
  const { data: categories } = useCategories({ pageSize: 100 });
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (vehicle) {
      reset({
        plateNumber: vehicle.plateNumber,
        vin: vehicle.vin,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        categoryId: vehicle.categoryId,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        seats: vehicle.seats,
        doors: vehicle.doors,
        color: vehicle.color,
        mileage: vehicle.mileage,
        dailyRate: Number(vehicle.dailyRate),
        weeklyRate: vehicle.weeklyRate ? Number(vehicle.weeklyRate) : undefined,
        securityDeposit: Number(vehicle.securityDeposit),
        currentLocation: vehicle.currentLocation ?? "",
        insuranceExpiry: vehicle.insuranceExpiry ? toDateInputValue(new Date(vehicle.insuranceExpiry)) : "",
        registrationExpiry: vehicle.registrationExpiry ? toDateInputValue(new Date(vehicle.registrationExpiry)) : "",
        lastServiceDate: vehicle.lastServiceDate ? toDateInputValue(new Date(vehicle.lastServiceDate)) : "",
        nextServiceDate: vehicle.nextServiceDate ? toDateInputValue(new Date(vehicle.nextServiceDate)) : "",
        notes: vehicle.notes ?? "",
      });
    }
  }, [vehicle, reset]);

  function onSubmit(values: FormValues) {
    if (isEdit && id) {
      updateVehicle.mutate({ id, input: values }, { onSuccess: () => navigate(`/vehicles/${id}`) });
    } else {
      createVehicle.mutate(values, { onSuccess: (v) => navigate(`/vehicles/${v.id}`) });
    }
  }

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Vehicle" : "Add Vehicle"} description="Vehicle details, pricing and documentation" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Plate number" required error={errors.plateNumber?.message}>
              <input className="input" {...register("plateNumber")} />
            </FormField>
            <FormField label="VIN" required error={errors.vin?.message}>
              <input className="input" {...register("vin")} />
            </FormField>
            <FormField label="Category" required error={errors.categoryId?.message}>
              <select className="input" {...register("categoryId")}>
                <option value="">Select category</option>
                {categories?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Brand" required error={errors.brand?.message}>
              <input className="input" {...register("brand")} />
            </FormField>
            <FormField label="Model" required error={errors.model?.message}>
              <input className="input" {...register("model")} />
            </FormField>
            <FormField label="Year" required error={errors.year?.message}>
              <input type="number" className="input" {...register("year")} />
            </FormField>
            <FormField label="Transmission" required>
              <select className="input" {...register("transmission")}>
                <option value="AUTOMATIC">Automatic</option>
                <option value="MANUAL">Manual</option>
              </select>
            </FormField>
            <FormField label="Fuel type" required>
              <select className="input" {...register("fuelType")}>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ELECTRIC">Electric</option>
                <option value="LPG">LPG</option>
              </select>
            </FormField>
            <FormField label="Seats" required error={errors.seats?.message}>
              <input type="number" className="input" {...register("seats")} />
            </FormField>
            <FormField label="Doors" required error={errors.doors?.message}>
              <input type="number" className="input" {...register("doors")} />
            </FormField>
            <FormField label="Color" required error={errors.color?.message}>
              <input className="input" {...register("color")} />
            </FormField>
            <FormField label="Mileage (km)" required error={errors.mileage?.message}>
              <input type="number" className="input" {...register("mileage")} />
            </FormField>
            <FormField label="Current location">
              <input className="input" {...register("currentLocation")} />
            </FormField>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Pricing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Daily rate" required error={errors.dailyRate?.message}>
              <input type="number" step="0.01" className="input" {...register("dailyRate")} />
            </FormField>
            <FormField label="Weekly rate">
              <input type="number" step="0.01" className="input" {...register("weeklyRate")} />
            </FormField>
            <FormField label="Security deposit" required error={errors.securityDeposit?.message}>
              <input type="number" step="0.01" className="input" {...register("securityDeposit")} />
            </FormField>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Documentation & Service</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Insurance expiry">
              <input type="date" className="input" {...register("insuranceExpiry")} />
            </FormField>
            <FormField label="Registration expiry">
              <input type="date" className="input" {...register("registrationExpiry")} />
            </FormField>
            <FormField label="Last service date">
              <input type="date" className="input" {...register("lastServiceDate")} />
            </FormField>
            <FormField label="Next service date">
              <input type="date" className="input" {...register("nextServiceDate")} />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Notes">
              <textarea className="input" rows={3} {...register("notes")} />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={createVehicle.isPending || updateVehicle.isPending}>
            {isEdit ? "Save changes" : "Add vehicle"}
          </button>
        </div>
      </form>
    </div>
  );
}
