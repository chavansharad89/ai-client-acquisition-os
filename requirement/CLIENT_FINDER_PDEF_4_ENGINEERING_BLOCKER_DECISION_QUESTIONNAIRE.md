# Client Finder / Client Intent Discovery — PDEF-4 Engineering Blocker Decision Questionnaire

**Record ID:** `CLIENT-FINDER-PDEF-4-ENGINEERING-BLOCKER-DECISION-QUESTIONNAIRE-001`
**Date:** 2026-10-05
**Type:** Decision questionnaire. **This record creates, implies, infers, or authorizes no engineering decision,
no Product Owner decision, no implementation, no test change, no schema/migration change, no
configuration/dependency change, no validation execution, and no deployment/release/launch action of any kind.**
Every blocker below ends in a blank selection field. No option is treated as selected because it is first-listed,
matches an existing implementation pattern, or is internally consistent with another gate's already-decided value.

**Source record (not modified by this questionnaire):**
`requirement/CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md`
Record ID: `CLIENT-FINDER-PDEF-4-ENGINEERING-BLOCKER-DECISION-PREPARATION-001`
SHA-256: `d199db8c6a953ca11744a27774505a503bb7935d4c0e62845887d01c30909cd0`

This questionnaire restructures that record's B-1 through B-11 content into an explicit decision-capture format
(status labels, severity, and a formally separated blank selection field per blocker) for the appropriate
authority to act on. It does not re-derive, re-interpret, or add new repository findings beyond what the source
record already established, except where explicitly marked as this document's own addition (the severity field
and the final "additional blocker" re-confirmation in §3).

---

## 0. Already decided (not reopened by this questionnaire)

| # | Record | Disposition |
|---|---|---|
| 1 | `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | PCG-1..6 gate definitions, hard-blocker vs. monitoring-only status, §6.10 independent-validation *requirement* (not *who*) |
| 2 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | Q-1 through Q-12, PO-D1, PO-D2 (sample floors for PCG-3A/3B/4/5) |
| 3 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` | ED-1 through ED-13 (storage architecture, non-equivalence of `core-qualification`, webhook/refund dedup reuse, event taxonomy) |
| 4 | `CLIENT_FINDER_PDEF_4_ENGINEERING_DESIGN_PRODUCT_OWNER_DECISION_PREPARATION.md` | Context only — consulted, not a decision record itself |
| 5 | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | Compound "useful outcome" / completion definition (policy text itself, not its operational mapping) |
| 6 | `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | Entitlement stacking policy |
| 7 | PDEF-2 decisions (`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`) | Product definition |
| 8 | `MVP_SCOPE_BOUNDARY.md` | MVP scope (R-27 basic outcome tracking, etc.) |
| 9 | PRD V2.2 | Product requirements |
| 10 | `docs/ARCHITECTURE.md` | Architecture |

None of the above is reopened by any blocker below. Where a blocker's analysis surfaces a possible tension with a
decided record, that tension is flagged in that blocker's own "Analyst observation" field — it is never resolved
by silently changing the governing record.

## 1. New decisions required

B-1 through B-11, enumerated in §2 below.

## 2. Not authorized

This questionnaire does not authorize: implementation of any workstream or blocker resolution; schema or
migration changes; test changes (including the `it.todo` stubs referenced in B-4); instrumentation changes;
validation execution (including any ED-12/B-2 cross-check or fixture run); deployment; release; or launch. It
also does not modify the source preparation record, any governing record in §0, the PRD, or `docs/ARCHITECTURE.md`.

---

## 3. Blockers

### B-1 — Opportunity Reviewed event: exact semantics and call site

1. **Blocker ID:** B-1
2. **Severity:** HIGH — blocks B-8 (PCG-6 numerator) and the literal operationalization of the PDEF-3 completion
   definition's third sub-part.
3. **Status:** PENDING
4. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` ED-9 (adopts a
   dedicated event, decoupled from `SearchStatus`/`feedback` — **decided, not reopened**); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`'s
   compound completion definition (the *definition* is fixed; only the *implementation mapping* is open here).
5. **Repository evidence:**
   - [page.tsx](apps/web/app/(client-finder)/opportunities/[id]/page.tsx) — server-rendered "Prospect detail" page (`force-dynamic`), reads feedback/opportunity/qualification/score/signals; currently a read with no persisted side effect.
   - [FeedbackForm.tsx](apps/web/src/components/client-finder/FeedbackForm.tsx) — client component, `POST`s to `/api/opportunities/:id/feedback` only on explicit useful/not-useful submission.
   - [route.ts](apps/web/app/api/opportunities/[id]/feedback/route.ts) → `@acos/core-opportunity.recordFeedback()`.
   - [service.ts:486-503](packages/core-opportunity/src/service.ts) (`recordFeedback`) persists via `deps.feedback.upsert(userId, opportunity.id, validated, now)`.
   - [service.ts:517-553](packages/core-opportunity/src/service.ts) — the repository's own Phase-15 comment: "Deliberately does NOT report a 'reviewed' count... no field, table, acceptance criterion, decision record or correction anywhere in PRD V2.2 defines what 'reviewed' means as data... reported as an open decision, not resolved by assumption."
   - Migration `0020_feedback`: `UNIQUE(opportunity_id)` — one upserted row per opportunity, not append-only.
6. **Exact decision required:** What exact user action constitutes "reviewed"? What is the call site, event
   name, payload, authoritative timestamp, user ID, opportunity ID, tier (if applicable), deduplication key, and
   whether repeated review is counted or only the first.
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (what "reviewed" means as a product concept) +
   `ENGINEERING DESIGN REQUIRED` (concrete call site/mechanism) — jointly coordinated.
8. **Options:**
   - Option 1 — page-view-based: fire on every/first render of `[id]/page.tsx`. Existing call site; adds a
     persistence side effect to a currently read-only component.
   - Option 2 — feedback-submission-based: treat the existing feedback `POST` as "reviewed." No new surface, but
     ED-9 already rejected this as conflating "reviewed" with "gave feedback."
   - Option 3 — new, dedicated UI action (e.g., explicit "Mark reviewed" control). No existing call site; net-new
     UX surface.
   - Option 4 — first-view-only, deduplicated by `(userId, opportunityId)`: a refinement of Option 1 via
     check-then-write or unique-constraint upsert.
9. **Tradeoffs:** Option 1 risks inflating/complicating the numerator unless deduplicated (Option 4 addresses
   this at added cost). Option 2 conflates two concepts ED-9 already distinguished, risking undercount. Option 3
   is most semantically precise but requires its own UX decision outside this document's scope. Option 4 is the
   most robust "reuse the detail page" variant but still adds a persistence-on-read side effect to a component
   explicitly documented as deliberately not having one.
10. **Dependencies:** Requires a durable event store (per ED-1, decided); interacts with B-8 (PCG-6 population) and B-9 (PCG-6 floor).
11. **Analyst observation — NOT A RECOMMENDATION:** the repository's own Phase-15 comment already frames this
    exact question as "reported as an open decision, not resolved by assumption" — independent confirmation that
    no answer should be inferred from existing code.
12. **Selection:** `__________`

---

### B-2 — Independent validation ownership, retention, and approval authority

1. **Blocker ID:** B-2
2. **Severity:** HIGH — gates launch-qualification use of hard blockers PCG-1/2/3A/3B per §6.10.
3. **Status:** PENDING
4. **Governing source:** ED-12 (Option C: production cross-check + deterministic fixtures — decided);
   `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.10 (independent validation "by a party distinct from the
   implementing team" required before launch-qualification use — the *requirement* is decided; *who* performs it
   is explicitly deferred by that same record to a separate process definition).
5. **Repository evidence:** No validation-ownership, review-approval, or evidence-retention process exists in
   this repository today (no CI validation gate, no reviewer-role concept, no retention-policy document for this
   purpose). `packages/core-reconciliation/`'s `ReconciliationReport`/`isClean()`/`formatReport()` is a reporting
   *format* precedent (what evidence looks like), not a process/ownership precedent (who signs off).
6. **Exact decision required:** Who owns validation (separate engineer, non-implementing reviewer, Product
   Owner, or automated CI + independent human review)? Who approves evidence as sufficient? What evidence is
   retained (raw rows, both computed values, match/mismatch record), for how long, and where stored?
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (staffing/approval authority) +
   `ENGINEERING DESIGN REQUIRED` (evidence format/retention) — jointly coordinated.
8. **Options:**
   - Option 1 — a named non-implementing engineer signs off per run; evidence as a DB table row.
   - Option 2 — automated CI (fixtures) + independent human review (production cross-check before each
     launch-qualification decision).
   - Option 3 — Product Owner itself reviews and approves directly.
   - Option 4 — hybrid: CI gates routine correctness; a separate named human role gates the production
     cross-check specifically for launch-qualification use.
9. **Tradeoffs:** Option 1 is simplest to staff but depends on one person's availability/consistency. Option 2 is
   most repeatable/auditable but needs CI infrastructure this repository lacks for this purpose. Option 3 keeps
   implementation/validation authority separate only if the Product Owner is not also the implementer — a
   people/process fact outside this document's authority to assume. Option 4 most closely matches ED-12's "both
   tracks" design but requires defining two separate roles/processes.
10. **Dependencies:** W-17/W-18 (validation architecture) must exist before any option can run; this blocker
    gates *using* results for launch-qualification, not *building* the mechanism.
11. **Analyst observation — NOT A RECOMMENDATION:** §6.10 itself already states this is deliberately left to a
    separate process definition; it is not an oversight upstream, and this document does not fill that gap with
    an assumption.
12. **Selection:** `__________`

---

### B-3 — Qualification-equivalence evaluator implementation contract

1. **Blocker ID:** B-3
2. **Severity:** HIGH — feeds B-7 (PCG-4 numerator) directly; non-equivalence of `core-qualification` is already
   established and not reopened here.
3. **Status:** PENDING
4. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` Q-10 (if
   non-equivalent, new Client-Finder-specific logic required — decided); ED-10 (new standalone evaluator module,
   persisted result — decided). Non-equivalence itself is not reopened; this blocker is the evaluator's exact
   implementation contract.
5. **Repository evidence:**
   - [types.ts](packages/core-qualification/src/types.ts) — `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT', 'CATEGORY_PLAUSIBLE']`.
   - [evaluator.ts](packages/core-qualification/src/evaluator.ts) — `evaluateQualification` is pure/deterministic
     ("no I/O, no clock, no randomness, no LLM call"); NEED_DETECTED short-circuits EVIDENCE_PRESENT.
   - [rules.ts](packages/core-qualification/src/rules.ts) — each criterion a separate pure function over
     already-persisted data.
   - [types.ts](packages/core-search/src/types.ts) — `Search` carries an immutable criteria snapshot
     (`service`, `target_customer`, `geography`, `min_project_value_paise`, `triggers`, `keywords`, `rationale`)
     copied from `service_profiles` at creation time (migration `0014_searches`) — the authoritative source for
     PDEF-3's condition (b) match, which none of `core-qualification`'s three existing criteria reference.
   - Migration `0022_qualifications` — `qualifications` table (`criteria JSONB`, `state`, `evaluator_version`,
     `evaluated_at`) — a structural pattern the new evaluator could mirror without reusing the table (per ED-10).
6. **Exact decision required:** Exact inputs, outputs, criteria, required evidence, determinism/idempotency
   guarantees, failure behavior, and audit-evidence shape for the new evaluator.
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (primary); `PRODUCT OWNER DECISION REQUIRED` on
   failure-behavior only, since a fail-closed choice could suppress PCG-4 visibility data.
8. **Options:**
   - Inputs: (a) `Search` snapshot + `Opportunity` attributes only; or (b) (a) plus live `service_profiles` data
     (in tension with migration `0014`'s snapshot-fidelity invariant unless explicitly chosen).
   - Outputs: (a) single boolean match/no-match; or (b) structured per-criterion breakdown mirroring
     `core-qualification`'s shape without reusing its code.
   - Determinism: (a) pure function, no I/O, mirroring `evaluator.ts`; or (b) allowed to read additional
     persisted data at evaluation time.
   - Failure behavior: (a) missing/malformed field → hard error, fail-closed; or (b) → criterion marked
     not-satisfied with a stated reason, fail-soft.
9. **Tradeoffs:** Inputs-(a) preserves the audit guarantee that a result never silently changes if the profile is
   later edited; inputs-(b) would reopen that invariant and is flagged as a likely non-starter, not foreclosed.
   Outputs-(a) is simpler; outputs-(b) gives more audit granularity, benefiting ED-13's evidence-bundle goal.
   Fail-closed is simpler to reason about but could silently suppress legitimate PCG-4 numerator members;
   fail-soft requires defining "not satisfied" vs. "indeterminate," itself an undecided sub-question.
10. **Dependencies:** Independent of W-1; depends only on existing `service_profiles`/`searches`/`core-opportunity`
    data. Feeds W-12/B-7 directly.
11. **Analyst observation — NOT A RECOMMENDATION:** `core-qualification`'s existing discipline (pure functions,
    documented short-circuit, fail-soft for `needDetected=false`) is cited as a repository pattern, not a stated
    preference for the new evaluator.
12. **Selection:** `__________`

---

### B-4 — Refund contract-test scope

1. **Blocker ID:** B-4
2. **Severity:** MEDIUM — coupled to B-6 (storage shape); cannot be finalized independently.
3. **Status:** PENDING
4. **Governing source:** ED-6 (reuse `WebhookEvent` dedup, isolate refund logic — decided); Q-11/Q-12 (binary
   any-refund-counts, economic finality, pre-close-only correction — decided). This blocker is test-case
   enumeration only, not policy.
5. **Repository evidence:**
   - [razorpay-webhook.contract.test.ts](tests/contract/razorpay-webhook.contract.test.ts) — three `it.todo`
     stubs (`payment.captured`, `payment.failed`, `refund.processed` shapes), none implemented; header comment
     flags need for "a real, redacted... payload fixture... not a hand-typed approximation."
   - [webhookHandler.ts:48](packages/core-payments/src/webhookHandler.ts) — `SUPPORTED_EVENTS = ['payment.captured']`;
     refund events currently fall into the unsupported-event/ignored branch.
   - `webhookHandler.ts` header comment documents existing dedup/transaction ordering for `payment.captured`; no
     equivalent documented ordering exists for refunds.
   - [webhookRetention.ts:86-105](packages/core-payments/src/webhookRetention.ts) `REDACTION_ALLOWLIST` already
     names `amount_refunded`/`refund_status`, confirming the payload shape is anticipated but unconsumed.
   - [schema.prisma:57-62](packages/db/prisma/schema.prisma) — `enum PaymentStatus { AUTHORIZED, CAPTURED, FAILED, REFUNDED }` — `REFUNDED` exists, confirmed unused by any code path (repo-wide search).
6. **Exact decision required:** What test cases are needed beyond the three named stubs — webhook replay,
   duplicate refund notifications, partial/full refunds, reversals, out-of-order delivery, late refunds (after
   window close), and payment/order association.
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (test scope/technique); Product Owner awareness only
   (minimal scope leaves Q-11/Q-12 behaviorally unverified before any PCG-5 launch-qualification claim).
8. **Options:**
   - Minimal scope: implement only the three existing stubs literally (shape acceptance only).
   - Behavioral scope: minimal scope plus explicit tests for duplicate delivery, partial-then-partial refund,
     reversal before/after window close, out-of-order delivery, and unresolvable order/payment association.
   - Full scope: behavioral scope plus property-based/fuzz testing of event-ordering permutations.
9. **Tradeoffs:** Minimal scope satisfies the stubs' letter but leaves policy behaviorally unverified. Behavioral
   scope directly tests decided policy but requires refund-ingestion code (W-6) to exist first — "implement the
   tests" and "implement the feature" are coupled, not sequential. Full scope is most rigorous but its
   incremental value beyond the enumerated cases is unclear absent an observed defect class.
10. **Dependencies:** Coupled to W-6 (refund ingestion) and B-6 (storage shape) — scope cannot be finalized
    independent of what gets written.
11. **Analyst observation — NOT A RECOMMENDATION:** the existing stubs' own comment suggests a project convention
    of sourcing real/redacted provider payloads for fixtures, noted as an observed convention, not an answer to
    this blocker's scope question.
12. **Selection:** `__________`

---

### B-5 — Activation timestamp source

1. **Blocker ID:** B-5
2. **Severity:** MEDIUM — shifts PCG-4/PCG-6 window boundaries depending on choice; no schema change needed for
   two of three options.
3. **Status:** PENDING
4. **Governing source:** PO-D1 (`Search.status = 'COMPLETE'` is the qualifying status — decided); ED-8 (query
   `Search` directly — decided). Neither fixes *which timestamp column* represents "performed" for window
   membership — that is this blocker.
5. **Repository evidence:**
   - [migration.sql](packages/db/prisma/migrations/0014_searches/migration.sql) — `searches` has `created_at`
     (set at insert/initiation) and `updated_at` (touched on every state-transition write per
     [pgRepository.ts:131,160,182,205,231](packages/core-search/src/pgRepository.ts), including the COMPLETE
     transition but not exclusively it).
   - [types.ts:44-45](packages/core-search/src/types.ts) — `Search` exposes both `createdAt`/`updatedAt`.
   - [pgRepository.ts:112](packages/core-search/src/pgRepository.ts) — existing listing query orders
     `ORDER BY created_at, id`, an existing chronological-ordering convention (not specifically for this purpose).
   - No dedicated `completed_at` column exists on `searches`.
6. **Exact decision required:** Does window membership use `created_at`, `updated_at`, another existing
   timestamp, or require a new `completed_at` column?
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (timestamp-semantics correctness); Product Owner
   awareness that Options 1/2 may shift PCG-4/6's effective window boundaries relative to Option 3.
8. **Options:**
   - Option 1 — `created_at`: no schema change; risks counting window time before the search actually completed.
   - Option 2 — `updated_at`: no schema change; touched by non-completion transitions (lease claims, error
     recording), so not provably "time of completion" without additional guarantee.
   - Option 3 — new, dedicated `completed_at` column, set exactly once at the COMPLETE transition: removes
     ambiguity; requires a new migration (not authorized by this questionnaire).
9. **Tradeoffs:** Option 1 conflates "attempted" with "performed," in tension with PO-D1's own rationale that
   only COMPLETE rows count because incomplete ones never deliver a result. Option 2 carries a latent correctness
   risk if `updated_at`'s multi-purpose nature is ever extended. Option 3 is most correct/auditable but requires a
   migration not previously flagged as required by ED-8/PO-D1.
10. **Dependencies:** Feeds W-12 (PCG-4), W-14 (PCG-6); possibly W-8 (PCG-1 timing, separate question, see B-11).
11. **Analyst observation — NOT A RECOMMENDATION:** Option 3's correctness advantage is a structural observation
    about what each existing column does/does not guarantee, not a selected answer.
12. **Selection:** `__________`

---

### B-6 — Refund storage shape

1. **Blocker ID:** B-6
2. **Severity:** HIGH — schema/migration decision, costlier to change once implemented than a pure code-logic
   choice; feeds B-4's test scope.
3. **Status:** PENDING
4. **Governing source:** ED-6 (reuse `WebhookEvent` dedup, isolate refund logic in its own module — decided).
   This blocker is strictly the storage shape ED-6 left open.
5. **Repository evidence:**
   - [schema.prisma:57-62](packages/db/prisma/schema.prisma) — `REFUNDED` enum value exists on `Payment.status`,
     confirmed unused (repo-wide `grep -rn "REFUNDED"`), dormant schema capacity.
   - [schema.prisma:171-213](packages/db/prisma/schema.prisma) — `WebhookEvent` (`razorpay_event_id` unique,
     `payload Json`, `processed_at`, `processing_error`) — the existing idempotent-ingestion record ED-6 directs
     reuse of.
   - [webhookRetention.ts](packages/core-payments/src/webhookRetention.ts) anticipates refund payload fields in
     its retention allowlist, but these are redaction rules, not a persisted business-state table.
   - No `refunds`/`reversals` table exists in `packages/db/prisma/migrations/`.
6. **Exact decision required:** Should the economically-final refund state be represented by (a) transitioning
   `Payment.status` to `REFUNDED`; (b) a new `refund_events`/`refunds` table; (c) reading `WebhookEvent.payload`
   directly at query time with no separate state representation; or (d) a combination?
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (schema-shape tradeoffs) + `PRODUCT OWNER DECISION REQUIRED`
   (sign-off, since this is a schema/migration decision costlier to change later).
8. **Options:**
   - Option 1 — reuse `Payment.status = REFUNDED` alone: no new table, but a single-valued status cannot
     natively represent refund-then-reversal-then-re-refund (Q-12) without extension.
   - Option 2 — new `refund_events` table (FK to `Payment`, reversed/corrected flag + timestamp): directly
     supports Q-12's reversal history; net-new schema.
   - Option 3 — read `WebhookEvent.payload` directly, no separate state table: no new schema, but payloads are
     redaction-oriented JSON blobs, not intended as a query-time source of truth for PCG-5's state machine.
   - Option 4 — Option 1 plus a minimal correction-history extension (e.g., nullable `refund_reversed_at`
     column): a middle ground.
9. **Tradeoffs:** Option 1 alone is the smallest footprint but likely insufficient for Q-12's reversal
   requirement as stated (flagged as a probable non-starter without extension, not foreclosed). Option 2 is most
   structurally complete but the largest new-schema commitment. Option 3 defers schema work but trades
   query-time performance and ED-13's evidence-bundle goal for no new migration. Option 4 is a smaller version of
   Option 2's completeness.
10. **Dependencies:** Feeds W-6 (refund ingestion) and B-4 (test scope cannot be finalized until this is chosen).
11. **Analyst observation — NOT A RECOMMENDATION:** the dormant, unused `REFUNDED` enum value is a repository
    fact worth attention when choosing among options; it is not evidence that Option 1/4 is preferred, since
    dormant capacity existing is not the same as it being sufficient for the decided policy's full requirements.
12. **Selection:** `__________`

---

### B-7 — PCG-4 numerator combination logic

1. **Blocker ID:** B-7
2. **Severity:** HIGH — determines whether PCG-4 actually measures PDEF-3's compound "useful outcome" definition
   or only half of it.
3. **Status:** PENDING
4. **Governing source:** Q-9 (denominator concept — decided); Q-10 (numerator *contingent* on the equivalence
   review's outcome — decided as a conditional policy, not reopened); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`'s
   "useful outcome" compound definition (verbatim text not reopened, only traced for its structure).
5. **Repository evidence:**
   - Migration `0020_feedback` — `feedback.useful BOOLEAN NOT NULL`, one row per `(user_id, opportunity_id)`.
   - [service.ts](packages/core-opportunity/src/service.ts) (`recordFeedback`) — `feedback.useful` is a direct
     user-supplied boolean (the user's own subjective judgment), not a derived/computed criteria match.
   - `core-qualification`'s existing criteria evaluate a *different* thing (prospect-plausibility), confirmed
     not equivalent per Q-10 — distinct from B-3's new evaluator, which targets the user's configured
     service/customer/value match.
   - PDEF-3's "useful outcome" is a compound definition with at least two named sub-parts (condition (a) and
     condition (b)); exact verbatim text lives in the PDEF-3 completion record, not reopened here.
6. **Exact decision required:** Does the numerator require (i) `feedback.useful = true` alone; (ii) B-3's
   evaluator match alone; (iii) both conjunctively; or (iv) either disjunctively? If conjunctive/disjunctive,
   must feedback be submitted at all, given it is currently optional?
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (primary — this is a measurement-policy question);
   `ENGINEERING DESIGN REQUIRED` (build-cost input per option).
8. **Options:**
   - Option 1 — `feedback.useful = true` alone: simplest, uses existing data, but ignores B-3's evaluator
     entirely — a significant internal-consistency tension with ED-10's purpose for building it.
   - Option 2 — evaluator match alone: ignores the user's own subjective judgment, which may diverge from the
     system's criteria-match result.
   - Option 3 — conjunctive (AND): strictest; opportunities with no feedback row never satisfy it, making
     feedback submission a de facto prerequisite (feedback is not currently mandatory).
   - Option 4 — disjunctive (OR): most permissive; risks inflating PCG-4 relative to either half's individual
     experience.
9. **Tradeoffs:** Option 1 leaves PDEF-3's condition (b) entirely unimplemented in the numerator — flagged as a
   likely non-conformance, not a neutral choice. Option 2 symmetrically ignores condition (a). Option 3 is the
   strictest reading but ties the numerator to feedback-submission rates (a product-adoption fact not measured
   anywhere in this repository). Option 4 is most permissive and risks artificial inflation.
10. **Dependencies:** Depends on B-3 (evaluator's existence/output shape) and Q-10's non-equivalence finding
    (already confirmed, not reopened).
11. **Analyst observation — NOT A RECOMMENDATION:** PDEF-3's "useful outcome" being a named compound definition
    (not a single boolean) is a textual fact about the governing record's structure, not an argument for any
    specific AND/OR combination.
12. **Selection:** `__________`

---

### B-8 — PCG-6 population/completion logic

1. **Blocker ID:** B-8
2. **Severity:** MEDIUM — PCG-6 is monitoring-only, never launch-blocking, but still needs a conformant
   definition before any monitoring claim is meaningful.
3. **Status:** PENDING
4. **Governing source:** `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`'s three-part completion definition
   (targeting criteria defined → ≥1 qualified opportunity received → review/action step reached); PDEF-4 §6.3
   (PCG-6 monitoring-only).
5. **Repository evidence:**
   - `searches.status` CHECK-enforced to `PENDING | RUNNING | COMPLETE | FAILED | CANCELLED` (migration
     `0014_searches`); no further lifecycle stage beyond these exists.
   - Migration `0017_opportunities` / [types.ts](packages/core-opportunity/src/types.ts) — MVP `Opportunity`
     model has `state: 'NEW' | 'RESEARCHED'` only; no "reviewed"/"actioned" state field.
   - Only two Client-Finder opportunity-facing UI routes exist: the list page and `[id]/page.tsx` (detail, with
     `FeedbackForm`).
   - `getOpportunityTrackingSummary()` ([service.ts](packages/core-opportunity/src/service.ts), Phase 15/R-27)
     already computes `created` and `actioned` (feedback-row count) — explicitly **not** a "reviewed" count per
     its own documented rationale (quoted under B-1 above); scoped to "basic outcome tracking" (R-27,
     `MVP_SCOPE_BOUNDARY.md` §5.5), not PDEF-3's specific three-part definition.
6. **Exact decision required:** What exact denominator and numerator should PCG-6 use, given PDEF-3's three-part
   definition maps onto no single existing field? Does "≥1 qualified opportunity received" require the same
   equivalence Q-10 addressed, or a different one? Does "review/action step reached" map to B-1's undecided event,
   to `feedback` submission, or to something else?
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (primary — monitoring-only gates have more policy
   latitude); `ENGINEERING DESIGN REQUIRED` (build-cost input).
8. **Options:**
   - Option 1 — reuse `getOpportunityTrackingSummary()`'s `actioned` count as numerator proxy, denominator =
     B-5's activation population. Fastest; explicitly conflates "actioned" with PDEF-3's "review/action step
     reached," which the repository's own comment already distinguishes.
   - Option 2 — numerator = B-1's new "opportunity reviewed" event once resolved/built; denominator = B-5's
     activation population. Most faithful to PDEF-3's wording; fully dependent on B-1.
   - Option 3 — three-part conjunctive check (criteria defined AND ≥1 qualifying opportunity AND review/action
     signal), computed per-holder. Most literal; most complex to compute/audit.
   - Option 4 — defer PCG-6 implementation entirely until B-1 resolves; implement PCG-1..5 first.
9. **Tradeoffs:** Option 1 ships fastest but very likely does not measure what PDEF-3 defines (the repository's
   own comments already distinguish "actioned" from "reviewed"). Option 2 is most conformant but blocked on B-1.
   Option 3 is most rigorous but heaviest for a monitoring-only gate. Option 4 avoids non-conformance but delays
   PCG-6 visibility indefinitely relative to the other five gates.
10. **Dependencies:** B-1 (Options 2/3's signal), B-5 (activation population, shared with PCG-4), B-9 (sample floor).
11. **Analyst observation — NOT A RECOMMENDATION:** the pre-existing in-repo distinction between "actioned" and
    "reviewed" shows this conflation was already anticipated and avoided once before (Phase 15), for adjacent but
    not identical reasons — noted as a pattern, not a directive.
12. **Selection:** `__________`

---

### B-9 — PCG-6 sample floor

1. **Blocker ID:** B-9
2. **Severity:** LOW — pure policy threshold for a monitoring-only, never-launch-blocking gate.
3. **Status:** PENDING
4. **Governing source:** Q-8 (floor principle, named explicitly only for PCG-3A/3B/4/5 — PCG-6 is **not** named);
   PO-D2 (sets numeric floors only for the four named gates: PCG-3A = 100, PCG-3B = 200, PCG-4 = 25, PCG-5 = 125).
5. **Repository evidence:** Not applicable — pure policy-threshold question, as PO-D2 itself already established
   for the other four gates; no code or data determines statistical adequacy.
6. **Exact decision required:** Does PCG-6 require a numeric sample floor at all (Q-8 does not name it), and if
   so, what value? Not inferred from any other gate's floor.
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` — a pure policy-threshold decision, identical in
   kind to PO-D2.
8. **Options (all `ANALYST OPTION — NOT DECIDED`):**
   - `ANALYST OPTION — NOT DECIDED` — No floor: report the raw percentage and denominator together, letting a
     human reviewer judge sufficiency manually (mirroring Q-8's own interim treatment before PO-D2 existed).
   - `ANALYST OPTION — NOT DECIDED` — Extend Q-8's principle to PCG-6 explicitly now, deriving a numeric value via
     the same `n ≥ 10/min(p, 1−p)` rule PO-D2 used — contingent on PCG-6 having a named percentage threshold,
     which was not independently re-verified in this questionnaire.
   - `ANALYST OPTION — NOT DECIDED` — A fixed, round floor chosen independently of statistical derivation, on the
     theory that a monitoring-only gate does not need PO-D2's rigor.
   - `ANALYST OPTION — NOT DECIDED` — Never mark PCG-6 NOT-YET-EVALUABLE; always report whatever percentage the
     data produces with the raw denominator shown, letting Product Owner review judge sufficiency every time.
9. **Tradeoffs:** The no-floor options risk a misleadingly precise percentage off a tiny denominator for a gate
   with no automated safeguard. The second option is most consistent with the other four gates' treatment but
   requires first confirming PCG-6 has a named percentage threshold (not confirmed). The third sacrifices PO-D2's
   statistical grounding for simplicity.
10. **Dependencies:** B-8 (PCG-6's numerator/denominator definition) must resolve before any floor can be
    meaningfully applied.
11. **Analyst observation — NOT A RECOMMENDATION:** none of the four candidate options is put forward as
    preferred; they exist only to make the shape of the open decision concrete.
12. **Selection:** `__________`

---

### B-10 — Visitor identity primitive

1. **Blocker ID:** B-10
2. **Severity:** HIGH — undermines Q-2's dedup requirement and Q-6's first-exposure attribution requirement
   regardless of how correctly the server-side storage (ED-1/ED-3/ED-5) is built.
3. **Status:** PENDING
4. **Governing source:** Newly discovered during repository inspection; related to but distinct from ED-1
   (storage architecture — decided) and ED-2 (defers user-merge — decided); neither addresses which client-side
   signal feeds the store.
5. **Repository evidence:**
   - [track.ts](apps/web/src/analytics/track.ts) — `tabScope()`/`scopeId` is a per-tab, in-memory
     `crypto.randomUUID()`, explicitly scoped "so a re-render does not double-count a view" — lost on tab
     close/reload, not cross-session.
   - [attribution.ts](apps/web/src/analytics/attribution.ts) — `_fbp`/`_fbc` (Meta's browser-id/click-id
     cookies) captured for Meta-attribution only, stored in `sessionStorage`; module's own comment: "attribution
     is a marketing signal, not a permission" — not engineered for identity-dedup correctness.
   - Neither primitive is built or documented as suitable for Q-2's "a visitor who enters via one path and later
     re-enters via the other is still counted once" requirement.
6. **Exact decision required:** Should the visitor id be a new, dedicated, durable cookie (separate from
   `_fbp`/`tabScope`), a reuse of `_fbp` despite its unrelated purpose, or something else? Is `sessionStorage`'s
   non-cross-session scope acceptable, or does dedup need `localStorage`/a longer-lived cookie?
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (primary — technical identity-mechanism choice);
   `PRODUCT OWNER DECISION REQUIRED` only if a new first-party tracking cookie raises privacy/consent policy
   (conditional).
8. **Options:**
   - Option 1 — new, dedicated first-party cookie, set server-side on first contact, independent of any
     Meta/marketing identifier.
   - Option 2 — reuse `_fbp` directly, accepting Meta's cookie lifetime/semantics as a dependency.
   - Option 3 — reuse `tabScope`'s pattern but persist it to `localStorage` instead of in-memory (survives
     reloads within a browser, not across browsers/devices).
9. **Tradeoffs:** Option 1 is cleanest (no third-party cookie-policy dependency) but net-new engineering surface.
   Option 2 is fast but ties a commercial gate's correctness to Meta's cookie lifetime/consent-banner
   interactions this codebase does not control. Option 3 is a small change but was designed for a narrower
   purpose and never evaluated against cross-session dedup correctness.
10. **Dependencies:** Blocks the practical correctness of W-1/W-3/W-5/W-8 even once their architecture is
    implemented, since a per-tab or marketing-only identifier would undermine Q-2/Q-6 regardless of server-side
    storage correctness.
11. **Analyst observation — NOT A RECOMMENDATION:** both existing candidates were purpose-built for something
    other than durable visitor dedup — stated as a fact about documented design intent, not grounds for
    rejecting their reuse.
12. **Important distinction (carried from the source record, not a recommendation):** a visitor identifier does
    not automatically establish identity or authentication; an untrusted browser identifier must not be treated
    as proof of a real person.
13. **Selection:** `__________`

---

### B-11 — PCG-1 trust-boundary dependency on untrusted browser events

1. **Blocker ID:** B-11
2. **Severity:** CRITICAL — highest-priority blocker in this questionnaire. PCG-1 is a hard launch blocker whose
   qualifying events are, per the current taxonomy, browser-emitted — directly in tension with this codebase's
   own stated trust principle.
3. **Status:** PENDING
4. **Governing source:** Newly discovered during repository inspection; interacts with ED-1 (event storage —
   decided) and Q-1 (PCG-1 eligibility — decided, not reopened), but raises a trust-boundary question neither
   record addressed.
5. **Repository evidence:**
   - [events.ts](apps/web/src/analytics/events.ts) header comment: "BROWSER events describe what a person did in
     the UI... **nothing downstream depends on them being truthful**... PURCHASE events describe money. The
     browser cannot be allowed to emit them... a client-reported purchase would corrupt conversion data." This is
     an existing, explicit architectural principle: browser-emitted events are not trusted for anything
     commercially load-bearing.
   - PCG-1 (500 qualified visitors) is a hard launch blocker per PDEF-4; its "funnel entry + demonstrated intent"
     conditions (Q-1) are, per the current event taxonomy (`funnel_entry_viewed`, `checkout_started`, etc.),
     browser-emitted events — i.e., exactly the category `events.ts` itself says nothing downstream should trust.
   - Consumers: funnel events flow into the event-storage architecture ED-1 already decided; no server-side
     payment/order or authenticated-user signal currently substitutes for "demonstrated intent" in the funnel
     taxonomy. ED-3's bot/allowlist exclusion addresses *known*-bad traffic, a different threat model from
     spoofed events from an otherwise-normal browser.
6. **Exact decision required:** Should PCG-1's qualifying events continue to be purely browser-emitted (consistent
   with today's architecture, but in tension with the codebase's own stated untrusted-signal principle) for a
   hard launch-blocking gate, or does PCG-1 require server-side corroboration (e.g., a verifiable server-observed
   correlate) before counting toward a launch-blocking threshold?
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (risk tolerance for a launch-blocking gate resting
   on an unauthenticated signal) + `ENGINEERING DESIGN REQUIRED` (what corroboration, if any, is feasible) —
   jointly coordinated. **This blocker must not be resolved by an implementation workaround that hides the
   trust-boundary question.**
8. **Options:**
   - Option 1 — continue using browser events with explicit limitations, accepting documented risk for a
     count-based signal, distinct from `Purchase`'s money-moving stakes.
   - Option 2 — make funnel-entry server-observable (e.g., require the event to arrive with a verifiable
     server-logged HTTP correlate).
   - Option 3 — use a server-issued/session-backed event in place of a purely client-emitted one for whichever
     signal constitutes "demonstrated intent" (not yet identified in the prior preparation record either).
   - Option 4 — a hybrid browser + server evidence model (browser event for granularity, server corroboration
     for the launch-blocking count itself).
   - Option 5 — change PCG-1's policy status (e.g., from hard blocker to monitoring-only) if no trustworthy
     implementation is feasible within scope — **this option, if selected, requires the Product Owner to amend
     `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` explicitly; this questionnaire does not make that change
     itself.**
9. **Tradeoffs:** Option 1 is simplest and matches current architecture but directly contradicts the stated
   "nothing downstream depends on them being truthful" principle — PCG-1 would be exactly such a dependency.
   Options 2–4 add real engineering cost to mitigate a risk whose actual likelihood (spoofed "demonstrated
   intent" events) is only partially addressed by ED-3's allowlist (a different threat model: known-bad traffic,
   not spoofing by a normal browser). Option 5 is the most honest resolution if no trustworthy implementation is
   feasible, but requires an explicit PDEF-4 amendment — a Product Owner action outside this questionnaire's
   authority.
10. **Dependencies:** Interacts with ED-3 (bot exclusion, different threat model) and W-1 (whichever event type
    represents "demonstrated intent").
11. **Analyst observation — NOT A RECOMMENDATION:** the tension described is a direct, verifiable reading of the
    existing `events.ts` comment juxtaposed with PDEF-4's launch-blocker designation of PCG-1. It is reported
    because no record in this governance chain has addressed it, not because a specific severity or likelihood is
    being asserted. **If the existing PDEF-4 decision is ultimately found incompatible with a trustworthy
    implementation, the required remedy is an explicit Product Owner amendment to that decision — not a silent
    change by this questionnaire, and not an implementation workaround that conceals the gap.**
12. **Selection:** `__________`

---

## 4. Additional blocker discovery

The source preparation record's own investigation (same `af9ede93...` HEAD, re-verified unchanged — see §5)
already searched for blockers beyond B-1 through B-11 and found none rising to "would prevent safe
implementation" rather than ordinary engineering detail already captured elsewhere. This questionnaire performed
no new repository inspection beyond what the source record already documented (nothing in the repository has
changed between the two records), and re-confirms that finding: **no B-12 or beyond is added.** No blocker is
manufactured here merely for structural completeness.

## 5. Critical governance separation (restated)

**Already decided:** see §0.
**New decisions required:** B-1 through B-11, §3.
**Not authorized:** see §2 — implementation, schema/migrations, tests, instrumentation, validation execution,
deployment, release, and launch are all still unauthorized by this document.

## 6. Decision status summary

| Blocker | Severity | Status | Authority |
|---|---|---|---|
| B-1 | HIGH | PENDING | PRODUCT OWNER DECISION REQUIRED + ENGINEERING DESIGN REQUIRED |
| B-2 | HIGH | PENDING | PRODUCT OWNER DECISION REQUIRED + ENGINEERING DESIGN REQUIRED |
| B-3 | HIGH | PENDING | ENGINEERING DESIGN REQUIRED (+ PO on failure-behavior only) |
| B-4 | MEDIUM | PENDING | ENGINEERING DESIGN REQUIRED |
| B-5 | MEDIUM | PENDING | ENGINEERING DESIGN REQUIRED |
| B-6 | HIGH | PENDING | ENGINEERING DESIGN REQUIRED + PRODUCT OWNER DECISION REQUIRED |
| B-7 | HIGH | PENDING | PRODUCT OWNER DECISION REQUIRED |
| B-8 | MEDIUM | PENDING | PRODUCT OWNER DECISION REQUIRED |
| B-9 | LOW | PENDING | PRODUCT OWNER DECISION REQUIRED |
| B-10 | HIGH | PENDING | ENGINEERING DESIGN REQUIRED (+ PO on privacy only) |
| B-11 | CRITICAL | PENDING | PRODUCT OWNER DECISION REQUIRED + ENGINEERING DESIGN REQUIRED |

No row above is `DECIDED`. None is resolved by this questionnaire or by any existing governing record — each
governing record cited fixes a narrower, different question than the one posed in that blocker's own "exact
decision required" field.

## 7. Authorization (restated)

This record authorizes **none** of: implementation of any workstream or blocker resolution; schema or migration
changes; test changes; instrumentation changes; validation execution; deployment; release; or launch. It does
not modify, reopen, or alter any governing record in §0, the source preparation record, the PRD, or
`docs/ARCHITECTURE.md`. It is not committed or pushed.

## 8. Next step

Once explicit selections are supplied for B-1 through B-11, a separate, explicitly authorized engineering-blocker
decision record should be created to record those selections as `DECIDED`, consolidate their downstream effect
on workstreams W-1..W-19, and only then feed into a still-separate implementation-authorization decision. This
questionnaire does not create that decision record.
