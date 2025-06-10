import { z } from "zod";

// User response schema
export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
});

// Paginated user response schema
export const paginatedUserResponseSchema = z.object({
  data: z.array(userResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
export type PaginatedUserResponse = z.infer<typeof paginatedUserResponseSchema>;
