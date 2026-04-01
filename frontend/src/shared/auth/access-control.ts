import type { AuthUser, Permission } from "../types/api";

export const hasPermission = (user: AuthUser | null, permission: Permission): boolean =>
  Boolean(user?.permissions.includes(permission));

export const hasAnyPermission = (user: AuthUser | null, permissions: Permission[]): boolean =>
  permissions.some((permission) => hasPermission(user, permission));

export const hasRole = (user: AuthUser | null, role: string): boolean => Boolean(user?.roles.includes(role));

export const defaultHomePath = (user: AuthUser | null): string => {
  if (!user) {
    return "/login";
  }

  if (hasRole(user, "SUPER_ADMIN")) {
    return "/super-admin/tenants";
  }

  if (hasPermission(user, "report:read")) {
    return "/dashboard";
  }

  if (hasPermission(user, "triage_case:read")) {
    return "/triage";
  }

  if (hasPermission(user, "treatment_plan:read")) {
    return "/treatment-plans";
  }

  if (hasPermission(user, "lab_order:read")) {
    return "/lab-management";
  }

  if (hasPermission(user, "billing_trigger:read")) {
    return "/billing";
  }

  if (hasPermission(user, "approval:read")) {
    return "/approvals";
  }

  if (hasPermission(user, "task:read")) {
    return "/tasks";
  }

  if (hasPermission(user, "patient:read")) {
    return "/patients";
  }

  if (hasPermission(user, "appointment:read")) {
    return "/appointments";
  }

  if (hasPermission(user, "audit_log:read")) {
    return "/compliance";
  }

  return "/dashboard";
};
