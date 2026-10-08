import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createCustomerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  driverLicenseNumber: z.string().optional(),
  driverLicenseIssueCountry: z.string().optional(),
  driverLicenseExpiry: z.coerce.date().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  isActive: z.coerce.boolean().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
