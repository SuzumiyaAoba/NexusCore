import type { EisenhowerQuadrant, TaskStatus } from "../../../shared/types";

export function calculateEisenhowerQuadrant(importance: boolean, urgency: boolean): EisenhowerQuadrant {
  if (importance && urgency) return 1; // Important & Urgent
  if (importance && !urgency) return 2; // Important & Not Urgent
  if (!importance && urgency) return 3; // Not Important & Urgent
  return 4; // Not Important & Not Urgent
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function canUpdateStatus(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
  if (currentStatus === "DONE" && newStatus !== "DONE") {
    return false;
  }
  return true;
}

export function canUpdatePriority(status: TaskStatus): boolean {
  return status !== "DONE";
}

export function isValidProgress(progress: number): boolean {
  return progress >= 0 && progress <= 100;
}

export function isValidDateRange(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
}
