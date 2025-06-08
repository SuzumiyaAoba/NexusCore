import { type SQL, and, eq, isNotNull, isNull, like, or, sql } from "drizzle-orm";
import { db } from "../../../shared/config/database";
import {
  type Task as DbTask,
  type User as DbUser,
  categories,
  tags,
  taskTags,
  tasks,
  users,
} from "../../../shared/lib/db/schema";
import { mapToUserInfo } from "../../../shared/lib/mappers/user";
import type {
  CreateTaskRequest,
  PaginatedResponse,
  Task,
  TaskQuery,
  TaskWithRelations,
  UpdateTaskRequest,
} from "../../../shared/types";

export class TaskRepository {
  async create(taskData: CreateTaskRequest & { createdBy: number; eisenhowerQuadrant: number }): Promise<Task> {
    const result = await db
      .insert(tasks)
      .values({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || "TODO",
        priority: taskData.priority || "medium",
        importance: taskData.importance || false,
        urgency: taskData.urgency || false,
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

    // Handle tag associations
    if (taskData.tagIds && taskData.tagIds.length > 0) {
      await db.insert(taskTags).values(
        taskData.tagIds.map((tagId) => ({
          taskId: task.id,
          tagId,
        })),
      );
    }

    return this.mapToTask(task);
  }

  async findById(id: number, includeDeleted = false): Promise<Task | null> {
    const whereConditions = includeDeleted ? [eq(tasks.id, id)] : [eq(tasks.id, id), isNull(tasks.deletedAt)];

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(...whereConditions))
      .limit(1);

    return task ? this.mapToTask(task) : null;
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
      this.getAssigneeInfo(task.task.assignedTo),
      this.getTaskTags(id),
      this.getSubtaskCounts(id),
    ]);

    return {
      ...this.mapToTask(task.task),
      creator: task.creator ? mapToUserInfo(task.creator) : undefined,
      assignee: assignee ? mapToUserInfo(assignee) : undefined,
      category: task.category
        ? {
            id: task.category.id,
            name: task.category.name,
            color: task.category.color,
            createdAt: task.category.createdAt,
          }
        : undefined,
      tags: taskTagsData,
      subtaskCount: Number(subtaskCounts?.total) || 0,
      completedSubtaskCount: Number(subtaskCounts?.completed) || 0,
    };
  }

  async findAll(query: TaskQuery = {}): Promise<PaginatedResponse<TaskWithRelations>> {
    const {
      status,
      importance,
      urgency,
      eisenhowerQuadrant,
      categoryId,
      projectId,
      parentId,
      priority,
      search,
      createdBy,
      assignedTo,
      includeDeleted = false,
      deletedOnly = false,
      sortBy = "id",
      order = "asc",
      limit = 50,
      offset = 0,
    } = query;

    // Build where conditions
    const whereConditions: SQL[] = [];

    if (deletedOnly) {
      whereConditions.push(isNotNull(tasks.deletedAt));
    } else if (!includeDeleted) {
      whereConditions.push(isNull(tasks.deletedAt));
    }

    if (status) whereConditions.push(eq(tasks.status, status));
    if (importance !== undefined) whereConditions.push(eq(tasks.importance, importance));
    if (urgency !== undefined) whereConditions.push(eq(tasks.urgency, urgency));
    if (eisenhowerQuadrant) whereConditions.push(eq(tasks.eisenhowerQuadrant, eisenhowerQuadrant));
    if (categoryId) whereConditions.push(eq(tasks.categoryId, categoryId));
    if (projectId) whereConditions.push(eq(tasks.projectId, projectId));
    if (parentId !== undefined) {
      if (parentId === null) {
        whereConditions.push(isNull(tasks.parentId));
      } else {
        whereConditions.push(eq(tasks.parentId, parentId));
      }
    }
    if (priority) whereConditions.push(eq(tasks.priority, priority));
    if (createdBy) whereConditions.push(eq(tasks.createdBy, createdBy));
    if (assignedTo) whereConditions.push(eq(tasks.assignedTo, assignedTo));

    if (search) {
      const titleSearch = like(tasks.title, `%${search}%`);
      const descriptionSearch = and(isNotNull(tasks.description), like(tasks.description, `%${search}%`));
      const searchCondition = or(titleSearch, descriptionSearch);
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Get tasks with basic joins
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : sql`1=1`)
      .orderBy(
        order === "desc"
          ? sql`${tasks[sortBy as keyof typeof tasks]} DESC`
          : sql`${tasks[sortBy as keyof typeof tasks]} ASC`,
      )
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: sql`COUNT(*)`.as("count") })
      .from(tasks)
      .$dynamic()
      .where(whereConditions.length > 0 ? and(...whereConditions) : sql`1=1`);

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
    const updateData: Record<string, unknown> = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    if (taskData.title !== undefined) updateData.title = taskData.title;
    if (taskData.description !== undefined) updateData.description = taskData.description;
    if (taskData.status !== undefined) updateData.status = taskData.status;
    if (taskData.priority !== undefined) updateData.priority = taskData.priority;
    if (taskData.importance !== undefined) updateData.importance = taskData.importance;
    if (taskData.urgency !== undefined) updateData.urgency = taskData.urgency;
    if (taskData.eisenhowerQuadrant !== undefined) updateData.eisenhowerQuadrant = taskData.eisenhowerQuadrant;
    if (taskData.projectId !== undefined) updateData.projectId = taskData.projectId;
    if (taskData.categoryId !== undefined) updateData.categoryId = taskData.categoryId;
    if (taskData.assignedTo !== undefined) updateData.assignedTo = taskData.assignedTo;
    if (taskData.assignmentNote !== undefined) updateData.assignmentNote = taskData.assignmentNote;
    if (taskData.estimatedTime !== undefined) updateData.estimatedTime = taskData.estimatedTime;
    if (taskData.progress !== undefined) updateData.progress = taskData.progress;
    if (taskData.scheduledStartDate !== undefined) updateData.scheduledStartDate = taskData.scheduledStartDate;
    if (taskData.scheduledEndDate !== undefined) updateData.scheduledEndDate = taskData.scheduledEndDate;
    if (taskData.dueDate !== undefined) updateData.dueDate = taskData.dueDate;

    const result = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
      .returning();

    const [task] = result;

    if (!task) return null;

    // Handle tag updates
    if (taskData.tagIds !== undefined) {
      // Remove existing tags
      await db.delete(taskTags).where(eq(taskTags.taskId, id));

      // Add new tags
      if (taskData.tagIds.length > 0) {
        await db.insert(taskTags).values(
          taskData.tagIds.map((tagId) => ({
            taskId: id,
            tagId,
          })),
        );
      }
    }

    return this.mapToTask(task);
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

    return task ? this.mapToTask(task) : null;
  }

  async permanentDelete(id: number): Promise<boolean> {
    await db.delete(taskTags).where(eq(taskTags.taskId, id));
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result as unknown as { changes: number }).changes > 0;
  }

  private async getAssigneeInfo(assignedTo: number | null): Promise<DbUser | null> {
    if (!assignedTo) return null;
    const [assignee] = await db.select().from(users).where(eq(users.id, assignedTo)).limit(1);
    return assignee || null;
  }

  private async getTaskTags(taskId: number) {
    const result = await db
      .select({ tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId));
    return result.map((r) => r.tag);
  }

  private async getSubtaskCounts(parentId: number) {
    const [counts] = await db
      .select({
        total: sql`COUNT(*)`.as("total"),
        completed: sql`COUNT(CASE WHEN status = 'DONE' THEN 1 END)`.as("completed"),
      })
      .from(tasks)
      .where(and(eq(tasks.parentId, parentId), isNull(tasks.deletedAt)));
    return counts;
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
      assigneeIds.length > 0 ? this.getUsersByIds(assigneeIds) : Promise.resolve([]),
      this.getTaskTagsBatch(taskIds),
      this.getSubtaskCountsBatch(taskIds),
    ]);

    const assigneeMap = new Map<number, DbUser>(assignees.map((u) => [u.id, u]));
    const taskTagsMap = new Map<number, { id: number; name: string; color: string | null; createdAt: string }[]>();
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

      return {
        ...this.mapToTask(task),
        creator: result.creator ? mapToUserInfo(result.creator) : undefined,
        assignee: assignee ? mapToUserInfo(assignee) : undefined,
        category: result.category
          ? {
              id: result.category.id,
              name: result.category.name,
              color: result.category.color,
              createdAt: result.category.createdAt,
            }
          : undefined,
        tags: taskTags,
        subtaskCount: Number(subtaskCounts?.total) || 0,
        completedSubtaskCount: Number(subtaskCounts?.completed) || 0,
      };
    });
  }

  private async getUsersByIds(ids: number[]): Promise<DbUser[]> {
    return db
      .select()
      .from(users)
      .where(
        sql`${users.id} IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
  }

  private async getTaskTagsBatch(taskIds: number[]) {
    if (taskIds.length === 0) return [];
    return db
      .select({ taskId: taskTags.taskId, tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(
        sql`${taskTags.taskId} IN (${sql.join(
          taskIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
  }

  private async getSubtaskCountsBatch(parentIds: number[]) {
    if (parentIds.length === 0) return [];
    return db
      .select({
        parentId: tasks.parentId,
        total: sql`COUNT(*)`.as("total"),
        completed: sql`COUNT(CASE WHEN status = 'DONE' THEN 1 END)`.as("completed"),
      })
      .from(tasks)
      .where(
        and(
          sql`${tasks.parentId} IN (${sql.join(
            parentIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          isNull(tasks.deletedAt),
        ),
      )
      .groupBy(tasks.parentId);
  }

  private mapToTask(task: DbTask): Task {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      importance: task.importance,
      urgency: task.urgency,
      eisenhowerQuadrant: task.eisenhowerQuadrant,
      projectId: task.projectId,
      categoryId: task.categoryId,
      parentId: task.parentId,
      createdBy: task.createdBy,
      assignedTo: task.assignedTo,
      assignmentStatus: task.assignmentStatus,
      assignmentNote: task.assignmentNote,
      estimatedTime: task.estimatedTime,
      progress: task.progress,
      scheduledDate: task.scheduledDate,
      scheduledStartDate: task.scheduledStartDate,
      scheduledEndDate: task.scheduledEndDate,
      dueDate: task.dueDate,
      deletedAt: task.deletedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
