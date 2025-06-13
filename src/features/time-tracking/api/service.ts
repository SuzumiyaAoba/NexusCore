import { type Result, err, ok } from "neverthrow";
import type { TaskRepository } from "../../../entities/task/api/repository";
import type { TimeLogRepository } from "../../../entities/task/api/time-log-repository";
import { hasActiveTimeLog, isValidTimeLog } from "../../../entities/task/model/time-log-business-rules";
import {
  validateCreateTimeLog,
  validateTimeLogId,
  validateTimeLogQuery,
  validateUpdateTimeLog,
} from "../../../entities/task/model/time-log-validation-service";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
import type {
  CreateTimeLogRequest,
  PaginatedResponse,
  TaskTimeLog,
  TimeLogQuery,
  TimeLogWithRelations,
  UpdateTimeLogRequest,
} from "../../../shared/types";

export class TimeTrackingService {
  constructor(
    private readonly timeLogRepository: TimeLogRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  /**
   * 作業開始
   */
  async startTimeLog(
    taskId: number,
    userId: number,
    data: CreateTimeLogRequest,
  ): Promise<Result<TaskTimeLog, AppError>> {
    try {
      // バリデーション
      const validationResult = validateCreateTimeLog(data);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // タスクIDの検証
      const taskIdValidation = validateTimeLogId(taskId);
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
        return err(ErrorFactory.validation("Cannot start time log for deleted task"));
      }

      // ユーザーが既にアクティブな時間記録を持っているかチェック
      const activeTimeLogs = await this.timeLogRepository.findActiveByUserId(userId);
      if (hasActiveTimeLog(activeTimeLogs, userId)) {
        return err(ErrorFactory.validation("User already has an active time log"));
      }

      const timeLog = await this.timeLogRepository.startTimeLog(taskId, userId, validationResult.value);
      return ok(timeLog);
    } catch (error) {
      return err(ErrorFactory.database("Failed to start time log", error instanceof Error ? error : undefined));
    }
  }

  /**
   * 作業終了
   */
  async endTimeLog(id: number, data: UpdateTimeLogRequest = {}): Promise<Result<TaskTimeLog, AppError>> {
    try {
      // IDバリデーション
      const idValidation = validateTimeLogId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // データバリデーション
      const validationResult = validateUpdateTimeLog(data);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // 時間記録の存在確認
      const existingTimeLog = await this.timeLogRepository.findById(id);
      if (!existingTimeLog) {
        return err(ErrorFactory.notFound("Time log", id));
      }

      // 既に終了しているかチェック
      if (existingTimeLog.endedAt) {
        return err(ErrorFactory.validation("Time log is already ended"));
      }

      const timeLog = await this.timeLogRepository.endTimeLog(id, validationResult.value);
      if (!timeLog) {
        return err(ErrorFactory.database("Failed to end time log"));
      }

      return ok(timeLog);
    } catch (error) {
      return err(ErrorFactory.database("Failed to end time log", error instanceof Error ? error : undefined));
    }
  }

  /**
   * 時間記録の更新
   */
  async updateTimeLog(id: number, data: UpdateTimeLogRequest): Promise<Result<TaskTimeLog, AppError>> {
    try {
      // IDバリデーション
      const idValidation = validateTimeLogId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // データバリデーション
      const validationResult = validateUpdateTimeLog(data);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // 時間記録の存在確認
      const existingTimeLog = await this.timeLogRepository.findById(id);
      if (!existingTimeLog) {
        return err(ErrorFactory.notFound("Time log", id));
      }

      // 更新後のデータでバリデーション
      const updatedData = {
        ...existingTimeLog,
        ...validationResult.value,
      };

      if (!isValidTimeLog(updatedData)) {
        return err(ErrorFactory.validation("Invalid time log data"));
      }

      const timeLog = await this.timeLogRepository.update(id, validationResult.value);
      if (!timeLog) {
        return err(ErrorFactory.database("Failed to update time log"));
      }

      return ok(timeLog);
    } catch (error) {
      return err(ErrorFactory.database("Failed to update time log", error instanceof Error ? error : undefined));
    }
  }

  /**
   * 時間記録詳細取得
   */
  async getTimeLogById(id: number): Promise<Result<TimeLogWithRelations, AppError>> {
    try {
      const idValidation = validateTimeLogId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      const timeLog = await this.timeLogRepository.findByIdWithRelations(id);
      if (!timeLog) {
        return err(ErrorFactory.notFound("Time log", id));
      }

      return ok(timeLog);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve time log", error instanceof Error ? error : undefined));
    }
  }

  /**
   * 時間記録一覧取得
   */
  async getTimeLogs(query: TimeLogQuery = {}): Promise<Result<PaginatedResponse<TimeLogWithRelations>, AppError>> {
    try {
      const validationResult = validateTimeLogQuery(query);
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      const result = await this.timeLogRepository.findAll(validationResult.value);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to retrieve time logs", error instanceof Error ? error : undefined));
    }
  }

  /**
   * タスクの時間記録取得
   */
  async getTimeLogsByTaskId(taskId: number): Promise<Result<TimeLogWithRelations[], AppError>> {
    try {
      const idValidation = validateTimeLogId(taskId);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // タスクの存在確認
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return err(ErrorFactory.notFound("Task", taskId));
      }

      const timeLogs = await this.timeLogRepository.findByTaskId(taskId);
      return ok(timeLogs);
    } catch (error) {
      return err(
        ErrorFactory.database("Failed to retrieve task time logs", error instanceof Error ? error : undefined),
      );
    }
  }

  /**
   * ユーザーのアクティブな時間記録取得
   */
  async getActiveTimeLogsByUserId(userId: number): Promise<Result<TimeLogWithRelations[], AppError>> {
    try {
      const idValidation = validateTimeLogId(userId);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      const timeLogs = await this.timeLogRepository.findActiveByUserId(userId);
      return ok(timeLogs);
    } catch (error) {
      return err(
        ErrorFactory.database("Failed to retrieve active time logs", error instanceof Error ? error : undefined),
      );
    }
  }

  /**
   * 時間記録削除
   */
  async deleteTimeLog(id: number): Promise<Result<boolean, AppError>> {
    try {
      const idValidation = validateTimeLogId(id);
      if (idValidation.isErr()) {
        return err(idValidation.error);
      }

      // 時間記録の存在確認
      const existingTimeLog = await this.timeLogRepository.findById(id);
      if (!existingTimeLog) {
        return err(ErrorFactory.notFound("Time log", id));
      }

      const result = await this.timeLogRepository.delete(id);
      return ok(result);
    } catch (error) {
      return err(ErrorFactory.database("Failed to delete time log", error instanceof Error ? error : undefined));
    }
  }
}
