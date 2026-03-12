import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { reportsOverviewSchema } from "./reports.schema";

const controller = new ReportsController(new ReportsService());

export const reportsRouter = Router();
reportsRouter.use(authMiddleware, tenantMiddleware);

reportsRouter.get(
  "/overview",
  requirePermission("report", "read"),
  validate(reportsOverviewSchema),
  asyncHandler((req, res) => controller.overview(req, res)),
);
