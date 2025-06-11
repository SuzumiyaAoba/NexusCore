import type { Context } from "hono";

/**
 * Helper function to handle Result error responses consistently across routes
 * Only call this function when you know the result is a failure
 */
export function handleResultError<E extends { statusCode?: number; code: string; message: string }>(
  c: Context,
  error: E,
): Response {
  const statusCode = error.statusCode || 500;
  return c.json(
    {
      error: {
        code: error.code,
        message: error.message,
      },
    },
    statusCode as 400 | 401 | 403 | 404 | 409 | 500,
  );
}
