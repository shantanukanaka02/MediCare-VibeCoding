import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "../../config/prisma";
import { badRequest, conflict, notFound } from "../../shared/errors/error-factory";
import { hashPassword } from "../../shared/security/password";
import { AuditRepository } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { PlatformAdminRepository } from "./platform-admin.repository";

interface RequestMeta {
  requestId: string;
  ip?: string;
  userAgent?: string;
}

interface CreateTenantInput {
  actorUserId: string;
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

interface CreatePlatformUserInput {
  actorUserId: string;
  organizationId: string;
  email: string;
  password: string;
  roleName: string;
}

const TENANT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "task:read",
    "task:create",
    "task:update",
    "task:transition",
    "patient:read",
    "patient:create",
    "appointment:read",
    "appointment:create",
    "appointment:transition",
    "triage_case:read",
    "triage_case:create",
    "triage_case:transition",
    "treatment_plan:read",
    "treatment_plan:create",
    "treatment_plan:transition",
    "lab_order:read",
    "lab_order:create",
    "lab_order:transition",
    "approval:read",
    "approval:create",
    "approval:transition",
    "billing_trigger:read",
    "billing_trigger:create",
    "billing_trigger:transition",
    "audit_log:read",
    "report:read",
    "user:read",
    "user:create",
    "tenant:read",
    "tenant:create",
    "platform_user:create",
  ],
  ORG_ADMIN: [
    "task:read",
    "task:create",
    "task:update",
    "task:transition",
    "patient:read",
    "patient:create",
    "appointment:read",
    "appointment:create",
    "appointment:transition",
    "triage_case:read",
    "triage_case:create",
    "triage_case:transition",
    "treatment_plan:read",
    "treatment_plan:create",
    "treatment_plan:transition",
    "lab_order:read",
    "lab_order:create",
    "lab_order:transition",
    "approval:read",
    "approval:create",
    "approval:transition",
    "billing_trigger:read",
    "billing_trigger:create",
    "billing_trigger:transition",
    "audit_log:read",
    "report:read",
    "user:read",
    "user:create",
  ],
  PATIENT: [],
  RECEPTIONIST: ["patient:read", "patient:create", "appointment:read", "appointment:create", "triage_case:read", "triage_case:create"],
  CARE_NURSE: ["task:read", "task:transition", "patient:read", "appointment:read", "triage_case:read", "triage_case:transition", "lab_order:read", "lab_order:transition"],
  DOCTOR: [
    "task:read",
    "task:update",
    "task:transition",
    "patient:read",
    "appointment:read",
    "triage_case:read",
    "triage_case:transition",
    "treatment_plan:read",
    "treatment_plan:create",
    "treatment_plan:transition",
    "lab_order:read",
    "lab_order:transition",
    "approval:read",
    "approval:create",
    "approval:transition",
    "report:read",
  ],
  SPECIALIST: ["patient:read", "appointment:read", "triage_case:read", "treatment_plan:read", "treatment_plan:transition", "lab_order:read", "approval:read", "approval:transition"],
  LAB_TECHNICIAN: ["patient:read", "lab_order:read", "lab_order:transition"],
  BILLING_OFFICER: ["patient:read", "treatment_plan:read", "approval:read", "billing_trigger:read", "billing_trigger:create", "billing_trigger:transition", "report:read"],
  COMPLIANCE_OFFICER: ["audit_log:read", "report:read"],
};

const ROLE_SYSTEM_FLAGS: Record<string, boolean> = {
  SUPER_ADMIN: true,
  ORG_ADMIN: true,
  PATIENT: false,
  RECEPTIONIST: false,
  CARE_NURSE: false,
  DOCTOR: false,
  SPECIALIST: false,
  LAB_TECHNICIAN: false,
  BILLING_OFFICER: false,
  COMPLIANCE_OFFICER: false,
};

const mapTenantUser = (user: any) => ({
  id: user.id,
  organizationId: user.organizationId,
  email: user.email,
  status: user.status,
  createdAt: user.createdAt,
  roles: (user.userRoles ?? []).map((item: any) => item.role.name),
});

export class PlatformAdminService {
  private readonly repository = new PlatformAdminRepository(prisma);
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  private async ensureRoleWithPermissions(
    organizationId: string,
    roleName: string,
    tx: Prisma.TransactionClient,
  ) {
    const permissionKeys = TENANT_ROLE_PERMISSIONS[roleName];
    if (!permissionKeys) {
      throw badRequest(`Unsupported role: ${roleName}`);
    }

    const role = await this.repository.upsertRole(
      organizationId,
      roleName,
      ROLE_SYSTEM_FLAGS[roleName] ?? false,
      tx,
    );

    for (const key of permissionKeys) {
      const [resource, action] = key.split(":");
      const permission = await this.repository.ensurePermission(resource, action, tx);
      await this.repository.upsertRolePermission(role.id, permission.id, tx);
    }

    return role;
  }

  async listTenants() {
    const tenants = await this.repository.listTenants();
    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      createdAt: tenant.createdAt,
      userCount: tenant._count.users,
    }));
  }

  async createTenant(input: CreateTenantInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const permissionIds = new Map<string, string>();
      for (const keys of Object.values(TENANT_ROLE_PERMISSIONS)) {
        for (const key of keys) {
          if (permissionIds.has(key)) {
            continue;
          }
          const [resource, action] = key.split(":");
          const permission = await this.repository.ensurePermission(resource, action, tx);
          permissionIds.set(key, permission.id);
        }
      }

      let tenant: { id: string; name: string; status: string; createdAt: Date };
      try {
        tenant = await this.repository.createTenant(
          {
            id: input.id,
            name: input.name,
            status: input.status,
          },
          tx,
        );
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
          throw conflict("Tenant ID already exists");
        }
        throw error;
      }

      for (const [roleName, permissions] of Object.entries(TENANT_ROLE_PERMISSIONS)) {
        const role = await this.repository.upsertRole(tenant.id, roleName, ROLE_SYSTEM_FLAGS[roleName], tx);
        for (const key of permissions) {
          const permissionId = permissionIds.get(key);
          if (!permissionId) {
            throw badRequest(`Missing permission setup for ${key}`);
          }
          await this.repository.upsertRolePermission(role.id, permissionId, tx);
        }
      }

      await this.auditService.log(
        {
          organizationId: tenant.id,
          actorUserId: input.actorUserId,
          action: "tenant.create",
          entityType: "organization",
          entityId: tenant.id,
          afterJson: {
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
          },
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return tenant;
    });
  }

  async listTenantRoles(organizationId: string) {
    const tenant = await this.repository.findTenantById(organizationId);
    if (!tenant) {
      throw notFound("Tenant not found");
    }

    const roles = await this.repository.listRolesByTenant(organizationId);
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
    }));
  }

  async listRoleCatalog() {
    return Object.keys(TENANT_ROLE_PERMISSIONS);
  }

  async createTenantUser(input: CreatePlatformUserInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenant = await this.repository.findTenantById(input.organizationId, tx);
      if (!tenant) {
        throw notFound("Tenant not found");
      }

      const globalExisting = await this.repository.findUserByEmailGlobal(input.email, tx);
      if (globalExisting) {
        throw conflict("Username/email already exists globally");
      }

      const roleName = input.roleName.trim();
      if (!roleName) {
        throw badRequest("Role is required");
      }

      let role = (await this.repository.findRolesByNames(input.organizationId, [roleName], tx))[0];
      if (!role) {
        role = await this.ensureRoleWithPermissions(input.organizationId, roleName, tx);
      }

      const passwordHash = await hashPassword(input.password);
      const user = await this.repository.createTenantUser(
        {
          organizationId: input.organizationId,
          email: input.email,
          passwordHash,
        },
        tx,
      );

      await this.repository.assignRoles(
        input.organizationId,
        user.id,
        [role.id],
        tx,
      );

      const hydrated = await this.repository.findUserWithRoles(input.organizationId, user.id, tx);
      if (!hydrated) {
        throw conflict("Unable to load created user");
      }

      const mapped = mapTenantUser(hydrated);

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "platform_user.create",
          entityType: "user",
          entityId: mapped.id,
          afterJson: {
            id: mapped.id,
            email: mapped.email,
            roles: mapped.roles,
          },
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return mapped;
    });
  }
}
