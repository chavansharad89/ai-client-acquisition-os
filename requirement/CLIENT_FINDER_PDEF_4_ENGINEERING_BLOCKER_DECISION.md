# Client Finder / Client Intent Discovery — PDEF-4 Engineering Blocker Decision

**Record ID:** `CLIENT-FINDER-PDEF-4-ENGINEERING-BLOCKER-DECISION-001`
**Date:** 2026-10-05
**Type:** Decision record.

> **Authority notice.** Every selection below is made under **delegated Product Owner authority exercised by
> Claude for this task**, at the user's explicit instruction. These are not direct human-supplied Product Owner
> answers, and are not represented as such anywhere in this document. Where a decision is more naturally an
> engineering-design call, it is likewise made under the same delegated authority, not as an independent human
> engineering sign-off. Any future reader relying on this record for launch-qualification purposes should treat
> it as a delegated, recorded decision, not as evidence of a separate human review having occurred.

**Label discrepancy noted, not silently resolved:** the task instructions describing the required decision order
labeled item 4 "B-2 — visitor identity" and item 7 "B-3 — bot/internal traffic exclusion." Neither label matches
B-2's or B-3's actual, repository-evidence-grounded content as established across all four prior blocker
records: **B-2 is independent-validation ownership/retention/approval authority**, and **B-3 is the
qualification-equivalence evaluator's implementation contract**. "Visitor identity" is B-10's subject; "bot/
internal-traffic exclusion" is ED-3's subject (already decided, not a blocker at all). This record decides B-2
and B-3 using their actual, evidence-grounded definitions rather than the mislabeled short descriptions, since
substituting new scope under old labels would itself be an unauthorized, silent redefinition of blockers
established by repository evidence in three prior records. The numeric decision *order* given (B-11a→B-11b→B-11c→
B-2→B-10→B-5/B-6→B-3→B-1→B-7→B-4→B-8→B-9) is followed exactly as stated — only the two inline descriptive labels
are treated as mistaken paraphrases, not as a redefinition instruction.

**Context records read (all unmodified by this record except the new file itself):**
`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md`,
`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_FACILITATION_RECORD.md`,
`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_ORDERED_QUESTIONNAIRE.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`,
`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`, `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`,
`MVP_SCOPE_BOUNDARY.md`. None is altered, reopened, or superseded by this record except where an explicit
amendment dependency is named below (none was required — see §13).

**New repository evidence gathered for this record (not in any prior blocker record):** a targeted check of
whether a server-authoritative, checkout-initiation-time signal already exists for PCG-1's "demonstrated intent"
condition, since B-11a's decision depends on whether server-authoritative evidence is a real, already-built
option or a hypothetical one. Findings, with file:line citations, are under B-11a below.

---

## 1. B-11a — Event authenticity

1. **Decision:** Whether a browser-emitted event alone is acceptable evidence for PCG-1, or whether
   server-side corroboration is required.
2. **Selected option:** **Option D — hybrid.** Browser-emitted funnel events (`funnel_entry_viewed`,
   `checkout_started`/`CheckoutStarted`) continue to be recorded and used for UX/diagnostics and for the
   low-stakes "funnel entry" half of Q-1's eligibility condition. The higher-stakes "demonstrated intent" half —
   the one that actually admits a visitor into PCG-1's launch-blocking count — is evidenced instead by the
   existing, already-server-created **PENDING `Order` row** (and its real Razorpay order id), not by the
   browser's `checkout_started` event.
3. **Rationale:** `apps/web/src/analytics/events.ts`'s own documented principle (browser events are untrusted
   for anything downstream) is real architecture, not a drafting accident — `SERVER_ONLY_EVENTS`/
   `assertBrowserEmittable` enforce it for `purchase_completed`/`entitlement_granted`. Investigation for this
   record found that a non-browser-fabricatable, checkout-initiation-time artifact **already exists** and
   requires **no new engineering**: `POST /api/payments/create-order` → `createOrder()`
   (`packages/core-payments/src/createOrder.ts:116-138`) creates a real Razorpay order and inserts a local
   `Order` row with `status: PENDING`, a unique `razorpayOrderId`, and a unique `idempotencyKey`
   (`packages/db/prisma/schema.prisma:98-137`), independent of whether payment ever completes. The UI
   (`apps/web/src/components/CheckoutPanel.tsx:57-84`) already calls this route synchronously, immediately after
   firing the browser `CheckoutStarted` event (line 60) and before the Razorpay payment modal ever opens (line
   78). This is the concrete, repository-grounded "technically viable alternative" the task's governing
   instruction asks to prefer over a browser-only signal — it is selected because it already exists and is
   harder to fabricate (it requires a real round trip that creates a real payment-provider order), not because
   "server-side" sounds more secure in the abstract. Option A (accept browser events alone) is rejected because
   a free alternative already exists that resolves the C-2 conflict without new engineering. Option B/C (new
   server-observable/server-issued event) are rejected as unnecessary — they would duplicate what the existing
   `Order` row already provides. Option E (PDEF-4 amendment) is rejected because it is not needed: PCG-1 can
   remain a hard launch blocker on better evidence, with no policy change.
4. **Governing dependency:** Q-1 (PCG-1 eligibility, decided, not reopened); `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`
   (PCG-1 hard-blocker status and floor of 500, decided, not reopened — unchanged by this decision).
5. **Downstream invalidations:** B-11a Options A/B/C/E are no longer live candidates. B-10's Option 2 (reuse
   `_fbp`) is weakened further (see B-10 below) because the identity substrate must now bridge funnel-entry
   (browser) and `Order`-row creation (server), which a third-party marketing cookie is not designed to do
   reliably. No governing record is invalidated.
6. **Required amendments:** None. PDEF-4's PCG-1 definition is unchanged; only the evidentiary mechanism behind
   Q-1's "demonstrated intent" half is clarified.
7. **Implementation consequences (not performed by this record):** PCG-1's computation (W-8) would need to
   query `Order` rows (any status, since `PENDING` is set at creation) joined to the funnel-entry identity,
   instead of or in addition to a browser `checkout_started` event, for the "demonstrated intent" half of
   eligibility. No schema change is implied by this alone (the `Order` table already exists).
8. **Remaining unresolved items:** Whether funnel-entry itself (the other half of Q-1's condition) ever needs
   upgrading beyond browser-sourced is not reopened here — it remains a low-stakes signal under this decision,
   since by itself it cannot admit a visitor to the count without the `Order`-row evidence. If a future audit
   finds funnel-entry-only inflation is being exploited, that would be a new, separate finding, not an open item
   of this decision.

---

## 2. B-11b — PCG-1 anchor (event anchoring)

1. **Decision:** What exact event/moment anchors PCG-1's rolling 30-day window.
2. **Selected option:** The **`Order.createdAt` timestamp** — the moment the PENDING `Order` row is persisted
   server-side (`createOrder.ts:128-137`) — anchors the window for each qualifying visitor, consistent with
   B-11a's selection of the `Order` row as the authoritative "demonstrated intent" evidence.
3. **Rationale:** Once B-11a establishes that demonstrated intent is evidenced by the `Order` row rather than
   the browser event, the anchor must be that row's own timestamp, not the browser event's client-reported
   timestamp (which remains diagnostic-only under B-11a's hybrid model and was never trustworthy as a window
   boundary in the first place, per the same `events.ts` principle). Using the server-persisted `createdAt`
   also mirrors the pattern this record already prefers for B-5 below (a dedicated, unambiguous server
   timestamp over a multi-purpose or client-reported one).
4. **Governing dependency:** B-11a (this decision is only meaningful given B-11a's selection); Q-1/Q-2 (funnel
   entry + demonstrated intent eligibility, combined-path dedup — decided, not reopened).
5. **Downstream invalidations:** The two options considered in the prior questionnaire premised on a
   browser-only funnel-entry-vs-demonstrated-intent choice (Options 1/2 of B-11b as originally framed) are
   superseded by this server-timestamp answer, consistent with that record's own note that Option 1/2 would only
   remain valid if the chosen event itself were the one made server-authoritative — here, a different,
   already-existing server artifact is used instead.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** W-7's rolling-window utility would read
   `Order.createdAt` as PCG-1's anchor for visitors whose eligibility is established via the `Order` row.
8. **Remaining unresolved items:** None beyond what B-11a already left open.

---

## 3. B-11c — Event persistence/taxonomy

1. **Decision:** Whether ED-1/ED-5's existing storage architecture needs to change to accommodate the evidence
   B-11a/B-11b select.
2. **Selected option:** **Option 1 — no change needed.** The `Order` table already exists
   (`packages/db/prisma/schema.prisma:98-137`), was not newly introduced by this decision, and is not part of
   ED-1's visitor/funnel-event store at all — it is an existing, independent table. PCG-1's computation reading
   it is a computation-logic detail (which table W-8 queries), not a storage-architecture change, and does not
   require extending ED-1/ED-5's event taxonomy.
3. **Rationale:** Because B-11a's selected evidence is an already-persisted, already-modeled row rather than a
   new event type, there is nothing for ED-1/ED-5 to absorb. This keeps the decision narrow and avoids treating
   a computation-logic choice (what W-8 reads) as if it were a storage-architecture reopening, consistent with
   the instruction not to silently alter existing ED decisions.
4. **Governing dependency:** ED-1, ED-5 (decided, not reopened — confirmed sufficient as-is, not changed).
5. **Downstream invalidations:** None. This also means the schema-dependency flag the ordered questionnaire
   raised for B-11c (a possible taxonomy extension) does not materialize under this specific B-11a/B-11b
   selection.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** None beyond the query-logic consequence
   already noted under B-11b.
8. **Remaining unresolved items:** None.

---

## 4. B-2 — Independent validation ownership, retention, and approval authority

1. **Decision:** Who owns, performs, and approves the independent validation required by §6.10 for PCG-1/2/3A/3B,
   and what evidence is retained.
2. **Selected option:** **Option 4 — hybrid.** CI runs the deterministic fixture suite (ED-12 track B) on every
   change touching the gate-computation code. A **named, non-implementing engineering role** — defined here as
   "an engineer who did not author the corresponding gate-computation workstream," a role, not a specific
   individual — performs and signs off the independent production cross-check (ED-12 track A / W-18) before any
   PCG-1/2/3A/3B result is used for a launch-qualification decision.
3. **Rationale:** §6.10 explicitly and deliberately leaves the specific team/role/individual to "a separate
   process definition" rather than fixing one itself — this decision is that process definition, exercised under
   delegated authority, not a reopening of §6.10. Naming an actual individual is outside what a delegated
   decision can responsibly assert (it would fabricate an organizational fact this record has no basis for);
   defining the separation as a role requirement is the strongest commitment that can be made without doing so,
   and it most closely matches ED-12's own "both tracks" design (already decided) of any option considered.
   Option 1 alone (one named engineer, no CI) under-invests in repeatability; Option 2 alone (CI + human, no
   named role for the cross-check specifically) risks the cross-check being performed by whoever is available,
   including the implementer, which §6.10 exists to prevent; Option 3 (Product Owner validates directly) is
   rejected because the same delegated authority is making architecture decisions in this very record (B-11a
   onward), and having that same authority also validate its own downstream gate-computation code would collapse
   the implementation/validation separation §6.10 requires for exactly the gates where it matters most.
4. **Governing dependency:** `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.10 (requirement, decided, not
   reopened); ED-12 (Option C, decided, not reopened).
5. **Downstream invalidations:** None of B-1 through B-10's options are affected by this choice.
6. **Required amendments:** None — this fulfills, rather than reopens, §6.10's deliberate deferral.
7. **Implementation consequences (not performed by this record):** W-17 (fixture architecture) and W-18
   (production cross-check mechanism) would need to be built before this role-based process can actually run;
   this decision does not block building them, only their use for launch-qualification before they exist.
8. **Remaining unresolved items:** The exact retention **duration** for validation evidence is left
   **unresolved, not invented** — no governing record supplies a number, and inventing one (e.g., "12 months")
   would violate the instruction against fabricating thresholds not genuinely decided. The evidence **shape** is
   not left open: raw source rows for the window, the primary computed value, the independently computed value,
   and a match/mismatch record with an explanation if they differ (already specified in the implementation-
   authorization preparation record §6, not newly invented here). The exact storage location (a dedicated table
   vs. a CI artifact vs. a document) is deferred to Implementation Authorization.

---

## 5. B-10 — Visitor identity primitive

1. **Decision:** What durable, cross-session visitor identifier backs Q-2's dedup requirement and the
   funnel-entry-to-`Order`-row linkage B-11a's selection now requires.
2. **Selected option:** **Option 1 — a new, dedicated first-party cookie, set server-side on first contact**,
   independent of `_fbp`/`tabScope`.
3. **Rationale:** B-11a's selection requires bridging a visitor's funnel-entry moment (browser-observed) with
   their later `Order`-row creation (server-observed) so PCG-1 can confirm the *same* visitor satisfied both
   halves of Q-1's condition. `_fbp` (Option 2) is a Meta-owned identifier whose lifetime and consent-banner
   interactions this codebase does not control — tying a hard launch blocker's correctness to a third party's
   cookie policy is a new dependency this record declines to introduce, especially now that the higher-stakes
   half of the gate has just been moved onto first-party, server-authoritative evidence; reusing a third-party
   identifier for the other half would partially undercut that same improvement. `tabScope` (Option 3) is
   in-memory per-tab today and was explicitly designed for a narrower purpose ("a re-render does not
   double-count a view"); persisting it would still need to become a first-party, server-settable primitive to
   reach the `Order`-creation API, which is just Option 1 under a different name. Option 1 is selected directly.
4. **Governing dependency:** Q-2 (cross-path visitor dedup, decided, not reopened); ED-1/ED-5 (storage
   architecture, decided, not reopened — this identifier is a new *input* to that architecture, not a change to
   it).
5. **Downstream invalidations:** B-10's Option 2 (and, derivatively, Option 3) are not selected and are
   superseded for this purpose by Option 1.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** A new cookie would need to be set on first
   contact (server-side) and forwarded by the client to `POST /api/payments/create-order` so the resulting
   `Order` row can be associated with the same visitor identifier captured at funnel-entry. This is new,
   net-new engineering surface — not a schema change, but a real implementation item for whichever workstream
   (W-1/W-5/W-8) eventually implements it.
8. **Remaining unresolved items:** Exact cookie name, lifetime, and SameSite/security attributes are
   implementation detail, not decided here (not a policy question, and not a number this record should invent).
   Privacy/consent-banner treatment of a new first-party tracking cookie is noted, per the original B-10 record,
   as a Product-Owner-relevant consideration if a formal consent-banner review process exists elsewhere in the
   product — not found or assessed in this repository pass, and not fabricated here.

---

## 6. B-5 — Activation timestamp source

1. **Decision:** Which timestamp represents "performed" for PCG-4/PCG-6 window membership.
2. **Selected option:** **Option 3 — a new, dedicated `completed_at` column**, set exactly once, at the write
   that transitions `searches.status` to `'COMPLETE'`, and never touched again.
3. **Rationale:** PO-D1's own stated rationale for using `status = 'COMPLETE'` at all is that only completed
   searches ever deliver a result worth measuring — `created_at` (Option 1) measures *attempted*, not
   *performed*, which is in direct tension with that rationale, not merely a simplification of it. `updated_at`
   (Option 2) is demonstrably multi-purpose today (`packages/core-search/src/pgRepository.ts` touches it on
   lease-claim and error-recording writes, not only the COMPLETE transition), so it cannot be relied on as "time
   of completion" without an additional guarantee nothing in the repository currently provides. A new column is
   the only option that removes this ambiguity outright, and it follows an existing, established repository
   pattern (`evaluated_at`, `processed_at` elsewhere in the schema) rather than inventing a novel mechanism.
4. **Governing dependency:** PO-D1 (`status = 'COMPLETE'` qualifying filter, decided, not reopened); ED-8 (query
   `Search` directly, decided, not reopened — unaffected, since this only names which column within that query
   to read).
5. **Downstream invalidations:** Options 1 and 2 are not selected. B-1 and B-8's own timestamp assumptions, if
   any were implicitly built around `created_at`/`updated_at`, should be read against `completed_at` instead —
   no such assumption was made in this record's own B-1/B-8 selections below, so nothing is actually invalidated
   in this record, only flagged for consistency going forward.
6. **Required amendments:** None to any governing decision record. This selection does create a **schema
   dependency** (a new migration adding `completed_at` to `searches`) — named explicitly here as a required
   future implementation item, not performed by this record.
7. **Implementation consequences (not performed by this record):** A migration adding `searches.completed_at
   TIMESTAMPTZ NULL`, set by the same write that sets `status = 'COMPLETE'`; W-8/W-12/W-14 would read this column
   instead of `created_at`/`updated_at`.
8. **Remaining unresolved items:** None beyond the named schema dependency.

---

## 7. B-6 — Refund storage shape

1. **Decision:** How the economically-final refund state (Q-11/Q-12, decided) is represented in storage.
2. **Selected option:** **Option 2 — a new `refund_events` table**, one row per refund-related webhook outcome,
   foreign-keyed to `Payment`, with a reversed/corrected flag and timestamp.
3. **Rationale:** Q-12's decided policy requires representing a reversal (refund-then-un-refund) distinctly
   from a simple refund, and requires that distinction to be immutable once the measurement window closes. A
   single-valued `Payment.status = REFUNDED` (Option 1) cannot natively represent that history without further
   extension, and Option 1's own prior analysis already flagged it as "a likely non-starter without extension."
   Reading `WebhookEvent.payload` directly (Option 3) repurposes a redaction/retention-oriented JSON blob as a
   query-time source of truth, which is not what that table was built for and would make the audit-evidence
   bundle (ED-13's goal, decided) harder to produce cleanly. Option 4 (status plus one nullable column) is a
   smaller commitment than Option 2 but represents only a single reversal, not an arbitrary refund/reversal
   history — Option 2's full table is selected because it is the only option with no stated structural
   limitation against the already-decided policy, and the added schema size (one small table) does not
   meaningfully conflict with "keep MVP scope intact," which concerns product/billing scope, not internal
   audit-table granularity.
4. **Governing dependency:** ED-6 (reuse `WebhookEvent` dedup, isolate refund logic — decided, not reopened);
   Q-11/Q-12 (decided policy, not reopened).
5. **Downstream invalidations:** Options 1, 3, and 4 are not selected. B-4's "behavioral scope" reversal test
   cases, which the ordered questionnaire flagged as likely invalidated under Option 1 alone, are **not**
   invalidated under this selection — they remain fully representable.
6. **Required amendments:** None to any governing decision record. Creates a **schema dependency**: a new
   migration adding the `refund_events` table.
7. **Implementation consequences (not performed by this record):** W-6 (refund webhook ingestion) would write
   to this new table on `refund.processed`/reversal events, in the same transaction pattern ED-6 already
   specifies for `WebhookEvent` dedup.
8. **Remaining unresolved items:** Exact column list beyond FK/flag/timestamp (e.g., refund amount, source
   webhook id) is implementation detail for the migration itself, not decided at this policy level — consistent
   with the governing source material already cited (amount, timestamp, idempotency, source event id, full-vs-
   partial) as the minimum shape, not exhaustively re-specified here to avoid duplicating prior-record content.

---

## 8. B-3 — Qualification-equivalence evaluator implementation contract

1. **Decision:** The new evaluator's exact inputs, outputs, determinism, and failure behavior.
2. **Selected option (four axes):**
   - **Inputs: (a)** the `Search` row's immutable criteria snapshot plus the `Opportunity`'s own attributes
     only — **selected**.
   - **Outputs: (b)** a structured, per-criterion breakdown (service match, customer match, value-threshold
     match, each independently satisfied/not) — **selected**.
   - **Determinism: (a)** pure function, no I/O, no clock, no randomness — **selected**.
   - **Failure behavior: (b)** fail-soft — a missing/malformed criteria field marks that specific criterion
     not-satisfied with a stated reason, rather than hard-erroring — **selected**.
3. **Rationale:**
   - Inputs-(a) is selected because inputs-(b) would reopen migration `0014`'s own stated invariant that a
     Search's qualification result never silently changes if the user's profile is later edited — selecting (b)
     would be exactly the kind of silent alteration of an existing, working guarantee this task's governing
     instructions direct against.
   - Outputs-(b) is selected because B-7 (below) needs per-criterion granularity to combine this evaluator's
     result with `feedback.useful` meaningfully, and because ED-13's already-decided evidence-bundle goal
     specifically benefits from this shape; a boolean-only output would under-serve a decision already made
     elsewhere in this governance chain.
   - Determinism-(a) is selected because it mirrors `core-qualification`'s own existing discipline and, more
     concretely, because B-2's selected validation approach (Option 4, above) depends on a deterministic fixture
     suite being replayable — a non-deterministic evaluator (axis (b)) would directly undermine that
     already-made decision in this same record.
   - Failure behavior-(b) is selected because fail-closed (axis (a)) risks silently suppressing legitimate
     members of B-7's PCG-4 numerator whenever a criteria snapshot is incomplete for a benign reason, which
     directly harms the Product-Owner-relevant visibility goal this axis was flagged as needing PO input for;
     fail-soft is also consistent with `core-qualification`'s own existing fail-soft treatment of
     `needDetected=false` ("a definite negative conclusion... not a lack of evidence"), extended here by
     analogy, not by direct reuse of that module's code (ED-10's non-equivalence finding is not reopened).
4. **Governing dependency:** Q-10 (non-equivalence finding, decided, not reopened); ED-10 (new standalone
   evaluator module, persisted result — decided, not reopened).
5. **Downstream invalidations:** Inputs-(b), outputs-(a), determinism-(b), and failure-behavior-(a) are not
   selected.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** A new, pure evaluator module (per ED-10),
   taking the `Search` snapshot and `Opportunity` attributes, returning a structured per-criterion result,
   persisted in a new table or structure separate from `qualifications` (per ED-10, not reopened).
8. **Remaining unresolved items:** The exact semantic distinction between "not satisfied" and "indeterminate"
   under fail-soft behavior is **not resolved by this decision** — this record decides the *direction*
   (fail-soft, not fail-closed) but the precise definition of each resulting state is left as a named open
   sub-item for the Implementation Authorization stage, not invented here.

---

## 9. B-1 — Opportunity Reviewed event: exact semantics and call site

1. **Decision:** What exact user action constitutes "reviewed," and at what call site it is recorded.
2. **Selected option:** **Option 4 — first-view-only, deduplicated by `(userId, opportunityId)`**, implemented
   as a persistence side effect on `apps/web/app/(client-finder)/opportunities/[id]/page.tsx`'s first render for
   a given user/opportunity pair, via a check-then-write or unique-constraint upsert.
3. **Rationale:** Option 2 (feedback-submission-based) is rejected because ED-9 already rejected it as
   conflating "reviewed" with "gave feedback" — selecting it here would silently undo that already-decided
   rejection. Option 3 (a new, dedicated UI action) is rejected under "keep MVP scope intact": it requires a
   net-new UX surface and its own product-design decision, which is out of scope for an engineering-blocker
   decision record exercised under delegated authority — introducing new UI is a product decision this record
   should not make unilaterally. Option 1 (plain page-view) is rejected on its own because it risks inflating
   the signal on every reload; Option 4 is the refinement that fixes exactly that risk while still reusing the
   existing detail-page call site, at the cost (already noted in the prior questionnaire) of adding a
   persistence side effect to a component explicitly documented as deliberately not having one today — accepted
   here as the smallest change that produces a genuinely distinct, non-inflatable signal.
4. **Governing dependency:** ED-9 (dedicated event, decoupled from `SearchStatus`/`feedback` — decided, not
   reopened); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`'s completion definition (decided, not reopened — only
   its implementation mapping is decided here).
5. **Downstream invalidations:** Options 1, 2, and 3 are not selected. Because Option 2 was not selected, B-8's
   Option 1 ("reuse `actioned`/feedback count") and Option 2 ("numerator = this event") remain genuinely
   distinct from each other — the collapse risk the ordered questionnaire flagged does not occur.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** A new, append-or-upsert-guarded persistence
   write on `[id]/page.tsx`'s render path, keyed `(userId, opportunityId)`, requiring the durable event store
   (ED-1, decided) to exist first.
8. **Remaining unresolved items:** None beyond the dependency on ED-1's store already being built.

---

## 10. B-7 — PCG-4 numerator combination logic

1. **Decision:** Whether PCG-4's numerator requires `feedback.useful = true`, B-3's evaluator match, or both.
2. **Selected option:** **Option 3 — conjunctive (`feedback.useful = true` AND B-3's evaluator match = true)**,
   evaluated per-opportunity (a single opportunity must carry both properties to count).
3. **Rationale:** `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §9's own text — "at least one qualified
   opportunity **that the user considers actionable and that satisfies** the user's configured target criteria"
   — is a single sentence joining both conditions with "and" about one opportunity, not a description of two
   independently sufficient signals. Option 1 (feedback alone) would leave condition (b) (the configured-
   criteria match) entirely unimplemented in the numerator despite B-3's evaluator existing specifically to
   represent it — a direct non-conformance with the decided text, not a neutral simplification. Option 2
   (evaluator alone) symmetrically ignores the user's own "considers actionable" judgment, which the decided
   text also requires. Option 4 (disjunctive) is rejected because it would count opportunities satisfying only
   one half as full successes, which the decided text's "and" does not support.
4. **Governing dependency:** Q-9/Q-10 (decided, not reopened); `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §9
   (decided, not reopened — this decision is its operational mapping, not a reinterpretation of its words).
5. **Downstream invalidations:** Options 1, 2, and 4 are not selected.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** W-12's numerator query joins a `feedback.useful
   = true` row and a matching B-3 evaluator result for the same opportunity.
8. **Remaining unresolved items:** This selection makes feedback submission a de facto prerequisite for an
   opportunity to ever count toward PCG-4's numerator, since `feedback` is not currently mandatory anywhere in
   the product. PCG-4 is monitoring-only (never launch-blocking per PDEF-4 §6.3), which lowers the stakes of this
   consequence, but it is flagged, not resolved, as a product-adoption dependency worth watching once real data
   exists — not a reason to select a different, less-conformant option now.

---

## 11. B-4 — Refund contract-test scope

1. **Decision:** What test cases are needed beyond the three existing `it.todo` stubs.
2. **Selected option:** **Behavioral scope** — the three existing stubs, plus explicit tests for: duplicate
   `refund.processed` delivery for the same refund (single-processing via `razorpayEventId` uniqueness); a
   partial refund followed by a second partial refund on the same `Payment` (counts once, per Q-11); a reversal
   arriving before window close (corrects the numerator, per Q-12); the same reversal arriving after window
   close (does not reopen a closed evaluation, per Q-12); out-of-order delivery (a refund event arriving before
   its corresponding `payment.captured` event); and a refund event whose `order_id`/`payment_id` does not
   resolve to an existing `Payment` row.
3. **Rationale:** Minimal scope (the three stubs alone) would leave Q-11/Q-12's actual, already-decided policy
   behaviorally unverified before any PCG-5 launch-qualification claim — an acceptable scope only if the
   question were purely about effort, which it is not, since Q-11/Q-12 are decided policy this codebase must
   actually honor. Full scope (behavioral plus property-based/fuzz testing) is rejected under "keep MVP scope
   intact" read as a general proportionality instruction: the refund webhook surface is narrow and
   fully-specified (binary, transaction-based per Q-11/Q-12), and fuzz testing's incremental value beyond the
   enumerated behavioral cases has no concrete, evidenced justification in this repository. Behavioral scope is
   now fully writable (not merely aspirational) because B-6 selected a `refund_events` table (Option 2) capable
   of representing every case this scope enumerates, including the reversal cases that would have been
   unwritable under B-6's Option 1 alone.
4. **Governing dependency:** ED-6 (decided, not reopened); Q-11/Q-12 (decided, not reopened); B-6 (decided
   above, in this record).
5. **Downstream invalidations:** The "minimal scope" and "full scope" options are not selected.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** W-6's test suite would need the enumerated
   cases written once W-6 itself is implemented — this record decides scope, not content, and does not write or
   authorize writing the tests.
8. **Remaining unresolved items:** None beyond W-6's own implementation being a precondition for writing these
   tests (already noted in the prior questionnaire as a coupling, not a sequencing, relationship).

---

## 12. B-8 — PCG-6 population/completion logic

1. **Decision:** What exact population (denominator) and signal (numerator) PCG-6 uses.
2. **Selected option:** **Option 2 — numerator = B-1's new "opportunity reviewed" event; denominator = B-5's
   activation population** (holders with ≥1 `Search` row at `status = 'COMPLETE'`, using the new
   `completed_at` column selected in B-5).
3. **Rationale:** Because B-1 selected Option 4 (a genuinely separate, page-view-based signal, not a
   feedback-submission proxy), this option is **not** collapsed into Option 1 the way the ordered questionnaire
   flagged it could be — the distinction between "actioned" (feedback-backed) and "reviewed" (B-1's event) that
   the repository's own Phase-15 comment already draws remains meaningful under this selection. Option 3 (a full
   three-part conjunctive check, computed per-holder) is rejected as disproportionate for a monitoring-only,
   never-launch-blocking gate (PDEF-4 §6.3) given that Option 2's population already implicitly carries all
   three of PDEF-3's named sub-parts in sequence for any holder who reaches it: reaching the activation
   population at all requires a completed `Search`, which requires targeting criteria to have been defined and
   confirmed to run it (sub-part 1); a completed `Search` producing zero opportunities would leave no opportunity
   page for the "reviewed" event to ever fire on, so a fired event implies at least one opportunity existed
   (sub-part 2, informally); and the event firing is literally the review/action step (sub-part 3). This is
   recorded as the rationale for proportionality, not as a claim that Option 2 is formally identical to Option
   3's explicit three-part check — it is an accepted simplification for a monitoring-only gate, not a hidden
   equivalence. Option 4 (defer PCG-6 entirely) is rejected because B-1 is now decided, removing the stated
   reason for deferral.
4. **Governing dependency:** `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §11 (decided, not reopened); PDEF-4
   §6.3 (monitoring-only status, decided, not reopened); B-1 and B-5 (decided above, in this record).
5. **Downstream invalidations:** Options 1, 3, and 4 are not selected. B-9 (below) now has a defined
   population/numerator to attach a floor-policy decision to, so B-9 is not deferred.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** W-14's numerator query reads B-1's reviewed-
   event store; its denominator query reads `searches.completed_at IS NOT NULL` (from B-5) rather than
   `created_at`/`updated_at`.
8. **Remaining unresolved items:** None beyond B-1/B-5's own already-named implementation consequences.

---

## 13. B-9 — PCG-6 sample floor

1. **Decision:** Whether PCG-6 requires a numeric sample floor, and if so, what value.
2. **Selected option:** **No floor.** PCG-6 reports its raw percentage together with its raw denominator,
   unmarked by any automated NOT-YET-EVALUABLE gate; a human reviewer judges sufficiency manually, mirroring
   Q-8's own interim treatment before PO-D2 existed for the other four gates.
3. **Rationale:** Q-8 names a floor principle explicitly only for PCG-3A/3B/4/5; PO-D2 supplies numeric values
   only for those same four gates. No governing record supplies a PCG-6 number, and this task's own governing
   instruction explicitly forbids deriving one "merely because another gate contains a similar number." The
   "extend Q-8's principle to PCG-6 with a derived numeric floor" option is rejected for the same reason — it
   would require first confirming PCG-6 has a named percentage threshold to apply the `n ≥ 10/min(p,1−p)` rule
   to, which no governing record supplies either, making any derived number fabricated twice over. The "fixed,
   round floor" option is rejected as an arbitrary number with no grounding at all. The "no floor" option is the
   only one of the four candidates that requires inventing nothing, and PCG-6's own monitoring-only,
   never-launch-blocking status (PDEF-4 §6.3, decided) means the absence of an automated floor carries no
   launch-readiness risk — only a reporting-presentation one, which human review already covers under this
   selection.
4. **Governing dependency:** Q-8 (floor principle, decided, not reopened — PCG-6 confirmed not named by it, not
   newly extended to it here); PDEF-4 §6.3 (monitoring-only, decided, not reopened); B-8 (decided above, in this
   record, which this floor decision now has a defined population to apply to).
5. **Downstream invalidations:** The three other candidate options are not selected.
6. **Required amendments:** None.
7. **Implementation consequences (not performed by this record):** W-14 reports PCG-6 as a percentage plus its
   raw denominator, with no NOT-YET-EVALUABLE suppression logic for this gate specifically.
8. **Remaining unresolved items:** If the Product Owner (a human, not this delegated authority) later wants a
   numeric floor for PCG-6, that remains a legitimate, separate future policy decision — not foreclosed by
   "no floor" being selected now, since this selection is a default-absent-evidence choice, not a statement that
   no floor could ever be appropriate.

---

## 14. Summary table

| Decision | Selected option | Schema dependency created | Amendment required |
|---|---|---|---|
| B-11a | Hybrid — browser diagnostics + server-authoritative `Order` row for demonstrated intent | No | No |
| B-11b | `Order.createdAt` anchors PCG-1's window | No | No |
| B-11c | No change to ED-1/ED-5 | No | No |
| B-2 | CI fixtures + named non-implementing role for production cross-check | No | No |
| B-10 | New, dedicated first-party cookie, server-set | No (new cookie, not schema) | No |
| B-5 | New `completed_at` column on `searches` | **Yes** | No |
| B-6 | New `refund_events` table | **Yes** | No |
| B-3 | Inputs-(a), outputs-(b), determinism-(a), failure-(b) | Yes (new evaluator persistence, per ED-10, already decided) | No |
| B-1 | First-view-only, deduplicated `(userId, opportunityId)` reviewed event | Depends on ED-1's store (already decided) | No |
| B-7 | Conjunctive (`feedback.useful` AND evaluator match) | No | No |
| B-4 | Behavioral test scope | No | No |
| B-8 | Numerator = B-1 event; denominator = B-5 population | No (beyond B-5's own) | No |
| B-9 | No floor | No | No |

No decision above required amending PDEF-2, PDEF-3, PDEF-4, the entitlement-stacking decision, or any
instrumentation ED. No numeric threshold was invented: B-9 explicitly declined to derive one; B-5/B-6's column
additions are structural, not threshold values; the PCG-1 floor of 500 (PDEF-4 §6.5) is unchanged and not
touched by B-11a/b/c.

## 15. Authorization boundary

This record authorizes **decision-recording only**. It does **not** authorize: source-code changes; schema
changes; migrations; instrumentation implementation; tests; validation execution; billing changes; deployment;
release; production traffic; commit; or push. The schema dependencies named in §14 (B-5, B-6, and B-3's
evaluator persistence per already-decided ED-10) are **named, not created** — they remain unimplemented until a
separate, explicitly authorized Implementation Authorization Decision maps them to concrete migrations and is
itself followed by an explicit implementation-authorization step. No implementation proceeds automatically from
this record.

---

## Final verification (performed before reporting completion)

- HEAD unchanged: `af9ede93830f5e3e611195dc2451a470364def74`.
- Staged files: 0.
- Tracked, already-committed files modified: 0 (`git diff --name-only` empty).
- No source, test, schema, config, or dependency file changed.
- Only this decision record created. All referenced prior/governing records re-verified byte-identical to their
  previously recorded hashes:
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md` → `d199db8c6a953ca11744a27774505a503bb7935d4c0e62845887d01c30909cd0`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md` → `3e76f1f55186b0bc7399cc7c8d9d29644fd5550ca40cd15384c764fe3bc92286`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_FACILITATION_RECORD.md` → `8d12eb49b7c1e9629a485371c433442b2d657517076e4dfb8d57dd1ab2bdd360`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_ORDERED_QUESTIONNAIRE.md` → `ffc8485868ce830ff0f574a1749374ad06912f129f64e43d573807cfb5d3b51f`
  - `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` → `8ddf7d0410ae4023a109e2712e6b4c86b9007df80d2f2880d6d28f720deadde9`
  - `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` → `ad659cbdfc1974037af672cb693412531bc3fab27543ed67c68c6eaf69f80226`
  - `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` → `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3`
  - `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` → `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c`
  - `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` → `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8`
  - `MVP_SCOPE_BOUNDARY.md` → `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3`
  - `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` → `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca`
- No amendment was made to any governing record (§13/§15 confirm none was required).
- No commit made. No push made.
