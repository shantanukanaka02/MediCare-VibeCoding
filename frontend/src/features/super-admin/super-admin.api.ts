import { apiClient } from "../../shared/api/axios";
import type { ApiSuccess, RoleRecord, TenantRecord, UserRecord } from "../../shared/types/api";

interface CreateTenantPayload {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

interface CreateTenantUserPayload {
  organizationId: string;
  email: string;
  password: string;
  roleName: string;
}

export const listTenantsRequest = async (): Promise<TenantRecord[]> => {
  const response = await apiClient.get<ApiSuccess<TenantRecord[]>>("/v1/platform/tenants");
  return response.data.data;
};

export const createTenantRequest = async (payload: CreateTenantPayload): Promise<TenantRecord> => {
  const response = await apiClient.post<ApiSuccess<TenantRecord>>("/v1/platform/tenants", payload);
  return response.data.data;
};

export const listTenantRolesRequest = async (organizationId: string): Promise<RoleRecord[]> => {
  const response = await apiClient.get<ApiSuccess<RoleRecord[]>>(`/v1/platform/tenant-roles?organizationId=${organizationId}`);
  return response.data.data;
};

export const listRoleCatalogRequest = async (): Promise<string[]> => {
  const response = await apiClient.get<ApiSuccess<string[]>>("/v1/platform/role-catalog");
  return response.data.data;
};

export const createTenantUserRequest = async (payload: CreateTenantUserPayload): Promise<UserRecord> => {
  const response = await apiClient.post<ApiSuccess<UserRecord>>("/v1/platform/users", payload);
  return response.data.data;
};
