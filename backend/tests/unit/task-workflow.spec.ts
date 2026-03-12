import { WorkflowEngine } from "../../src/modules/workflows/workflow.engine";
import { workflowDefinitions } from "../../src/modules/workflows/workflow.definitions";
import { evaluateRules } from "../../src/modules/workflows/rule-evaluator";

describe("workflow engine", () => {
  const engine = new WorkflowEngine();

  it("transitions task ASSIGNED -> IN_PROGRESS", () => {
    const next = engine.transition(workflowDefinitions.task, "ASSIGNED", "start");
    expect(next).toBe("IN_PROGRESS");
  });

  it("transitions treatment plan REVIEW -> APPROVED", () => {
    const next = engine.transition(workflowDefinitions.treatment_plan, "REVIEW", "approve");
    expect(next).toBe("APPROVED");
  });

  it("rejects invalid transition", () => {
    expect(() => engine.transition(workflowDefinitions.lab_order, "ORDERED", "doctor_review")).toThrow();
  });
});

describe("rule evaluator", () => {
  it("applies triage escalation rules", () => {
    const result = evaluateRules(
      [
        {
          name: "chest_pain_rule",
          match: "all",
          conditions: [{ field: "symptoms", operator: "includes", value: "Chest Pain" }],
          actions: [{ field: "priority", value: "HIGH" }],
        },
      ],
      {
        symptoms: ["Chest Pain", "Headache"],
      },
    );

    expect(result.updates.priority).toBe("HIGH");
    expect(result.triggeredRules).toContain("chest_pain_rule");
  });
});