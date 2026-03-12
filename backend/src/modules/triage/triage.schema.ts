import { z } from "zod";

export const listTriageSchema = {
  query: z.object({
    intakeState: z
      .enum(["DRAFT", "SUBMITTED", "TRIAGE_PENDING", "TRIAGED", "ASSIGNED_TO_DOCTOR", "CONSULTED", "TREATMENT_STARTED", "COMPLETED", "FOLLOW_UP_REQUIRED"])
      .optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  }),
};

export const createTriageSchema = {
  body: z.object({
    patientId: z.string().uuid(),
    symptoms: z.array(z.string()).default([]),
    age: z.number().int().min(0).max(120).optional(),
    bloodPressureSystolic: z.number().int().min(40).max(300).optional(),
    assignedDoctorId: z.string().uuid().optional(),
  }),
};

export const transitionTriageSchema = {
  body: z.object({
    event: z.enum(["submit", "queue_triage", "triage", "assign_doctor", "consult", "start_treatment", "complete_case", "mark_follow_up"]),
    reason: z.string().optional(),
    version: z.number().int().positive(),
  }),
};

export const triageIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};