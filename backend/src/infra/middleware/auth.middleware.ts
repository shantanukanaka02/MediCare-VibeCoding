import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../shared/errors/error-factory";
import { verifyAccessToken } from "../../shared/security/jwt";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(unauthorized("Missing bearer token"));
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const claims = verifyAccessToken(token);
    if (claims.type !== "access") {
      next(unauthorized("Invalid token type"));
      return;
    }

    req.context = {
      ...req.context,
      organizationId: claims.organization_id,
      userId: claims.sub,
      roleIds: claims.role_ids,
      permissions: claims.permissions,
    };
    next();
  } catch {
    next(unauthorized("Invalid access token"));
  }
};