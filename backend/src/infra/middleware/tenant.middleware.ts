import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../shared/errors/error-factory";

export const tenantMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.context?.organizationId) {
    next(unauthorized("Missing organization context"));
    return;
  }

  next();
};