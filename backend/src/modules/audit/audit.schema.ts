import { z } from "zod";

export const listAuditLogsSchema = {
  query: z.object({
    entityType: z.string().min(1).optional(),
    entityId: z.string().uuid().optional(),
    action: z.string().min(1).optional(),
    actorUserId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
};
