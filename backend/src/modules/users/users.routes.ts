import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { usersController } from "./users.controller";
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from "./users.schemas";
import { z } from "zod";

export const usersRouter = Router();

usersRouter.use(authenticate(), authorize(Role.ADMIN));

usersRouter.get("/", validate({ query: listUsersQuerySchema }), usersController.list);
usersRouter.get("/:id", validate({ params: z.object({ id: z.string().uuid() }) }), usersController.get);
usersRouter.post("/", validate({ body: createUserSchema }), usersController.create);
usersRouter.patch(
  "/:id",
  validate({ params: z.object({ id: z.string().uuid() }), body: updateUserSchema }),
  usersController.update
);
