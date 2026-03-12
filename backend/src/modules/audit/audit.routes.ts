import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { AuditController } from "./audit.controller";
import { AuditRepository } from "./audit.repository";
import { AuditService } from "./audit.service";
import { listAuditLogsSchema } from "./audit.schema";

const controller = new AuditController(new AuditService(new AuditRepository(prisma)));

export const auditRouter = Router();
auditRouter.use(authMiddleware, tenantMiddleware);

auditRouter.get(
  "/",
  requirePermission("audit_log", "read"),
  validate(listAuditLogsSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);
