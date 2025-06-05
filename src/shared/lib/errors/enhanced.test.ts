import { describe, expect, test } from "bun:test";
import { AppError, DatabaseError, ErrorFactory, NotFoundError, ValidationError } from "./enhanced";

describe("Enhanced Error System", () => {
  describe("ValidationError", () => {
    test("should create validation error with message", () => {
      const error = new ValidationError("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.field).toBeUndefined();
    });

    test("should create validation error with field", () => {
      const error = new ValidationError("Invalid email", "email");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid email");
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe("email");
    });

    test("should include cause if provided", () => {
      const cause = new Error("Original error");
      const error = new ValidationError("Validation failed", undefined, cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("NotFoundError", () => {
    test("should create not found error", () => {
      const error = new NotFoundError("User", 123);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("User with id 123 not found");
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe("User");
      expect(error.resourceId).toBe(123);
    });

    test("should handle string id", () => {
      const error = new NotFoundError("Task", "abc-123");
      expect(error.message).toBe("Task with id abc-123 not found");
      expect(error.resourceId).toBe("abc-123");
    });
  });

  describe("DatabaseError", () => {
    test("should create database error", () => {
      const error = new DatabaseError("Connection failed");
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.message).toBe("Connection failed");
      expect(error.statusCode).toBe(500);
    });

    test("should include original error as cause", () => {
      const cause = new Error("SQLite error");
      const error = new DatabaseError("Query failed", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("ErrorFactory", () => {
    test("should create validation error", () => {
      const error = ErrorFactory.validation("Invalid input", "username");
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Invalid input");
      expect(error.field).toBe("username");
    });

    test("should create not found error", () => {
      const error = ErrorFactory.notFound("User", 123);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.resource).toBe("User");
      expect(error.resourceId).toBe(123);
    });

    test("should create database error", () => {
      const cause = new Error("SQL error");
      const error = ErrorFactory.database("Query failed", cause);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.message).toBe("Query failed");
      expect(error.cause).toBe(cause);
    });
  });

  describe("Error inheritance", () => {
    test("all errors should extend AppError", () => {
      const validation = new ValidationError("test");
      const notFound = new NotFoundError("Resource", 1);
      const database = new DatabaseError("test");

      expect(validation).toBeInstanceOf(AppError);
      expect(notFound).toBeInstanceOf(AppError);
      expect(database).toBeInstanceOf(AppError);
    });

    test("all errors should extend Error", () => {
      const validation = new ValidationError("test");
      const notFound = new NotFoundError("Resource", 1);
      const database = new DatabaseError("test");

      expect(validation).toBeInstanceOf(Error);
      expect(notFound).toBeInstanceOf(Error);
      expect(database).toBeInstanceOf(Error);
    });
  });
});
