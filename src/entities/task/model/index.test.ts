import { describe, expect, test } from "bun:test";
import type { CreateTaskRequest, UpdateTaskRequest } from "../../../shared/types";
import { TaskDomain } from "./index";

describe("TaskDomain", () => {
  describe("validateCreate", () => {
    test("should validate valid task data", () => {
      const taskData: CreateTaskRequest = {
        title: "Test Task",
        description: "Test description",
        status: "TODO",
        priority: "medium",
        importance: false,
        urgency: false,
      };

      const result = TaskDomain.validateCreate(taskData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Test Task");
        expect(result.value.status).toBe("TODO");
        expect(result.value.priority).toBe("medium");
      }
    });

    test("should validate minimal task data", () => {
      const taskData = {
        title: "Minimal Task",
      };

      const result = TaskDomain.validateCreate(taskData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Minimal Task");
        expect(result.value.status).toBe("TODO");
        expect(result.value.priority).toBe("medium");
        expect(result.value.importance).toBe(false);
        expect(result.value.urgency).toBe(false);
      }
    });

    test("should fail validation for empty title", () => {
      const taskData = {
        title: "",
      };

      const result = TaskDomain.validateCreate(taskData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("String must contain at least 1 character(s)");
      }
    });

    test("should fail validation for long title", () => {
      const taskData = {
        title: "x".repeat(101),
      };

      const result = TaskDomain.validateCreate(taskData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("String must contain at most 100 character(s)");
      }
    });

    test("should fail validation for invalid date range", () => {
      const taskData = {
        title: "Test Task",
        scheduledStartDate: "2024-01-02T10:00:00Z",
        scheduledEndDate: "2024-01-01T10:00:00Z", // End before start
      };

      const result = TaskDomain.validateCreate(taskData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Scheduled end date must be after start date");
      }
    });
  });

  describe("validateUpdate", () => {
    test("should validate valid update data", () => {
      const updateData: UpdateTaskRequest = {
        title: "Updated Task",
        status: "DOING",
        priority: "high",
      };

      const result = TaskDomain.validateUpdate(updateData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.title).toBe("Updated Task");
        expect(result.value.status).toBe("DOING");
        expect(result.value.priority).toBe("high");
      }
    });

    test("should validate empty update", () => {
      const updateData = {};

      const result = TaskDomain.validateUpdate(updateData);
      expect(result.isOk()).toBe(true);
    });

    test("should validate nullable fields", () => {
      const updateData: UpdateTaskRequest = {
        projectId: null,
        categoryId: null,
        estimatedTime: null,
      };

      const result = TaskDomain.validateUpdate(updateData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.projectId).toBe(null);
        expect(result.value.categoryId).toBe(null);
        expect(result.value.estimatedTime).toBe(null);
      }
    });
  });

  describe("validateId", () => {
    test("should validate positive integer", () => {
      const result = TaskDomain.validateId(123);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(123);
      }
    });

    test("should coerce string numbers", () => {
      const result = TaskDomain.validateId("123");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(123);
      }
    });

    test("should fail for zero", () => {
      const result = TaskDomain.validateId(0);
      expect(result.isErr()).toBe(true);
    });

    test("should fail for negative numbers", () => {
      const result = TaskDomain.validateId(-1);
      expect(result.isErr()).toBe(true);
    });

    test("should fail for non-numeric strings", () => {
      const result = TaskDomain.validateId("abc");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("calculateEisenhowerQuadrant", () => {
    test("should return 1 for important and urgent", () => {
      const result = TaskDomain.calculateEisenhowerQuadrant(true, true);
      expect(result).toBe(1);
    });

    test("should return 2 for important but not urgent", () => {
      const result = TaskDomain.calculateEisenhowerQuadrant(true, false);
      expect(result).toBe(2);
    });

    test("should return 3 for not important but urgent", () => {
      const result = TaskDomain.calculateEisenhowerQuadrant(false, true);
      expect(result).toBe(3);
    });

    test("should return 4 for not important and not urgent", () => {
      const result = TaskDomain.calculateEisenhowerQuadrant(false, false);
      expect(result).toBe(4);
    });
  });

  describe("isOverdue", () => {
    test("should return false for null date", () => {
      expect(TaskDomain.isOverdue(null)).toBe(false);
    });

    test("should return false for undefined date", () => {
      expect(TaskDomain.isOverdue(undefined)).toBe(false);
    });

    test("should return true for past date", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(TaskDomain.isOverdue(pastDate)).toBe(true);
    });

    test("should return false for future date", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(TaskDomain.isOverdue(futureDate)).toBe(false);
    });
  });

  describe("canUpdateStatus", () => {
    test("should allow status changes from non-DONE status", () => {
      expect(TaskDomain.canUpdateStatus("TODO", "DOING")).toBe(true);
      expect(TaskDomain.canUpdateStatus("DOING", "DONE")).toBe(true);
      expect(TaskDomain.canUpdateStatus("PENDING", "TODO")).toBe(true);
    });

    test("should not allow status changes from DONE", () => {
      expect(TaskDomain.canUpdateStatus("DONE", "TODO")).toBe(false);
      expect(TaskDomain.canUpdateStatus("DONE", "DOING")).toBe(false);
      expect(TaskDomain.canUpdateStatus("DONE", "PENDING")).toBe(false);
    });

    test("should allow DONE to remain DONE", () => {
      expect(TaskDomain.canUpdateStatus("DONE", "DONE")).toBe(true);
    });
  });

  describe("canUpdatePriority", () => {
    test("should allow priority updates for non-DONE tasks", () => {
      expect(TaskDomain.canUpdatePriority("TODO")).toBe(true);
      expect(TaskDomain.canUpdatePriority("DOING")).toBe(true);
      expect(TaskDomain.canUpdatePriority("PENDING")).toBe(true);
    });

    test("should not allow priority updates for DONE tasks", () => {
      expect(TaskDomain.canUpdatePriority("DONE")).toBe(false);
    });
  });

  describe("isValidProgress", () => {
    test("should validate progress range", () => {
      expect(TaskDomain.isValidProgress(0)).toBe(true);
      expect(TaskDomain.isValidProgress(50)).toBe(true);
      expect(TaskDomain.isValidProgress(100)).toBe(true);
    });

    test("should reject invalid progress", () => {
      expect(TaskDomain.isValidProgress(-1)).toBe(false);
      expect(TaskDomain.isValidProgress(101)).toBe(false);
    });
  });

  describe("isValidDateRange", () => {
    test("should return true for valid range", () => {
      const start = "2024-01-01T10:00:00Z";
      const end = "2024-01-02T10:00:00Z";
      expect(TaskDomain.isValidDateRange(start, end)).toBe(true);
    });

    test("should return true for missing dates", () => {
      expect(TaskDomain.isValidDateRange()).toBe(true);
      expect(TaskDomain.isValidDateRange("2024-01-01T10:00:00Z")).toBe(true);
      expect(TaskDomain.isValidDateRange(undefined, "2024-01-01T10:00:00Z")).toBe(true);
    });

    test("should return false for invalid range", () => {
      const start = "2024-01-02T10:00:00Z";
      const end = "2024-01-01T10:00:00Z";
      expect(TaskDomain.isValidDateRange(start, end)).toBe(false);
    });
  });
});
