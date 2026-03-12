export type TaskWorkflowState = "NEW" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
export type TaskWorkflowEvent = "assign" | "start" | "complete" | "cancel" | "reopen";

const transitions: Record<TaskWorkflowState, Partial<Record<TaskWorkflowEvent, TaskWorkflowState>>> = {
  NEW: { assign: "ASSIGNED", cancel: "CANCELED" },
  ASSIGNED: { start: "IN_PROGRESS", cancel: "CANCELED" },
  IN_PROGRESS: { complete: "COMPLETED", cancel: "CANCELED" },
  COMPLETED: { reopen: "IN_PROGRESS" },
  CANCELED: { reopen: "ASSIGNED" },
};

export const resolveTaskTransition = (
  from: TaskWorkflowState,
  event: TaskWorkflowEvent,
): TaskWorkflowState | null => transitions[from][event] ?? null;