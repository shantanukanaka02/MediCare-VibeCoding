import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { validate } from "../../shared/validation/validate";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { requirePermission } from "../../infra/middleware/policy.middleware";
import {
  createTaskSchema,
  listTasksSchema,
  taskIdParamSchema,
  transitionTaskSchema,
  updateTaskSchema,
} from "./tasks.schema";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

const tasksController = new TasksController(new TasksService());

export const tasksRouter = Router();

tasksRouter.use(authMiddleware, tenantMiddleware);

tasksRouter.get(
  "/",
  requirePermission("task", "read"),
  validate(listTasksSchema),
  asyncHandler((req, res) => tasksController.list(req, res)),
);

tasksRouter.post(
  "/",
  requirePermission("task", "create"),
  validate(createTaskSchema),
  asyncHandler((req, res) => tasksController.create(req, res)),
);

tasksRouter.patch(
  "/:id",
  requirePermission("task", "update"),
  validate(taskIdParamSchema),
  validate(updateTaskSchema),
  asyncHandler((req, res) => tasksController.update(req, res)),
);

tasksRouter.post(
  "/:id/transition",
  requirePermission("task", "transition"),
  validate(taskIdParamSchema),
  validate(transitionTaskSchema),
  asyncHandler((req, res) => tasksController.transition(req, res)),
);