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
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isSuccess(result) ? success(fn(result.data)) : result;
}

/**
 * Maps a Result's error value
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isFailure(result) ? failure(fn(result.error)) : result;
}

/**
 * Chains Result operations
 */
export function flatMap<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return isSuccess(result) ? fn(result.data) : result;
}

/**
 * Unwraps a Result, throwing if it's a failure
 */
export function unwrap<T>(result: Result<T, unknown>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwraps a Result with a default value
 */
export function unwrapOr<T>(result: Result<T, unknown>, defaultValue: T): T {
  return isSuccess(result) ? result.data : defaultValue;
}
