import { type Result, ok } from "neverthrow";
import type { AppError } from "../../../shared/lib/errors/enhanced";
import type { UpdateTaskRequest } from "../../../shared/types";
import type { TaskService } from "./service";

export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: AppError[];
}

export class BulkOperationService {
  constructor(private readonly taskService: TaskService) {}

  async bulkUpdate(ids: number[], taskData: UpdateTaskRequest): Promise<Result<BulkOperationResult, AppError>> {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const result = await this.taskService.updateTask(id, taskData);
        return { id, result };
      }),
    );

    const successful = results.filter((r) => r.status === "fulfilled" && r.value.result.isOk()).length;
    const failed = results.length - successful;
    const errors: AppError[] = results
      .filter((r) => r.status === "fulfilled" && r.value.result.isErr())
      .map((r) =>
        (r as PromiseFulfilledResult<{ id: number; result: Result<any, AppError> }>).value.result._unsafeUnwrapErr(),
      );

    return ok({
      successful,
      failed,
      errors,
    });
  }

  async bulkDelete(ids: number[]): Promise<Result<BulkOperationResult, AppError>> {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const result = await this.taskService.deleteTask(id);
        return { id, result };
      }),
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.result.isOk() && r.value.result.value,
    ).length;
    const failed = results.length - successful;
    const errors: AppError[] = results
      .filter((r) => r.status === "fulfilled" && r.value.result.isErr())
      .map((r) =>
        (
          r as PromiseFulfilledResult<{ id: number; result: Result<boolean, AppError> }>
        ).value.result._unsafeUnwrapErr(),
      );

    return ok({
      successful,
      failed,
      errors,
    });
  }
}
