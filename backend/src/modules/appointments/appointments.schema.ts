import { z } from "zod";

export const listAppointmentsSchema = {
  query: z.object({
    status: z.enum(["SCHEDULED", "CHECKED_IN", "COMPLETED", "CANCELED", "NO_SHOW"]).optional(),
  }),
};

export const createAppointmentSchema = {
  body: z.object({
    patientId: z.string().uuid(),
    providerUserId: z.string().uuid(),
    appointmentType: z.string().min(1),
    scheduledAt: z.string().datetime(),
    durationMinutes: z.number().int().min(5).max(480),
    requiresOperatingRoom: z.boolean().optional(),
    roomId: z.string().optional(),
    equipment: z.array(z.string()).optional(),
  }),
};

export const transitionAppointmentSchema = {
  body: z.object({
    event: z.enum(["check_in", "complete", "cancel", "mark_no_show", "reopen", "reschedule"]),
    reason: z.string().optional(),
    version: z.number().int().positive(),
  }),
};

export const appointmentIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};