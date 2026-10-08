import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { startNotificationScheduler } from "./modules/notifications/notifications.scheduler";

async function main() {
  await prisma.$connect();
  logger.info("Database connection established");

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`car-rental-api listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Periodically evaluates business rules that generate notifications
  // (overdue rentals, upcoming returns, expiring documents, maintenance due).
  const stopScheduler = startNotificationScheduler();

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    stopScheduler();
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
