import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { encryptField, decryptField } from "../../shared/security/crypto";
import { AuditService } from "../audit/audit.service";
import { AuditRepository } from "../audit/audit.repository";
import { PatientsRepository } from "./patients.repository";

interface RequestMeta {
  requestId: string;
  ip?: string;
  userAgent?: string;
}

interface CreatePatientInput {
  organizationId: string;
  actorUserId: string;
  externalRef?: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
}

export class PatientsService {
  private readonly patientsRepository = new PatientsRepository(prisma);

  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, limit: number) {
    const rows = await this.patientsRepository.list(organizationId, limit);
    return rows.map((row: any) => ({
      id: row.id,
      organizationId: row.organizationId,
      externalRef: row.externalRef,
      mrn: row.mrn,
      firstName: decryptField(row.firstNameEnc),
      lastName: decryptField(row.lastNameEnc),
      dob: decryptField(row.dobEnc),
      createdAt: row.createdAt,
    }));
  }

  async create(input: CreatePatientInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const patient = await this.patientsRepository.create(
        {
          organizationId: input.organizationId,
          externalRef: input.externalRef,
          mrn: input.mrn,
          firstNameEnc: encryptField(input.firstName),
          lastNameEnc: encryptField(input.lastName),
          dobEnc: encryptField(input.dob),
        },
        tx,
      );

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "patient.create",
          entityType: "patient",
          entityId: patient.id,
          afterJson: {
            id: patient.id,
            mrn: patient.mrn,
          },
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return {
        id: patient.id,
        organizationId: patient.organizationId,
        externalRef: patient.externalRef,
        mrn: patient.mrn,
        firstName: input.firstName,
        lastName: input.lastName,
        dob: input.dob,
        createdAt: patient.createdAt,
      };
    });
  }
}