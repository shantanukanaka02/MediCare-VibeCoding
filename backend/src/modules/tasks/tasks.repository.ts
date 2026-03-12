import type { Prisma, PrismaClient } from "@prisma/client";

export type TaskStatus = "NEW" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

interface ListTaskFilters {
  status?: TaskStatus;
}

interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  assigneeUserId?: string | null;
  dueAt?: Date | null;
}

export class TasksRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByOrganization(organizationId: string, filters: ListTaskFilters) {
    return this.prisma.task.findMany({
      where: {
        organizationId,
        status: filters.status,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(organizationId: string, taskId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.task.findFirst({
      where: {
        id: taskId,
        organizationId,
      },
    });
  }

  async patientExists(organizationId: string, patientId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx ?? this.prisma;
    const patient = await client.patient.findFirst({
      where: { id: patientId, organizationId },
      select: { id: true },
    });
    return Boolean(patient);
  }

  async userExists(organizationId: string, userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx ?? this.prisma;
    const user = await client.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true },
    });
    return Boolean(user);
  }

  async createTask(
    data: {
      organizationId: string;
      patientId?: string;
      title: string;
      description?: string;
      assigneeUserId?: string;
      dueAt?: Date;
      status: TaskStatus;
      createdBy: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    return tx.task.create({
      data,
    });
  }

  async updateTaskWithVersion(
    organizationId: string,
    taskId: string,
    version: number,
    payload: UpdateTaskPayload & { status?: TaskStatus },
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.task.updateMany({
      where: {
        id: taskId,
        organizationId,
        version,
      },
      data: {
        ...payload,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return null;
    }

    return tx.task.findFirst({
      where: {
        id: taskId,
        organizationId,
      },
    });
  }

  async createTransitionHistory(
    data: {
      organizationId: string;
      entityType: string;
      entityId: string;
      fromState: string;
      toState: string;
      event: string;
      actorUserId: string;
      reason?: string;
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.workflowTransitionHistory.create({
      data,
    });
  }
}