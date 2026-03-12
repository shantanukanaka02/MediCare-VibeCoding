export type RuleOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "includes" | "exists";

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value?: unknown;
}

export interface RuleAction {
  field: string;
  value: unknown;
}

export interface RuleDefinition {
  name: string;
  match: "all" | "any";
  conditions: RuleCondition[];
  actions: RuleAction[];
}

export interface RuleEvaluationResult {
  updates: Record<string, unknown>;
  triggeredRules: string[];
}

const getValue = (facts: Record<string, unknown>, field: string): unknown => {
  return field.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, facts);
};

const compare = (factValue: unknown, operator: RuleOperator, expected: unknown): boolean => {
  switch (operator) {
    case "eq":
      return factValue === expected;
    case "ne":
      return factValue !== expected;
    case "gt":
      return Number(factValue) > Number(expected);
    case "gte":
      return Number(factValue) >= Number(expected);
    case "lt":
      return Number(factValue) < Number(expected);
    case "lte":
      return Number(factValue) <= Number(expected);
    case "includes":
      return Array.isArray(factValue) ? factValue.includes(expected) : String(factValue).includes(String(expected));
    case "exists":
      return factValue !== undefined && factValue !== null;
    default:
      return false;
  }
};

export const evaluateRules = (
  rules: RuleDefinition[],
  facts: Record<string, unknown>,
): RuleEvaluationResult => {
  const updates: Record<string, unknown> = {};
  const triggeredRules: string[] = [];

  for (const rule of rules) {
    const results = rule.conditions.map((condition) =>
      compare(getValue(facts, condition.field), condition.operator, condition.value),
    );

    const matched = rule.match === "all" ? results.every(Boolean) : results.some(Boolean);
    if (!matched) {
      continue;
    }

    triggeredRules.push(rule.name);
    for (const action of rule.actions) {
      updates[action.field] = action.value;
    }
  }

  return { updates, triggeredRules };
};