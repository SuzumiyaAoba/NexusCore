import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

// Create a test database configuration
export function createTestDatabase() {
  const database = new Database(":memory:");
  return drizzle(database);
}

export function closeTestDatabase(db: Database) {
  db.close();
}
