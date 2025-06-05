import { eq, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import { users } from "../../../shared/lib/db/schema";
import { mapToUser } from "../../../shared/lib/mappers/user";
import type { CreateUserRequest, PaginatedResponse, UpdateUserRequest, User } from "../../../shared/types";

export class UserRepository {
  async create(userData: CreateUserRequest): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        displayName: userData.displayName,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
      })
      .returning();

    return mapToUser(user);
  }

  async findById(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return user ? mapToUser(user) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    return user ? mapToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    return user ? mapToUser(user) : null;
  }

  async findAll(options: { limit?: number; offset?: number } = {}): Promise<PaginatedResponse<User>> {
    const { limit = 50, offset = 0 } = options;

    const [usersResult, totalResult] = await Promise.all([
      db.select().from(users).limit(limit).offset(offset),
      db.select({ count: sql`COUNT(*)`.as("count") }).from(users),
    ]);

    const total = Number(totalResult[0]?.count) || 0;

    return {
      data: usersResult.map(mapToUser),
      total,
      limit,
      offset,
    };
  }

  async update(id: number, userData: UpdateUserRequest): Promise<User | null> {
    const [user] = await db
      .update(users)
      .set({
        displayName: userData.displayName,
        email: userData.email,
        avatarUrl: userData.avatarUrl,
      })
      .where(eq(users.id, id))
      .returning();

    return user ? mapToUser(user) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result as unknown as { changes: number }).changes > 0;
  }
}
