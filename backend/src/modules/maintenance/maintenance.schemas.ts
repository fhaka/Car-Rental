import { z } from "zod";
import { MaintenanceStatus } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid(),
  serviceType: z.string().min(1),
  serviceDate: z.coerce.date(),
  mileage: z.coerce.number().int().min(0),
  cost: z.coerce.number().min(0).default(0),
  provider: z.string().optional(),
  description: z.string().optional(),
  nextServiceDate: z.coerce.date().optional(),
  nextServiceMileage: z.coerce.number().int().min(0).optional(),
  status: z.nativeEnum(MaintenanceStatus).default(MaintenanceStatus.SCHEDULED),
});

export const updateMaintenanceSchema = createMaintenanceSchema.partial();

export const listMaintenanceQuerySchema = paginationQuerySchema.extend({
  vehicleId: z.string().uuid().optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  upcoming: z.coerce.boolean().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuerySchema>;
