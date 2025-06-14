import { type Result, err, ok } from "neverthrow";
import type { CommentRepository } from "../../../entities/task/api/comment-repository";
import type { TaskRepository } from "../../../entities/task/api/repository";
import {
  canAddComment,
  canDeleteComment,
  canUpdateComment,
  sanitizeCommentContent,
} from "../../../entities/task/model/comment-business-rules";
import {
  validateCommentId,
  validateCommentQuery,
  validateCreateComment,
  validateUpdateComment,
} from "../../../entities/task/model/comment-validation-service";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type {
  CommentQuery,
  CommentWithRelations,
  CreateCommentRequest,
  PaginatedResponse,
  TaskComment,
  UpdateCommentRequest,
} from "../../../shared/types";

export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  /**
   * コメント作成
   */
  async createComment(
    taskId: number,
    userId: number,
    data: CreateCommentRequest,
  ): Promise<Result<TaskComment, AppError>> {
    try {
      // バリデーション
      const validationResult = validateCreateComment(data);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // タスクIDの検証
      const taskIdValidation = validateCommentId(taskId);
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
        return err(ErrorFactory.validation("Cannot add comment to deleted task"));
      }

      // コメント数制限チェック
      const existingCommentsCount = await this.commentRepository.countByTaskId(taskId);
      if (!canAddComment(existingCommentsCount)) {
        return err(ErrorFactory.validation("Maximum number of comments reached for this task"));
      }

      // コメント内容をサニタイズ
      const sanitizedData = {
        ...validationResult.value,
        content: sanitizeCommentContent(validationResult.value.content),
      };

      const comment = await this.commentRepository.create(taskId, userId, sanitizedData);
      return ok(comment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to create comment", error instanceof Error ? error : undefined));
    }
  }

  /**
   * コメント更新
   */
  async updateComment(id: number, userId: number, data: UpdateCommentRequest): Promise<Result<TaskComment, AppError>> {
    try {
      // IDバリデーション
      const idValidation = validateCommentId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // データバリデーション
      const validationResult = validateUpdateComment(data);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // コメントの存在確認
      const existingComment = await this.commentRepository.findById(id);
      if (!existingComment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      // 更新権限チェック
      if (!canUpdateComment(existingComment, userId)) {
        return err(ErrorFactory.authorization("You can only update your own comments"));
      }

      // コメント内容をサニタイズ
      const sanitizedData = validationResult.value.content
        ? {
            ...validationResult.value,
            content: sanitizeCommentContent(validationResult.value.content),
          }
        : validationResult.value;

      const comment = await this.commentRepository.update(id, sanitizedData);
      if (!comment) {
        return err(ErrorFactory.database("Failed to update comment"));
      }

      return ok(comment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to update comment", error instanceof Error ? error : undefined));
    }
  }

  /**
   * コメント詳細取得
   */
  async getCommentById(id: number): Promise<Result<CommentWithRelations, AppError>> {
    try {
      const idValidation = validateCommentId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      const comment = await this.commentRepository.findByIdWithRelations(id);
      if (!comment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      return ok(comment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve comment", error instanceof Error ? error : undefined));
    }
  }

  /**
   * コメント一覧取得
   */
  async getComments(query: CommentQuery = {}): Promise<Result<PaginatedResponse<CommentWithRelations>, AppError>> {
    try {
      const validationResult = validateCommentQuery(query);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      const result = await this.commentRepository.findAll(validationResult.value);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve comments", error instanceof Error ? error : undefined));
    }
  }

  /**
   * タスクのコメント取得
   */
  async getCommentsByTaskId(taskId: number): Promise<Result<CommentWithRelations[], AppError>> {
    try {
      const idValidation = validateCommentId(taskId);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // タスクの存在確認
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return err(ErrorFactory.notFound("Task", taskId));
      }

      const comments = await this.commentRepository.findByTaskId(taskId);
      return ok(comments);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve task comments", error instanceof Error ? error : undefined));
    }
  }

  /**
   * コメント削除
   */
  async deleteComment(id: number, userId: number): Promise<Result<boolean, AppError>> {
    try {
      const idValidation = validateCommentId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // コメントの存在確認
      const existingComment = await this.commentRepository.findById(id);
      if (!existingComment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      // 削除権限チェック
      if (!canDeleteComment(existingComment, userId)) {
        return err(ErrorFactory.authorization("You can only delete your own comments"));
      }

      const result = await this.commentRepository.delete(id);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to delete comment", error instanceof Error ? error : undefined));
    }
  }
}
