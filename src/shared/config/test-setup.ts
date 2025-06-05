import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./database";

export async function setupTestDatabase() {
  if (process.env.NODE_ENV === "test") {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
  }
}
