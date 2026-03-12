import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    const result = await this.authService.login({
      organizationId: req.body.organizationId,
      email: req.body.email,
      password: req.body.password,
      ip: req.ip || "unknown",
    });

    res.status(200).json(success(result));
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const result = await this.authService.refresh(req.body.refreshToken);
    res.status(200).json(success(result));
  }

  async logout(req: Request, res: Response): Promise<void> {
    await this.authService.logout(req.body.refreshToken);
    res.status(204).send();
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await this.authService.me(req.context.userId!, req.context.organizationId!);
    res.status(200).json(success(user));
  }
}