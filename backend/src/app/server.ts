import { env } from "../config/env";
import { logger } from "../config/logger";
import { redis } from "../config/redis";
import { buildApp } from "./app";
import { startWorkers } from "../infra/jobs/worker";

const app = buildApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "EHCP backend running");
});

if (env.NODE_ENV !== "test") {
  startWorkers();
}

const shutdown = async (): Promise<void> => {
  logger.info("Shutting down server");
  server.close();
  await redis.quit();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});