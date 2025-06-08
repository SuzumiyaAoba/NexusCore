import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../../shared/config/database";
import { setupTestDatabase } from "../../../shared/config/test-setup";
import { taskRoutesTyped as taskRoutes } from "./routes-typed";

const app = new Hono();
app.route("/", taskRoutes);

describe("Task Management API Integration Tests", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    // Clear all data from tables
    await db.run(sql`DELETE FROM task_tags`);
    await db.run(sql`DELETE FROM tasks`);
    await db.run(sql`DELETE FROM users`);
    await db.run(sql`DELETE FROM categories`);
    await db.run(sql`DELETE FROM tags`);

    // Create a test user for the tests that need it
    await db.run(
      sql`INSERT INTO users (id, username, display_name, email) VALUES (1, 'testuser', 'Test User', 'test@example.com')`,
    );
  });
  describe("Validation Tests", () => {
    test("should return 400 for invalid task creation data", async () => {
      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "", // Invalid: empty title
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.message).toContain("Invalid request body");
    });

    test("should return 400 for invalid task ID parameter", async () => {
      const req = new Request("http://localhost/api/tasks/invalid");
      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid JSON in request body", async () => {
      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });

    test("should accept requests without explicit content-type", async () => {
      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "x-user-id": "1" },
        body: JSON.stringify({ title: "Test" }),
      });

      const res = await app.request(req);
      // The API accepts this, creates the task successfully (returns 201)
      expect(res.status).toBe(201);
    });

    test("should return 400 for invalid query parameters", async () => {
      const req = new Request("http://localhost/api/tasks?limit=invalid");
      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid bulk update data", async () => {
      const req = new Request("http://localhost/api/tasks/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: "not-an-array", // Invalid: should be array
          updates: { status: "INVALID_STATUS" },
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Route Existence Tests", () => {
    test("should return 404 for non-existent routes", async () => {
      const req = new Request("http://localhost/api/tasks/nonexistent/route");
      const res = await app.request(req);

      expect(res.status).toBe(404);
    });

    test("should return 404 for unsupported HTTP methods", async () => {
      const req = new Request("http://localhost/api/tasks/1", {
        method: "PATCH", // Not supported
      });

      const res = await app.request(req);
      // Hono returns 404 for unsupported methods on existing routes
      expect(res.status).toBe(404);
    });
  });

  describe("Content Type Tests", () => {
    test("should accept valid JSON content-type", async () => {
      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test Task" }),
      });

      const res = await app.request(req);
      // Should not fail due to content-type (may fail due to no DB, but that's 500)
      expect(res.status).not.toBe(415); // Not Unsupported Media Type
    });

    test("should reject non-JSON content-type for POST", async () => {
      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "not json",
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });
  });
});
