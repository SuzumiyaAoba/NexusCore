import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import {
  type Task as DbTask,
  type User as DbUser,
  categories,
  taskTags,
  tasks,
  users,
} from "../../../shared/lib/db/schema";
import type {
  CreateTaskRequest,
  PaginatedResponse,
  Task,
  TaskQuery,
  TaskWithRelations,
  UpdateTaskRequest,
} from "../../../shared/types";
import * as TaskMapper from "./task-mapper";
import { TaskQueryBuilder } from "./task-query-builder";
import { TaskRelationLoader } from "./task-relation-loader";
import { TaskUpdateBuilder } from "./task-update-builder";

const DEFAULT_LIMIT = 50;

export class TaskRepository {
  private readonly relationLoader = new TaskRelationLoader();

  async create(taskData: CreateTaskRequest & { createdBy: number; eisenhowerQuadrant: number }): Promise<Task> {
    const result = await db
      .insert(tasks)
      .values({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status ?? "TODO",
        priority: taskData.priority ?? "medium",
        importance: taskData.importance ?? false,
        urgency: taskData.urgency ?? false,
        eisenhowerQuadrant: taskData.eisenhowerQuadrant,
        projectId: taskData.projectId,
        categoryId: taskData.categoryId,
        parentId: taskData.parentId,
        createdBy: taskData.createdBy,
        assignedTo: taskData.assignedTo,
        assignmentNote: taskData.assignmentNote,
        estimatedTime: taskData.estimatedTime,
        scheduledStartDate: taskData.scheduledStartDate,
        scheduledEndDate: taskData.scheduledEndDate,
        dueDate: taskData.dueDate,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Failed to create task");
    }

    const task = result[0];

    if (taskData.tagIds && taskData.tagIds.length > 0) {
      await db.insert(taskTags).values(
        taskData.tagIds.map((tagId) => ({
          taskId: task.id,
          tagId,
        })),
      );
    }

    return TaskMapper.toTask(task);
  }

  async findById(id: number, includeDeleted = false): Promise<Task | null> {
    const whereConditions = includeDeleted ? [eq(tasks.id, id)] : [eq(tasks.id, id), isNull(tasks.deletedAt)];

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(...whereConditions))
      .limit(1);

    return task ? TaskMapper.toTask(task) : null;
  }

  async findByIdWithRelations(id: number, includeDeleted = false): Promise<TaskWithRelations | null> {
    const whereConditions = includeDeleted ? [eq(tasks.id, id)] : [eq(tasks.id, id), isNull(tasks.deletedAt)];

    const [task] = await db
      .select({
        task: tasks,
        creator: users,
        category: categories,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .where(and(...whereConditions))
      .limit(1);

    if (!task) return null;

    const [assignee, taskTagsData, subtaskCounts] = await Promise.all([
      this.relationLoader.loadAssignee(task.task.assignedTo),
      this.relationLoader.loadTaskTags(id),
      this.relationLoader.loadSubtaskCounts(id),
    ]);

    return TaskMapper.toTaskWithRelations(task.task, {
      creator: task.creator,
      assignee,
      category: task.category,
      tags: taskTagsData,
      subtaskCount: Number(subtaskCounts?.total) || 0,
      completedSubtaskCount: Number(subtaskCounts?.completed) || 0,
    });
  }

  async findAll(query: TaskQuery = {}): Promise<PaginatedResponse<TaskWithRelations>> {
    const { sortBy = "id", order = "asc", limit = DEFAULT_LIMIT, offset = 0 } = query;

    const queryBuilder = new TaskQueryBuilder(query);
    const whereCondition = queryBuilder.build();

    const tasksResult = await db
      .select({
        task: tasks,
        creator: users,
        category: categories,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.createdBy, users.id))
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .$dynamic()
      .where(whereCondition || sql`1=1`)
      .orderBy(
        order === "desc"
          ? sql`${tasks[sortBy as keyof typeof tasks]} DESC`
          : sql`${tasks[sortBy as keyof typeof tasks]} ASC`,
      )
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(tasks)
      .$dynamic()
      .where(whereCondition || sql`1=1`);

    const total = Number(totalResult?.count) || 0;
    const enhancedTasks = await this.enhanceTasksWithRelations(tasksResult);

    return {
      data: enhancedTasks,
      total,
      limit,
      offset,
    };
  }

  async update(id: number, taskData: UpdateTaskRequest & { eisenhowerQuadrant?: number }): Promise<Task | null> {
    const updateBuilder = new TaskUpdateBuilder(taskData);
    const updateData = updateBuilder.build();

    const result = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
      .returning();

    const [task] = result;
    if (!task) return null;

    await this.updateTaskTags(id, taskData.tagIds);
    return TaskMapper.toTask(task);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await db
      .update(tasks)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)));

    return (result as unknown as { changes: number }).changes > 0;
  }

  async restore(id: number): Promise<Task | null> {
    const result = await db
      .update(tasks)
      .set({
        deletedAt: null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(tasks.id, id), isNotNull(tasks.deletedAt)))
      .returning();

    const [task] = result;
    return task ? TaskMapper.toTask(task) : null;
  }

  async permanentDelete(id: number): Promise<boolean> {
    await db.delete(taskTags).where(eq(taskTags.taskId, id));
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result as unknown as { changes: number }).changes > 0;
  }

  private async updateTaskTags(taskId: number, tagIds: number[] | undefined): Promise<void> {
    if (tagIds === undefined) return;

    await db.delete(taskTags).where(eq(taskTags.taskId, taskId));

    if (tagIds.length > 0) {
      await db.insert(taskTags).values(
        tagIds.map((tagId) => ({
          taskId,
          tagId,
        })),
      );
    }
  }

  private async enhanceTasksWithRelations(
    tasksResult: Array<{
      task: DbTask;
      creator: DbUser | null;
      category: { id: number; name: string; color: string | null; createdAt: string } | null;
    }>,
  ) {
    const taskIds = tasksResult.map((r) => r.task.id);
    const assigneeIds = tasksResult.map((r) => r.task.assignedTo).filter(Boolean) as number[];

    const [assignees, allTaskTags, allSubtaskCounts] = await Promise.all([
      assigneeIds.length > 0 ? this.relationLoader.loadUsersByIds(assigneeIds) : Promise.resolve([]),
      this.relationLoader.loadTaskTagsBatch(taskIds),
      this.relationLoader.loadSubtaskCountsBatch(taskIds),
    ]);

    const assigneeMap = new Map<number, DbUser>(assignees.map((u) => [u.id, u]));
    const taskTagsMap = new Map<number, Array<{ id: number; name: string; color: string | null; createdAt: string }>>();
    const subtaskCountsMap = new Map<number, { total: unknown; completed: unknown }>();

    for (const { taskId, tag } of allTaskTags) {
      if (!taskTagsMap.has(taskId)) taskTagsMap.set(taskId, []);
      taskTagsMap.get(taskId)?.push(tag);
    }

    for (const item of allSubtaskCounts) {
      if (item.parentId) {
        subtaskCountsMap.set(item.parentId, { total: item.total, completed: item.completed });
      }
    }

    return tasksResult.map((result) => {
      const task = result.task;
      const assignee = task.assignedTo ? assigneeMap.get(task.assignedTo) || null : null;
      const taskTags = taskTagsMap.get(task.id) || [];
      const subtaskCounts = subtaskCountsMap.get(task.id);

      return TaskMapper.toTaskWithRelations(task, {
        creator: result.creator,
        assignee,
        category: result.category,
        tags: taskTags,
        subtaskCount: Number(subtaskCounts?.total) || 0,
        completedSubtaskCount: Number(subtaskCounts?.completed) || 0,
      });
    });
  }
}
