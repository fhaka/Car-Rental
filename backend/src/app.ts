import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import { env, CLIENT_ORIGINS, isTest } from "./config/env";
import { logger } from "./lib/logger";
import { apiLimiter } from "./middleware/rateLimiters";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin/non-browser requests (no Origin header) and configured origins.
        if (!origin || CLIENT_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.JSON_BODY_LIMIT }));
  app.use(cookieParser());

  if (!isTest) {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));
  }

  // Serve uploaded vehicle/damage images statically in development.
  // Mark them cross-origin-embeddable so the frontend (served from a different
  // origin/port) can display them as <img>; Helmet's default CORP is same-origin,
  // which would otherwise block the cross-origin image load.
  app.use(
    "/uploads",
    (_req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(path.join(process.cwd(), env.UPLOAD_DIR))
  );

  app.use("/api", apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
