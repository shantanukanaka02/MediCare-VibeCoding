import type { Prisma, PrismaClient } from "@prisma/client";

interface CreateUserInput {
  organizationId: string;
  email: string;
  passwordHash: string;
}

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByOrganization(organizationId: string, limit: number) {
    return this.prisma.user.findMany({
      where: { organizationId },
      include: {
        userRoles: {
          where: { organizationId },
          include: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async listRoles(organizationId: string) {
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

  async createUser(input: CreateUserInput, tx?: Prisma.TransactionClient) {
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
        userId,
        roleId,
      })),
      skipDuplicates: true,
    });
  }

  async findById(organizationId: string, userId: string, tx?: Prisma.TransactionClient) {
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
