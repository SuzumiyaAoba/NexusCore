import { z } from "zod";

export const taskStatusSchema = z.enum(["TODO", "DOING", "PENDING", "DONE"]);
export const prioritySchema = z.enum(["low", "medium", "high"]);

const dateRangeRefinement = {
  message: "Scheduled end date must be after start date",
  path: ["scheduledEndDate"],
};

export const createTaskSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    status: taskStatusSchema.default("TODO"),
    priority: prioritySchema.default("medium"),
    importance: z.boolean().default(false),
    urgency: z.boolean().default(false),
    projectId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    parentId: z.number().int().positive().optional(),
    assignedTo: z.number().int().positive().optional(),
    assignmentNote: z.string().max(500).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
    estimatedTime: z.number().int().positive().optional(),
    scheduledStartDate: z.string().datetime().optional(),
    scheduledEndDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
  })
  .refine((data) => {
    if (data.scheduledStartDate && data.scheduledEndDate) {
      return new Date(data.scheduledStartDate) <= new Date(data.scheduledEndDate);
    }
    return true;
  }, dateRangeRefinement);

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: taskStatusSchema.optional(),
    priority: prioritySchema.optional(),
    importance: z.boolean().optional(),
    urgency: z.boolean().optional(),
    projectId: z.number().int().positive().nullable().optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    assignedTo: z.number().int().positive().nullable().optional(),
    assignmentNote: z.string().max(500).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
    estimatedTime: z.number().int().positive().nullable().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    scheduledStartDate: z.string().datetime().nullable().optional(),
    scheduledEndDate: z.string().datetime().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
  })
  .refine((data) => {
    if (data.scheduledStartDate && data.scheduledEndDate) {
      return new Date(data.scheduledStartDate) <= new Date(data.scheduledEndDate);
    }
    return true;
  }, dateRangeRefinement);

export const taskIdSchema = z.coerce.number().int().positive();
