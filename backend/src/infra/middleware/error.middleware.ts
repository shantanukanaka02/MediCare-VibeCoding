import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error";
import { ErrorCodes } from "../../shared/errors/error-codes";
import { logger } from "../../config/logger";

export const errorMiddleware = (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details,
      requestId: req.context?.requestId,
    });
    return;
  }

  logger.error({ err: error, requestId: req.context?.requestId }, "Unhandled error");
  res.status(500).json({
    code: ErrorCodes.INTERNAL_ERROR,
    message: "Internal server error",
    requestId: req.context?.requestId,
  });
};