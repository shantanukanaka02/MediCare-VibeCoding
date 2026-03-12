import { openApiSpec } from "../../src/infra/openapi/spec";

describe("OpenAPI contract", () => {
  it("exposes required auth endpoints", () => {
    expect(openApiSpec.paths["/v1/auth/login"]).toBeDefined();
    expect(openApiSpec.paths["/v1/auth/refresh"]).toBeDefined();
    expect(openApiSpec.paths["/v1/auth/logout"]).toBeDefined();
    expect(openApiSpec.paths["/v1/auth/me"]).toBeDefined();
  });

  it("exposes task workflow endpoints", () => {
    expect(openApiSpec.paths["/v1/tasks"]).toBeDefined();
    expect(openApiSpec.paths["/v1/tasks/{id}/transition"]).toBeDefined();
  });

  it("exposes patient endpoints", () => {
    expect(openApiSpec.paths["/v1/patients"]).toBeDefined();
  });

  it("exposes new workflow module endpoints", () => {
    expect(openApiSpec.paths["/v1/appointments"]).toBeDefined();
    expect(openApiSpec.paths["/v1/triage-cases"]).toBeDefined();
    expect(openApiSpec.paths["/v1/treatment-plans"]).toBeDefined();
    expect(openApiSpec.paths["/v1/lab-orders"]).toBeDefined();
    expect(openApiSpec.paths["/v1/approvals"]).toBeDefined();
    expect(openApiSpec.paths["/v1/billing-triggers"]).toBeDefined();
  });
});
