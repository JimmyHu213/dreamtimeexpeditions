import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migrations run from Node (local/CI) connecting directly to Supabase Postgres.
// The Worker runtime connects through Hyperdrive instead (see src/client.ts).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
