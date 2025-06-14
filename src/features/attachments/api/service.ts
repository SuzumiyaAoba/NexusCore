import { type Result, err, ok } from "neverthrow";
import type { AttachmentRepository } from "../../../entities/task/api/attachment-repository";
import type { TaskRepository } from "../../../entities/task/api/repository";
import {
  canAddAttachment,
  canAddAttachmentBySize,
  canDeleteAttachment,
  generateSafeFileName,
  isAllowedFileType,
  isValidAttachment,
  isValidFileSize,
} from "../../../entities/task/model/attachment-business-rules";
import {
  validateAttachmentId,
  validateAttachmentQuery,
  validateCreateAttachment,
} from "../../../entities/task/model/attachment-validation-service";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type {
  AttachmentQuery,
  AttachmentWithRelations,
  CreateAttachmentRequest,
  PaginatedResponse,
  TaskAttachment,
} from "../../../shared/types";

export class AttachmentService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  /**
   * ファイル添付
   */
  async createAttachment(
    taskId: number,
    uploadedBy: number,
    data: CreateAttachmentRequest,
  ): Promise<Result<TaskAttachment, AppError>> {
    try {
      // バリデーション
      const validationResult = validateCreateAttachment(data);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // タスクIDの検証
      const taskIdValidation = validateAttachmentId(taskId);
      if (taskIdValidation.isErr()) {
        return err(taskIdValidation.error);
      }

      // タスクの存在確認
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return err(ErrorFactory.notFound("Task", taskId));
      }

      // 削除済みタスクのチェック
      if (task.deletedAt) {
        return err(ErrorFactory.validation("Cannot attach file to deleted task"));
      }

      // ファイルタイプ検証
      if (!isAllowedFileType(validationResult.value.fileType)) {
        return err(ErrorFactory.validation("File type not allowed"));
      }

      // ファイルサイズ検証
      if (!isValidFileSize(validationResult.value.fileSize)) {
        return err(ErrorFactory.validation("File size exceeds maximum allowed size"));
      }

      // 添付ファイル数制限チェック
      const existingAttachmentsCount = await this.attachmentRepository.countByTaskId(taskId);
      if (!canAddAttachment(existingAttachmentsCount)) {
        return err(ErrorFactory.validation("Maximum number of attachments reached for this task"));
      }

      // 合計ファイルサイズ制限チェック
      const existingTotalSize = await this.attachmentRepository.getTotalSizeByTaskId(taskId);
      if (!canAddAttachmentBySize(existingTotalSize, validationResult.value.fileSize)) {
        return err(ErrorFactory.validation("Total file size limit exceeded for this task"));
      }

      // 安全なファイル名を生成
      const safeFileName = generateSafeFileName(validationResult.value.fileName);
      const attachmentData = {
        ...validationResult.value,
        fileName: safeFileName,
      };

      // 添付ファイルの有効性を最終確認
      const tempAttachment = {
        ...attachmentData,
        taskId,
        uploadedBy,
      };

      if (!isValidAttachment(tempAttachment)) {
        return err(ErrorFactory.validation("Invalid attachment data"));
      }

      const attachment = await this.attachmentRepository.create(taskId, uploadedBy, attachmentData);
      return ok(attachment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to create attachment", error instanceof Error ? error : undefined));
    }
  }

  /**
   * 添付ファイル詳細取得
   */
  async getAttachmentById(id: number): Promise<Result<AttachmentWithRelations, AppError>> {
    try {
      const idValidation = validateAttachmentId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      const attachment = await this.attachmentRepository.findByIdWithRelations(id);
      if (!attachment) {
        return err(ErrorFactory.notFound("Attachment", id));
      }

      return ok(attachment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve attachment", error instanceof Error ? error : undefined));
    }
  }

  /**
   * 添付ファイル一覧取得
   */
  async getAttachments(
    query: AttachmentQuery = {},
  ): Promise<Result<PaginatedResponse<AttachmentWithRelations>, AppError>> {
    try {
      const validationResult = validateAttachmentQuery(query);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      const result = await this.attachmentRepository.findAll(validationResult.value);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve attachments", error instanceof Error ? error : undefined));
    }
  }

  /**
   * タスクの添付ファイル取得
   */
  async getAttachmentsByTaskId(taskId: number): Promise<Result<AttachmentWithRelations[], AppError>> {
    try {
      const idValidation = validateAttachmentId(taskId);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // タスクの存在確認
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return err(ErrorFactory.notFound("Task", taskId));
      }

      const attachments = await this.attachmentRepository.findByTaskId(taskId);
      return ok(attachments);
    } catch (error) {
      return err(
        ErrorFactory.database("Failed to retrieve task attachments", error instanceof Error ? error : undefined),
      );
    }
  }

  /**
   * 添付ファイル削除
   */
  async deleteAttachment(id: number, userId: number): Promise<Result<boolean, AppError>> {
    try {
      const idValidation = validateAttachmentId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // 添付ファイルの存在確認
      const existingAttachment = await this.attachmentRepository.findById(id);
      if (!existingAttachment) {
        return err(ErrorFactory.notFound("Attachment", id));
      }

      // 削除権限チェック
      if (!canDeleteAttachment(existingAttachment, userId)) {
        return err(ErrorFactory.authorization("You can only delete your own attachments"));
      }

      const result = await this.attachmentRepository.delete(id);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to delete attachment", error instanceof Error ? error : undefined));
    }
  }

  /**
   * ファイルアップロード前の検証
   */
  async validateFileUpload(
    taskId: number,
    fileName: string,
    fileSize: number,
    fileType: string,
  ): Promise<Result<{ isValid: true }, AppError>> {
    try {
      // タスクの存在確認
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return err(ErrorFactory.notFound("Task", taskId));
      }

      // 削除済みタスクのチェック
      if (task.deletedAt) {
        return err(ErrorFactory.validation("Cannot attach file to deleted task"));
      }

      // ファイルタイプ検証
      if (!isAllowedFileType(fileType)) {
        return err(ErrorFactory.validation("File type not allowed"));
      }

      // ファイルサイズ検証
      if (!isValidFileSize(fileSize)) {
        return err(ErrorFactory.validation("File size exceeds maximum allowed size"));
      }

      // 添付ファイル数制限チェック
      const existingAttachmentsCount = await this.attachmentRepository.countByTaskId(taskId);
      if (!canAddAttachment(existingAttachmentsCount)) {
        return err(ErrorFactory.validation("Maximum number of attachments reached for this task"));
      }

      // 合計ファイルサイズ制限チェック
      const existingTotalSize = await this.attachmentRepository.getTotalSizeByTaskId(taskId);
      if (!canAddAttachmentBySize(existingTotalSize, fileSize)) {
        return err(ErrorFactory.validation("Total file size limit exceeded for this task"));
      }

      return ok({ isValid: true });
    } catch (error) {
      return err(ErrorFactory.database("Failed to validate file upload", error instanceof Error ? error : undefined));
    }
  }
}
