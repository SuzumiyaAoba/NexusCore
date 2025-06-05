import type { Config } from "drizzle-kit";

export default {
  schema: "./src/shared/lib/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
} satisfies Config;
