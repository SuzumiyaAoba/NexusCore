import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import path from "path";
import { db } from "./database";

// Singleton to ensure test database is only set up once
let isTestDatabaseSetup = false;
const setupMutex = { locked: false };

export async function setupTestDatabase() {
  if (process.env.NODE_ENV !== "test" || isTestDatabaseSetup) {
    return;
  }
  
  // Simple mutex to prevent concurrent setup
  if (setupMutex.locked) {
    while (setupMutex.locked) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return;
  }
  
  try {
    setupMutex.locked = true;
    
    const migrationsPath = path.join(process.cwd(), "src/db/migrations");
    await migrate(db, { migrationsFolder: migrationsPath });
    
    isTestDatabaseSetup = true;
  } catch (error) {
    console.error("Failed to setup test database:", error);
    throw error;
  } finally {
    setupMutex.locked = false;
  }
}

export function resetTestDatabase() {
  isTestDatabaseSetup = false;
}
