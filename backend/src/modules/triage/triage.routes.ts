import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { TriageService } from "./triage.service";
import { TriageController } from "./triage.controller";
import { createTriageSchema, listTriageSchema, transitionTriageSchema, triageIdParamSchema } from "./triage.schema";

const controller = new TriageController(new TriageService());

export const triageRouter = Router();
triageRouter.use(authMiddleware, tenantMiddleware);

triageRouter.get(
  "/",
  requirePermission("triage_case", "read"),
  validate(listTriageSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

triageRouter.post(
  "/",
  requirePermission("triage_case", "create"),
  validate(createTriageSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

triageRouter.post(
  "/:id/transition",
  requirePermission("triage_case", "transition"),
  validate(triageIdParamSchema),
  validate(transitionTriageSchema),
  asyncHandler((req, res) => controller.transition(req, res)),
);