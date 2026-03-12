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
  symptoms: string[];
  age?: number;
  bloodPressureSystolic?: number;
  assignedDoctorId?: string;
}

interface TransitionInput {
  organizationId: string;
  actorUserId: string;
  triageCaseId: string;
  event: "submit" | "queue_triage" | "triage" | "assign_doctor" | "consult" | "start_treatment" | "complete_case" | "mark_follow_up";
  reason?: string;
  version: number;
}

const triageRules: RuleDefinition[] = [
  {
    name: "chest_pain_high_priority",
    match: "all",
    conditions: [{ field: "symptoms", operator: "includes", value: "Chest Pain" }],
    actions: [{ field: "priority", value: "HIGH" }],
  },
  {
    name: "elderly_hypertension_escalation",
    match: "all",
    conditions: [
      { field: "age", operator: "gt", value: 65 },
      { field: "bloodPressureSystolic", operator: "gt", value: 160 },
    ],
    actions: [{ field: "priority", value: "CRITICAL" }],
  },
];

export class TriageService {
  private readonly workflowEngine = new WorkflowEngine();
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, intakeState?: string, priority?: string) {
    return (prisma as any).triageCase.findMany({
      where: {
        organizationId,
        intakeState,
        priority,
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

      if (input.assignedDoctorId) {
        const doctor = await tx.user.findFirst({ where: { id: input.assignedDoctorId, organizationId: input.organizationId } });
        if (!doctor) {
          throw badRequest("Assigned doctor not found in tenant scope");
        }
      }

      const ruleResult = evaluateRules(triageRules, {
        symptoms: input.symptoms,
        age: input.age,
        bloodPressureSystolic: input.bloodPressureSystolic,
      });

      const triageCase = await tx.triageCase.create({
        data: {
          organizationId: input.organizationId,
          patientId: input.patientId,
          intakeState: "DRAFT",
          priority: (ruleResult.updates.priority as string | undefined) ?? "MEDIUM",
          symptomsJson: input.symptoms,
          vitalsJson: {
            age: input.age,
            bloodPressureSystolic: input.bloodPressureSystolic,
            triggeredRules: ruleResult.triggeredRules,
          },
          assignedDoctorId: input.assignedDoctorId,
          createdBy: input.actorUserId,
        },
      });

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "triage_case.create",
          entityType: "triage_case",
          entityId: triageCase.id,
          afterJson: triageCase,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return triageCase;
    });
  }

  async transition(input: TransitionInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.triageCase.findFirst({
        where: { id: input.triageCaseId, organizationId: input.organizationId },
      });
      if (!current) {
        throw notFound("Triage case not found");
      }

      const nextState = this.workflowEngine.transition(
        workflowDefinitions.triage_case,
        String(current.intakeState),
        input.event,
      );

      const updatedResult = await tx.triageCase.updateMany({
        where: {
          id: input.triageCaseId,
          organizationId: input.organizationId,
          version: input.version,
        },
        data: {
          intakeState: nextState,
          version: { increment: 1 },
        },
      });

      if (updatedResult.count === 0) {
        throw conflictVersion("Triage case changed by another request");
      }

      const updated = await tx.triageCase.findFirst({
        where: { id: input.triageCaseId, organizationId: input.organizationId },
      });

      await tx.workflowTransitionHistory.create({
        data: {
          organizationId: input.organizationId,
          entityType: "triage_case",
          entityId: input.triageCaseId,
          fromState: String(current.intakeState),
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
          action: "triage_case.transition",
          entityType: "triage_case",
          entityId: input.triageCaseId,
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