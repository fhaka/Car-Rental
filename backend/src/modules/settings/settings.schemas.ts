import { z } from "zod";

export const updateSettingsSchema = z.object({
  companyName: z.string().min(1).optional(),
  logoUrl: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  currency: z.string().min(1).optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
  defaultSecurityDeposit: z.coerce.number().min(0).optional(),
  lateFeePerDay: z.coerce.number().min(0).optional(),
  mileageFeePerUnit: z.coerce.number().min(0).optional(),
  freeMileagePerDay: z.coerce.number().int().min(0).optional(),
  fuelChargePerUnit: z.coerce.number().min(0).optional(),
  cancellationPolicy: z.string().optional(),
  rentalTerms: z.string().optional(),
  invoiceFooter: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
