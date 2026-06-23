// @dreamtime/db — Drizzle ORM schema + client. Single source of truth for the
// operational schema, shared by apps/web, future AI agents, and MCP servers.
export { createDb, type Db } from "./client";
export * as schema from "./schema";
export * from "./schema";
