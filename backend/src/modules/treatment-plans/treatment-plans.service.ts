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
  patientId: string;
  diagnoses: string[];
  medications: Array<{ name: string; class?: string; dosage?: string }>;
  labTests: string[];
  procedures: string[];
}

interface TransitionInput {
  organizationId: string;
  actorUserId: string;
  treatmentPlanId: string;
  event: "submit_review" | "approve" | "request_changes" | "activate" | "modify" | "reactivate" | "close";
  reason?: string;
  version: number;
}

const approvalRuleSet: RuleDefinition[] = [
  {
    name: "controlled_substance_needs_approval",
    match: "any",
    conditions: [{ field: "medicationClasses", operator: "includes", value: "controlled" }],
    actions: [{ field: "requiresApproval", value: true }],
  },
];

export class TreatmentPlansService {
  private readonly workflowEngine = new WorkflowEngine();
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, status?: string, patientId?: string) {
    return (prisma as any).treatmentPlan.findMany({
      where: {
        organizationId,
        status,
        patientId,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: input.organizationId } });
      if (!patient) {
        throw badRequest("Patient not found in tenant scope");
      }

      const medicationClasses = input.medications.map((item) => String(item.class ?? "").toLowerCase());
      const ruleResult = evaluateRules(approvalRuleSet, { medicationClasses });

      const treatmentPlan = await tx.treatmentPlan.create({
        data: {
          organizationId: input.organizationId,
          patientId: input.patientId,
          status: "DRAFT",
          diagnosesJson: input.diagnoses,
          medicationsJson: input.medications,
          labTestsJson: input.labTests,
          proceduresJson: input.procedures,
          createdBy: input.actorUserId,
        },
      });

      if (ruleResult.updates.requiresApproval) {
        await tx.approval.create({
          data: {
            organizationId: input.organizationId,
            patientId: input.patientId,
            treatmentPlanId: treatmentPlan.id,
            approvalType: "CONTROLLED_SUBSTANCE",
            status: "PENDING",
            requiredRole: "SENIOR_DOCTOR",
            requestedByUserId: input.actorUserId,
            metadataJson: {
              source: "treatment_plan_rule",
              triggeredRules: ruleResult.triggeredRules,
            },
          },
        });
      }

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "treatment_plan.create",
          entityType: "treatment_plan",
          entityId: treatmentPlan.id,
          afterJson: treatmentPlan,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return treatmentPlan;
    });
  }

  async transition(input: TransitionInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.treatmentPlan.findFirst({
        where: { id: input.treatmentPlanId, organizationId: input.organizationId },
      });

      if (!current) {
        throw notFound("Treatment plan not found");
      }

      const nextStatus = this.workflowEngine.transition(
        workflowDefinitions.treatment_plan,
        String(current.status),
        input.event,
      );

      const pendingApproval =
        nextStatus === "APPROVED"
          ? await tx.approval.findFirst({
              where: {
                organizationId: input.organizationId,
                treatmentPlanId: input.treatmentPlanId,
                status: { in: ["PENDING", "ESCALATED"] },
              },
            })
          : null;

      if (pendingApproval) {
        throw badRequest("Treatment plan cannot be approved while required approvals are pending");
      }

      const result = await tx.treatmentPlan.updateMany({
        where: {
          id: input.treatmentPlanId,
          organizationId: input.organizationId,
          version: input.version,
        },
        data: {
          status: nextStatus,
          approvedBy: nextStatus === "APPROVED" ? input.actorUserId : current.approvedBy,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw conflictVersion("Treatment plan changed by another request");
      }

      const updated = await tx.treatmentPlan.findFirst({ where: { id: input.treatmentPlanId, organizationId: input.organizationId } });

      await tx.workflowTransitionHistory.create({
        data: {
          organizationId: input.organizationId,
          entityType: "treatment_plan",
          entityId: input.treatmentPlanId,
          fromState: String(current.status),
          toState: String(nextStatus),
          event: input.event,
          actorUserId: input.actorUserId,
          reason: input.reason,
        },
      });

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "treatment_plan.transition",
          entityType: "treatment_plan",
          entityId: input.treatmentPlanId,
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