# ED-3 Exclusion-Key Decision

Status: DECIDED (Product Owner). No code/schema/database changes performed by this record.
Resolves the open sub-question isolated in
`CLIENT_FINDER_PDEF_4_ED3_EXCLUSION_KEY_DECISION_PREPARATION.md` (established facts and engineering
analysis there remain in force and are not restated in full here).

## A. Decision

- **Selected option:** C — `visitor_id`
- **Decision ID:** ED-3-EXCLUSION-KEY-DEC-001
- **Decided by:** Product Owner (solo-operator authority, per
  `CLIENT_FINDER_PDEF_4_ED3_SOLO_OPERATOR_AUTHORITY_CONFIRMATION.md`)
- **Scope:** PCG-1, PCG-2, PCG-3A, PCG-3B only. No effect on PCG-4/5/6 (unchanged — those gates were
  never in ED-3's scope).
- **Rationale:** `visitor_id` is already present across the traffic path these four gates measure
  (`orders.visitor_id`, `funnel_events.visitor_id`, reachable on `payments` via `order_id → orders`)
  and requires no new identity architecture. `users.id` never enters that path at all (checkout is
  entirely anonymous/cookie-based regardless of auth state; the ED-2 anonymous→authenticated merge is
  deferred, not implemented). `customer_email` reaches `orders`/`payments` but cannot reach the
  `funnel_events` denominator used by PCG-3A/3B. ED-3's purpose is population cleanliness of
  launch-gate metrics (excluding known operator/QA traffic), which `visitor_id` satisfies without
  touching authentication, checkout identity, or customer-qualification semantics.

## B. Rejected Options

- **A — `users.id`:** Rejected. Not a reachability gap but a genuine absence — `orders` and `payments`
  have no `user_id` column, and the checkout/order-creation code path (`create-order/route.ts`,
  `createOrder.ts`, `orderRepository.ts`) never reads or stores the authenticated session's `users.id`
  regardless of login state. Adopting it would require implementing the deferred ED-2 merge and wiring
  auth identity into checkout — out of ED-3's scope.
- **B — `customer_email`:** Rejected as the sole key. It can filter PCG-1 (`orders`) fully and reach
  PCG-2/PCG-3A's payment side only via a new join to `orders` (not present in `pcg2.ts` today), but it
  cannot reach the `funnel_events` table at all — there is no email column there — so it cannot filter
  the PCG-3A/3B denominator (`upsell_viewed` events). Incomplete coverage disqualifies it.
- **D — Defer:** Rejected for now. The Product Owner chose to resolve the exclusion-key question rather
  than launch PCG-1/2/3A/3B without any QA-traffic exclusion.

## C. Operational Semantics

`visitor_id` is a stable, 2-year, `httpOnly` first-party cookie identifying a **browser/visitor
context**, minted once in middleware (`apps/web/src/server/visitor.ts`) and carried into
`orders.visitor_id` at checkout and `funnel_events.visitor_id` on the `upsell_viewed` event.

**Explicit limitation:** it identifies a controlled browser context, not a human or an authenticated
identity. It is not equivalent to `users.id` and must not be treated as such. Consequently, future QA
testing must be performed from a dedicated QA browser/profile/context whose `visitor_id` is adopted as
the known test-traffic identifier; if that cookie is cleared or a different browser/profile is used,
the resulting traffic will carry a different `visitor_id` and will not be excluded. This is an
operational discipline requirement for whoever runs QA traffic, not a system guarantee.

This decision changes none of: authentication semantics, checkout identity semantics, customer
qualification, product behavior, PCG definitions, launch thresholds, ED-2, or Q10.

## D. Implementation Consequences (not performed — planning only)

Minimum surface that will eventually need modification to enforce this exclusion:

- `packages/core-launch-gates/src/pcg1.ts` — add `AND visitor_id NOT IN (<allowlist>)` (or `NOT IN`
  against a parameterized exclusion list) to its `orders` count query.
- `packages/core-launch-gates/src/pcg2.ts` — currently queries `payments` alone with no join to
  `orders`; would need a new `JOIN orders o ON o.id = p.order_id` plus the same `visitor_id` exclusion,
  since `payments` carries no `visitor_id` of its own.
- `packages/core-launch-gates/src/pcg3.ts` (shared by PCG-3A/3B) — add the exclusion filter to both
  the `funnel_events` denominator query and the `payments JOIN orders` numerator query.
- A source for the excluded `visitor_id` value(s) — e.g. an env-configured list consumed by the worker,
  or a small dedicated allowlist table — not yet decided; no schema change is strictly required.
- `packages/core-launch-gates/src/types.ts` — only if the exclusion list needs to be threaded through
  `SqlExecutor`-calling signatures as a new parameter.

No other files are implicated. Phase 9 integration tests are not touched by this decision.

## E. QA Provisioning

QA identity/visitor provisioning remains pending implementation planning. It is not created by this
record.
