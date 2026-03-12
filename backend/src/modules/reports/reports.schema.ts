import { z } from "zod";

export const reportsOverviewSchema = {
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
};
