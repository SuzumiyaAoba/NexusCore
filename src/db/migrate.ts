import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "../shared/config/database";

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations completed!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
