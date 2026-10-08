import { z } from "zod";
import { FuelType, TransmissionType, VehicleStatus } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  vin: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1970).max(new Date().getFullYear() + 1),
  categoryId: z.string().uuid(),
  transmission: z.nativeEnum(TransmissionType),
  fuelType: z.nativeEnum(FuelType),
  seats: z.coerce.number().int().min(1).max(30),
  doors: z.coerce.number().int().min(1).max(6),
  color: z.string().min(1),
  mileage: z.coerce.number().int().min(0).default(0),
  dailyRate: z.coerce.number().positive(),
  weeklyRate: z.coerce.number().positive().optional(),
  securityDeposit: z.coerce.number().min(0).default(0),
  currentLocation: z.string().optional(),
  insuranceExpiry: z.coerce.date().optional(),
  registrationExpiry: z.coerce.date().optional(),
  lastServiceDate: z.coerce.date().optional(),
  nextServiceDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const changeVehicleStatusSchema = z.object({
  status: z.enum([VehicleStatus.AVAILABLE, VehicleStatus.MAINTENANCE, VehicleStatus.INACTIVE]),
  notes: z.string().optional(),
});

export const listVehiclesQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(VehicleStatus).optional(),
  categoryId: z.string().uuid().optional(),
  transmission: z.nativeEnum(TransmissionType).optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minSeats: z.coerce.number().optional(),
  isActive: z.coerce.boolean().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;
export type ChangeVehicleStatusInput = z.infer<typeof changeVehicleStatusSchema>;
