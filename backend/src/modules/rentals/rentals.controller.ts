import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { rentalsService } from "./rentals.service";

export const rentalsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await rentalsService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ rental: await rentalsService.get(req.params.id) });
  }),
  checkout: asyncHandler(async (req: Request, res: Response) => {
    const rental = await rentalsService.checkout(req.body, req.user!.sub);
    await logActivity({ req, action: "RENTAL_CHECKOUT", entityType: "Rental", entityId: rental.id, metadata: { rentalNumber: rental.rentalNumber } });
    res.status(201).json({ rental });
  }),
  extend: asyncHandler(async (req: Request, res: Response) => {
    const rental = await rentalsService.extend(req.params.id, req.body);
    await logActivity({ req, action: "RENTAL_EXTENDED", entityType: "Rental", entityId: rental.id, metadata: req.body });
    res.json({ rental });
  }),
  checkin: asyncHandler(async (req: Request, res: Response) => {
    const rental = await rentalsService.checkin(req.params.id, req.body, req.user!.sub);
    await logActivity({ req, action: "RENTAL_CHECKIN", entityType: "Rental", entityId: rental.id, metadata: { finalAmount: rental.finalAmount } });
    res.json({ rental });
  }),
  cancel: asyncHandler(async (req: Request, res: Response) => {
    const rental = await rentalsService.cancel(req.params.id, req.body.reason);
    await logActivity({ req, action: "RENTAL_CANCELLED", entityType: "Rental", entityId: rental.id });
    res.json({ rental });
  }),
  outstandingBalance: asyncHandler(async (req: Request, res: Response) => {
    res.json({ outstandingBalance: await rentalsService.getOutstandingBalance(req.params.id) });
  }),
};
