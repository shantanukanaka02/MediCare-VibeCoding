import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "../../config/prisma";
import { badRequest, conflict } from "../../shared/errors/error-factory";
import { hashPassword } from "../../shared/security/password";
import { AuditRepository } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { UsersRepository } from "./users.repository";

interface RequestMeta {
  requestId: string;
  ip?: string;
  userAgent?: string;
}

interface CreateUserInput {
  organizationId: string;
  actorUserId: string;
  email: string;
  password: string;
  roleNames: string[];
}

const mapUser = (user: any) => ({
  id: user.id,
  organizationId: user.organizationId,
  email: user.email,
  status: user.status,
  createdAt: user.createdAt,
  roles: (user.userRoles ?? []).map((item: any) => item.role.name),
});

export class UsersService {
  private readonly usersRepository = new UsersRepository(prisma);
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, limit: number) {
    const users = await this.usersRepository.listByOrganization(organizationId, limit);
    return users.map(mapUser);
  }

  async listRoles(organizationId: string) {
    const roles = await this.usersRepository.listRoles(organizationId);
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
    }));
  }

  async create(input: CreateUserInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const uniqueRoleNames = Array.from(new Set(input.roleNames.map((name) => name.trim()).filter(Boolean)));
      if (uniqueRoleNames.length === 0) {
        throw badRequest("At least one role is required");
      }

      const roles = await this.usersRepository.findRolesByNames(input.organizationId, uniqueRoleNames, tx);
      if (roles.length !== uniqueRoleNames.length) {
        const foundNames = new Set(roles.map((role) => role.name));
        const missing = uniqueRoleNames.filter((name) => !foundNames.has(name));
        throw badRequest(`Unknown roles for tenant scope: ${missing.join(", ")}`);
      }

      const passwordHash = await hashPassword(input.password);

      let createdUser: { id: string } | null = null;
      try {
        createdUser = await this.usersRepository.createUser(
          {
            organizationId: input.organizationId,
            email: input.email,
            passwordHash,
          },
          tx,
        );
      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
          throw conflict("User with this email already exists in this organization");
        }
        throw error;
      }

      if (!createdUser) {
        throw conflict("Unable to create user");
      }

      await this.usersRepository.assignRoles(
        input.organizationId,
        createdUser.id,
        roles.map((role) => role.id),
        tx,
      );

      const hydratedUser = await this.usersRepository.findById(input.organizationId, createdUser.id, tx);
      if (!hydratedUser) {
        throw conflict("Unable to load created user");
      }

      const responseUser = mapUser(hydratedUser);

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "user.create",
          entityType: "user",
          entityId: responseUser.id,
          afterJson: {
            id: responseUser.id,
            email: responseUser.email,
            roles: responseUser.roles,
          },
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return responseUser;
    });
  }
}
