import { z } from "zod";
import { FuelType, TransmissionType } from "@prisma/client";

/**
 * Public (customer-facing) API schemas. These power the marketing website and
 * the guest online-booking flow. They are intentionally narrower than the
 * staff schemas: the public never sets pricing, status, discounts, etc.
 */

export const listPublicVehiclesQuerySchema = z
  .object({
    pickupAt: z.coerce.date().optional(),
    returnAt: z.coerce.date().optional(),
    categoryId: z.string().uuid().optional(),
    transmission: z.nativeEnum(TransmissionType).optional(),
    fuelType: z.nativeEnum(FuelType).optional(),
    seats: z.coerce.number().int().min(1).max(20).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    search: z.string().trim().max(100).optional(),
    sort: z.enum(["price_asc", "price_desc", "newest"]).default("price_asc"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
  })
  .superRefine((d, ctx) => {
    if (Boolean(d.pickupAt) !== Boolean(d.returnAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pickup and return dates must be provided together", path: ["returnAt"] });
    }
    if (d.pickupAt && d.returnAt && d.returnAt <= d.pickupAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Return date must be after pickup date", path: ["returnAt"] });
    }
  });

export const publicVehicleQuerySchema = z
  .object({
    pickupAt: z.coerce.date().optional(),
    returnAt: z.coerce.date().optional(),
  })
  .superRefine((d, ctx) => {
    if (Boolean(d.pickupAt) !== Boolean(d.returnAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pickup and return dates must be provided together", path: ["returnAt"] });
    }
    if (d.pickupAt && d.returnAt && d.returnAt <= d.pickupAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Return date must be after pickup date", path: ["returnAt"] });
    }
  });

export const createPublicBookingSchema = z
  .object({
    vehicleId: z.string().uuid(),
    pickupAt: z.coerce.date(),
    returnAt: z.coerce.date(),
    pickupLocation: z.string().trim().min(1).max(200),
    returnLocation: z.string().trim().min(1).max(200),
    notes: z.string().trim().max(1000).optional(),
    customer: z.object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      email: z.string().trim().email().max(200),
      phone: z.string().trim().min(3).max(40),
      address: z.string().trim().max(200).optional(),
      city: z.string().trim().max(100).optional(),
      country: z.string().trim().max(100).optional(),
      driverLicenseNumber: z.string().trim().max(100).optional(),
    }),
  })
  .superRefine((d, ctx) => {
    if (d.returnAt <= d.pickupAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Return date must be after pickup date", path: ["returnAt"] });
    }
    if (d.pickupAt.getTime() <= Date.now() - 60 * 60 * 1000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pickup date must be in the future", path: ["pickupAt"] });
    }
  });

export type ListPublicVehiclesQuery = z.infer<typeof listPublicVehiclesQuerySchema>;
export type CreatePublicBookingInput = z.infer<typeof createPublicBookingSchema>;
