import { z } from "zod";

export const listBillingTriggersSchema = {
  query: z.object({
    status: z.enum(["PENDING", "EMITTED", "FAILED"]).optional(),
    triggerType: z.string().optional(),
  }),
};

export const createBillingTriggerSchema = {
  body: z.object({
    patientId: z.string().uuid().optional(),
    treatmentPlanId: z.string().uuid().optional(),
    sourceEntityType: z.string().min(1),
    sourceEntityId: z.string().min(1),
    triggerType: z.string().min(1),
    payload: z.record(z.any()).optional(),
  }),
};

export const transitionBillingTriggerSchema = {
  body: z.object({
    event: z.enum(["emit", "fail", "retry"]),
    failureReason: z.string().optional(),
    reason: z.string().optional(),
    version: z.number().int().positive(),
  }),
};

export const billingTriggerIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};