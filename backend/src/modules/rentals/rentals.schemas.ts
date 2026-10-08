import { z } from "zod";
import { ConditionRating, RentalStatus } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

const conditionSchema = z.object({
  cleanliness: z.nativeEnum(ConditionRating),
  exteriorCondition: z.nativeEnum(ConditionRating),
  interiorCondition: z.nativeEnum(ConditionRating),
  tireCondition: z.nativeEnum(ConditionRating),
  windshieldCondition: z.nativeEnum(ConditionRating),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const checkoutRentalSchema = z.object({
  bookingId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  checkoutAt: z.coerce.date().optional(),
  expectedReturnAt: z.coerce.date(),
  startMileage: z.coerce.number().int().min(0),
  startFuelLevel: z.coerce.number().int().min(0).max(100),
  condition: conditionSchema,
  notes: z.string().optional(),
});

export const extendRentalSchema = z.object({
  newExpectedReturnAt: z.coerce.date(),
});

export const checkinRentalSchema = z.object({
  actualReturnAt: z.coerce.date().optional(),
  returnMileage: z.coerce.number().int().min(0),
  returnFuelLevel: z.coerce.number().int().min(0).max(100),
  condition: conditionSchema,
  additionalCharges: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  newDamages: z
    .array(
      z.object({
        description: z.string().min(1),
        location: z.string().min(1),
        estimatedRepairCost: z.coerce.number().min(0).optional(),
        customerResponsible: z.boolean().default(true),
        photos: z.array(z.string()).optional(),
      })
    )
    .optional()
    .default([]),
  requiresMaintenance: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export const cancelRentalSchema = z.object({
  reason: z.string().optional(),
});

export const listRentalsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(RentalStatus).optional(),
  customerId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
});

export type CheckoutRentalInput = z.infer<typeof checkoutRentalSchema>;
export type ExtendRentalInput = z.infer<typeof extendRentalSchema>;
export type CheckinRentalInput = z.infer<typeof checkinRentalSchema>;
export type ListRentalsQuery = z.infer<typeof listRentalsQuerySchema>;
