import { buildConfig } from "payload";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { r2Storage } from "@payloadcms/storage-r2";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import path from "path";
import { fileURLToPath } from "url";
import { collections } from "./payload/collections";
import { globals } from "./payload/globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve a Cloudflare binding lazily. The config is loaded in three contexts:
// the Worker runtime, `next build`, and the Payload CLI (which transpiles to CJS
// and forbids top-level await). A Proxy defers getCloudflareContext() until the
// binding is actually used (request time), so the config loads everywhere.
function lazyBinding<T extends object>(name: "DB" | "MEDIA"): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const { env } = getCloudflareContext();
      const binding = (env as unknown as Record<string, object>)[name];
      const value = Reflect.get(binding, prop);
      return typeof value === "function" ? value.bind(binding) : value;
    },
  });
}

const cfEnv = {
  DB: lazyBinding<Parameters<typeof sqliteD1Adapter>[0]["binding"]>("DB"),
  MEDIA: lazyBinding<Parameters<typeof r2Storage>[0]["bucket"]>("MEDIA"),
};

// Require the secret at runtime, but allow `next build` (Workers Builds doesn't
// expose PAYLOAD_SECRET at build time) to proceed with a throwaway placeholder.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const payloadSecret = process.env.PAYLOAD_SECRET;
if (!payloadSecret && !isBuild) {
  throw new Error("PAYLOAD_SECRET is required");
}

export default buildConfig({
  secret: payloadSecret || "build-time-placeholder-not-used-at-runtime",
  editor: lexicalEditor(),
  // push: true auto-syncs the schema to D1 (dev + prod) so the tables are
  // created on first run without the migrate CLI (which can't load the Workers
  // config). Harden with generated migrations later.
  db: sqliteD1Adapter({ binding: cfEnv.DB, push: true }),
  collections,
  globals,
  admin: { user: "users" },
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  plugins: [
    r2Storage({
      bucket: cfEnv.MEDIA,
      collections: { media: true },
    }),
  ],
});
