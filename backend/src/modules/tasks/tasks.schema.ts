import { z } from "zod";
import { taskWorkflowEventSchema } from "../workflows/workflow.schema";

export const listTasksSchema = {
  query: z.object({
    status: z.enum(["NEW", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELED"]).optional(),
  }),
};

export const taskIdParamSchema = {
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const createTaskSchema = {
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    patientId: z.string().uuid().optional(),
    assigneeUserId: z.string().uuid().optional(),
    dueAt: z.string().datetime().optional(),
  }),
};

export const updateTaskSchema = {
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assigneeUserId: z.string().uuid().nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
    version: z.number().int().positive(),
  }),
};

export const transitionTaskSchema = {
  body: z.object({
    event: taskWorkflowEventSchema,
    reason: z.string().optional(),
    version: z.number().int().positive(),
  }),
};