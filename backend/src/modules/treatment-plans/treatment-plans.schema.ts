import { z } from "zod";

export const listTreatmentPlansSchema = {
  query: z.object({
    status: z.enum(["DRAFT", "REVIEW", "APPROVED", "ACTIVE", "MODIFIED", "CLOSED"]).optional(),
    patientId: z.string().uuid().optional(),
  }),
};

export const createTreatmentPlanSchema = {
  body: z.object({
    patientId: z.string().uuid(),
    diagnoses: z.array(z.string()).default([]),
    medications: z.array(z.object({ name: z.string(), class: z.string().optional(), dosage: z.string().optional() })).default([]),
    labTests: z.array(z.string()).default([]),
    procedures: z.array(z.string()).default([]),
  }),
};

export const transitionTreatmentPlanSchema = {
  body: z.object({
    event: z.enum(["submit_review", "approve", "request_changes", "activate", "modify", "reactivate", "close"]),
    reason: z.string().optional(),
    version: z.number().int().positive(),
  }),
};

export const treatmentPlanIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};