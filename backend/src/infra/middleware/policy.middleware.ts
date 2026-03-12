import type { NextFunction, Request, Response } from "express";
import { forbidden } from "../../shared/errors/error-factory";
import { PolicyService } from "../../modules/policies/policy.service";

const policyService = new PolicyService();

export const requirePermission = (resource: string, action: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const allowed = policyService.can(
      {
        userId: req.context.userId ?? "",
        organizationId: req.context.organizationId ?? "",
        permissions: req.context.permissions ?? [],
      },
      action,
      resource,
    );

    if (!allowed) {
      next(forbidden(`Missing permission: ${resource}:${action}`));
      return;
    }

    next();
  };