/**
 * Result type for better error handling
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.success;
}

/**
 * Maps a Result's success value
 * 
 * @example
 * const result = success(5);
 * const doubled = map(result, x => x * 2); // Success { data: 10 }
 * 
 * const error = failure("error");
 * const mapped = map(error, x => x * 2); // Failure { error: "error" }
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isSuccess(result) ? success(fn(result.data)) : result;
}

/**
 * Maps a Result's error value
 * 
 * @example
 * const error = failure("original error");
 * const mapped = mapError(error, err => `Mapped: ${err}`); // Failure { error: "Mapped: original error" }
 * 
 * const success = success(5);
 * const unchanged = mapError(success, err => `Mapped: ${err}`); // Success { data: 5 }
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isFailure(result) ? failure(fn(result.error)) : result;
}

/**
 * Chains Result operations (also known as bind or >>=)
 * 
 * @example
 * const divide = (x: number, y: number): Result<number, string> => 
 *   y === 0 ? failure("Division by zero") : success(x / y);
 * 
 * const result = success(10);
 * const chained = flatMap(result, x => divide(x, 2)); // Success { data: 5 }
 * 
 * const errorResult = failure("error");
 * const chainedError = flatMap(errorResult, x => divide(x, 2)); // Failure { error: "error" }
 */
export function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return isSuccess(result) ? fn(result.data) : result;
}

/**
 * Unwraps a Result, throwing if it's a failure
 * 
 * @example
 * const result = success("hello");
 * const value = unwrap(result); // "hello"
 * 
 * const error = failure(new Error("failed"));
 * const value2 = unwrap(error); // throws Error("failed")
 */
export function unwrap<T>(result: Result<T, unknown>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwraps a Result with a default value
 * 
 * @example
 * const result = success("hello");
 * const value = unwrapOr(result, "default"); // "hello"
 * 
 * const error = failure("error");
 * const value2 = unwrapOr(error, "default"); // "default"
 */
export function unwrapOr<T>(result: Result<T, unknown>, defaultValue: T): T {
  return isSuccess(result) ? result.data : defaultValue;
}
