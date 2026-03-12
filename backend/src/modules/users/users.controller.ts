import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { UsersService } from "./users.service";

const getUserAgent = (req: Request): string | undefined =>
  typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined;

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async list(req: Request, res: Response): Promise<void> {
    const users = await this.usersService.list(req.context.organizationId!, Number(req.query.limit ?? 50));
    res.status(200).json(success(users));
  }

  async listRoles(req: Request, res: Response): Promise<void> {
    const roles = await this.usersService.listRoles(req.context.organizationId!);
    res.status(200).json(success(roles));
  }

  async create(req: Request, res: Response): Promise<void> {
    const user = await this.usersService.create(
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

    res.status(201).json(success(user));
  }
}
