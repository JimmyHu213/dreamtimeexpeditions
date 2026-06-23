# Dreamtime Expeditions

Platform for a high-end private expedition cruise business on the Kimberley coast (Western Australia) — marketing site, booking, operations, and AI agents. Built as a monorepo; shipped in slices.

## Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm workspaces, TypeScript |
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind CSS v4 |
| Runtime / hosting | Cloudflare Workers (via `@opennextjs/cloudflare`) |
| Database | Supabase Postgres, reached through Cloudflare Hyperdrive |
| ORM | Drizzle ORM + drizzle-kit (code-first schema & migrations) |
| CMS *(planned)* | Payload CMS v3 (Postgres-backed), media in Cloudflare R2 |
| Payments *(planned)* | Stripe, behind a `FinanceProvider` adapter |
| AI *(later slices)* | Multi-agent + MCP servers, metered via OpenRouter |
| CI/CD | GitHub Actions (mega-linter, CodeQL, gitleaks), Cloudflare Workers Builds |

## Layout

```
apps/
  web/            Next.js app (marketing, later: booking, console, AI portal)
packages/
  db/             Drizzle schema + client (single source of truth for ops tables)
  core/           shared domain types & rules        (stub)
  finance/        Stripe adapter                      (stub)
  ui/             shared design system                (stub)
docs/superpowers/ design specs & implementation plans
```

## Commands

```bash
pnpm install                 # install the workspace

# Develop
pnpm dev                     # turbo → next dev for apps/web
pnpm --filter @dreamtime/web preview   # run on the real Workers runtime (workerd)

# Build / deploy
pnpm build                   # turbo → next build
pnpm run deploy              # opennextjs-cloudflare build && deploy (Cloudflare)

# Quality
pnpm typecheck
pnpm lint

# Database (Drizzle → Supabase)
pnpm --filter @dreamtime/db db:generate   # generate a migration from the TS schema
pnpm --filter @dreamtime/db db:migrate    # apply migrations to Supabase
```

### Local env

`apps/web/.dev.vars` and `packages/db/.env` are gitignored. Copy the matching
`*.example` files and fill in the Supabase connection string. The Hyperdrive
local connection string is only needed for `next dev`/preview, not production.

## Deployment

`main` is deployed automatically by **Cloudflare Workers Builds**
(root directory `apps/web`, build `npx opennextjs-cloudflare build`,
deploy `npx opennextjs-cloudflare deploy`). No code is committed to `main`
directly — all changes land via a feature branch and PR.
