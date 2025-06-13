import { type Result, ok } from "neverthrow";
import { type AppError, ErrorFactory } from "../../../shared/lib/errors/enhanced";
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

    const errors: AppError[] = [];

    // Collect errors from fulfilled but failed operations
    for (const r of results.filter((r) => r.status === "fulfilled" && r.value.result.isErr())) {
      const fulfilledResult = r as PromiseFulfilledResult<{ id: number; result: Result<any, AppError> }>;
      if (fulfilledResult.value.result.isErr()) {
        errors.push(fulfilledResult.value.result.error);
      }
    }

    // Collect errors from rejected promises
    for (const r of results.filter((r) => r.status === "rejected")) {
      const rejectedResult = r as PromiseRejectedResult;
      errors.push(
        ErrorFactory.database(
          "Operation failed",
          rejectedResult.reason instanceof Error ? rejectedResult.reason : new Error(String(rejectedResult.reason)),
        ),
      );
    }

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

    const errors: AppError[] = [];

    // Collect errors from fulfilled but failed operations
    for (const r of results.filter((r) => r.status === "fulfilled" && r.value.result.isErr())) {
      const fulfilledResult = r as PromiseFulfilledResult<{ id: number; result: Result<boolean, AppError> }>;
      if (fulfilledResult.value.result.isErr()) {
        errors.push(fulfilledResult.value.result.error);
      }
    }

    // Collect errors from rejected promises
    for (const r of results.filter((r) => r.status === "rejected")) {
      const rejectedResult = r as PromiseRejectedResult;
      errors.push(
        ErrorFactory.database(
          "Operation failed",
          rejectedResult.reason instanceof Error ? rejectedResult.reason : new Error(String(rejectedResult.reason)),
        ),
      );
    }

    return ok({
      successful,
      failed,
      errors,
    });
  }
}
