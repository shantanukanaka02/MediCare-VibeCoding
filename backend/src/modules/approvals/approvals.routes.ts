import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { ApprovalsController } from "./approvals.controller";
import { ApprovalsService } from "./approvals.service";
import { approvalIdParamSchema, createApprovalSchema, listApprovalsSchema, transitionApprovalSchema } from "./approvals.schema";

const controller = new ApprovalsController(new ApprovalsService());

export const approvalsRouter = Router();
approvalsRouter.use(authMiddleware, tenantMiddleware);

approvalsRouter.get(
  "/",
  requirePermission("approval", "read"),
  validate(listApprovalsSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

approvalsRouter.post(
  "/",
  requirePermission("approval", "create"),
  validate(createApprovalSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

approvalsRouter.post(
  "/:id/transition",
  requirePermission("approval", "transition"),
  validate(approvalIdParamSchema),
  validate(transitionApprovalSchema),
  asyncHandler((req, res) => controller.transition(req, res)),
);