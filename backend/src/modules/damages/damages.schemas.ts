import { z } from "zod";
import { DamageStatus } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const createDamageSchema = z.object({
  vehicleId: z.string().uuid(),
  rentalId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  description: z.string().min(1),
  location: z.string().min(1),
  photos: z.array(z.string()).optional(),
  estimatedRepairCost: z.coerce.number().min(0).optional(),
  customerResponsible: z.boolean().default(false),
  insuranceInvolved: z.boolean().default(false),
});

export const updateDamageSchema = z.object({
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  photos: z.array(z.string()).optional(),
  estimatedRepairCost: z.coerce.number().min(0).optional(),
  actualRepairCost: z.coerce.number().min(0).optional(),
  customerResponsible: z.boolean().optional(),
  insuranceInvolved: z.boolean().optional(),
  status: z.nativeEnum(DamageStatus).optional(),
});

export const listDamagesQuerySchema = paginationQuerySchema.extend({
  vehicleId: z.string().uuid().optional(),
  status: z.nativeEnum(DamageStatus).optional(),
});

export type CreateDamageInput = z.infer<typeof createDamageSchema>;
export type UpdateDamageInput = z.infer<typeof updateDamageSchema>;
export type ListDamagesQuery = z.infer<typeof listDamagesQuerySchema>;
