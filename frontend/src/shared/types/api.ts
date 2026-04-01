export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  requestId: string;
  details?: unknown;
}

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type Permission = `${string}:${string}`;

export interface TaskRecord {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  status: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";
  assigneeUserId?: string;
  dueAt?: string;
  version: number;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  organizationId: string;
  externalRef?: string | null;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  createdAt: string;
}

export type AppointmentStatus = "SCHEDULED" | "CHECKED_IN" | "COMPLETED" | "CANCELED" | "NO_SHOW";
export type AppointmentTransitionEvent = "check_in" | "complete" | "cancel" | "mark_no_show" | "reopen" | "reschedule";

export interface AppointmentRecord {
  id: string;
  organizationId: string;
  patientId: string;
  providerUserId: string;
  appointmentType: string;
  scheduledAt: string;
  endsAt: string;
  durationMinutes: number;
  requiresOperatingRoom: boolean;
  roomId?: string | null;
  equipmentJson?: unknown;
  status: AppointmentStatus;
  version: number;
  createdAt: string;
}

export type IntakeState =
  | "DRAFT"
  | "SUBMITTED"
  | "TRIAGE_PENDING"
  | "TRIAGED"
  | "ASSIGNED_TO_DOCTOR"
  | "CONSULTED"
  | "TREATMENT_STARTED"
  | "COMPLETED"
  | "FOLLOW_UP_REQUIRED";

export type TriageTransitionEvent =
  | "submit"
  | "queue_triage"
  | "triage"
  | "assign_doctor"
  | "consult"
  | "start_treatment"
  | "complete_case"
  | "mark_follow_up";

export interface TriageCaseRecord {
  id: string;
  organizationId: string;
  patientId: string;
  intakeState: IntakeState;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  symptomsJson?: unknown;
  vitalsJson?: unknown;
  assignedDoctorId?: string | null;
  version: number;
  createdAt: string;
}

export type TreatmentPlanStatus = "DRAFT" | "REVIEW" | "APPROVED" | "ACTIVE" | "MODIFIED" | "CLOSED";
export type TreatmentTransitionEvent =
  | "submit_review"
  | "approve"
  | "request_changes"
  | "activate"
  | "modify"
  | "reactivate"
  | "close";

export interface TreatmentPlanRecord {
  id: string;
  organizationId: string;
  patientId: string;
  status: TreatmentPlanStatus;
  diagnosesJson?: unknown;
  medicationsJson?: unknown;
  labTestsJson?: unknown;
  proceduresJson?: unknown;
  version: number;
  createdAt: string;
}

export type LabOrderStatus = "ORDERED" | "SAMPLE_COLLECTED" | "PROCESSING" | "RESULTS_UPLOADED" | "DOCTOR_REVIEWED" | "PATIENT_NOTIFIED";
export type LabTransitionEvent = "collect_sample" | "process" | "upload_results" | "doctor_review" | "notify_patient";

export interface LabOrderRecord {
  id: string;
  organizationId: string;
  patientId: string;
  orderedByUserId: string;
  testCode: string;
  testName: string;
  status: LabOrderStatus;
  resultSummary?: string | null;
  resultDocumentUrl?: string | null;
  reviewedByUserId?: string | null;
  version: number;
  orderedAt: string;
}

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED";
export type ApprovalTransitionEvent = "approve" | "reject" | "escalate" | "reopen";

export interface ApprovalRecord {
  id: string;
  organizationId: string;
  patientId?: string | null;
  treatmentPlanId?: string | null;
  approvalType: "CONTROLLED_SUBSTANCE" | "INSURANCE_PREAUTH" | "CLINICAL_REVIEW";
  status: ApprovalStatus;
  requiredRole: string;
  requestedByUserId: string;
  decisionByUserId?: string | null;
  decisionReason?: string | null;
  metadataJson?: unknown;
  escalationRole?: string | null;
  version: number;
  createdAt: string;
}

export type BillingStatus = "PENDING" | "EMITTED" | "FAILED";
export type BillingTransitionEvent = "emit" | "fail" | "retry";

export interface BillingTriggerRecord {
  id: string;
  organizationId: string;
  patientId?: string | null;
  treatmentPlanId?: string | null;
  sourceEntityType: string;
  sourceEntityId: string;
  triggerType: string;
  status: BillingStatus;
  payloadJson?: unknown;
  emittedAt?: string | null;
  failureReason?: string | null;
  version: number;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  requestId: string;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface ReportsOverview {
  range: {
    from: string;
    to: string;
  };
  clinical: {
    patientsInflow: number;
    triageDistribution: Array<{ priority: string; count: number }>;
  };
  operational: {
    totalAppointments: number;
    appointmentNoShowRatePercent: number;
    labTurnaroundHoursAvg: number;
  };
  compliance: {
    openApprovals: number;
    pendingBilling: number;
  };
}

export interface UserRecord {
  id: string;
  organizationId: string;
  email: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  roles: string[];
}

export interface RoleRecord {
  id: string;
  name: string;
  isSystem: boolean;
}

export interface TenantRecord {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  userCount: number;
}
