import type { TaskAttachment } from "../../../shared/types";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "./attachment-validation-schemas";

/**
 * ファイルタイプが許可されているかどうかを検証します
 */
export function isAllowedFileType(fileType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(fileType as any);
}

/**
 * ファイルサイズが許可範囲内かどうかを検証します
 */
export function isValidFileSize(fileSize: number): boolean {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
}

/**
 * ファイル名が有効かどうかを検証します
 */
export function isValidFileName(fileName: string): boolean {
  if (!fileName || typeof fileName !== "string") {
    return false;
  }

  const trimmed = fileName.trim();

  // 基本的な検証
  if (trimmed.length === 0 || trimmed.length > 255) {
    return false;
  }

  // 危険な文字を含まないかチェック
  const dangerousChars = /[<>:"/\\|?*]/;
  if (dangerousChars.test(trimmed)) {
    return false;
  }

  // 制御文字をチェック
  for (let i = 0; i < trimmed.length; i++) {
    const charCode = trimmed.charCodeAt(i);
    if (charCode < 32) {
      return false;
    }
  }

  // 予約語チェック（Windows）
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * 添付ファイルが有効かどうかを検証します
 */
export function isValidAttachment(attachment: Partial<TaskAttachment>): boolean {
  if (!attachment.fileName || !isValidFileName(attachment.fileName)) {
    return false;
  }

  if (!attachment.fileSize || !isValidFileSize(attachment.fileSize)) {
    return false;
  }

  if (!attachment.fileType || !isAllowedFileType(attachment.fileType)) {
    return false;
  }

  if (!attachment.filePath || !attachment.filePath.trim()) {
    return false;
  }

  if (!attachment.taskId || attachment.taskId <= 0) {
    return false;
  }

  if (!attachment.uploadedBy || attachment.uploadedBy <= 0) {
    return false;
  }

  return true;
}

/**
 * 添付ファイルを削除可能かどうかをチェックします
 */
export function canDeleteAttachment(attachment: TaskAttachment, userId: number): boolean {
  // アップロード者のみ削除可能
  return attachment.uploadedBy === userId;
}

/**
 * 添付ファイル数を制限するための検証
 */
export function canAddAttachment(existingAttachmentsCount: number): boolean {
  // 1つのタスクに対して最大50件の添付ファイルまで
  const MAX_ATTACHMENTS_PER_TASK = 50;
  return existingAttachmentsCount < MAX_ATTACHMENTS_PER_TASK;
}

/**
 * 合計ファイルサイズを制限するための検証
 */
export function canAddAttachmentBySize(existingTotalSize: number, newFileSize: number): boolean {
  // 1つのタスクに対して合計100MBまで
  const MAX_TOTAL_SIZE_PER_TASK = 100 * 1024 * 1024; // 100MB
  return existingTotalSize + newFileSize <= MAX_TOTAL_SIZE_PER_TASK;
}

/**
 * ファイル拡張子を取得します
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex === -1 ? "" : fileName.substring(lastDotIndex + 1).toLowerCase();
}

/**
 * ファイルタイプに基づいてアイコンクラスを取得します
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) {
    return "image";
  }
  if (fileType === "application/pdf") {
    return "pdf";
  }
  if (fileType.includes("word") || fileType.includes("document")) {
    return "document";
  }
  if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
    return "spreadsheet";
  }
  if (fileType.startsWith("text/")) {
    return "text";
  }
  return "file";
}

/**
 * ファイルサイズを人間が読める形式にフォーマットします
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * 安全なファイル名を生成します
 */
export function generateSafeFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");

  return `${baseName}_${timestamp}_${random}${extension ? `.${extension}` : ""}`;
}
