import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { paginationQuerySchema } from "../../utils/pagination";
import { customersController } from "./customers.controller";
import { createCustomerSchema, listCustomersQuerySchema, updateCustomerSchema } from "./customers.schemas";

export const customersRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

customersRouter.use(authenticate());

customersRouter.get("/", validate({ query: listCustomersQuerySchema }), customersController.list);
customersRouter.get("/:id", validate({ params: idParams }), customersController.get);
customersRouter.post("/", validate({ body: createCustomerSchema }), customersController.create);
customersRouter.patch("/:id", validate({ params: idParams, body: updateCustomerSchema }), customersController.update);
customersRouter.post("/:id/deactivate", validate({ params: idParams }), customersController.deactivate);

customersRouter.get("/:id/bookings", validate({ params: idParams, query: paginationQuerySchema }), customersController.bookings);
customersRouter.get("/:id/rentals", validate({ params: idParams, query: paginationQuerySchema }), customersController.rentals);
customersRouter.get("/:id/payments", validate({ params: idParams, query: paginationQuerySchema }), customersController.payments);
