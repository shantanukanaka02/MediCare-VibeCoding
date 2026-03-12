import { z } from "zod";

export const listLabOrdersSchema = {
  query: z.object({
    status: z.enum(["ORDERED", "SAMPLE_COLLECTED", "PROCESSING", "RESULTS_UPLOADED", "DOCTOR_REVIEWED", "PATIENT_NOTIFIED"]).optional(),
    patientId: z.string().uuid().optional(),
  }),
};

export const createLabOrderSchema = {
  body: z.object({
    patientId: z.string().uuid(),
    testCode: z.string().min(1),
    testName: z.string().min(1),
  }),
};

export const transitionLabOrderSchema = {
  body: z.object({
    event: z.enum(["collect_sample", "process", "upload_results", "doctor_review", "notify_patient"]),
    resultSummary: z.string().optional(),
    resultDocumentUrl: z.string().url().optional(),
    reason: z.string().optional(),
    version: z.number().int().positive(),
  }),
};

export const labOrderIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};