import { z } from "zod";

export const listPatientsSchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
};

export const createPatientSchema = {
  body: z.object({
    externalRef: z.string().optional(),
    mrn: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
};