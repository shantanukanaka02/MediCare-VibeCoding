import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { TasksService } from "./tasks.service";
import type { TaskStatus } from "./tasks.repository";

const headerUserAgent = (req: Request): string | undefined =>
  typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  async list(req: Request, res: Response): Promise<void> {
    const status = (req.query.status as TaskStatus | undefined) ?? undefined;
    const tasks = await this.tasksService.list(req.context.organizationId!, status);
    res.status(200).json(success(tasks));
  }

  async create(req: Request, res: Response): Promise<void> {
    const task = await this.tasksService.create(
      {
        organizationId: req.context.organizationId!,
        actorUserId: req.context.userId!,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: headerUserAgent(req),
      },
    );

    res.status(201).json(success(task));
  }

  async update(req: Request, res: Response): Promise<void> {
    const task = await this.tasksService.update(
      {
        organizationId: req.context.organizationId!,
        actorUserId: req.context.userId!,
        taskId: req.params.id,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: headerUserAgent(req),
      },
    );

    res.status(200).json(success(task));
  }

  async transition(req: Request, res: Response): Promise<void> {
    const task = await this.tasksService.transition(
      {
        organizationId: req.context.organizationId!,
        actorUserId: req.context.userId!,
        taskId: req.params.id,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: headerUserAgent(req),
      },
    );

    res.status(200).json(success(task));
  }
}