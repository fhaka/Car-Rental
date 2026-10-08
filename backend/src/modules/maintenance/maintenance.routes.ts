import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { maintenanceController } from "./maintenance.controller";
import { createMaintenanceSchema, listMaintenanceQuerySchema, updateMaintenanceSchema } from "./maintenance.schemas";

export const maintenanceRouter = Router();
const idParams = z.object({ id: z.string().uuid() });

maintenanceRouter.use(authenticate());
maintenanceRouter.get("/", validate({ query: listMaintenanceQuerySchema }), maintenanceController.list);
maintenanceRouter.get("/:id", validate({ params: idParams }), maintenanceController.get);
maintenanceRouter.post(
  "/",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ body: createMaintenanceSchema }),
  maintenanceController.create
);
maintenanceRouter.patch(
  "/:id",
  authorize(Role.ADMIN, Role.MANAGER),
  validate({ params: idParams, body: updateMaintenanceSchema }),
  maintenanceController.update
);
