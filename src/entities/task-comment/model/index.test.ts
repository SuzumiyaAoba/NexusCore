import { describe, expect, it } from "bun:test";
import { TaskCommentDomain } from "./index";

describe("TaskCommentDomain", () => {
  describe("validateCreate", () => {
    it("should validate valid task comment data", () => {
      const validData = {
        taskId: 1,
        content: "This is a valid comment",
      };

      const result = TaskCommentDomain.validateCreate(validData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(validData);
      }
    });

    it("should fail validation for empty content", () => {
      const invalidData = {
        taskId: 1,
        content: "",
      };

      const result = TaskCommentDomain.validateCreate(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Comment content cannot be empty");
      }
    });

    it("should fail validation for content too long", () => {
      const invalidData = {
        taskId: 1,
        content: "a".repeat(1001),
      };

      const result = TaskCommentDomain.validateCreate(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Comment content cannot exceed 1000 characters");
      }
    });

    it("should fail validation for invalid task ID", () => {
      const invalidData = {
        taskId: 0,
        content: "Valid content",
      };

      const result = TaskCommentDomain.validateCreate(invalidData);
      expect(result.isErr()).toBe(true);
    });
  });

  describe("validateUpdate", () => {
    it("should validate valid update data", () => {
      const validData = {
        content: "Updated comment content",
      };

      const result = TaskCommentDomain.validateUpdate(validData);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(validData);
      }
    });

    it("should fail validation for empty content", () => {
      const invalidData = {
        content: "",
      };

      const result = TaskCommentDomain.validateUpdate(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Comment content cannot be empty");
      }
    });

    it("should fail validation for content too long", () => {
      const invalidData = {
        content: "a".repeat(1001),
      };

      const result = TaskCommentDomain.validateUpdate(invalidData);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Comment content cannot exceed 1000 characters");
      }
    });
  });

  describe("validateId", () => {
    it("should validate positive integer", () => {
      const result = TaskCommentDomain.validateId(1);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(1);
      }
    });

    it("should coerce string numbers", () => {
      const result = TaskCommentDomain.validateId("42");
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    it("should fail for zero", () => {
      const result = TaskCommentDomain.validateId(0);
      expect(result.isErr()).toBe(true);
    });

    it("should fail for negative numbers", () => {
      const result = TaskCommentDomain.validateId(-1);
      expect(result.isErr()).toBe(true);
    });

    it("should fail for non-numeric strings", () => {
      const result = TaskCommentDomain.validateId("abc");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("isValidContent", () => {
    it("should validate correct content", () => {
      expect(TaskCommentDomain.isValidContent("Valid content")).toBe(true);
      expect(TaskCommentDomain.isValidContent("x")).toBe(true);
      expect(TaskCommentDomain.isValidContent("a".repeat(1000))).toBe(true);
    });

    it("should reject invalid content", () => {
      expect(TaskCommentDomain.isValidContent("")).toBe(false);
      expect(TaskCommentDomain.isValidContent("   ")).toBe(false);
      expect(TaskCommentDomain.isValidContent("a".repeat(1001))).toBe(false);
    });
  });

  describe("canUserModifyComment", () => {
    it("should allow user to modify their own comment", () => {
      expect(TaskCommentDomain.canUserModifyComment(1, 1)).toBe(true);
    });

    it("should not allow user to modify other user's comment", () => {
      expect(TaskCommentDomain.canUserModifyComment(1, 2)).toBe(false);
    });
  });

  describe("isCommentEditable", () => {
    it("should allow editing within time limit", () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(TaskCommentDomain.isCommentEditable(oneHourAgo.toISOString())).toBe(true);
    });

    it("should not allow editing after time limit", () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      expect(TaskCommentDomain.isCommentEditable(twoDaysAgo.toISOString())).toBe(false);
    });

    it("should respect custom time limit", () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(TaskCommentDomain.isCommentEditable(twoHoursAgo.toISOString(), 1)).toBe(false);
      expect(TaskCommentDomain.isCommentEditable(twoHoursAgo.toISOString(), 3)).toBe(true);
    });
  });

  describe("sanitizeContent", () => {
    it("should trim whitespace", () => {
      expect(TaskCommentDomain.sanitizeContent("  content  ")).toBe("content");
      expect(TaskCommentDomain.sanitizeContent("\t\ncontent\n\t")).toBe("content");
    });

    it("should preserve internal whitespace", () => {
      expect(TaskCommentDomain.sanitizeContent("  multi  word  content  ")).toBe("multi  word  content");
    });
  });
});
