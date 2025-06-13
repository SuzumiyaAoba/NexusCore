import type { TaskTimeLog } from "../../../shared/types";

/**
 * 時間記録の期間を計算します（秒単位）
 */
export function calculateDuration(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt);
  const end = new Date(endedAt);

  if (end <= start) {
    throw new Error("終了時刻は開始時刻より後でなければなりません");
  }

  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * 時間記録が有効かどうかを検証します
 */
export function isValidTimeLog(timeLog: Partial<TaskTimeLog>): boolean {
  if (!timeLog.startedAt) {
    return false;
  }

  if (timeLog.endedAt) {
    const start = new Date(timeLog.startedAt);
    const end = new Date(timeLog.endedAt);

    if (end <= start) {
      return false;
    }
  }

  return true;
}

/**
 * 時間記録が進行中かどうかを判定します
 */
export function isTimeLogActive(timeLog: TaskTimeLog): boolean {
  return timeLog.endedAt === null || timeLog.endedAt === undefined;
}

/**
 * 期間を人間が読める形式にフォーマットします
 */
export function formatDuration(durationInSeconds: number): string {
  if (durationInSeconds < 0) {
    return "0秒";
  }

  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}時間`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}分`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}秒`);
  }

  return parts.join(" ");
}

/**
 * ユーザーが他のアクティブな時間記録を持っているかチェックします
 */
export function hasActiveTimeLog(timeLogs: TaskTimeLog[], userId: number): boolean {
  return timeLogs.some((log) => log.userId === userId && isTimeLogActive(log));
}

/**
 * 時間記録の重複をチェックします
 */
export function hasOverlappingTimeLog(existingLogs: TaskTimeLog[], newStartTime: string, newEndTime?: string): boolean {
  const newStart = new Date(newStartTime);
  const newEnd = newEndTime ? new Date(newEndTime) : new Date();

  return existingLogs.some((log) => {
    if (!log.endedAt) {
      // 進行中のログがある場合、重複とみなす
      return true;
    }

    const existingStart = new Date(log.startedAt);
    const existingEnd = new Date(log.endedAt);

    // 時間範囲の重複チェック
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
}
