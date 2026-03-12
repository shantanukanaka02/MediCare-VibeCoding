import { prisma } from "../../config/prisma";
import { badRequest, conflictVersion, notFound } from "../../shared/errors/error-factory";
import { AuditRepository } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { evaluateRules, type RuleDefinition } from "../workflows/rule-evaluator";
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
  approvalType: "CONTROLLED_SUBSTANCE" | "INSURANCE_PREAUTH" | "CLINICAL_REVIEW";
  requiredRole?: string;
  estimatedCost?: number;
  insuranceLimit?: number;
  medicationClass?: string;
}

interface TransitionInput {
  organizationId: string;
  actorUserId: string;
  approvalId: string;
  event: "approve" | "reject" | "escalate" | "reopen";
  reason?: string;
  version: number;
}

const approvalRules: RuleDefinition[] = [
  {
    name: "controlled_substance_requires_senior_doctor",
    match: "all",
    conditions: [{ field: "medicationClass", operator: "eq", value: "controlled" }],
    actions: [{ field: "requiredRole", value: "SENIOR_DOCTOR" }],
  },
  {
    name: "cost_exceeds_insurance_limit",
    match: "all",
    conditions: [
      { field: "costExceedsLimit", operator: "eq", value: true },
    ],
    actions: [{ field: "escalationRole", value: "INSURANCE_REVIEW" }],
  },
];

export class ApprovalsService {
  private readonly workflowEngine = new WorkflowEngine();
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, status?: string, treatmentPlanId?: string) {
    return (prisma as any).approval.findMany({
      where: { organizationId, status, treatmentPlanId },
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

      const ruleResult = evaluateRules(approvalRules, {
        medicationClass: String(input.medicationClass ?? "").toLowerCase(),
        estimatedCost: input.estimatedCost,
        insuranceLimit: input.insuranceLimit,
        costExceedsLimit:
          typeof input.estimatedCost === "number" &&
          typeof input.insuranceLimit === "number" &&
          input.estimatedCost > input.insuranceLimit,
      });

      const requiredRole =
        (ruleResult.updates.requiredRole as string | undefined) ??
        input.requiredRole ??
        (input.approvalType === "CLINICAL_REVIEW" ? "DOCTOR" : "SENIOR_DOCTOR");

      const approval = await tx.approval.create({
        data: {
          organizationId: input.organizationId,
          patientId: input.patientId,
          treatmentPlanId: input.treatmentPlanId,
          approvalType: input.approvalType,
          requiredRole,
          requestedByUserId: input.actorUserId,
          escalationRole: ruleResult.updates.escalationRole as string | undefined,
          metadataJson: {
            estimatedCost: input.estimatedCost,
            insuranceLimit: input.insuranceLimit,
            medicationClass: input.medicationClass,
            triggeredRules: ruleResult.triggeredRules,
          },
        },
      });

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "approval.create",
          entityType: "approval",
          entityId: approval.id,
          afterJson: approval,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return approval;
    });
  }

  async transition(input: TransitionInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.approval.findFirst({ where: { id: input.approvalId, organizationId: input.organizationId } });
      if (!current) {
        throw notFound("Approval not found");
      }

      const nextState = this.workflowEngine.transition(
        workflowDefinitions.approval,
        String(current.status),
        input.event,
      );

      const result = await tx.approval.updateMany({
        where: {
          id: input.approvalId,
          organizationId: input.organizationId,
          version: input.version,
        },
        data: {
          status: nextState,
          decisionByUserId: input.event === "reopen" ? null : input.actorUserId,
          decisionReason: input.reason,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw conflictVersion("Approval changed by another request");
      }

      const updated = await tx.approval.findFirst({ where: { id: input.approvalId, organizationId: input.organizationId } });

      await tx.workflowTransitionHistory.create({
        data: {
          organizationId: input.organizationId,
          entityType: "approval",
          entityId: input.approvalId,
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
          action: "approval.transition",
          entityType: "approval",
          entityId: input.approvalId,
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
