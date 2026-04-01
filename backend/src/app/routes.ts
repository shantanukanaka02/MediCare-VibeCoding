import { Router } from "express";
import { healthRouter } from "../modules/health/health.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { tasksRouter } from "../modules/tasks/tasks.routes";
import { patientsRouter } from "../modules/patients/patients.routes";
import { appointmentsRouter } from "../modules/appointments/appointments.routes";
import { triageRouter } from "../modules/triage/triage.routes";
import { treatmentPlansRouter } from "../modules/treatment-plans/treatment-plans.routes";
import { labOrdersRouter } from "../modules/lab-orders/lab-orders.routes";
import { approvalsRouter } from "../modules/approvals/approvals.routes";
import { billingTriggersRouter } from "../modules/billing-triggers/billing-triggers.routes";
import { auditRouter } from "../modules/audit/audit.routes";
import { reportsRouter } from "../modules/reports/reports.routes";
import { usersRouter } from "../modules/users/users.routes";
import { platformAdminRouter } from "../modules/platform-admin/platform-admin.routes";
import { openApiSpec } from "../infra/openapi/spec";

export const apiRouter = Router();

apiRouter.use("/", healthRouter);
apiRouter.use("/v1/auth", authRouter);
apiRouter.use("/v1/tasks", tasksRouter);
apiRouter.use("/v1/patients", patientsRouter);
apiRouter.use("/v1/appointments", appointmentsRouter);
apiRouter.use("/v1/triage-cases", triageRouter);
apiRouter.use("/v1/treatment-plans", treatmentPlansRouter);
apiRouter.use("/v1/lab-orders", labOrdersRouter);
apiRouter.use("/v1/approvals", approvalsRouter);
apiRouter.use("/v1/billing-triggers", billingTriggersRouter);
apiRouter.use("/v1/audit-logs", auditRouter);
apiRouter.use("/v1/reports", reportsRouter);
apiRouter.use("/v1/users", usersRouter);
apiRouter.use("/v1/platform", platformAdminRouter);
apiRouter.get("/openapi.json", (_req, res) => {
  res.status(200).json(openApiSpec);
});
