export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "EHCP API",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          requestId: { type: "string" },
          details: {},
        },
        required: ["code", "message", "requestId"],
      },
    },
  },
  paths: {
    "/v1/auth/login": {
      post: {
        summary: "Login",
      },
    },
    "/v1/auth/refresh": {
      post: {
        summary: "Refresh token",
      },
    },
    "/v1/auth/logout": {
      post: {
        summary: "Logout",
      },
    },
    "/v1/auth/me": {
      get: {
        summary: "Current user profile",
      },
    },
    "/v1/tasks": {
      get: {
        summary: "List tasks",
      },
      post: {
        summary: "Create task",
      },
    },
    "/v1/tasks/{id}": {
      patch: {
        summary: "Update task",
      },
    },
    "/v1/tasks/{id}/transition": {
      post: {
        summary: "Transition task state",
      },
    },
    "/v1/patients": {
      get: {
        summary: "List patients",
      },
      post: {
        summary: "Create patient",
      },
    },
    "/v1/appointments": {
      get: {
        summary: "List appointments",
      },
      post: {
        summary: "Create appointment",
      },
    },
    "/v1/appointments/{id}/transition": {
      post: {
        summary: "Transition appointment workflow state",
      },
    },
    "/v1/triage-cases": {
      get: {
        summary: "List triage cases",
      },
      post: {
        summary: "Create triage case",
      },
    },
    "/v1/triage-cases/{id}/transition": {
      post: {
        summary: "Transition triage workflow state",
      },
    },
    "/v1/treatment-plans": {
      get: {
        summary: "List treatment plans",
      },
      post: {
        summary: "Create treatment plan",
      },
    },
    "/v1/treatment-plans/{id}/transition": {
      post: {
        summary: "Transition treatment plan workflow state",
      },
    },
    "/v1/lab-orders": {
      get: {
        summary: "List lab orders",
      },
      post: {
        summary: "Create lab order",
      },
    },
    "/v1/lab-orders/{id}/transition": {
      post: {
        summary: "Transition lab order workflow state",
      },
    },
    "/v1/approvals": {
      get: {
        summary: "List approvals",
      },
      post: {
        summary: "Create approval request",
      },
    },
    "/v1/approvals/{id}/transition": {
      post: {
        summary: "Transition approval workflow state",
      },
    },
    "/v1/billing-triggers": {
      get: {
        summary: "List billing triggers",
      },
      post: {
        summary: "Create billing trigger",
      },
    },
    "/v1/billing-triggers/{id}/transition": {
      post: {
        summary: "Transition billing trigger workflow state",
      },
    },
    "/v1/audit-logs": {
      get: {
        summary: "List immutable audit logs",
      },
    },
    "/v1/reports/overview": {
      get: {
        summary: "Get analytics overview report",
      },
    },
    "/v1/users": {
      get: {
        summary: "List tenant users",
      },
      post: {
        summary: "Create tenant user",
      },
    },
    "/v1/users/roles": {
      get: {
        summary: "List available tenant roles",
      },
    },
  },
} as const;
