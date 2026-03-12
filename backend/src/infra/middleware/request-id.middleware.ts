import type { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers["x-request-id"] as string | undefined) ?? uuidv4();
  req.context = { requestId };
  res.setHeader("x-request-id", requestId);
  next();
};