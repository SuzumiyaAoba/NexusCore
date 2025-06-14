import type { TaskComment } from "../../../shared/types";

/**
 * コメント内容が有効かどうかを検証します
 */
export function isValidCommentContent(content: string): boolean {
  if (!content || typeof content !== "string") {
    return false;
  }

  const trimmed = content.trim();
  return trimmed.length >= 1 && trimmed.length <= 1000;
}

/**
 * コメントが有効かどうかを検証します
 */
export function isValidComment(comment: Partial<TaskComment>): boolean {
  if (!comment.content || !isValidCommentContent(comment.content)) {
    return false;
  }

  if (!comment.taskId || comment.taskId <= 0) {
    return false;
  }

  if (!comment.userId || comment.userId <= 0) {
    return false;
  }

  return true;
}

/**
 * コメントを更新可能かどうかをチェックします
 */
export function canUpdateComment(comment: TaskComment, userId: number): boolean {
  // コメントの作成者のみ更新可能
  return comment.userId === userId;
}

/**
 * コメントを削除可能かどうかをチェックします
 */
export function canDeleteComment(comment: TaskComment, userId: number): boolean {
  // コメントの作成者のみ削除可能
  return comment.userId === userId;
}

/**
 * コメント数を制限するための検証
 */
export function canAddComment(existingCommentsCount: number): boolean {
  // 1つのタスクに対して最大1000件のコメントまで
  const MAX_COMMENTS_PER_TASK = 1000;
  return existingCommentsCount < MAX_COMMENTS_PER_TASK;
}

/**
 * コメント更新時間の差を計算します（分単位）
 */
export function getCommentAgeInMinutes(commentCreatedAt: string): number {
  const created = new Date(commentCreatedAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
}

/**
 * コメントが編集可能期間内かどうかをチェックします
 */
export function isCommentEditable(commentCreatedAt: string): boolean {
  // 作成から30分以内は編集可能
  const EDIT_TIME_LIMIT_MINUTES = 30;
  return getCommentAgeInMinutes(commentCreatedAt) <= EDIT_TIME_LIMIT_MINUTES;
}

/**
 * コメント内容をサニタイズします
 */
export function sanitizeCommentContent(content: string): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  // 基本的なサニタイゼーション - HTMLタグを除去
  return content
    .trim()
    .replace(/<[^>]*>/g, "") // HTMLタグを除去
    .replace(/\s+/g, " "); // 連続する空白を単一の空白に置換
}
