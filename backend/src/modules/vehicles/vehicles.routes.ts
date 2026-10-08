import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { imageUploader } from "../../middleware/upload";
import { vehiclesController } from "./vehicles.controller";
import {
  changeVehicleStatusSchema,
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
} from "./vehicles.schemas";

export const vehiclesRouter = Router();
const idParams = z.object({ id: z.string().uuid() });
const upload = imageUploader("vehicles");

vehiclesRouter.use(authenticate());

vehiclesRouter.get("/", validate({ query: listVehiclesQuerySchema }), vehiclesController.list);
vehiclesRouter.get("/:id", validate({ params: idParams }), vehiclesController.get);

vehiclesRouter.post(
  "/",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ body: createVehicleSchema }),
  vehiclesController.create
);
vehiclesRouter.patch(
  "/:id",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ params: idParams, body: updateVehicleSchema }),
  vehiclesController.update
);
vehiclesRouter.patch(
  "/:id/status",
  authorize(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE),
  validate({ params: idParams, body: changeVehicleStatusSchema }),
  vehiclesController.changeStatus
);
vehiclesRouter.post(
  "/:id/archive",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ params: idParams }),
  vehiclesController.archive
);
vehiclesRouter.delete("/:id", authorize(Role.ADMIN), validate({ params: idParams }), vehiclesController.remove);

vehiclesRouter.post(
  "/:id/images",
  authorize(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE),
  validate({ params: idParams }),
  upload.array("images", 10),
  vehiclesController.uploadImages
);
vehiclesRouter.delete(
  "/:id/images/:imageId",
  authorize(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE),
  validate({ params: idParams.extend({ imageId: z.string().uuid() }) }),
  vehiclesController.removeImage
);
vehiclesRouter.patch(
  "/:id/images/:imageId/primary",
  authorize(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE),
  validate({ params: idParams.extend({ imageId: z.string().uuid() }) }),
  vehiclesController.setPrimaryImage
);
