import { z } from "zod";

export const loginSchema = {
  body: z.object({
    organizationId: z.preprocess(
      (value) => {
        if (typeof value !== "string") {
          return value;
        }
        const trimmed = value.trim();
        return trimmed.length === 0 ? undefined : trimmed;
      },
      z.string().uuid().optional(),
    ),
    email: z.string().email(),
    password: z.string().min(8),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(20),
  }),
};

export const logoutSchema = {
  body: z.object({
    refreshToken: z.string().min(20),
  }),
};
