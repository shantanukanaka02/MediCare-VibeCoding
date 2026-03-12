import { z } from "zod";

export const listUsersSchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
};

export const createUserSchema = {
  body: z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(12)
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must include at least one special character"),
    roleNames: z.array(z.string().min(1)).min(1),
  }),
};
