import type { Prisma } from "@prisma/client";
import { AuditRepository, type AuditEventInput, type AuditLogListFilter } from "./audit.repository";

export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(event: AuditEventInput, tx?: Prisma.TransactionClient): Promise<void> {
    await this.auditRepository.create(event, tx);
  }

  async list(organizationId: string, filter: AuditLogListFilter) {
    return this.auditRepository.listByOrganization(organizationId, filter);
  }
}
