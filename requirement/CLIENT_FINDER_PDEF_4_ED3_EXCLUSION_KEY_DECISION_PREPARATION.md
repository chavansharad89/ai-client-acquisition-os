# ED-3 Exclusion-Key Decision Preparation

Status: PREPARATION ONLY — no decision made, no code/schema/database changes performed.
Supersedes nothing; narrows `CLIENT_FINDER_PDEF_4_ED3_OPS_SECURITY_INPUT_REQUEST.md` and
`CLIENT_FINDER_PDEF_4_ED3_OPERATIONAL_INPUT_DECISION_PREPARATION.md` by isolating one
previously-unresolved sub-question: **which identifier ED-3's allowlist should technically key on.**

## 1. Established facts (repository evidence, not opinion)

- ED-3's architecture is decided: "Option B — narrow, known-identifier allowlist (internal IPs,
  known QA/test accounts)" (`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`, §7).
  This decision is identifier-type-agnostic; it never names a specific field or table.
- ED-3 is scoped to PCG-1/2/3A/3B specifically (`CLIENT_FINDER_PDEF_4_ED3_OPS_SECURITY_INPUT_REQUEST.md`
  §1, §5); PCG-4/5/6 are explicitly out of scope.
- The concrete identifier key was never decided. Every ED-3 record to date treats "user id" /
  "email" as illustrative examples only, not a decided value
  (`CLIENT_FINDER_PDEF_4_ED3_OPERATIONAL_INPUT_DECISION_PREPARATION.md` §4).
- PCG-1 (`orders`), PCG-2 (`payments`), PCG-3A/3B (`funnel_events` + `payments JOIN orders`) never
  reference `users.id` anywhere in their queries (`packages/core-launch-gates/src/pcg1.ts`,
  `pcg2.ts`, `pcg3.ts`). `orders` and `payments` have no `user_id` column at all.
- The checkout path (`apps/web/app/api/payments/create-order/route.ts`,
  `packages/core-payments/src/createOrder.ts`, `orderRepository.ts`) never reads, passes, or stores
  `users.id` — it is driven entirely by a `visitor_id` cookie, regardless of whether the visitor is
  authenticated. `customer_email` on `orders` is a user-typed form field, not a session value.
- `visitor_id` is a stable, 2-year, `httpOnly` first-party cookie (`apps/web/src/server/visitor.ts`),
  minted once in middleware and attached to `orders.visitor_id` at checkout
  (`createOrder.ts:139`) and to `funnel_events.visitor_id` on the `upsell_viewed` event
  (`apps/web/app/upsell/[productId]/page.tsx:56-65`) — the only funnel event PCG-3A/3B read.
  `payments` has no `visitor_id` column, but is joinable to `orders.visitor_id` via `payments.order_id`.
- No code anywhere links `visitor_id` to `users.id`. The anonymous→authenticated merge is explicitly
  deferred as "ED-2" (`packages/db/prisma/migrations/0031_funnel_events/migration.sql:15-18`,
  `0032_order_visitor_id/migration.sql:7-9`) and not implemented.
- Net effect: **`users.id` cannot exclude anything from PCG-1/2/3A/3B today** — those code paths never
  see it. `visitor_id` is the only identifier present (directly or via one join) across all four gates'
  source tables.

## 2. Engineering recommendation (not a decision)

Use `visitor_id` as ED-3's exclusion key for PCG-1/2/3A/3B, with these caveats surfaced for the PO:

- **Reliability as a "known QA identity":** `visitor_id` is a long-lived cookie, not an authenticated
  account — it identifies a *browser*, not a *person*. It will change if the QA operator clears
  cookies, uses a different browser/profile, or tests in incognito. Treating it as "known" requires
  the PO to deliberately keep and reuse one QA browser profile, which is an operational discipline
  item, not a code guarantee.
- **Required code changes:** `pcg1.ts`/`pcg2.ts` would need a `WHERE visitor_id NOT IN (...)` (PCG-1
  directly; PCG-2 would newly need a join from `payments` to `orders` to reach `visitor_id`, which it
  does not currently have). `pcg3.ts`'s denominator (`funnel_events`) and numerator
  (`payments JOIN orders`) would both need the same filter added.
- **Required schema changes:** None strictly required — a small allowlist could live as an env-configured
  list of excluded `visitor_id` values, consistent with Option B's "narrow, known-identifier allowlist"
  framing, with no new table needed.
- **Privacy/data-quality implications:** Low — `visitor_id` is already a first-party cookie used for
  this exact population; no new PII is introduced by using it as an exclusion key.
- **Distinguishing QA from real customers:** Works only as long as the QA operator's `visitor_id` is
  not reused by real traffic (extremely unlikely given it's a random UUID) and the operator does not
  rotate browsers/profiles without updating the allowlist.
- **Impact on existing gate semantics:** None — this only subtracts specific known rows from existing
  counts; it does not change what is counted.
- **Implementation complexity:** Low-to-moderate — mechanical filter additions to four files, plus
  one new join in `pcg2.ts`.

`users.id` is not a viable alternative without first implementing ED-2 (the anonymous→authenticated
merge) and threading authenticated identity through the checkout path — a materially larger change
than ED-3 was ever scoped to require.

## 3. Product Owner decision required

**Question: What canonical identifier should ED-3 use to exclude Product Owner/operator QA activity
from PCG-1/2/3A/3B?**

| Option | Affected PCGs it can cover | Code changes | Schema changes | Reliability | Complexity |
|---|---|---|---|---|---|
| A. `users.id` | None (not present in any PCG-1/2/3A/3B source table or query) | Would require wiring auth identity into checkout (ED-2 scope) | Possible new FK/column on `orders`/`payments` | N/A — not reachable today | High (out of ED-3's original scope) |
| B. `customer_email` | PCG-1 (orders) fully; PCG-2/3A numerator partially (payments has no email column — needs join); PCG-3A/3B denominator (funnel_events) not reachable at all — no email column | Joins + filters in pcg1/2/3; cannot cover funnel_events without a new column | None, but funnel_events gap remains unresolved | Moderate — user-typed, could vary between test purchases | Moderate |
| C. `visitor_id` (recommended above) | All four — directly on orders/funnel_events, via join on payments | Filters in pcg1/pcg3 directly; new join + filter in pcg2 | None required | Moderate — tied to browser/cookie persistence, not identity | Low-moderate |
| D. Defer ED-3 until a suitable identifier exists | None — gates launch without any QA exclusion | None | None | N/A | None (keeps gates unfiltered) |

This record does not select an option. The Product Owner (operating under the solo-operator authority
already confirmed in `CLIENT_FINDER_PDEF_4_ED3_SOLO_OPERATOR_AUTHORITY_CONFIRMATION.md`) must choose one,
or supply a different repository-supported candidate.
