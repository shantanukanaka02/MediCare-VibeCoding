import { z } from "zod";

export const listApprovalsSchema = {
  query: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "ESCALATED"]).optional(),
    treatmentPlanId: z.string().uuid().optional(),
  }),
};

export const createApprovalSchema = {
  body: z.object({
    patientId: z.string().uuid().optional(),
    treatmentPlanId: z.string().uuid().optional(),
    approvalType: z.enum(["CONTROLLED_SUBSTANCE", "INSURANCE_PREAUTH", "CLINICAL_REVIEW"]),
    requiredRole: z.string().min(1).optional(),
    estimatedCost: z.number().optional(),
    insuranceLimit: z.number().optional(),
    medicationClass: z.string().optional(),
  }),
};

export const transitionApprovalSchema = {
  body: z.object({
    event: z.enum(["approve", "reject", "escalate", "reopen"]),
    reason: z.string().optional(),
    version: z.number().int().positive(),
  }),
};

export const approvalIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};