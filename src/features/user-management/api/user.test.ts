import { afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import app from "../../../app";
import { db } from "../../../shared/config/database";
import { setupTestDatabase } from "../../../shared/config/test-setup";
import type { User } from "../../../shared/lib/db/schema";

// Type definitions for API responses
interface UserResponse extends User {}

interface CreateUserResponse extends UserResponse {}

interface PaginatedUsersResponse {
  data: UserResponse[];
  total: number;
  limit: number;
  offset: number;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

interface ApiResponse<T> {
  json(): Promise<T>;
  status: number;
}

describe("User Management API", () => {
  beforeAll(async () => {
    // Setup test database with migrations
    await setupTestDatabase();
  });

  beforeEach(async () => {
    // Clear all data from tables
    await db.run(sql`DELETE FROM task_tags`);
    await db.run(sql`DELETE FROM tasks`);
    await db.run(sql`DELETE FROM users`);
    await db.run(sql`DELETE FROM categories`);
    await db.run(sql`DELETE FROM tags`);
  });

  afterEach(() => {
    // Test cleanup is handled by in-memory database
  });

  describe("POST /api/users", () => {
    test("should create a new user with valid data", async () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
      };

      const response = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(201);
      const result = (await response.json()) as CreateUserResponse;
      expect(result.id).toBeNumber();
      expect(result.username).toBe(userData.username);
      expect(result.displayName).toBe(userData.displayName);
      expect(result.email).toBe(userData.email);
      expect(result.createdAt).toBeString();
    });

    test("should return 400 for invalid username", async () => {
      const userData = {
        username: "a", // too short
        displayName: "Test User",
        email: "test@example.com",
      };

      const response = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(400);
      const result = (await response.json()) as ErrorResponse;
      expect(result.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid email", async () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "invalid-email",
      };

      const response = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      expect(response.status).toBe(400);
      const result = (await response.json()) as ErrorResponse;
      expect(result.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for duplicate username", async () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
      };

      // Create first user
      await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      // Try to create duplicate
      const response = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          email: "different@example.com",
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/users", () => {
    test("should return empty array when no users exist", async () => {
      const response = await app.request("/api/users");

      expect(response.status).toBe(200);
      const result = (await response.json()) as PaginatedUsersResponse;
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    test("should return users with pagination", async () => {
      // Create test users
      const users = [
        { username: "user1", displayName: "User 1", email: "user1@example.com" },
        { username: "user2", displayName: "User 2", email: "user2@example.com" },
      ];

      for (const userData of users) {
        await app.request("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
      }

      const response = await app.request("/api/users?limit=1&offset=0");

      expect(response.status).toBe(200);
      const result = (await response.json()) as PaginatedUsersResponse;
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.offset).toBe(0);
    });
  });

  describe("GET /api/users/:id", () => {
    test("should return user by id", async () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
      };

      const createResponse = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const createdUser = (await createResponse.json()) as CreateUserResponse;

      const response = await app.request(`/api/users/${createdUser.id}`);

      expect(response.status).toBe(200);
      const result = (await response.json()) as UserResponse;
      expect(result.id).toBe(createdUser.id);
      expect(result.username).toBe(userData.username);
    });

    test("should return 404 for non-existent user", async () => {
      const response = await app.request("/api/users/999");

      expect(response.status).toBe(404);
      const result = (await response.json()) as ErrorResponse;
      expect(result.error.code).toBe("NOT_FOUND");
    });

    test("should return 400 for invalid id", async () => {
      const response = await app.request("/api/users/invalid");

      expect(response.status).toBe(400);
      const result = (await response.json()) as ErrorResponse;
      expect(result.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PUT /api/users/:id", () => {
    test("should update user data", async () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
      };

      const createResponse = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const createdUser = (await createResponse.json()) as CreateUserResponse;

      const updateData = {
        displayName: "Updated User",
        email: "updated@example.com",
      };

      const response = await app.request(`/api/users/${createdUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const result = (await response.json()) as UserResponse;
      expect(result.displayName).toBe(updateData.displayName);
      expect(result.email).toBe(updateData.email);
      expect(result.username).toBe(userData.username); // should not change
    });

    test("should return 404 for non-existent user", async () => {
      const response = await app.request("/api/users/999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Updated" }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/users/:id", () => {
    test("should delete user", async () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
      };

      const createResponse = await app.request("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const createdUser = (await createResponse.json()) as CreateUserResponse;

      const deleteResponse = await app.request(`/api/users/${createdUser.id}`, {
        method: "DELETE",
      });

      expect(deleteResponse.status).toBe(204);

      // Verify user is deleted
      const getResponse = await app.request(`/api/users/${createdUser.id}`);
      expect(getResponse.status).toBe(404);
    });

    test("should return 404 for non-existent user", async () => {
      const response = await app.request("/api/users/999", {
        method: "DELETE",
      });

      expect(response.status).toBe(404);
    });
  });
});
