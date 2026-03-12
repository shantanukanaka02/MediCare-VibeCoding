import { workflowInvalidTransition } from "../../shared/errors/error-factory";

export interface WorkflowDefinition {
  entityType: string;
  transitions: Record<string, Record<string, string>>;
}

export class WorkflowEngine {
  transition(definition: WorkflowDefinition, currentState: string, event: string): string {
    const next = definition.transitions[currentState]?.[event] ?? null;
    if (!next) {
      throw workflowInvalidTransition(
        `Transition not allowed for ${definition.entityType}: ${currentState} --${event}--> ?`,
      );
    }

    return next;
  }
}