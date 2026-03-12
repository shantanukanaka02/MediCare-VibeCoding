import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { LabOrdersController } from "./lab-orders.controller";
import { LabOrdersService } from "./lab-orders.service";
import { createLabOrderSchema, labOrderIdParamSchema, listLabOrdersSchema, transitionLabOrderSchema } from "./lab-orders.schema";

const controller = new LabOrdersController(new LabOrdersService());

export const labOrdersRouter = Router();
labOrdersRouter.use(authMiddleware, tenantMiddleware);

labOrdersRouter.get(
  "/",
  requirePermission("lab_order", "read"),
  validate(listLabOrdersSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

labOrdersRouter.post(
  "/",
  requirePermission("lab_order", "create"),
  validate(createLabOrderSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

labOrdersRouter.post(
  "/:id/transition",
  requirePermission("lab_order", "transition"),
  validate(labOrderIdParamSchema),
  validate(transitionLabOrderSchema),
  asyncHandler((req, res) => controller.transition(req, res)),
);