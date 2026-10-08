import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { searchController } from "./search.controller";
import { globalSearchSchema } from "./search.schemas";

export const searchRouter = Router();

searchRouter.use(authenticate());
searchRouter.get("/", validate({ query: globalSearchSchema }), searchController.search);
