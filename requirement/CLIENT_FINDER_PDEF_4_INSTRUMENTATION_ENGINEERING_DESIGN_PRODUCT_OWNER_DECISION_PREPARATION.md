# Client Finder / Client Intent Discovery — PDEF-4 Instrumentation Engineering Design & Product Owner Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-ENGINEERING-DESIGN-PRODUCT-OWNER-DECISION-PREPARATION-001`
**Date:** 2026-10-04
**Type:** Read-only decision-**preparation** questionnaire. **This record creates, implies, infers, or authorizes
no engineering decision, no Product Owner decision, no implementation, no instrumentation, no schema/migration
change, no validation execution, no billing/credit-ledger change, and no deployment/release/launch action of any
kind.** Every ED-1 through ED-13 item ends in a blank `PRODUCT OWNER / ENGINEERING SELECTION` field; PO-D1 and
PO-D2 are preserved as separate, unresolved, explicitly-marked `PENDING PRODUCT OWNER DECISION` items with no
option chosen.

---

## 1. Provenance

| Field | Value |
|---|---|
| Requested by | Project owner, via task instruction: "prepare the engineering-design decision questionnaire for the 13 engineering decisions identified in §9 [of the engineering-design preparation record], plus the 2 explicitly flagged Product Owner dependencies in §14." Explicitly preparation-only; explicitly instructed not to convert an engineering recommendation into Product Owner policy, and not to guess the numeric sample floor. |
| Prepared by | Claude, performing read-only repository/document research and preparation only. No engineering-implementation authority and no Product Owner authority is exercised or implied by this record. Where an "Analyst/engineering recommendation" is given below, it is explicitly labeled as a recommendation, not an adopted decision, per the task's own instruction. |
| Immediate source record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION_PREPARATION.md` (`CLIENT-FINDER-PDEF-4-INSTRUMENTATION-ENGINEERING-DESIGN-DECISION-PREPARATION-001`), §9 (13 engineering decisions) and §14 (2 flagged governance dependencies) — restated as a selectable questionnaire below, with repository evidence re-verified (not merely re-cited) for this record. |

## 2. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` — verified unchanged before and after writing this record |
| Staged files | 0, before and after |
| Untracked files present before this record | 18 (per `git status --porcelain`), including the governing policy and engineering-design preparation records this task reads from |
| Existing instrumentation Product Owner decision record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` — confirmed present, DECIDED |
| Existing instrumentation Product Owner decision-preparation record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md` — confirmed present, read-only |
| Existing instrumentation engineering-design preparation record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION_PREPARATION.md` — confirmed present, read-only, this record's direct source |
| Existing engineering-design-**questionnaire**/Product-Owner-selectable record (this record's own path) | Confirmed **absent** prior to this task |
| File created by this task | this file only |

No baseline discrepancy was found; proceeding was not blocked.

## 3. Governing records (read and reconciled; hashes verified unchanged before and after)

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION_PREPARATION.md` | `e23e9cc6a96c0c32355112fec0bbcf53e908128e7b3d0e9a5722acaaecc870ca` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md` | `65691c89c31f8fe5e4068dfb10077f4f306acaad2c0c355ceab5db890abe9449` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` | `b3d2d2ae99b1a61810274ad043101c73d28daab7377b07ded7e9433b6b87598e` |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `requirement/MVP_SCOPE_BOUNDARY.md` | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |

All ten were inspected for this record; none is modified, reopened, or superseded by anything below.

## 4. The three decision classes (restated, governing how this record is structured)

1. **Already-decided Product Owner policy** — immutable input, not reopened anywhere below (e.g., Q-1 through
   Q-12 of `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001`, and all of PDEF-2/3/4/entitlement-stacking
   carried forward by it).
2. **Engineering design decisions (ED-1 through ED-13)** — Claude/engineering may recommend an option, with
   alternatives, trade-offs, and affected repository areas; each still ends in a blank selection field and
   requires explicit adoption before implementation. A recommendation is never itself an adoption.
3. **Remaining Product Owner policy dependencies (PO-D1, PO-D2)** — kept separate from ED-1..13, explicitly marked
   `PENDING PRODUCT OWNER DECISION`, with no option chosen and no numeric value inferred.

## 5. Repository evidence re-verified for this record (not merely re-cited)

Per the task's explicit instruction not to assume a capability exists merely because a previous report says so,
the following claims load-bearing for ED-1..13 were independently re-checked against the current working tree at
the unchanged baseline HEAD:

- `packages/core-payments/src/webhookHandler.ts:48` — `export const SUPPORTED_EVENTS = ['payment.captured'] as
  const;` — confirmed: refund events are not in this list.
- `tests/contract/razorpay-webhook.contract.test.ts:8-10` — confirmed three `it.todo` stubs, including
  `it.todo('accepts a real refund.processed payload shape')` — confirmed still unimplemented.
- `apps/web/src/analytics/funnelEvents.ts` — confirmed an explicit `PII POLICY` comment block and a live
  `assertNoPii()` function with a `PII_KEYS` denylist, enforced on browser-emitted event payloads.
- `packages/rate-limit/src/policy.ts` — confirmed this is a per-IP/per-email throttle on the payment-creation
  endpoint, explicitly designed around "stop abuse without breaking a real retrying customer" — confirmed it is
  not a bot/internal-traffic classifier and makes no visitor-qualification decision.
- `packages/db/prisma/schema.prisma:171,174` — confirmed `model WebhookEvent { ... razorpayEventId String @unique
  @map("razorpay_event_id") ... }` — the exact idempotency pattern available to reuse for refund-event dedup.
- `requirement/MVP_SCOPE_BOUNDARY.md` §6.5 ("SaaS": recurring subscriptions, usage-based billing, team workspaces,
  enterprise accounts, advanced quotas, subscription plans) and §6.7 ("Advanced analytics": revenue optimization,
  cohort analytics, advanced attribution, predictive conversion models) — confirmed verbatim at lines 292–313.
- `packages/core-qualification/src/types.ts` — re-confirmed `QUALIFICATION_CRITERIA = ['NEED_DETECTED',
  'EVIDENCE_PRESENT', 'CATEGORY_PLAUSIBLE']`, keyed to `prospectId`, with no field representing a searching user's
  own configured service/customer/value criteria — consistent with the engineering-design preparation record's
  "NOT EQUIVALENT" finding, which this record treats as repository evidence, not as something to re-litigate.
- `packages/core-search/src/types.ts:9` — re-confirmed `SearchStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' |
  'FAILED' | 'CANCELLED'` — a job-lifecycle field, with no separate "activation" concept.
- `packages/core-reconciliation/src/detection.ts` — re-confirmed the half-open (`created_at >= $1 AND created_at <
  $2`) windowed, read-only, PII-allowlisted query pattern, and re-confirmed (via `grep -rli "rolling"` across
  `packages/` and `apps/`, zero matches) that no generalized rolling-window utility exists anywhere.

No claim below rests solely on the prior preparation record's say-so without this independent re-check.

## 6. Scope boundary notice (MVP_SCOPE_BOUNDARY.md, not reopened)

Per `MVP_SCOPE_BOUNDARY.md` §6.5 and §6.7 (quoted in §5 above), **recurring subscriptions, usage-based billing,
team workspaces, enterprise accounts, advanced quotas, subscription plans, revenue optimization, cohort analytics,
advanced attribution, and predictive conversion models are explicitly OUT OF MVP.** Every ED item below that
touches analytics/reporting is scoped strictly to the basic PCG-1..6 measurement already mandated by PDEF-3/PDEF-4
— counting, windowing, and auditing a fixed set of already-decided metrics — never to building a cohort-analytics,
attribution-modeling, or revenue-optimization capability. Any engineering option below that would effectively
build such a capability is labeled `OUT OF MVP / FUTURE` rather than presented as a normal implementation choice.

---

## 7. ED-1 through ED-13

---

### ED-1 — Durable funnel/visitor event storage architecture

1. **Current governing state:** No policy decision specifies *how* events are stored — Q-1/Q-2 of
   `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001` decide *what* counts as qualifying, not where the
   underlying events live. Not reopened.
2. **Repository evidence:** `apps/web/src/analytics/events.ts`/`funnelEvents.ts` define browser-emittable event
   *names* only (`funnel_entry_viewed`, etc.); no durable server-side event table exists in
   `packages/db/prisma/schema.prisma`; the only durable, queryable event table in the system, `meta_events`, is
   scoped to purchase-class Meta CAPI dispatch, not general funnel events (re-confirmed, §5).
3. **Exact engineering problem:** PCG-1 (and the exposure side of PCG-3A/3B, ED-5) requires a durable, queryable
   record of visitor/funnel events that does not exist today. A storage architecture must be chosen before any
   event can be persisted.
4. **Decision required:** Where and how funnel/visitor events are durably stored.
5. **Option A:** A new, dedicated append-only event table (e.g., one row per event, generic `event_type`/`payload`
   columns, indexed by visitor id and timestamp).
6. **Option B:** Extend the existing `meta_events` table/pattern to a general-purpose event log, rather than
   building a parallel structure.
7. **Option C:** A columnar/structured-per-event-type set of tables (one table per event type: visitor-qualified,
   offer-exposed, etc.) rather than one generic event table.
8. **Engineering trade-offs:** Option A is simplest to add new event types to later but makes type-specific
   querying (e.g., "all offer-exposures for ₹1,499") rely on payload-field filtering rather than typed columns.
   Option B reuses existing infrastructure but risks conflating a purchase-dispatch log with a general funnel-event
   store, which were built for different purposes and retention needs. Option C gives the strongest typed-query
   ergonomics per gate but is the most up-front schema work and the least flexible if a new event type is needed
   later.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option A, generic append-only, is the most common
   pattern for this class of problem and defers type-specific optimization until query patterns are known from
   real usage — but this is a recommendation only, not an adoption.
10. **Affected files/modules/tables if known:** `packages/db/prisma/schema.prisma` (new table/migration);
    `apps/web/src/analytics/events.ts`/`funnelEvents.ts` (server-side persistence call site); a new
    package or module (not yet named) to own write/query access.
11. **Dependencies:** Blocks ED-2 (identity), ED-3 (bot exclusion), ED-5 (exposure persistence), ED-7 (rolling
    window needs something to query).
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. No schema or migration authority is
granted by this record.**

---

### ED-2 — Anonymous visitor identity & authenticated-user linkage

1. **Current governing state:** Q-1/Q-2 (DEC-001) do not require a visitor-to-authenticated-user merge for PCG-1
   itself (aggregate, no eligibility beyond funnel-entry + demonstrated intent). The engineering-design
   preparation record's §9 item 3 found this linkage is **not required by any decided gate's definition** — it
   would matter only for a funnel analysis outside the six PCGs, which is not in scope here. Not reopened.
2. **Repository evidence:** `users.id` (migration `0012_user_identity`) and `entitlements.customer_email`
   (migration `0004_entitlements`) are bridged only by email equality; no anonymous-visitor-id → authenticated-user
   merge mechanism exists anywhere (re-confirmed, prior record §5, not independently re-greppable beyond schema
   inspection already performed).
3. **Exact engineering problem:** If a visitor identity scheme (ED-ancillary to ED-1) is introduced, a decision is
   still needed on whether/how it is later linked to `users.id`/`entitlements.customer_email`, purely for
   implementation completeness — even though no decided gate strictly requires it.
4. **Decision required:** Whether to build a visitor-to-user merge mechanism now, defer it, or omit it entirely
   given no gate currently needs it.
5. **Option A:** Build a merge mechanism now (e.g., merge-on-login by matching a session cookie id to the newly
   authenticated `users.id`), for completeness and future-proofing.
6. **Option B:** Defer entirely — build only what PCG-1/2/3A/3B strictly require (a standalone visitor id for
   ED-1, and separately, an authenticated/purchase identity that already exists), and do not build a merge path
   until a specific future gate or report needs it.
7. **Option C:** Do not build any visitor-identity-to-user merge at all; treat visitor identity (ED-1) and
   purchase/entitlement identity as permanently separate concepts, since no decided gate joins them directly (PCG-1
   is pre-purchase and aggregate; PCG-2+ already key off `entitlements.customer_email`/`Order`).
8. **Engineering trade-offs:** Option A is more work now for a capability nothing currently requires — a form of
   scope creep risk relative to MVP_SCOPE_BOUNDARY.md's general caution against building for hypothetical future
   needs. Option B keeps a door open cheaply (a session-id field reserved for later use) without building the merge
   logic yet. Option C is simplest but could make a later governance decision that *does* need this linkage more
   expensive to retrofit.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option B — reserve the capability (store a session/
   visitor id alongside future authenticated actions) without building the full merge path, since no decided gate
   requires it and building it fully now would be exactly the kind of "design for hypothetical future
   requirements" this project's own engineering discipline cautions against. Not an adoption.
10. **Affected files/modules/tables if known:** Whatever table ED-1 introduces; potentially a nullable
    `linked_user_id` column reserved but unused until needed.
11. **Dependencies:** Depends on ED-1's storage architecture being chosen first.
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted.**

---

### ED-3 — Bot/internal-traffic exclusion mechanism

1. **Current governing state:** Q-1 (DEC-001) explicitly decided **no eligibility criterion beyond funnel-entry +
   demonstrated intent** for PCG-1. The engineering-design preparation record (§9 item 4) flagged that any
   exclusion mechanism must not become a de facto fourth eligibility condition. Not reopened — this ED item
   concerns only mechanism design, not whether to exclude bots at all (which the governing policy already leaves
   open as a non-issue by not adding a criterion).
2. **Repository evidence:** Only generic per-IP/per-email rate limiting exists (`packages/rate-limit/src/policy.ts`,
   re-confirmed §5) — a throttle against abuse, not a classifier distinguishing bot/QA/internal traffic from a
   genuine visitor.
3. **Exact engineering problem:** Whether, and how, to filter out non-visitor traffic (crawlers, internal QA
   accounts, synthetic monitoring) from the PCG-1 count, without that filter becoming an unauthorized eligibility
   criterion.
4. **Decision required:** Whether a bot/internal exclusion mechanism is built at all, and if so, which kind.
5. **Option A:** No exclusion mechanism at all — rely solely on Q-1's decided definition (funnel-entry +
   demonstrated intent); accept that any crawler satisfying both conditions would count (unlikely in practice,
   since "demonstrated intent" implies an interactive action a crawler would not typically perform).
6. **Option B:** A narrow allowlist-based exclusion (known internal IP ranges, known QA/test account identifiers)
   — excludes only traffic the team itself knows is not a real visitor, not a behavioral heuristic.
7. **Option C:** A behavioral/heuristic bot-detection mechanism (user-agent analysis, request-pattern analysis) —
   broader coverage, but risks excluding genuine visitors who happen to match a heuristic, which would effectively
   change who counts as "qualified" under Q-1's own terms.
8. **Engineering trade-offs:** Option A is simplest and truest to the letter of Q-1's decision, but risks some
   synthetic traffic inflating the count if demonstrated-intent events are easy to trigger automatically. Option B
   is narrow and low-risk of accidentally changing the qualified population, but only catches *known* non-visitor
   traffic. Option C has the most abuse-resistance but the highest risk of inadvertently reopening Q-1 in effect
   (excluding a real visitor who looks bot-like).
9. **Analyst/engineering recommendation (NOT A DECISION):** Option B — a narrow, known-identifier allowlist
   exclusion — because it is the only option that cannot, by construction, change who counts as "qualified" under
   Q-1's decided terms; Option C's heuristic risk is flagged as a reason to avoid it absent a specific observed
   abuse pattern. Not an adoption.
10. **Affected files/modules/tables if known:** `packages/rate-limit/src/policy.ts` (as a reference pattern, not
    directly reused — that package throttles, it does not classify); whatever module eventually computes PCG-1.
11. **Dependencies:** Depends on ED-1 (an event store to apply the exclusion against).
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. If any chosen mechanism is later found
to change who counts as "qualified" under Q-1's decided terms, that effect — not the mechanism itself — would need
to be flagged back as a potential policy question, not decided unilaterally.**

---

### ED-4 — Event schema and immutable-event semantics (general)

1. **Current governing state:** The §3 cross-cutting refund principle (DEC-001) and PDEF-4 §6.6 require that a
   transaction/event be immutable once its window closes. No policy decision specifies the mechanical shape
   (append-only vs. mutable-with-audit-trail) that achieves this. Not reopened.
2. **Repository evidence:** No existing event table of this kind exists to model after (ED-1); the closest
   existing immutability-adjacent pattern is `WebhookEvent.razorpayEventId @unique` (dedup, not an append-only
   history) and `entitlements`'s `granted_at`/`revoked_at` pair (state transition via a new row vs. a mutated
   field — re-confirmed structurally present per the engineering-design preparation record, not re-verified at
   the SQL-migration-text level in this pass since it was not load-bearing for a different ED item here).
3. **Exact engineering problem:** How to ensure that once a window closes, no later write can silently alter a
   PCG's computed result for that window — purely a mechanical/architectural question, not a new policy.
4. **Decision required:** Whether windows are enforced immutable by (a) persisting a frozen snapshot per closed
   window, or (b) recomputing on demand from raw events every time and trusting that the window-boundary query
   itself is deterministic and stable.
5. **Option A:** Persist an explicit snapshot row per gate per closed window (value, denominator, timestamp of
   computation) — the snapshot itself becomes the immutable record of "what this window's result was."
6. **Option B:** Never snapshot; always recompute from raw events on demand, relying on the window boundary
   (`created_at < window_end`) alone plus raw-event immutability (events are never updated/deleted) to guarantee a
   stable result.
7. **Option C:** Hybrid — recompute on demand for open/recent windows, snapshot automatically once a window
   formally closes.
8. **Engineering trade-offs:** Option A gives the strongest audit trail (§13 of the engineering-design preparation
   record: "why was this user counted") at the cost of an extra write path and a new table. Option B is simpler to
   build initially but makes "immutable" an emergent property of raw-event retention discipline rather than an
   explicit guarantee, and recomputation cost grows with retained event volume over time. Option C balances both
   but is the most moving parts.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option A — explicit snapshotting — because PDEF-4
   §6.10 requires independent validation of the four blocker gates, and a validator needs a concrete, retrievable
   "this is what was computed and when" record to check, not a re-derivation that could silently change if the
   recompute logic itself is later modified. Not an adoption.
10. **Affected files/modules/tables if known:** A new snapshot table (name not proposed here); whatever module
    computes each PCG.
11. **Dependencies:** Depends on ED-1 and ED-7 (rolling-window computation) existing first.
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted.**

---

### ED-5 — Tier-specific offer-exposure persistence (PCG-3A/3B)

1. **Current governing state:** Q-5/Q-6 (DEC-001) decide "exposed" = tier-specific offer screen rendered
   (impression-based), with first-exposure controlling window attribution. Not reopened — this ED item is only
   about how that decided definition gets persisted.
2. **Repository evidence:** `upsell_viewed{productId, fromTier}` exists as a browser-emittable event *name* only
   (`apps/web/src/analytics/events.ts`); not persisted server-side anywhere (re-confirmed in the prior record's §5;
   consistent with this task's independent spot-checks of adjacent files).
3. **Exact engineering problem:** Whether to persist the existing `upsell_viewed` event as-is (adding server-side
   durability) or introduce a new, differently-shaped persisted event specifically for exposure.
4. **Decision required:** The persisted exposure-event's shape/source.
5. **Option A:** Persist `upsell_viewed` exactly as currently named/shaped, simply adding server-side durability
   (no new event name).
6. **Option B:** Introduce a new, dedicated persisted event type (e.g., distinct from the browser contract) scoped
   specifically to "tier offer rendered," decoupling the browser-analytics contract from the commercial-gate
   evidence store.
7. **Option C:** Reuse `upsell_viewed`'s name but extend its schema with additional fields the browser contract
   does not currently carry (e.g., a server-resolved visitor id), rather than inventing a wholly new event or
   leaving the existing one unchanged.
8. **Engineering trade-offs:** Option A is the least new surface area but ties a commercial-gate's evidence
   directly to a browser-analytics contract that could change for unrelated (e.g., marketing-dashboard) reasons.
   Option B decouples cleanly but duplicates data capture for what is conceptually the same moment. Option C is a
   middle ground but requires the browser event to safely carry a field it does not today without violating the
   existing `assertNoPii` boundary (re-confirmed §5) — any new field must remain PII-free.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option C — extend `upsell_viewed`'s persisted form
   with a server-resolved (not client-supplied) visitor/session id, consistent with the existing pattern elsewhere
   in the codebase of resolving sensitive/authoritative fields server-side rather than trusting the client (e.g.,
   `createOrderRequestSchema.strict()`'s server-resolved amount/tier, per the earlier instrumentation preparation
   record). Not an adoption.
10. **Affected files/modules/tables if known:** `apps/web/src/analytics/events.ts` (event definition);
    `packages/db/prisma/schema.prisma` (new persistence); whichever module ED-1 introduces.
11. **Dependencies:** Depends on ED-1 (storage) and, for full effect, ED-2 (identity, if cross-session exposure
    tracking is wanted — though Q-6 only requires first exposure per visitor, not cross-session merge).
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. No instrumentation authority is
granted by this record.**

---

### ED-6 — Refund webhook ingestion and idempotency

1. **Current governing state:** Q-11/Q-12 (DEC-001) decide the refund-rate *policy* (binary, any-amount-counts,
   economic finality, pre-close-only correction). This ED item concerns only the ingestion mechanism, not the
   policy. Not reopened.
2. **Repository evidence:** `SUPPORTED_EVENTS = ['payment.captured']` only (re-confirmed §5); the refund payload
   shape is partially known via `packages/core-payments/src/webhookRetention.ts`'s retention-allowlist (references
   `amount_refunded`, `refund_status`, `payload.refund.entity.*`, per the prior record, not independently
   re-opened in this pass since it was not load-bearing beyond confirming the shape is *known*, not implemented);
   `WebhookEvent.razorpayEventId @unique` (re-confirmed §5) is the exact existing idempotency pattern available to
   extend to refund events.
3. **Exact engineering problem:** How to extend webhook ingestion to accept and process refund events without
   double-counting redelivered webhooks, per Q-12's "economic finality, not raw webhook-event counting" instruction.
4. **Decision required:** The refund-event ingestion and idempotency mechanism.
5. **Option A:** Add `refund.processed`/related events to `SUPPORTED_EVENTS`, reusing the exact same
   `razorpayEventId @unique` dedup pattern already used for `payment.captured`.
6. **Option B:** Build a separate, dedicated refund-ingestion pipeline/table, distinct from the existing
   `WebhookEvent`/`webhookHandler.ts` path, to keep refund-specific logic (e.g., reversal handling) isolated from
   the payment-capture path.
7. **Option C:** A hybrid — reuse `WebhookEvent` for raw dedup (Option A's mechanism), but write refund-specific
   business logic (e.g., the Q-12 pre-close-correction rule) in a separate module/table rather than inline in
   `webhookHandler.ts`.
8. **Engineering trade-offs:** Option A is the most consistent with existing architecture and reuses a proven
   pattern, but risks `webhookHandler.ts` growing multiple unrelated event-type branches. Option B is the cleanest
   separation of concerns but duplicates the dedup mechanism and risks drift between the two paths' idempotency
   guarantees. Option C balances reuse of the proven dedup primitive with isolation of refund-specific policy
   logic.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option C — reuse `WebhookEvent`'s dedup for raw
   idempotency, isolate refund business logic (Q-11/Q-12's rules) in its own module — because Q-12 explicitly
   points at reusing the existing dedup pattern rather than inventing a new one, while keeping the policy logic
   itself separable and testable. Not an adoption.
10. **Affected files/modules/tables if known:** `packages/core-payments/src/webhookHandler.ts`,
    `packages/db/prisma/schema.prisma` (`WebhookEvent`, possibly a new `refunds` table),
    `tests/contract/razorpay-webhook.contract.test.ts` (the existing `it.todo` stubs would need implementing, not
    performed here).
11. **Dependencies:** None beyond existing `Payment`/`Order`/`WebhookEvent` infrastructure, which already exists.
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. No instrumentation, schema/migration,
or billing authority is granted by this record.**

---

### ED-7 — Rolling 30-day query/window computation strategy

1. **Current governing state:** PDEF-3/PDEF-4 decide every gate's window length (rolling 30 days, with PCG-5
   "from purchase," PCG-6 "from first activation") and the §3 cross-cutting immutability principle. No policy
   decision specifies the query mechanism. Not reopened.
2. **Repository evidence:** Re-confirmed via `grep -rli "rolling"` across `packages/` and `apps/` — zero matches
   (§5); `packages/core-acquisition/src/metrics.ts` only computes rates over caller-supplied in-memory arrays, not
   a query layer; `packages/core-reconciliation/src/detection.ts`'s half-open (`created_at >= $1 AND created_at <
   $2`) windowed-query pattern is the closest existing structural analog, built for a different purpose
   (duplicate detection).
3. **Exact engineering problem:** No rolling-window query mechanism exists for any of the six gates; one must be
   designed and built from scratch.
4. **Decision required:** Whether to build one shared, generalized windowing utility or six bespoke per-gate
   queries.
5. **Option A:** A shared, generalized rolling-window query utility (parameterized by table, timestamp column,
   and window length) used by all six gates.
6. **Option B:** Six bespoke, gate-specific queries, each hand-written for its own population/window semantics.
7. **Option C:** A shared utility for the *window-boundary mechanics* only (reusing `core-reconciliation`'s
   half-open-window discipline as a library function), with each gate's population/filter logic remaining bespoke
   on top of it.
8. **Engineering trade-offs:** Option A minimizes duplicated window-boundary logic (and the risk of inconsistent
   boundary handling across gates) but is a larger initial build and a shared point of failure. Option B ships
   faster per-gate but risks six slightly different (and possibly inconsistent) window-boundary implementations,
   which is a correctness risk given the ordering: PDEF-4 §6.2's "one closed window" and the §3 immutability
   principle both depend on consistent boundary semantics. Option C captures most of Option A's consistency
   benefit with less shared-component risk, by isolating only the boundary mechanics (already proven in
   `core-reconciliation`) as reusable.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option C — extract `core-reconciliation`'s proven
   half-open-window boundary discipline into a small, reusable utility, while leaving each gate's own
   population/filter query bespoke — because the boundary-tiling correctness property (no double-count, no gap)
   is the one piece of this problem that has already been solved once and is risky to reimplement six times
   independently. Not an adoption.
10. **Affected files/modules/tables if known:** Possibly a new shared module (not yet named); `packages/core-reconciliation/src/detection.ts`
    as the reference pattern (not directly imported, since it is purpose-built for duplicate detection); every
    future PCG-computation module.
11. **Dependencies:** Depends on ED-1/ED-5/ED-6 providing the underlying events/tables to query.
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted.**

---

### ED-8 — Activation/search event definition (feeds PO-D1 and PCG-6)

1. **Current governing state:** Q-9 (DEC-001) decides PCG-4's denominator population (holders who "performed ≥1
   Client-Finder search/activation in the window") but does **not** decide what counts as "performed" at the
   code level — that ambiguity is PO-D1 below, kept separate. This ED item is the mechanical question of how an
   activation/search event would be captured and stored, independent of which PO-D1 option is eventually chosen.
2. **Repository evidence:** `packages/core-search/` persists `Search` rows with `SearchStatus = 'PENDING' |
   'RUNNING' | 'COMPLETE' | 'FAILED' | 'CANCELLED'` (re-confirmed §5); no separate "activation" event exists
   distinct from a `Search` row's own lifecycle.
3. **Exact engineering problem:** Regardless of which PO-D1 answer is eventually given, engineering needs a
   mechanism to query "did this holder have a qualifying `Search` row in this window" — the mechanism itself
   (not the qualifying condition) is this ED item.
4. **Decision required:** Whether PCG-4's activation signal is read directly from the existing `Search` table or
   mirrored into a separate activation-event record.
5. **Option A:** Query the existing `Search` table directly (filtering by whatever status condition PO-D1
   eventually decides), with no new event/table introduced.
6. **Option B:** Introduce a separate, denormalized "activation" event, written at `Search`-creation time (or
   status-transition time), independent of `Search`'s own lifecycle table — effectively a cache/projection.
7. **Engineering trade-offs:** Option A is simpler and has one source of truth, but ties PCG-4's query directly to
   `core-search`'s internal schema, which could change for reasons unrelated to commercial-gate reporting. Option B
   decouples the two, at the cost of a write-time mirroring step that must stay in sync with `Search`'s actual
   state.
8. **Analyst/engineering recommendation (NOT A DECISION):** Option A — query `Search` directly — because a
   mirrored projection (Option B) introduces a synchronization-drift risk for no clear benefit at current scale,
   and `Search` already carries the timestamp and tier-linkage fields PCG-4 needs. Not an adoption.
9. **Affected files/modules/tables if known:** `packages/core-search/src/types.ts`, `repository.ts`,
   `pgRepository.ts`; whatever module computes PCG-4.
10. **Dependencies:** Depends on PO-D1 being resolved before the query's filter condition can be finalized (this
    ED item only decides *where* to read from, not *which rows qualify*).
11. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. This item does not resolve PO-D1 — see
§8 below.**

---

### ED-9 — Completion event / granularity (PCG-6)

1. **Current governing state:** PDEF-3 §11/§13's verbatim "completion" definition (quoted in the engineering-
   design preparation record, not altered here) requires reaching a specific compound end-state (targeting
   criteria defined → ≥1 qualified opportunity received → review/action step reached). PCG-6 is monitoring-only
   (PDEF-4 §6.3) and is explicitly out of the four hard-blocker gates, but is still a decided, named gate requiring
   implementation (PDEF-4 §6.10: implementation only, no independent pre-validation). Not reopened.
2. **Repository evidence:** `SearchStatus.COMPLETE` (re-confirmed §5) is a job-status field for the search process
   itself finishing, not evidence the *user* reached the review/action step; no existing field represents
   "reached the review/action step" as a distinct, named event.
3. **Exact engineering problem:** No existing event or field captures PDEF-3's compound completion definition at
   the correct granularity; one must be newly defined.
4. **Decision required:** What concrete, observable event(s) constitute "reaching the review/action step" for
   PCG-6 purposes.
5. **Option A:** Treat a specific, already-identifiable user action in the opportunity-review UI (e.g., the first
   time a user opens/views a specific opportunity after a search completes) as the review/action-step event —
   requires identifying the exact UI action, which was not located in this pass and would need confirming against
   the actual `apps/web/app/(client-finder)/...` UI code before being finalized.
6. **Option B:** Treat `feedback` record creation (`StoredFeedback`, which already exists per the earlier
   instrumentation preparation record) as the review/action-step proxy, on the theory that recording feedback
   necessarily implies the user reviewed and acted on the opportunity.
7. **Option C:** Define a new, dedicated "opportunity reviewed" event distinct from both `SearchStatus` and
   `feedback`, logged at the moment the product's review/action UI is reached, independent of whether feedback is
   ultimately submitted.
8. **Engineering trade-offs:** Option A requires UI-code-level confirmation not yet performed and risks picking an
   action that does not actually match "review/action step" as PDEF-3 means it. Option B reuses existing data with
   no new capture work, but conflates "reviewed" with "gave feedback," which are not the same thing (a user could
   review without ever submitting feedback) — this risks undercounting completions. Option C is the most faithful
   to the definition but is net-new instrumentation work.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option C — a dedicated event — because Options A and
   B each risk silently redefining "completion" to fit existing code, which the governing engineering-design
   preparation record explicitly warned against ("do not silently redefine 'useful outcome' to fit the current
   code" — the same caution applies here to "completion"). Not an adoption.
10. **Affected files/modules/tables if known:** `apps/web/app/(client-finder)/...` (UI action point, not yet
    identified precisely); `packages/core-search/`; `packages/core-opportunity/`; whatever module ED-1 introduces.
11. **Dependencies:** Depends on ED-1 (storage) and ED-8's activation-event work (for the window's start point,
    since PCG-6's window starts at first activation).
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. `OUT OF MVP / FUTURE` note: none of
Options A/B/C constitutes cohort analytics, attribution modeling, or revenue optimization under
`MVP_SCOPE_BOUNDARY.md` §6.7 — all three remain within basic PCG-6 completion measurement.**

---

### ED-10 — Qualification-equivalence replacement logic (PCG-4 condition (b))

1. **Current governing state:** Q-10 (DEC-001) already decided the *consequence* of a non-equivalence finding:
   "new, Client-Finder-specific logic must be written." The engineering-design preparation record's own
   investigation (re-confirmed §5 of this record) found `core-qualification` **NOT EQUIVALENT** to PDEF-3's
   condition (b). This ED item concerns only how the required new logic is architected — the *fact* that new
   logic is needed is already settled by Q-10 and is not re-litigated here.
2. **Repository evidence:** `packages/core-qualification/src/types.ts`'s `NEED_DETECTED`/`EVIDENCE_PRESENT`/
   `CATEGORY_PLAUSIBLE` criteria (re-confirmed §5) evaluate prospect plausibility, keyed to `prospectId`, with no
   field representing a searching user's own configured service/customer/value criteria. `core-search/src/types.ts`
   exposes only a `serviceProfileId` lineage reference, with no inline criteria-matching representation either.
3. **Exact engineering problem:** New logic must determine whether a given opportunity "satisfies the user's
   configured target criteria, including the requested service, target customer characteristics, and minimum
   project-value requirements" — a three-part match against the user's own search configuration, which no existing
   evaluator computes.
4. **Decision required:** The architecture of the new, Client-Finder-specific qualification-equivalence logic.
5. **Option A:** A new, standalone evaluator module (parallel to, but structurally separate from,
   `core-qualification`), purpose-built to compare an opportunity's attributes against the originating search's
   configured service/customer/value criteria.
6. **Option B:** Extend `core-qualification` itself with a fourth criterion representing this match, reusing its
   existing `QualificationCriterionResult` shape but adding new criterion logic specific to Client Finder.
7. **Option C:** Compute the match inline, at the point PCG-4's numerator is calculated, rather than as a
   persisted per-opportunity evaluation — i.e., a report-time computation rather than a stored qualification
   result.
8. **Engineering trade-offs:** Option A keeps `core-qualification`'s existing prospect-plausibility purpose
   uncontaminated by a differently-scoped concern (per Q-10's own framing: "`core-qualification` was built for an
   unrelated purpose and should not be repurposed for a commercial gate" was explicitly one of the policy's
   considered options). Option B reuses an existing shape but risks exactly the repurposing-for-an-unrelated-
   purpose problem Q-10 was designed to guard against. Option C avoids new persisted state but makes "why was this
   user counted" (the auditability requirement) harder to answer after the fact, since the computation would not
   be retained as a discrete, reviewable record.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option A — a new standalone evaluator — because it is
   the only option that does not risk reintroducing the repurposing concern Q-10's own non-equivalence finding was
   meant to settle, and because a persisted result (as opposed to Option C's inline computation) is needed for the
   same auditability reason given in ED-4. Not an adoption.
10. **Affected files/modules/tables if known:** A new module (not yet named, not `core-qualification`);
    `packages/core-search/` (for the originating search's configured criteria); `packages/core-opportunity/` (for
    the opportunity being matched); a new persisted table if Option A/B is chosen over Option C.
11. **Dependencies:** None beyond existing `core-search`/`core-opportunity` data, which already exists; does not
    require ED-1 (visitor events) since this is entirely post-purchase, authenticated-user-scoped logic.
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. `core-qualification` is explicitly NOT
reused as-is by any option presented — consistent with the task's instruction not to silently reuse it.**

---

### ED-11 — PCG-4 denominator implementation (mechanical, distinct from PO-D1's policy question)

1. **Current governing state:** Q-9 (DEC-001) decides the denominator *population concept* (holders who performed
   ≥1 search/activation); PO-D1 (below) is the unresolved policy question of exactly which `Search` rows qualify.
   This ED item is the purely mechanical question of how the denominator count is computed and joined to the
   numerator, once PO-D1 is answered — it does not choose a PO-D1 option.
2. **Repository evidence:** `entitlements` table (re-confirmed structurally in the earlier preparation record) can
   supply "holder" status per tier; `Search` rows (ED-8) can supply the activation signal once PO-D1 resolves which
   rows count.
3. **Exact engineering problem:** Joining "is a ₹499/₹1,499 holder in the window" to "has a qualifying `Search` row
   in the window" to produce the denominator count, and then joining that population to ED-10's qualification
   result and `feedback.useful` to produce the numerator.
4. **Decision required:** The join/computation strategy for combining these three data sources (entitlement,
   activation, qualification result).
5. **Option A:** A single SQL query joining `entitlements`, `Search`, and (once built) ED-10's new evaluator's
   persisted result table, computed at report time.
6. **Option B:** A multi-step computation (separate queries per source, combined in application code) rather than
   one joined SQL query.
7. **Engineering trade-offs:** Option A is more efficient and keeps the "why was this user counted" answer
   traceable to one query plan, but requires all three source tables/joins to be stable and well-indexed. Option B
   is easier to test incrementally (each step independently verifiable) but is less efficient and has more
   intermediate state to keep consistent.
8. **Analyst/engineering recommendation (NOT A DECISION):** Option A — a single joined query — consistent with
   ED-7's recommended windowed-query approach and with the auditability goal (ED-4) of a traceable, reviewable
   computation. Not an adoption.
9. **Affected files/modules/tables if known:** `entitlements`, `core-search`'s `Search` table, ED-10's new
   evaluator's table (if persisted), ED-7's windowing utility.
10. **Dependencies:** Depends on PO-D1 (which rows qualify), ED-7 (windowing), ED-8 (where to read activation
    from), ED-10 (qualification-result source).
11. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. This item does not resolve PO-D1.**

---

### ED-12 — Independent-validation architecture/process (PCG-1/2/3A/3B)

1. **Current governing state:** PDEF-4 §6.10 requires implementation **and** independent validation (by a party
   distinct from the implementing team) for the four blocker gates before launch-qualification use; who performs
   it and the exact method are explicitly left to a separate process definition by PDEF-4 itself. Not reopened —
   this ED item proposes an architecture/process outline only, consistent with the engineering-design preparation
   record's own §10/§7-item-10 sketch, refined here into a selectable questionnaire item.
2. **Repository evidence:** `packages/core-reconciliation/` (re-confirmed §5) provides a reusable *pattern*
   (windowed, read-only, PII-boundary-conscious SQL with a `ReconciliationReport` type and `isClean()`/
   `formatReport()` helpers) built for duplicate detection, not commercial-gate reproduction; no deterministic-
   replay fixture harness exists for any PCG computation.
3. **Exact engineering problem:** No independent-validation mechanism exists for any of the four blocker gates;
   PCG-2 is the furthest along (its source data already exists) but still has no validation job built.
4. **Decision required:** The validation architecture — what evidence is produced, how deterministic fixtures/
   replay work, and how results are retained (the mechanics PDEF-4 §6.10 requires but does not itself specify).
5. **Option A:** A cross-check validator: an independently-written raw-SQL (or equivalent) query over the same
   window, run by a process/person distinct from the one that built the primary aggregation, compared against the
   primary result — reusing `core-reconciliation`'s windowed-query pattern as the structural template, not its
   code.
6. **Option B:** A deterministic-replay harness: frozen, hand-constructed event fixtures with known expected
   outputs, replayed through the actual aggregation logic as an automated test suite, run independently of the
   feature-development workflow (e.g., a separate review gate).
7. **Option C:** Both A and B — cross-check queries for production data, plus a deterministic-fixture test suite
   for edge cases (window boundaries, duplicate events, dual-tier users, refund reversals, insufficient-sample
   conditions) that production data may not exercise often enough to rely on alone.
8. **Engineering trade-offs:** Option A validates real production results directly but cannot easily cover rare
   edge cases (e.g., a same-day dual-tier purchase) unless one happens to occur in the window being checked.
   Option B covers edge cases deterministically but validates the logic in the abstract, not the actual production
   data pipeline end-to-end. Option C covers both but is the most work to build and maintain.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option C — both a production cross-check and a
   deterministic-fixture suite — because PDEF-4 §6.10's bar is "independent validation before launch-qualification
   use" for a hard launch blocker, and relying on only one of the two leaves either rare edge cases or real-data
   drift unverified. Not an adoption. **Evidence that must be produced**, regardless of which option is chosen:
   raw source rows (`Order`/`Payment`/`WebhookEvent`, plus whatever ED-1/ED-5 introduce) for the window being
   validated; the primary aggregation's reported value; the independent check's reported value; a record of
   whether they matched, and if not, why. **Who/what performs validation** and **how results are retained** are
   explicitly left open here, consistent with PDEF-4 §6.10 deferring this to a separate process definition — this
   record does not propose a specific team, role, or retention duration, since that is a process decision outside
   this questionnaire's engineering-design scope.
10. **Affected files/modules/tables if known:** `packages/core-reconciliation/` (pattern reference, not reused
    as-is); a new validation module/test suite (not yet named); `tests/contract/` as a possible home for
    deterministic fixtures, following that directory's existing contract-test convention.
11. **Dependencies:** Depends on ED-1, ED-5, ED-6, ED-7 (the underlying instrumentation must exist before it can be
    validated).
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted. No validation execution authority is
granted by this record, and no claim is made that any validation has occurred.**

---

### ED-13 — Analytics/audit/reconciliation requirements (consolidated auditability mechanism)

1. **Current governing state:** No policy decision specifies a schema or tool for auditability; the requirement
   that "why was this user counted / not counted" be answerable is implicit in PDEF-4 §6.10's independent-
   validation requirement and in the general governance discipline already evident across this project's
   decision-chain (every prior record in this chain requires hash/baseline verification). Not reopened.
2. **Repository evidence:** `packages/core-reconciliation/src/report.ts` (re-confirmed §5) provides a reusable
   *reporting* pattern (`isClean()`, `formatReport()`, a `ReconciliationReport` type, deliberately free of
   logging side effects so it can be asserted on in tests or routed to an arbitrary sink) — again, a pattern, not
   code built for commercial-gate reporting.
3. **Exact engineering problem:** No audit-evidence format exists for any PCG; one must be designed so that, for
   every counted or excluded user, the specific source event(s), timestamp(s), identity, tier, and (where
   relevant) transaction/exposure/activation/refund/qualification evidence can be retrieved.
4. **Decision required:** The audit-evidence retrieval/reporting mechanism.
5. **Option A:** A per-evaluation evidence bundle: when a gate's value is computed (and, per ED-4, optionally
   snapshotted), persist alongside it the exact set of source-row ids that contributed to the numerator and
   denominator, so "why was this user counted" is a direct lookup, not a re-derivation.
6. **Option B:** Rely on raw-event retention alone (no separate evidence bundle) — "why was this user counted" is
   always answered by re-running the aggregation query filtered to one user, trusting that raw events are never
   deleted or mutated.
7. **Option C:** A reporting layer modeled on `core-reconciliation/src/report.ts`'s pattern (a typed report object
   plus pure, side-effect-free formatting functions), applied to PCG results specifically, combined with Option
   A's evidence-bundle persistence.
8. **Engineering trade-offs:** Option A gives the fastest, most direct audit answer but adds a write-time cost and
   new persisted state per evaluation. Option B avoids that cost but makes every audit question a fresh query,
   which is slower and more fragile if the aggregation logic changes between when a result was produced and when
   it is later audited (reopening the ED-4 immutability concern). Option C adds a consistent, testable reporting
   shape on top of Option A's data, following an already-proven in-repo convention.
9. **Analyst/engineering recommendation (NOT A DECISION):** Option C — because it reuses a proven reporting
   convention already in the codebase and pairs it with persisted evidence (consistent with ED-4's recommended
   snapshot approach), giving the most direct and stable answer to "why was this user counted / not counted" for
   both production use and the ED-12 independent-validation process. Not an adoption.
10. **Affected files/modules/tables if known:** `packages/core-reconciliation/src/report.ts` (pattern reference);
    whatever snapshot table ED-4 introduces; a new reporting module (not yet named).
11. **Dependencies:** Depends on ED-4 (snapshot persistence) and ED-1/ED-5/ED-6 (source events existing to cite as
    evidence).
12. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

**This is a recommendation only. No engineering decision has been adopted.**

---

## 8. Remaining Product Owner policy dependencies (PO-D1, PO-D2) — kept separate, no option chosen

---

### PO-D1 — PCG-4 denominator: what counts as "performed a search/activation"

**Status: PENDING PRODUCT OWNER DECISION. Not answered, inferred, or defaulted by this record.**

**Current governing state:** Q-9 (`CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001`) decided the
denominator *population concept* — holders who "performed at least one Client-Finder search/activation in the
window" — using the word "performed," not "completed successfully." It did not decide which `Search` rows
(by status) satisfy "performed."

**Repository evidence:** `packages/core-search/src/types.ts:9` — `SearchStatus = 'PENDING' | 'RUNNING' |
'COMPLETE' | 'FAILED' | 'CANCELLED'` (re-confirmed §5). Any of these statuses represents a `Search` row that
exists; only `COMPLETE` represents one that finished successfully.

**Why this remains a policy question, not an engineering one:** the choice changes who is counted in PCG-4's
denominator and therefore changes the gate's reported ≥60% rate — this is exactly the kind of consequence the
task instructs should not be decided unilaterally by engineering.

**Concrete choices (presented, not chosen):**
- **Option 1** — Any `Search` row, regardless of status (`PENDING`/`RUNNING`/`COMPLETE`/`FAILED`/`CANCELLED`),
  counts as "performed" — the broadest reading, treating a mere attempt as sufficient opportunity.
- **Option 2** — Only a `Search` row with `status = 'COMPLETE'` counts — the narrowest reading, requiring the
  search process to have actually finished.
- **Option 3** — Another explicitly defined condition (e.g., any status except `CANCELLED`, treating a cancelled
  search as not a genuine attempt but a failed one as still "performed"). `VALUE: __________`
- **Option 4** — Defer; leave PENDING.

**PRODUCT OWNER SELECTION:** `__________`

---

### PO-D2 — Numeric sample floor for PCG-3A/3B/4/5

**Status: PENDING PRODUCT OWNER DECISION. Not answered, inferred, or defaulted by this record.**

**Current governing state:** Q-8 (`CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001`) adopted the
NOT-YET-EVALUABLE floor *principle* for PCG-3A, PCG-3B, PCG-4, and PCG-5, while explicitly deferring the specific
numeric minimum-denominator value(s) to a separate Product Owner decision. PDEF-4 §6.5 names explicit floors only
for PCG-1 (500) and PCG-2 (50) — both absolute-count gates, not rate-based ones.

**Repository evidence:** Not applicable — this is purely a policy-threshold question; no code or data
determines what a statistically adequate denominator is for any of these rate-based gates.

**Explicit instruction followed:** this record does **not** infer a numeric floor from the existing 500 (PCG-1)
or 50 (PCG-2) thresholds, or from any other existing value, per the task's explicit instruction. No number is
proposed, suggested, or implied anywhere in this record for PO-D2.

**What is known:** a denominator of exactly `0` is unambiguous and can be mechanically treated as NOT YET
EVALUABLE without needing this policy value (per ED-11/ED-7's mechanical query design) — but any nonzero
denominator's sufficiency is wholly undetermined pending this decision.

**PRODUCT OWNER SELECTION (per gate, if the Product Owner wishes to set different floors for PCG-3A, PCG-3B,
PCG-4, and PCG-5 individually, or one uniform floor for all four):** `__________`

---

## 9. Authorization boundary

**No engineering decision has been adopted. No Product Owner decision has been adopted for PO-D1 or PO-D2.**

This record grants **none** of the following, under any circumstance: implementation authority; instrumentation
authority; schema/migration authority; validation execution authority; billing/credit-ledger authority;
deployment/release/launch authority; or any provider/API call, test execution, commit, or push.

It does not modify, reopen, or alter `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`,
`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`,
`PROJECT_MASTER_CHECKLIST.md`, `MVP_SCOPE_BOUNDARY.md`, or any code, test, schema, migration, configuration, or
dependency file. It is not committed or pushed. The final engineering-design decision record is explicitly **not**
created by this task.

## 10. Next governance step

1. Product Owner (or an authority explicitly, separately delegated for this specific task) selects an option for
   each of ED-1 through ED-13, and separately resolves PO-D1 and PO-D2.
2. Only after that: a separate, explicitly authorized task produces the final engineering-design decision record
   (not created here), reflecting the adopted selections.
3. Only after that: implementation proceeds, per each adopted ED selection.
4. Only after implementation: independent validation of PCG-1/2/3A/3B, per ED-12's eventual adopted architecture
   and PDEF-4 §6.10.
5. Only after validation: any launch-qualification decision may use PCG-1/2/3A/3B results — and even then,
   deployment/release (K1-10) requires its own separate authorization, unaffected by any of the above.

**Next governance action:** none of steps 1–5 is performed or authorized by this record.
