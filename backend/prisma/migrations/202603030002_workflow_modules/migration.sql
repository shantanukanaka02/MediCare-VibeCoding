CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELED', 'NO_SHOW');
CREATE TYPE "IntakeState" AS ENUM ('DRAFT', 'SUBMITTED', 'TRIAGE_PENDING', 'TRIAGED', 'ASSIGNED_TO_DOCTOR', 'CONSULTED', 'TREATMENT_STARTED', 'COMPLETED', 'FOLLOW_UP_REQUIRED');
CREATE TYPE "TriagePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "TreatmentPlanStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'MODIFIED', 'CLOSED');
CREATE TYPE "LabOrderStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULTS_UPLOADED', 'DOCTOR_REVIEWED', 'PATIENT_NOTIFIED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');
CREATE TYPE "ApprovalType" AS ENUM ('CONTROLLED_SUBSTANCE', 'INSURANCE_PREAUTH', 'CLINICAL_REVIEW');
CREATE TYPE "BillingTriggerStatus" AS ENUM ('PENDING', 'EMITTED', 'FAILED');

CREATE TABLE "appointments" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "provider_user_id" TEXT NOT NULL,
  "appointment_type" TEXT NOT NULL,
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "requires_operating_room" BOOLEAN NOT NULL DEFAULT false,
  "room_id" TEXT,
  "equipment_json" JSONB,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointments_provider_user_id_fkey" FOREIGN KEY ("provider_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "triage_cases" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "intake_state" "IntakeState" NOT NULL DEFAULT 'DRAFT',
  "priority" "TriagePriority" NOT NULL DEFAULT 'MEDIUM',
  "symptoms_json" JSONB,
  "vitals_json" JSONB,
  "assigned_doctor_id" TEXT,
  "created_by" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "triage_cases_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "triage_cases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "triage_cases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "triage_cases_assigned_doctor_id_fkey" FOREIGN KEY ("assigned_doctor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "triage_cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "treatment_plans" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "status" "TreatmentPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "diagnoses_json" JSONB,
  "medications_json" JSONB,
  "lab_tests_json" JSONB,
  "procedures_json" JSONB,
  "created_by" TEXT NOT NULL,
  "approved_by" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "treatment_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "treatment_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "treatment_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "treatment_plans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "lab_orders" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "ordered_by_user_id" TEXT NOT NULL,
  "test_code" TEXT NOT NULL,
  "test_name" TEXT NOT NULL,
  "status" "LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
  "result_summary" TEXT,
  "result_document_url" TEXT,
  "reviewed_by_user_id" TEXT,
  "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sample_collected_at" TIMESTAMP(3),
  "reviewed_at" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lab_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "lab_orders_ordered_by_user_id_fkey" FOREIGN KEY ("ordered_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "lab_orders_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "approvals" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "patient_id" TEXT,
  "treatment_plan_id" TEXT,
  "approval_type" "ApprovalType" NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "required_role" TEXT NOT NULL,
  "requested_by_user_id" TEXT NOT NULL,
  "decision_by_user_id" TEXT,
  "decision_reason" TEXT,
  "metadata_json" JSONB,
  "escalation_role" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "approvals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "approvals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "approvals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "approvals_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "approvals_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "approvals_decision_by_user_id_fkey" FOREIGN KEY ("decision_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "billing_triggers" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "patient_id" TEXT,
  "treatment_plan_id" TEXT,
  "source_entity_type" TEXT NOT NULL,
  "source_entity_id" TEXT NOT NULL,
  "trigger_type" TEXT NOT NULL,
  "status" "BillingTriggerStatus" NOT NULL DEFAULT 'PENDING',
  "payload_json" JSONB,
  "emitted_at" TIMESTAMP(3),
  "failure_reason" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "billing_triggers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_triggers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "billing_triggers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "billing_triggers_treatment_plan_id_fkey" FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "billing_triggers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "appointments_organization_id_id_idx" ON "appointments"("organization_id", "id");
CREATE INDEX "appointments_org_provider_scheduled_idx" ON "appointments"("organization_id", "provider_user_id", "scheduled_at");
CREATE INDEX "appointments_organization_id_status_idx" ON "appointments"("organization_id", "status");

CREATE INDEX "triage_cases_organization_id_id_idx" ON "triage_cases"("organization_id", "id");
CREATE INDEX "triage_cases_org_state_priority_idx" ON "triage_cases"("organization_id", "intake_state", "priority");
CREATE INDEX "triage_cases_org_assigned_doctor_idx" ON "triage_cases"("organization_id", "assigned_doctor_id");

CREATE INDEX "treatment_plans_organization_id_id_idx" ON "treatment_plans"("organization_id", "id");
CREATE INDEX "treatment_plans_org_patient_status_idx" ON "treatment_plans"("organization_id", "patient_id", "status");

CREATE INDEX "lab_orders_organization_id_id_idx" ON "lab_orders"("organization_id", "id");
CREATE INDEX "lab_orders_org_status_ordered_at_idx" ON "lab_orders"("organization_id", "status", "ordered_at");
CREATE INDEX "lab_orders_org_patient_idx" ON "lab_orders"("organization_id", "patient_id");

CREATE INDEX "approvals_organization_id_id_idx" ON "approvals"("organization_id", "id");
CREATE INDEX "approvals_org_status_required_role_idx" ON "approvals"("organization_id", "status", "required_role");
CREATE INDEX "approvals_org_treatment_plan_idx" ON "approvals"("organization_id", "treatment_plan_id");

CREATE INDEX "billing_triggers_organization_id_id_idx" ON "billing_triggers"("organization_id", "id");
CREATE INDEX "billing_triggers_org_status_trigger_type_idx" ON "billing_triggers"("organization_id", "status", "trigger_type");
CREATE INDEX "billing_triggers_org_source_idx" ON "billing_triggers"("organization_id", "source_entity_type", "source_entity_id");