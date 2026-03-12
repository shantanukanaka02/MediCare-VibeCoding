export interface RequestContext {
  requestId: string;
  organizationId?: string;
  userId?: string;
  roleIds?: string[];
  permissions?: string[];
}

export interface AuthTokenClaims {
  sub: string;
  organization_id: string;
  role_ids: string[];
  permissions: string[];
  jti: string;
  type: "access" | "refresh";
  exp: number;
}