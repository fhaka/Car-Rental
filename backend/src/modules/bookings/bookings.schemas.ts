import { z } from "zod";
import { BookingStatus } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const createBookingSchema = z
  .object({
    customerId: z.string().uuid(),
    vehicleId: z.string().uuid(),
    pickupAt: z.coerce.date(),
    returnAt: z.coerce.date(),
    pickupLocation: z.string().min(1),
    returnLocation: z.string().min(1),
    discount: z.coerce.number().min(0).default(0),
    additionalFees: z.coerce.number().min(0).default(0),
    securityDeposit: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    status: z.enum([BookingStatus.PENDING, BookingStatus.CONFIRMED]).default(BookingStatus.PENDING),
  })
  .refine((data) => data.returnAt > data.pickupAt, { message: "returnAt must be after pickupAt", path: ["returnAt"] });

export const updateBookingSchema = z
  .object({
    vehicleId: z.string().uuid().optional(),
    pickupAt: z.coerce.date().optional(),
    returnAt: z.coerce.date().optional(),
    pickupLocation: z.string().min(1).optional(),
    returnLocation: z.string().min(1).optional(),
    discount: z.coerce.number().min(0).optional(),
    additionalFees: z.coerce.number().min(0).optional(),
    securityDeposit: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => !(data.pickupAt && data.returnAt) || data.returnAt > data.pickupAt, {
    message: "returnAt must be after pickupAt",
    path: ["returnAt"],
  });

export const changeBookingStatusSchema = z.object({
  status: z.enum([BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]),
  reason: z.string().optional(),
});

export const listBookingsQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(BookingStatus).optional(),
  customerId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type ChangeBookingStatusInput = z.infer<typeof changeBookingStatusSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
