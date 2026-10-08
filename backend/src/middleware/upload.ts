import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function makeStorage(subdir: string) {
  const dest = path.join(process.cwd(), env.UPLOAD_DIR, subdir);
  fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, name);
    },
  });
}

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"));
  }
  cb(null, true);
}

export function imageUploader(subdir: string) {
  return multer({
    storage: makeStorage(subdir),
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  });
}

export function publicUrlFor(subdir: string, filename: string) {
  return `/uploads/${subdir}/${filename}`;
}
