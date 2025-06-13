import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const userIdHeader = c.req.header("x-user-id");
  const userIdCookie = getCookie(c, "user_id");

  const userId = userIdHeader || userIdCookie;

  if (!userId) {
    return c.json(
      {
        error: {
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
      },
      401,
    );
  }

  const parsedUserId = Number.parseInt(userId);
  if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
    return c.json(
      {
        error: {
          message: "Invalid user ID",
          code: "UNAUTHORIZED",
        },
      },
      401,
    );
  }

  c.set("user", {
    id: parsedUserId,
    username: `user_${parsedUserId}`,
    email: `user${parsedUserId}@example.com`,
  });

  await next();
};

export const optionalAuthMiddleware = async (c: Context, next: Next) => {
  const userIdHeader = c.req.header("x-user-id");
  const userIdCookie = getCookie(c, "user_id");

  const userId = userIdHeader || userIdCookie;

  if (userId) {
    const parsedUserId = Number.parseInt(userId);
    if (!Number.isNaN(parsedUserId) && parsedUserId > 0) {
      c.set("user", {
        id: parsedUserId,
        username: `user_${parsedUserId}`,
        email: `user${parsedUserId}@example.com`,
      });
    }
  }

  await next();
};
