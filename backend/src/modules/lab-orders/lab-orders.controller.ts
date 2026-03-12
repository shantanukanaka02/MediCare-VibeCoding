import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { LabOrdersService } from "./lab-orders.service";

const getUserAgent = (req: Request): string | undefined =>
  typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

export class LabOrdersController {
  constructor(private readonly service: LabOrdersService) {}

  async list(req: Request, res: Response): Promise<void> {
    const data = await this.service.list(
      req.context.organizationId!,
      req.query.status as string | undefined,
      req.query.patientId as string | undefined,
    );
    res.status(200).json(success(data));
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = await this.service.create(
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
    res.status(201).json(success(data));
  }

  async transition(req: Request, res: Response): Promise<void> {
    const data = await this.service.transition(
      {
        organizationId: req.context.organizationId!,
        actorUserId: req.context.userId!,
        labOrderId: req.params.id,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: getUserAgent(req),
      },
    );
    res.status(200).json(success(data));
  }
}