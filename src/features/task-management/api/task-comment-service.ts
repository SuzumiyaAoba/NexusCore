import { type Result, err, ok } from "neverthrow";
import type { TaskCommentRepository } from "../../../entities/task-comment/api/repository";
import { TaskCommentDomain } from "../../../entities/task-comment/model";
import type { TaskRepository } from "../../../entities/task/api/repository";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type {
  CreateTaskCommentRequest,
  TaskComment,
  TaskCommentWithRelations,
  UpdateTaskCommentRequest,
} from "../../../shared/types";

export class TaskCommentService {
  constructor(
    private readonly commentRepository: TaskCommentRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  async createComment(commentData: CreateTaskCommentRequest, userId: number): Promise<Result<TaskComment, AppError>> {
    try {
      const validationResult = TaskCommentDomain.validateCreate(commentData);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Verify task exists
      const task = await this.taskRepository.findById(commentData.taskId);
      if (!task) {
        return err(ErrorFactory.notFound("Task", commentData.taskId));
      }

      // Verify parent comment exists if specified
      if (commentData.parentId) {
        const parentComment = await this.commentRepository.findById(commentData.parentId);
        if (!parentComment) {
          return err(ErrorFactory.notFound("Parent comment", commentData.parentId));
        }
        // Ensure parent comment belongs to the same task
        if (parentComment.taskId !== commentData.taskId) {
          return err(ErrorFactory.validation("Parent comment must belong to the same task"));
        }
      }

      const comment = await this.commentRepository.create({
        ...validationResult.value,
        userId,
      });

      return ok(comment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to create comment", error instanceof Error ? error : undefined));
    }
  }

  async getCommentById(id: number): Promise<Result<TaskCommentWithRelations, AppError>> {
    try {
      const comment = await this.commentRepository.findByIdWithRelations(id);
      if (!comment) {
        return err(ErrorFactory.notFound("Comment", id));
      }
      return ok(comment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to get comment", error instanceof Error ? error : undefined));
    }
  }

  async getCommentsByTaskId(taskId: number): Promise<Result<TaskCommentWithRelations[], AppError>> {
    try {
      // Verify task exists
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return err(ErrorFactory.notFound("Task", taskId));
      }

      const comments = await this.commentRepository.findByTaskId(taskId);

      // Build threaded structure
      const threadedComments = this.buildThreadedComments(comments);

      return ok(threadedComments);
    } catch (error) {
      return err(ErrorFactory.database("Failed to get comments", error instanceof Error ? error : undefined));
    }
  }

  async updateComment(
    id: number,
    updateData: UpdateTaskCommentRequest,
    userId: number,
  ): Promise<Result<TaskComment, AppError>> {
    try {
      const validationResult = TaskCommentDomain.validateUpdate(updateData);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      const existingComment = await this.commentRepository.findById(id);
      if (!existingComment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      // Check authorization
      if (!TaskCommentDomain.canEditComment(existingComment, userId)) {
        return err(ErrorFactory.authorization("You can only edit your own comments"));
      }

      const updatedComment = await this.commentRepository.update(id, validationResult.value);
      if (!updatedComment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      return ok(updatedComment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to update comment", error instanceof Error ? error : undefined));
    }
  }

  async deleteComment(id: number, userId: number): Promise<Result<void, AppError>> {
    try {
      const existingComment = await this.commentRepository.findById(id);
      if (!existingComment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      // Check authorization
      if (!TaskCommentDomain.canDeleteComment(existingComment, userId)) {
        return err(ErrorFactory.authorization("You can only delete your own comments"));
      }

      const deleted = await this.commentRepository.softDelete(id);
      if (!deleted) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      return ok(undefined);
    } catch (error) {
      return err(ErrorFactory.database("Failed to delete comment", error instanceof Error ? error : undefined));
    }
  }

  async restoreComment(id: number, userId: number): Promise<Result<TaskComment, AppError>> {
    try {
      const existingComment = await this.commentRepository.findById(id);
      if (!existingComment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      // Check authorization
      if (!TaskCommentDomain.canEditComment(existingComment, userId)) {
        return err(ErrorFactory.authorization("You can only restore your own comments"));
      }

      // Check if comment is actually deleted
      if (!TaskCommentDomain.isCommentDeleted(existingComment)) {
        return err(ErrorFactory.validation("Comment is not deleted and cannot be restored"));
      }

      const restored = await this.commentRepository.restore(id);
      if (!restored) {
        return err(ErrorFactory.validation("Comment could not be restored"));
      }

      const restoredComment = await this.commentRepository.findById(id);
      if (!restoredComment) {
        return err(ErrorFactory.notFound("Comment", id));
      }

      return ok(restoredComment);
    } catch (error) {
      return err(ErrorFactory.database("Failed to restore comment", error instanceof Error ? error : undefined));
    }
  }

  async getCommentCount(taskId: number): Promise<Result<number, AppError>> {
    try {
      const count = await this.commentRepository.countByTaskId(taskId);
      return ok(count);
    } catch (error) {
      return err(ErrorFactory.database("Failed to get comment count", error instanceof Error ? error : undefined));
    }
  }

  private buildThreadedComments(comments: TaskCommentWithRelations[]): TaskCommentWithRelations[] {
    const commentMap = new Map<number, TaskCommentWithRelations>();
    const rootComments: TaskCommentWithRelations[] = [];

    // Initialize all comments with empty replies array
    for (const comment of comments) {
      commentMap.set(comment.id, { ...comment, replies: [] });
    }

    // Build the threaded structure
    for (const comment of comments) {
      const commentWithReplies = commentMap.get(comment.id);
      if (!commentWithReplies) continue;

      if (comment.parentId === null) {
        // Root comment
        rootComments.push(commentWithReplies);
      } else {
        // Reply to another comment
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      }
    }

    // Add reply counts
    for (const comment of commentMap.values()) {
      comment.replyCount = comment.replies?.length || 0;
    }

    return rootComments;
  }
}
