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
  patientId?: string;
  treatmentPlanId?: string;
  sourceEntityType: string;
  sourceEntityId: string;
  triggerType: string;
  payload?: Record<string, unknown>;
}

interface TransitionInput {
  organizationId: string;
  actorUserId: string;
  billingTriggerId: string;
  event: "emit" | "fail" | "retry";
  failureReason?: string;
  reason?: string;
  version: number;
}

export class BillingTriggersService {
  private readonly workflowEngine = new WorkflowEngine();
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, status?: string, triggerType?: string) {
    return (prisma as any).billingTrigger.findMany({
      where: { organizationId, status, triggerType },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      if (input.patientId) {
        const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: input.organizationId } });
        if (!patient) {
          throw badRequest("Patient not found in tenant scope");
        }
      }

      if (input.treatmentPlanId) {
        const plan = await tx.treatmentPlan.findFirst({ where: { id: input.treatmentPlanId, organizationId: input.organizationId } });
        if (!plan) {
          throw badRequest("Treatment plan not found in tenant scope");
        }
      }

      const trigger = await tx.billingTrigger.create({
        data: {
          organizationId: input.organizationId,
          patientId: input.patientId,
          treatmentPlanId: input.treatmentPlanId,
          sourceEntityType: input.sourceEntityType,
          sourceEntityId: input.sourceEntityId,
          triggerType: input.triggerType,
          status: "PENDING",
          payloadJson: input.payload ?? null,
          createdBy: input.actorUserId,
        },
      });

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "billing_trigger.create",
          entityType: "billing_trigger",
          entityId: trigger.id,
          afterJson: trigger,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return trigger;
    });
  }

  async transition(input: TransitionInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.billingTrigger.findFirst({ where: { id: input.billingTriggerId, organizationId: input.organizationId } });
      if (!current) {
        throw notFound("Billing trigger not found");
      }

      const nextState = this.workflowEngine.transition(
        workflowDefinitions.billing_trigger,
        String(current.status),
        input.event,
      );

      const updatePayload: Record<string, unknown> = {
        status: nextState,
        version: { increment: 1 },
      };

      if (input.event === "emit") {
        updatePayload.emittedAt = new Date();
        updatePayload.failureReason = null;
      }

      if (input.event === "fail") {
        updatePayload.failureReason = input.failureReason ?? "Emission failed";
      }

      if (input.event === "retry") {
        updatePayload.failureReason = null;
      }

      const result = await tx.billingTrigger.updateMany({
        where: {
          id: input.billingTriggerId,
          organizationId: input.organizationId,
          version: input.version,
        },
        data: updatePayload,
      });

      if (result.count === 0) {
        throw conflictVersion("Billing trigger changed by another request");
      }

      const updated = await tx.billingTrigger.findFirst({ where: { id: input.billingTriggerId, organizationId: input.organizationId } });

      await tx.workflowTransitionHistory.create({
        data: {
          organizationId: input.organizationId,
          entityType: "billing_trigger",
          entityId: input.billingTriggerId,
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
          action: "billing_trigger.transition",
          entityType: "billing_trigger",
          entityId: input.billingTriggerId,
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