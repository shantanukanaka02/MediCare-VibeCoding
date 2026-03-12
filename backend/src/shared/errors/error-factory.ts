import { AppError } from "./app-error";
import { ErrorCodes } from "./error-codes";

export const badRequest = (message: string, details?: unknown): AppError =>
  new AppError(400, ErrorCodes.VALIDATION_ERROR, message, details);

export const unauthorized = (message = "Unauthorized"): AppError =>
  new AppError(401, ErrorCodes.UNAUTHORIZED, message);

export const forbidden = (message = "Forbidden"): AppError =>
  new AppError(403, ErrorCodes.FORBIDDEN, message);

export const notFound = (message = "Not Found"): AppError =>
  new AppError(404, ErrorCodes.NOT_FOUND, message);

export const conflict = (message = "Conflict", details?: unknown): AppError =>
  new AppError(409, ErrorCodes.CONFLICT, message, details);

export const conflictVersion = (message = "Version conflict"): AppError =>
  new AppError(409, ErrorCodes.CONFLICT_VERSION, message);

export const workflowInvalidTransition = (message: string): AppError =>
  new AppError(409, ErrorCodes.WORKFLOW_INVALID_TRANSITION, message);

export const rateLimited = (message = "Too many requests"): AppError =>
  new AppError(429, ErrorCodes.RATE_LIMITED, message);

export const bruteForceLocked = (message = "Account temporarily locked"): AppError =>
  new AppError(423, ErrorCodes.BRUTE_FORCE_LOCKED, message);