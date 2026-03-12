import type { Job } from "bullmq";
import { logger } from "../../../config/logger";

export const processSecurityJob = async (job: Job): Promise<void> => {
  logger.warn({ jobId: job.id, payload: job.data }, "Processed security event");
};