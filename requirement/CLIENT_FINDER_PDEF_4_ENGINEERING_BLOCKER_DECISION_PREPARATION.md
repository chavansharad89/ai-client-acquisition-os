# Client Finder / Client Intent Discovery — PDEF-4 Engineering Blocker Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-ENGINEERING-BLOCKER-DECISION-PREPARATION-001`
**Date:** 2026-10-05
**Type:** Read-only preparation/questionnaire record. **This record creates, implies, infers, or authorizes no
engineering decision, no Product Owner decision, no implementation, no test change, no schema/migration change,
no configuration/dependency change, no validation authorization, and no deployment/release/launch action of any
kind.** Every blocker below ends in a blank `PRODUCT OWNER / ENGINEERING SELECTION` field.

---

## 0. Baseline

| Field | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD at start and end of this task | `af9ede93830f5e3e611195dc2451a470364def74` — unchanged |
| Staged files | 0, before and after |
| Primary input | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md` (SHA-256 `e401fae086f0f8f849684c819464e6705f0144cac720d7aff5853b2104fdfebb`), §7 "Unresolved blockers" |

Governing records, treated as already decided and **not reopened** anywhere below (SHA-256 re-verified unchanged before and after writing this record):

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md` | `e401fae086f0f8f849684c819464e6705f0144cac720d7aff5853b2104fdfebb` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` | `8ddf7d0410ae4023a109e2712e6b4c86b9007df80d2f2880d6d28f720deadde9` |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/MVP_SCOPE_BOUNDARY.md` | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |

PRD V2.2 (`requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md`) and `docs/ARCHITECTURE.md` were both consulted for context; neither is altered. No governing record above is modified, reopened, or superseded by anything below.

**Governance rule followed throughout:** no option below is treated as selected because it is first-listed, matches an existing implementation, follows an obvious engineering pattern, echoes an analyst observation, is internally consistent with another already-decided gate, or is numerically similar to another gate's value. Only an explicitly supplied selection in the blank field becomes DECIDED.

---

## 1. Blockers B-1 through B-9 (carried forward from the implementation-authorization preparation record)

---

### B-1 — ED-9 "opportunity reviewed" event: exact semantics and UI call site

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` ED-9 (adopts a dedicated event, decouples from `SearchStatus`/`feedback`); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`'s compound completion definition (not reopened — the *definition* is fixed; this blocker is only the *implementation mapping* to it).
2. **Existing repository evidence (re-inspected for this record):**
   - `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` — a server-rendered "Prospect detail" page (`export const dynamic = 'force-dynamic'`), reading `getFeedback`, `getOpportunity`, `getOpportunityQualification`, `getOpportunityScore`, `listResearchSignals`, etc., and rendering a `FeedbackForm` client component. A GET-style page render with no persisted side effect today.
   - `apps/web/src/components/client-finder/FeedbackForm.tsx` — a client component that `POST`s to `/api/opportunities/:id/feedback` only when the user explicitly submits a useful/not-useful verdict + reason.
   - `apps/web/app/api/opportunities/[id]/feedback/route.ts` — the route handler; calls `@acos/core-opportunity.recordFeedback()`.
   - `packages/core-opportunity/src/service.ts` lines ~486–503 (`recordFeedback`) — persists via `deps.feedback.upsert(userId, opportunity.id, validated, now)`.
   - `packages/core-opportunity/src/service.ts` lines ~517–553 — **the repository's own code explicitly states this exact gap already**: "Deliberately does NOT report a 'reviewed' count. Stage Q ('USER REVIEW') ... describes a UI interaction, not a persisted signal: no field, table, acceptance criterion, decision record or correction anywhere in PRD V2.2 defines what 'reviewed' means as data, what would set it, or whether it needs its own persistence. Inventing an answer (e.g. treating a `getOpportunity()` call as 'reviewed') would mean either giving a Phase 9 read a persisted side effect it does not have today ... or adding a new mutation surface nothing yet calls ... This is reported as an open decision, not resolved by assumption."
   - Migration `0020_feedback`: `feedback` has `UNIQUE(opportunity_id)` — one feedback row per opportunity per user, upserted, not append-only.
3. **Exact unresolved question:** What exact user action constitutes "opportunity reviewed"? At what exact UI/server call site is the event emitted — the `[id]/page.tsx` GET render (view-based), the `FeedbackForm`/`POST /api/opportunities/:id/feedback` submission (action-based), or a new, distinct UI element not yet built? Is it emitted once per opportunity or possibly multiple times (e.g., once per page view)? What is the deduplication key? What timestamp is authoritative? What identifiers (opportunityId, userId) must be captured?
4. **Options:**
   - **Option 1 — page-view-based:** fire on every (or first) render of `[id]/page.tsx`. Verified existing call site; requires adding a persistence side effect to a currently read-only server component.
   - **Option 2 — feedback-submission-based:** treat the existing `POST /api/opportunities/:id/feedback` call as "reviewed" (feedback implies review). Verified existing call site; no new UI surface; but conflates "reviewed" with "gave feedback" (ED-9 already rejected this as Option B when it rejected reusing `feedback` directly — restated here as a concrete, nameable call site, not newly invented).
   - **Option 3 — new, dedicated UI action:** add a distinct, not-yet-built UI element (e.g., an explicit "Mark reviewed" control, or an instrumentation call fired by `[id]/page.tsx` distinct from its existing reads) whose sole purpose is to record this event. No existing call site; net-new UI/UX surface.
   - **Option 4 — first-view-only, deduplicated by (userId, opportunityId):** a refinement of Option 1 that fires once (first render only), using a database check-then-write or an upsert-with-unique-constraint to guarantee single-fire.
5. **Consequences/tradeoffs:** Option 1 (plain) risks firing on every reload, inflating or at minimum complicating the numerator unless deduplicated (Option 4 addresses this at added implementation cost). Option 2 reuses no new surface but was already identified by ED-9 itself as conflating two distinct concepts, which could undercount (a user who reviews without submitting feedback is never counted). Option 3 is the most semantically precise but is net-new product surface requiring its own UX decision, which is itself a product-design question beyond this record's scope. Option 4 is the most robust of the "reuse the detail page" family but adds a persistence-on-read side effect to a component explicitly documented in-repo as deliberately not having one.
6. **Dependencies:** W-1 (durable event store) must exist first; interacts with B-9 (PCG-6's floor) and B-8 (PCG-6's population/numerator) below.
7. **Analyst observation — NOT A RECOMMENDATION:** the repository's own Phase 15 comment in `service.ts` frames this exact question as already "reported as an open decision, not resolved by assumption" — independent confirmation that no answer should be inferred from existing code, consistent with this blocker's governance rule.
8. **Decision authority:** Jointly coordinated — Product Owner (what "reviewed" means as a product concept) and Engineering (which concrete call site/mechanism implements it).
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-2 — ED-12 independent-validation ownership, retention, and approval authority

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` ED-12 (Option C: production cross-check + deterministic fixtures); `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.10 (independent validation "by a party distinct from the implementing team" required before launch-qualification use of PCG-1/2/3A/3B) — the *requirement* is decided; *who* performs it is explicitly left to a separate process definition by that same record.
2. **Existing repository evidence:** No validation-ownership, review-approval, or evidence-retention process exists anywhere in this repository today (no CI validation-gate config, no reviewer-role concept in code, no retention-policy document found for this purpose). `packages/core-reconciliation/`'s `ReconciliationReport`/`isClean()`/`formatReport()` pattern (referenced by ED-12/ED-13) is a reporting *format* precedent, not a process/ownership precedent — it answers "what evidence looks like," not "who signs off on it."
3. **Exact unresolved question:** Who owns validation (a separate engineer, a non-implementing reviewer, the Product Owner, or automated CI plus independent human review)? Who is authorized to approve validation evidence as sufficient? What evidence must be retained (raw rows, both computed values, the match/mismatch record — all already specified in the prior preparation record's §6 — or more)? For how long? Where is it stored (a dedicated table, a document, a CI artifact)?
4. **Options:**
   - **Option 1 — a named non-implementing engineer** reviews and signs off per validation run, evidence retained as a database table row (extends W-19's evidence-bundle work).
   - **Option 2 — automated CI check plus independent human review**, where CI runs the deterministic fixture suite on every change and a human (distinct from the implementer) reviews the production cross-check before each launch-qualification decision.
   - **Option 3 — the Product Owner itself** reviews and approves validation evidence directly, without a separate engineering reviewer role.
   - **Option 4 — a hybrid**, where CI gates routine correctness (fixtures) and a separate, explicitly named human role gates the production cross-check specifically for launch-qualification use.
5. **Consequences/tradeoffs:** Option 1 is simplest to staff but depends entirely on one person's availability and consistency. Option 2 is the most repeatable/auditable but requires CI infrastructure investment this repository does not yet have for this purpose. Option 3 keeps implementation and validation authority separate from each other (a core requirement of §6.10) only if the Product Owner is not also the implementer — this is a people/process fact outside this document's authority to assume. Option 4 most closely matches ED-12's own "both tracks" design but requires defining two separate roles/processes instead of one.
6. **Dependencies:** W-17/W-18 (validation architecture) must exist before any of these can run; this blocker's resolution does not block *building* the validation mechanism, only *using* its results for launch-qualification.
7. **Analyst observation — NOT A RECOMMENDATION:** PDEF-4 §6.10 itself already states this is deliberately left to a separate process definition — it is not an oversight of any prior record in this chain, and this record does not attempt to fill that deliberate gap with an assumption.
8. **Decision authority:** Product Owner (who is authorized to approve) and Engineering (what evidence format/retention is technically produced) jointly; the staffing/role decision is Product-Owner-level, not inferable from code.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-3 — Q-10 qualification-equivalence evaluator implementation contract

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` Q-10 (if non-equivalent, new Client-Finder-specific logic required, `core-qualification` not reusable as-is); `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` ED-10 (new standalone evaluator module, persisted result). Non-equivalence itself is **already established** by the engineering-design chain and is **not reopened** here — this blocker is the evaluator's exact implementation contract.
2. **Existing repository evidence (re-inspected for this record):**
   - `packages/core-qualification/src/types.ts` — `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT', 'CATEGORY_PLAUSIBLE']`, each a `QualificationCriterionResult { criterion, satisfied, reason, evidenceSignalIds }`.
   - `packages/core-qualification/src/evaluator.ts` — `evaluateQualification(input: QualificationEvaluatorInput): QualificationEvaluation` is a **pure, deterministic function** (explicitly documented: "no I/O, no clock, no randomness, no LLM call"); input is `{ needDetected: boolean; signals: StoredResearchSignal[]; categoryPlausibility: StoredCategoryPlausibilityDetermination | null }`; NEED_DETECTED short-circuits EVIDENCE_PRESENT; CATEGORY_PLAUSIBLE is evaluated unconditionally but does not override a NOT_QUALIFIED state.
   - `packages/core-qualification/src/rules.ts` — each criterion is a separate pure function (`evaluateNeedDetected`, `evaluateEvidencePresent`, `evaluateCategoryPlausible`), each operating over already-persisted data (no new fetch, no LLM call).
   - `packages/core-search/src/types.ts` — `Search` carries an immutable *snapshot* of the user's configured criteria (`service`, `target_customer`, `geography`, `min_project_value_paise`, `triggers`, `keywords`, `rationale`), copied from `service_profiles` at Search-creation time (migration `0014_searches`) — this is the authoritative source for "the user's own configured service/customer/value criteria" that PDEF-3 condition (b) requires matching against, and which none of `core-qualification`'s three existing criteria reference.
   - `packages/db/prisma/migrations/0022_qualifications` — `qualifications` table stores `criteria JSONB`, `state`, `evaluator_version`, `evaluated_at` — an existing persistence pattern the new evaluator could structurally mirror (not reuse the table itself, per ED-10, which requires a module/table separate from `core-qualification`).
3. **Exact unresolved question:** What are the new evaluator's exact inputs, outputs, criteria, required evidence, determinism/idempotency guarantees, failure behavior (e.g., missing/incomplete search-criteria snapshot), and audit-evidence shape?
4. **Options (not mutually exclusive — each is a separate axis requiring its own selection):**
   - **Inputs:** (a) the `Search` row's immutable criteria snapshot + the `Opportunity`'s own attributes only; or (b) (a) plus live `service_profiles` data (rejected by ED-10's own snapshot-fidelity reasoning unless explicitly chosen here, since `searches` intentionally never re-reads `service_profiles` after creation per migration `0014`'s own comment).
   - **Outputs:** (a) a single boolean match/no-match; or (b) a structured `QualificationCriterionResult`-shaped breakdown (service match, customer match, value-threshold match, each independently satisfied/not), mirroring `core-qualification`'s existing shape without reusing its code.
   - **Determinism:** (a) pure function, no I/O, mirroring `evaluator.ts`'s existing discipline exactly; or (b) allowed to read additional persisted data at evaluation time (less pure, but potentially necessary if evidence beyond the Search snapshot is required).
   - **Failure behavior:** (a) a missing/malformed criteria field causes a hard error (fail-closed, no result recorded); or (b) a missing field causes a specific criterion to be marked not-satisfied with a stated reason (fail-soft, consistent with `core-qualification`'s own "a definite negative conclusion... not a lack of evidence" framing for `needDetected=false`).
5. **Consequences/tradeoffs:** Option (a)-inputs preserves the audit guarantee that a Search's qualification result never silently changes if the profile is later edited (consistent with migration `0014`'s stated invariant); option (b)-inputs would reopen that invariant and is flagged as a likely non-starter rather than a neutral choice, though it is not foreclosed by this record. A boolean-only output (outputs-a) is simpler but gives less audit granularity than a per-criterion breakdown (outputs-b), which ED-13's evidence-bundle goal (§6 of the engineering-design decision) would benefit from. Fail-closed is simpler to reason about but could silently suppress legitimate PCG-4 numerator members if criteria snapshots are ever incomplete for a benign reason; fail-soft requires defining what "not satisfied" vs. "indeterminate" means for this evaluator, which is itself an undecided sub-question.
6. **Dependencies:** Independent of W-1 (visitor events); depends only on existing `service_profiles`/`searches`/`core-opportunity` data. Feeds W-12/B-7 (PCG-4's numerator) directly.
7. **Analyst observation — NOT A RECOMMENDATION:** `core-qualification`'s own existing discipline (pure functions, explicit short-circuit documented in comments, fail-soft treatment of `needDetected=false`) is cited here only as repository evidence of a pattern that exists, not as a stated preference for the new evaluator to follow it.
8. **Decision authority:** Engineering (the contract is an implementation-design question), with Product Owner input specifically on failure-behavior (b) since a fail-closed choice could suppress monitoring-gate data the Product Owner relies on for PCG-4 visibility.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-4 — Refund contract-test scope

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` ED-6 (reuse `WebhookEvent` dedup, isolate refund logic); `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` Q-11/Q-12 (binary any-refund-counts, economic finality, pre-close-only correction — **already decided, not reopened**). This blocker is the *test-case enumeration*, not the policy.
2. **Existing repository evidence (re-inspected for this record):**
   - `tests/contract/razorpay-webhook.contract.test.ts` (full file, 10 lines): three `it.todo` stubs — `'accepts a real payment.captured payload shape'`, `'accepts a real payment.failed payload shape'`, `'accepts a real refund.processed payload shape'` — none implemented; a header comment flags the need for "a real, redacted `payment.captured` webhook payload fixture... not a hand-typed approximation."
   - `packages/core-payments/src/webhookHandler.ts:48` — `SUPPORTED_EVENTS = ['payment.captured']` — refund events are rejected today (would fall into the `'ignored'`/`unsupported-event` outcome branch per `WebhookOutcome`'s type).
   - `packages/core-payments/src/webhookHandler.ts`'s header comment — documents the existing transaction/dedup ordering: "verified bytes -> JSON.parse -> schema -> ONE transaction: insert webhook_event (unique on `razorpay_event_id`) -> upsert payment -> grant entitlement -> enqueue meta event." A refund path has no equivalent documented ordering yet.
   - `packages/core-payments/src/webhookRetention.ts` `REDACTION_ALLOWLIST` (lines 86–105) already names `payload.payment.entity.amount_refunded` and `payload.payment.entity.refund_status` — confirming the refund payload shape is partially anticipated, but no handler logic consumes these fields today.
   - `packages/db/prisma/schema.prisma:57–62` — `enum PaymentStatus { AUTHORIZED, CAPTURED, FAILED, REFUNDED }` — **`REFUNDED` already exists in the enum** but is confirmed (via repository-wide search) unused by any code path today.
3. **Exact unresolved question:** What exact test cases are missing beyond the three named stubs? How should webhook replay (redelivery), duplicate refund notifications, partial refunds, full refunds, reversals, out-of-order delivery, late refunds (after window close), and transaction association (which `Payment`/`Order` a refund event resolves to) each be exercised?
4. **Options (test-case menu, not mutually exclusive — presented for selection of scope, not a single choice):**
   - **Minimal scope:** implement only the three existing `it.todo` stubs as literally named (payload-shape acceptance only, no behavioral assertions about counting/idempotency).
   - **Behavioral scope:** the above, plus explicit tests for: (a) duplicate `refund.processed` delivery for the same underlying refund — asserting single-processing via `razorpayEventId` uniqueness; (b) a partial refund followed by a second partial refund on the same `Payment` — asserting Q-11's "counts once regardless of partial/full" rule; (c) a reversal (refund-then-un-refund) arriving before window close — asserting Q-12's correction rule; (d) the same reversal arriving after window close — asserting immutability; (e) out-of-order delivery (a `refund.processed` event arriving before its corresponding `payment.captured` event is recorded) — behavior currently undefined by any governing record; (f) a refund event whose `order_id`/`payment_id` does not resolve to an existing `Payment` row — error/rejection behavior currently undefined.
   - **Full scope:** behavioral scope plus property-based/fuzz testing of event ordering permutations.
5. **Consequences/tradeoffs:** Minimal scope satisfies the letter of the existing stubs but leaves Q-11/Q-12's actual policy behaviorally unverified. Behavioral scope directly tests the decided policy but requires the refund-ingestion code (W-6) to exist first — these tests cannot be written against code that does not yet exist, so "implement the tests" and "implement the feature" are coupled, not sequential, contrary to how B-4 is phrased as a standalone blocker. Full scope is the most rigorous but is the most build effort for a webhook surface that, per Q-11/Q-12, has a narrow and already-fully-specified policy surface (binary, transaction-based) — the incremental value of fuzzing beyond the enumerated behavioral cases is unclear without a specific observed defect class.
6. **Dependencies:** Directly coupled to W-6 (refund webhook ingestion implementation) and B-6 (refund storage shape) below — the test scope cannot be finalized independent of the storage shape decision, since "what gets asserted" depends on "what gets written."
7. **Analyst observation — NOT A RECOMMENDATION:** the existing `it.todo` stubs' own header comment ("not a hand-typed approximation") suggests an existing project convention of sourcing real/redacted provider payloads for contract fixtures (as `tests/contract/fixtures` already does for other events, per the directory listing) — noted as a convention observed in the repository, not proposed as the answer to this blocker's scope question.
8. **Decision authority:** Engineering (test scope and technique) with Product Owner awareness that minimal scope leaves policy behaviorally unverified before any launch-qualification claim relying on PCG-5.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-5 — Activation timestamp source

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` PO-D1 (`Search.status = 'COMPLETE'` is the qualifying *status*, decided, not reopened) and `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` ED-8 (query `Search` directly, decided, not reopened). Neither fixes *which timestamp column* represents "performed" for window-membership purposes — that is this blocker.
2. **Existing repository evidence (re-inspected for this record):**
   - `packages/db/prisma/migrations/0014_searches/migration.sql` — `searches` has both `created_at` (set at INSERT, i.e., when the search was *initiated*) and `updated_at` (per `pgRepository.ts` lines 131, 160, 182, 205, 231 — updated on every state-transition write, including the one that sets `status = 'COMPLETE'`, i.e., when the search *finished*).
   - `packages/core-search/src/types.ts:44-45` — `Search` exposes both `createdAt: Date` and `updatedAt: Date` to callers.
   - `packages/core-search/src/pgRepository.ts:112` — the existing `listByUser`-style query orders `ORDER BY created_at, id`, suggesting `created_at` is the convention already used elsewhere in this module for chronological ordering, though not specifically for "when did this search's opportunity for an outcome begin."
   - No other timestamp (e.g., a dedicated `completed_at` column) exists on `searches`; `updated_at` is a generic last-modified field also touched by lease-claim and error-recording writes (`pgRepository.ts` lines 131, 160, 182, 205, 231 touch `updated_at` for multiple different state transitions, not exclusively the COMPLETE transition), meaning `updated_at` is not guaranteed to represent only "transitioned to COMPLETE" without additional application-level care to confirm which write last touched it.
3. **Exact unresolved question:** Does PCG-4/PCG-6's window membership use `searches.created_at` (search initiated), `searches.updated_at` (last modified — which, for a row currently at `status = 'COMPLETE'`, likely but not guaranteedly represents the completion write), another existing timestamp, or does it require a new, dedicated `completed_at` column to remove the ambiguity?
4. **Options:**
   - **Option 1 — `created_at`:** window membership = when the search was initiated. Matches the existing `ORDER BY created_at` convention; does not require schema change; risks counting a search in a window based on when it started even if it did not finish (reach `COMPLETE`) until a later window.
   - **Option 2 — `updated_at`:** window membership = when the row was last modified. Requires no schema change; `updated_at` is touched by several non-completion state transitions (lease claims, error recording per `pgRepository.ts`), so without additional guarantee this is not provably "time of completion" — only "time of last write," which could post-date the actual completion if, hypothetically, any later write ever touches a COMPLETE row (not currently observed in the repository, but not structurally prevented either).
   - **Option 3 — a new, dedicated `completed_at` column:** set exactly once, at the write that transitions `status` to `'COMPLETE'`, and never touched again. Removes all ambiguity; requires a new migration (schema change — not authorized by this record).
5. **Consequences/tradeoffs:** Option 1 is simplest (no schema change) but conflates "attempted" with "performed," which is in tension with PO-D1's own stated rationale (only `COMPLETE` rows count, because incomplete ones never deliver an opportunity for outcome) — anchoring the window to the *start* of an eventually-completed search undercuts that same reasoning by counting opportunity-window time that preceded the actual delivery of results. Option 2 is also schema-change-free but carries a latent correctness risk if `updated_at`'s multi-purpose nature is ever extended by an unrelated future change. Option 3 is the most correct and auditable but requires a new migration, which this record does not authorize and which was not identified as required by ED-8/PO-D1 (a newly surfaced schema-impact fact, not previously flagged).
6. **Dependencies:** Feeds W-8 (PCG-1, if demonstrated-intent timing matters there too — separate question, see B-10 below), W-12 (PCG-4), W-14 (PCG-6).
7. **Analyst observation — NOT A RECOMMENDATION:** Option 3's correctness advantage is noted purely as a structural observation about what each existing column does and does not guarantee; it is not proposed as the selected answer, consistent with this blocker's own instruction not to choose based on convenience alone.
8. **Decision authority:** Engineering (timestamp semantics are an implementation-correctness question), with Product Owner awareness that Options 1/2 may shift PCG-4/6's effective window boundaries relative to the more conservative Option 3.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-6 — Refund storage shape

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` ED-6 (policy: reuse `WebhookEvent` dedup, isolate refund business logic in its own module — **decided, not reopened**). This blocker is strictly the *storage shape* ED-6 explicitly left open.
2. **Existing repository evidence (re-inspected for this record):**
   - `packages/db/prisma/schema.prisma:57-62` — `enum PaymentStatus { AUTHORIZED, CAPTURED, FAILED, REFUNDED }`. **`REFUNDED` already exists as a defined enum value** on `Payment.status`; confirmed via repository-wide search (`grep -rn "REFUNDED"`) that no code path currently sets or reads it — it is unused, present, dormant schema capacity.
   - `packages/db/prisma/schema.prisma:171-213` — `WebhookEvent` (`razorpay_event_id` unique, `payload Json`, `processed_at`, `processing_error`) — the existing idempotent-ingestion record ED-6 directs reuse of.
   - `packages/core-payments/src/webhookRetention.ts` — already anticipates refund-shaped payload fields in its retention allowlist (`amount_refunded`, `refund_status`, `payload.refund.entity.*`), but these are retention/redaction rules, not a persisted business-state table.
   - No `refunds`/`reversals` table exists anywhere in `packages/db/prisma/migrations/`.
3. **Exact unresolved question (explicitly distinguishing policy / engineering design / implementation detail):**
   - **Policy (already decided, not reopened):** binary any-refund-counts, economic finality, pre-close-only correction (Q-11/Q-12).
   - **Engineering design (already decided, not reopened):** reuse `WebhookEvent`'s dedup; isolate refund business logic in its own module (ED-6).
   - **Implementation detail (this blocker, undecided):** should the economically-final refund *state* be represented by (a) transitioning the existing, currently-unused `Payment.status` to `REFUNDED`; (b) a new `refund_events`/`refunds` table (append-only or state-row) separate from `Payment`; (c) reading `WebhookEvent.payload` directly at query time with no separate state representation at all; or (d) some combination?
4. **Options:**
   - **Option 1 — reuse `Payment.status = REFUNDED`:** no new table; uses dormant existing schema capacity exactly as named; but a single-valued status field cannot natively represent "refunded then reversed then re-refunded" (Q-12's reversal scenario) without additional columns (e.g., a `refund_corrected_at` or history mechanism) that do not exist today — Option 1 alone would need extension to fully support Q-12.
   - **Option 2 — a new `refund_events` table** (one row per refund-related webhook outcome, FK to `Payment`, with a reversed/corrected flag and timestamp): directly supports Q-12's reversal history without overloading `Payment.status`; is net-new schema, consistent with ED-6's "isolate refund business logic" direction extended to storage as well.
   - **Option 3 — read `WebhookEvent.payload` directly, no separate state table:** avoids any new schema; but payloads are JSON blobs intended for redaction/retention (per `webhookRetention.ts`), not optimized or intended as a query-time source of truth for PCG-5's economic-finality state machine — likely in tension with the auditability/ED-4 snapshot goals, flagged as a tradeoff, not ruled out.
   - **Option 4 — Option 1 plus a minimal correction-history extension** (e.g., `Payment.status = REFUNDED` plus a new nullable `refund_reversed_at` column): a middle ground reusing the dormant enum value while still supporting Q-12's reversal case with less new schema than Option 2's full table.
5. **Consequences/tradeoffs:** Option 1 alone is the smallest schema footprint but is very likely insufficient for Q-12's reversal/correction requirement as stated — flagged as a probable non-starter without extension, not foreclosed outright. Option 2 is the most structurally complete for Q-12 but is the largest new-schema commitment. Option 3 defers schema work entirely but trades query-time performance and the clean evidence-bundle shape ED-13 wants for no new migration. Option 4 is a smaller version of Option 2's completeness.
6. **Dependencies:** Directly feeds W-6 (refund ingestion) and B-4 (refund contract-test scope, which cannot be finalized until this shape is chosen).
7. **Analyst observation — NOT A RECOMMENDATION:** the existence of a dormant, unused `REFUNDED` enum value is noted as a repository fact worth the Product Owner/Engineering's attention when choosing among the options above — it is not presented as evidence that Option 1 (or 4) is preferred, since dormant schema capacity existing is not the same as it being sufficient for the decided policy's full requirements.
8. **Decision authority:** Engineering (schema-shape tradeoffs), with Product Owner sign-off since this is a schema/migration decision that, once implemented, is costlier to change than a pure code-logic choice.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-7 — PCG-4 numerator combination logic

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` Q-9 (denominator concept, decided) and Q-10 (numerator *contingent* on the equivalence review's outcome, decided as a conditional policy, not reopened); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`'s "useful outcome" definition — condition (a) presumably `feedback.useful = true`-equivalent, condition (b) the service/customer/value match this record's B-3 evaluator targets (exact PDEF-3 wording not restated here since it is not reopened, only traced).
2. **Existing repository evidence (re-inspected for this record):**
   - Migration `0020_feedback` — `feedback.useful BOOLEAN NOT NULL`, one row per `(user_id, opportunity_id)` pair (via `UNIQUE(opportunity_id)`), upserted by `recordFeedback()`.
   - `packages/core-opportunity/src/service.ts` (`recordFeedback`) — `feedback.useful` is a direct user-supplied boolean (the FeedbackForm's "Would you actually contact this business?" yes/no), not a derived/computed value — it reflects the *user's own subjective judgment* of usefulness, not a system-computed criteria match.
   - `packages/core-qualification/src/types.ts`/`evaluator.ts` — the existing (not-equivalent, per Q-10) criteria evaluate a *different* thing: prospect-plausibility (need detected, evidence present, category plausible), not the user's own configured service/customer/value match (that is B-3's new evaluator's job).
   - PDEF-3's "useful outcome" is a compound definition with (per the governing chain's own restatement in the engineering-design preparation record, not reopened) at least two named sub-parts: a qualification-match condition (b) and, implicitly, some condition (a) — the exact verbatim PDEF-3 text is in `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`/`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`, not re-quoted here since those records are not reopened, only cited as the source of the compound structure this blocker's options below must combine.
3. **Exact unresolved question:** For a given opportunity in PCG-4's denominator population, does the numerator require (i) `feedback.useful = true` alone; (ii) B-3's new evaluator's match result alone; (iii) both conjunctively (AND); or (iv) either (OR)? And if a conjunctive/disjunctive combination is chosen, does the user need to have submitted feedback at all for an opportunity to count, given `feedback` is itself optional (a `Search`/`Opportunity` can exist with no feedback row)?
4. **Options:**
   - **Option 1 — `feedback.useful = true` alone:** simplest, uses only existing data; but ignores B-3's new evaluator entirely, making its construction (ED-10) disconnected from the one gate (PCG-4) it was built to serve — a significant internal-consistency tension worth flagging, not a chosen disqualifier.
   - **Option 2 — B-3's evaluator match alone:** uses only the new, purpose-built criteria-match logic; ignores the user's own subjective useful/not-useful judgment entirely, which may diverge from the system's criteria-match result (a user could find a criteria-matching opportunity personally unhelpful, or vice versa).
   - **Option 3 — conjunctive (`feedback.useful = true` AND evaluator match = true):** the strictest reading, requiring both the user's own judgment and the system's criteria-match to agree; opportunities with no feedback row at all would not satisfy this (never reaching `true`), meaning the numerator would require feedback submission, which is not currently mandatory anywhere in the product.
   - **Option 4 — disjunctive (`feedback.useful = true` OR evaluator match = true):** the most permissive reading; would count an opportunity as a useful outcome even without a matching criteria evaluation, provided the user said yes, or vice versa.
5. **Consequences/tradeoffs:** Option 1 is implementable today without B-3's evaluator but leaves PDEF-3's condition (b) (the service/customer/value match) entirely unimplemented in the numerator, which could be read as not actually satisfying PDEF-3's compound definition at all — flagged as a likely non-conformance, not a neutral choice. Option 2 symmetrically ignores condition (a)-equivalent data. Option 3 is the most conservative/strict reading of "useful outcome" as a compound AND condition but makes feedback-submission a de facto prerequisite for ever counting toward PCG-4's numerator, which interacts with how often users actually submit feedback (a product-adoption fact not measured anywhere in this repository today). Option 4 is the most permissive and risks inflating PCG-4 artificially relative to either half's individual experience.
6. **Dependencies:** Directly depends on B-3 (the evaluator's existence and exact output shape) and on Q-10's equivalence-review outcome (if, contrary to the already-confirmed non-equivalence, some hybrid of `core-qualification` and the new evaluator were ever considered — not proposed here, since Q-10/ED-10 already foreclosed reusing `core-qualification` as-is).
7. **Analyst observation — NOT A RECOMMENDATION:** PDEF-3's "useful outcome" being a named *compound* definition (not a single boolean) is cited as a textual fact about the governing record's own structure, not as an argument for any specific AND/OR combination above.
8. **Decision authority:** Product Owner primarily (this changes what "useful outcome" means operationally, a measurement-policy question squarely in the Product Owner's domain per the Q-1..Q-12 precedent), informed by Engineering on what each option costs to build.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-8 — PCG-6 population/completion logic

1. **Governing source:** `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`'s compound completion definition (targeting criteria defined → ≥1 qualified opportunity received → review/action step reached — restated from the engineering-design preparation record, not reopened); PDEF-4 §6.3 (PCG-6 monitoring-only).
2. **Existing repository evidence (re-inspected for this record):**
   - **Search lifecycle:** `searches.status` CHECK-enforced to `PENDING | RUNNING | COMPLETE | FAILED | CANCELLED` (migration `0014_searches`); no further lifecycle stage beyond `COMPLETE`/`FAILED`/`CANCELLED` exists on the `Search` row itself.
   - **Opportunity lifecycle:** migration `0017_opportunities` (not individually re-read line-by-line in this pass beyond what is already cited in the implementation-authorization preparation record) and `packages/core-opportunity/src/types.ts` — the MVP `Opportunity` model has `state: 'NEW' | 'RESEARCHED'` only (per `service.ts`'s own Phase-15 comment, §1 above), no "reviewed"/"actioned" state field.
   - **Relevant UI actions:** `apps/web/app/(client-finder)/opportunities/page.tsx` (list) and `.../[id]/page.tsx` (detail, with `FeedbackForm`) are the only two Client-Finder opportunity-facing UI routes found.
   - **Existing completion signals:** `getOpportunityTrackingSummary()` (`service.ts`, Phase 15/R-27) already computes `created` (count of `Opportunity` rows) and `actioned` (count of opportunities with a `feedback` row), explicitly **not** a "reviewed" count, per its own documented rationale (quoted in B-1 above). This is the closest existing analog to a completion signal, and it is explicitly scoped to "basic outcome tracking" (R-27, MVP_SCOPE_BOUNDARY.md §5.5), not to PDEF-3's specific three-part completion definition.
3. **Exact unresolved question:** What exact population (denominator) and signal (numerator) should PCG-6 use, given PDEF-3's three-part completion definition does not map cleanly onto any single existing field? Specifically: does "targeting criteria defined" map to `service_profiles` existing (trivially true for any holder who completed onboarding) or to a specific `Search`'s snapshot existing; does "≥1 qualified opportunity received" map to `core-qualification`'s `QUALIFIED` state (confirmed not equivalent to the Client-Finder-specific match per Q-10, but PDEF-3's second sub-part may or may not require the *same* equivalence Q-10 was about — this ambiguity is itself part of this blocker, not resolved by Q-10); and does "review/action step reached" map to B-1's still-undecided "opportunity reviewed" event, to `feedback` submission, or to something else entirely?
4. **Options:**
   - **Option 1 — reuse `getOpportunityTrackingSummary()`'s existing `actioned` (feedback-submission) count as the numerator proxy**, with the denominator being holders meeting B-5's activation definition. Fastest to build (zero new instrumentation beyond B-5); explicitly conflates "actioned" with PDEF-3's specific "review/action step reached" wording, which `service.ts`'s own comment already flags as a distinct, unresolved concept from "reviewed."
   - **Option 2 — numerator = B-1's new "opportunity reviewed" event**, once B-1 is resolved and built; denominator = B-5's activation population. The most faithful to PDEF-3's literal wording, but fully dependent on B-1's resolution and a net-new event existing.
   - **Option 3 — numerator = a three-part conjunctive check** (criteria defined AND ≥1 qualifying opportunity exists AND review/action signal present), computed per-holder rather than as a single event-backed count — mirrors PDEF-3's compound structure most literally, at the cost of being the most complex to compute and audit.
   - **Option 4 — defer PCG-6 implementation entirely** until B-1 is resolved, since PCG-6's numerator is structurally dependent on it; implement PCG-1..5 first.
5. **Consequences/tradeoffs:** Option 1 ships fastest but very likely does not measure what PDEF-3 actually defines (the repository's own code comments already distinguish "actioned" from "reviewed"). Option 2 is the most conformant but cannot be built before B-1 resolves. Option 3 is the most rigorous reading of the compound definition but the most implementation and audit burden for a monitoring-only (non-blocking) gate. Option 4 avoids building something non-conformant but delays PCG-6 monitoring visibility indefinitely relative to the other five gates.
6. **Dependencies:** B-1 (for Options 2/3's "review/action" signal), B-5 (activation population, shared with PCG-4), B-9 (sample floor).
7. **Analyst observation — NOT A RECOMMENDATION:** the pre-existing in-repo distinction between "actioned" (feedback-backed) and "reviewed" (undefined) is repository evidence that Option 1's conflation was already anticipated and avoided once before in this codebase (Phase 15), for PCG-6-adjacent but not identical reasons (R-27's basic tracking vs. PDEF-3's commercial-gate definition) — noted as a pattern, not a directive to repeat or avoid it here.
8. **Decision authority:** Product Owner (what PCG-6 should actually measure, given it is monitoring-only and therefore has more policy latitude than the hard blockers) with Engineering input on build cost per option.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

### B-9 — PCG-6 sample floor

1. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` Q-8 (floor *principle* extended to "PCG-3A and PCG-3B (hard blockers) and PCG-4 and PCG-5 (monitoring gates)" **by name** — PCG-6 is not named in Q-8's text); `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` PO-D2 (sets numeric floors only for the four gates Q-8 names: PCG-3A = 100, PCG-3B = 200, PCG-4 = 25, PCG-5 = 125).
2. **Existing repository evidence:** Not applicable — this is a pure policy-threshold question, as PO-D2 itself already established for the other four gates; no code or data determines statistical adequacy.
3. **Exact unresolved question:** Does PCG-6 require a numeric sample floor at all (Q-8 does not name it), and if so, what value? This record does **not** infer a value from any other gate's floor, by explicit instruction.
4. **Candidate options — all labeled `ANALYST OPTION — NOT DECIDED`, none adopted:**
   - **`ANALYST OPTION — NOT DECIDED`:** No floor at all — PCG-6 is monitoring-only and never launch-blocking, so an insufficient-sample percentage could be reported as-is with its raw denominator alongside it, letting a human reviewer judge sufficiency manually (mirroring Q-8's own interim treatment before PO-D2 existed for the other four gates).
   - **`ANALYST OPTION — NOT DECIDED`:** Extend Q-8's principle to PCG-6 by Product Owner decision now (not inferred, but explicitly decided), with a numeric value derived the same way PO-D2 derived the other four — via the same `n ≥ 10/min(p, 1−p)` rule applied to whatever threshold percentage PDEF-3/PDEF-4 eventually names for PCG-6, if any exists (not confirmed in this pass — PCG-6's own percentage threshold, if one exists, was not independently re-verified in this record and is itself worth confirming before this option could even be computed).
   - **`ANALYST OPTION — NOT DECIDED`:** A fixed, round floor chosen independently of any statistical derivation (e.g., a flat minimum count), on the theory that a monitoring-only gate does not need the same statistical rigor as a launch blocker.
   - **`ANALYST OPTION — NOT DECIDED`:** Treat PCG-6 as never NOT-YET-EVALUABLE — always report whatever percentage the data produces, with the raw denominator shown, and let the Product Owner's own review (not an automated gate) judge sufficiency every time.
5. **Consequences/tradeoffs:** no-floor options (the first and fourth above) risk reporting a misleadingly precise-looking percentage off a tiny denominator for a gate nobody is specifically safeguarding with an automated check; the second option is the most consistent with the other four gates' treatment but requires first confirming PCG-6 even has a named percentage threshold to apply the rule to (not confirmed here); the third option sacrifices the statistical grounding PO-D2 established for the other four gates for simplicity.
6. **Dependencies:** B-8 (PCG-6's numerator/denominator definition) must be resolved before any floor, numeric or principled, can be meaningfully applied.
7. **Analyst observation — NOT A RECOMMENDATION:** none of the four candidate options above is put forward as preferred; they are presented only to make the shape of the open decision concrete, per this blocker's own instruction to present options without adopting one.
8. **Decision authority:** Product Owner (a pure policy-threshold decision, identical in kind to PO-D2).
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

---

## 2. Additional blockers discovered during this investigation

### B-10 — No existing durable, cross-session visitor-identity primitive suitable for W-1/ED-5

1. **Governing source:** Newly discovered during this task's repository inspection; relates to, but is distinct from, ED-1 (which decided the *storage architecture*, not which client-side signal feeds it) and ED-2 (which deferred the *user-merge*, not the visitor-id's own source).
2. **Existing repository evidence:** `apps/web/src/analytics/track.ts` — `tabScope()`/`scopeId` is a per-tab, in-memory `crypto.randomUUID()`, explicitly scoped "so a re-render does not double-count a view" — lost on tab close/reload, not cross-session. `apps/web/src/analytics/attribution.ts` — `_fbp`/`_fbc` (Meta's own browser-id/click-id cookies) are captured for Meta-attribution purposes only, stored in `sessionStorage` (also not cross-session: the module's own comment notes "attribution is a marketing signal, not a permission," i.e., not engineered for identity-dedup correctness). Neither primitive was built, or is documented as suitable, for the kind of stable, deduplicatable visitor identity Q-2's "a visitor who enters via one path and later re-enters via the other is still counted once" requirement, or Q-6's "first exposure" cross-session attribution, actually need.
3. **Exact unresolved question:** Should W-1/W-5's "visitor id" be a new, dedicated, durable cookie (separate from `_fbp`/`tabScope`), reuse `_fbp` despite it being an unrelated-purpose Meta identifier, or something else — and is `sessionStorage`'s existing non-cross-session scope for `_fbp`/attribution data acceptable to carry forward, or does visitor-dedup specifically need `localStorage`/a cookie with a longer lifetime?
4. **Options:** (1) a new, dedicated first-party cookie, set server-side on first contact, independent of any Meta/marketing identifier; (2) reuse `_fbp` directly, accepting its Meta-defined lifetime/semantics as a dependency; (3) reuse `tabScope`'s pattern but persist it (e.g., to `localStorage` instead of in-memory) to survive reloads within a browser, though not across browsers/devices.
5. **Consequences/tradeoffs:** Option 1 is the cleanest separation of concerns (no dependency on a third party's cookie policy) but is net-new engineering surface. Option 2 is fast but ties a commercial-gate's correctness to Meta's own cookie lifetime/consent-banner interactions, which this codebase does not control. Option 3 is a small change but was explicitly designed for a narrower purpose ("a re-render does not double-count a view") and was never evaluated against cross-session dedup correctness.
6. **Dependencies:** Blocks W-1/W-3/W-5/W-8's practical correctness even once their architecture (ED-1/ED-3/ED-5) is implemented, since a per-tab or marketing-only identifier would undermine Q-2's and Q-6's dedup/attribution requirements regardless of how the server-side storage is built.
7. **Analyst observation — NOT A RECOMMENDATION:** both existing candidates (`tabScope`, `_fbp`) were purpose-built for something other than durable visitor dedup; this is stated as a fact about their documented design intent, not as grounds for rejecting their reuse.
8. **Decision authority:** Engineering primarily (a technical identity-mechanism choice), with Product Owner awareness of any privacy/consent implications of a new first-party tracking cookie.
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

### B-11 — Browser-emitted funnel events are explicitly documented as untrusted; PCG-1 is a hard launch blocker

1. **Governing source:** Newly discovered during this task's repository inspection; interacts with ED-1 (event storage) and Q-1 (PCG-1 eligibility, decided, not reopened) but raises a trust-boundary question neither record addressed.
2. **Existing repository evidence:** `apps/web/src/analytics/events.ts`'s own header comment: "BROWSER events describe what a person did in the UI... **nothing downstream depends on them being truthful**... PURCHASE events describe money. The browser cannot be allowed to emit them... a client-reported purchase would corrupt conversion data." This is an explicit, existing architectural principle in this codebase: browser-emitted events are not trusted for anything commercially load-bearing. PCG-1 (500 qualified visitors) is a **hard launch blocker** per PDEF-4, and its "funnel entry + demonstrated intent" conditions (Q-1) are, per the current event taxonomy (`funnel_entry_viewed`, `checkout_started`, etc.), browser-emitted events.
3. **Exact unresolved question:** Should PCG-1's qualifying events continue to be purely browser-emitted (consistent with today's architecture, but in tension with this codebase's own stated principle that such events are untrusted) for a hard launch-blocking gate, or does PCG-1 require some form of server-side corroboration (e.g., requiring the browser event to arrive with a verifiable server-observed correlate, such as an actual HTTP request the server itself can also log) before counting toward a launch-blocking threshold?
4. **Options:** (1) accept browser-emitted events as sufficient for PCG-1, consistent with today's architecture, on the theory that low-stakes inflation (a few fabricated "demonstrated intent" events) is an acceptable risk for a count-based monitoring/launch-readiness signal, unlike the `Purchase` event's money-moving stakes; (2) require server-side corroboration specifically for whichever event constitutes "demonstrated intent" (not yet identified — see §7 item 7 of the prior preparation record, carried forward here as a related open item, not restated as its own numbered blocker since it was already flagged there); (3) treat this as an accepted, documented risk rather than a blocker, with no mitigation built.
5. **Consequences/tradeoffs:** Option 1 is simplest and matches current architecture but directly contradicts the stated principle that these events are "nothing downstream depends on them being truthful" — PCG-1 would be exactly such a downstream dependency. Option 2 adds real engineering cost to resolve a risk whose actual likelihood (bot/script inflation of "demonstrated intent") is already partially mitigated by ED-3's allowlist exclusion (a different mechanism, for a different threat model: known-bad traffic, not spoofed events from a normal browser). Option 3 is honest but leaves a hard launch blocker resting on an explicitly-documented-as-untrusted signal.
6. **Dependencies:** Interacts with ED-3 (bot exclusion handles *known* bad actors, not event spoofing generally) and W-1 (whatever event type is chosen to represent "demonstrated intent").
7. **Analyst observation — NOT A RECOMMENDATION:** the tension described above is a direct, verifiable reading of the existing `events.ts` comment juxtaposed with PDEF-4's launch-blocker designation of PCG-1; it is reported because it was not addressed by any record in this governance chain so far, not because a specific severity or likelihood assessment is being asserted.
8. **Decision authority:** Jointly coordinated — Product Owner (risk tolerance for a launch-blocking gate resting on an unauthenticated signal) and Engineering (what corroboration, if any, is feasible).
9. **PRODUCT OWNER / ENGINEERING SELECTION:** `__________`

No other blockers beyond B-10 and B-11 were identified during this investigation as rising to the level of "would prevent safe implementation" rather than ordinary engineering detail already captured in the implementation-authorization preparation record's §7 items 5–9 (which are restated above as B-5 through B-9, per this task's own framing).

---

## 3. Decision status

All eleven blockers (B-1 through B-11) are, as of this record:

**`PENDING PRODUCT OWNER / ENGINEERING DECISION.`**

No blocker above is resolved by an existing governing decision read for this record — in every case, the cited governing source fixes a *different*, narrower question (a policy principle, a storage architecture, a non-equivalence finding) while explicitly leaving the specific question posed in that blocker's §4 "exact unresolved question" open. None is marked DECIDED.

## 4. Authorization

This record authorizes **none** of the following:

- implementation (of any workstream, any blocker's resolution, or any option listed above);
- schema or migration changes;
- test changes (including filling in the `it.todo` stubs discussed in B-4);
- validation execution (including any ED-12/B-2 cross-check or fixture run);
- deployment, release, or production traffic of any kind.

It does not modify, reopen, or alter any governing record listed in §0, the PRD, `docs/ARCHITECTURE.md`, or any code, test, schema, migration, configuration, or dependency file. It is not committed or pushed.

## 5. Next step

Once explicit selections are supplied for B-1 through B-11 (by whichever decision authority §1/§2 identifies for each — Product Owner, Engineering, Validation authority, or jointly coordinated), a **separate, explicitly authorized engineering-blocker decision record** should be created to record those selections as DECIDED, consolidate their downstream effect on the workstreams (W-1..W-19) in the implementation-authorization preparation record, and only then feed into a still-separate implementation-authorization decision. This record does not create that decision record, and no implementation should begin before it exists and is itself followed by an explicit implementation-authorization step.

---

## Final verification (performed before reporting completion)

- HEAD unchanged: `af9ede93830f5e3e611195dc2451a470364def74`.
- 0 staged files, before and after.
- No source, test, schema, config, or dependency file modified.
- Only this preparation document created (`requirement/CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md`).
- All governing-record hashes (§0) unchanged.
- No commit made. No push made.
