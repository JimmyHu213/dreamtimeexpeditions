# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated issues, mention them — don't fix them.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan with verification at each step.

## 5. Project Context

**Dreamtime Expeditions** — a high-end expedition cruise platform. One unified Next.js app + one Supabase backend, with role-gated faces over five subsystems (marketing, booking, operations console, AI agents, social hub). Built in slices; slice 1 = marketing site + booking.

**Tech stack:**
- **Monorepo:** Turborepo + pnpm workspaces. `apps/web` + `packages/{core,db,finance,ui}`.
- **App:** Next.js (App Router) via OpenNext, deployed to **Cloudflare Workers**.
- **Backend:** Supabase — Postgres, Auth, Storage, Realtime. **RLS is the single RBAC layer** for both human users and AI agents.
- **Data access:** Drizzle ORM (`packages/db`) over the Supabase Postgres.
- **Payments:** Stripe only, behind a `FinanceProvider` adapter (Xero snaps in later). Never build accounting/tax logic ourselves.
- **CMS:** Payload CMS embedded in the Next.js app, same Supabase Postgres.
- **AI:** specialized agents, each with its own MCP toolset, metered via OpenRouter; framework chosen per slice.
- **Deploy:** Cloudflare Workers Builds (native Git integration), root dir `apps/web`, deploy command `pnpm run deploy`.

## 6. Coding Standards

- Follow existing patterns in the codebase.
- No premature abstractions — three similar lines beat one speculative helper.
- Prefer readability over cleverness.
- Error handling at system boundaries only (user input, external APIs).

## 7. Git Workflow

- Conventional Commits required: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`, `style:`
- Keep PRs small and focused — one concern per PR.
- Write meaningful commit messages explaining why, not what.
- Never force-push to shared branches.
- Never commit directly to `main`, and never open a PR with `main` as the source branch. All code changes MUST land on `main` through a PR from a feature branch — CI/CD runs on every PR, so this is the only path that gets validated and deployed.
- New feature branches MUST be created as a git worktree (`git worktree add ../<branch> <branch>`), not a `git checkout` in place. A worktree gives the branch its own path, so subagents can work in it concurrently. Two branches cannot be checked out at the same path — subagents sharing one path cannot switch branches independently, so without a worktree they would collide.

## 8. PR Expectations

- **No code commits on `main`.** `main` is updated only by merging reviewed PRs.
- **Every change set goes through a feature branch in a dedicated git worktree.** Branch
  off `main` (e.g. `feat/<scope>`), do the work in the worktree, verify it there, then
  open a PR back into `main`. Never push feature commits directly to `main`.
- One concern per PR; keep them small and focused.
- Fill out the PR template completely.
- Ensure all CI checks pass before requesting review.
- Respond to CodeRabbit/Copilot findings — dismiss with a reason or fix.

## 9. File Organization

Monorepo layout (pnpm workspaces — `apps/*`, `packages/*`):

```
apps/
  web/                  # the single Next.js app (OpenNext → Cloudflare Workers)
    src/
      app/              # App Router: routes, layouts, route handlers, server actions
      components/       # app-specific React components (not shared → packages/ui)
      lib/              # app-specific helpers, server/client utilities
    public/             # static assets
packages/
  core/                 # @dreamtime/core  — shared domain types & business logic (framework-agnostic)
  db/                   # @dreamtime/db    — Drizzle schema, migrations, query helpers
  finance/              # @dreamtime/finance — FinanceProvider adapter (Stripe today, Xero later)
  ui/                   # @dreamtime/ui    — shared, presentational React components
```

Conventions:
- **Packages are imported as `@dreamtime/<name>`**, never by relative path across package boundaries.
- **Decide where code lives by reuse, not convenience:** shared domain logic → `core`; DB access → `db`; payments → `finance`; reusable UI → `ui`. Anything used by only one app stays in `apps/web`.
- **`db` owns all schema and migrations.** No app or other package defines tables or runs raw migrations.
- **`finance` is the only place that touches Stripe/payment SDKs** — keep it behind the `FinanceProvider` interface so the provider can be swapped without touching callers.
- Each package exposes a single public entry (`src/index.ts`); keep internals unexported.
- Co-locate related files (component + its styles/tests/stories together).
- Avoid deep nesting — prefer flat, well-named directories.
