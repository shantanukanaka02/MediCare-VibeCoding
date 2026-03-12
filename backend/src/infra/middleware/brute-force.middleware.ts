import type { NextFunction, Request, Response } from "express";
import { redis } from "../../config/redis";
import { env } from "../../config/env";
import { bruteForceLocked } from "../../shared/errors/error-factory";

export const bruteForceMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  void (async () => {
    const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "unknown";
    const ip = req.ip || "unknown";
    const key = `bruteforce:${ip}:${email}`;

    const current = await redis.get(key);
    if (current && Number(current) >= env.BRUTE_FORCE_MAX_ATTEMPTS) {
      next(bruteForceLocked("Too many failed login attempts"));
      return;
    }

    next();
  })().catch(next);
};

export const registerFailedAttempt = async (ip: string, email: string): Promise<void> => {
  const key = `bruteforce:${ip}:${email.toLowerCase()}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, env.BRUTE_FORCE_WINDOW_SECONDS);
  }
};

export const clearFailedAttempts = async (ip: string, email: string): Promise<void> => {
  const key = `bruteforce:${ip}:${email.toLowerCase()}`;
  await redis.del(key);
};