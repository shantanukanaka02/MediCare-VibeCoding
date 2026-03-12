import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { PatientsService } from "./patients.service";
import { PatientsController } from "./patients.controller";
import { createPatientSchema, listPatientsSchema } from "./patients.schema";

const controller = new PatientsController(new PatientsService());

export const patientsRouter = Router();

patientsRouter.use(authMiddleware, tenantMiddleware);

patientsRouter.get(
  "/",
  requirePermission("patient", "read"),
  validate(listPatientsSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

patientsRouter.post(
  "/",
  requirePermission("patient", "create"),
  validate(createPatientSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);