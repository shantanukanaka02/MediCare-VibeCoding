import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { TreatmentPlansController } from "./treatment-plans.controller";
import { TreatmentPlansService } from "./treatment-plans.service";
import {
  createTreatmentPlanSchema,
  listTreatmentPlansSchema,
  transitionTreatmentPlanSchema,
  treatmentPlanIdParamSchema,
} from "./treatment-plans.schema";

const controller = new TreatmentPlansController(new TreatmentPlansService());

export const treatmentPlansRouter = Router();
treatmentPlansRouter.use(authMiddleware, tenantMiddleware);

treatmentPlansRouter.get(
  "/",
  requirePermission("treatment_plan", "read"),
  validate(listTreatmentPlansSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

treatmentPlansRouter.post(
  "/",
  requirePermission("treatment_plan", "create"),
  validate(createTreatmentPlanSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

treatmentPlansRouter.post(
  "/:id/transition",
  requirePermission("treatment_plan", "transition"),
  validate(treatmentPlanIdParamSchema),
  validate(transitionTreatmentPlanSchema),
  asyncHandler((req, res) => controller.transition(req, res)),
);