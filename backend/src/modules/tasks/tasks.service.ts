import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { notFound, conflictVersion, badRequest } from "../../shared/errors/error-factory";
import { enqueueNotification } from "../../infra/jobs/queues";
import { AuditService } from "../audit/audit.service";
import { AuditRepository } from "../audit/audit.repository";
import { WorkflowEngine } from "../workflows/workflow.engine";
import { workflowDefinitions } from "../workflows/workflow.definitions";
import { TasksRepository, type TaskStatus } from "./tasks.repository";

interface RequestMeta {
  requestId: string;
  ip?: string;
  userAgent?: string;
}

interface CreateTaskInput {
  organizationId: string;
  actorUserId: string;
  title: string;
  description?: string;
  patientId?: string;
  assigneeUserId?: string;
  dueAt?: string;
}

interface UpdateTaskInput {
  organizationId: string;
  actorUserId: string;
  taskId: string;
  title?: string;
  description?: string;
  assigneeUserId?: string | null;
  dueAt?: string | null;
  version: number;
}

interface TransitionTaskInput {
  organizationId: string;
  actorUserId: string;
  taskId: string;
  event: "assign" | "start" | "complete" | "cancel" | "reopen";
  reason?: string;
  version: number;
}

export class TasksService {
  private readonly tasksRepository = new TasksRepository(prisma);

  private readonly auditService = new AuditService(new AuditRepository(prisma));
  private readonly workflowEngine = new WorkflowEngine();

  async list(organizationId: string, status?: TaskStatus) {
    return this.tasksRepository.listByOrganization(organizationId, { status });
  }

  async create(input: CreateTaskInput, meta: RequestMeta) {
    const { task, enqueue } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (input.patientId) {
        const patientExists = await this.tasksRepository.patientExists(input.organizationId, input.patientId, tx);
        if (!patientExists) {
          throw badRequest("Patient not found in tenant scope");
        }
      }

      if (input.assigneeUserId) {
        const assigneeExists = await this.tasksRepository.userExists(input.organizationId, input.assigneeUserId, tx);
        if (!assigneeExists) {
          throw badRequest("Assignee not found in tenant scope");
        }
      }

      const initialStatus: TaskStatus = input.assigneeUserId ? "ASSIGNED" : "NEW";
      const task = await this.tasksRepository.createTask(
        {
          organizationId: input.organizationId,
          title: input.title,
          description: input.description,
          patientId: input.patientId,
          assigneeUserId: input.assigneeUserId,
          dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
          status: initialStatus,
          createdBy: input.actorUserId,
        },
        tx,
      );

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "task.create",
          entityType: "task",
          entityId: task.id,
          afterJson: task,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return {
        task,
        enqueue: task.assigneeUserId
          ? {
              type: "task.assigned",
              taskId: task.id,
              assigneeUserId: task.assigneeUserId,
              organizationId: input.organizationId,
              idempotencyKey: `${task.id}:${task.version}`,
            }
          : null,
      };
    });

    if (enqueue) {
      await enqueueNotification(
        {
          type: enqueue.type,
          taskId: enqueue.taskId,
          assigneeUserId: enqueue.assigneeUserId,
          organizationId: enqueue.organizationId,
        },
        enqueue.idempotencyKey,
      );
    }

    return task;
  }

  async update(input: UpdateTaskInput, meta: RequestMeta) {
    const { updatedTask, enqueue } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingTask = await this.tasksRepository.findById(input.organizationId, input.taskId, tx);
      if (!existingTask) {
        throw notFound("Task not found");
      }

      if (input.assigneeUserId) {
        const assigneeExists = await this.tasksRepository.userExists(input.organizationId, input.assigneeUserId, tx);
        if (!assigneeExists) {
          throw badRequest("Assignee not found in tenant scope");
        }
      }

      const updatedTask = await this.tasksRepository.updateTaskWithVersion(
        input.organizationId,
        input.taskId,
        input.version,
        {
          title: input.title,
          description: input.description,
          assigneeUserId: input.assigneeUserId,
          dueAt: input.dueAt === null ? null : input.dueAt ? new Date(input.dueAt) : undefined,
        },
        tx,
      );

      if (!updatedTask) {
        throw conflictVersion("Task was updated by another request");
      }

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "task.update",
          entityType: "task",
          entityId: updatedTask.id,
          beforeJson: existingTask,
          afterJson: updatedTask,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return {
        updatedTask,
        enqueue:
          updatedTask.assigneeUserId && updatedTask.assigneeUserId !== existingTask.assigneeUserId
            ? {
                type: "task.reassigned",
                taskId: updatedTask.id,
                assigneeUserId: updatedTask.assigneeUserId,
                organizationId: input.organizationId,
                idempotencyKey: `${updatedTask.id}:${updatedTask.version}`,
              }
            : null,
      };
    });

    if (enqueue) {
      await enqueueNotification(
        {
          type: enqueue.type,
          taskId: enqueue.taskId,
          assigneeUserId: enqueue.assigneeUserId,
          organizationId: enqueue.organizationId,
        },
        enqueue.idempotencyKey,
      );
    }

    return updatedTask;
  }

  async transition(input: TransitionTaskInput, meta: RequestMeta) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingTask = await this.tasksRepository.findById(input.organizationId, input.taskId, tx);
      if (!existingTask) {
        throw notFound("Task not found");
      }

      const nextStatus = this.workflowEngine.transition(
        workflowDefinitions.task,
        String(existingTask.status),
        input.event,
      ) as TaskStatus;

      const transitionedTask = await this.tasksRepository.updateTaskWithVersion(
        input.organizationId,
        input.taskId,
        input.version,
        { status: nextStatus },
        tx,
      );

      if (!transitionedTask) {
        throw conflictVersion("Task state changed during transition");
      }

      await this.tasksRepository.createTransitionHistory(
        {
          organizationId: input.organizationId,
          entityType: "task",
          entityId: transitionedTask.id,
          fromState: String(existingTask.status),
          toState: nextStatus,
          event: input.event,
          actorUserId: input.actorUserId,
          reason: input.reason,
        },
        tx,
      );

      await this.auditService.log(
        {
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          action: "task.transition",
          entityType: "task",
          entityId: transitionedTask.id,
          beforeJson: existingTask,
          afterJson: transitionedTask,
          requestId: meta.requestId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
        tx,
      );

      return transitionedTask;
    });
  }
}
