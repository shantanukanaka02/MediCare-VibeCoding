import type { Prisma, PrismaClient } from "@prisma/client";

interface CreateTenantInput {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

interface CreateTenantUserInput {
  organizationId: string;
  email: string;
  passwordHash: string;
}

export class PlatformAdminRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listTenants() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async findTenantById(organizationId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.organization.findUnique({
      where: { id: organizationId },
    });
  }

  async createTenant(input: CreateTenantInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.organization.create({
      data: {
        id: input.id,
        name: input.name,
        status: input.status,
      },
    });
  }

  async listRolesByTenant(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
  }

  async findRolesByNames(organizationId: string, roleNames: string[], tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.role.findMany({
      where: {
        organizationId,
        name: { in: roleNames },
      },
    });
  }

  async findUserByEmailGlobal(email: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.findFirst({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        organizationId: true,
        email: true,
      },
    });
  }

  async createTenantUser(input: CreateTenantUserInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.create({
      data: {
        organizationId: input.organizationId,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        status: "ACTIVE",
      },
    });
  }

  async assignRoles(organizationId: string, userId: string, roleIds: string[], tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    if (roleIds.length === 0) {
      return;
    }

    await client.userRole.createMany({
      data: roleIds.map((roleId) => ({
        organizationId,
        roleId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  async ensurePermission(resource: string, action: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.permission.upsert({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
      update: {},
      create: {
        resource,
        action,
      },
    });
  }

  async upsertRole(organizationId: string, roleName: string, isSystem: boolean, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.role.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name: roleName,
        },
      },
      update: { isSystem },
      create: {
        organizationId,
        name: roleName,
        isSystem,
      },
    });
  }

  async upsertRolePermission(roleId: string, permissionId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });
  }

  async findUserWithRoles(organizationId: string, userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      include: {
        userRoles: {
          where: { organizationId },
          include: { role: true },
        },
      },
    });
  }
}
