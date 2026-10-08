import { z } from "zod";
import { PaymentMethod, PaymentStatus, PaymentType } from "@prisma/client";
import { paginationQuerySchema } from "../../utils/pagination";

export const createPaymentSchema = z
  .object({
    bookingId: z.string().uuid().optional(),
    rentalId: z.string().uuid().optional(),
    customerId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    method: z.nativeEnum(PaymentMethod),
    type: z.nativeEnum(PaymentType).default(PaymentType.PAYMENT),
    status: z.nativeEnum(PaymentStatus).default(PaymentStatus.COMPLETED),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.bookingId || data.rentalId, {
    message: "Either bookingId or rentalId must be provided",
    path: ["bookingId"],
  });

export const listPaymentsQuerySchema = paginationQuerySchema.extend({
  bookingId: z.string().uuid().optional(),
  rentalId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
