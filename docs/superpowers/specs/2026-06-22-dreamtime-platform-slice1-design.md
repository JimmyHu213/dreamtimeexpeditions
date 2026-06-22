# Dreamtime Expeditions Platform — Design Spec

**Date:** 2026-06-22
**Status:** Approved for slice 1
**Scope of this document:** Overall platform architecture + the first slice (marketing site + booking) in implementation-ready detail. Later slices are sketched, not specified.

---

## 1. Vision

A unified platform for a high-end expedition cruise business (Kimberley region, AU). It must:

1. **Attract** — a cinematic marketing site that tells the brand story (more refined than kimberleypearl.com.au).
2. **Convert** — a concierge-grade booking experience for high-end customers, not a "2-hour cruise" checkout.
3. **Operate** — an internal console for the Voyage Master (bookings, scheduling, finance view, invoicing).
4. **Amplify (AI)** — specialized AI agents (CrewAI-style), each wired to its own MCP toolset, metered through a central token gateway, acting only within the user's RBAC.
5. **Promote (social)** — a hub to manage connected social accounts: post, read DMs/feedback, notifications.

This document specifies items 1–2 (slice 1). Items 3–5 are designed to plug into the same spine and are deferred to later slices.

## 2. Architecture (whole platform)

One Next.js app (Cloudflare Workers) + one Supabase backend. Not five systems — one spine with role-gated faces.

```
                    Next.js app (Cloudflare Workers)
   Public guests →  • Marketing site  • Booking flow  • Guest Voyage Portal
   Staff (role)  →  • Operations console  • AI portal  • Social hub
                                   |
        ┌──────────────────────────┼───────────────────────────┐
   Supabase (Postgres/Auth/RLS/   Stripe (payments/deposits)   AI agent layer
   Storage/Realtime)              [Xero later via adapter]     (CrewAI-style;
                                                                per-agent MCPs;
                                                                token-metered)
                                                                     |
                                              MCPs: bookings · finance · social · ops
```

### Foundational decisions

- **Hosting/runtime:** Next.js on **Cloudflare Workers**.
- **Backend:** **Supabase** — Postgres (data), Auth (accounts/magic-link), **Row-Level Security = the single RBAC layer**, Storage (images/docs), Realtime (notifications). Open-source.
- **RBAC enforced once, at the data layer.** The same RLS rules protect the database whether a human clicks a button or an AI agent calls an MCP. An agent can never exceed the acting user's permissions.
- **Payments:** **Stripe** (deposits, balances, refunds). We never build accounting/tax logic ourselves — that legal/compliance risk stays with providers. A `FinanceProvider` adapter interface lets **Xero** (AU-standard compliant invoicing/GST) snap in later with no rework.
- **AI:** specialized agents, each with its own MCP toolset, run through a central token gateway (**OpenRouter** — not open-source, but it is the metering hub) with a per-agent/per-period **token budget**, logged to a usage ledger. Agent framework (TypeScript-native via Vercel AI SDK/Mastra **or** Python CrewAI) is **chosen when that slice is built**; MCP servers are language-agnostic so this costs nothing now.
- **CMS:** **Payload CMS** (open-source, MIT, TypeScript) embedded in the Next.js app, backed by the **same Supabase Postgres**. Site content lives in Payload collections; booking data in our own tables; one database. Content is AI-readable.
  - *Risk flagged:* Payload-on-Cloudflare-Workers needs Node-compat validated in week 1. Fallback: host the Next/Payload app in a Node-compatible target while keeping the rest of the stack identical.

### Repository — monorepo (Turborepo + pnpm)

Chosen specifically to make AI agents easy: agents and MCPs import the *same* db/domain types as the web app — one source of truth, no drift.

```
dreamtime/
├── apps/
│   ├── web/            Next.js — marketing, booking, console, AI portal UI, Payload admin
│   └── agents/         AI agent runtime (deferred slice)
├── packages/
│   ├── db/             Supabase schema + generated types  ← single source of truth
│   ├── core/           domain types & rules (Booking, Voyage, Cabin…)
│   ├── finance/        Stripe adapter (FinanceProvider interface)
│   ├── mcp-bookings/   MCP server over booking/ops data (deferred slice)
│   ├── mcp-finance/    MCP server over Stripe/finance (deferred slice)
│   ├── mcp-social/     MCP server over social accounts (deferred slice)
│   └── ui/             shared design system / React components
```

## 3. Slice 1 — Marketing site + booking

### 3.1 Business model

Combined offering: customers can **charter the whole voyage** OR **browse availability and reserve a cabin** on a scheduled departure, OR request a **bespoke** itinerary. One data model serves all three via a booking `type`.

### 3.2 Data spine (created now; later modules read it)

| Table | Purpose |
|---|---|
| `vessels` | Boat(s): story, specs, capacity, imagery |
| `voyages` | A scheduled expedition: vessel, itinerary, dates, status, pricing |
| `cabins` | Cabin types per vessel (suite, stateroom…) |
| `voyage_availability` | Which cabins are open on which voyage, and price |
| `customers` | Guests |
| `bookings` | customer ↔ voyage; `type` (`cabin`/`charter`/`bespoke`); `status` lifecycle; party size; totals |
| `booking_items` | Line items (cabins held) |
| `payments` | Stripe references (deposit, balance) |
| `enquiries` | Bespoke/charter leads for the Voyage Master |
| `users` + `roles` | RBAC seed: Owner, Voyage Master, Crew, Guest |

Booking `status` lifecycle: `enquiry → held → deposit_paid → confirmed → completed` (plus `expired`, `cancelled`).

### 3.3 Marketing site

Cinematic, editorial, distinctive (deliberately avoids generic AI aesthetic). Sections: **Hero → The Experience (story) → The Vessel → Voyages & Itineraries → Gallery → Testimonials → Who We Are → Enquire.** Content driven by Payload collections.

### 3.4 Booking flow — three doors, one feeling

Language is *reserve / hold / secure your place* — never "cart" or "checkout".

1. **Reserve a cabin** (scheduled voyage): browse voyages → live availability → choose cabin(s) → guest details → **48h soft-hold on the cabin** → **Stripe deposit secures it** (balance due later) → a confirmation that is *a moment*, not a receipt.
2. **Charter the whole voyage:** pick a voyage or propose dates → deposit-to-hold, or routed to enquiry for bespoke pricing.
3. **Bespoke / design your journey:** enquiry form → lead in `enquiries` → Voyage Master follows up personally.

**Confirmed decisions:** deposit model is IN (guests pay a Stripe deposit online to secure cabins).

### 3.5 Guest Voyage Portal — the emotional differentiator (IN slice 1)

After booking, the guest gets a **magic-link portal** (Supabase Auth, no password) that builds anticipation: live itinerary, countdown, what to pack, who's aboard, balance-due status, messages from the Voyage Master. This is the "look forward to the journey" experience no commodity booking system has.

### 3.6 Supporting pieces

- **Payments:** Stripe deposit via Payment Intents/Checkout; webhook confirms the booking and holds/releases inventory; expired holds auto-release cabins.
- **Emails:** transactional (confirmation, hold reminder, deposit receipt) via Cloudflare Email Service or Resend.
- **RBAC:** seeded in Supabase RLS now so the console & AI plug into an existing security model.

### 3.7 Explicitly NOT in slice 1

Operations console, AI agents/MCPs, social hub, Xero accounting. The data they will consume is created now and designed for them; their UIs are not built yet.

## 4. Build order

- **Phase 0 — Foundation:** monorepo (Turborepo+pnpm); Next.js on Cloudflare Workers; Supabase project (Postgres/Auth/RLS/Storage); Payload wired to Supabase Postgres; Stripe test mode; CI/CD via Cloudflare deploy template; data-spine schema + seeded roles. *(Includes the Payload-on-Workers Node-compat check.)*
- **Phase 1 — Marketing site:** design system + all sections, content from Payload.
- **Phase 2 — Booking flow:** voyage browsing, live availability, cabin reserve, 48h soft-hold, Stripe deposit, confirmation, transactional emails, auto-release of expired holds; charter & bespoke enquiry paths.
- **Phase 3 — Guest Voyage Portal:** magic-link, itinerary, countdown, what-to-pack, balance, messages.

**→ Slice 1 ships: a live, bookable, beautiful site.**

*Later slices (each its own spec → plan → build):* Operations Console → AI agents + MCPs → Social Hub → Xero adapter.

## 5. Out of scope (whole project, until explicitly specced)

Owning any accounting/tax logic; building a finance system; choosing the AI agent framework before its slice; social posting before its slice.
