import type { Prisma, PrismaClient } from "@prisma/client";

export interface AuditEventInput {
  organizationId: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  requestId: string;
  ip?: string;
  userAgent?: string;
}

export interface AuditLogListFilter {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorUserId?: string;
  limit: number;
}

export class AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(event: AuditEventInput, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({ data: event as never });
  }

  async listByOrganization(organizationId: string, filter: AuditLogListFilter) {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: filter.entityType,
        entityId: filter.entityId,
        action: filter.action,
        actorUserId: filter.actorUserId,
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit,
    });
  }
}
