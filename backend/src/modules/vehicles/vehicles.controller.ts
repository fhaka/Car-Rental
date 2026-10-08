import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { logActivity } from "../../utils/activityLog";
import { publicUrlFor } from "../../middleware/upload";
import { vehiclesService } from "./vehicles.service";

export const vehiclesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    res.json(await vehiclesService.list(req.query as never));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    res.json({ vehicle: await vehiclesService.get(req.params.id) });
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.create(req.body);
    await logActivity({ req, action: "VEHICLE_CREATED", entityType: "Vehicle", entityId: vehicle.id });
    res.status(201).json({ vehicle });
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.update(req.params.id, req.body);
    await logActivity({ req, action: "VEHICLE_UPDATED", entityType: "Vehicle", entityId: vehicle.id, metadata: req.body });
    res.json({ vehicle });
  }),
  changeStatus: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.changeStatus(req.params.id, req.body);
    await logActivity({ req, action: "VEHICLE_STATUS_CHANGED", entityType: "Vehicle", entityId: vehicle.id, metadata: req.body });
    res.json({ vehicle });
  }),
  archive: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.archive(req.params.id);
    await logActivity({ req, action: "VEHICLE_ARCHIVED", entityType: "Vehicle", entityId: vehicle.id });
    res.json({ vehicle });
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await vehiclesService.remove(req.params.id);
    await logActivity({ req, action: "VEHICLE_DELETED", entityType: "Vehicle", entityId: req.params.id });
    res.status(204).send();
  }),
  uploadImages: asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const urls = files.map((f) => ({ url: publicUrlFor("vehicles", f.filename) }));
    const vehicle = await vehiclesService.addImages(req.params.id, urls);
    await logActivity({ req, action: "VEHICLE_IMAGES_ADDED", entityType: "Vehicle", entityId: vehicle.id });
    res.status(201).json({ vehicle });
  }),
  removeImage: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.removeImage(req.params.id, req.params.imageId);
    res.json({ vehicle });
  }),
  setPrimaryImage: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.setPrimaryImage(req.params.id, req.params.imageId);
    await logActivity({ req, action: "VEHICLE_IMAGE_PRIMARY_SET", entityType: "Vehicle", entityId: req.params.id });
    res.json({ vehicle });
  }),
};
