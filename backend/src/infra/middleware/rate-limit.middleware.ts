import type { NextFunction, Request, Response } from "express";
import { redis } from "../../config/redis";
import { env } from "../../config/env";
import { rateLimited } from "../../shared/errors/error-factory";

export const rateLimitMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  void (async () => {
    const identity = req.ip || "unknown";
    const key = `ratelimit:${identity}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, env.RATE_LIMIT_WINDOW_SECONDS);
    }

    if (current > env.RATE_LIMIT_MAX_REQUESTS) {
      next(rateLimited());
      return;
    }

    next();
  })().catch(next);
};