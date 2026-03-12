import { Router } from "express";
import { prisma } from "../../config/prisma";
import { validate } from "../../shared/validation/validate";
import { asyncHandler } from "../../shared/http/async-handler";
import { authMiddleware } from "../../infra/middleware/auth.middleware";
import { tenantMiddleware } from "../../infra/middleware/tenant.middleware";
import { bruteForceMiddleware } from "../../infra/middleware/brute-force.middleware";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { loginSchema, logoutSchema, refreshSchema } from "./auth.schema";

const authRepository = new AuthRepository(prisma);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

authRouter.post("/login", bruteForceMiddleware, validate(loginSchema), asyncHandler((req, res) => authController.login(req, res)));
authRouter.post("/refresh", validate(refreshSchema), asyncHandler((req, res) => authController.refresh(req, res)));
authRouter.post("/logout", validate(logoutSchema), asyncHandler((req, res) => authController.logout(req, res)));
authRouter.get("/me", authMiddleware, tenantMiddleware, asyncHandler((req, res) => authController.me(req, res)));