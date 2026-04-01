import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { PlatformAdminService } from "./platform-admin.service";

const getUserAgent = (req: Request): string | undefined =>
  typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

export class PlatformAdminController {
  constructor(private readonly service: PlatformAdminService) {}

  async listTenants(_req: Request, res: Response): Promise<void> {
    const tenants = await this.service.listTenants();
    res.status(200).json(success(tenants));
  }

  async createTenant(req: Request, res: Response): Promise<void> {
    const tenant = await this.service.createTenant(
      {
        actorUserId: req.context.userId!,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: getUserAgent(req),
      },
    );
    res.status(201).json(success(tenant));
  }

  async listTenantRoles(req: Request, res: Response): Promise<void> {
    const roles = await this.service.listTenantRoles(String(req.query.organizationId));
    res.status(200).json(success(roles));
  }

  async listRoleCatalog(_req: Request, res: Response): Promise<void> {
    const roles = await this.service.listRoleCatalog();
    res.status(200).json(success(roles));
  }

  async createTenantUser(req: Request, res: Response): Promise<void> {
    const user = await this.service.createTenantUser(
      {
        actorUserId: req.context.userId!,
        ...req.body,
      },
      {
        requestId: req.context.requestId,
        ip: req.ip,
        userAgent: getUserAgent(req),
      },
    );

    res.status(201).json(success(user));
  }
}
