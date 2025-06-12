import { TaskDomain } from "../../../entities/task/model";
import type { Task, UpdateTaskRequest } from "../../../shared/types";

export class TaskBusinessLogic {
  static calculateEisenhowerQuadrant(importance: boolean, urgency: boolean): number {
    return TaskDomain.calculateEisenhowerQuadrant(importance, urgency);
  }

  static shouldRecalculateEisenhowerQuadrant(
    taskData: UpdateTaskRequest,
    existingTask: Task,
  ): { shouldRecalculate: boolean; eisenhowerQuadrant?: number } {
    if (taskData.importance === undefined && taskData.urgency === undefined) {
      return { shouldRecalculate: false };
    }

    const importance = taskData.importance !== undefined ? taskData.importance : existingTask.importance;
    const urgency = taskData.urgency !== undefined ? taskData.urgency : existingTask.urgency;
    const eisenhowerQuadrant = TaskBusinessLogic.calculateEisenhowerQuadrant(importance, urgency);

    return { shouldRecalculate: true, eisenhowerQuadrant };
  }
}
