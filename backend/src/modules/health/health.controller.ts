import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { redis } from "../../config/redis";

export class HealthController {
  async health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ status: "ok" });
  }

  async readiness(_req: Request, res: Response): Promise<void> {
    await prisma.organization.count({ take: 1 });
    const cache = await redis.ping();

    res.status(200).json({
      status: "ready",
      dependencies: {
        db: "ok",
        redis: cache,
      },
    });
  }
}