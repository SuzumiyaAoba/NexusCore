import type { TaskComment } from "../../../shared/lib/db/schemas";

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
