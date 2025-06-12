import { type SQL, and, eq, isNotNull, isNull, like, or } from "drizzle-orm";
import { tasks } from "../../../shared/lib/db/schema";
import type { TaskQuery } from "../../../shared/types";

export class TaskQueryBuilder {
  private whereConditions: SQL[] = [];

  constructor(private readonly query: TaskQuery) {}

  build(): SQL | undefined {
    this.buildDeletionConditions();
    this.buildFilterConditions();
    this.buildSearchConditions();

    return this.whereConditions.length > 0 ? and(...this.whereConditions) : undefined;
  }

  private buildDeletionConditions(): void {
    const { deletedOnly = false, includeDeleted = false } = this.query;

    if (deletedOnly) {
      this.whereConditions.push(isNotNull(tasks.deletedAt));
    } else if (!includeDeleted) {
      this.whereConditions.push(isNull(tasks.deletedAt));
    }
  }

  private buildFilterConditions(): void {
    const {
      status,
      importance,
      urgency,
      eisenhowerQuadrant,
      categoryId,
      projectId,
      priority,
      createdBy,
      assignedTo,
      parentId,
    } = this.query;

    if (status) this.whereConditions.push(eq(tasks.status, status));
    if (importance !== undefined) this.whereConditions.push(eq(tasks.importance, importance));
    if (urgency !== undefined) this.whereConditions.push(eq(tasks.urgency, urgency));
    if (eisenhowerQuadrant) this.whereConditions.push(eq(tasks.eisenhowerQuadrant, eisenhowerQuadrant));
    if (categoryId) this.whereConditions.push(eq(tasks.categoryId, categoryId));
    if (projectId) this.whereConditions.push(eq(tasks.projectId, projectId));
    if (priority) this.whereConditions.push(eq(tasks.priority, priority));
    if (createdBy) this.whereConditions.push(eq(tasks.createdBy, createdBy));
    if (assignedTo) this.whereConditions.push(eq(tasks.assignedTo, assignedTo));

    this.buildParentIdCondition(parentId);
  }

  private buildParentIdCondition(parentId: number | null | undefined): void {
    if (parentId === undefined) return;

    if (parentId === null) {
      this.whereConditions.push(isNull(tasks.parentId));
    } else {
      this.whereConditions.push(eq(tasks.parentId, parentId));
    }
  }

  private buildSearchConditions(): void {
    const { search } = this.query;

    if (!search) return;

    const titleSearch = like(tasks.title, `%${search}%`);
    const descriptionSearch = and(isNotNull(tasks.description), like(tasks.description, `%${search}%`));
    const searchCondition = or(titleSearch, descriptionSearch);

    if (searchCondition) {
      this.whereConditions.push(searchCondition);
    }
  }
}
