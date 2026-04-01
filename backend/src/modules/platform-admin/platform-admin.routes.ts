import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { PlatformAdminController } from "./platform-admin.controller";
import {
  createPlatformUserSchema,
  createTenantSchema,
  listTenantRolesSchema,
} from "./platform-admin.schema";
import { PlatformAdminService } from "./platform-admin.service";

const controller = new PlatformAdminController(new PlatformAdminService());

export const platformAdminRouter = Router();
platformAdminRouter.use(authMiddleware, tenantMiddleware);

platformAdminRouter.get(
  "/tenants",
  requirePermission("tenant", "read"),
  asyncHandler((req, res) => controller.listTenants(req, res)),
);

platformAdminRouter.post(
  "/tenants",
  requirePermission("tenant", "create"),
  validate(createTenantSchema),
  asyncHandler((req, res) => controller.createTenant(req, res)),
);

platformAdminRouter.get(
  "/tenant-roles",
  requirePermission("platform_user", "create"),
  validate(listTenantRolesSchema),
  asyncHandler((req, res) => controller.listTenantRoles(req, res)),
);

platformAdminRouter.get(
  "/role-catalog",
  requirePermission("platform_user", "create"),
  asyncHandler((req, res) => controller.listRoleCatalog(req, res)),
);

platformAdminRouter.post(
  "/users",
  requirePermission("platform_user", "create"),
  validate(createPlatformUserSchema),
  asyncHandler((req, res) => controller.createTenantUser(req, res)),
);
