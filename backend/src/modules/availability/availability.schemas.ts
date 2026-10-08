import { z } from "zod";
import { FuelType, TransmissionType } from "@prisma/client";

export const availabilitySearchSchema = z
  .object({
    pickupAt: z.coerce.date(),
    returnAt: z.coerce.date(),
    pickupLocation: z.string().optional(),
    returnLocation: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    transmission: z.nativeEnum(TransmissionType).optional(),
    fuelType: z.nativeEnum(FuelType).optional(),
    seats: z.coerce.number().int().optional(),
    excludeBookingId: z.string().uuid().optional(),
    excludeRentalId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine((data) => data.returnAt > data.pickupAt, {
    message: "returnAt must be after pickupAt",
    path: ["returnAt"],
  });

export type AvailabilitySearchInput = z.infer<typeof availabilitySearchSchema>;
