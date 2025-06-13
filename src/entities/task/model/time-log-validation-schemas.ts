import { z } from "zod";

// Time log request schemas
export const createTimeLogSchema = z.object({
  description: z.string().max(500).optional(),
});

export const updateTimeLogSchema = z.object({
  endedAt: z.string().datetime().optional(),
  description: z.string().max(500).optional(),
});

export const timeLogQuerySchema = z.object({
  taskId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  startFrom: z.string().datetime().optional(),
  startTo: z.string().datetime().optional(),
  endFrom: z.string().datetime().optional(),
  endTo: z.string().datetime().optional(),
  sortBy: z.enum(["startedAt", "endedAt", "duration", "createdAt"]).default("startedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ID validation
export const timeLogIdSchema = z.coerce.number().int().positive();

export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;
export type TimeLogQueryInput = z.infer<typeof timeLogQuerySchema>;
export type TimeLogIdInput = z.infer<typeof timeLogIdSchema>;
