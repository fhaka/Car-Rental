import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { bookingsService } from "./bookings.service";

export const bookingsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingsService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ booking: await bookingsService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingsService.create(req.body, req.user!.sub);
    await logActivity({ req, action: "BOOKING_CREATED", entityType: "Booking", entityId: booking.id, metadata: { bookingNumber: booking.bookingNumber } });
    res.status(201).json({ booking });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingsService.update(req.params.id, req.body);
    await logActivity({ req, action: "BOOKING_UPDATED", entityType: "Booking", entityId: booking.id });
    res.json({ booking });
  }),
  changeStatus: asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingsService.changeStatus(req.params.id, req.body.status, req.body.reason);
    await logActivity({ req, action: "BOOKING_STATUS_CHANGED", entityType: "Booking", entityId: booking.id, metadata: req.body });
    res.json({ booking });
  }),
};
