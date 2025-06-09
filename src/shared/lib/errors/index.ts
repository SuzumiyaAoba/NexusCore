// Re-export enhanced error classes for backward compatibility
export {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
  DuplicateError,
  AuthenticationError,
  AuthorizationError,
  ErrorFactory,
  isAppError,
} from "./enhanced";
