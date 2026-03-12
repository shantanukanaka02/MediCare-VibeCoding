import { Router } from "express";
import { asyncHandler } from "../../shared/http/async-handler";
import { HealthController } from "./health.controller";

const controller = new HealthController();

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler((req, res) => controller.health(req, res)));
healthRouter.get("/ready", asyncHandler((req, res) => controller.readiness(req, res)));