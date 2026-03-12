import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Permission } from "../types/api";
import { useAuth } from "../auth/auth-context";
import { hasAnyPermission, hasRole } from "../auth/access-control";

interface PermissionGateProps {
  children: ReactNode;
  anyPermissions?: Permission[];
  anyRoles?: string[];
}

export const PermissionGate = ({ children, anyPermissions = [], anyRoles = [] }: PermissionGateProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const permissionAllowed = anyPermissions.length === 0 || hasAnyPermission(user, anyPermissions);
  const roleAllowed = anyRoles.length === 0 || anyRoles.some((role) => hasRole(user, role));

  if (!permissionAllowed || !roleAllowed) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
