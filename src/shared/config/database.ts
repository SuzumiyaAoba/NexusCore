import { Database } from "bun:sqlite";
import * as path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";

// Configure database path with proper error handling
const getDatabasePath = (): string => {
  if (process.env.NODE_ENV === "test") {
    return ":memory:";
  }

  const dbPath = process.env.DATABASE_URL || "todo.db";

  // Ensure thesrc/shared/config/database.ts data directory exists
  if (!dbPath.startsWith(":memory:") && !path.isAbsolute(dbPath)) {
    return path.resolve(process.cwd(), dbPath);
  }

  return dbPath;
};

// Create database connection with error handling
let database: Database;
try {
  const dbPath = getDatabasePath();
  database = new Database(dbPath);

  // Enable foreign key constraints
  database.exec("PRAGMA foreign_keys = ON;");

  // Enable WAL mode for better concurrency
  if (process.env.NODE_ENV !== "test") {
    database.exec("PRAGMA journal_mode = WAL;");
  }
} catch (error) {
  console.error("Failed to initialize database:", error);
  throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
}

export { database };
export const db = drizzle(database);

// Graceful shutdown function
export function closeDatabase() {
  try {
    database?.close();
  } catch (error) {
    console.error("Error closing database:", error);
  }
}
