import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { useCreateCustomer, useCustomer, useUpdateCustomer } from "../../features/customers/useCustomers";
import { toDateInputValue } from "../../lib/format";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(1, "Required"),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional(),
  driverLicenseNumber: z.string().optional(),
  driverLicenseIssueCountry: z.string().optional(),
  driverLicenseExpiry: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { data: existing } = useCustomer(id);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (existing?.customer) {
      const c = existing.customer;
      reset({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        address: c.address ?? "",
        city: c.city ?? "",
        country: c.country ?? "",
        dateOfBirth: c.dateOfBirth ? toDateInputValue(new Date(c.dateOfBirth)) : "",
        driverLicenseNumber: c.driverLicenseNumber ?? "",
        driverLicenseIssueCountry: c.driverLicenseIssueCountry ?? "",
        driverLicenseExpiry: c.driverLicenseExpiry ? toDateInputValue(new Date(c.driverLicenseExpiry)) : "",
        idType: c.idType ?? "",
        idNumber: c.idNumber ?? "",
        emergencyContactName: c.emergencyContactName ?? "",
        emergencyContactPhone: c.emergencyContactPhone ?? "",
        notes: c.notes ?? "",
      });
    }
  }, [existing, reset]);

  function onSubmit(values: FormValues) {
    if (isEdit && id) {
      updateCustomer.mutate({ id, input: values }, { onSuccess: () => navigate(`/customers/${id}`) });
    } else {
      createCustomer.mutate(values, { onSuccess: (c) => navigate(`/customers/${c.id}`) });
    }
  }

  return (
    <div>
      <PageHeader title={isEdit ? "Edit Customer" : "Add Customer"} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Contact Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="First name" required error={errors.firstName?.message}>
              <input className="input" {...register("firstName")} />
            </FormField>
            <FormField label="Last name" required error={errors.lastName?.message}>
              <input className="input" {...register("lastName")} />
            </FormField>
            <FormField label="Email" required error={errors.email?.message}>
              <input type="email" className="input" {...register("email")} />
            </FormField>
            <FormField label="Phone" required error={errors.phone?.message}>
              <input className="input" {...register("phone")} />
            </FormField>
            <FormField label="Date of birth">
              <input type="date" className="input" {...register("dateOfBirth")} />
            </FormField>
            <FormField label="Address">
              <input className="input" {...register("address")} />
            </FormField>
            <FormField label="City">
              <input className="input" {...register("city")} />
            </FormField>
            <FormField label="Country">
              <input className="input" {...register("country")} />
            </FormField>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Driver's License & Identification</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="License number">
              <input className="input" {...register("driverLicenseNumber")} />
            </FormField>
            <FormField label="Issuing country">
              <input className="input" {...register("driverLicenseIssueCountry")} />
            </FormField>
            <FormField label="License expiry">
              <input type="date" className="input" {...register("driverLicenseExpiry")} />
            </FormField>
            <FormField label="ID type">
              <input className="input" placeholder="Passport, National ID…" {...register("idType")} />
            </FormField>
            <FormField label="ID number">
              <input className="input" {...register("idNumber")} />
            </FormField>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">Emergency Contact & Notes</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Contact name">
              <input className="input" {...register("emergencyContactName")} />
            </FormField>
            <FormField label="Contact phone">
              <input className="input" {...register("emergencyContactPhone")} />
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
          <button type="submit" className="btn-primary" disabled={createCustomer.isPending || updateCustomer.isPending}>
            {isEdit ? "Save changes" : "Add customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
