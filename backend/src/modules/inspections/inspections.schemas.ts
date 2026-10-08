import { z } from "zod";
import { ConditionRating, InspectionType } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const createInspectionSchema = z.object({
  vehicleId: z.string().uuid(),
  rentalId: z.string().uuid().optional(),
  type: z.nativeEnum(InspectionType),
  mileage: z.coerce.number().int().min(0),
  fuelLevel: z.coerce.number().int().min(0).max(100),
  cleanliness: z.nativeEnum(ConditionRating),
  exteriorCondition: z.nativeEnum(ConditionRating),
  interiorCondition: z.nativeEnum(ConditionRating),
  tireCondition: z.nativeEnum(ConditionRating),
  windshieldCondition: z.nativeEnum(ConditionRating),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const listInspectionsQuerySchema = paginationQuerySchema.extend({
  vehicleId: z.string().uuid().optional(),
  rentalId: z.string().uuid().optional(),
  type: z.nativeEnum(InspectionType).optional(),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type ListInspectionsQuery = z.infer<typeof listInspectionsQuerySchema>;
