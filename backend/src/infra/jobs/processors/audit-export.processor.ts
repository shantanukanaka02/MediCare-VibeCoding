import type { Job } from "bullmq";
import { logger } from "../../../config/logger";

export const processAuditExportJob = async (job: Job): Promise<void> => {
  logger.info({ jobId: job.id, payload: job.data }, "Processed audit export job");
};