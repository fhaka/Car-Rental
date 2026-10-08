import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { publicController } from "./public.controller";
import { createPublicBookingSchema, listPublicVehiclesQuerySchema } from "./public.schemas";

/**
 * Customer-facing, UNAUTHENTICATED API that powers the public website.
 * Read endpoints expose only presentation-safe fields; the single write
 * endpoint (guest booking) is tightly rate-limited to deter spam/abuse.
 */
export const publicRouter = Router();

const idParams = z.object({ id: z.string().uuid() });

// Stricter limiter for the one public write endpoint - guests can't spam bookings.
const publicBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many booking attempts, please try again later", code: "RATE_LIMITED" } },
});

publicRouter.get("/company", publicController.company);
publicRouter.get("/categories", publicController.categories);
publicRouter.get("/vehicles", validate({ query: listPublicVehiclesQuerySchema }), publicController.listVehicles);
publicRouter.get("/vehicles/:id", validate({ params: idParams }), publicController.getVehicle);
publicRouter.post(
  "/bookings",
  publicBookingLimiter,
  validate({ body: createPublicBookingSchema }),
  publicController.createBooking
);
