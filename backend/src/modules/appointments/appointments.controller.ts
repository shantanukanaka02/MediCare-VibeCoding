import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { AppointmentsService } from "./appointments.service";

const getUserAgent = (req: Request): string | undefined =>
  typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  async list(req: Request, res: Response): Promise<void> {
    const items = await this.service.list(req.context.organizationId!, req.query.status as string | undefined);
    res.status(200).json(success(items));
  }

  async create(req: Request, res: Response): Promise<void> {
    const item = await this.service.create(
      {
        organizationId: req.context.organizationId!,
        actorUserId: req.context.userId!,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: getUserAgent(req),
      },
    );

    res.status(201).json(success(item));
  }

  async transition(req: Request, res: Response): Promise<void> {
    const item = await this.service.transition(
      {
        organizationId: req.context.organizationId!,
        actorUserId: req.context.userId!,
        appointmentId: req.params.id,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: getUserAgent(req),
      },
    );

    res.status(200).json(success(item));
  }
}