// @ts-nocheck
import { describe, expect, mock, test } from "bun:test";
import type { CreateTaskRequest, Task, UpdateTaskRequest } from "../../../shared/types";
import { TaskService } from "./service";

// Mock the repository
const createMockRepository = () => {
  const mockRepo = {
    create: mock(() => Promise.resolve({} as Task)),
    findById: mock(() => Promise.resolve(null)),
    findByIdWithRelations: mock(() => Promise.resolve(null)),
    findAll: mock(() => Promise.resolve({ data: [], total: 0, limit: 50, offset: 0 })),
    update: mock(() => Promise.resolve(null)),
    softDelete: mock(() => Promise.resolve(false)),
    restore: mock(() => Promise.resolve(null)),
    permanentDelete: mock(() => Promise.resolve(false)),
    getAssigneeInfo: mock(() => Promise.resolve(null)),
    getTaskTags: mock(() => Promise.resolve([])),
    getSubtaskCounts: mock(() => Promise.resolve({ total: 0, completed: 0 })),
    enhanceTasksWithRelations: mock(() => Promise.resolve([])),
    getUsersByIds: mock(() => Promise.resolve([])),
    getTaskTagsBatch: mock(() => Promise.resolve({})),
    getSubtaskCountsBatch: mock(() => Promise.resolve({})),
  } as any;
  return mockRepo;
};

describe("TaskService", () => {
  describe("createTask", () => {
    test("should create task with valid data", async () => {
      const mockRepo = createMockRepository();
      const mockTask: Task = {
        id: 1,
        title: "Test Task",
        description: "Test description",
        status: "TODO",
        priority: "medium",
        importance: true,
        urgency: false,
        eisenhowerQuadrant: 2,
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

      (mockRepo.create as any).mockResolvedValue(mockTask);

      const service = new TaskService(mockRepo);
      const taskData: CreateTaskRequest = {
        title: "Test Task",
        description: "Test description",
        importance: true,
        urgency: false,
      };

      const result = await service.createTask(taskData, 1);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockTask);
      }
      expect(mockRepo.create as any).toHaveBeenCalledTimes(1);
      const callArgs = (mockRepo.create as any).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        title: "Test Task",
        description: "Test description",
        importance: true,
        urgency: false,
        createdBy: 1,
        eisenhowerQuadrant: 2, // Important & Not Urgent
      });
    });

    test("should handle validation errors", async () => {
      const mockRepo = createMockRepository();
      const service = new TaskService(mockRepo);

      const invalidData = { title: "" }; // Invalid: empty title

      const result = await service.createTask(invalidData as CreateTaskRequest, 1);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
      expect(mockRepo.create as any).not.toHaveBeenCalled();
    });

    test("should handle repository errors", async () => {
      const mockRepo = createMockRepository();
      (mockRepo.create as any).mockRejectedValue(new Error("Database error"));

      const service = new TaskService(mockRepo);
      const taskData: CreateTaskRequest = {
        title: "Test Task",
      };

      const result = await service.createTask(taskData, 1);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("DATABASE_ERROR");
        expect(result.error.message).toBe("Failed to create task");
      }
    });
  });

  describe("getTaskById", () => {
    test("should return task when found", async () => {
      const mockRepo = createMockRepository();
      const mockTask = {
        id: 1,
        title: "Test Task",
        description: "Test description",
        creator: {
          id: 1,
          username: "testuser",
          displayName: "Test User",
          email: "test@example.com",
          avatarUrl: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      } as any;

      (mockRepo.findByIdWithRelations as any).mockResolvedValue(mockTask);

      const service = new TaskService(mockRepo);
      const result = await service.getTaskById(1);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockTask);
      }
    });

    test("should return not found error when task doesn't exist", async () => {
      const mockRepo = createMockRepository();
      (mockRepo.findByIdWithRelations as any).mockResolvedValue(null);

      const service = new TaskService(mockRepo);
      const result = await service.getTaskById(999);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });

    test("should handle repository errors", async () => {
      const mockRepo = createMockRepository();
      (mockRepo.findByIdWithRelations as any).mockRejectedValue(new Error("Database error"));

      const service = new TaskService(mockRepo);
      const result = await service.getTaskById(1);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("DATABASE_ERROR");
      }
    });
  });

  describe("updateTask", () => {
    test("should update task with valid data", async () => {
      const mockRepo = createMockRepository();
      const existingTask: Task = {
        id: 1,
        title: "Original Task",
        status: "TODO",
        importance: false,
        urgency: false,
        eisenhowerQuadrant: 4,
      } as Task;

      const updatedTask: Task = {
        ...existingTask,
        title: "Updated Task",
        status: "DOING",
      };

      (mockRepo.findById as any).mockResolvedValue(existingTask);
      (mockRepo.update as any).mockResolvedValue(updatedTask);

      const service = new TaskService(mockRepo);
      const updateData: UpdateTaskRequest = {
        title: "Updated Task",
        status: "DOING",
      };

      const result = await service.updateTask(1, updateData);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(updatedTask);
      }
    });

    test("should prevent status change from DONE", async () => {
      const mockRepo = createMockRepository();
      const existingTask: Task = {
        id: 1,
        status: "DONE",
      } as Task;

      (mockRepo.findById as any).mockResolvedValue(existingTask);

      const service = new TaskService(mockRepo);
      const updateData: UpdateTaskRequest = {
        status: "TODO",
      };

      const result = await service.updateTask(1, updateData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Cannot change status from DONE");
      }
    });

    test("should prevent priority change for DONE tasks", async () => {
      const mockRepo = createMockRepository();
      const existingTask: Task = {
        id: 1,
        status: "DONE",
        priority: "medium",
      } as Task;

      (mockRepo.findById as any).mockResolvedValue(existingTask);

      const service = new TaskService(mockRepo);
      const updateData: UpdateTaskRequest = {
        priority: "high",
      };

      const result = await service.updateTask(1, updateData);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("Cannot change priority of completed tasks");
      }
    });
  });

  describe("deleteTask", () => {
    test("should delete existing task", async () => {
      const mockRepo = createMockRepository();
      const existingTask: Task = { id: 1 } as Task;

      (mockRepo.findById as any).mockResolvedValue(existingTask);
      (mockRepo.softDelete as any).mockResolvedValue(true);

      const service = new TaskService(mockRepo);
      const result = await service.deleteTask(1);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    test("should return not found for non-existent task", async () => {
      const mockRepo = createMockRepository();
      (mockRepo.findById as any).mockResolvedValue(null);

      const service = new TaskService(mockRepo);
      const result = await service.deleteTask(999);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("bulkUpdateTasks", () => {
    test("should update multiple tasks", async () => {
      const mockRepo = createMockRepository();
      const existingTask: Task = { id: 1, status: "TODO" } as Task;
      const updatedTask: Task = { ...existingTask, status: "DOING" };

      (mockRepo.findById as any).mockResolvedValue(existingTask);
      (mockRepo.update as any).mockResolvedValue(updatedTask);

      const service = new TaskService(mockRepo);
      const result = await service.bulkUpdateTasks([1, 2], { status: "DOING" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.updated).toBe(2);
        expect(result.value.failed).toBe(0);
        expect(result.value.errors).toEqual([]);
      }
    });

    test("should handle partial failures", async () => {
      const mockRepo = createMockRepository();

      // First task exists, second doesn't
      (mockRepo.findById as any).mockResolvedValueOnce({ id: 1, status: "TODO" } as Task).mockResolvedValueOnce(null);

      (mockRepo.update as any).mockResolvedValue({ id: 1, status: "DOING" } as Task);

      const service = new TaskService(mockRepo);
      const result = await service.bulkUpdateTasks([1, 999], { status: "DOING" });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.updated).toBe(1);
        expect(result.value.failed).toBe(1);
        expect(result.value.errors).toHaveLength(1);
      }
    });
  });
});
