import { z } from "zod";

export const taskWorkflowEventSchema = z.enum(["assign", "start", "complete", "cancel", "reopen"]);