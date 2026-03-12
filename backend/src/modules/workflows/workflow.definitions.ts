import type { WorkflowDefinition } from "./workflow.engine";

const taskWorkflow: WorkflowDefinition = {
  entityType: "task",
  transitions: {
    NEW: { assign: "ASSIGNED", cancel: "CANCELED" },
    ASSIGNED: { start: "IN_PROGRESS", cancel: "CANCELED" },
    IN_PROGRESS: { complete: "COMPLETED", cancel: "CANCELED" },
    COMPLETED: { reopen: "IN_PROGRESS" },
    CANCELED: { reopen: "ASSIGNED" },
  },
};

const appointmentWorkflow: WorkflowDefinition = {
  entityType: "appointment",
  transitions: {
    SCHEDULED: { check_in: "CHECKED_IN", cancel: "CANCELED", mark_no_show: "NO_SHOW" },
    CHECKED_IN: { complete: "COMPLETED", cancel: "CANCELED" },
    COMPLETED: {},
    CANCELED: { reopen: "SCHEDULED" },
    NO_SHOW: { reschedule: "SCHEDULED" },
  },
};

const triageWorkflow: WorkflowDefinition = {
  entityType: "triage_case",
  transitions: {
    DRAFT: { submit: "SUBMITTED" },
    SUBMITTED: { queue_triage: "TRIAGE_PENDING" },
    TRIAGE_PENDING: { triage: "TRIAGED" },
    TRIAGED: { assign_doctor: "ASSIGNED_TO_DOCTOR" },
    ASSIGNED_TO_DOCTOR: { consult: "CONSULTED" },
    CONSULTED: { start_treatment: "TREATMENT_STARTED", mark_follow_up: "FOLLOW_UP_REQUIRED" },
    TREATMENT_STARTED: { complete_case: "COMPLETED", mark_follow_up: "FOLLOW_UP_REQUIRED" },
    COMPLETED: { mark_follow_up: "FOLLOW_UP_REQUIRED" },
    FOLLOW_UP_REQUIRED: {},
  },
};

const treatmentPlanWorkflow: WorkflowDefinition = {
  entityType: "treatment_plan",
  transitions: {
    DRAFT: { submit_review: "REVIEW" },
    REVIEW: { approve: "APPROVED", request_changes: "DRAFT" },
    APPROVED: { activate: "ACTIVE" },
    ACTIVE: { modify: "MODIFIED", close: "CLOSED" },
    MODIFIED: { reactivate: "ACTIVE", close: "CLOSED" },
    CLOSED: {},
  },
};

const labOrderWorkflow: WorkflowDefinition = {
  entityType: "lab_order",
  transitions: {
    ORDERED: { collect_sample: "SAMPLE_COLLECTED" },
    SAMPLE_COLLECTED: { process: "PROCESSING" },
    PROCESSING: { upload_results: "RESULTS_UPLOADED" },
    RESULTS_UPLOADED: { doctor_review: "DOCTOR_REVIEWED" },
    DOCTOR_REVIEWED: { notify_patient: "PATIENT_NOTIFIED" },
    PATIENT_NOTIFIED: {},
  },
};

const approvalWorkflow: WorkflowDefinition = {
  entityType: "approval",
  transitions: {
    PENDING: { approve: "APPROVED", reject: "REJECTED", escalate: "ESCALATED" },
    ESCALATED: { approve: "APPROVED", reject: "REJECTED" },
    APPROVED: {},
    REJECTED: { reopen: "PENDING" },
  },
};

const billingTriggerWorkflow: WorkflowDefinition = {
  entityType: "billing_trigger",
  transitions: {
    PENDING: { emit: "EMITTED", fail: "FAILED" },
    FAILED: { retry: "PENDING" },
    EMITTED: {},
  },
};

export const workflowDefinitions: Record<string, WorkflowDefinition> = {
  task: taskWorkflow,
  appointment: appointmentWorkflow,
  triage_case: triageWorkflow,
  treatment_plan: treatmentPlanWorkflow,
  lab_order: labOrderWorkflow,
  approval: approvalWorkflow,
  billing_trigger: billingTriggerWorkflow,
};