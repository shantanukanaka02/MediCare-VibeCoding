import { apiClient } from "../../shared/api/axios";
import type { ApiSuccess, RoleRecord, UserRecord } from "../../shared/types/api";

interface CreateUserPayload {
  email: string;
  password: string;
  roleNames: string[];
}

export const listUsersRequest = async (): Promise<UserRecord[]> => {
  const response = await apiClient.get<ApiSuccess<UserRecord[]>>("/v1/users?limit=100");
  return response.data.data;
};

export const listRolesRequest = async (): Promise<RoleRecord[]> => {
  const response = await apiClient.get<ApiSuccess<RoleRecord[]>>("/v1/users/roles");
  return response.data.data;
};

export const createUserRequest = async (payload: CreateUserPayload): Promise<UserRecord> => {
  const response = await apiClient.post<ApiSuccess<UserRecord>>("/v1/users", payload);
  return response.data.data;
};
