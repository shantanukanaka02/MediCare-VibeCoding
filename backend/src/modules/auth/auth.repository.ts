import type { Prisma, PrismaClient } from "@prisma/client";

export interface UserAccessSnapshot {
  userId: string;
  organizationId: string;
  email: string;
  passwordHash: string;
  failedLoginCount: number;
  lockedUntil: Date | null;
  roles: { id: string; name: string }[];
  permissions: string[];
}

export interface RefreshTokenCreateInput {
  userId: string;
  organizationId: string;
  tokenHash: string;
  familyId: string;
  jti: string;
  expiresAt: Date;
}

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toAccessSnapshot(user: any): UserAccessSnapshot {
    const roles = (user.userRoles ?? []).map((item: any) => ({ id: item.role.id, name: item.role.name }));
    const permissions: string[] = Array.from(
      new Set(
        (user.userRoles ?? []).flatMap((item: any) =>
          (item.role.rolePermissions ?? []).map((rolePermission: any) => {
            const permission = rolePermission.permission;
            return `${permission.resource}:${permission.action}`;
          }),
        ),
      ),
    );

    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      passwordHash: user.passwordHash,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil,
      roles,
      permissions,
    };
  }

  async findUserByEmail(organizationId: string, email: string): Promise<UserAccessSnapshot | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
      },
      include: {
        userRoles: {
          where: { organizationId },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    return user ? this.toAccessSnapshot(user) : null;
  }

  async findGlobalSuperAdminByEmail(email: string): Promise<UserAccessSnapshot | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        userRoles: {
          some: {
            role: {
              name: "SUPER_ADMIN",
            },
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    return user ? this.toAccessSnapshot(user) : null;
  }

  async findUserById(organizationId: string, userId: string): Promise<UserAccessSnapshot | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      include: {
        userRoles: {
          where: { organizationId },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    return user ? this.toAccessSnapshot(user) : null;
  }

  async recordFailedLogin(userId: string, lockedUntil: Date | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: { increment: 1 },
        lockedUntil,
      },
    });
  }

  async clearFailedLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  }

  async createRefreshToken(data: RefreshTokenCreateInput, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.refreshToken.create({ data });
  }

  async findRefreshTokenByJti(jti: string) {
    return this.prisma.refreshToken.findUnique({
      where: { jti },
    });
  }

  async revokeRefreshJti(
    jti: string,
    organizationId: string,
    replacedByJti?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.refreshToken.updateMany({
      where: {
        jti,
        organizationId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        replacedByJti,
      },
    });
  }

  async rotateRefreshToken(
    currentJti: string,
    organizationId: string,
    replacedByJti: string,
    nextToken: RefreshTokenCreateInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.revokeRefreshJti(currentJti, organizationId, replacedByJti, tx);
      await this.createRefreshToken(nextToken, tx);
    });
  }

  async revokeRefreshFamily(familyId: string, organizationId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        organizationId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
