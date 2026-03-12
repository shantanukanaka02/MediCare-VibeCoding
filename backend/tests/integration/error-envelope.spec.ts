import express from "express";
import request from "supertest";
import { AppError } from "../../src/shared/errors/app-error";
import { ErrorCodes } from "../../src/shared/errors/error-codes";
import { errorMiddleware } from "../../src/infra/middleware/error.middleware";

describe("error envelope", () => {
  it("returns standardized AppError response", async () => {
    const app = express();
    app.use((req, _res, next) => {
      req.context = { requestId: "req-123" };
      next();
    });

    app.get("/boom", () => {
      throw new AppError(409, ErrorCodes.CONFLICT, "Conflict happened", { field: "version" });
    });

    app.use(errorMiddleware);

    const response = await request(app).get("/boom");

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: ErrorCodes.CONFLICT,
      message: "Conflict happened",
      requestId: "req-123",
      details: { field: "version" },
    });
  });
});