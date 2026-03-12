import type { ApiSuccess, AuthUser } from "../../shared/types/api";
import { apiClient } from "../../shared/api/axios";

interface LoginPayload {
  organizationId: string;
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const loginRequest = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiSuccess<LoginResponse>>("/v1/auth/login", payload);
  return response.data.data;
};

export const meRequest = async (): Promise<AuthUser> => {
  const response = await apiClient.get<ApiSuccess<AuthUser>>("/v1/auth/me");
  return response.data.data;
};

export const logoutRequest = async (refreshToken: string): Promise<void> => {
  await apiClient.post("/v1/auth/logout", { refreshToken });
};