import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { AuditService } from "./audit.service";

export class AuditController {
  constructor(private readonly service: AuditService) {}

  async list(req: Request, res: Response): Promise<void> {
    const logs = await this.service.list(req.context.organizationId!, {
      entityType: typeof req.query.entityType === "string" ? req.query.entityType : undefined,
      entityId: typeof req.query.entityId === "string" ? req.query.entityId : undefined,
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      actorUserId: typeof req.query.actorUserId === "string" ? req.query.actorUserId : undefined,
      limit: Number(req.query.limit),
    });

    res.status(200).json(success(logs));
  }
}
