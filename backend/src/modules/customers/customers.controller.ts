import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { customersService } from "./customers.service";

export const customersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customersService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customersService.getWithSummary(req.params.id));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customersService.create(req.body);
    await logActivity({ req, action: "CUSTOMER_CREATED", entityType: "Customer", entityId: customer.id });
    res.status(201).json({ customer });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customersService.update(req.params.id, req.body);
    await logActivity({ req, action: "CUSTOMER_UPDATED", entityType: "Customer", entityId: customer.id, metadata: req.body });
    res.json({ customer });
  }),
  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const customer = await customersService.deactivate(req.params.id);
    await logActivity({ req, action: "CUSTOMER_DEACTIVATED", entityType: "Customer", entityId: customer.id });
    res.json({ customer });
  }),
  bookings: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customersService.bookingHistory(req.params.id, req.query as never));
  }),
  rentals: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customersService.rentalHistory(req.params.id, req.query as never));
  }),
  payments: asyncHandler(async (req: Request, res: Response) => {
    res.json(await customersService.paymentHistory(req.params.id, req.query as never));
  }),
};
