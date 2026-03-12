import { Worker, QueueEvents } from "bullmq";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { processNotificationJob } from "./processors/notification.processor";
import { processSecurityJob } from "./processors/security.processor";
import { processAuditExportJob } from "./processors/audit-export.processor";

const connection = {
  url: env.REDIS_URL,
};

const registerQueueEvents = (queueName: string): void => {
  const events = new QueueEvents(queueName, { connection });
  events.on("failed", ({ jobId, failedReason }) => {
    logger.error({ queueName, jobId, failedReason }, "Job moved to failed state");
  });
};

export const startWorkers = (): void => {
  registerQueueEvents("notifications.queue");
  registerQueueEvents("security.queue");
  registerQueueEvents("audit-export.queue");

  new Worker("notifications.queue", processNotificationJob, { connection });
  new Worker("security.queue", processSecurityJob, { connection });
  new Worker("audit-export.queue", processAuditExportJob, { connection });

  logger.info("BullMQ workers started");
};