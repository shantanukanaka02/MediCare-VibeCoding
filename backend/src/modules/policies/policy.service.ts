export interface PolicyUserContext {
  userId: string;
  organizationId: string;
  permissions: string[];
}

export interface PolicyResourceContext {
  ownerUserId?: string;
  organizationId?: string;
}

export class PolicyService {
  can(
    user: PolicyUserContext,
    action: string,
    resource: string,
    _resourceContext?: PolicyResourceContext,
  ): boolean {
    return user.permissions.includes(`${resource}:${action}`);
  }
}