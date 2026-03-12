import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { PatientsService } from "./patients.service";

const getUserAgent = (req: Request): string | undefined =>
  typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  async list(req: Request, res: Response): Promise<void> {
    const patients = await this.patientsService.list(req.context.organizationId!, Number(req.query.limit ?? 25));
    res.status(200).json(success(patients));
  }

  async create(req: Request, res: Response): Promise<void> {
    const patient = await this.patientsService.create(
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

    res.status(201).json(success(patient));
  }
}