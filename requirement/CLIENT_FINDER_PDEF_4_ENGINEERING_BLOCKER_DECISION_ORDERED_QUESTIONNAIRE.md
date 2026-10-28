# Client Finder / Client Intent Discovery — PDEF-4 Engineering Blocker Decision Questionnaire (Ordered, with Downstream Invalidation)

**Record ID:** `CLIENT-FINDER-PDEF-4-ENGINEERING-BLOCKER-DECISION-ORDERED-QUESTIONNAIRE-001`
**Date:** 2026-10-05
**Type:** Decision questionnaire, sequenced by dependency order, with an explicit downstream-invalidation field
per option. **This record creates, implies, infers, or authorizes no engineering decision, no Product Owner
decision, no implementation, no test change, no schema/migration change, no configuration/dependency change, no
validation execution, and no deployment/release/launch action of any kind.** Every decision point below ends in
a blank selection field. No option is treated as selected because it is first-listed, matches an existing
pattern, or is consistent with another already-decided gate.

**Relationship to prior records (none modified, none overwritten):**

| Record | Role |
|---|---|
| `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md` | Source evidence for B-1..B-11 |
| `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md` | First decision-capture format for B-1..B-11 |
| `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_FACILITATION_RECORD.md` | Confirmed decision order `B-11 → B-2 → B-10 → B-5/B-6 → B-3 → B-1 → B-7 → B-4 → B-8 → B-9`; flagged conflict C-1 (missing referenced file) and C-2 (B-11's trust tension) |

This record adopts the facilitation record's decision order as directed, expands B-11 into three explicitly
separated sub-problems per the governing instruction below, and adds a "Downstream invalidation" field to every
option of every decision point. It does not re-derive repository evidence already established in the two prior
records (repository `HEAD` has not moved — see §Final verification) and cites it by reference where unchanged.

**Governing instruction followed for B-11:** event **authenticity** (can this signal be trusted as launch
evidence), event **anchoring** (what exact event/moment constitutes the PCG-1 anchor), and event **persistence**
(how that evidence is durably stored, i.e. ED-1/ED-5's domain) are three different problems and are decided as
three separate sub-points (B-11a, B-11b, B-11c), in that order, rather than collapsed into one selection.

---

## 0. Decision order (confirmed, not re-litigated)

```
B-11a (authenticity) → B-11b (anchoring) → B-11c (persistence) → B-2 → B-10 → B-5 / B-6 (parallel) → B-3 → B-1 → B-7 → B-4 → B-8 → B-9
```

B-11 is resolved first because, per the facilitation record's own rationale (concurred with here): there is
little value designing the rest of the funnel around an evidence source that cannot legitimately support a
launch gate. B-11a is resolved before B-11b because the candidate anchor-event set differs depending on whether
the authenticity model stays browser-only or introduces a server-observable/server-issued event. B-11b is
resolved before B-11c because persistence only needs to accommodate whichever event type anchoring actually
selects.

## 1. Already decided / not authorized

Unchanged from the prior two records — see `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md`
§0 and §2 for the full governing-record table and the not-authorized list (implementation, schema/migrations,
tests, instrumentation, validation execution, deployment, release, launch). Not repeated verbatim here; nothing
in it changed.

---

## 2. B-11a — Event authenticity: can this signal be trusted as launch evidence?

1. **Decision ID:** B-11a
2. **Severity:** CRITICAL — resolved first in the entire sequence.
3. **Status:** PENDING
4. **Governing source:** Newly discovered (prior records); interacts with Q-1 (PCG-1 eligibility, decided, not
   reopened) and `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` (PCG-1 hard-blocker status, decided, not
   reopened — unless this decision itself requires an amendment, named explicitly under Option E).
5. **Repository evidence:** `apps/web/src/analytics/events.ts` header comment: "BROWSER events describe what a
   person did in the UI... nothing downstream depends on them being truthful... PURCHASE events describe
   money. The browser cannot be allowed to emit them." PCG-1's current qualifying signal (funnel-entry +
   demonstrated intent, Q-1) is, under the existing taxonomy, exactly a BROWSER-class event.
6. **Exact decision required:** Is a browser-emitted event, by itself, acceptable evidence for a hard
   launch-blocking count, or does PCG-1 require some form of server-side corroboration before a visitor counts
   toward the 500-visitor floor?
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (risk tolerance for a launch-blocking gate resting
   on an unauthenticated signal) + `ENGINEERING DESIGN REQUIRED` (what corroboration, if any, is feasible) —
   jointly coordinated.
8. **Options, each with downstream invalidation:**

   - **Option A — accept browser events as sufficient**, consistent with today's architecture; treat the risk
     (a few fabricated "demonstrated intent" events) as acceptable for a count-based gate, unlike `Purchase`'s
     money-moving stakes.
     **Downstream invalidation if selected:** B-11b's candidate anchor events remain limited to the existing
     browser taxonomy (`funnel_entry_viewed`, `checkout_started`, etc.) — no new event type is introduced.
     B-11c requires no persistence change (ED-1's existing storage already covers these event types). B-10
     (visitor identity) keeps its current browser-only scope; none of its options are invalidated by this
     choice alone. **Does not resolve** the C-2 conflict already flagged (code-documented untrusted-signal
     principle vs. a launch-blocking dependency on it) — that tension would remain accepted, not eliminated.

   - **Option B — make funnel-entry server-observable**, e.g. requiring the qualifying event to arrive with a
     verifiable server-logged HTTP correlate in addition to (or instead of) the browser event.
     **Downstream invalidation if selected:** B-11b must select among new server-observable correlates, not
     purely browser timestamps — any anchor-event option in B-11b premised on a client-only timestamp is
     invalidated. B-10's Option 2 (reuse `_fbp`) becomes very likely insufficient, since server-side correlation
     of "this HTTP request belongs to this visitor" needs an identifier the server can reliably read and that is
     not contingent on a third party's (Meta's) cookie-consent interactions — B-10 should be revisited with this
     constraint before being finalized. B-11c must confirm whether ED-1/ED-5's existing storage architecture can
     ingest this new, server-originated event type unchanged, or whether a schema/taxonomy extension is needed
     (flagged as a possible new schema dependency, not authorized here).

   - **Option C — use a server-issued/session-backed event** in place of a purely client-emitted one for
     whichever signal constitutes "demonstrated intent."
     **Downstream invalidation if selected:** Same B-11b consequence as Option B, but stronger — the anchor
     event is now defined by a server-issued token/session, not merely corroborated. B-10's Option 2 (`_fbp`
     reuse) is very likely invalidated outright (a session-backed identity is a different primitive from a
     marketing cookie); B-10's Option 1 (new dedicated first-party cookie) becomes the most natural fit and
     should be prioritized when B-10 is decided. B-11c almost certainly requires a new event type in whatever
     store ED-1/ED-5 defined — this is a concrete new schema/architecture-extension dependency to flag when
     B-11c is reached, not resolved here.

   - **Option D — hybrid model**: browser events continue to assist UX/diagnostics; launch-gating evidence for
     PCG-1 comes specifically from server-authoritative events.
     **Downstream invalidation if selected:** B-11b must pick two things, not one — which browser event remains
     for diagnostics (no change needed there) and which server-authoritative event is the actual anchor (inherits
     Option C's consequences for that half). B-10 must support both: the diagnostic/browser identity (unchanged)
     and the authoritative identity (Option C's B-10 consequence). This is the most flexible option but the only
     one requiring B-11b to produce two answers instead of one.

   - **Option E — amend PDEF-4 so PCG-1 is no longer a hard launch blocker.**
     **Downstream invalidation if selected:** **Requires an explicit Product Owner amendment to
     `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`; this questionnaire does not make that amendment and does
     not treat it as a default fallback if B/C/D prove infeasible.** If adopted, B-2's scope narrows — independent
     validation (§6.10) was required specifically for hard blockers PCG-1/2/3A/3B; with PCG-1 reclassified as
     monitoring-only, B-2's decision would need to be revisited for whether PCG-1 is still in its scope. B-11b's
     framing changes from "what anchors a hard-blocking count" to "what anchors a monitoring metric," which
     likely lowers the rigor required of B-11b's answer (though B-11b would still need an answer). PO-D2-style
     sample-floor urgency for PCG-1 specifically would no longer apply with hard-blocker urgency.
9. **Analyst observation — NOT A RECOMMENDATION:** Options B/C/D are not mutually exclusive with eventually also
   adopting Option E if they are found infeasible — but Option E is not an automatic fallback; if Engineering
   finds B/C/D infeasible, that finding itself becomes a new, explicit input to a Product Owner decision between
   accepting Option A's residual risk or adopting Option E's amendment, not a silently chosen default.
10. **Selection:** `__________`

---

## 3. B-11b — Event anchoring: what exact event/moment constitutes the PCG-1 anchor?

1. **Decision ID:** B-11b
2. **Severity:** HIGH — directly determines PCG-1's rolling-window correctness; blocked on B-11a's outcome.
3. **Status:** PENDING (cannot be meaningfully selected before B-11a resolves, since the candidate set itself
   depends on B-11a's answer).
4. **Governing source:** `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md` §5,
   PCG-1: "rolling 30 days from each qualifying visitor's qualifying event; exact anchor event (funnel-entry vs.
   demonstrated-intent moment) is `ENGINEERING DESIGN REQUIRED` — not fixed by Q-1/Q-2 at the field level."
5. **Repository evidence:** Q-1/Q-2 (`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`) define
   PCG-1's eligibility condition (funnel-entry + demonstrated intent, both paths combined, deduplicated) but not
   which of the two moments is the window's authoritative start. The existing event taxonomy
   (`apps/web/src/analytics/events.ts`) names distinct `funnel_entry_viewed` and later-stage events (e.g.
   `checkout_started`) as separate, sequential browser events today.
6. **Exact decision required:** Does the 30-day window anchor on the funnel-entry moment, the
   demonstrated-intent moment, or — if B-11a selected B/C/D — a new server-observed/server-issued moment?
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (window-anchor semantics are an implementation-
   correctness question), constrained by whichever event type(s) B-11a's selection makes eligible.
8. **Options, each with downstream invalidation:**

   - **Option 1 — funnel-entry moment** (the earlier of the two qualifying events): widest window; a visitor's
     30 days start as soon as they enter the funnel, before intent is demonstrated.
     **Downstream invalidation:** if B-11a selected B/C/D, this option is only valid if the funnel-entry event
     itself was the one made server-observable/server-issued — otherwise it reintroduces exactly the untrusted
     signal B-11a was meant to move away from, which would partially undo B-11a's resolution and should be
     flagged back to B-11a rather than silently accepted.

   - **Option 2 — demonstrated-intent moment** (the later of the two): narrower window; anchors on the stronger
     signal.
     **Downstream invalidation:** same consistency constraint as Option 1, in reverse — only fully consistent
     with B-11a Options B/C/D if demonstrated-intent specifically was the event made server-observable/issued.

   - **Option 3 — a new server-observed/server-issued moment** (only available if B-11a selected B, C, or D):
     anchors on the new event type itself, regardless of which existing browser moment it corresponds to.
     **Downstream invalidation:** requires B-11c to confirm this new event type can be durably persisted under
     ED-1/ED-5's existing architecture or needs an extension — this is the primary reason B-11c is sequenced
     immediately after B-11b rather than decided independently.
9. **Analyst observation — NOT A RECOMMENDATION:** the facilitation record's dependency note (§2 of that record)
   already identified this as a distinct sub-question from B-11a; this decision point exists specifically so
   that fact is not re-collapsed into B-11a's selection.
10. **Selection:** `__________`

---

## 4. B-11c — Event persistence: how is that evidence durably stored?

1. **Decision ID:** B-11c
2. **Severity:** MEDIUM — contingent on B-11a/B-11b; if both resolve to Option A/Option 1-or-2 (no new event
   type), this decision point may require no new selection at all.
3. **Status:** PENDING
4. **Governing source:** ED-1 (durable funnel/visitor event storage — decided) and ED-5 (visitor identity
   handling as it relates to storage — decided). Neither is reopened here; this decision point only asks
   whether their already-decided architecture needs to accommodate a new event type, not whether the
   architecture itself should change.
5. **Repository evidence:** Not independently re-inspected beyond what ED-1/ED-5 and the prior two blocker
   records already established, since the relevant fact (does a new event type fit the existing store) depends
   entirely on B-11a/B-11b's still-open answers, not on anything new in the repository.
6. **Exact decision required:**
   - If B-11a = Option A (no new event type): does the existing ED-1 storage already fully cover
     `funnel_entry_viewed`/demonstrated-intent events for PCG-1 purposes? (Likely yes, per ED-1's own decided
     scope — to be confirmed once B-11a/B-11b are actually selected, not assumed here.)
   - If B-11a = Option B/C/D (a new server-observable or server-issued event is introduced): can ED-1's existing
     event schema/taxonomy accommodate this new event type without a migration, or does it require a schema
     extension (a new event type/column, not a new storage architecture)?
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED`. If a schema extension is required, that extension
   itself is **not authorized by this questionnaire** and would need to flow into the eventual Implementation
   Authorization Decision Preparation (see §Next step) as a named schema dependency, not be implemented here.
8. **Options, each with downstream invalidation:**

   - **Option 1 — no change needed** (ED-1/ED-5's existing architecture already covers whichever event type
     B-11a/B-11b select): the simplest outcome; only valid if B-11a = A, or if B-11a = B/C/D but the new event
     type is structurally identical to an existing one ED-1 already models.
     **Downstream invalidation:** none — no new schema dependency is created.

   - **Option 2 — schema/taxonomy extension required** (a new event type or field must be added to the existing
     store to represent the new server-observable/server-issued event): still reuses ED-1's architecture, only
     extends its taxonomy.
     **Downstream invalidation:** creates an explicit, named schema dependency that must be carried into the
     Implementation Authorization Decision Preparation; does not itself reopen ED-1's architecture decision, but
     does add a concrete migration item to that future record's scope.

   - **Option 3 — ED-1/ED-5's architecture is insufficient for the new event type and requires reopening** (a
     genuine, not merely additive, architecture change): the most disruptive outcome.
     **Downstream invalidation:** would require flagging ED-1/ED-5 themselves as needing a Product-Owner-aware
     amendment, analogous to B-11a's Option E — this questionnaire does not make that determination; it is
     Engineering's finding to report if and when B-11a/B-11b's actual selections make it necessary.
9. **Analyst observation — NOT A RECOMMENDATION:** this decision point is deliberately kept separate from
   B-11a/B-11b so that "can we trust it" and "what exact moment" are never answered by appeal to "whatever is
   easiest to store" — storage convenience is explicitly not a valid input to B-11a/B-11b's own selections.
10. **Selection:** `__________`

---

## 5. B-2 — Independent validation ownership, retention, and approval authority

(Full governing source, repository evidence, and base options are unchanged from
`CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md` §B-2 and are not restated verbatim; this
section adds only the downstream-invalidation field per option.)

1. **Decision ID:** B-2
2. **Severity:** HIGH
3. **Status:** PENDING
6. **Exact decision required:** Who owns validation, who approves it, what evidence is retained, for how long,
   and where — unchanged from the prior questionnaire.
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` + `ENGINEERING DESIGN REQUIRED` — jointly
   coordinated.
8. **Options, each with downstream invalidation:**

   - **Option 1 — named non-implementing engineer signs off per run.**
     **Downstream invalidation:** if B-11a ultimately selected Option E (PCG-1 reclassified monitoring-only),
     this option's scope for PCG-1 specifically becomes optional rather than required by §6.10 — no other
     blocker is invalidated.

   - **Option 2 — automated CI + independent human review.**
     **Downstream invalidation:** none beyond the general B-11a/Option-E scope note above; this option's CI
     fixture suite would need to cover whichever event type B-11b/B-11c ultimately select for PCG-1, so its
     concrete fixture content (not its ownership model) is indirectly shaped by those decisions.

   - **Option 3 — Product Owner itself reviews and approves.**
     **Downstream invalidation:** if the same individual also made the B-11a authenticity/risk-tolerance
     decision, this option risks collapsing implementation-authority/validation-authority separation for the one
     gate (PCG-1) where that separation matters most, per §6.10's own stated requirement — flagged as a
     consistency tension to resurface if both choices are made by the same person, not a disqualifier.

   - **Option 4 — hybrid (CI for fixtures, named human role for production cross-check).**
     **Downstream invalidation:** none beyond the general notes above.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire.
10. **Selection:** `__________`

---

## 6. B-10 — Visitor identity primitive

(Governing source/evidence unchanged from the prior questionnaire's B-10; downstream-invalidation field added.)

1. **Decision ID:** B-10
2. **Severity:** HIGH
3. **Status:** PENDING
6. **Exact decision required:** New dedicated cookie, reuse of `_fbp`, or a persisted `tabScope` variant —
   unchanged from the prior questionnaire, now explicitly constrained by B-11a's outcome.
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (+ PO on privacy/consent only).
8. **Options, each with downstream invalidation:**

   - **Option 1 — new, dedicated first-party cookie, set server-side.**
     **Downstream invalidation:** none — this is the most B-11a-outcome-agnostic option; remains viable whether
     B-11a selected A, B, C, or D.

   - **Option 2 — reuse `_fbp` directly.**
     **Downstream invalidation:** **very likely invalidated if B-11a selected B or C** (server-side correlation
     needs an identifier the server reliably controls, not a Meta-owned cookie subject to Meta's own
     lifetime/consent-banner behavior) — see B-11a's own per-option notes above. If B-11a selected A (no change
     to today's architecture), this option remains viable on its own terms, independent of this questionnaire's
     B-11 analysis.

   - **Option 3 — persist `tabScope`'s pattern to `localStorage`.**
     **Downstream invalidation:** remains viable under B-11a = A; under B-11a = B/C/D, only covers the
     diagnostic/browser half of a hybrid model (Option D) and does not by itself satisfy the
     server-authoritative identity need those options introduce.
9. **Analyst observation — NOT A RECOMMENDATION:** both existing candidates (`tabScope`, `_fbp`) were
   purpose-built for something other than durable visitor dedup, as already noted in the prior questionnaire;
   this section adds only the B-11a interaction, not a new finding about their design intent.
10. **Selection:** `__________`

---

## 7. B-5 — Activation timestamp source

(Unchanged governing source/evidence from the prior questionnaire's B-5; downstream-invalidation field added.)

1. **Decision ID:** B-5
2. **Severity:** MEDIUM
3. **Status:** PENDING
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (PO awareness of window-boundary effects).
8. **Options, each with downstream invalidation:**

   - **Option 1 — `created_at`.**
     **Downstream invalidation:** no schema change; feeds B-1 and B-8 with the "attempted" semantics noted in
     the prior questionnaire's tradeoff; if later found inconsistent with B-1's chosen event philosophy
     (e.g. B-1 selects a first-view-only, deduplicated model that assumes precise completion timing), B-1 may
     need to be revisited for internal consistency — flagged, not pre-decided.

   - **Option 2 — `updated_at`.**
     **Downstream invalidation:** no schema change; carries the latent correctness risk already noted (touched
     by non-completion writes); if any future, currently-nonexistent write path ever touches a COMPLETE row,
     this option would silently corrupt B-8's population without re-triggering this decision — a standing risk
     to flag for review, not a reason to exclude the option now.

   - **Option 3 — new `completed_at` column.**
     **Downstream invalidation:** requires a migration (not authorized here); if B-6 also requires a migration
     (very likely under B-6 Options 2 or 4), both become line items in the same future Implementation
     Authorization Decision Preparation's schema-change scope — a sequencing efficiency to note, not a reason to
     prefer this option.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire.
10. **Selection:** `__________`

---

## 8. B-6 — Refund storage shape

(Unchanged governing source/evidence from the prior questionnaire's B-6; downstream-invalidation field added.)

1. **Decision ID:** B-6
2. **Severity:** HIGH
3. **Status:** PENDING
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` + `PRODUCT OWNER DECISION REQUIRED` (schema sign-off).
8. **Options, each with downstream invalidation:**

   - **Option 1 — reuse `Payment.status = REFUNDED` alone.**
     **Downstream invalidation:** **very likely invalidates B-4's "behavioral scope" reversal test cases**
     ((c)/(d) in the prior questionnaire's B-4 options) — a single-valued status field cannot represent
     refund-then-reversal history, so B-4's test matrix would need to drop or redefine those cases unless this
     option is paired with an extension. This inconsistency should be resurfaced at B-4's own decision point if
     B-6 settles on Option 1 alone.

   - **Option 2 — new `refund_events` table.**
     **Downstream invalidation:** none of B-4's test cases are invalidated; all of B-4's behavioral-scope cases
     remain representable. Requires a migration (schema dependency to carry forward, as with B-5 Option 3).

   - **Option 3 — read `WebhookEvent.payload` directly, no separate state table.**
     **Downstream invalidation:** B-4's reversal/correction test cases become harder to assert cleanly (no
     dedicated state to query against), likely pushing B-4 toward its "minimal scope" option by practical
     necessity rather than policy choice — flagged as a coupling effect, not a predetermined outcome.

   - **Option 4 — Option 1 plus a minimal correction-history extension.**
     **Downstream invalidation:** preserves B-4's full behavioral-scope test cases (unlike Option 1 alone);
     requires a smaller migration than Option 2.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire (dormant `REFUNDED`
   enum value noted as a fact, not a preference).
10. **Selection:** `__________`

---

## 9. B-3 — Qualification-equivalence evaluator implementation contract

(Unchanged governing source/evidence from the prior questionnaire's B-3; downstream-invalidation field added.)

1. **Decision ID:** B-3
2. **Severity:** HIGH
3. **Status:** PENDING
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED` (PO on failure-behavior only).
8. **Options, each with downstream invalidation (axes, not mutually exclusive, as in the prior questionnaire):**

   - **Inputs (a) — Search snapshot + Opportunity attributes only.**
     **Downstream invalidation:** none; preserves B-7's ability to combine this evaluator's result with
     `feedback.useful` without reopening migration `0014`'s snapshot-fidelity invariant.

   - **Inputs (b) — snapshot plus live `service_profiles` data.**
     **Downstream invalidation:** reopens migration `0014`'s own stated invariant (a Search's result never
     silently changes if the profile is later edited) — if selected, this should be flagged back to whoever owns
     that invariant before B-7 proceeds, since B-7's numerator would then inherit a non-snapshot-stable input.

   - **Outputs (a) — single boolean.**
     **Downstream invalidation:** B-7's Option 3/4 (conjunctive/disjunctive combination with `feedback.useful`)
     remain computable, but with less audit granularity than ED-13's evidence-bundle goal wants — not an
     invalidation, a quality reduction to note.

   - **Outputs (b) — structured per-criterion breakdown.**
     **Downstream invalidation:** none; strictly adds information B-7 and the eventual audit-evidence record can
     use.

   - **Determinism (a) — pure function, no I/O.**
     **Downstream invalidation:** none; preserves `core-qualification`'s existing discipline.

   - **Determinism (b) — allowed additional reads at evaluation time.**
     **Downstream invalidation:** weakens the audit-reproducibility guarantee B-2's validation (especially
     Option 1/2's fixture-based track) depends on — if B-2 already selected an option assuming deterministic,
     replayable fixtures, this choice should be resurfaced against that assumption.

   - **Failure behavior (a) — fail-closed (hard error, no result recorded).**
     **Downstream invalidation:** could silently suppress legitimate members of B-7's numerator if criteria
     snapshots are ever incomplete for a benign reason — directly affects PCG-4 visibility, which is why this
     specific axis (and only this one) also requires Product Owner input per field 7 above.

   - **Failure behavior (b) — fail-soft (criterion marked not-satisfied with a reason).**
     **Downstream invalidation:** requires defining "not satisfied" vs. "indeterminate" as its own sub-question
     before B-7 can rely on it cleanly — an open sub-decision this questionnaire surfaces but does not resolve.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire.
10. **Selection:** `__________`

---

## 10. B-1 — Opportunity Reviewed event: exact semantics and call site

(Unchanged governing source/evidence from the prior questionnaire's B-1; downstream-invalidation field added.)

1. **Decision ID:** B-1
2. **Severity:** HIGH
3. **Status:** PENDING
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` + `ENGINEERING DESIGN REQUIRED` — jointly
   coordinated.
8. **Options, each with downstream invalidation:**

   - **Option 1 — page-view-based (fire on every/first render).**
     **Downstream invalidation:** without the Option 4 dedup refinement, risks inflating B-8's numerator if B-8
     later selects Option 2 (numerator = this event) — B-8's choice should be re-checked against whichever of
     Options 1/4 is selected here.

   - **Option 2 — feedback-submission-based.**
     **Downstream invalidation:** **collapses the distinction B-8's Option 1 vs. Option 2 was designed to
     preserve** — if B-1 selects this option, B-8's "Option 2 — numerator = B-1's new reviewed event" becomes
     operationally identical to B-8's "Option 1 — reuse `actioned`/feedback count," since both would now key off
     the same underlying feedback-submission signal. This should be flagged explicitly when B-8 is reached: its
     four options effectively collapse to two if B-1 chooses this path.

   - **Option 3 — new, dedicated UI action.**
     **Downstream invalidation:** none; this is the only B-1 option that keeps B-8's Option 1 vs. Option 2
     distinction fully meaningful, since it creates a genuinely separate signal from `feedback`.

   - **Option 4 — first-view-only, deduplicated by `(userId, opportunityId)`.**
     **Downstream invalidation:** none beyond Option 1's note above (this option is the fix for Option 1's
     inflation risk); preserves B-8's Option 1/2 distinction in the same way Option 3 does, since it is still a
     page-view signal distinct from feedback submission.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire (the repository's own
   Phase-15 comment already frames this as an open decision).
10. **Selection:** `__________`

---

## 11. B-7 — PCG-4 numerator combination logic

(Unchanged governing source/evidence from the prior questionnaire's B-7; downstream-invalidation field added.)

1. **Decision ID:** B-7
2. **Severity:** HIGH
3. **Status:** PENDING
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (primary); `ENGINEERING DESIGN REQUIRED` (cost
   input).
8. **Options, each with downstream invalidation:**

   - **Option 1 — `feedback.useful = true` alone.**
     **Downstream invalidation:** none further downstream in this order, but leaves B-3's evaluator entirely
     unused by the one gate it was built for — an internal-consistency tension to flag back to B-3's sponsor,
     not an invalidation of any later decision point.

   - **Option 2 — evaluator match alone.**
     **Downstream invalidation:** none further downstream; symmetrically ignores the user's own judgment.

   - **Option 3 — conjunctive (AND).**
     **Downstream invalidation:** none further downstream; makes feedback-submission a de facto prerequisite,
     which is a product-adoption consideration outside this questionnaire's scope to assess, not a blocker
     invalidation.

   - **Option 4 — disjunctive (OR).**
     **Downstream invalidation:** none further downstream; risks PCG-4 inflation as already noted.
9. **Analyst observation — NOT A RECOMMENDATION:** the §4 verbatim-text observation from the facilitation record
   (PDEF-3's "useful outcome" text reads structurally closer to a conjunctive, per-opportunity AND) applies here
   again, unchanged, and remains an observation, not a selection.
10. **Selection:** `__________`

---

## 12. B-4 — Refund contract-test scope

(Unchanged governing source/evidence from the prior questionnaire's B-4; downstream-invalidation field added.)

1. **Decision ID:** B-4
2. **Severity:** MEDIUM
3. **Status:** PENDING
7. **Decision authority:** `ENGINEERING DESIGN REQUIRED`.
8. **Options, each with downstream invalidation:**

   - **Option — minimal scope.**
     **Downstream invalidation:** none further downstream; leaves Q-11/Q-12 behaviorally unverified, a
     pre-launch-qualification risk already noted, not a blocker-invalidation.

   - **Option — behavioral scope.**
     **Downstream invalidation:** its reversal-specific cases ((c)/(d) in the prior questionnaire) are only
     fully meaningful if B-6 selected Option 2 or 4; if B-6 selected Option 1 alone, this option's reversal
     cases cannot be written as specified and B-4 would need to be revisited, per B-6's own downstream note.

   - **Option — full scope.**
     **Downstream invalidation:** same B-6 dependency as behavioral scope, plus no further downstream effect
     beyond added engineering cost.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire.
10. **Selection:** `__________`

---

## 13. B-8 — PCG-6 population/completion logic

(Unchanged governing source/evidence from the prior questionnaire's B-8; downstream-invalidation field added.)

1. **Decision ID:** B-8
2. **Severity:** MEDIUM
3. **Status:** PENDING
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED` (primary); `ENGINEERING DESIGN REQUIRED` (cost
   input).
8. **Options, each with downstream invalidation:**

   - **Option 1 — reuse `actioned`/feedback count as numerator proxy.**
     **Downstream invalidation:** none further downstream (B-9 still receives a defined denominator/numerator to
     attach a floor to, whatever it is); explicitly conflates "actioned" with "reviewed," as already noted.

   - **Option 2 — numerator = B-1's new reviewed event.**
     **Downstream invalidation:** **only meaningfully distinct from Option 1 if B-1 selected Option 3 or 4** (a
     genuinely separate signal from feedback) — if B-1 selected Option 2 (feedback-submission-based), this
     option collapses into Option 1, per B-1's own downstream note above. This should be checked, not assumed,
     when B-8 is actually decided.

   - **Option 3 — three-part conjunctive check.**
     **Downstream invalidation:** feeds B-9 with the most complex population to apply any floor to; no later
     decision point is invalidated, but B-9's candidate options should be read with this complexity in mind.

   - **Option 4 — defer PCG-6 entirely until B-1 resolves.**
     **Downstream invalidation:** **effectively defers B-9 as well** — a sample floor cannot be meaningfully
     selected for a gate whose population/numerator is not yet defined. If this option is selected, B-9 should
     be marked deferred rather than independently decided.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire.
10. **Selection:** `__________`

---

## 14. B-9 — PCG-6 sample floor

(Unchanged governing source/evidence from the prior questionnaire's B-9; downstream-invalidation field added.)

1. **Decision ID:** B-9
2. **Severity:** LOW
3. **Status:** PENDING
7. **Decision authority:** `PRODUCT OWNER DECISION REQUIRED`.
8. **Options (all `ANALYST OPTION — NOT DECIDED`), each with downstream invalidation:**

   - **No floor at all.**
     **Downstream invalidation:** none — this is the terminal decision point in the order; nothing downstream
     depends on it.

   - **Extend Q-8's principle to PCG-6 explicitly, with a derived numeric value.**
     **Downstream invalidation:** none; contingent on first confirming PCG-6 has a named percentage threshold
     (not confirmed in any prior record), a precondition internal to this option, not an external invalidation.

   - **A fixed, round floor chosen independently of statistical derivation.**
     **Downstream invalidation:** none.

   - **Never mark PCG-6 NOT-YET-EVALUABLE; always report the raw percentage and denominator.**
     **Downstream invalidation:** none.
9. **Analyst observation — NOT A RECOMMENDATION:** unchanged from the prior questionnaire; none of the four
   options is preferred.
10. **Selection:** `__________`

---

## 15. Authorization boundary

Unchanged from both prior records: this questionnaire authorizes none of implementation, schema/migration
changes, test changes, instrumentation changes, validation execution, deployment, release, or launch. It does
not modify PDEF-2, PDEF-3, PDEF-4, the entitlement-stacking decision, `MVP_SCOPE_BOUNDARY.md`, any previously
decided instrumentation ED, or any of the three prior blocker records. Where an option above names a required
amendment (B-11a Option E) or a possible schema dependency (B-11c Options 2/3, B-5 Option 3, B-6 Options 2/4),
that dependency is recorded as a flag for the next governance step, not acted on here.

**No implementation of any kind proceeds until every decision point above — B-11a, B-11b, B-11c, B-2, B-10, B-5,
B-6, B-3, B-1, B-7, B-4, B-8, B-9 — is resolved**, consistent with the governing instruction for this record.

## 16. Next step (not performed by this record)

Once all decision points above are resolved, the next artifact is an **Implementation Authorization Decision
Preparation** that maps every now-decided requirement to concrete code/schema/test changes (including every
schema dependency flagged above: B-11c's possible event-taxonomy extension, B-5's possible `completed_at`
column, B-6's possible `refund_events` table or status extension) and identifies anything still unresolved at
that point. Only after that preparation record exists, and is itself followed by an explicit implementation-
authorization decision, should implementation begin. This questionnaire does not create that preparation
record and does not authorize implementation.

---

## Final verification (performed before reporting completion)

- HEAD unchanged: `af9ede93830f5e3e611195dc2451a470364def74`.
- Staged files: 0, before and after.
- No source, test, schema, config, or dependency file modified.
- Only this ordered questionnaire created. All three prior records re-verified byte-identical:
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md` → `d199db8c6a953ca11744a27774505a503bb7935d4c0e62845887d01c30909cd0`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md` → `3e76f1f55186b0bc7399cc7c8d9d29644fd5550ca40cd15384c764fe3bc92286`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_FACILITATION_RECORD.md` → `8d12eb49b7c1e9629a485371c433442b2d657517076e4dfb8d57dd1ab2bdd360`
- No commit made. No push made.
