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
