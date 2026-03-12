import { apiClient } from "../../shared/api/axios";
import type { ApiSuccess, ReportsOverview } from "../../shared/types/api";

export const reportsOverviewRequest = async (): Promise<ReportsOverview> => {
  const response = await apiClient.get<ApiSuccess<ReportsOverview>>("/v1/reports/overview");
  return response.data.data;
};
