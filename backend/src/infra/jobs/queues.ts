import { Queue, type JobsOptions } from "bullmq";
import { env } from "../../config/env";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: 200,
  removeOnFail: 500,
};

const connection = {
  url: env.REDIS_URL,
};

export const notificationQueue = new Queue("notifications.queue", {
  connection,
  defaultJobOptions,
});

export const securityQueue = new Queue("security.queue", {
  connection,
  defaultJobOptions,
});

export const auditExportQueue = new Queue("audit-export.queue", {
  connection,
  defaultJobOptions,
});

export const enqueueNotification = async (payload: Record<string, unknown>, idempotencyKey: string): Promise<void> => {
  await notificationQueue.add("notify", payload, {
    jobId: `notify:${idempotencyKey}`,
  });
};

export const enqueueSecurityEvent = async (payload: Record<string, unknown>, idempotencyKey: string): Promise<void> => {
  await securityQueue.add("security", payload, {
    jobId: `security:${idempotencyKey}`,
  });
};

export const enqueueAuditExport = async (payload: Record<string, unknown>, idempotencyKey: string): Promise<void> => {
  await auditExportQueue.add("audit-export", payload, {
    jobId: `audit:${idempotencyKey}`,
  });
};