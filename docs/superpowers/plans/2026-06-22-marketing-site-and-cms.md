# Marketing Site + CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a cinematic, CMS-driven marketing site for Dreamtime Expeditions, live on Cloudflare Workers, with content editable in Payload CMS backed by Supabase Postgres.

**Architecture:** The existing `apps/web` Next.js app (OpenNext on Cloudflare Workers) gains Payload CMS mounted at `/admin` and an API layer, with content stored in Supabase Postgres reached from the Worker via a Cloudflare Hyperdrive binding (Workers cannot open raw TCP to Postgres directly). Marketing pages are React Server Components that read typed content from Payload's local API. A shared design system lives in `packages/ui`. Enquiries from the contact section are written to a Payload `enquiries` collection.

**Tech Stack:** Next.js 15 (App Router) · @opennextjs/cloudflare · Payload CMS v3 (`@payloadcms/db-postgres`) · Supabase Postgres · Cloudflare Hyperdrive · Tailwind CSS v4 · Vitest + @testing-library/react · pnpm/Turborepo monorepo.

## Global Constraints

- Package manager: **pnpm** workspaces; all installs via `pnpm --filter @dreamtime/web add ...` (or the relevant package). Node `>=20`.
- Worker name is `dreamtimeexpeditions`; `wrangler.jsonc` lives in `apps/web`. `compatibility_flags` must keep `nodejs_compat`.
- Conventional Commits enforced by commitlint (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `test:`, `refactor:`). Every commit message in this plan already complies.
- Secrets (Postgres URL, Payload secret, Hyperdrive) go in `apps/web/.dev.vars` locally (gitignored) and Cloudflare/Workers Builds env for prod. Never commit secrets. A `.dev.vars.example` documents required keys.
- Do NOT build accounting/payment logic in this plan (that is the booking plan). This plan is content + marketing only.
- Design language: cinematic, editorial, restrained luxury — deliberately NOT generic AI aesthetic. Dark, photography-forward, generous whitespace, serif display + clean sans body.
- All content that an editor would plausibly change (copy, images, voyages, testimonials) MUST come from Payload, never hardcoded in components.

---

### Task 1: Provision Supabase project and capture connection details

**Files:**
- Create: `apps/web/.dev.vars.example`
- Create: `docs/superpowers/notes/infra-credentials.md` (gitignored note of where secrets live — NOT the secrets themselves)
- Modify: `.gitignore` (ensure `.dev.vars` and the notes file are ignored)

**Interfaces:**
- Produces: a Supabase Postgres connection string (pooler, port 6543, `sslmode=require`) referenced as `DATABASE_URL`; a Supabase project ref; `PAYLOAD_SECRET` (random 32+ char string). Later tasks consume these via `apps/web/.dev.vars`.

- [ ] **Step 1: Create the Supabase project**

Use the Supabase MCP if connected, otherwise the dashboard (https://supabase.com/dashboard). Create a project named `dreamtime-expeditions`, region `Southeast Asia (Singapore)` or `Sydney` if available (closest to AU customers). Record the project ref.

- [ ] **Step 2: Get the pooler connection string**

In Supabase: Project Settings → Database → Connection string → "Transaction pooler" (port 6543). It looks like:
`postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`

- [ ] **Step 3: Write `.dev.vars.example`**

```bash
# apps/web/.dev.vars.example — copy to .dev.vars and fill in (do NOT commit .dev.vars)
# Supabase Postgres (transaction pooler, port 6543)
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require"
# Payload encryption secret (generate: openssl rand -base64 32)
PAYLOAD_SECRET="replace-with-random-32-char-string"
```

- [ ] **Step 4: Create local `.dev.vars` with real values**

```bash
cd apps/web
cp .dev.vars.example .dev.vars
# Edit .dev.vars: paste the real DATABASE_URL and a generated PAYLOAD_SECRET
openssl rand -base64 32   # paste output as PAYLOAD_SECRET
```

- [ ] **Step 5: Verify `.dev.vars` is gitignored**

Run: `cd /Users/jimmy/Documents/Projects/dreamtimeexpeditions && git check-ignore apps/web/.dev.vars`
Expected: prints `apps/web/.dev.vars` (confirms ignored). The root `.gitignore` already has `.dev.vars`.

- [ ] **Step 6: Commit the example + note (no secrets)**

```bash
git add apps/web/.dev.vars.example .gitignore
git commit -m "chore: document Supabase/Payload env vars via .dev.vars.example"
```

---

### Task 2: Validate Payload-on-Workers DB connectivity (spike) and create Hyperdrive binding

This is the highest-risk task. Workers cannot open raw TCP to Postgres; we validate the path before building on it. Deliverable: a proven DB connection from a Worker preview, plus a Hyperdrive binding for production.

**Files:**
- Modify: `apps/web/wrangler.jsonc` (add `hyperdrive` binding + `compatibility_flags`)
- Create: `apps/web/src/app/api/db-health/route.ts` (temporary health check, removed in Step 8)

**Interfaces:**
- Produces: a working Postgres connection from the Worker runtime; a Hyperdrive binding id available as `env.HYPERDRIVE.connectionString` in production.

- [ ] **Step 1: Confirm `nodejs_compat` and add `compatibility_date`**

Read `apps/web/wrangler.jsonc`. Ensure it contains:
```jsonc
"compatibility_date": "2026-06-22",
"compatibility_flags": ["nodejs_compat"],
```
(Already present from scaffold — verify, don't duplicate.)

- [ ] **Step 2: Create a Hyperdrive config pointing at Supabase**

Run (uses the `DATABASE_URL` from `.dev.vars`):
```bash
cd apps/web
npx wrangler hyperdrive create dreamtime-supabase \
  --connection-string="$(grep '^DATABASE_URL=' .dev.vars | cut -d'"' -f2)"
```
Expected: prints a Hyperdrive `id` (UUID). Record it.

- [ ] **Step 3: Add the Hyperdrive binding to `wrangler.jsonc`**

```jsonc
// add inside the top-level config object
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "<hyperdrive-id-from-step-2>",
    "localConnectionString": "postgresql://...from .dev.vars..."
  }
]
```
(`localConnectionString` lets `wrangler dev`/preview connect directly; prod uses the pooled Hyperdrive path.)

- [ ] **Step 4: Write a temporary DB health route**

```typescript
// apps/web/src/app/api/db-health/route.ts
import { Client } from "pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = getCloudflareContext();
  // In prod env.HYPERDRIVE.connectionString; locally falls back to localConnectionString
  const connectionString = (env as { HYPERDRIVE?: { connectionString: string } })
    .HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL!;
  const client = new Client({ connectionString });
  await client.connect();
  const { rows } = await client.query("select 1 as ok");
  await client.end();
  return Response.json({ ok: rows[0]?.ok === 1 });
}
```

- [ ] **Step 5: Install `pg`**

Run: `pnpm --filter @dreamtime/web add pg && pnpm --filter @dreamtime/web add -D @types/pg`
Expected: added to `apps/web/package.json` dependencies.

- [ ] **Step 6: Run the Workers preview and hit the route**

Run: `cd apps/web && pnpm run preview` (builds with OpenNext, serves on workerd via wrangler)
In another shell: `curl -s http://localhost:8771/api/db-health` (use the port wrangler prints)
Expected: `{"ok":true}`

- [ ] **Step 7: Decision gate**

If Step 6 returns `{"ok":true}` → the Workers→Hyperdrive→Supabase path works; proceed. If it fails with a TCP/socket error that cannot be resolved, STOP and escalate: fallback is to host the Next/Payload app on a Node target (still Cloudflare-fronted) — record the failure in `docs/superpowers/notes/infra-credentials.md` and do not proceed with Payload-on-Workers.

- [ ] **Step 8: Remove the temporary route and commit**

```bash
rm apps/web/src/app/api/db-health/route.ts
git add apps/web/wrangler.jsonc apps/web/package.json apps/web/pnpm-lock.yaml ../../pnpm-lock.yaml
git commit -m "feat: add Hyperdrive binding for Supabase Postgres from Workers"
```

---

### Task 3: Set up Vitest in apps/web

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Modify: `apps/web/package.json` (scripts + devDeps)

**Interfaces:**
- Produces: `pnpm --filter @dreamtime/web test` runs Vitest with jsdom + @testing-library; later tasks rely on this command.

- [ ] **Step 1: Install test deps**

Run:
```bash
pnpm --filter @dreamtime/web add -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Write `vitest.config.ts`**

```typescript
// apps/web/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

- [ ] **Step 3: Write the test setup**

```typescript
// apps/web/src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add the test script**

Run: `cd apps/web && npm pkg set scripts.test="vitest run" scripts.test:watch="vitest"`

- [ ] **Step 5: Add a smoke test and run it**

```typescript
// apps/web/src/test/smoke.test.ts
import { describe, it, expect } from "vitest";
describe("vitest", () => {
  it("runs", () => expect(1 + 1).toBe(2));
});
```
Run: `pnpm --filter @dreamtime/web test`
Expected: 1 passed.

- [ ] **Step 6: Wire turbo + commit**

Add `"test": {}` to `turbo.json` `tasks`. Then:
```bash
git add apps/web/vitest.config.ts apps/web/src/test apps/web/package.json turbo.json apps/web/pnpm-lock.yaml ../../pnpm-lock.yaml
git commit -m "test: set up vitest + testing-library in apps/web"
```

---

### Task 4: Install and configure Payload CMS against Supabase Postgres

**Files:**
- Create: `apps/web/src/payload.config.ts`
- Create: `apps/web/src/payload/db.ts` (Hyperdrive-aware pool factory)
- Create: `apps/web/src/app/(payload)/admin/[[...segments]]/page.tsx` (Payload admin route — generated)
- Modify: `apps/web/package.json`, `apps/web/next.config.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` / `env.HYPERDRIVE` (Task 2), `PAYLOAD_SECRET` (Task 1).
- Produces: `getPayload()` accessor (from `@payloadcms/next`/`payload`) usable in RSCs; `/admin` UI; a typed `payload-types.ts` generated file.

- [ ] **Step 1: Install Payload v3 + postgres adapter + richtext**

Run:
```bash
pnpm --filter @dreamtime/web add payload @payloadcms/next @payloadcms/db-postgres \
  @payloadcms/richtext-lexical @payloadcms/ui graphql
```

- [ ] **Step 2: Write the Hyperdrive-aware pool factory**

```typescript
// apps/web/src/payload/db.ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Returns the Postgres connection string, preferring Hyperdrive in the Worker. */
export function getConnectionString(): string {
  try {
    const { env } = getCloudflareContext();
    const hd = (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE;
    if (hd?.connectionString) return hd.connectionString;
  } catch {
    // not in a Workers context (e.g. build / tests)
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return process.env.DATABASE_URL;
}
```

- [ ] **Step 3: Write `payload.config.ts` (collections added in Task 5)**

```typescript
// apps/web/src/payload.config.ts
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { fileURLToPath } from "url";
import { getConnectionString } from "./payload/db";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || "",
  editor: lexicalEditor(),
  db: postgresAdapter({ pool: { connectionString: getConnectionString() } }),
  collections: [], // populated in Task 5
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  admin: { user: "users" },
});
```

- [ ] **Step 4: Wrap Next config with Payload**

```typescript
// apps/web/next.config.ts
import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {};

export default withPayload(nextConfig);
```
(Preserve any existing OpenNext dev init already in the file — merge, don't drop it.)

- [ ] **Step 5: Generate the admin route + import map**

Run:
```bash
cd apps/web
npx payload generate:importmap
```
Then create the admin route files exactly as Payload's docs specify for App Router (the `(payload)` route group). Verify `src/app/(payload)/admin/[[...segments]]/page.tsx` exists.

- [ ] **Step 6: Generate types and run the dev server**

Run:
```bash
cd apps/web
npx payload generate:types
pnpm run dev
```
Visit `http://localhost:3000/admin`. Expected: Payload prompts to create the first admin user (the `users` collection auto-exists). Create one. Confirm the dashboard loads.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/payload.config.ts apps/web/src/payload apps/web/src/app/\(payload\) \
  apps/web/next.config.ts apps/web/src/payload-types.ts apps/web/package.json \
  apps/web/pnpm-lock.yaml ../../pnpm-lock.yaml apps/web/importMap.js 2>/dev/null
git commit -m "feat: mount Payload CMS on Supabase Postgres via Hyperdrive"
```

---

### Task 5: Define Payload collections and globals for marketing content

**Files:**
- Create: `apps/web/src/payload/collections/Media.ts`
- Create: `apps/web/src/payload/collections/Vessels.ts`
- Create: `apps/web/src/payload/collections/Voyages.ts`
- Create: `apps/web/src/payload/collections/Testimonials.ts`
- Create: `apps/web/src/payload/collections/Enquiries.ts`
- Create: `apps/web/src/payload/globals/SiteContent.ts`
- Modify: `apps/web/src/payload.config.ts` (register them)

**Interfaces:**
- Produces typed collections (consumed by Tasks 6–12 via `payload-types.ts`):
  - `Media`: `{ id, url, alt, width, height }`
  - `Vessel`: `{ id, name, tagline, story (richText), specs: {label,value}[], heroImage: Media, gallery: Media[] }`
  - `Voyage`: `{ id, title, slug, summary, durationNights: number, route: string, heroImage: Media, startDate?: string, priceFrom?: number, status: 'scheduled'|'charter'|'draft' }`
  - `Testimonial`: `{ id, quote, author, location, rating?: number }`
  - `Enquiry`: `{ id, name, email, phone?, voyage?: Voyage, message, createdAt }`
  - `SiteContent` global: `{ brandName, heroHeadline, heroSubhead, heroImage: Media, experienceTitle, experienceBody (richText), enquiryIntro }`

- [ ] **Step 1: Write `Media.ts`**

```typescript
// apps/web/src/payload/collections/Media.ts
import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: { read: () => true },
  upload: {
    // Binary storage is handled by the R2 storage adapter (Task 5A); Postgres stores metadata only.
    mimeTypes: ["image/*"],
  },
  fields: [
    { name: "alt", type: "text", required: true },
  ],
};
```

Media binaries are stored in Cloudflare R2 (configured in Task 5A) — Workers have no writable local filesystem, so the default disk storage cannot be used.

- [ ] **Step 2: Write `Vessels.ts`**

```typescript
// apps/web/src/payload/collections/Vessels.ts
import type { CollectionConfig } from "payload";

export const Vessels: CollectionConfig = {
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
    { name: "gallery", type: "upload", relationTo: "media", hasMany: true },
  ],
};
```

- [ ] **Step 3: Write `Voyages.ts`**

```typescript
// apps/web/src/payload/collections/Voyages.ts
import type { CollectionConfig } from "payload";

export const Voyages: CollectionConfig = {
  slug: "voyages",
  access: { read: () => true },
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "summary", type: "textarea" },
    { name: "durationNights", type: "number", required: true },
    { name: "route", type: "text" },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "startDate", type: "date" },
    { name: "priceFrom", type: "number" },
    {
      name: "status",
      type: "select",
      defaultValue: "scheduled",
      options: ["scheduled", "charter", "draft"],
      required: true,
    },
  ],
};
```

- [ ] **Step 4: Write `Testimonials.ts`**

```typescript
// apps/web/src/payload/collections/Testimonials.ts
import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  access: { read: () => true },
  admin: { useAsTitle: "author" },
  fields: [
    { name: "quote", type: "textarea", required: true },
    { name: "author", type: "text", required: true },
    { name: "location", type: "text" },
    { name: "rating", type: "number", min: 1, max: 5 },
  ],
};
```

- [ ] **Step 5: Write `Enquiries.ts`**

```typescript
// apps/web/src/payload/collections/Enquiries.ts
import type { CollectionConfig } from "payload";

export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  access: { create: () => true, read: () => false, update: () => false, delete: () => false },
  admin: { useAsTitle: "email" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "voyage", type: "relationship", relationTo: "voyages" },
    { name: "message", type: "textarea", required: true },
  ],
};
```

- [ ] **Step 6: Write the `SiteContent` global**

```typescript
// apps/web/src/payload/globals/SiteContent.ts
import type { GlobalConfig } from "payload";

export const SiteContent: GlobalConfig = {
  slug: "site-content",
  access: { read: () => true },
  fields: [
    { name: "brandName", type: "text", required: true, defaultValue: "Dreamtime Expeditions" },
    { name: "heroHeadline", type: "text", required: true },
    { name: "heroSubhead", type: "textarea" },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "experienceTitle", type: "text" },
    { name: "experienceBody", type: "richText" },
    { name: "enquiryIntro", type: "textarea" },
  ],
};
```

- [ ] **Step 7: Register collections + global in `payload.config.ts`**

Replace `collections: []` and add `globals`:
```typescript
import { Media } from "./payload/collections/Media";
import { Vessels } from "./payload/collections/Vessels";
import { Voyages } from "./payload/collections/Voyages";
import { Testimonials } from "./payload/collections/Testimonials";
import { Enquiries } from "./payload/collections/Enquiries";
import { SiteContent } from "./payload/globals/SiteContent";
// ...
  collections: [Media, Vessels, Voyages, Testimonials, Enquiries],
  globals: [SiteContent],
```

- [ ] **Step 8: Run migrations/types and verify in admin**

Run:
```bash
cd apps/web
npx payload generate:types
pnpm run dev
```
Visit `/admin` — confirm Vessels, Voyages, Testimonials, Media, Enquiries collections and the Site Content global all appear and accept a test entry.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/payload apps/web/src/payload.config.ts apps/web/src/payload-types.ts
git commit -m "feat: add Payload collections for vessels, voyages, testimonials, enquiries"
```

---

### Task 5A: Configure Cloudflare R2 storage for Payload media

Workers have no writable filesystem, so Payload media uploads must go to object storage. We use Cloudflare R2 via the official storage adapter.

**Files:**
- Modify: `apps/web/wrangler.jsonc` (add R2 bucket binding)
- Modify: `apps/web/src/payload.config.ts` (register the R2 storage plugin)
- Modify: `apps/web/.dev.vars.example` and `.dev.vars` (R2 credentials for local/build use)

**Interfaces:**
- Produces: working image uploads in `/admin` whose `url` resolves publicly; consumed by every section that renders `Media.url`.

- [ ] **Step 1: Create an R2 bucket**

Run:
```bash
cd apps/web
npx wrangler r2 bucket create dreamtime-media
```
Expected: bucket `dreamtime-media` created.

- [ ] **Step 2: Add the R2 binding to `wrangler.jsonc`**

```jsonc
"r2_buckets": [
  { "binding": "MEDIA_BUCKET", "bucket_name": "dreamtime-media" }
]
```

- [ ] **Step 3: Install the R2 storage adapter**

Run: `pnpm --filter @dreamtime/web add @payloadcms/storage-r2`

- [ ] **Step 4: Register the plugin in `payload.config.ts`**

```typescript
import { r2Storage } from "@payloadcms/storage-r2";
import { getCloudflareContext } from "@opennextjs/cloudflare";
// ...inside buildConfig({ ... }):
  plugins: [
    r2Storage({
      collections: { media: true },
      bucket: () => getCloudflareContext().env.MEDIA_BUCKET as R2Bucket,
    }),
  ],
```
(If the adapter's API expects an S3-style endpoint instead of a binding in your installed version, use the documented R2 S3 credentials from `.dev.vars` — record which path was used in `docs/superpowers/notes/infra-credentials.md`.)

- [ ] **Step 5: Upload a test image in /admin**

Run `pnpm run dev`, go to `/admin` → Media → upload an image, set `alt`. Confirm the image renders from its `url` (open the URL in a browser).

- [ ] **Step 6: Commit**

```bash
git add apps/web/wrangler.jsonc apps/web/src/payload.config.ts apps/web/.dev.vars.example apps/web/package.json pnpm-lock.yaml
git commit -m "feat: store Payload media in Cloudflare R2"
```

---

### Task 6: Build the design-system foundation in packages/ui

**Files:**
- Create: `packages/ui/src/styles/tokens.css` (CSS variables: colors, fonts, spacing)
- Create: `packages/ui/src/components/Section.tsx`
- Create: `packages/ui/src/components/Button.tsx`
- Create: `packages/ui/src/components/Section.test.tsx`
- Modify: `packages/ui/src/index.ts`, `packages/ui/package.json` (peerdeps react), `apps/web/src/app/globals.css` (import tokens + fonts)

**Interfaces:**
- Produces: `<Section as?, className?, children>` (max-width container with vertical rhythm); `<Button href?, variant: 'solid'|'ghost', children>`; CSS custom properties `--color-ink`, `--color-sand`, `--color-sea`, `--font-display`, `--font-body`. Consumed by all section tasks.

- [ ] **Step 1: Add React as a peer dep of packages/ui**

Run: `pnpm --filter @dreamtime/ui add -D react react-dom @types/react typescript`
Then set peerDependencies in `packages/ui/package.json`:
```json
"peerDependencies": { "react": ">=19", "react-dom": ">=19" }
```

- [ ] **Step 2: Write design tokens**

```css
/* packages/ui/src/styles/tokens.css */
:root {
  --color-ink: #0d0f12;        /* near-black */
  --color-sand: #cdb79e;       /* warm pearl/sand accent */
  --color-sea: #1b3a4b;        /* deep teal */
  --color-mist: #f4f1ec;       /* off-white */
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body: var(--font-geist-sans, system-ui, sans-serif);
  --space-section: clamp(4rem, 10vw, 9rem);
  --maxw: 78rem;
}
```

- [ ] **Step 3: Write the failing test for Section**

```tsx
// packages/ui/src/components/Section.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Section } from "./Section";

describe("Section", () => {
  it("renders children inside a section landmark", () => {
    render(<Section>hello</Section>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
  it("applies an id when given", () => {
    render(<Section id="experience">x</Section>);
    expect(document.getElementById("experience")).not.toBeNull();
  });
});
```

- [ ] **Step 4: Run the test to confirm it fails**

Run: `pnpm --filter @dreamtime/ui exec vitest run` (add the same vitest config + script to packages/ui as in Task 3 Steps 1–4, scoped to this package)
Expected: FAIL — cannot find `./Section`.

- [ ] **Step 5: Implement Section and Button**

```tsx
// packages/ui/src/components/Section.tsx
import type { ReactNode } from "react";

export function Section({
  id,
  as: Tag = "section",
  className = "",
  children,
}: {
  id?: string;
  as?: "section" | "div" | "footer" | "header";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className={`dt-section ${className}`}>
      <div className="dt-section__inner">{children}</div>
    </Tag>
  );
}
```

```tsx
// packages/ui/src/components/Button.tsx
import type { ReactNode } from "react";

export function Button({
  href,
  variant = "solid",
  children,
}: {
  href?: string;
  variant?: "solid" | "ghost";
  children: ReactNode;
}) {
  const cls = `dt-btn dt-btn--${variant}`;
  return href ? <a className={cls} href={href}>{children}</a> : <button className={cls}>{children}</button>;
}
```

- [ ] **Step 6: Export from index and run tests**

```typescript
// packages/ui/src/index.ts
export { Section } from "./components/Section";
export { Button } from "./components/Button";
```
Run: `pnpm --filter @dreamtime/ui exec vitest run`
Expected: 2 passed.

- [ ] **Step 7: Wire tokens + fonts into the web app**

In `apps/web/src/app/globals.css`, add at the top:
```css
@import "@dreamtime/ui/styles/tokens.css";

.dt-section { padding-block: var(--space-section); }
.dt-section__inner { max-width: var(--maxw); margin-inline: auto; padding-inline: 1.5rem; }
.dt-btn { display: inline-flex; align-items: center; padding: 0.85rem 1.6rem; border-radius: 999px; font-weight: 500; letter-spacing: 0.02em; }
.dt-btn--solid { background: var(--color-sand); color: var(--color-ink); }
.dt-btn--ghost { border: 1px solid currentColor; }
```
Add `@dreamtime/ui` as a dependency: `pnpm --filter @dreamtime/web add @dreamtime/ui@workspace:*`. Load the Cormorant Garamond font via `next/font/google` in the root layout (Task 7).

- [ ] **Step 8: Commit**

```bash
git add packages/ui apps/web/src/app/globals.css apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add design-system tokens, Section and Button to packages/ui"
```

---

### Task 7: Root layout, navigation, and footer

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/components/SiteHeader.tsx`
- Create: `apps/web/src/components/SiteFooter.tsx`
- Create: `apps/web/src/lib/cms.ts` (typed Payload accessors)
- Create: `apps/web/src/lib/cms.test.ts`

**Interfaces:**
- Consumes: Payload collections (Task 5).
- Produces: `getSiteContent()`, `getVoyages()`, `getVessel()`, `getTestimonials()` from `lib/cms.ts` — async functions returning typed objects from `payload-types`. Consumed by Tasks 8–12.

- [ ] **Step 1: Write typed CMS accessors**

```typescript
// apps/web/src/lib/cms.ts
import { getPayload } from "payload";
import config from "@/payload.config";
import type { Vessel, Voyage, Testimonial } from "@/payload-types";

async function client() {
  return getPayload({ config });
}

export async function getSiteContent() {
  const payload = await client();
  return payload.findGlobal({ slug: "site-content" });
}

export async function getVoyages(): Promise<Voyage[]> {
  const payload = await client();
  const res = await payload.find({
    collection: "voyages",
    where: { status: { not_equals: "draft" } },
    sort: "startDate",
    limit: 50,
  });
  return res.docs;
}

export async function getPrimaryVessel(): Promise<Vessel | null> {
  const payload = await client();
  const res = await payload.find({ collection: "vessels", limit: 1 });
  return res.docs[0] ?? null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const payload = await client();
  const res = await payload.find({ collection: "testimonials", limit: 12 });
  return res.docs;
}
```

- [ ] **Step 2: Write a test for the voyages filter logic**

Because `getVoyages` hits the DB, test the pure filter helper instead. Extract and test it:
```typescript
// apps/web/src/lib/cms.test.ts
import { describe, it, expect } from "vitest";
import { isPublicVoyage } from "./cms-helpers";

describe("isPublicVoyage", () => {
  it("excludes drafts", () => {
    expect(isPublicVoyage({ status: "draft" })).toBe(false);
  });
  it("includes scheduled and charter", () => {
    expect(isPublicVoyage({ status: "scheduled" })).toBe(true);
    expect(isPublicVoyage({ status: "charter" })).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

Run: `pnpm --filter @dreamtime/web test src/lib/cms.test.ts`
Expected: FAIL — cannot find `./cms-helpers`.

- [ ] **Step 4: Implement the helper and use it in `getVoyages`**

```typescript
// apps/web/src/lib/cms-helpers.ts
export function isPublicVoyage(v: { status?: string | null }): boolean {
  return v.status === "scheduled" || v.status === "charter";
}
```
(Keep the DB-level `where` filter in `getVoyages` too; the helper documents and unit-tests the rule.)

- [ ] **Step 5: Run the test to confirm it passes**

Run: `pnpm --filter @dreamtime/web test src/lib/cms.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Build header and footer**

```tsx
// apps/web/src/components/SiteHeader.tsx
import { Button } from "@dreamtime/ui";

export function SiteHeader({ brand }: { brand: string }) {
  return (
    <header className="dt-header">
      <div className="dt-header__inner">
        <a href="/" className="dt-header__brand">{brand}</a>
        <nav className="dt-header__nav">
          <a href="#experience">The Experience</a>
          <a href="#vessel">The Vessel</a>
          <a href="#voyages">Voyages</a>
          <Button href="#enquire" variant="ghost">Enquire</Button>
        </nav>
      </div>
    </header>
  );
}
```

```tsx
// apps/web/src/components/SiteFooter.tsx
import { Section } from "@dreamtime/ui";

export function SiteFooter({ brand }: { brand: string }) {
  return (
    <Section as="footer" className="dt-footer">
      <p>{brand}</p>
      <p>Kimberley Coast, Western Australia</p>
    </Section>
  );
}
```

- [ ] **Step 7: Update root layout to load fonts + chrome**

```tsx
// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteContent } from "@/lib/cms";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-display-loaded" });

export const metadata: Metadata = {
  title: "Dreamtime Expeditions — Private Kimberley Voyages",
  description: "Bespoke luxury expedition voyages along the Kimberley coast.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteContent();
  return (
    <html lang="en" className={display.variable}>
      <body>
        <SiteHeader brand={site.brandName} />
        {children}
        <SiteFooter brand={site.brandName} />
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/components apps/web/src/lib
git commit -m "feat: add root layout, header, footer and typed CMS accessors"
```

---

### Task 8: Hero section

**Files:**
- Create: `apps/web/src/components/sections/Hero.tsx`
- Create: `apps/web/src/components/sections/Hero.test.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `getSiteContent()` (Task 7) → `{ heroHeadline, heroSubhead, heroImage }`.
- Produces: `<Hero headline subhead imageUrl?>`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/components/sections/Hero.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hero } from "./Hero";

describe("Hero", () => {
  it("renders the headline and subhead", () => {
    render(<Hero headline="Voyage Beyond" subhead="The Kimberley awaits" />);
    expect(screen.getByRole("heading", { name: "Voyage Beyond" })).toBeInTheDocument();
    expect(screen.getByText("The Kimberley awaits")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Hero.test.tsx`
Expected: FAIL — cannot find `./Hero`.

- [ ] **Step 3: Implement Hero**

```tsx
// apps/web/src/components/sections/Hero.tsx
export function Hero({ headline, subhead, imageUrl }: { headline: string; subhead?: string | null; imageUrl?: string | null }) {
  return (
    <section className="dt-hero" style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}>
      <div className="dt-hero__overlay">
        <h1 className="dt-hero__headline">{headline}</h1>
        {subhead && <p className="dt-hero__subhead">{subhead}</p>}
        <a className="dt-btn dt-btn--solid" href="#voyages">Discover the Voyages</a>
      </div>
    </section>
  );
}
```
Add hero styles to `globals.css` (full-viewport, dark gradient overlay, display font on `.dt-hero__headline`).

- [ ] **Step 4: Run to confirm it passes**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Hero.test.tsx`
Expected: 1 passed.

- [ ] **Step 5: Render it on the homepage**

```tsx
// apps/web/src/app/page.tsx
import { Hero } from "@/components/sections/Hero";
import { getSiteContent } from "@/lib/cms";

export default async function HomePage() {
  const site = await getSiteContent();
  const heroUrl = typeof site.heroImage === "object" && site.heroImage ? site.heroImage.url : null;
  return (
    <main>
      <Hero headline={site.heroHeadline} subhead={site.heroSubhead} imageUrl={heroUrl} />
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/sections/Hero.tsx apps/web/src/components/sections/Hero.test.tsx apps/web/src/app/page.tsx apps/web/src/app/globals.css
git commit -m "feat: add data-driven hero section"
```

---

### Task 9: Experience and Vessel sections

**Files:**
- Create: `apps/web/src/components/sections/Experience.tsx`
- Create: `apps/web/src/components/sections/Vessel.tsx`
- Create: `apps/web/src/components/RichText.tsx`
- Create: `apps/web/src/components/sections/Vessel.test.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `getSiteContent()` (experienceTitle/Body), `getPrimaryVessel()` (Task 7).
- Produces: `<Experience title body>`, `<Vessel vessel>`, `<RichText data>` (renders Lexical richText).

- [ ] **Step 1: Write the RichText renderer**

```tsx
// apps/web/src/components/RichText.tsx
import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export function RichText({ data }: { data?: SerializedEditorState | null }) {
  if (!data) return null;
  return <LexicalRichText data={data} />;
}
```
Install: `pnpm --filter @dreamtime/web add @payloadcms/richtext-lexical` (already added in Task 4; verify).

- [ ] **Step 2: Write the failing test for Vessel**

```tsx
// apps/web/src/components/sections/Vessel.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Vessel } from "./Vessel";

describe("Vessel", () => {
  it("renders name, tagline and specs", () => {
    render(<Vessel vessel={{ name: "MV Dreamtime", tagline: "Eight suites", specs: [{ label: "Guests", value: "16" }], story: null }} />);
    expect(screen.getByRole("heading", { name: "MV Dreamtime" })).toBeInTheDocument();
    expect(screen.getByText("Eight suites")).toBeInTheDocument();
    expect(screen.getByText("Guests")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to confirm it fails**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Vessel.test.tsx`
Expected: FAIL — cannot find `./Vessel`.

- [ ] **Step 4: Implement Experience and Vessel**

```tsx
// apps/web/src/components/sections/Experience.tsx
import { Section } from "@dreamtime/ui";
import { RichText } from "@/components/RichText";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export function Experience({ title, body }: { title?: string | null; body?: SerializedEditorState | null }) {
  return (
    <Section id="experience" className="dt-experience">
      {title && <h2 className="dt-h2">{title}</h2>}
      <div className="dt-prose"><RichText data={body} /></div>
    </Section>
  );
}
```

```tsx
// apps/web/src/components/sections/Vessel.tsx
import { Section } from "@dreamtime/ui";

type Spec = { label: string; value: string };
type VesselProps = { name: string; tagline?: string | null; specs?: Spec[] | null; story?: unknown };

export function Vessel({ vessel }: { vessel: VesselProps }) {
  return (
    <Section id="vessel" className="dt-vessel">
      <h2 className="dt-h2">{vessel.name}</h2>
      {vessel.tagline && <p className="dt-vessel__tagline">{vessel.tagline}</p>}
      {vessel.specs && (
        <dl className="dt-specs">
          {vessel.specs.map((s, i) => (
            <div key={i} className="dt-specs__row">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Section>
  );
}
```

- [ ] **Step 5: Run to confirm it passes**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Vessel.test.tsx`
Expected: 1 passed.

- [ ] **Step 6: Add both to the homepage**

In `apps/web/src/app/page.tsx`, fetch `getPrimaryVessel()` and render `<Experience>` then `<Vessel>` after `<Hero>` (guard null vessel).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components apps/web/src/app/page.tsx
git commit -m "feat: add experience and vessel sections with richtext"
```

---

### Task 10: Voyages section

**Files:**
- Create: `apps/web/src/components/sections/Voyages.tsx`
- Create: `apps/web/src/components/VoyageCard.tsx`
- Create: `apps/web/src/components/VoyageCard.test.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `getVoyages()` (Task 7) → `Voyage[]`.
- Produces: `<Voyages voyages>`, `<VoyageCard voyage>`.

- [ ] **Step 1: Write the failing test for VoyageCard**

```tsx
// apps/web/src/components/VoyageCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VoyageCard } from "./VoyageCard";

describe("VoyageCard", () => {
  it("shows title, nights and route", () => {
    render(<VoyageCard voyage={{ title: "Horizontal Falls", durationNights: 7, route: "Broome → Wyndham", slug: "hf", summary: "", status: "scheduled" }} />);
    expect(screen.getByRole("heading", { name: "Horizontal Falls" })).toBeInTheDocument();
    expect(screen.getByText(/7 nights/i)).toBeInTheDocument();
    expect(screen.getByText("Broome → Wyndham")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `pnpm --filter @dreamtime/web test src/components/VoyageCard.test.tsx`
Expected: FAIL — cannot find `./VoyageCard`.

- [ ] **Step 3: Implement VoyageCard and Voyages**

```tsx
// apps/web/src/components/VoyageCard.tsx
type VoyageCardProps = {
  title: string; durationNights: number; route?: string | null;
  slug: string; summary?: string | null; priceFrom?: number | null;
};
export function VoyageCard({ voyage }: { voyage: VoyageCardProps }) {
  return (
    <article className="dt-voyage-card">
      <h3 className="dt-voyage-card__title">{voyage.title}</h3>
      <p className="dt-voyage-card__meta">
        {voyage.durationNights} nights{voyage.route ? ` · ${voyage.route}` : ""}
      </p>
      {voyage.summary && <p className="dt-voyage-card__summary">{voyage.summary}</p>}
      {voyage.priceFrom != null && <p className="dt-voyage-card__price">From ${voyage.priceFrom.toLocaleString()}</p>}
    </article>
  );
}
```

```tsx
// apps/web/src/components/sections/Voyages.tsx
import { Section } from "@dreamtime/ui";
import { VoyageCard } from "@/components/VoyageCard";
import type { Voyage } from "@/payload-types";

export function Voyages({ voyages }: { voyages: Voyage[] }) {
  return (
    <Section id="voyages" className="dt-voyages">
      <h2 className="dt-h2">Voyages &amp; Itineraries</h2>
      <div className="dt-voyages__grid">
        {voyages.map((v) => <VoyageCard key={v.id} voyage={v} />)}
      </div>
    </Section>
  );
}
```

- [ ] **Step 4: Run to confirm it passes**

Run: `pnpm --filter @dreamtime/web test src/components/VoyageCard.test.tsx`
Expected: 1 passed.

- [ ] **Step 5: Add to homepage and commit**

Render `<Voyages voyages={await getVoyages()} />` on the page.
```bash
git add apps/web/src/components apps/web/src/app/page.tsx
git commit -m "feat: add voyages section driven by CMS"
```

---

### Task 11: Testimonials section

**Files:**
- Create: `apps/web/src/components/sections/Testimonials.tsx`
- Create: `apps/web/src/components/sections/Testimonials.test.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `getTestimonials()` (Task 7) → `Testimonial[]`.
- Produces: `<Testimonials items>`.

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/components/sections/Testimonials.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Testimonials } from "./Testimonials";

describe("Testimonials", () => {
  it("renders each quote and author", () => {
    render(<Testimonials items={[{ id: 1, quote: "Unforgettable", author: "A. Guest", location: "Sydney" }]} />);
    expect(screen.getByText(/Unforgettable/)).toBeInTheDocument();
    expect(screen.getByText(/A\. Guest/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Testimonials.test.tsx`
Expected: FAIL — cannot find `./Testimonials`.

- [ ] **Step 3: Implement**

```tsx
// apps/web/src/components/sections/Testimonials.tsx
import { Section } from "@dreamtime/ui";
type Item = { id: number | string; quote: string; author: string; location?: string | null };
export function Testimonials({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <Section id="testimonials" className="dt-testimonials">
      <h2 className="dt-h2">In Their Words</h2>
      <ul className="dt-testimonials__list">
        {items.map((t) => (
          <li key={t.id} className="dt-testimonial">
            <blockquote>{t.quote}</blockquote>
            <cite>{t.author}{t.location ? `, ${t.location}` : ""}</cite>
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

- [ ] **Step 4: Run to confirm it passes**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Testimonials.test.tsx`
Expected: 1 passed.

- [ ] **Step 5: Add to homepage and commit**

```bash
git add apps/web/src/components apps/web/src/app/page.tsx
git commit -m "feat: add testimonials section"
```

---

### Task 11A: Gallery and Who We Are sections

The spec lists a Gallery and a Who We Are section. Gallery reuses the primary vessel's `gallery` images; Who We Are reuses `SiteContent` richText (a dedicated `aboutTitle`/`aboutBody` pair added to the global).

**Files:**
- Modify: `apps/web/src/payload/globals/SiteContent.ts` (add `aboutTitle`, `aboutBody`)
- Create: `apps/web/src/components/sections/Gallery.tsx`
- Create: `apps/web/src/components/sections/Gallery.test.tsx`
- Create: `apps/web/src/components/sections/About.tsx`
- Modify: `apps/web/src/app/page.tsx`, `apps/web/src/payload-types.ts` (regenerated)

**Interfaces:**
- Consumes: `getPrimaryVessel().gallery` (Media[]), `getSiteContent().aboutTitle/aboutBody`.
- Produces: `<Gallery images>` where `images: { id; url; alt }[]`; `<About title body>`.

- [ ] **Step 1: Add About fields to the SiteContent global**

Append to the `fields` array in `SiteContent.ts`:
```typescript
    { name: "aboutTitle", type: "text" },
    { name: "aboutBody", type: "richText" },
```
Run `npx payload generate:types` afterward.

- [ ] **Step 2: Write the failing test for Gallery**

```tsx
// apps/web/src/components/sections/Gallery.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Gallery } from "./Gallery";

describe("Gallery", () => {
  it("renders an image per item with alt text", () => {
    render(<Gallery images={[{ id: 1, url: "/a.jpg", alt: "Sunset over the bay" }]} />);
    expect(screen.getByAltText("Sunset over the bay")).toBeInTheDocument();
  });
  it("renders nothing when empty", () => {
    const { container } = render(<Gallery images={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 3: Run to confirm it fails**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Gallery.test.tsx`
Expected: FAIL — cannot find `./Gallery`.

- [ ] **Step 4: Implement Gallery and About**

```tsx
// apps/web/src/components/sections/Gallery.tsx
import { Section } from "@dreamtime/ui";
type Img = { id: number | string; url: string; alt: string };
export function Gallery({ images }: { images: Img[] }) {
  if (!images.length) return null;
  return (
    <Section id="gallery" className="dt-gallery">
      <div className="dt-gallery__grid">
        {images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={img.id} src={img.url} alt={img.alt} loading="lazy" className="dt-gallery__img" />
        ))}
      </div>
    </Section>
  );
}
```

```tsx
// apps/web/src/components/sections/About.tsx
import { Section } from "@dreamtime/ui";
import { RichText } from "@/components/RichText";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
export function About({ title, body }: { title?: string | null; body?: SerializedEditorState | null }) {
  if (!title && !body) return null;
  return (
    <Section id="about" className="dt-about">
      {title && <h2 className="dt-h2">{title}</h2>}
      <div className="dt-prose"><RichText data={body} /></div>
    </Section>
  );
}
```

- [ ] **Step 5: Run to confirm it passes**

Run: `pnpm --filter @dreamtime/web test src/components/sections/Gallery.test.tsx`
Expected: 2 passed.

- [ ] **Step 6: Add both to the homepage (Gallery after Vessel, About before Enquire) and commit**

Map the vessel gallery to `{ id, url, alt }` (guard non-populated relations). Then:
```bash
git add apps/web/src/components apps/web/src/payload apps/web/src/payload-types.ts apps/web/src/app/page.tsx
git commit -m "feat: add gallery and who-we-are sections"
```

---

### Task 12: Enquiry section with server action

**Files:**
- Create: `apps/web/src/components/sections/Enquire.tsx`
- Create: `apps/web/src/app/actions/submit-enquiry.ts`
- Create: `apps/web/src/app/actions/submit-enquiry.test.ts`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: Payload `enquiries` collection (Task 5), `getVoyages()` for the voyage dropdown.
- Produces: server action `submitEnquiry(prevState, formData): Promise<{ ok: boolean; error?: string }>`; `<Enquire voyages intro>`.

- [ ] **Step 1: Write the validation helper + failing test**

```typescript
// apps/web/src/app/actions/enquiry-validate.ts
export type EnquiryInput = { name: string; email: string; message: string; phone?: string; voyage?: string };
export function validateEnquiry(input: Partial<EnquiryInput>): { ok: true; value: EnquiryInput } | { ok: false; error: string } {
  if (!input.name?.trim()) return { ok: false, error: "Name is required" };
  if (!input.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) return { ok: false, error: "A valid email is required" };
  if (!input.message?.trim()) return { ok: false, error: "Message is required" };
  return { ok: true, value: { name: input.name.trim(), email: input.email, message: input.message.trim(), phone: input.phone, voyage: input.voyage } };
}
```

```typescript
// apps/web/src/app/actions/submit-enquiry.test.ts
import { describe, it, expect } from "vitest";
import { validateEnquiry } from "./enquiry-validate";

describe("validateEnquiry", () => {
  it("rejects missing name", () => {
    expect(validateEnquiry({ email: "a@b.com", message: "hi" })).toEqual({ ok: false, error: "Name is required" });
  });
  it("rejects bad email", () => {
    expect(validateEnquiry({ name: "A", email: "nope", message: "hi" }).ok).toBe(false);
  });
  it("accepts a valid enquiry", () => {
    const r = validateEnquiry({ name: "A", email: "a@b.com", message: "hi" });
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

Run: `pnpm --filter @dreamtime/web test src/app/actions/submit-enquiry.test.ts`
Expected: FAIL — cannot find `./enquiry-validate`.

- [ ] **Step 3: Create the helper (above) and run the test**

Run: `pnpm --filter @dreamtime/web test src/app/actions/submit-enquiry.test.ts`
Expected: 3 passed.

- [ ] **Step 4: Write the server action**

```typescript
// apps/web/src/app/actions/submit-enquiry.ts
"use server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { validateEnquiry } from "./enquiry-validate";

export async function submitEnquiry(_prev: unknown, formData: FormData) {
  const parsed = validateEnquiry({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    phone: String(formData.get("phone") ?? "") || undefined,
    voyage: String(formData.get("voyage") ?? "") || undefined,
  });
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const payload = await getPayload({ config });
  await payload.create({
    collection: "enquiries",
    data: {
      name: parsed.value.name,
      email: parsed.value.email,
      message: parsed.value.message,
      phone: parsed.value.phone,
      voyage: parsed.value.voyage ? Number(parsed.value.voyage) : undefined,
    },
  });
  return { ok: true };
}
```

- [ ] **Step 5: Build the Enquire form (client component using useActionState)**

```tsx
// apps/web/src/components/sections/Enquire.tsx
"use client";
import { useActionState } from "react";
import { Section } from "@dreamtime/ui";
import { submitEnquiry } from "@/app/actions/submit-enquiry";

type VoyageOption = { id: number | string; title: string };
export function Enquire({ voyages, intro }: { voyages: VoyageOption[]; intro?: string | null }) {
  const [state, action, pending] = useActionState(submitEnquiry, { ok: false } as { ok: boolean; error?: string });
  return (
    <Section id="enquire" className="dt-enquire">
      <h2 className="dt-h2">Begin Your Journey</h2>
      {intro && <p>{intro}</p>}
      {state.ok ? (
        <p className="dt-enquire__success">Thank you — we will be in touch personally.</p>
      ) : (
        <form action={action} className="dt-enquire__form">
          <input name="name" placeholder="Your name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="phone" placeholder="Phone (optional)" />
          <select name="voyage" defaultValue="">
            <option value="">A voyage of interest (optional)</option>
            {voyages.map((v) => <option key={v.id} value={String(v.id)}>{v.title}</option>)}
          </select>
          <textarea name="message" placeholder="Tell us about the journey you imagine" required />
          {state.error && <p className="dt-enquire__error">{state.error}</p>}
          <button className="dt-btn dt-btn--solid" disabled={pending}>{pending ? "Sending…" : "Send enquiry"}</button>
        </form>
      )}
    </Section>
  );
}
```

- [ ] **Step 6: Add to homepage, manually verify a submission lands in /admin**

Render `<Enquire voyages={voyages} intro={site.enquiryIntro} />`. Run `pnpm run dev`, submit the form, confirm the entry appears under Enquiries in `/admin`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components apps/web/src/app/actions apps/web/src/app/page.tsx
git commit -m "feat: add enquiry section with validated server action"
```

---

### Task 13: Seed content, full-page verification, and deploy

**Files:**
- Create: `apps/web/scripts/seed.ts` (idempotent seed of SiteContent + one vessel + sample voyages + testimonials)
- Modify: `apps/web/package.json` (seed script)

**Interfaces:**
- Consumes: all collections/globals from Task 5.
- Produces: a populated DB so the live site renders fully; a verified production deploy.

- [ ] **Step 1: Write an idempotent seed script**

```typescript
// apps/web/scripts/seed.ts
import { getPayload } from "payload";
import config from "../src/payload.config";

async function seed() {
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: "site-content",
    data: {
      brandName: "Dreamtime Expeditions",
      heroHeadline: "Voyage Into the Kimberley Dreaming",
      heroSubhead: "A private expedition along Australia's last great wild coast.",
      enquiryIntro: "Tell us the journey you imagine; we will craft it around you.",
    },
  });
  const existing = await payload.find({ collection: "voyages", limit: 1 });
  if (existing.docs.length === 0) {
    await payload.create({ collection: "voyages", data: { title: "The Horizontal Falls Expedition", slug: "horizontal-falls", durationNights: 7, route: "Broome → Wyndham", status: "scheduled", priceFrom: 18500, summary: "Seven nights through the heart of the Kimberley." } });
    await payload.create({ collection: "voyages", data: { title: "Private Charter — Bespoke", slug: "bespoke-charter", durationNights: 10, route: "By arrangement", status: "charter", summary: "The vessel, the route, and the rhythm — entirely yours." } });
  }
  await payload.create({ collection: "testimonials", data: { quote: "The most extraordinary journey of our lives.", author: "The Hendersons", location: "Melbourne" } }).catch(() => {});
  // eslint-disable-next-line no-console
  console.log("Seed complete");
  process.exit(0);
}
seed();
```

- [ ] **Step 2: Add the seed script and run it**

Run: `cd apps/web && npm pkg set scripts.seed="tsx scripts/seed.ts" && pnpm add -D tsx && pnpm run seed`
Expected: "Seed complete". Verify entries in `/admin`.

- [ ] **Step 3: Run all tests and lint**

Run:
```bash
cd /Users/jimmy/Documents/Projects/dreamtimeexpeditions
pnpm test
pnpm --filter @dreamtime/web run lint
```
Expected: all tests pass; lint clean.

- [ ] **Step 4: Build + preview on workerd, click through the whole homepage**

Run: `cd apps/web && pnpm run preview`
Manually verify: hero, experience, vessel, gallery, voyages, testimonials, about, enquiry all render with seeded content; `/admin` loads; an enquiry submits successfully. (Gallery/about appear only once a vessel gallery and about copy are entered — seed or add via `/admin`.)

- [ ] **Step 5: Commit and push to trigger the Cloudflare deploy**

```bash
cd /Users/jimmy/Documents/Projects/dreamtimeexpeditions
git add apps/web/scripts apps/web/package.json pnpm-lock.yaml
git commit -m "feat: seed marketing content and verify full homepage"
git push origin main
```

- [ ] **Step 6: Verify production**

After Workers Builds finishes (check the Cloudflare dashboard / `npx wrangler deployments list`), run:
`curl -s -o /dev/null -w "%{http_code}\n" https://dreamtimeexpeditions.ebmllc-d0c.workers.dev`
Expected: `200`, and the page shows the seeded hero headline. Confirm `PAYLOAD_SECRET`, `DATABASE_URL` (or the Hyperdrive binding) are set in the Workers Builds environment so prod can reach the DB.

---

## Production environment checklist (do before Step 5 push)

- Workers Builds env vars set: `PAYLOAD_SECRET`, `DATABASE_URL` (build-time, for Payload type/SSG steps).
- Hyperdrive binding `HYPERDRIVE` present in `wrangler.jsonc` (Task 2) — used at runtime in prod.
- First admin user created on the production DB (visit the deployed `/admin` once).
