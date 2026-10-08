import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { rentalsController } from "./rentals.controller";
import {
  cancelRentalSchema,
  checkinRentalSchema,
  checkoutRentalSchema,
  extendRentalSchema,
  listRentalsQuerySchema,
} from "./rentals.schemas";

export const rentalsRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

rentalsRouter.use(authenticate());

rentalsRouter.get("/", validate({ query: listRentalsQuerySchema }), rentalsController.list);
rentalsRouter.get("/:id", validate({ params: idParams }), rentalsController.get);
rentalsRouter.get("/:id/outstanding-balance", validate({ params: idParams }), rentalsController.outstandingBalance);
rentalsRouter.post("/checkout", validate({ body: checkoutRentalSchema }), rentalsController.checkout);
rentalsRouter.patch("/:id/extend", validate({ params: idParams, body: extendRentalSchema }), rentalsController.extend);
rentalsRouter.post("/:id/checkin", validate({ params: idParams, body: checkinRentalSchema }), rentalsController.checkin);
rentalsRouter.patch("/:id/cancel", validate({ params: idParams, body: cancelRentalSchema }), rentalsController.cancel);
