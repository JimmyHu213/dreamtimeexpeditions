import { buildConfig } from "payload";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { r2Storage } from "@payloadcms/storage-r2";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import path from "path";
import { fileURLToPath } from "url";
import type { CollectionConfig, GlobalConfig } from "payload";

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

const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  fields: [{ name: "name", type: "text" }],
};

const Media: CollectionConfig = {
  slug: "media",
  access: { read: () => true },
  upload: true,
  fields: [{ name: "alt", type: "text", required: true }],
};

const Vessels: CollectionConfig = {
  slug: "vessels",
  access: { read: () => true },
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "tagline", type: "text" },
    { name: "story", type: "richText" },
    {
      name: "specs",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
      ],
    },
    { name: "heroImage", type: "upload", relationTo: "media" },
  ],
};

const Voyages: CollectionConfig = {
  slug: "voyages",
  access: { read: () => true },
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "summary", type: "textarea" },
    { name: "durationNights", type: "number", required: true },
    { name: "route", type: "text" },
    { name: "priceFrom", type: "number" },
    { name: "kind", type: "select", defaultValue: "scheduled", options: ["scheduled", "charter"], required: true },
    { name: "image", type: "upload", relationTo: "media" },
  ],
};

const Testimonials: CollectionConfig = {
  slug: "testimonials",
  access: { read: () => true },
  admin: { useAsTitle: "author" },
  fields: [
    { name: "quote", type: "textarea", required: true },
    { name: "author", type: "text", required: true },
    { name: "location", type: "text" },
  ],
};

const Enquiries: CollectionConfig = {
  slug: "enquiries",
  access: { create: () => true, read: () => false, update: () => false, delete: () => false },
  admin: { useAsTitle: "email" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "message", type: "textarea", required: true },
  ],
};

const SiteContent: GlobalConfig = {
  slug: "site-content",
  access: { read: () => true },
  fields: [
    { name: "brandName", type: "text", required: true, defaultValue: "Dreamtime Expeditions" },
    { name: "heroEyebrow", type: "text" },
    { name: "heroHeadline", type: "text", required: true },
    { name: "heroSubhead", type: "textarea" },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "experienceTitle", type: "text" },
    { name: "experienceBody", type: "richText" },
    { name: "aboutTitle", type: "text" },
    { name: "aboutBody", type: "richText" },
    { name: "enquiryIntro", type: "textarea" },
  ],
};

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  editor: lexicalEditor(),
  // push: true auto-syncs the schema to D1 (dev + prod) so the tables are
  // created on first run without the migrate CLI (which can't load the Workers
  // config). Harden with generated migrations later.
  db: sqliteD1Adapter({ binding: cfEnv.DB, push: true }),
  collections: [Users, Media, Vessels, Voyages, Testimonials, Enquiries],
  globals: [SiteContent],
  admin: { user: "users" },
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  plugins: [
    r2Storage({
      bucket: cfEnv.MEDIA,
      collections: { media: true },
    }),
  ],
});
