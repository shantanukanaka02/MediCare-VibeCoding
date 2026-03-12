import type { Request, Response } from "express";
import { success } from "../../shared/http/response";
import { ReportsService } from "./reports.service";

export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  async overview(req: Request, res: Response): Promise<void> {
    const data = await this.service.overview({
      organizationId: req.context.organizationId!,
      from: typeof req.query.from === "string" ? req.query.from : undefined,
      to: typeof req.query.to === "string" ? req.query.to : undefined,
    });

    res.status(200).json(success(data));
  }
}
