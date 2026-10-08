import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { vehicleCategoriesController } from "./vehicleCategories.controller";
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "./vehicleCategories.schemas";

export const vehicleCategoriesRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

vehicleCategoriesRouter.use(authenticate());

vehicleCategoriesRouter.get("/", validate({ query: listCategoriesQuerySchema }), vehicleCategoriesController.list);
vehicleCategoriesRouter.get("/:id", validate({ params: idParams }), vehicleCategoriesController.get);

vehicleCategoriesRouter.post(
  "/",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ body: createCategorySchema }),
  vehicleCategoriesController.create
);
vehicleCategoriesRouter.patch(
  "/:id",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ params: idParams, body: updateCategorySchema }),
  vehicleCategoriesController.update
);
vehicleCategoriesRouter.delete(
  "/:id",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ params: idParams }),
  vehicleCategoriesController.archive
);
