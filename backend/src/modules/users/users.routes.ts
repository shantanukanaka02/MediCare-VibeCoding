import { Router } from "express";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { createUserSchema, listUsersSchema } from "./users.schema";

const controller = new UsersController(new UsersService());

export const usersRouter = Router();
usersRouter.use(authMiddleware, tenantMiddleware);

usersRouter.get(
  "/roles",
  requirePermission("user", "read"),
  asyncHandler((req, res) => controller.listRoles(req, res)),
);

usersRouter.get(
  "/",
  requirePermission("user", "read"),
  validate(listUsersSchema),
  asyncHandler((req, res) => controller.list(req, res)),
);

usersRouter.post(
  "/",
  requirePermission("user", "create"),
  validate(createUserSchema),
  asyncHandler((req, res) => controller.create(req, res)),
);
