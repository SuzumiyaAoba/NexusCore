import type { EisenhowerQuadrant, TaskStatus } from "../../../shared/types";

export class TaskBusinessRules {
  static calculateEisenhowerQuadrant(importance: boolean, urgency: boolean): EisenhowerQuadrant {
    if (importance && urgency) return 1; // Important & Urgent
    if (importance && !urgency) return 2; // Important & Not Urgent
    if (!importance && urgency) return 3; // Not Important & Urgent
    return 4; // Not Important & Not Urgent
  }

  static isOverdue(dueDate: string | null | undefined): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  static canUpdateStatus(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    if (currentStatus === "DONE" && newStatus !== "DONE") {
      return false;
    }
    return true;
  }

  static canUpdatePriority(status: TaskStatus): boolean {
    return status !== "DONE";
  }

  static isValidProgress(progress: number): boolean {
    return progress >= 0 && progress <= 100;
  }

  static isValidDateRange(startDate?: string, endDate?: string): boolean {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  }
}
