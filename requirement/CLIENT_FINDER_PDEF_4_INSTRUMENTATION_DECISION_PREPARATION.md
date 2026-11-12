# Client Finder / Client Intent Discovery — PDEF-4 Instrumentation & Measurement Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-DECISION-PREPARATION-001`
**Date:** 2026-10-04
**Type:** Read-only preparation record. **No implementation, instrumentation, validation, deployment, release, or
launch authority of any kind is granted by this document** (see §23). **No Product Owner decision is created,
implied, inferred, or authorized.** Every unresolved item is marked `PENDING PRODUCT OWNER DECISION` or
`ENGINEERING DESIGN REQUIRED — NO POLICY DECISION YET` as appropriate.

---

## 1. Executive summary

PDEF-4 (§6, `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`) decided that PCG-1, PCG-2, PCG-3A, and PCG-3B are
hard launch blockers requiring implemented-and-independently-validated instrumentation before use, and that
PCG-4, PCG-5, and PCG-6 are monitoring-only gates requiring implemented (but not independently pre-validated)
instrumentation. This record investigates whether the current repository can actually produce the evidence each
gate needs.

**Headline finding: none of the six gates can be measured today.** The repository has strong purchase/entitlement
infrastructure (`Order`, `Payment`, `entitlements` tables) and a browser-event contract, but:

- There is **no durable, server-side, queryable analytics/funnel-event store** anywhere in the codebase — nothing
  persists visitor or funnel events for later aggregation.
- There is **no time-windowed ("rolling 30 days") query layer** anywhere in the codebase.
- There is **no refund webhook handler, refund model, or auto-revoke-on-refund code path** — only a `REFUNDED`
  enum value and a retention-allowlist that recognizes the Razorpay refund payload shape.
- The concepts "qualified visitor," "useful outcome," and "completion" exist, confusingly, as **same-named but
  different concepts in unrelated packages** (`core-qualification` evaluates prospects, not visitors;
  `core-opportunity`'s `feedback.useful` evaluates outreach feedback, not Client-Finder search outcomes;
  `core-search`'s `SearchStatus.COMPLETE` is a job-status field, not a PCG-6 completion event) — none is wired to
  Client Finder's ₹499/₹1,499 tiers or to the PDEF-3 definitions.
- There is **no anonymous-visitor-to-authenticated-user linkage**, which PCG-1→PCG-2 funnel math depends on.
- There is **no bot/internal-traffic exclusion or visitor-deduplication logic**, which PCG-1's "qualified visitor"
  definition depends on.
- **Credit-ledger code does not exist**, confirming (not contradicting) the existing governance position that
  credit accounting remains undesigned — this record does not change that and PCG-6 continues to not depend on
  credit usage, per PDEF-3 §11's explicit "No."

This record does not implement any of the above. It documents exactly what exists, what is missing, and what
remains a Product Owner policy question versus an engineering design question, so a future, separately authorized
task can scope the actual instrumentation work.

## 2. Governance authority and provenance

This is a **read-only preparation record**, not a decision record. It creates no policy. Where this record's
authors (Claude, performing repository research as instructed) needed to interpret ambiguous evidence, that
interpretation is labeled as `ENGINEERING DESIGN REQUIRED — NO POLICY DECISION YET` or
`PENDING PRODUCT OWNER DECISION`, never as decided. The repository-evidence findings in §4 and §5–§11 were
gathered via read-only exploration of the current working tree at the baseline HEAD recorded in §3; no file was
created, modified, or executed as part of that exploration beyond this one new document.

## 3. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` — unchanged |
| Staged files | 0 |
| Existing instrumentation-preparation record | None found at this path or any equivalent path prior to this record |
| File created by this record | this file only |

## 4. Governing decisions incorporated (hashes verified at baseline, unchanged by this record; NOT reopened)

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `requirement/MVP_SCOPE_BOUNDARY.md` §6.5 | not independently hashed (read-only reference) |

The following PDEF-4 policy is treated as decided and is **not reopened** by this record:

- PCG-1/2/3A/3B are hard launch blockers; PCG-4/5/6 are monitoring/optimization gates (PDEF-4 §6.1/§6.3).
- One closed rolling-30-day window is the minimum observation period (PDEF-4 §6.2).
- ₹499 and ₹1,499 may launch independently (PDEF-4 §6.4).
- Insufficient sample ⇒ gate is NOT YET EVALUABLE, not failed (PDEF-4 §6.5).
- PCG-5 evaluations are window-scoped and immutable; late refunds attach to their own later window (PDEF-4 §6.6).
- Dual-tier users count once in the combined population, attributed non-exclusively to both tier diagnostics
  (PDEF-4 §6.7).
- Per-tier diagnostics cannot block launch (PDEF-4 §6.8).
- PCG-1/2/3A/3B apply to launch qualification and ongoing monitoring; PCG-4/5/6 apply to post-launch optimization
  only (PDEF-4 §6.9).
- Blocker-gate instrumentation requires implementation **and** independent validation before launch-qualification
  use; monitoring-gate instrumentation requires implementation only (PDEF-4 §6.10).
- PCG-6 does **not** depend on credit usage (PDEF-3 §11, explicit Product Owner "No" — not reopened here).
- Client Finder is in both ₹499/₹1,499, independently purchasable; ₹499/₹1,499 entitlements coexist with separate
  credit buckets (PDEF-2, ES-1/ES-5/ES-6/ES-7/ES-8 — not reopened).

## 5. Current repository evidence — summary

Full detail in §12 (signal matrix) and inline per-PCG in §6–§11. High-level findings (all read-only research,
cites exact files):

- **Purchase/payment**: `packages/db/prisma/schema.prisma` — `Order` (lines ~98–137: `razorpayOrderId`,
  `productSlug`, `amountPaise`, `status: OrderStatus{PENDING|ATTEMPTED|PAID|FAILED|EXPIRED}`, timestamps),
  `Payment` (~143–165: `razorpayPaymentId`, `status: PaymentStatus{AUTHORIZED|CAPTURED|FAILED|REFUNDED}`),
  `WebhookEvent` (~171–208, deduped on `razorpayEventId`). Amount/tier is server-resolved, never client-supplied
  (`packages/core-payments/src/schemas.ts` `createOrderRequestSchema.strict()`, lines 24–41).
- **Entitlements**: `entitlements` table (migration `0004_entitlements`), one row per `(customer_email,
  product_slug)`, `granted_at`/`revoked_at`/`revoked_reason`; dual-tier coexistence is structurally supported
  today (a customer can hold both ₹499 and ₹1,499 rows simultaneously). `packages/catalog/src/ladder.ts` defines
  the containment ladder (`PRODUCT_LADDER`, `impliedProductIds()`).
- **Credit ledger**: confirmed **absent** — zero code matches for credit/ledger/lead-unlock terms anywhere in
  `packages/` or `apps/`; no `credits` table in any migration.
- **Refunds**: `PaymentStatus.REFUNDED` exists as an enum value; `webhookHandler.ts` only handles
  `payment.captured` (`SUPPORTED_EVENTS`, line 48) — no refund webhook transitions a payment, no refund table, no
  auto-revoke-on-refund code path runs today (`tests/contract/razorpay-webhook.contract.test.ts:10` has an
  explicit `it.todo('accepts a real refund.processed payload shape')`).
- **Analytics/events**: `apps/web/src/analytics/events.ts` and `funnelEvents.ts` define a browser-emittable event
  contract (`funnel_entry_viewed`, `checkout_started`, `Purchase`, etc.) plus a server-only subset
  (`purchase_completed`, `entitlement_granted`) gated by `assertBrowserEmittable`. **No durable server-side event
  table stores these** — the only durable, timestamped, queryable event store in the system is `meta_events`
  (Meta CAPI dispatch log), which covers purchase-class events only, not general funnel/visitor events.
- **Client Finder feature code**: `packages/core-research/` (`intentSignal.ts`, `intentSourceProviderContract.ts`,
  `contactIdentifiers.ts`) implements business-intent-signal intake/validation and a personal-contact-identifier
  privacy screen (K1) — not visitor funnel or outcome tracking. `apps/web/app/(client-finder)/...` implements
  login/search/opportunity-listing UI.
- **"Useful outcome"-shaped data**: `packages/core-opportunity/src/types.ts` — `feedback` table (migration
  `0020_feedback`), `RecordFeedbackInput{useful: boolean, reason}`, and `OpportunityTrackingSummary` already
  computing `actionedRate = actioned/created` — structurally the closest existing analog to PCG-4, but scoped to
  per-opportunity outreach feedback, not Client-Finder tier-specific "useful outcome."
- **"Completion"-shaped data**: `packages/core-search/src/types.ts` — `SearchStatus` enum includes `COMPLETE`, a
  job-status concept, not a PCG-6 workflow-completion event tied to "defining targeting criteria → receiving a
  qualified opportunity → reaching the review/action step" (the PDEF-3 §13 definition).
- **Identifiers**: two parallel identity schemes — `users.id` (post-signup UUID, migration `0012_user_identity`)
  and `entitlements.customer_email` (pre-identity purchase subject, migration `0004_entitlements`), bridged only
  by email equality. **No anonymous-visitor-id → authenticated-user merge mechanism exists.**
- **Time-windowed/rolling aggregation**: **not found anywhere** — `packages/core-acquisition/src/metrics.ts`
  computes rates over already-filtered in-memory arrays passed in by a caller, with no date-range/SQL query layer.
- **Bot/internal-traffic exclusion**: **not found** — only generic per-IP/per-email rate limiting exists
  (`packages/rate-limit/src/policy.ts`), which throttles abuse but does not classify or exclude bot/QA traffic
  from a visitor count.

## 6. PCG-1 instrumentation requirements — qualified visitors

**PDEF-3 §13 definition (verbatim, not altered):** "A unique visitor who (1) enters the Client Finder product
funnel; (2) has demonstrated intent to evaluate or use Client Finder rather than merely viewing unrelated site
content; and (3) satisfies the product's minimum eligibility criteria for the applicable Client Finder tier. A
visitor is counted only once within the applicable measurement window."

| # | Item | Status |
|---|---|---|
| 1 | Metric definition | DECIDED (PDEF-3 §13, quoted above). Not altered here. |
| 2 | Numerator | Count of unique visitors satisfying all three PDEF-3 conditions within the window. |
| 3 | Denominator | None — PCG-1 is an absolute count (500), not a rate. |
| 4 | Population | Client-Finder-specific (PDEF-3 §12). |
| 5 | Eligibility rules | Condition (3) — "minimum eligibility criteria for the applicable tier" — is **PENDING PRODUCT OWNER DECISION**: no governing record states what the minimum eligibility criteria actually are (e.g., account status, geography, device). |
| 6 | Exclusions | Bot/internal/QA traffic exclusion is **ENGINEERING DESIGN REQUIRED — NO POLICY DECISION YET**: no governing record decides whether/how to exclude them, and no code implements any exclusion today (§5, §12 row "Bot/internal-traffic exclusion"). |
| 7 | Time window | DECIDED — rolling 30 days, one closed window minimum (PDEF-3 §12; PDEF-4 §6.2). |
| 8 | Tier attribution | PCG-1 applies to the ₹99→₹499 progression specifically per the original gate framing (`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` §6, "Per tier or aggregate" row) — **PENDING PRODUCT OWNER DECISION** on whether PCG-1 is evaluated once (aggregate) or separately for a ₹1,499-direct-entry funnel, since PDEF-2 allows ₹1,499 without prior ₹499. |
| 9 | Dual-tier treatment | Not directly applicable to PCG-1 (a pre-purchase funnel-entry concept); becomes relevant only once a visitor converts (see PCG-2/3). |
| 10 | Required user/account identifiers | A visitor identifier distinct from `users.id`/`entitlements.customer_email` (both are post-purchase/post-signup). **MISSING** — no anonymous-visitor-id scheme is persisted server-side today (§5, §12). |
| 11 | Required event(s) | A durable "funnel entry" event and a durable "qualification" event. `funnel_entry_viewed` exists as a *browser-emittable event name* (`apps/web/src/analytics/events.ts` line ~20) but is **not persisted** anywhere server-side. |
| 12 | Required event properties | Visitor/session id, tier/productId, timestamp, qualification-condition evidence. None of this is captured durably today. |
| 13 | Required timestamps | None of the existing browser event payloads (`events.ts`, `funnelEvents.ts`) carry an explicit timestamp field (§5) — **MISSING**, would need to be added at persistence time. |
| 14 | Required purchase/entitlement state | Not required for PCG-1 itself (pre-purchase), but needed to later link a qualified visitor to PCG-2/3 (see Required user/account identifiers above). |
| 15 | Required refund state | Not applicable to PCG-1. |
| 16 | Required credit/usage information | Not applicable to PCG-1; PCG-6's "no credit dependency" decision is unrelated to this gate. |
| 17 | Aggregation logic | `COUNT(DISTINCT visitor_id) WHERE qualifies = true AND window` — **MISSING**, no such query exists; no durable event table to query. |
| 18 | Rolling-window freeze/evaluation | **ENGINEERING DESIGN REQUIRED** — no rolling-window evaluation mechanism exists anywhere in the codebase (§5). |
| 19 | Insufficient-sample detection | Mechanically: "count < 500 at window close" per PDEF-4 §6.5's NOT YET EVALUABLE rule — **ENGINEERING DESIGN REQUIRED**, since the underlying count does not exist yet to compare against 500. |
| 20 | Evidence for independent validation | Would require: raw event log, deterministic replay of the qualification logic against a frozen event set, and a second-party check that the produced count matches. None of the underlying event log exists yet to validate against. |

## 7. PCG-2 instrumentation requirements — buyers

**PDEF-3 definition:** ≥ 50 buyers, Client-Finder-specific population, combined-primary with per-tier diagnostic
(PDEF-3 §6, §12).

| # | Item | Status |
|---|---|---|
| 1–4 | Metric/numerator/denominator/population | DECIDED structure: absolute count of unique buyers, Client-Finder-specific, combined primary + per-tier diagnostic. Not altered. |
| 5 | Eligibility rules | "Buyer" = a customer with a successful (CAPTURED) payment for a Client-Finder-bearing product (₹499 or ₹1,499) — **EXISTS, requires transformation**: `Payment.status = 'CAPTURED'` joined to `Order.productSlug` (`packages/db/prisma/schema.prisma`) directly supports this definition once a query is written; no query exists today. |
| 6 | Exclusions | Duplicate-transaction handling: `Payment.razorpayPaymentId` unique, and a documented partial-unique-index intent limits one CAPTURED payment per order (schema.prisma comment) — **EXISTS**, usable directly. |
| 7 | Time window | Rolling 30 days from... — **PENDING PRODUCT OWNER DECISION**: PDEF-3 does not state PCG-2's window start-point event (funnel entry? order creation? payment capture?) the way PCG-5/PCG-6 explicitly state theirs ("from purchase," "from first activation"). Recommend treating it as payment-capture timestamp by analogy, but this is not decided anywhere. |
| 8 | Tier attribution | `Order.productSlug` directly gives ₹499 vs ₹1,499 attribution — **EXISTS, directly usable.** |
| 9 | Dual-tier treatment | DECIDED (PDEF-4 §6.7): count once combined, attribute non-exclusively to both tier diagnostics. **EXISTS, requires transformation**: the `entitlements` table already supports a customer holding both tier rows simultaneously; a query implementing the PDEF-4 §6.7 rule does not exist yet. |
| 10 | Required user/account identifiers | `entitlements.customer_email` / `Order`'s customer email — **EXISTS, directly usable** as the buyer identity key. |
| 11 | Required event(s) | `payment.captured` webhook → `Payment.status = CAPTURED` transition — **EXISTS** (`webhookHandler.ts`, `SUPPORTED_EVENTS`). |
| 12 | Required event properties | Amount, product, customer email, timestamp — **EXISTS** on `Order`/`Payment`. |
| 13 | Required timestamps | `Payment.createdAt`/`updatedAt` — **EXISTS.** |
| 14 | Required purchase/entitlement state | `Order.status = 'PAID'`, `entitlements` row present — **EXISTS.** |
| 15 | Required refund state | A buyer whose payment is later refunded — whether they still count as a "buyer" for PCG-2 at evaluation time is **PENDING PRODUCT OWNER DECISION** (no record addresses this; PDEF-4 §6.6 addresses PCG-5's own refund-rate window-scoping, not whether a refunded purchase still counts toward PCG-2's buyer count). |
| 16 | Required credit/usage information | Not applicable. |
| 17 | Aggregation logic | `COUNT(DISTINCT customer_email) WHERE payment.status = 'CAPTURED' AND order.productSlug IN (client-finder-bearing tiers) AND window` — **EXISTS as queryable data, MISSING as an actual query/aggregation job.** |
| 18 | Rolling-window freeze/evaluation | **ENGINEERING DESIGN REQUIRED** — no rolling-window query mechanism exists (§5). |
| 19 | Insufficient-sample detection | "count < 50 at window close" — mechanically analogous to PCG-1; **ENGINEERING DESIGN REQUIRED.** |
| 20 | Evidence for independent validation | Reconcile the computed buyer count against raw `Payment`/`Order` rows for the same window — **EXISTS as a reconciliation pattern** (`packages/core-reconciliation/` already does duplicate-detection scans over `Payment`/`WebhookEvent`, a usable structural template), but no PCG-2-specific validation job exists. |

## 8. PCG-3A instrumentation requirements — ₹99→₹499 conversion

**PDEF-3 definition:** ≥ 10%, population = eligible ₹99 purchasers/users exposed to the ₹499 offer, Client-Finder-
specific, rolling 30 days.

| # | Item | Status |
|---|---|---|
| 1–4 | Metric/numerator/denominator/population | DECIDED: numerator = ₹499 purchasers from the eligible-exposed population; denominator = eligible ₹99 purchasers exposed to the ₹499 offer. Not altered. |
| 5 | Eligibility rules | "Exposed to the ₹499 offer" requires an **offer-exposure event** — **MISSING**. `upsell_viewed{productId, fromTier}` exists as a browser-emittable event name (`events.ts`) but is not persisted server-side (§5). |
| 6 | Exclusions | Duplicate exposure handling — **MISSING**, no persisted exposure log exists to de-duplicate against. |
| 7 | Time window | Rolling 30 days — DECIDED (PDEF-3 §7). Start point (exposure? ₹99 purchase?) not explicitly stated — **PENDING PRODUCT OWNER DECISION.** |
| 8 | Tier attribution | ₹99→₹499 only, by construction of the metric. |
| 9 | Dual-tier treatment | Not directly applicable (PCG-3A measures a specific transition, per PDEF-4 §6.7's carve-out for transition-specific gates). |
| 10 | Required user/account identifiers | `entitlements.customer_email` for the ₹99 purchase and the ₹499 purchase — **EXISTS** for the purchase side; the "exposed to offer" side needs the same visitor/session identifier gap noted in PCG-1 §6 row 10 — **MISSING.** |
| 11 | Required event(s) | ₹99 purchase (`payment.captured` for `ai_income_99`) — **EXISTS.** Offer-exposure event — **MISSING** (not persisted). ₹499 purchase — **EXISTS.** |
| 12 | Required event properties | Offer-exposure needs: customer identity, fromTier, productId shown, timestamp — **MISSING**, not persisted today. |
| 13 | Required timestamps | Purchase timestamps **EXISTS**; exposure timestamp **MISSING.** |
| 14 | Required purchase/entitlement state | `entitlements` rows for `ai_income_99` and `ai_freelancing_499` — **EXISTS.** |
| 15 | Required refund state | Whether a later-refunded ₹99 or ₹499 purchase still counts in the conversion numerator/denominator — **PENDING PRODUCT OWNER DECISION** (not addressed by any record). |
| 16 | Required credit/usage information | Not applicable. |
| 17 | Aggregation logic | `COUNT(converted)/COUNT(exposed)` — **MISSING** entirely on the exposure side; purchase side is queryable from existing tables. |
| 18 | Rolling-window freeze/evaluation | **ENGINEERING DESIGN REQUIRED**, same as PCG-1/2. |
| 19 | Insufficient-sample detection | No absolute-count floor is stated for PCG-3A's denominator population size — **PENDING PRODUCT OWNER DECISION** on whether an analogous "not yet evaluable" floor applies to PCG-3A/3B the way it explicitly does to PCG-1/2 (PDEF-4 §6.5 names PCG-1/PCG-2 specifically). |
| 20 | Evidence for independent validation | Would require a persisted, immutable exposure log to replay against — does not exist. |

## 9. PCG-3B instrumentation requirements — independent ₹1,499 conversion

**PDEF-3 definition:** ≥ 5%, population = eligible users exposed to the ₹1,499 offer (independent of ₹499
ownership, consistent with PDEF-2), Client-Finder-specific, rolling 30 days.

| # | Item | Status |
|---|---|---|
| 1–4 | Metric/numerator/denominator/population | DECIDED: numerator = ₹1,499 purchasers from the eligible-exposed population; denominator = eligible users exposed to the ₹1,499 offer, **not conditioned on prior ₹499 purchase** (PDEF-3 §8, explicitly preserving PDEF-2's independent-purchase rule — this record does not revert to the old sequential model). |
| 5 | Eligibility rules | Exact population definition for "eligible users exposed" — visitors generally? ₹99 buyers specifically? all site traffic? — is explicitly flagged as unresolved in `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` §8 ("exact definition of the ₹1,499 conversion population... for measurement (b)") and **remains PENDING PRODUCT OWNER DECISION** — PDEF-3's completion decision fixed the threshold (5%) and population label ("eligible users exposed to the ₹1,499 offer") but not this operational boundary. |
| 6 | Exclusions | Same exposure-deduplication gap as PCG-3A — **MISSING.** |
| 7 | Time window | Rolling 30 days — DECIDED. Start point — **PENDING PRODUCT OWNER DECISION**, same as PCG-3A. |
| 8 | Tier attribution | ₹1,499 only, by construction. |
| 9 | Dual-tier treatment | Not directly applicable (transition-specific gate, per PDEF-4 §6.7's carve-out). A user who already holds ₹499 and then independently purchases ₹1,499 (ES-10, reverse purchase order) still counts in PCG-3B's numerator — consistent with PDEF-2/ES-10, not altered. |
| 10 | Required user/account identifiers | Same visitor-identity gap as PCG-3A — **MISSING** on the exposure side; **EXISTS** on the purchase side. |
| 11 | Required event(s) | ₹1,499 offer-exposure event — **MISSING**, not persisted (`upsell_viewed` is browser-only, not durable). ₹1,499 purchase (`payment.captured` for `ai_client_acquisition_1499`) — **EXISTS.** |
| 12–13 | Event properties / timestamps | Same gap pattern as PCG-3A §8 rows 12–13. |
| 14 | Required purchase/entitlement state | `entitlements` row for `ai_client_acquisition_1499`, independent of any `ai_freelancing_499` row — **EXISTS**, and the schema already supports independent purchase without a ₹499 prerequisite (no FK/trigger couples them beyond the containment ladder being a *downward*-only implication, per `packages/catalog/src/ladder.ts`). |
| 15 | Required refund state | Same open question as PCG-3A §8 row 15 — **PENDING PRODUCT OWNER DECISION.** |
| 16 | Required credit/usage information | Not applicable. |
| 17–20 | Aggregation / rolling-window / insufficient-sample / validation | Same missing-infrastructure pattern as PCG-3A (§8 rows 17–20) — **MISSING / ENGINEERING DESIGN REQUIRED.** |

## 10. PCG-4 instrumentation requirements — useful outcome

**PDEF-3 §9/§13 definition (verbatim, not altered):** "A user achieves a useful outcome when the Client Finder
produces at least one qualified opportunity that the user considers actionable and that satisfies the user's
configured target criteria, including the requested service, target customer characteristics, and minimum
project-value requirements." Threshold ≥ 60%, monitoring-only per PDEF-4 §6.3.

| # | Item | Status |
|---|---|---|
| 1 | Metric definition | DECIDED (quoted above), not altered. |
| 2–3 | Numerator/denominator | Numerator = users with ≥1 opportunity meeting the boolean below; denominator = users who activated/used Client Finder in the window — **PENDING PRODUCT OWNER DECISION on the exact denominator population** (e.g., "all ₹499/₹1,499 holders" vs. "holders who performed ≥1 search"), since PDEF-3 states the threshold and definition but not the exact base population boundary beyond "Client-Finder-specific, across ₹499 and ₹1,499 users." |
| 4 | Population | Client-Finder-specific, combined-primary with per-tier diagnostic (PDEF-3 §9). |
| 5 | Eligibility rules | Must map PDEF-3's compound boolean ("qualified opportunity" AND "actionable" AND "satisfies configured target criteria: service / customer characteristics / project value") to concrete stored fields. `packages/core-qualification/` (`evaluator.ts`, `rules.ts`) evaluates whether a *prospect* meets qualification rules — **EXISTS, requires transformation** to confirm it covers exactly these three conditions and is reachable from a Client-Finder search context (not yet verified; it was built for a different flow per the agent research). `feedback.useful` (`packages/core-opportunity`, migration `0020_feedback`) captures "the user considers actionable" **directly** — **EXISTS, requires transformation** to confirm it is collected for Client-Finder-originated opportunities specifically. "Satisfies configured target criteria" (service, customer characteristics, minimum project value) — **ENGINEERING DESIGN REQUIRED**: whether the existing qualification-rule evaluation already encodes exactly these three sub-conditions, or something else, was not verified in this pass and needs code-level confirmation before instrumentation design proceeds. |
| 6 | Exclusions | None specified by PDEF-3; none assumed here. |
| 7 | Time window | Rolling 30 days (PDEF-3 §9). |
| 8 | Tier attribution | Reported separately by tier as diagnostic (PDEF-3 §9, §12) — combined gate is primary per PDEF-4 §6.1 (monitoring, not blocking). |
| 9 | Dual-tier treatment | Per PDEF-4 §6.7 — count once combined, both-diagnostics non-exclusive. |
| 10 | Required user/account identifiers | `users.id` — **EXISTS** (feedback/opportunity rows are user-owned per the agent research). |
| 11 | Required event(s) | A "Client-Finder search/activation" event and the existing `feedback` record — activation event **MISSING** (no durable event store, §5); feedback record **EXISTS** structurally but its linkage to a specific Client-Finder tier/search needs confirmation — **ENGINEERING DESIGN REQUIRED.** |
| 12 | Required event properties | opportunity id, useful boolean, reason, tier, timestamp — `useful`/`reason` **EXISTS**; tier-linkage **ENGINEERING DESIGN REQUIRED.** |
| 13 | Required timestamps | `feedback` table timestamps presumed to exist per standard migration convention — not independently confirmed field-by-field in this pass. |
| 14 | Required purchase/entitlement state | Active ₹499/₹1,499 entitlement at time of search — **EXISTS** (`entitlements` table). |
| 15 | Required refund state | Not directly applicable to PCG-4 itself. |
| 16 | Required credit/usage information | **Not required** — PDEF-3 §11 explicitly decided PCG-6 (not PCG-4) is independent of credit usage; no record ties PCG-4 to credit usage either, and this record does not introduce such a tie. |
| 17–20 | Aggregation / rolling-window / insufficient-sample / validation | Same missing rolling-window infrastructure as all prior gates — **MISSING / ENGINEERING DESIGN REQUIRED.** Because PCG-4 is monitoring-only (PDEF-4 §6.3), PDEF-4 §6.10 does not require independent validation for it, only implementation. |

## 11. PCG-5 instrumentation requirements — refund rate

**PDEF-3 §10 definition:** ≤ 8%, Client-Finder-specific purchasers across ₹499/₹1,499, rolling 30 days from
purchase, per-tier diagnostic. PDEF-4 §6.6: window-scoped and immutable; late refunds attach to their own later
window.

| # | Item | Status |
|---|---|---|
| 1–4 | Metric/numerator/denominator/population | DECIDED: numerator = refunded purchases; denominator = all purchases in the purchase cohort; population = Client-Finder-specific purchasers across both tiers. |
| 5 | Purchase cohort | `Order`/`Payment` rows with `status = PAID`/`CAPTURED` for Client-Finder-bearing tiers — **EXISTS.** |
| 6 | Refund event | **MISSING** — no refund webhook is handled (`SUPPORTED_EVENTS = ['payment.captured']` only); `tests/contract/razorpay-webhook.contract.test.ts:10` has an explicit `it.todo` for this. |
| 7 | Refund timestamp | Would come from the (currently unhandled) `refund.processed` webhook payload — **MISSING**, payload shape is known (`webhookRetention.ts` retention-allowlist references `amount_refunded`, `refund_status`, `payload.refund.entity.*`) but no code persists it today. |
| 8 | Partial/full refund treatment | **PENDING PRODUCT OWNER DECISION** — no governing record states whether a partial refund counts the same as a full refund for PCG-5's rate. |
| 9 | Tier attribution | `Order.productSlug` — **EXISTS**, directly usable once refund events are captured. |
| 10 | Rolling-window treatment | DECIDED: rolling 30 days from purchase (PDEF-3 §10). |
| 11 | Late-refund treatment | DECIDED (PDEF-4 §6.6): window-scoped, immutable, late refund attaches to its own later window. |
| 12 | Duplicate/refund-reversal handling | Not addressed by any governing record — **PENDING PRODUCT OWNER DECISION**, e.g., what happens if a refund is itself reversed/disputed. |
| 13–16 | Identifiers/entitlement interaction | `entitlements.revoked_at`/`revoked_reason` already model a refund-triggered revocation **structurally** (migration `0004_entitlements`), and `core-entitlements/src/reissue.ts` test comments describe "a refund revokes the entitlement" as design intent — but **no live code path calls `revoke()` automatically on a real refund webhook today** (confirmed `it.todo` and absence of `refund.processed` handling). |
| 17–18 | Aggregation / rolling-window freeze | **MISSING / ENGINEERING DESIGN REQUIRED**, same pattern as all prior gates — compounded here by the refund-event source itself being absent. |
| 19 | Insufficient-sample detection | No absolute-count floor stated for PCG-5's denominator — **PENDING PRODUCT OWNER DECISION** on whether a NOT YET EVALUABLE-style floor applies here too. |
| 20 | Independent validation | **Not required by PDEF-4 §6.10** — PCG-5 is monitoring-only; implementation only is required, no independent pre-launch validation. |

**Explicit non-introduction of new refund policy:** this record does not decide partial-vs-full treatment,
duplicate/reversal handling, or an insufficient-sample floor for PCG-5 — each is listed above as `PENDING PRODUCT
OWNER DECISION`, per the instruction not to invent governed refund rules.

## 12. PCG-6 instrumentation requirements — completion

**PDEF-3 §11/§13 definition (verbatim, not altered):** "A user completes the Client Finder workflow when they
complete the required workflow from defining or confirming their targeting criteria through receiving at least
one qualified opportunity and reaching the product-defined opportunity review/action step. Completion does not
require purchasing credits beyond the included monthly allocation and does not require winning or closing a
client." Threshold ≥ 70%, rolling 30 days **from first Client Finder activation**, monitoring-only per PDEF-4
§6.3. **PDEF-3 §11 explicitly decided this does NOT depend on credit usage — this record does not introduce a
credit-consumption requirement anywhere in PCG-6's instrumentation.**

| # | Item | Status |
|---|---|---|
| 1 | Metric definition | DECIDED (quoted above), not altered. |
| 2–3 | Numerator/denominator | Numerator = users reaching the defined end-state within the window; denominator = users who first activated Client Finder within the window. |
| 4 | Population | Client-Finder-specific, combined-primary with per-tier diagnostic. |
| 5 | Activation event | "First Client Finder activation" — **MISSING** as a durable, timestamped event; no code marks a user's first Client-Finder use today in a way distinguishable for this purpose (closest proxy, a `Search` being created, exists per `packages/core-search/src/types.ts`, but "first activation" specifically is not instrumented). |
| 6 | Completion event | PDEF-3's compound definition (targeting criteria defined/confirmed → ≥1 qualified opportunity received → review/action step reached) must map to concrete events. `SearchStatus.COMPLETE` (`core-search/src/types.ts`) is a job-status field for the *search itself finishing*, not evidence that the *user* reached the review/action step — **EXISTS but is the WRONG granularity; requires transformation or a new event**, flagged as **ENGINEERING DESIGN REQUIRED.** The "reaching the review/action step" condition specifically has no identified existing analog — **MISSING.** |
| 7 | Completion timestamp | Would derive from whichever event is eventually chosen for row 6 — not yet defined. |
| 8 | Cohort definition | Users whose first activation falls in the window (per PDEF-3's "from first Client Finder activation" window start) — **ENGINEERING DESIGN REQUIRED**, since activation itself is not instrumented (row 5). |
| 9 | Rolling-30-day treatment | DECIDED: window starts at first Client Finder activation (PDEF-3 §11). |
| 10 | Dual-tier attribution | Per PDEF-4 §6.7 — count once combined, both-diagnostics non-exclusive. |
| 11 | Relationship to credits | **DECIDED — explicitly NONE.** PDEF-3 §11 states completion does not require exhausting or consuming monthly lead-unlock credits beyond the included allocation; this record does not instrument, design, or imply any credit-consumption check for PCG-6, consistent with that decision. The credit mechanism itself remains governed separately by PDEF-2 (50/300 monthly credits) and remains otherwise undesigned (§5). |
| 12–20 | Aggregation / rolling-window / insufficient-sample / validation | **MISSING / ENGINEERING DESIGN REQUIRED**, same pattern as all prior gates; PCG-6 is monitoring-only, so PDEF-4 §6.10 requires implementation only, no independent pre-launch validation. |

## 13. Existing-vs-missing signal matrix

| Signal | Status | Evidence |
|---|---|---|
| Purchase/order records (tier, amount, status, timestamp) | **EXISTS** | `Order`/`Payment` tables, `packages/db/prisma/schema.prisma` |
| Entitlement records (per-tier, dual-tier capable) | **EXISTS** | `entitlements` table, migration `0004_entitlements` |
| Containment/ladder logic | **EXISTS** | `packages/catalog/src/ladder.ts` |
| Browser-emittable funnel event *names* (`funnel_entry_viewed`, `upsell_viewed`, etc.) | **EXISTS** | `apps/web/src/analytics/events.ts`, `funnelEvents.ts` |
| Durable, queryable, server-side funnel/visitor event store | **MISSING** | No `events`/`funnel_events`/`page_views` table anywhere in schema/migrations |
| Durable timestamp on funnel event payloads | **MISSING** | No timestamp field in `FunnelEventMap`/`FunnelEventPayload` |
| Anonymous-visitor → authenticated-user identity linkage | **MISSING** | No merge/reconciliation code found; `users.id` and `entitlements.customer_email` bridge only by email equality |
| Bot/internal-traffic exclusion, visitor dedup | **MISSING** | Only generic IP/email rate limiting exists (`packages/rate-limit/`) |
| Offer-exposure persistence (for PCG-3A/3B denominators) | **MISSING** | `upsell_viewed` is browser-emittable only, not persisted |
| Refund webhook handling / refund table | **MISSING** | `SUPPORTED_EVENTS` excludes refund events; `it.todo` for refund payload shape |
| Auto-revoke-entitlement-on-refund | **MISSING (test-only design intent)** | `reissue.test.ts` comments only; no live trigger |
| Rolling-30-day / time-windowed query layer | **MISSING** | No date-range/window SQL or query utility found anywhere |
| "Qualified visitor" concept | **UNDEFINED GOVERNANCE (eligibility criteria) / MISSING (instrumentation)** | Definition decided (PDEF-3 §13); minimum eligibility criteria and bot-exclusion not decided; no code |
| "Useful outcome" concept | **PARTIAL / CONFLICTING naming** | `feedback.useful` (core-opportunity) is structurally close but scoped to outreach feedback, not confirmed as Client-Finder-specific |
| "Completion" concept | **CONFLICTING naming / MISSING correct granularity** | `SearchStatus.COMPLETE` (core-search) is job-status, not the PDEF-3 workflow-completion definition |
| "Qualification" (prospect) — unrelated same-named concept | **EXISTS, DIFFERENT CONCEPT** | `packages/core-qualification/` — evaluates discovered prospects, not visitors |
| Credit-ledger / usage counters | **MISSING (confirmed, matches governance)** | Zero code matches; no table in any migration |
| Payment/webhook integrity audit & reconciliation tooling | **EXISTS, different purpose** | `packages/core-reconciliation/` — fraud/duplicate detection, not commercial-metric reporting; reusable as a structural pattern for independent validation (see §18) |

## 14. Event/property requirements (consolidated, for future instrumentation design — not decided here)

The following properties would need to exist on a durable, server-persisted event log to support PCG-1..6, based
only on what each gate's PDEF-3/PDEF-4 definition already requires (no new property is invented beyond what the
definitions imply):

- Visitor/session identifier (pre-authentication) — **MISSING**, see §13.
- Linkage from visitor identifier to `users.id`/`entitlements.customer_email` on conversion — **MISSING.**
- Event timestamp on every event — **MISSING** on current browser event payloads.
- Tier/productId on every event where tier attribution matters (PCG-1/3A/3B/4/5/6) — **EXISTS** as a concept on
  purchase-side events (`Order.productSlug`), **MISSING** on the visitor/exposure side.
- Offer-exposure event with `fromTier`/`toTier`/timestamp — **MISSING** as a durable record (exists only as a
  browser-emittable event name).
- Refund event with amount, timestamp, full/partial flag — **MISSING.**
- Client-Finder "activation" event — **MISSING.**
- Client-Finder "completion" event matching the exact PDEF-3 §13 compound definition — **MISSING**, and the
  closest existing analog (`SearchStatus.COMPLETE`) is the wrong granularity.
- "Useful outcome" boolean tied to a specific Client-Finder tier/search — **PARTIAL**, exists for a different
  (outreach-feedback) context; tier-linkage not confirmed.

This record does not specify a final event schema — that is implementation/engineering design, out of scope here.

## 15. Aggregation/measurement logic (consolidated)

Every PCG requires, at minimum, a `COUNT`/`COUNT(DISTINCT ...)`/rate computation scoped to a rolling-30-day
window with a defined start point. **No such query layer exists anywhere in the repository today** (§5, §13).
Building one is engineering design and implementation work, not performed, scheduled, or authorized by this
record.

## 16. Dual-tier handling

PDEF-4 §6.7 is already decided: count once in the combined population per gate; attribute non-exclusively to both
tiers' diagnostic buckets. The repository's `entitlements` table already supports a customer holding both tier
rows simultaneously (§5, §7), so the *data* needed to implement this rule exists; the *query* implementing the
rule does not. No new dual-tier policy is introduced by this record.

## 17. Rolling-window handling

PDEF-3/PDEF-4 already decided: default rolling 30 days, PCG-5 "from purchase," PCG-6 "from first activation," one
closed window is the minimum observation period (PDEF-4 §6.2). **No rolling-window query mechanism exists in the
repository today** (§5, §13, §15). This is flagged as `ENGINEERING DESIGN REQUIRED` uniformly across all six
gates; no new windowing policy is introduced here.

## 18. Insufficient-sample handling

PDEF-4 §6.5 already decided: NOT YET EVALUABLE, not failed, re-checked at each window close, no maximum wait
defined. Mechanically this requires the gate's underlying count/rate query to exist first (§15) and then a simple
threshold comparison against 500 (PCG-1) / 50 (PCG-2) — no equivalent explicit floor is stated anywhere for
PCG-3A/3B/4/5/6's denominators, which is flagged per-gate above as `PENDING PRODUCT OWNER DECISION` where
relevant (§8 row 19, §9, §11 row 19). This record does not invent a floor for those gates.

## 19. Independent-validation design (for the four blocker gates — PCG-1/2/3A/3B)

PDEF-4 §6.10 requires implementation **and** independent validation for these four gates before launch-
qualification use. This section proposes a validation **architecture outline only** — it does not implement,
schedule, or authorize any of it (§23). It explicitly distinguishes three separate things that must not be
conflated:

- **Instrumentation implementation** — building the event capture, persistence, and aggregation described in
  §6–§9 and §13–§15. Not performed here.
- **Independent instrumentation validation** — a second party or process (distinct from the team that built the
  instrumentation) confirming the measured values against raw underlying events. Not performed here; outlined
  below only as a design sketch.
- **Launch authorization** — the separate act of using a validated gate result to actually launch a tier. Not
  addressed by this record at all; remains governed by PDEF-4 §9's authorization boundary and by whatever process
  eventually exercises K1-10 (deployment/release), which remains **NOT AUTHORIZED** regardless of PDEF-4's status.

**Proposed validation architecture outline (design sketch, not implementation):**

| Element | Sketch |
|---|---|
| Source evidence | Raw `Order`/`Payment`/`WebhookEvent` rows for PCG-2/3A/3B; a to-be-built durable visitor/exposure event log for PCG-1/3A/3B's exposure side. |
| Expected event sequence | funnel-entry → qualification-condition-met → (for 3A/3B) offer-exposure → purchase-capture → entitlement-grant. |
| Deterministic test fixtures | Frozen, hand-constructed event sets with known expected PCG-1/2/3A/3B outputs, replayed through the aggregation logic. |
| Edge cases | Window-boundary purchases/events (events exactly at the 30-day edge); simultaneous dual-tier purchase in one session; same-day ₹99→₹499 conversion. |
| Duplicate handling | Reuse the existing `packages/core-reconciliation/` duplicate-detection pattern (already scans `Payment.razorpayPaymentId`, `WebhookEvent.razorpayEventId`) as a structural template for a PCG-specific duplicate check — not yet built for this purpose. |
| Tier attribution tests | Verify `Order.productSlug`-derived attribution against known fixture purchases. |
| Dual-tier tests | Verify PDEF-4 §6.7's "count once combined, both diagnostics" rule against a fixture customer holding both tiers. |
| Rolling-window tests | Verify window-boundary inclusion/exclusion once a windowing mechanism exists. |
| Insufficient-sample tests | Verify the NOT YET EVALUABLE state is produced, not a false pass/fail, when a fixture count is below threshold. |
| Negative cases | Bot/excluded traffic (once an exclusion rule is decided and built) must not count toward PCG-1; a FAILED/EXPIRED order must not count as a buyer for PCG-2. |
| Audit evidence | Persisted raw event/webhook logs (already a strong pattern via `WebhookEvent`) retained long enough to re-derive any PCG result independently. |
| Reconciliation checks | Compare the aggregation-layer's reported PCG value against an independently-written raw-SQL query over the same window, as a cross-check — analogous in spirit to `packages/core-reconciliation/`'s existing duplicate-scan pattern. |

None of the above is built, scheduled, or authorized by this record. The "who performs independent validation"
and "what exact method" questions are explicitly left to engineering/process definition, per PDEF-4 §6.10's own
trade-off note.

## 20. Missing governance decisions (PENDING PRODUCT OWNER DECISION — consolidated)

1. PCG-1's "minimum eligibility criteria for the applicable tier" (§6 row 5).
2. Whether PCG-1 is evaluated aggregate or per-funnel-entry-path given ₹1,499-direct-entry is allowed (§6 row 8).
3. PCG-2's exact window start-point event (§7 row 7).
4. Whether a refunded purchase still counts toward PCG-2's buyer count (§7 row 15).
5. PCG-3A/3B's exact "eligible exposed population" boundary (§8 row 5, §9 row 5 — the latter explicitly flagged
   as open in the original commercial-gates decision record and never closed).
6. PCG-3A/3B's exposure-window start point (§8 row 7, §9 row 7).
7. Whether refunded ₹99/₹499/₹1,499 purchases still count in PCG-3A/3B's numerator/denominator (§8 row 15, §9
   row 15).
8. Whether an insufficient-sample floor (analogous to PCG-1/2's) applies to PCG-3A/3B/4/5's denominators (§8 row
   19, §11 row 19).
9. PCG-4's exact denominator population boundary (§10 row 2–3).
10. Whether the existing qualification-rule evaluator (`core-qualification`) already encodes PDEF-3's exact
    three-part "useful outcome" sub-conditions, or needs new logic (§10 row 5) — this is partly an engineering
    question but has a policy dimension if the existing rules diverge from the PDEF-3 definition.
11. PCG-5's partial-vs-full refund treatment (§11 row 8).
12. PCG-5's duplicate/refund-reversal handling (§11 row 12).

## 21. Implementation dependencies (ENGINEERING DESIGN REQUIRED — consolidated)

1. A durable, server-side, timestamped funnel/visitor event store — does not exist for any gate.
2. An anonymous-visitor-to-authenticated-user identity linkage mechanism.
3. A bot/internal-traffic exclusion and visitor-deduplication mechanism.
4. A durable offer-exposure event log (for PCG-3A/3B denominators).
5. A refund webhook handler, refund table, and auto-revoke-on-refund wiring (for PCG-5, and for entitlement
   accuracy generally).
6. A rolling-30-day (and first-activation-based, for PCG-6) time-windowed query/aggregation layer — exists for no
   gate today.
7. A Client-Finder "activation" event and a correctly-scoped "completion" event matching PDEF-3's exact compound
   definition (current `SearchStatus.COMPLETE` is the wrong granularity).
8. Confirmation (and likely extension) of whether `core-qualification`/`feedback.useful` already satisfy PCG-4's
   exact definition or need new Client-Finder-specific logic.
9. An independent-validation process/method for the four blocker gates (PDEF-4 §6.10), including a validator
   distinct from the implementing team.

None of the above is designed in detail, scheduled, built, or authorized by this record.

## 22. Security/privacy considerations

- **PII boundary already enforced on browser events**: `assertNoPii` (`apps/web/src/analytics/funnelEvents.ts`,
  lines ~76–86) fails closed on anything resembling email/phone/name/address in browser-emitted events. Any new
  durable server-side event store built in a future task should preserve this boundary — browser-originated
  events should remain PII-free, with identity resolution happening server-side via the existing
  `entitlements.customer_email`/`users.id` records, not by adding PII to client-emitted events.
- **K1's personal-contact-identifier screen** (`packages/core-research/src/contactIdentifiers.ts`) exists
  specifically to keep business-intent evidence free of personal contact identifiers; any future PCG-4 "useful
  outcome" instrumentation that touches opportunity/feedback content should be checked against this existing
  boundary rather than introducing a parallel, inconsistent rule.
- **Webhook payload retention**: `packages/core-payments/src/webhookRetention.ts` already redacts old webhook
  payloads after a retention period (migration `0011_webhook_payload_retention`); any new refund-webhook handling
  (§11 row 6) should be designed to fit within this existing retention discipline, not bypass it. This is noted as
  a consideration for future design, not a decision made here.
- No new privacy policy is introduced or implied by this record.

## 23. Product Owner decisions required

Every item listed in §20 is `PENDING PRODUCT OWNER DECISION`. None is answered, inferred, or defaulted by this
record. No analyst recommendation is offered in this document for any of them — this record is evidence-and-gap
documentation only, distinct in kind from `CLIENT_FINDER_PDEF_4_ANALYST_RECOMMENDATION.md`'s earlier role for
Q1–Q10 (which was itself explicitly non-decisional). A future, separate task would be needed to produce analyst
recommendations for the §20 items, if that is wanted next.

## 24. Explicit authorization boundary

**This record grants none of the following, under any circumstance:** code implementation; instrumentation
implementation; billing implementation; credit-ledger implementation; schema or migration changes; validation;
provider/API calls; external research beyond the read-only repository investigation already performed; test
execution; deployment; release; production traffic; launch; commit; or push. It does not treat
`CLIENT_FINDER_PDEF_4_ANALYST_RECOMMENDATION.md`'s prior recommendations as decisions (they remain proposals, per
that document's own status). It does not modify `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`,
`CLIENT_FINDER_PDEF_4_PRODUCT_OWNER_ADOPTION_QUESTIONNAIRE.md`,
`CLIENT_FINDER_PDEF_4_ANALYST_RECOMMENDATION.md`, PDEF-2, PDEF-3, entitlement stacking,
`PROJECT_MASTER_CHECKLIST.md`, `MVP_SCOPE_BOUNDARY.md`, or any code, test, schema, migration, configuration, or
dependency. It is not committed or pushed. K1-10 (deployment/release) remains explicitly **NOT AUTHORIZED**,
unaffected by anything in this record.

## 25. Recommended next governance step

1. Product Owner (or delegated authority, explicitly labeled as such per this project's established practice)
   resolves the §20 `PENDING PRODUCT OWNER DECISION` items.
2. Only after that: a separate, explicitly authorized engineering-design task scopes the §21 implementation
   dependencies into an actual instrumentation build plan — not performed here.
3. Only after instrumentation is implemented: the §19 independent-validation design is executed for the four
   blocker gates, per PDEF-4 §6.10.
4. Only after validation: any launch-qualification decision may use PCG-1/2/3A/3B results — and even then,
   deployment/release (K1-10) requires its own separate authorization, unaffected by any of the above.

**Next governance action:** none of steps 1–4 is performed or authorized by this record; it exists solely to make
the current gap explicit before any of those steps is undertaken.
