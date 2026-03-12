import type { Job } from "bullmq";
import { logger } from "../../../config/logger";

export const processNotificationJob = async (job: Job): Promise<void> => {
  logger.info({ jobId: job.id, payload: job.data }, "Processed notification job");
};