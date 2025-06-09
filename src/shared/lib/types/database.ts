import type { SQL } from "drizzle-orm";

/**
 * Database operation result types
 */
export interface DatabaseResult {
  readonly changes: number;
  readonly lastInsertRowid?: number;
}

/**
 * Query builder types for better type safety
 */
export type WhereCondition = SQL<unknown>;
export type OrderByCondition = SQL<unknown>;

/**
 * Pagination parameters with strict typing
 */
export interface PaginationParams {
  readonly limit: number;
  readonly offset: number;
}

/**
 * Paginated response with total count
 */
export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly hasMore: boolean;
}

/**
 * Creates a paginated result
 */
export function createPaginatedResult<T>(
  data: readonly T[],
  total: number,
  limit: number,
  offset: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Safe number conversion for database results
 */
export function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return num;
    }
  }
  return 0;
}

/**
 * ID type for better type safety
 */
export type ID = number & { readonly __brand: "ID" };

export function toID(value: number): ID {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ID: ${value}`);
  }
  return value as ID;
}

export function isValidID(value: unknown): value is ID {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
