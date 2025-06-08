import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { DatabaseError, ErrorFactory, NotFoundError, ValidationError, isAppError } from "./enhanced";

describe("Error Handling System", () => {
  describe("Error Type Detection", () => {
    test("should correctly identify AppError instances", () => {
      const validationError = new ValidationError("Test validation error");
      const notFoundError = new NotFoundError("User", 123);
      const databaseError = new DatabaseError("Test database error");
      const regularError = new Error("Regular error");

      expect(isAppError(validationError)).toBe(true);
      expect(isAppError(notFoundError)).toBe(true);
      expect(isAppError(databaseError)).toBe(true);
      expect(isAppError(regularError)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError("string")).toBe(false);
    });
  });

  describe("Validation Error Edge Cases", () => {
    test("should handle complex Zod validation errors", () => {
      const schema = z.object({
        nested: z.object({
          value: z.string().min(5),
          array: z.array(z.number().positive()),
        }),
      });

      try {
        schema.parse({
          nested: {
            value: "abc", // Too short
            array: [1, -2, 3], // Contains negative number
          },
        });
      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          const validationError = ErrorFactory.validation("Complex validation failed", undefined, zodError);

          expect(validationError.code).toBe("VALIDATION_ERROR");
          expect(validationError.message).toBe("Complex validation failed");
          expect(validationError.cause).toBe(zodError);
        }
      }
    });

    test("should handle validation error with field context", () => {
      const error = ErrorFactory.validation("Invalid email format", "email");

      expect(error.field).toBe("email");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
    });
  });

  describe("Database Error Edge Cases", () => {
    test("should handle database connection errors", () => {
      const connectionError = new Error("ECONNREFUSED");
      const dbError = ErrorFactory.database("Failed to connect to database", connectionError);

      expect(dbError.code).toBe("DATABASE_ERROR");
      expect(dbError.statusCode).toBe(500);
      expect(dbError.cause).toBe(connectionError);
      expect(dbError.message).toBe("Failed to connect to database");
    });

    test("should handle SQL constraint violations", () => {
      const sqlError = new Error("UNIQUE constraint failed: users.email");
      const dbError = ErrorFactory.database("Email already exists", sqlError);

      expect(dbError.code).toBe("DATABASE_ERROR");
      expect(dbError.cause).toBe(sqlError);
    });
  });

  describe("NotFound Error Edge Cases", () => {
    test("should handle different resource ID types", () => {
      const numericError = ErrorFactory.notFound("Task", 123);
      const stringError = ErrorFactory.notFound("User", "uuid-string");
      const complexError = ErrorFactory.notFound("Project", "proj_123_abc");

      expect(numericError.resourceId).toBe(123);
      expect(numericError.message).toBe("Task with id 123 not found");

      expect(stringError.resourceId).toBe("uuid-string");
      expect(stringError.message).toBe("User with id uuid-string not found");

      expect(complexError.resourceId).toBe("proj_123_abc");
      expect(complexError.message).toBe("Project with id proj_123_abc not found");
    });
  });

  describe("Error Serialization", () => {
    test("should properly serialize ValidationError to JSON", () => {
      const error = new ValidationError("Invalid input", "username");
      const json = error.toJSON();

      expect(json).toEqual({
        name: "ValidationError",
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        statusCode: 400,
      });
    });

    test("should include cause in JSON when present", () => {
      const cause = new Error("Original error");
      const error = new DatabaseError("Database operation failed", cause);
      const json = error.toJSON();

      expect(json).toEqual({
        name: "DatabaseError",
        code: "DATABASE_ERROR",
        message: "Database operation failed",
        statusCode: 500,
        cause: "Original error",
      });
    });

    test("should handle NotFoundError serialization", () => {
      const error = new NotFoundError("Task", 123);
      const json = error.toJSON();

      expect(json).toEqual({
        name: "NotFoundError",
        code: "NOT_FOUND",
        message: "Task with id 123 not found",
        statusCode: 404,
      });
    });
  });

  describe("Error Chain Handling", () => {
    test("should properly handle nested error causes", () => {
      const rootCause = new Error("Network timeout");
      const dbError = new DatabaseError("Connection failed", rootCause);
      const validationError = new ValidationError("Service unavailable", "database", dbError);

      expect(validationError.cause).toBe(dbError);
      expect(dbError.cause).toBe(rootCause);
    });

    test("should handle circular reference protection", () => {
      const error1 = new ValidationError("Error 1");
      const error2 = new ValidationError("Error 2", undefined, error1);

      // Simulate circular reference (in real scenarios this should be avoided)
      (error1 as any).cause = error2;

      // Should not throw when serializing
      expect(() => error2.toJSON()).not.toThrow();
    });
  });

  describe("Error Factory Edge Cases", () => {
    test("should handle all error factory methods", () => {
      const validation = ErrorFactory.validation("test");
      const notFound = ErrorFactory.notFound("Resource", 1);
      const database = ErrorFactory.database("test");
      const duplicate = ErrorFactory.duplicate("User", "email", "test@example.com");
      const authentication = ErrorFactory.authentication();
      const authorization = ErrorFactory.authorization();

      expect(validation).toBeInstanceOf(ValidationError);
      expect(notFound).toBeInstanceOf(NotFoundError);
      expect(database).toBeInstanceOf(DatabaseError);
      expect(duplicate.code).toBe("DUPLICATE_ERROR");
      expect(authentication.code).toBe("AUTHENTICATION_ERROR");
      expect(authorization.code).toBe("AUTHORIZATION_ERROR");
    });

    test("should handle optional parameters correctly", () => {
      const authError = ErrorFactory.authentication("Custom auth message");
      const authzError = ErrorFactory.authorization("Custom authz message");

      expect(authError.message).toBe("Custom auth message");
      expect(authzError.message).toBe("Custom authz message");

      const defaultAuth = ErrorFactory.authentication();
      const defaultAuthz = ErrorFactory.authorization();

      expect(defaultAuth.message).toBe("Authentication required");
      expect(defaultAuthz.message).toBe("Insufficient permissions");
    });
  });
});
