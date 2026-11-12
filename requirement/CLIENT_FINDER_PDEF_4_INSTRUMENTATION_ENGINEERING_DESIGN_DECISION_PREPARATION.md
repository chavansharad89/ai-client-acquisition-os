# Client Finder / Client Intent Discovery — PDEF-4 Instrumentation Engineering Design Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-ENGINEERING-DESIGN-DECISION-PREPARATION-001`
**Date:** 2026-10-04
**Type:** Read-only engineering-design **preparation** record. **No implementation, instrumentation, validation,
schema, migration, billing, deployment, release, or launch authority of any kind is granted by this document**
(see §15). This record maps already-decided policy to repository evidence and identifies gaps; it decides
nothing.

---

## 1. Provenance

| Field | Value |
|---|---|
| Requested by | Project owner, via task instruction: "Prepare the engineering-design decision preparation for implementing the already-decided PDEF-4 instrumentation policy." Explicitly READ-ONLY / PREPARATION ONLY. |
| Prepared by | Claude, performing read-only repository/document research only. No Product Owner authority and no engineering-implementation authority is exercised or implied. Where this record draws a conclusion from code evidence (e.g., the `core-qualification` equivalence finding in §9), that conclusion is a **read-only analytical finding**, not a policy decision and not an implementation. |
| Governing policy record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` (`CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001`), decided under delegated Product Owner authority exercised by Claude for that prior task. **Not reopened or reinterpreted here** — every policy citation below quotes that record's decisions verbatim or by exact section reference. |

## 2. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` — verified unchanged before and after writing this record |
| Staged files | 0, before and after |
| Untracked files present before this record | 17 (per `git status --porcelain`), including the governing policy and preparation records this task reads from |
| Existing instrumentation Product Owner decision record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` — confirmed present, DECIDED |
| Existing instrumentation Product Owner decision-**preparation** record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md` — confirmed present, read-only |
| Existing instrumentation **engineering-design** preparation record (this record's own path) | Confirmed **absent** prior to this task — no equivalent record found at this path or any other |
| Existing instrumentation **analyst/gap** preparation record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` — confirmed present; its §5–§19 repository-evidence findings are reused below (same HEAD, re-verified, not re-derived from scratch where unchanged — see §5) |
| File created by this task | this file only |

No baseline discrepancy was found; proceeding was not blocked.

## 3. Governing records (read and reconciled)

| Record | SHA-256 (verified unchanged before and after this task) |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md` | `65691c89c31f8fe5e4068dfb10077f4f306acaad2c0c355ceab5db890abe9449` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` | `b3d2d2ae99b1a61810274ad043101c73d28daab7377b07ded7e9433b6b87598e` |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `requirement/MVP_SCOPE_BOUNDARY.md` | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |

All nine were inspected for this record. None is modified, reopened, or superseded by anything below.

## 4. Decided policy inputs (quoted/cited, not reopened)

Carried forward verbatim from `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001` — this record's sole
job is to map each of these to repository evidence, not to re-decide them:

| # | Policy (governing record §) |
|---|---|
| Q-1 | No eligibility criterion beyond funnel-entry + demonstrated intent (DEC-001 §4 Q-1). |
| Q-2 | One aggregate PCG-1 count, shared across both tiers (DEC-001 §4 Q-2). |
| Q-3 | PCG-2 window anchors to payment-capture timestamp (DEC-001 §4 Q-3). |
| Q-4 | Refunded buyers still count toward PCG-2; immutable once window closes (DEC-001 §4 Q-4, §3 cross-cutting refund principle). |
| Q-5 | "Exposed" = tier-specific offer screen rendered (impression-based, named per-tier step) (DEC-001 §4 Q-5). |
| Q-6 | Exposure window starts at **first** exposure (DEC-001 §4 Q-6). |
| Q-7 | Refunded purchases still count in PCG-3A/3B numerator & denominator; immutable once closed (DEC-001 §4 Q-7, §3). |
| Q-8 | NOT YET EVALUABLE floor principle extended to PCG-3A/3B/4/5; **exact numeric floor explicitly deferred** to a separate Product Owner decision (DEC-001 §4 Q-8). |
| Q-9 | PCG-4 denominator = holders who performed ≥1 Client-Finder search/activation in the window (DEC-001 §4 Q-9). |
| Q-10 | `core-qualification` logic accepted as the PCG-4 condition-(b) test **only if** an engineering equivalence review confirms it; otherwise new logic is required (DEC-001 §4 Q-10). |
| Q-11 | PCG-5 refund rate is transaction-based; partial refund counts the same as full (binary, any amount > 0) (DEC-001 §4 Q-11). |
| Q-12 | Economic finality: reversal corrects the numerator only before window close; immutable after; duplicate deliveries never double-count (DEC-001 §4 Q-12). |
| §3 | Cross-cutting refund principle: a transaction counts at the moment it occurs, for whichever window it falls in; immutable once that window closes. Refund quality is tracked *exclusively* by PCG-5, never by retroactively altering PCG-1/2/3A/3B. |

## 5. Repository evidence (verified for this task; re-confirmed, not blindly inherited)

This task re-verified the key claims of `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` §5–§13
against the current (unchanged, same-HEAD) working tree, and performed additional targeted investigation the
prior record did not need (notably the Q-10 equivalence question, now that policy has fixed *how* an equivalence
finding would be used). Findings:

- **Purchase/payment**: confirmed — `packages/db/prisma/schema.prisma` defines `Order` (`razorpayOrderId`,
  `productSlug`, `amountPaise`, `status: OrderStatus{PENDING|ATTEMPTED|PAID|FAILED|EXPIRED}`), `Payment`
  (`razorpayPaymentId`, `status: PaymentStatus{AUTHORIZED|CAPTURED|FAILED|REFUNDED}`), `WebhookEvent` (deduped on
  `razorpayEventId`).
- **Entitlements**: confirmed — `entitlements` table (migration `0004_entitlements`), one row per
  `(customer_email, product_slug)`; a customer can hold both ₹499 and ₹1,499 rows simultaneously today (structural
  dual-tier support already present).
- **Refund webhook handling**: confirmed **absent**. `SUPPORTED_EVENTS` in the webhook handler includes only
  `payment.captured`; no refund event is processed; the explicit `it.todo('accepts a real refund.processed
  payload shape')` in `tests/contract/razorpay-webhook.contract.test.ts` is unchanged.
- **Rolling-window query layer**: re-confirmed absent by direct search of this task — `grep -rli "rolling"` across
  `packages/` and `apps/` returns **zero matches**; no `thirtyDay`/`rollingWindow` identifier exists anywhere.
  `packages/core-acquisition/src/metrics.ts` only computes rates over caller-supplied, already-filtered in-memory
  arrays — it is not a query layer and has no date-range parameter.
- **`core-reconciliation` structure** (newly inspected for this task, for §11/§14 below): `packages/core-reconciliation/src/detection.ts`
  implements read-only, **half-open time-windowed** (`created_at >= $1 AND created_at < $2`) duplicate-detection
  queries across business tables, explicitly designed so "consecutive windows tile without double-counting a row
  on the boundary." It enforces a strict PII boundary (explicit column allowlists; the file's own comments
  describe a prior incident where `to_jsonb(w)` leaked webhook payloads into a reconciliation snapshot, which the
  current allowlist design exists to prevent). `report.ts` provides `isClean()`/`formatReport()` reporting, free
  of logging side effects, over a `ReconciliationReport` type. This is a structurally reusable **pattern**
  (windowed, read-only, boundary-conscious SQL) for both the rolling-window query layer (§11) and independent
  validation (§10), but it is purpose-built for idempotency/duplicate detection, not for commercial-gate
  computation — reusing its pattern is not the same as reusing its code as-is.
- **`core-qualification` types** (newly inspected for this task, for Q-10/§9 below): `packages/core-qualification/src/types.ts`
  defines `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT', 'CATEGORY_PLAUSIBLE']`, each producing a
  `QualificationCriterionResult{criterion, satisfied, reason, evidenceSignalIds}`, rolled into a
  `QualificationState` of `QUALIFIED | NOT_QUALIFIED | INSUFFICIENT_EVIDENCE` for a **prospect** (keyed by
  `prospectId`, ownership inherited through `opportunityId -> opportunities.user_id`). This evaluates whether a
  *discovered business* plausibly has a need and category match — not whether a Client-Finder search's resulting
  opportunity matches the *user's own configured* requested service / target customer characteristics / minimum
  project-value requirements (PDEF-3's condition (b)).
- **`core-opportunity` types** (newly inspected for this task): `StoredFeedback.useful` (migration `0020_feedback`)
  is a direct boolean capture of "the user considers actionable" — PDEF-3 condition (a). `DetectedOffer{service,
  rationale, estimatedValuePaise, fit, basedOn}` describes the *detected offer's own* characteristics (what service
  was recommended, its estimated value, a fit score) — it is not a boolean confirming the offer was matched against
  the user's own configured criteria; no field here represents "the user's configured target criteria" at all.
- **`core-search` types** (newly inspected for this task): `SearchStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' |
  'FAILED' | 'CANCELLED'` is confirmed to be a job-lifecycle status for the search *process* itself, not an
  activation or completion event in the PDEF-3 sense. A direct grep of `core-search/src/types.ts` for
  `service|customer|minValue|minProjectValue|targetCriteria|criteria` found only `serviceProfileId` (a lineage
  reference to a separate `@acos/core-service-profile` record) — no inline representation of "requested service,
  target customer characteristics, minimum project-value requirements" as a matchable criteria set was found in
  `core-search` either.
- **Bot/internal-traffic exclusion**: re-confirmed absent — only generic per-IP/per-email rate limiting exists
  (`packages/rate-limit/src/policy.ts`), which throttles abuse but does not classify or exclude bot/QA traffic.
- **Identity**: re-confirmed — `users.id` (migration `0012_user_identity`) and `entitlements.customer_email`
  (migration `0004_entitlements`) are bridged only by email equality; no anonymous-visitor-id → authenticated-user
  merge mechanism exists.

## 6. Policy-to-observability mapping

For every decided policy item, the required observable fact, the evidence that would prove it, the candidate
existing code/data, what is missing, and whether an engineering design decision remains:

| Policy | Required observable fact | Required evidence | Candidate existing code/data | Missing capability | Engineering decision required |
|---|---|---|---|---|---|
| Q-1 (no extra eligibility) | A visitor met funnel-entry + demonstrated-intent conditions | A funnel-entry event + an intent-signal event, both durable and timestamped | `funnel_entry_viewed` event *name* (`apps/web/src/analytics/events.ts`) | No durable server-side persistence of this event at all | Yes — event persistence architecture (§9) |
| Q-2 (aggregate PCG-1) | One combined count across both entry paths | Visitor-qualification records not partitioned by entry path | Same as above | Same as above, plus no funnel-entry-path tagging exists (not needed under this policy, since it is aggregate) | Yes — same persistence gap; no path-tagging needed given the aggregate decision |
| Q-3 (PCG-2 window = payment-capture) | Timestamp of payment capture | `Payment` row transition to `CAPTURED` | `Payment.status`, `Payment.createdAt`/`updatedAt` (`packages/db/prisma/schema.prisma`) | **None** — directly usable | No — data exists; only the query/aggregation job is missing (not a policy-meaning decision, see §9 item "rolling-window query strategy") |
| Q-4 (refunded buyers still count) | Payment-capture fact, independent of later refund state | Same `Payment`/`Order` rows; the query must **not** join refund state | Same as above | **None** on the data side — the query simply must not filter by refund state | No — purely a query-construction matter once the rolling-window layer exists |
| Q-5 (exposure = per-tier offer screen rendered) | A durable, per-tier offer-impression event | An "offer rendered" event with tier, customer/visitor identity, timestamp | `upsell_viewed{productId, fromTier}` event *name* only (`apps/web/src/analytics/events.ts`) | Not persisted server-side anywhere | Yes — exposure-event persistence (§9); event naming, if new names are needed beyond `upsell_viewed`, is an engineering decision (see §9 "canonical event model") |
| Q-6 (first-exposure window anchor) | The **first** timestamp a given user/visitor was exposed, per tier | Same exposure event, with "first occurrence" semantics | None | No exposure log exists to even have a "first" over | Yes — same persistence gap, plus a specific "retain first occurrence, not most recent" query/strategy decision |
| Q-7 (refunded conversions still count) | Purchase-capture fact for the numerator/denominator, independent of refund state | `Payment`/`Order`/`entitlements` rows | Same as Q-3/Q-4 | **None** on the purchase side; exposure side missing per Q-5 | No, for the purchase side; Yes, for the exposure side (same gap as Q-5) |
| Q-8 (floor principle, numeric value deferred) | The raw denominator size for each rate-based gate, reported alongside the percentage | A count query over the same population each gate already needs | None (depends on the same missing rolling-window layer) | The rolling-window layer itself; and the **numeric** floor value, which is explicitly a pending Product Owner decision, not an engineering one | Yes for the reporting mechanism (how denominator size is surfaced); **No** engineering decision can set the numeric floor — that is explicitly out of engineering's authority per Q-8 |
| Q-9 (PCG-4 denominator = activated/searched holders) | A Client-Finder search/activation event, attributable to a holder and a tier, within the window | A "search created" or "search started" event | `packages/core-search/` persists `Search` rows (confirmed: `SearchStatus` lifecycle, `serviceProfileId` lineage) — **a `Search` row's existence is itself a candidate activation signal**, distinct from its `status` reaching `COMPLETE` | Whether a `Search` row's mere existence (regardless of status) is the correct "performed a search/activation" signal, or whether only a `COMPLETE`d search should count, is **not yet determined** — see §7 item 6 | Yes — see §9 "activation event" and §7 item 6 |
| Q-10 (conditional `core-qualification` acceptance) | Logical equivalence between `core-qualification`'s criteria and PDEF-3 condition (b) | Side-by-side comparison of criteria definitions | `core-qualification`'s `NEED_DETECTED/EVIDENCE_PRESENT/CATEGORY_PLAUSIBLE` (see §5, §9) | PDEF-3's condition (b) (requested service / target customer characteristics / minimum project-value match) has **no identified implementing field anywhere** in `core-qualification`, `core-opportunity`, or `core-search` | **This record's own finding, per Q-10's required review, is: NOT EQUIVALENT** — see §9 for full reasoning. New logic is therefore required by Q-10's own stated consequence for this case. |
| Q-11 (binary transaction-based refund rate) | Per-transaction boolean: "was any refund amount > 0 recorded against this transaction, ever" | A refund event/flag per `Payment`/`Order` | `PaymentStatus.REFUNDED` enum value exists; no refund webhook populates it | No refund webhook handling exists at all (confirmed §5) | Yes — refund webhook handler (§9) |
| Q-12 (economic finality, idempotent dedup) | A single, idempotent, corrected refund state per transaction | Idempotency key or equivalent on the refund-event record | `WebhookEvent` dedup pattern exists for `payment.captured` (`razorpayEventId` uniqueness) — a directly reusable **pattern**, not yet applied to refund events | No refund-event table/idempotency key exists | Yes — refund-event idempotency design (§9), reusing the existing `WebhookEvent` dedup pattern as a structural template |

## 7. Required engineering investigation — findings

**1. Visitor / funnel-entry identity.** Funnel entry is observable only as a browser-emittable event *name*
(`funnel_entry_viewed`, `apps/web/src/analytics/events.ts`) — nothing persists it server-side. Anonymous visitors
have **no durable identifier** today; authenticated identity exists (`users.id`); session identity was not found
as a persisted, queryable concept (only the browser-event contract references a session implicitly, unpersisted).
Repeated visits cannot be deduplicated today — no visitor-id store exists to deduplicate against. Bots/internal
traffic cannot be distinguished — only generic per-IP/per-email rate limiting exists (`packages/rate-limit/`),
which is a throttle, not a classifier. Existing analytics events are **browser-only**; the only durable,
timestamped, queryable event table in the system is `meta_events` (Meta CAPI dispatch log), scoped to
purchase-class events, not general funnel/visitor events. **ENGINEERING DESIGN REQUIRED** for all of the above.

**2. Client-Finder intent ("demonstrated intent").** No existing code establishes this as a persisted,
timestamped, attributable, auditable fact — the browser event contract defines event *names* that would plausibly
represent intent (e.g., an engagement-class event distinct from a bare page view), but none is persisted
server-side today. Per the task's own instruction, this is marked **ENGINEERING DESIGN REQUIRED** rather than
treated as a reason to alter Q-1's policy (which this record does not reopen).

**3. PCG-1 measurement.** Policy (Q-2) requires one aggregate, shared count. Engineering requirements: a durable
visitor-qualification record (unique id, qualification-condition evidence, timestamp); deduplication of repeat
visits against that id; a rolling-30-day query; auditability via retained raw events. **None of this exists.**
Because the policy is explicitly aggregate (not per-path), engineering must take care **not** to introduce
per-tier or per-path partitioning into the PCG-1 count — doing so would silently recreate the per-path gate the
Product Owner decision explicitly rejected. This is flagged as a constraint on the eventual design, not a new
decision made here.

**4. PCG-2 buyer measurement.** `Order`/`Payment`/`WebhookEvent` (confirmed, §5) already carry everything the
Q-3/Q-4 policy needs: `Payment.status = CAPTURED` is the authoritative payment-capture state; `Payment.createdAt`
is the authoritative capture timestamp; `Order.productSlug` gives tier identification; `entitlements` already
supports dual-tier ownership structurally. `Payment.razorpayPaymentId` uniqueness plus the schema's documented
partial-unique-index intent limit duplicate captured payments per order. **The authoritative source for PCG-2 is
the existing `Payment`/`Order` tables — no new data model is required for PCG-2's buyer-side computation itself**;
only the rolling-window query/aggregation job is missing (§9).

**5. PCG-3A/3B exposure.** No offer-render event is persisted anywhere — `upsell_viewed` exists only as a
browser-emittable event name. Nothing distinguishes a ₹499-offer exposure from a ₹1,499-offer exposure at the
persistence layer, because nothing is persisted. Engineering must support first-exposure attribution (Q-6),
separate ₹499/₹1,499 exposure populations (Q-5), conversion attribution against that exposure, and rolling-30-day
measurement — none of which has an existing substrate. **Whether `upsell_viewed`'s existing name/shape is reused
or a new persisted event type is introduced is an engineering design decision** (§9, "canonical event model"), not
decided here; this record does not invent a new event name.

**6. PCG-4 activation/denominator.** `packages/core-search/` persists `Search` rows with a `SearchStatus` enum
(`PENDING|RUNNING|COMPLETE|FAILED|CANCELLED`). Q-9's policy requires the denominator to be holders who "performed
at least one Client-Finder search/activation" — the policy's own wording is "performed," not "completed
successfully." Whether `SearchStatus.COMPLETE` specifically, or a `Search` row's mere existence (any status, since
even a `FAILED` or `CANCELLED` search still represents an attempted use), is the correct signal for "performed a
search/activation" is **NOT determined by the policy record and is not determined by this investigation either** —
confirmed insufficient evidence at the code level to decide which granularity Q-9 intends. **ENGINEERING DESIGN
REQUIRED**, with a note that if the chosen granularity would change *who* counts in PCG-4's denominator in a way
that changes the gate's reported value, that specific choice has a policy dimension and should be flagged back
(see §14) rather than decided unilaterally by engineering, consistent with Q-9's own policy wording being about
"performed," which this record does not read as requiring successful completion.

**7. PCG-4 qualification equivalence.** See §9 (dedicated section, as required by the task).

**8. PCG-5 refund measurement.** `PaymentStatus.REFUNDED` exists as an enum value but nothing transitions a
payment to it — `SUPPORTED_EVENTS` in the webhook handler lists only `payment.captured`; the refund payload shape
is known (`packages/core-payments/src/webhookRetention.ts`'s retention-allowlist references `amount_refunded`,
`refund_status`, `payload.refund.entity.*`) but unused for state transitions; `tests/contract/razorpay-webhook.contract.test.ts`
has an explicit `it.todo('accepts a real refund.processed payload shape')`. **The existing system does not contain
enough evidence to calculate PCG-5 today** — no refund event is ever recorded. This is unchanged from the prior
preparation record's finding and is re-confirmed here.

**9. Rolling-window engine.** Searched broadly (`grep -rli "rolling"`, `thirtyDay`, `rollingWindow` across
`packages/` and `apps/`): **zero matches**. `packages/core-acquisition/src/metrics.ts` computes rates over
caller-supplied in-memory arrays with no date-range parameter — not a query layer. The closest existing
**pattern** (not a reusable library) is `packages/core-reconciliation/src/detection.ts`'s half-open
(`created_at >= $1 AND created_at < $2`) time-windowed SQL, built for duplicate detection, not commercial-gate
aggregation. **No reusable rolling-window mechanism exists; one must be designed.**

**10. Independent validation.** `packages/core-reconciliation/` is the strongest existing reusable pattern:
read-only, windowed, PII-boundary-conscious SQL against business tables, with a `ReconciliationReport` type and
`isClean()`/`formatReport()` reporting helpers. It is purpose-built for idempotency/duplicate detection (one
dimension: "does a supposedly-unique column repeat"), not for reproducing a commercial-gate *value* from raw
events — reusing its structural pattern (windowed, read-only, explicit column allowlists, no payload leakage) is
sound; reusing its code as-is is not possible, since it answers a different question. No deterministic-replay
test-fixture harness for PCG-style aggregation was found; `tests/contract/` exists as a pattern for
contract-level fixtures (e.g., the webhook contract test) but nothing there replays a frozen event set through a
commercial-gate computation, because that computation does not exist yet. **Engineering-design gap list for
PCG-1/2/3A/3B independent validation:**
  - No raw, durable visitor/exposure event log exists yet to validate PCG-1/3A/3B against (depends on §9's event
    persistence work landing first).
  - PCG-2 is the furthest along: `Payment`/`Order`/`WebhookEvent` already exist, so an independent validator for
    PCG-2 specifically could be built sooner than the others, once the rolling-window query exists, by
    cross-checking the aggregation layer's output against a hand-written raw-SQL query over the same window — the
    same cross-check *shape* `core-reconciliation` already uses for duplicate detection.
  - No deterministic test-fixture harness (frozen event sets with known expected outputs) exists for any of the
    four blocker gates.
  - No "who performs independent validation" process exists or is decided — PDEF-4 §6.10 leaves this to a later,
    separate process definition; unaffected by this record.

**11. Sample-floor dependency.** PCG-3A, PCG-3B, PCG-4, and PCG-5 are all rate-based and therefore technically
require a floor (per Q-8's principle). The observable denominator for each: PCG-3A = count of users first exposed
to the ₹499 offer in the window (once §5/exposure persistence exists); PCG-3B = same for the ₹1,499 offer; PCG-4 =
count of holders who performed ≥1 search/activation in the window (§7 item 6, pending the COMPLETE-vs-any-status
resolution); PCG-5 = count of Client-Finder purchase transactions in the window (already observable via
`Payment`/`Order`). If any such denominator is `0`, no rate is computable at all — the gate must report NOT YET
EVALUABLE (denominator 0 is the clearest possible case of insufficient sample, not a special case requiring new
policy). If the denominator is small-but-nonzero, whether it is "too small" is exactly the **numeric floor**
question Q-8 explicitly deferred to a separate Product Owner decision — **engineering cannot set that number**.
PDEF-4 §6.5's existing NOT YET EVALUABLE semantics are sufficient as the *mechanism* (a third state alongside
pass/fail); what remains undetermined is only the *threshold* that triggers it for the four rate-based gates.
**Policy dependency still pending:** the numeric floor value(s) themselves (Q-8, explicitly deferred). **Engineering
design dependency:** building the denominator-size reporting alongside each gate's percentage, so the floor can be
applied later without re-architecting the computation (already noted in DEC-001 §4 Q-8 and not repeated as a new
decision here).

**12. Dual-tier users.** `entitlements` (migration `0004_entitlements`) already represents dual-tier users
structurally — one row per `(customer_email, product_slug)`, so a customer holding both ₹499 and ₹1,499 simply has
two rows, with `revoked_at`/`revoked_reason` tracked independently per row. `packages/catalog/src/ladder.ts`'s
`PRODUCT_LADDER`/`impliedProductIds()` models containment (Advanced implies/governs feature access per PDEF-2) but
does not merge or collapse the two entitlement rows. This existing structure is sufficient to preserve PDEF-4
§6.7's "count once combined, both diagnostics" rule **without any entitlement-logic change** — the combined count
needs only to deduplicate by customer identity (not by entitlement row) when computing PCG-2/4/5/6, while the
per-tier diagnostic query filters by `product_slug` without deduplicating across tiers. No accidental
double-counting risk was identified in the *data model*; the risk, if any, would be introduced only by how the
eventual aggregation query is written (an engineering-design matter, not a data-model gap).

**13. Data integrity/auditability.** For PCG-2, "why was this user counted / not counted" is answerable today
from existing data alone: the specific `Payment`/`Order` row, its `status`, `productSlug`, and `createdAt` fully
explain inclusion or exclusion. For PCG-1, PCG-3A/3B's exposure side, and PCG-4's activation side, the same
question is **not yet answerable**, because no source event is persisted to point to — this is the same gap
already identified per-gate in §6 and §7, not a new one. PCG-5's refund state is not yet answerable for the same
reason (§7 item 8). No schema is proposed here to close these gaps — that remains for the engineering-design
decisions in §9.

## 8. Existing capabilities (consolidated)

| Capability | Status | Evidence |
|---|---|---|
| Purchase/order/payment records (tier, amount, status, timestamp) | **EXISTS** | `Order`/`Payment`, `packages/db/prisma/schema.prisma` |
| Webhook event dedup pattern (`razorpayEventId` uniqueness) | **EXISTS** | `WebhookEvent`, schema.prisma |
| Entitlement records, dual-tier capable | **EXISTS** | `entitlements` table, migration `0004_entitlements` |
| Containment/ladder logic | **EXISTS** | `packages/catalog/src/ladder.ts` |
| Browser-emittable funnel/offer event *names* | **EXISTS (names only)** | `apps/web/src/analytics/events.ts`, `funnelEvents.ts` |
| `feedback.useful` boolean (PDEF-3 condition (a) analog) | **EXISTS** | `packages/core-opportunity/src/types.ts`, migration `0020_feedback` |
| Windowed, read-only, PII-conscious SQL **pattern** | **EXISTS (pattern, different purpose)** | `packages/core-reconciliation/src/detection.ts` |
| `Search` row persistence with lifecycle status | **EXISTS** | `packages/core-search/src/types.ts` |
| `core-qualification`'s prospect-plausibility evaluator | **EXISTS (different concept)** | `packages/core-qualification/src/types.ts` |

## 9. Missing capabilities and engineering design decisions required

| # | Decision | Current evidence | Possible approaches | Tradeoffs | Governing constraints | Separate Product Owner decision actually required? |
|---|---|---|---|---|---|---|
| 1 | Event-persistence architecture for visitor/funnel/exposure events | None exists; only browser-event names (§5, §7.1, §7.5) | A durable append-only event table; reuse/extend `meta_events`; a dedicated event-store service | Generality vs. speed to build; query ergonomics | Must preserve `assertNoPii`'s existing browser-event PII boundary (`funnelEvents.ts`) | **No** — storage technology/shape is pure engineering |
| 2 | Visitor identity strategy (anonymous-visitor id) | None exists (§5, §7.1) | Cookie/localStorage-issued id persisted server-side on first event; server-assigned id on first request | Privacy surface, cross-device limits | Must not introduce PII into the id itself | **No** — identity *mechanism* is engineering; but see #14 below for a related boundary note |
| 3 | Authenticated-identity linkage (anonymous → `users.id`) | None exists (§5) | Merge-on-login by matching session/cookie id; merge-on-purchase by email | Which merge point is chosen can affect whether a visitor is "the same visitor" pre/post-signup for PCG-1→2 continuity, but does not change any gate's *decided* definition | Q-1/Q-2 do not require this linkage for PCG-1 itself (aggregate, no eligibility beyond funnel-entry+intent); it matters only for downstream funnel analysis not covered by a hard launch blocker | **No** — PCG-1/2 as decided do not depend on this linkage existing; a monitoring-only, non-gate funnel report might want it, but that is not in scope of PDEF-3/4's six gates |
| 4 | Bot/internal-traffic exclusion mechanism | Only generic rate limiting exists (§5, §7.1) | Known-internal-IP/email allowlist exclusion; UA/behavioral heuristics; no exclusion (rely on Q-1's policy, which already declined to add an eligibility filter beyond funnel-entry+intent) | A heuristic exclusion could itself be an unintended "eligibility criterion" the Q-1 decision explicitly declined to add | Q-1 (DEC-001) explicitly decided no eligibility criterion beyond funnel-entry + demonstrated intent — any bot/internal exclusion mechanism must not become a de facto fourth condition that changes who is "qualified" | **Flagged, not manufactured**: whether any exclusion mechanism changes PCG-1's counted population is a question that *could* reopen Q-1 if engineering's chosen mechanism has that effect — engineering should design it to exclude only traffic that is not a visitor at all (e.g., automated crawlers, internal test accounts), not to add a new eligibility bar; if a proposed mechanism would change who counts as "qualified" under Q-1's own terms, that specific effect — not the mechanism itself — should be flagged back, not decided unilaterally |
| 5 | Exposure-event persistence and canonical event model (names, if new ones are needed) | `upsell_viewed` exists as a name only (§5, §7.5) | Persist `upsell_viewed` as-is; introduce a new persisted event type scoped per-tier | Reusing an existing name keeps the browser contract stable; a new name allows a cleaner server-side schema | Q-5's policy (impression-based, per-tier named step) must be satisfied by whichever is chosen | **No** — event naming/schema is engineering, provided the chosen event still represents exactly Q-5's decided impression-based definition |
| 6 | Conversion attribution mechanism (exposure → purchase) | Exposure side missing entirely; purchase side exists (§5, §6) | Join on customer identity once both sides are persisted; join on a session/visitor id carried through checkout | Correctness depends on #2/#3 being resolved first | Q-6's first-exposure-controls-attribution rule must be preserved in the join logic | **No** — purely a query/join design question once the underlying events exist |
| 7 | Activation/search event scoping for PCG-4 (`SearchStatus.COMPLETE` vs. any-status `Search` row) | `Search` rows persist with `SearchStatus` (§5, §7.6) | Count any `Search` row as "performed"; count only `COMPLETE` searches; count a narrower "activation" distinct from "search" | Materially changes who is in PCG-4's denominator and therefore the reported ≥60% rate | Q-9's wording is "performed... a search/activation," not "completed successfully" | **Potentially yes** — flagged in §14 as an open governance dependency, since this choice can change PCG-4's reported value, which is the kind of consequence the task instructs should be escalated rather than decided unilaterally by engineering |
| 8 | Refund-state model and webhook handling | Enum value exists; no transitions, no handler (§5, §7.8) | Extend `webhookHandler.ts`'s `SUPPORTED_EVENTS` to include `refund.processed`/related events; persist a refund table keyed by payment | Must support Q-11's binary any-amount-counts rule and Q-12's economic-finality/idempotency rule | Must reuse the existing `WebhookEvent` dedup pattern (`razorpayEventId`) as the idempotency template, per Q-12's own instruction not to invent a new idempotency mechanism from scratch | **No** — implementation shape is engineering; the policy (binary, economic-finality, pre-close-only correction) is already decided (Q-11/Q-12) |
| 9 | Rolling-30-day query/aggregation strategy | Does not exist anywhere (§5, §7.9) | A generalized windowed-query utility (possibly informed by `core-reconciliation`'s half-open-window pattern); per-gate bespoke queries | A shared utility reduces duplication across six gates but is a bigger first build; bespoke queries ship faster per-gate but risk window-boundary inconsistency across gates | Must implement the half-open "no boundary double-count" discipline already proven in `core-reconciliation/src/detection.ts` | **No** — pure engineering/architecture choice |
| 10 | Immutable-closed-window snapshot strategy | Does not exist (§5) | Persist a snapshot row per gate per closed window; recompute on demand from raw events every time, trusting the window boundary alone for immutability | A persisted snapshot gives a durable audit trail (§13) more cheaply than recompute-on-demand; recompute-on-demand is simpler but relies entirely on event retention for auditability | Must honor the §3 cross-cutting immutable-at-close principle (Q-4/Q-7/Q-12) | **No** — pure engineering/architecture choice |
| 11 | Qualification-equivalence handling (Q-10's consequence) | Determined **NOT EQUIVALENT** by this record's own investigation (§5, §9 below) | Build new, Client-Finder-specific logic for condition (b), per Q-10's own stated fallback | New logic must represent "requested service / target customer characteristics / minimum project-value" matching against the user's *own configured* criteria — not reuse `core-qualification`'s prospect-plausibility criteria | Q-10 already specifies the consequence of a non-equivalence finding: new logic is required | **No** — Q-10 already decided what happens on this finding; building the new logic is engineering work, not a new policy question |
| 12 | Independent-validation architecture for PCG-1/2/3A/3B | `core-reconciliation`'s pattern is reusable in shape only (§7.10) | A bespoke validator reusing the windowed/read-only/PII-boundary pattern; a generic replay harness over frozen fixtures | See §10 | PDEF-4 §6.10 requires independent validation before launch-qualification use; who performs it and the exact method remain explicitly undecided by PDEF-4 itself | **No** — the "build it" decision is engineering; the "who is independent enough" process question is explicitly left to a separate process definition by PDEF-4 itself, not manufactured here |
| 13 | Audit-evidence format | No format exists yet (§7.13) | Raw-event retention plus a per-evaluation evidence bundle (source rows + query + result); reconciliation-style formatted report | Must answer "why counted / why not counted" per §13's requirement | None beyond the general auditability requirement already implicit in PDEF-4 §6.10's independent-validation requirement | **No** — format is engineering, provided it can answer the two §13 questions for every gate |

## 10. Independent-validation design gaps (PCG-1/2/3A/3B)

Consolidated from §7 item 10:

- **PCG-1**: no raw visitor-qualification event log exists to validate against; blocked on item #1/#2 in §9.
- **PCG-2**: closest to validatable today — `Payment`/`Order`/`WebhookEvent` already exist; blocked only on the
  rolling-window query (§9 item 9) and an actual cross-check job/process, not on any missing source data.
- **PCG-3A**: no exposure log exists (purchase side is as validatable as PCG-2's); blocked on §9 item 5.
- **PCG-3B**: same as PCG-3A.
- No deterministic-replay fixture harness exists for any of the four gates.
- No "who is independent enough to validate" process exists or is decided; PDEF-4 §6.10 defers this explicitly;
  not manufactured as a Product Owner question here, since PDEF-4 already frames it as a process definition, not
  a metric-meaning question.

## 11. Sample-floor dependency (restated precisely)

- **Policy dependency still pending** (not answerable by engineering): the specific numeric minimum-denominator
  value(s) for PCG-3A, PCG-3B, PCG-4, and PCG-5, explicitly deferred by Q-8 of
  `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001` to a separate Product Owner decision. This record
  does not propose a number.
- **Engineering design dependency** (answerable by engineering once the rolling-window layer exists): surfacing
  each gate's raw denominator size alongside its computed percentage, and implementing the mechanical "denominator
  == 0 ⇒ NOT YET EVALUABLE" case now (since zero is unambiguous and requires no numeric-floor policy input at
  all), while gating anything above zero on the still-pending numeric floor.

## 12. Auditability requirements (consolidated)

For every one of the six gates, "why was this user counted" / "why was this user not counted" requires, at
minimum, the following evidence to exist and be retrievable per user per window — none of this is schema design,
only the list of facts that must be reconstructable:

| Gate | Evidence needed |
|---|---|
| PCG-1 | Source funnel-entry event, source intent-demonstration event, both timestamps, visitor identity |
| PCG-2 | Payment-capture event, timestamp, tier, customer identity, refund state (recorded but not used to exclude, per Q-4) |
| PCG-3A/3B | Exposure event (tier, timestamp, identity), purchase event (same), refund state (recorded but not used to exclude, per Q-7) |
| PCG-4 | Activation/search event, tier/entitlement state, qualification result (once Q-10's new-logic requirement is met), `feedback.useful` value |
| PCG-5 | Purchase transaction, any-refund-amount boolean, refund timestamp, reversal/correction history up to window close (per Q-11/Q-12) |

PCG-2's evidence set is fully reconstructable today from existing tables; every other gate's evidence set has at
least one missing source event, per §6–§8.

## 13. Implementation prerequisites (ordering, not scheduling or authorizing)

Per the governing records' own "recommended next governance step" sequencing (not altered here): policy (done,
DEC-001) → this engineering-design preparation (this record) → a separate, explicitly authorized engineering-design
task that makes the §9 decisions concrete → implementation → independent validation of the four blocker gates
(§10) → only then, launch-qualification use of PCG-1/2/3A/3B results, with deployment/release (K1-10) requiring
its own separate authorization throughout.

## 14. Open governance dependencies discovered by this task

1. **§9 item 7 (PCG-4 activation granularity)** — whether "performed a search/activation" means any `Search` row
   or only a `COMPLETE`d one is flagged as a decision that could change PCG-4's reported value. This record does
   not escalate it as a formal new Product Owner question (the task instructs not to manufacture one where the
   choice is purely engineering), but flags it because the *wrong* choice could silently change a monitoring
   gate's meaning; a future engineering-design task should confirm with Product Owner guidance if the two
   candidate readings would produce materially different PCG-4 values once real data exists, rather than picking
   silently.
2. **§9 item 4 (bot/internal exclusion vs. Q-1)** — flagged as a boundary condition on the eventual mechanism
   design, not a new question, since Q-1 already decided no additional eligibility criterion; any exclusion
   mechanism must be verified, once designed, not to have reintroduced one in effect.
3. No other new Product Owner dependency was discovered. All other items in §9 are confirmed, by the "changes the
   meaning of a governed metric" test the task specifies, to be pure engineering choices.

## 15. Authorization boundary

**NO IMPLEMENTATION AUTHORITY. NO SCHEMA/MIGRATION AUTHORITY. NO INSTRUMENTATION AUTHORITY. NO BILLING AUTHORITY.
NO VALIDATION EXECUTION AUTHORITY. NO DEPLOYMENT/RELEASE AUTHORITY. NO LAUNCH AUTHORITY.**

The only authorization exercised by this task is read-only repository investigation and preparation of
engineering-design decision material. This record does not modify, reopen, or alter
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`,
`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`,
`PROJECT_MASTER_CHECKLIST.md`, `MVP_SCOPE_BOUNDARY.md`, or any code, test, schema, migration, configuration, or
dependency file. No provider/API call was made. No deployment, release, production traffic, commit, or push
occurred.

## 16. Next governance step

1. A separate, explicitly authorized engineering-design task makes the §9 decisions concrete (event schema,
   persistence architecture, exact query implementations) — not performed here.
2. Within that task, confirm the two items flagged in §14 do not silently alter a gate's reported meaning before
   finalizing their implementation.
3. Separately, a Product Owner decision sets the numeric sample-floor value(s) deferred by Q-8 (§11) — not
   performed here.
4. Only after implementation: independent validation of PCG-1/2/3A/3B, per PDEF-4 §6.10 and the gaps in §10.
5. Only after validation: any launch-qualification decision may use PCG-1/2/3A/3B results — and even then,
   deployment/release (K1-10) requires its own separate authorization, unaffected by any of the above.

**Next governance action:** none of steps 1–5 is performed or authorized by this record.

---

## ENGINEERING ANALYST OBSERVATION — NOT A DECISION: `core-qualification` equivalence conclusion (§6 Q-10, §9 item 11)

Per the task's required explicit conclusion format:

**Conclusion: NOT EQUIVALENT.**

**Reasoning:** PDEF-3's "useful outcome" condition (b) requires that an opportunity "satisfies the user's
configured target criteria, including the requested service, target customer characteristics, and minimum
project-value requirements." `core-qualification`'s three criteria — `NEED_DETECTED`, `EVIDENCE_PRESENT`,
`CATEGORY_PLAUSIBLE` (`packages/core-qualification/src/types.ts`) — evaluate a different question entirely:
whether a *discovered prospect* plausibly has a business need, whether evidence for that need exists, and whether
the prospect's category is plausible as a match. None of the three is a check against the *searching user's own
configured* service/customer/value criteria — `core-qualification` has no input field representing the user's
configured target criteria at all; its inputs are keyed to `prospectId`/signal evidence, not to a search's
configured parameters. `core-opportunity`'s `DetectedOffer{service, estimatedValuePaise, fit, ...}` describes the
*recommended offer's own* attributes (what was suggested, its estimated value, a fit score against the signals),
not a boolean "the user's configured minimum project-value requirement was met." `core-search`'s types expose only
a `serviceProfileId` lineage reference, with no inline representation of "requested service / target customer
characteristics / minimum project value" as a criteria set to match against. Across all three packages searched,
no field or evaluator was found that encodes exactly PDEF-3 condition (b)'s three named sub-parts.

**Consequence per Q-10's own policy:** since the review finds divergence (not equivalence), Q-10's decision already
specifies the outcome: "new, Client-Finder-specific logic must be written for condition (b)." This record does not
design that logic — only confirms, as the explicitly requested read-only equivalence check, that it is required.
