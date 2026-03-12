import { apiClient } from "../../shared/api/axios";
import type { ApiSuccess, TaskRecord } from "../../shared/types/api";

interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeUserId?: string;
}

interface TransitionPayload {
  event: "assign" | "start" | "complete" | "cancel" | "reopen";
  reason?: string;
  version: number;
}

export const listTasksRequest = async (): Promise<TaskRecord[]> => {
  const response = await apiClient.get<ApiSuccess<TaskRecord[]>>("/v1/tasks");
  return response.data.data;
};

export const createTaskRequest = async (payload: CreateTaskPayload): Promise<TaskRecord> => {
  const response = await apiClient.post<ApiSuccess<TaskRecord>>("/v1/tasks", payload);
  return response.data.data;
};

export const transitionTaskRequest = async (taskId: string, payload: TransitionPayload): Promise<TaskRecord> => {
  const response = await apiClient.post<ApiSuccess<TaskRecord>>(`/v1/tasks/${taskId}/transition`, payload);
  return response.data.data;
};