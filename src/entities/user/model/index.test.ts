import { describe, expect, test } from "bun:test";
import type { CreateUserRequest, UpdateUserRequest } from "../../../shared/types";
import { UserDomain } from "./index";

describe("UserDomain", () => {
  describe("validateCreate", () => {
    test("should validate valid user data", () => {
      const userData: CreateUserRequest = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.username).toBe("testuser");
        expect(result.value.displayName).toBe("Test User");
        expect(result.value.email).toBe("test@example.com");
        expect(result.value.avatarUrl).toBe("https://example.com/avatar.jpg");
      }
    });

    test("should validate minimal user data", () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.username).toBe("testuser");
        expect(result.value.displayName).toBe("Test User");
        expect(result.value.email).toBe("test@example.com");
        expect(result.value.avatarUrl).toBeUndefined();
      }
    });

    test("should fail validation for short username", () => {
      const userData = {
        username: "ab", // Too short
        displayName: "Test User",
        email: "test@example.com",
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("String must contain at least 3 character(s)");
      }
    });

    test("should fail validation for long username", () => {
      const userData = {
        username: "x".repeat(51), // Too long
        displayName: "Test User",
        email: "test@example.com",
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("String must contain at most 50 character(s)");
      }
    });

    test("should fail validation for invalid username characters", () => {
      const userData = {
        username: "test-user", // Contains invalid character
        displayName: "Test User",
        email: "test@example.com",
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Username must contain only letters, numbers, and underscores");
      }
    });

    test("should fail validation for empty display name", () => {
      const userData = {
        username: "testuser",
        displayName: "", // Empty
        email: "test@example.com",
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });

    test("should fail validation for invalid email", () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "invalid-email", // Invalid email format
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Invalid email");
      }
    });

    test("should fail validation for invalid avatar URL", () => {
      const userData = {
        username: "testuser",
        displayName: "Test User",
        email: "test@example.com",
        avatarUrl: "not-a-url", // Invalid URL
      };

      const result = UserDomain.validateCreate(userData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Invalid url");
      }
    });
  });

  describe("validateUpdate", () => {
    test("should validate valid update data", () => {
      const updateData: UpdateUserRequest = {
        displayName: "Updated Name",
        email: "updated@example.com",
        avatarUrl: "https://example.com/new-avatar.jpg",
      };

      const result = UserDomain.validateUpdate(updateData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.displayName).toBe("Updated Name");
        expect(result.value.email).toBe("updated@example.com");
        expect(result.value.avatarUrl).toBe("https://example.com/new-avatar.jpg");
      }
    });

    test("should validate empty update", () => {
      const updateData = {};

      const result = UserDomain.validateUpdate(updateData);
      expect(result.isOk()).toBe(true);
    });

    test("should validate partial update", () => {
      const updateData = {
        displayName: "New Name",
      };

      const result = UserDomain.validateUpdate(updateData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.displayName).toBe("New Name");
        expect(result.value.email).toBeUndefined();
        expect(result.value.avatarUrl).toBeUndefined();
      }
    });

    test("should fail validation for invalid email in update", () => {
      const updateData = {
        email: "invalid-email",
      };

      const result = UserDomain.validateUpdate(updateData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("validateId", () => {
    test("should validate positive integer", () => {
      const result = UserDomain.validateId(123);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(123);
      }
    });

    test("should coerce string numbers", () => {
      const result = UserDomain.validateId("123");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(123);
      }
    });

    test("should fail for zero", () => {
      const result = UserDomain.validateId(0);
      expect(result.isErr()).toBe(true);
    });

    test("should fail for negative numbers", () => {
      const result = UserDomain.validateId(-1);
      expect(result.isErr()).toBe(true);
    });

    test("should fail for non-numeric strings", () => {
      const result = UserDomain.validateId("abc");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("isValidUsername", () => {
    test("should validate correct usernames", () => {
      expect(UserDomain.isValidUsername("user123")).toBe(true);
      expect(UserDomain.isValidUsername("test_user")).toBe(true);
      expect(UserDomain.isValidUsername("User_123")).toBe(true);
      expect(UserDomain.isValidUsername("abc")).toBe(true); // Minimum length
    });

    test("should reject invalid usernames", () => {
      expect(UserDomain.isValidUsername("ab")).toBe(false); // Too short
      expect(UserDomain.isValidUsername("x".repeat(51))).toBe(false); // Too long
      expect(UserDomain.isValidUsername("user-name")).toBe(false); // Contains dash
      expect(UserDomain.isValidUsername("user.name")).toBe(false); // Contains dot
      expect(UserDomain.isValidUsername("user name")).toBe(false); // Contains space
      expect(UserDomain.isValidUsername("user@name")).toBe(false); // Contains @
    });
  });

  describe("isValidEmail", () => {
    test("should validate correct emails", () => {
      expect(UserDomain.isValidEmail("test@example.com")).toBe(true);
      expect(UserDomain.isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(UserDomain.isValidEmail("test+tag@example.org")).toBe(true);
    });

    test("should reject invalid emails", () => {
      expect(UserDomain.isValidEmail("invalid")).toBe(false);
      expect(UserDomain.isValidEmail("@example.com")).toBe(false);
      expect(UserDomain.isValidEmail("test@")).toBe(false);
      expect(UserDomain.isValidEmail("test@.com")).toBe(false);
      expect(UserDomain.isValidEmail("test.example.com")).toBe(false);
    });
  });
});
