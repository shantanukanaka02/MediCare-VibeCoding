import { z } from "zod";

export const listTenantRolesSchema = {
  query: z.object({
    organizationId: z.string().uuid(),
  }),
};

export const createTenantSchema = {
  body: z.object({
    id: z.string().uuid(),
    name: z.string().min(2).max(120),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  }),
};

export const createPlatformUserSchema = {
  body: z.object({
    organizationId: z.string().uuid(),
    email: z.string().email(),
    password: z
      .string()
      .min(12)
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must include at least one special character"),
    roleName: z.string().min(1),
  }),
};
