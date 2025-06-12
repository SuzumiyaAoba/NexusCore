import { sql } from "drizzle-orm";
import type { UpdateTaskRequest } from "../../../shared/types";

export class TaskUpdateBuilder {
  private updateData: Record<string, unknown> = {
    updatedAt: sql`CURRENT_TIMESTAMP`,
  };

  constructor(private readonly taskData: UpdateTaskRequest & { eisenhowerQuadrant?: number }) {}

  build(): Record<string, unknown> {
    this.buildBasicFields();
    this.buildDateFields();
    this.buildAssignmentFields();

    return this.updateData;
  }

  private buildBasicFields(): void {
    const {
      title,
      description,
      status,
      priority,
      importance,
      urgency,
      eisenhowerQuadrant,
      projectId,
      categoryId,
      progress,
    } = this.taskData;

    if (title !== undefined) this.updateData.title = title;
    if (description !== undefined) this.updateData.description = description;
    if (status !== undefined) this.updateData.status = status;
    if (priority !== undefined) this.updateData.priority = priority;
    if (importance !== undefined) this.updateData.importance = importance;
    if (urgency !== undefined) this.updateData.urgency = urgency;
    if (eisenhowerQuadrant !== undefined) this.updateData.eisenhowerQuadrant = eisenhowerQuadrant;
    if (projectId !== undefined) this.updateData.projectId = projectId;
    if (categoryId !== undefined) this.updateData.categoryId = categoryId;
    if (progress !== undefined) this.updateData.progress = progress;
  }

  private buildDateFields(): void {
    const { scheduledStartDate, scheduledEndDate, dueDate, estimatedTime } = this.taskData;

    if (scheduledStartDate !== undefined) this.updateData.scheduledStartDate = scheduledStartDate;
    if (scheduledEndDate !== undefined) this.updateData.scheduledEndDate = scheduledEndDate;
    if (dueDate !== undefined) this.updateData.dueDate = dueDate;
    if (estimatedTime !== undefined) this.updateData.estimatedTime = estimatedTime;
  }

  private buildAssignmentFields(): void {
    const { assignedTo, assignmentNote } = this.taskData;

    if (assignedTo !== undefined) this.updateData.assignedTo = assignedTo;
    if (assignmentNote !== undefined) this.updateData.assignmentNote = assignmentNote;
  }
}
