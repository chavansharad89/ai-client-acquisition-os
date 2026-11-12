# WEB ROOT ROUTE COLLISION (F-23) — PRODUCT OWNER DECISION

**Decision ID:** F23-ROOT-ROUTE-PO-DEC-001
**Related finding:** F-23 (`requirement/AI Client Acquisition OS — Product Requirements Document V2.1.md`, `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md`): *"`apps/web/app/page.tsx` and `apps/web/app/(dashboard)/page.tsx` both resolve to `/`; `next build` fails at prerender."*
**Decision title:** The root URL `/` is owned by the existing ₹99 funnel; the Client Acquisition OS dashboard moves to `/dashboard`
**Date:** 2026-10-24
**Authority:** Product Owner
**Status:** DECIDED
**Scope of this record:** Governance-only, routing/build-conflict resolution. Resolves F-23 and nothing else. Does **not** decide dashboard authentication, dashboard authorization, ₹1,499-gates-dashboard-access, Client Finder access gating, any commercial entitlement, any Global Entity behavior, or any Client Finder discovery/research/ranking behavior.

## Context

F-23 has been an open, documented fact in the PRD across at least two revisions (V2.1 and V2.2) with no PO decision or architecture decision resolving it anywhere in `requirement/`. `apps/web/app/page.tsx` (the ₹99 `FunnelEntryPage`) and `apps/web/app/(dashboard)/page.tsx` (the `DashboardPage`, i.e. the Client Acquisition OS operator cockpit) both resolve to the literal route `/`, since a parenthesized route-group segment does not appear in the URL. This collision deterministically fails `next build` during static-page generation, blocking production builds of `apps/web` entirely.

A read-only routing-ownership audit (prior session, same date) established, from repository evidence:

- `apps/web/app/page.tsx` carries an explicit, reasoned product/conversion rationale in its own code comment for owning the uncluttered root.
- Four independent existing call sites (`apps/web/app/access/page.tsx`, `apps/web/app/checkout/success/page.tsx`, `apps/web/app/checkout/[productId]/page.tsx`, `apps/web/src/components/ProductLanding.tsx`) already link to `/` expecting the funnel/marketing home.
- `/starter-kit` already exists as a separate presentation of the same ₹99 product (`ai_income_99` via `ProductLanding`), but this does not justify relocating the root funnel — it merely shows the ₹99 offer already has another home if ever needed.
- Client Finder's actual login flow (`apps/web/src/components/client-finder/LoginForm.tsx`) redirects to `/searches/new` on success; it does not depend on `/` or on any dashboard route.
- No `/dashboard` route exists anywhere in the repository today.
- No repository links or tests depend on `/dashboard`, and none depend on the dashboard being served at `/`.
- The dashboard has no implemented authentication or authorization gate today (PRD facts F-07, F-08).
- Whether ₹1,499 purchase gates dashboard/Client Finder access remains a separate, explicitly open product question (OQ-3) — unaffected by this decision.
- Moving the dashboard to `/dashboard` is the lowest-risk resolution: zero existing links or tests reference the old or new dashboard path, while four existing links already assume `/` is the funnel.

## PO decision

**F-23 is resolved as follows:**

1. The root URL `/` remains owned by the existing ₹99 `FunnelEntryPage`: `apps/web/app/page.tsx`.
2. The Client Acquisition OS dashboard must no longer resolve to `/`.
3. The dashboard route changes from `apps/web/app/(dashboard)/page.tsx` to `apps/web/app/dashboard/page.tsx`, so that the dashboard's URL becomes `/dashboard`.
4. This decision is solely a routing/build-conflict resolution.
5. This decision does **not** decide: dashboard authentication; dashboard authorization; whether the ₹1,499 purchase gates dashboard access; Client Finder access gating; any commercial entitlement; any Global Entity behavior; or any Client Finder discovery/research/ranking behavior.
6. Existing Client Finder routes (`/login`, `/opportunities`, `/opportunities/[id]`, `/searches/[id]`, `/searches/new`) remain unchanged.
7. Existing ₹99 funnel behavior and the root conversion flow remain unchanged.
8. No redirect or deep-link behavior is invented for a historical dashboard URL at `/`. Repository evidence does not establish that a production dashboard ever actually served traffic at `/` — the build has been failing with both files present, so neither route can have been live together — and this decision does not assume otherwise.
9. No other route changes are authorized by this decision.

## Exact authoritative wording

> The root URL `/` remains owned by the existing ₹99 FunnelEntryPage: `apps/web/app/page.tsx`.
>
> The Client Acquisition OS dashboard must no longer resolve to `/`.
>
> The dashboard route is changed from `apps/web/app/(dashboard)/page.tsx` to `apps/web/app/dashboard/page.tsx`, so that the dashboard URL is `/dashboard`.
>
> This decision is solely a routing/build-conflict resolution.
>
> This decision does NOT decide dashboard authentication, dashboard authorization, whether the ₹1,499 purchase gates dashboard access, Client Finder access gating, any commercial entitlement, any Global Entity behavior, or any Client Finder discovery/research/ranking behavior.
>
> Existing Client Finder routes remain unchanged.
>
> Existing ₹99 funnel behavior and root conversion flow remain unchanged.
>
> No redirect or deep-link behavior is invented for a historical dashboard URL, because repository evidence does not establish that a production dashboard previously existed at `/`.
>
> No other route changes are authorized by this decision.

## Mandatory boundaries on this decision

1. This is a governance/routing decision only.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No deterministic signal, scoring rule, weight, threshold, ranking algorithm, or AI-escalation mechanism is authorized, changed, or reinterpreted by this decision.
4. No discovery/research/qualification/opportunity behavior is changed by this decision.
5. No Global Entity architecture, identity-resolution, or privacy behavior is changed by this decision.
6. No commercial model (₹99 / ₹499 / ₹1,499) rule, SKU, entitlement, or stacking behavior is changed by this decision.
7. This decision does not resolve, close, or answer OQ-3 (whether Client Finder access is gated behind the ₹1,499 purchase) or any other open product question. All such items remain exactly as open as they were before this record.

## Explicit non-decisions

This record does **not** decide or authorize:

- Any dashboard authentication or authorization mechanism.
- Whether the ₹1,499 purchase gates dashboard or Client Finder access (OQ-3 remains open).
- Any commercial entitlement, SKU, or pricing-tier behavior.
- Any Global Entity architecture or behavior.
- Any Client Finder discovery, research, qualification, or ranking behavior.
- Any redirect or deep-link-preservation behavior for a historical dashboard URL.
- Any technical implementation, code, configuration, schema, or data change.

## Consequences

- `apps/web/app/page.tsx` continues to be the single authoritative owner of `/`, matching the navigation that already assumes this (`access`, `checkout/success`, `checkout/[productId]`, `ProductLanding`).
- Once implemented, the dashboard becomes reachable at `/dashboard` rather than `/`, resolving the build failure. It remains unauthenticated at that new path until a separate authentication/authorization decision is made — this record does not change that.
- F-23 is closed as a governance matter. The underlying `next build` failure is not yet fixed by this record alone — that requires the separate implementation step described below.

## What remains to be decided

- Dashboard authentication and authorization (unaffected, still fully open).
- OQ-3: whether ₹1,499 purchase gates dashboard/Client Finder access (unaffected, still fully open).
- Any future product decision about the dashboard's commercial tier or audience.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED BY THIS RECORD.** This decision resolves the routing/build-conflict question only. Moving `apps/web/app/(dashboard)/page.tsx` to `apps/web/app/dashboard/page.tsx` requires separate authorization before any file is changed. No code, configuration, `.env`, database schema, or data has been changed as part of recording this decision. Nothing has been committed or pushed.
