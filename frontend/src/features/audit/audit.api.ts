import { apiClient } from "../../shared/api/axios";
import type { ApiSuccess, AuditLogRecord } from "../../shared/types/api";

export const listAuditLogsRequest = async (): Promise<AuditLogRecord[]> => {
  const response = await apiClient.get<ApiSuccess<AuditLogRecord[]>>("/v1/audit-logs?limit=100");
  return response.data.data;
};
