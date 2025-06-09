import { describe, expect, test } from "bun:test";
import { z } from "zod";

describe("API Middleware Error Handling", () => {
  describe("Zod Schema Validation", () => {
    test("should handle validation errors correctly", () => {
      const schema = z.object({
        title: z.string().min(1, "Title is required"),
        count: z.number().positive("Count must be positive"),
        email: z.string().email("Invalid email format"),
      });

      const invalidData = {
        title: "", // Invalid: empty
        count: -5, // Invalid: negative
        email: "not-email", // Invalid: not email format
      };

      try {
        schema.parse(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          expect(error.errors).toHaveLength(3);

          const titleError = error.errors.find((e) => e.path[0] === "title");
          const countError = error.errors.find((e) => e.path[0] === "count");
          const emailError = error.errors.find((e) => e.path[0] === "email");

          expect(titleError?.message).toBe("Title is required");
          expect(countError?.message).toBe("Count must be positive");
          expect(emailError?.message).toBe("Invalid email format");
        }
      }
    });

    test("should handle nested object validation", () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
            age: z.number().min(0).max(150),
          }),
        }),
      });

      const invalidData = {
        user: {
          profile: {
            name: "",
            age: 200,
          },
        },
      };

      try {
        schema.parse(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          expect(error.errors).toHaveLength(2);

          const nameError = error.errors.find((e) => e.path.join(".") === "user.profile.name");
          const ageError = error.errors.find((e) => e.path.join(".") === "user.profile.age");

          expect(nameError?.path).toEqual(["user", "profile", "name"]);
          expect(ageError?.path).toEqual(["user", "profile", "age"]);
        }
      }
    });

    test("should handle array validation errors", () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)).min(1),
        scores: z.array(z.number().min(0).max(100)),
      });

      const invalidData = {
        tags: [], // Invalid: empty array
        scores: [50, 150, -10], // Invalid: values out of range
      };

      try {
        schema.parse(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          expect(error.errors.length).toBeGreaterThan(0);

          const tagsError = error.errors.find((e) => e.path[0] === "tags");
          expect(tagsError).toBeDefined();
        }
      }
    });

    test("should handle union type validation errors", () => {
      const schema = z.object({
        value: z.union([z.string().email(), z.number().positive()]),
      });

      const invalidData = {
        value: "not-email-or-number", // Invalid for both union options
      };

      try {
        schema.parse(invalidData);
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          expect(error.errors).toHaveLength(1);
          expect(error.errors[0].code).toBe("invalid_string");
        }
      }
    });

    test("should validate coercion correctly", () => {
      const schema = z.object({
        id: z.coerce.number().positive(),
        active: z.coerce.boolean(),
      });

      // Valid coercion
      const validData = { id: "123", active: "true" };
      const result = schema.parse(validData);
      expect(result).toEqual({ id: 123, active: true });

      // Invalid coercion
      try {
        schema.parse({ id: "abc", active: "maybe" });
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
      }
    });

    test("should handle optional and nullable fields", () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable(),
        optionalNullable: z.string().optional().nullable(),
      });

      // Valid cases
      expect(() =>
        schema.parse({
          required: "test",
          nullable: null,
          optional: "value",
        }),
      ).not.toThrow();

      expect(() =>
        schema.parse({
          required: "test",
          nullable: "value",
        }),
      ).not.toThrow();

      expect(() =>
        schema.parse({
          required: "test",
          nullable: null,
          optionalNullable: null,
        }),
      ).not.toThrow();

      // Invalid case - missing required field
      expect(() => schema.parse({})).toThrow();
    });

    test("should handle custom validation messages", () => {
      const schema = z.object({
        password: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(50, "Password must not exceed 50 characters")
          .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
          .regex(/[0-9]/, "Password must contain at least one number"),
      });

      try {
        schema.parse({ password: "weak" });
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        if (error instanceof z.ZodError) {
          const messages = error.errors.map((e) => e.message);
          expect(messages).toContain("Password must be at least 8 characters");
        }
      }
    });
  });

  describe("Error Response Formatting", () => {
    test("should format validation errors consistently", () => {
      const formatValidationError = (zodError: z.ZodError) => ({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: zodError.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
      });

      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });

      try {
        schema.parse({ name: "", age: -1 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationError(error);

          expect(formatted.error.code).toBe("VALIDATION_ERROR");
          expect(formatted.error.details).toHaveLength(2);
          expect(formatted.error.details[0].field).toBe("name");
          expect(formatted.error.details[1].field).toBe("age");
        }
      }
    });

    test("should handle different error types consistently", () => {
      const formatError = (error: unknown, context: string) => {
        if (error instanceof z.ZodError) {
          return {
            error: {
              code: "VALIDATION_ERROR",
              message: `Invalid ${context}`,
              details: error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
          };
        }

        if (error instanceof SyntaxError) {
          return {
            error: {
              code: "INVALID_JSON",
              message: "Invalid JSON format",
            },
          };
        }

        return {
          error: {
            code: "INTERNAL_ERROR",
            message: `Unexpected error during ${context} validation`,
          },
        };
      };

      // Test different error types
      const zodError = new z.ZodError([]);
      const syntaxError = new SyntaxError("Invalid JSON");
      const genericError = new Error("Unknown error");

      const zodResponse = formatError(zodError, "request body");
      const syntaxResponse = formatError(syntaxError, "request body");
      const genericResponse = formatError(genericError, "request body");

      expect(zodResponse.error.code).toBe("VALIDATION_ERROR");
      expect(syntaxResponse.error.code).toBe("INVALID_JSON");
      expect(genericResponse.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
