import type { TaskComment } from "../../../shared/lib/db/schema";

export function isValidContent(content: string): boolean {
  return content.trim().length >= 1 && content.length <= 1000;
}

export function canUserModifyComment(commentUserId: number, currentUserId: number): boolean {
  return commentUserId === currentUserId;
}

export function isCommentEditable(createdAt: string, maxEditTimeHours = 24): boolean {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const maxEditTime = maxEditTimeHours * 60 * 60 * 1000; // Convert hours to milliseconds

  return now.getTime() - createdDate.getTime() <= maxEditTime;
}

export function sanitizeContent(content: string): string {
  return content.trim();
}

export function canEditComment(comment: TaskComment, userId: number): boolean {
  return comment.userId === userId;
}

export function canDeleteComment(comment: TaskComment, userId: number): boolean {
  return comment.userId === userId;
}

export function isCommentDeleted(comment: TaskComment): boolean {
  return comment.deletedAt !== null;
}

export function isReplyToComment(comment: TaskComment): boolean {
  return comment.parentId !== null;
}
