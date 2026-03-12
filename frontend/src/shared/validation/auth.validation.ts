import { z } from "zod";

export const loginFormSchema = z.object({
  organizationId: z.string().uuid("Organization ID must be a UUID"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;