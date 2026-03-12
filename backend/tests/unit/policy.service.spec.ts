import { PolicyService } from "../../src/modules/policies/policy.service";

const policyService = new PolicyService();

describe("PolicyService", () => {
  it("grants when permission exists", () => {
    const result = policyService.can(
      {
        userId: "u1",
        organizationId: "o1",
        permissions: ["task:read", "task:create"],
      },
      "read",
      "task",
    );

    expect(result).toBe(true);
  });

  it("denies when permission is missing", () => {
    const result = policyService.can(
      {
        userId: "u1",
        organizationId: "o1",
        permissions: ["task:read"],
      },
      "transition",
      "task",
    );

    expect(result).toBe(false);
  });
});