import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { Skeleton } from "../../components/ui/Skeleton";
import { useSettings, useUpdateSettings } from "../../features/settings/useSettings";
import { CompanySettings } from "../../types";

type FormValues = Omit<CompanySettings, "id">;

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (data) {
      reset({
        companyName: data.companyName,
        logoUrl: data.logoUrl ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        website: data.website ?? "",
        taxNumber: data.taxNumber ?? "",
        currency: data.currency,
        taxPercentage: Number(data.taxPercentage),
        defaultSecurityDeposit: Number(data.defaultSecurityDeposit),
        lateFeePerDay: Number(data.lateFeePerDay),
        mileageFeePerUnit: Number(data.mileageFeePerUnit),
        freeMileagePerDay: data.freeMileagePerDay,
        fuelChargePerUnit: Number(data.fuelChargePerUnit),
        cancellationPolicy: data.cancellationPolicy ?? "",
        rentalTerms: data.rentalTerms ?? "",
        invoiceFooter: data.invoiceFooter ?? "",
      });
    }
  }, [data, reset]);

  function onSubmit(values: FormValues) {
    updateSettings.mutate(values as Partial<CompanySettings>);
  }

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Company Settings" description="Business information and default pricing rules used across the platform" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Company Settings" description="Business information and default pricing rules used across the platform" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Company Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Company name" required>
              <input className="input" {...register("companyName", { required: true })} />
            </FormField>
            <FormField label="Currency" required>
              <input className="input" maxLength={3} {...register("currency", { required: true })} />
            </FormField>
            <FormField label="Phone">
              <input className="input" {...register("phone")} />
            </FormField>
            <FormField label="Email">
              <input type="email" className="input" {...register("email")} />
            </FormField>
            <FormField label="Website">
              <input className="input" {...register("website")} />
            </FormField>
            <FormField label="Tax / registration number">
              <input className="input" {...register("taxNumber")} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Address">
                <input className="input" {...register("address")} />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Logo URL">
                <input className="input" {...register("logoUrl")} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Default Pricing Rules</h3>
          <p className="mb-4 text-xs text-slate-400">
            These defaults are applied by the server when calculating booking totals and rental return charges. They do not retroactively affect existing records.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Tax percentage (%)">
              <input type="number" step="0.01" className="input" {...register("taxPercentage", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Default security deposit">
              <input type="number" step="0.01" className="input" {...register("defaultSecurityDeposit", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Late fee per day">
              <input type="number" step="0.01" className="input" {...register("lateFeePerDay", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Free mileage per day">
              <input type="number" className="input" {...register("freeMileagePerDay", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Mileage fee per extra unit">
              <input type="number" step="0.01" className="input" {...register("mileageFeePerUnit", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Fuel charge per unit">
              <input type="number" step="0.01" className="input" {...register("fuelChargePerUnit", { valueAsNumber: true })} />
            </FormField>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Policies & Documents</h3>
          <div className="space-y-4">
            <FormField label="Cancellation policy">
              <textarea className="input" rows={3} {...register("cancellationPolicy")} />
            </FormField>
            <FormField label="Rental terms & conditions">
              <textarea className="input" rows={4} {...register("rentalTerms")} />
            </FormField>
            <FormField label="Invoice footer text">
              <textarea className="input" rows={2} {...register("invoiceFooter")} />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={updateSettings.isPending}>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
