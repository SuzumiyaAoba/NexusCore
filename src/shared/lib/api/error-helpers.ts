import type { Result } from "@/shared/lib/types/result";
import type { Context } from "hono";

/**
 * Helper function to handle Result error responses consistently across routes
 * Only call this function when you know the result is a failure
 */
export function handleResultError<T, E extends { statusCode?: number; code: string; message: string }>(
  c: Context,
  result: { success: false; error: E },
): Response {
  const statusCode = result.error.statusCode || 500;
  return c.json(
    {
      error: {
        code: result.error.code,
        message: result.error.message,
      },
    },
    statusCode as 400 | 401 | 403 | 404 | 409 | 500,
  );
}

/**
 * Type guard to check if a result is successful
 */
export function isSuccessResult<T>(result: Result<T, any>): result is { success: true; data: T } {
  return result.success;
}
