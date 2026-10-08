import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { paymentsService } from "./payments.service";

export const paymentsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await paymentsService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ payment: await paymentsService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentsService.create(req.body, req.user!.sub);
    await logActivity({
      req,
      action: payment.type.includes("REFUND") ? "PAYMENT_REFUNDED" : "PAYMENT_RECEIVED",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { amount: payment.amount, type: payment.type },
    });
    res.status(201).json({ payment });
  }),
};
