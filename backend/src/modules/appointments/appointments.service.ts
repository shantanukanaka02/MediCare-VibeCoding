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
  providerUserId: string;
  appointmentType: string;
  scheduledAt: string;
  durationMinutes: number;
  requiresOperatingRoom?: boolean;
  roomId?: string;
  equipment?: string[];
}

interface TransitionInput {
  organizationId: string;
  actorUserId: string;
  appointmentId: string;
  event: "check_in" | "complete" | "cancel" | "mark_no_show" | "reopen" | "reschedule";
  reason?: string;
  version: number;
}

export class AppointmentsService {
  private readonly workflowEngine = new WorkflowEngine();
  private readonly auditService = new AuditService(new AuditRepository(prisma));

  async list(organizationId: string, status?: string) {
    return (prisma as any).appointment.findMany({
      where: {
        organizationId,
        status,
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async create(input: CreateInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const patient = await tx.patient.findFirst({ where: { id: input.patientId, organizationId: input.organizationId } });
      if (!patient) {
        throw badRequest("Patient not found in tenant scope");
      }

      const provider = await tx.user.findFirst({ where: { id: input.providerUserId, organizationId: input.organizationId } });
      if (!provider) {
        throw badRequest("Provider not found in tenant scope");
      }

      const requiresOperatingRoom = Boolean(input.requiresOperatingRoom);
      if (input.appointmentType.toLowerCase() === "surgery" && !requiresOperatingRoom) {
        throw badRequest("Surgery appointments require operating room allocation");
      }

      const scheduledAt = new Date(input.scheduledAt);
      const endsAt = new Date(scheduledAt.getTime() + input.durationMinutes * 60 * 1000);

      const overlap = await tx.appointment.findFirst({
        where: {
          organizationId: input.organizationId,
          providerUserId: input.providerUserId,
          status: { in: ["SCHEDULED", "CHECKED_IN"] },
          scheduledAt: { lt: endsAt },
          endsAt: { gt: scheduledAt },
        },
      });

      if (overlap) {
        throw badRequest("Provider already booked for the selected time window");
      }

      const appointment = await tx.appointment.create({
        data: {
          organizationId: input.organizationId,
          patientId: input.patientId,
          providerUserId: input.providerUserId,
          appointmentType: input.appointmentType,
          scheduledAt,
          endsAt,
          durationMinutes: input.durationMinutes,
          requiresOperatingRoom,
          roomId: input.roomId,
          equipmentJson: input.equipment ?? null,
          status: "SCHEDULED",
          createdBy: input.actorUserId,
        },
      });

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "appointment.create",
          entityType: "appointment",
          entityId: appointment.id,
          afterJson: appointment,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return appointment;
    });
  }

  async transition(input: TransitionInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.appointment.findFirst({
        where: { id: input.appointmentId, organizationId: input.organizationId },
      });

      if (!current) {
        throw notFound("Appointment not found");
      }

      const nextStatus = this.workflowEngine.transition(
        workflowDefinitions.appointment,
        String(current.status),
        input.event,
      );

      const result = await tx.appointment.updateMany({
        where: {
          id: input.appointmentId,
          organizationId: input.organizationId,
          version: input.version,
        },
        data: {
          status: nextStatus,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        throw conflictVersion("Appointment changed by another request");
      }

      const updated = await tx.appointment.findFirst({
        where: { id: input.appointmentId, organizationId: input.organizationId },
      });

      await tx.workflowTransitionHistory.create({
        data: {
          organizationId: input.organizationId,
          entityType: "appointment",
          entityId: input.appointmentId,
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
          action: "appointment.transition",
          entityType: "appointment",
          entityId: input.appointmentId,
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