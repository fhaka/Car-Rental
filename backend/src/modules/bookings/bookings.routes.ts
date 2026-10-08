import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { bookingsController } from "./bookings.controller";
import {
  changeBookingStatusSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  updateBookingSchema,
} from "./bookings.schemas";

export const bookingsRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

bookingsRouter.use(authenticate());

bookingsRouter.get("/", validate({ query: listBookingsQuerySchema }), bookingsController.list);
bookingsRouter.get("/:id", validate({ params: idParams }), bookingsController.get);
bookingsRouter.post("/", validate({ body: createBookingSchema }), bookingsController.create);
bookingsRouter.patch("/:id", validate({ params: idParams, body: updateBookingSchema }), bookingsController.update);
bookingsRouter.patch(
  "/:id/status",
  validate({ params: idParams, body: changeBookingStatusSchema }),
  bookingsController.changeStatus
);
