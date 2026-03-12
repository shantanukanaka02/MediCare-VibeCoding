import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { BillingTriggersController } from "./billing-triggers.controller";
import { BillingTriggersService } from "./billing-triggers.service";
import {
  billingTriggerIdParamSchema,
  createBillingTriggerSchema,
  listBillingTriggersSchema,
  transitionBillingTriggerSchema,
} from "./billing-triggers.schema";

const controller = new BillingTriggersController(new BillingTriggersService());

export const billingTriggersRouter = Router();
billingTriggersRouter.use(authMiddleware, tenantMiddleware);

billingTriggersRouter.get(
  "/",
  requirePermission("billing_trigger", "read"),
  validate(listBillingTriggersSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

billingTriggersRouter.post(
  "/",
  requirePermission("billing_trigger", "create"),
  validate(createBillingTriggerSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

billingTriggersRouter.post(
  "/:id/transition",
  requirePermission("billing_trigger", "transition"),
  validate(billingTriggerIdParamSchema),
  validate(transitionBillingTriggerSchema),
  asyncHandler((req, res) => controller.transition(req, res)),
);