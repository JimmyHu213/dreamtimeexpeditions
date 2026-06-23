import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Create a Drizzle client over a Postgres pool.
 *
 * - In a Cloudflare Worker, pass `env.HYPERDRIVE.connectionString` (Hyperdrive
 *   pools the connection so the Worker can reach Supabase Postgres over TCP).
 * - In Node (migrations, scripts, tests), pass the direct `DATABASE_URL`.
 */
export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export type Db = ReturnType<typeof createDb>;
