import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { setupUserRoutes } from "./routes-typed";

const app = new Hono();
setupUserRoutes(app);

describe("User Management API Integration Tests", () => {
  describe("Validation Tests", () => {
    test("should return 400 for invalid user creation data", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "ab", // Too short
          displayName: "Test User",
          email: "test@example.com",
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid email format", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          displayName: "Test User",
          email: "invalid-email", // Invalid format
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid user ID parameter", async () => {
      const req = new Request("http://localhost/api/users/invalid");
      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid username characters", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "test-user", // Contains dash which is invalid
          displayName: "Test User",
          email: "test@example.com",
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid query parameters", async () => {
      const req = new Request("http://localhost/api/users?limit=invalid");
      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid update data", async () => {
      const req = new Request("http://localhost/api/users/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email", // Invalid email format
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
      const req = new Request("http://localhost/api/users/nonexistent/route");
      const res = await app.request(req);

      expect(res.status).toBe(404);
    });

    test("should return 404 for unsupported HTTP methods", async () => {
      const req = new Request("http://localhost/api/users/1", {
        method: "PATCH", // Not supported
      });

      const res = await app.request(req);
      // Hono returns 404 for unsupported methods on existing routes
      expect(res.status).toBe(404);
    });
  });

  describe("Content Type Tests", () => {
    test("should accept valid JSON content-type", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          displayName: "Test User",
          email: "test@example.com",
        }),
      });

      const res = await app.request(req);
      // Should not fail due to content-type (may fail due to no DB, but that's 500)
      expect(res.status).not.toBe(415); // Not Unsupported Media Type
    });

    test("should reject non-JSON content-type for POST", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "not json",
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });

    test("should return 400 for missing required fields", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Missing required fields: username, displayName, email
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Data Validation Edge Cases", () => {
    test("should return 400 for username too long", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "x".repeat(51), // Too long (max 50)
          displayName: "Test User",
          email: "test@example.com",
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for empty display name", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          displayName: "", // Empty
          email: "test@example.com",
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    test("should return 400 for invalid avatar URL", async () => {
      const req = new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          displayName: "Test User",
          email: "test@example.com",
          avatarUrl: "not-a-url", // Invalid URL
        }),
      });

      const res = await app.request(req);
      const data = (await res.json()) as { error: { code: string; message: string } };

      expect(res.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
