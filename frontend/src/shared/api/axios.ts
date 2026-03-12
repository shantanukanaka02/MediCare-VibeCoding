import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiSuccess } from "../types/api";
import { tokenStore } from "../auth/token-store";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await axios.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>(
    `${apiBaseUrl}/v1/auth/refresh`,
    { refreshToken },
  );

  const nextAccess = response.data.data.accessToken;
  const nextRefresh = response.data.data.refreshToken;
  tokenStore.setTokens(nextAccess, nextRefresh);
  return nextAccess;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const accessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      tokenStore.clear();
      return Promise.reject(refreshError);
    }
  },
);