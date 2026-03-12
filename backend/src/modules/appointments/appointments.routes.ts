import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import {
  appointmentIdParamSchema,
  createAppointmentSchema,
  listAppointmentsSchema,
  transitionAppointmentSchema,
} from "./appointments.schema";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsController } from "./appointments.controller";

const controller = new AppointmentsController(new AppointmentsService());

export const appointmentsRouter = Router();
appointmentsRouter.use(authMiddleware, tenantMiddleware);

appointmentsRouter.get(
  "/",
  requirePermission("appointment", "read"),
  validate(listAppointmentsSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

appointmentsRouter.post(
  "/",
  requirePermission("appointment", "create"),
  validate(createAppointmentSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);

appointmentsRouter.post(
  "/:id/transition",
  requirePermission("appointment", "transition"),
  validate(appointmentIdParamSchema),
  validate(transitionAppointmentSchema),
  asyncHandler((req, res) => controller.transition(req, res)),
);