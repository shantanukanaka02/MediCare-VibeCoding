import cors from "cors";
import express, { type Request } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { apiRouter } from "./routes";
import { logger } from "../config/logger";
import { corsOptions, helmetConfig } from "../config/security";
import { requestIdMiddleware } from "../infra/middleware/request-id.middleware";
import { rateLimitMiddleware } from "../infra/middleware/rate-limit.middleware";
import { errorMiddleware } from "../infra/middleware/error.middleware";

export const buildApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: (req as Request).context?.requestId }),
    }),
  );
  app.use(helmet(helmetConfig));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimitMiddleware);

  app.use(apiRouter);
  app.use(errorMiddleware);

  return app;
};