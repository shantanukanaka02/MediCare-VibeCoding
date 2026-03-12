import { prisma } from "../../config/prisma";
import { badRequest, conflictVersion, notFound } from "../../shared/errors/error-factory";
import { AuditRepository } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { WorkflowEngine } from "../workflows/workflow.engine";
import { workflowDefinitions } from "../workflows/workflow.definitions";

interface RequestMeta {
  requestId: string;
  ip?: string;
  userAgent?: string;
}

interface CreateInput {
  organizationId: string;
  actorUserId: string;
  patientId: string;
  testCode: string;
  testName: string;
}

interface TransitionInput {
  organizationId: string;
  actorUserId: string;
  labOrderId: string;
  event: "collect_sample" | "process" | "upload_results" | "doctor_review" | "notify_patient";
  resultSummary?: string;
  resultDocumentUrl?: string;
  reason?: string;
  version: number;
}

export class LabOrdersService {
  private readonly workflowEngine = new WorkflowEngine();
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, status?: string, patientId?: string) {
    return (prisma as any).labOrder.findMany({
      where: { organizationId, status, patientId },
      orderBy: { orderedAt: "desc" },
    });
  }

  async create(input: CreateInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: input.organizationId } });
      if (!patient) {
        throw badRequest("Patient not found in tenant scope");
      }

      const order = await tx.labOrder.create({
        data: {
          organizationId: input.organizationId,
          patientId: input.patientId,
          orderedByUserId: input.actorUserId,
          testCode: input.testCode,
          testName: input.testName,
          status: "ORDERED",
        },
      });

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "lab_order.create",
          entityType: "lab_order",
          entityId: order.id,
          afterJson: order,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return order;
    });
  }

  async transition(input: TransitionInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.labOrder.findFirst({
        where: { id: input.labOrderId, organizationId: input.organizationId },
      });

      if (!current) {
        throw notFound("Lab order not found");
      }

      const nextState = this.workflowEngine.transition(
        workflowDefinitions.lab_order,
        String(current.status),
        input.event,
      );

      const updatePayload: Record<string, unknown> = {
        status: nextState,
        version: { increment: 1 },
      };

      if (input.event === "collect_sample") {
        updatePayload.sampleCollectedAt = new Date();
      }

      if (input.event === "doctor_review") {
        updatePayload.reviewedByUserId = input.actorUserId;
        updatePayload.reviewedAt = new Date();
      }

      if (input.resultSummary) {
        updatePayload.resultSummary = input.resultSummary;
      }

      if (input.resultDocumentUrl) {
        updatePayload.resultDocumentUrl = input.resultDocumentUrl;
      }

      const result = await tx.labOrder.updateMany({
        where: {
          id: input.labOrderId,
          organizationId: input.organizationId,
          version: input.version,
        },
        data: updatePayload,
      });

      if (result.count === 0) {
        throw conflictVersion("Lab order changed by another request");
      }

      const updated = await tx.labOrder.findFirst({ where: { id: input.labOrderId, organizationId: input.organizationId } });

      await tx.workflowTransitionHistory.create({
        data: {
          organizationId: input.organizationId,
          entityType: "lab_order",
          entityId: input.labOrderId,
          fromState: String(current.status),
          toState: String(nextState),
          event: input.event,
          actorUserId: input.actorUserId,
          reason: input.reason,
        },
      });

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "lab_order.transition",
          entityType: "lab_order",
          entityId: input.labOrderId,
          beforeJson: current,
          afterJson: updated,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return updated;
    });
  }
}