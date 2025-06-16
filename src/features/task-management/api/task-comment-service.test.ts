// @ts-nocheck
import { describe, expect, mock, test } from "bun:test";
import type { CreateTaskCommentRequest, Task, TaskComment, UpdateTaskCommentRequest } from "../../../shared/types";
import { TaskCommentService } from "./task-comment-service";

// Mock the repositories
const createMockCommentRepository = () => {
  const mockRepo = {
    create: mock(() => Promise.resolve({} as TaskComment)),
    findById: mock(() => Promise.resolve(null)),
    findByIdWithRelations: mock(() => Promise.resolve(null)),
    findByTaskId: mock(() => Promise.resolve([])),
    findRepliesByParentId: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(null)),
    softDelete: mock(() => Promise.resolve(false)),
    restore: mock(() => Promise.resolve(false)),
    hardDelete: mock(() => Promise.resolve(false)),
    countByTaskId: mock(() => Promise.resolve(0)),
    countRepliesByParentId: mock(() => Promise.resolve(0)),
  } as any;
  return mockRepo;
};

const createMockTaskRepository = () => {
  const mockRepo = {
    findById: mock(() => Promise.resolve(null)),
  } as any;
  return mockRepo;
};

describe("TaskCommentService", () => {
  describe("createComment", () => {
    test("should create comment with valid data", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const mockTask: Task = {
        id: 1,
        title: "Test Task",
        description: "Test description",
        status: "TODO",
        priority: "medium",
        importance: false,
        urgency: false,
        eisenhowerQuadrant: 4,
        projectId: null,
        categoryId: null,
        parentId: null,
        createdBy: 1,
        assignedTo: null,
        assignmentStatus: null,
        assignmentNote: null,
        estimatedTime: null,
        progress: 0,
        scheduledDate: null,
        scheduledStartDate: null,
        scheduledEndDate: null,
        dueDate: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const mockComment: TaskComment = {
        id: 1,
        taskId: 1,
        userId: 1,
        content: "Test comment",
        parentId: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockTaskRepo.findById.mockResolvedValue(mockTask);
      mockCommentRepo.create.mockResolvedValue(mockComment);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);
      const commentData: CreateTaskCommentRequest = {
        taskId: 1,
        content: "Test comment",
      };

      const result = await service.createComment(commentData, 1);

      expect(result.isOk()).toBe(true);
      expect(mockTaskRepo.findById).toHaveBeenCalledWith(1);
      expect(mockCommentRepo.create).toHaveBeenCalledWith({
        taskId: 1,
        content: "Test comment",
        userId: 1,
      });
    });

    test("should return error for non-existent task", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      mockTaskRepo.findById.mockResolvedValue(null);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);
      const commentData: CreateTaskCommentRequest = {
        taskId: 999,
        content: "Test comment",
      };

      const result = await service.createComment(commentData, 1);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("NOT_FOUND");
    });

    test("should validate parent comment belongs to same task", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const mockTask: Task = {
        id: 1,
        title: "Test Task",
        description: "Test description",
        status: "TODO",
        priority: "medium",
        importance: false,
        urgency: false,
        eisenhowerQuadrant: 4,
        projectId: null,
        categoryId: null,
        parentId: null,
        createdBy: 1,
        assignedTo: null,
        assignmentStatus: null,
        assignmentNote: null,
        estimatedTime: null,
        progress: 0,
        scheduledDate: null,
        scheduledStartDate: null,
        scheduledEndDate: null,
        dueDate: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const mockParentComment: TaskComment = {
        id: 1,
        taskId: 2, // Different task ID
        userId: 1,
        content: "Parent comment",
        parentId: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockTaskRepo.findById.mockResolvedValue(mockTask);
      mockCommentRepo.findById.mockResolvedValue(mockParentComment);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);
      const commentData: CreateTaskCommentRequest = {
        taskId: 1,
        content: "Reply comment",
        parentId: 1,
      };

      const result = await service.createComment(commentData, 1);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("VALIDATION_ERROR");
    });

    test("should handle validation errors", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);
      const invalidCommentData = {
        taskId: "invalid",
        content: "",
      };

      const result = await service.createComment(invalidCommentData as any, 1);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("VALIDATION_ERROR");
    });
  });

  describe("updateComment", () => {
    test("should update comment with valid data", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const mockComment: TaskComment = {
        id: 1,
        taskId: 1,
        userId: 1,
        content: "Original comment",
        parentId: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const updatedComment: TaskComment = {
        ...mockComment,
        content: "Updated comment",
        updatedAt: "2024-01-01T01:00:00Z",
      };

      mockCommentRepo.findById.mockResolvedValue(mockComment);
      mockCommentRepo.update.mockResolvedValue(updatedComment);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);
      const updateData: UpdateTaskCommentRequest = {
        content: "Updated comment",
      };

      const result = await service.updateComment(1, updateData, 1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().content).toBe("Updated comment");
    });

    test("should return error for unauthorized update", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const mockComment: TaskComment = {
        id: 1,
        taskId: 1,
        userId: 2, // Different user
        content: "Original comment",
        parentId: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockCommentRepo.findById.mockResolvedValue(mockComment);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);
      const updateData: UpdateTaskCommentRequest = {
        content: "Updated comment",
      };

      const result = await service.updateComment(1, updateData, 1); // User 1 trying to update user 2's comment

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("AUTHORIZATION_ERROR");
    });
  });

  describe("deleteComment", () => {
    test("should delete comment with valid authorization", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const mockComment: TaskComment = {
        id: 1,
        taskId: 1,
        userId: 1,
        content: "Comment to delete",
        parentId: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockCommentRepo.findById.mockResolvedValue(mockComment);
      mockCommentRepo.softDelete.mockResolvedValue(true);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);

      const result = await service.deleteComment(1, 1);

      expect(result.isOk()).toBe(true);
      expect(mockCommentRepo.softDelete).toHaveBeenCalledWith(1);
    });

    test("should return error for unauthorized deletion", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const mockComment: TaskComment = {
        id: 1,
        taskId: 1,
        userId: 2, // Different user
        content: "Comment to delete",
        parentId: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      mockCommentRepo.findById.mockResolvedValue(mockComment);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);

      const result = await service.deleteComment(1, 1); // User 1 trying to delete user 2's comment

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe("AUTHORIZATION_ERROR");
    });
  });

  describe("getCommentsByTaskId", () => {
    test("should return threaded comments", async () => {
      const mockCommentRepo = createMockCommentRepository();
      const mockTaskRepo = createMockTaskRepository();

      const mockTask: Task = {
        id: 1,
        title: "Test Task",
        description: "Test description",
        status: "TODO",
        priority: "medium",
        importance: false,
        urgency: false,
        eisenhowerQuadrant: 4,
        projectId: null,
        categoryId: null,
        parentId: null,
        createdBy: 1,
        assignedTo: null,
        assignmentStatus: null,
        assignmentNote: null,
        estimatedTime: null,
        progress: 0,
        scheduledDate: null,
        scheduledStartDate: null,
        scheduledEndDate: null,
        dueDate: null,
        deletedAt: null,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const mockComments = [
        {
          id: 1,
          taskId: 1,
          userId: 1,
          content: "Parent comment",
          parentId: null,
          deletedAt: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          taskId: 1,
          userId: 2,
          content: "Reply comment",
          parentId: 1,
          deletedAt: null,
          createdAt: "2024-01-01T01:00:00Z",
          updatedAt: "2024-01-01T01:00:00Z",
        },
      ];

      mockTaskRepo.findById.mockResolvedValue(mockTask);
      mockCommentRepo.findByTaskId.mockResolvedValue(mockComments);

      const service = new TaskCommentService(mockCommentRepo, mockTaskRepo);

      const result = await service.getCommentsByTaskId(1);

      expect(result.isOk()).toBe(true);
      const comments = result._unsafeUnwrap();
      expect(comments).toHaveLength(1); // Only root comment
      expect(comments[0].replies).toHaveLength(1); // Reply is nested
      expect(comments[0].replyCount).toBe(1);
    });
  });
});
