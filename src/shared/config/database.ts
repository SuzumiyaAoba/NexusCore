import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

// Use test database in test environment
const dbPath = process.env.NODE_ENV === "test" ? ":memory:" : "todo.db";
export const database = new Database(dbPath);
export const db = drizzle(database);
