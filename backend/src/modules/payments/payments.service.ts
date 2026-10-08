import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildPaginationMeta, paginationSkipTake } from "../../utils/pagination";
import { generatePaymentNumber } from "../../utils/idGenerators";
import { toNumber, round2 } from "../../utils/money";
import { CreatePaymentInput, ListPaymentsQuery } from "./payments.schemas";

const INCLUDE_DEFAULT = {
  customer: { select: { id: true, firstName: true, lastName: true } },
  receivedBy: { select: { id: true, firstName: true, lastName: true } },
  booking: { select: { id: true, bookingNumber: true } },
  rental: { select: { id: true, rentalNumber: true } },
} satisfies Prisma.PaymentInclude;

export const paymentsService = {
  async list(query: ListPaymentsQuery) {
    const { page, pageSize, bookingId, rentalId, customerId, status, method, sortBy, sortOrder } = query;
    const where: Prisma.PaymentWhereInput = {
      ...(bookingId ? { bookingId } : {}),
      ...(rentalId ? { rentalId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...(method ? { method } : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: INCLUDE_DEFAULT,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        ...paginationSkipTake(page, pageSize),
      }),
      prisma.payment.count({ where }),
    ]);
    return { data, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async get(id: string) {
    const payment = await prisma.payment.findUnique({ where: { id }, include: INCLUDE_DEFAULT });
    if (!payment) throw AppError.notFound("Payment not found");
    return payment;
  },

  async create(input: CreatePaymentInput, receivedById: string) {
    const [booking, rental] = await Promise.all([
      input.bookingId ? prisma.booking.findUnique({ where: { id: input.bookingId } }) : null,
      input.rentalId ? prisma.rental.findUnique({ where: { id: input.rentalId } }) : null,
    ]);
    if (input.bookingId && !booking) throw AppError.badRequest("Booking not found", "BOOKING_NOT_FOUND");
    if (input.rentalId && !rental) throw AppError.badRequest("Rental not found", "RENTAL_NOT_FOUND");

    const isRefund = input.type === "REFUND" || input.type === "DEPOSIT_REFUND";

    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber: generatePaymentNumber(),
          bookingId: input.bookingId,
          rentalId: input.rentalId,
          customerId: input.customerId,
          amount: input.amount,
          method: input.method,
          type: input.type,
          status: input.status,
          reference: input.reference,
          notes: input.notes,
          receivedById,
        },
        include: INCLUDE_DEFAULT,
      });

      if (payment.status === "COMPLETED") {
        await tx.transaction.create({
          data: {
            type: isRefund ? "EXPENSE" : "INCOME",
            category: input.type,
            amount: input.amount,
            description: `${input.type} - ${payment.paymentNumber}`,
            relatedPaymentId: payment.id,
          },
        });

        if (booking && (input.type === "PAYMENT" || input.type === "REFUND")) {
          const delta = input.type === "PAYMENT" ? input.amount : -input.amount;
          const newAmountPaid = Math.max(0, round2(toNumber(booking.amountPaid) + delta));
          const newRemaining = Math.max(0, round2(toNumber(booking.totalAmount) - newAmountPaid));
          await tx.booking.update({
            where: { id: booking.id },
            data: { amountPaid: newAmountPaid, remainingBalance: newRemaining },
          });
        }

        if (rental && (input.type === "PAYMENT" || input.type === "REFUND")) {
          // Computed against the same transaction so the payment just inserted above is included.
          const rentalPayments = await tx.payment.findMany({ where: { rentalId: rental.id, status: "COMPLETED" } });
          const paid = rentalPayments.filter((p) => p.type === "PAYMENT").reduce((sum, p) => sum + toNumber(p.amount), 0);
          const refunded = rentalPayments.filter((p) => p.type === "REFUND").reduce((sum, p) => sum + toNumber(p.amount), 0);
          const outstanding = Math.max(0, toNumber(rental.finalAmount) - paid + refunded);
          await tx.rental.update({
            where: { id: rental.id },
            data: { paymentStatus: outstanding <= 0 ? "COMPLETED" : "PENDING" },
          });
        }
      }

      return payment;
    });
  },
};
