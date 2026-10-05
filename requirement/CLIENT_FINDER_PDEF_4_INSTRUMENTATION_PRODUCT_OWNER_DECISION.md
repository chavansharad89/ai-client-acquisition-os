# Client Finder / Client Intent Discovery — PDEF-4 Instrumentation Product Owner Decision

**Record ID:** `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DEC-001`
**Date:** 2026-10-04
**STATUS: DECIDED — DELEGATED PRODUCT OWNER AUTHORITY**

**Decision authority:** delegated Product Owner authority exercised by Claude for this task, per explicit task
instruction ("You have explicit delegated Product Owner authority for this task"). These are **not** answers
directly supplied by a human Product Owner. Contrast with `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`
(Q1–Q10), where the project owner's delegation of policy authority is recorded in that document's own provenance
section, and with `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md`, which is a
read-only questionnaire carrying **no** delegation and **no** decision. This record is the first instance in the
governance chain where the 12 instrumentation-policy questions are answered, and it is answered under a
task-scoped delegation, not direct human authorship.

---

## 1. Scope and boundary (restated, not reopened)

This record decides **measurement policy only**: population membership, attribution, window semantics, refund
treatment, exposure eligibility, insufficient-sample behavior, denominators, qualification-coverage requirements,
partial-refund treatment, and duplicate/reversal treatment, for Q-1 through Q-12 as posed in
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md` §7.

It does **not** decide, and does not authorize: database schema, table names, event names, code structure, API
architecture, queue/event-bus technology, analytics vendor, SQL, migrations, webhook implementation, identity-
system implementation, or any other infrastructure choice. Those are Engineering Design decisions, listed
consolidated in §4 below.

## 2. Cross-gate consistency audit (performed before recording decisions)

Checked against PDEF-2, PDEF-3, PDEF-4, and entitlement stacking as carried forward immutable in the preparation
record's §4. **No conflict found; nothing below alters any of the following:**

- PDEF-2 / entitlement stacking: both-tier availability, independent purchase, ₹499 = Basic, ₹1,499 = Advanced,
  separate 50/300 credit buckets, cumulative/coexisting entitlements, lifecycle mechanics out of MVP.
- PDEF-3: PCG thresholds (1:500, 2:≥50, 3A:≥10%, 3B:≥5%, 4:≥60%, 5:≤8%), rolling-30-day default, Client-Finder-
  specific population, combined-primary measurement with per-tier diagnostics, the verbatim "qualified visitor"
  and "useful outcome" definitions.
- PDEF-4: PCG-1/2/3A/3B as hard launch blockers, PCG-4/5/6 as monitoring-only, insufficient sample ⇒ NOT YET
  EVALUABLE (PCG-1/2 only, as explicitly decided there), per-tier diagnostics cannot independently block launch,
  blocker-gate instrumentation requires independent validation before launch-qualification use.

Every decision below was checked for whether it would create a new launch gate, alter a decided threshold, or
contradict another gate's treatment of the same underlying fact (chiefly: refund treatment across PCG-2, PCG-3A/
3B, and PCG-5). **No such conflict was found or introduced.** Internal cross-reference: Q-4, Q-7, and Q-12 share
one consistent principle (see §3, "cross-cutting refund principle") deliberately, so that the same underlying
transaction is never simultaneously a counted conversion and an excluded one without an explicit, stated reason.

## 3. Cross-cutting refund principle (applies to Q-4, Q-7, Q-11, Q-12)

Decided once, applied consistently: **a transaction is counted at the moment it occurs, for whichever rolling
window it falls into; once a window closes, its evaluation is immutable.** A later refund does not retroactively
remove the transaction from a count-based or conversion-based gate (PCG-1/2/3A/3B); instead, the refund is
captured **separately and exclusively** by PCG-5, the dedicated refund-rate monitoring gate. This mirrors
PDEF-4 §6.6's existing immutability principle for PCG-5 itself, extended by explicit decision (not by silent
analogy) to the other gates that share the same underlying "did a purchase occur in this window" fact pattern.
Rationale: it is the only treatment under which the same transaction is never simultaneously "a successful durable
conversion" (for PCG-2/3A/3B) and "a non-conversion" (if excluded) without contradicting PCG-5's independent,
dedicated measurement of the same refund — PCG-5 exists precisely so refund quality is monitored without having to
destabilize already-closed launch-blocker evaluations.

---

## 4. Decisions

### Q-1 [PCG1-ELIG] — PCG-1 minimum eligibility criteria

1. **Decision:** Option B. No additional eligibility criterion applies beyond funnel entry + demonstrated intent;
   condition (3) of the "qualified visitor" definition is satisfied by definition once conditions (1) and (2) are
   met.
2. **Exact operational rule:** A visitor is "eligible" for PCG-1 purposes if and only if they satisfy conditions
   (1) funnel entry and (2) demonstrated intent, as already defined in PDEF-3's "qualified visitor" definition. No
   separate eligibility gate (account status, geography, device type, purchase history) is imposed.
3. **Rationale:** No governing record or existing code names a candidate eligibility criterion; inventing one now
   would add an unbuilt, unverifiable gate to a hard launch blocker's count for no stated business reason. The
   simplest rule that is faithful to PDEF-3's three-part structure is that the third condition is automatically
   satisfied once the first two are met.
4. **Instrumentation implication:** No new eligibility-check mechanism is required. PCG-1's count reduces to
   counting visitors who meet conditions (1) and (2) only.
5. **Edge cases:** None introduced — this decision removes a potential edge case (an undefined eligibility
   check) rather than creating one.
6. **Interaction with other PCGs:** None — PCG-1 remains the sole gate using this definition's eligibility clause.
7. **Engineering design still required:** Yes — the funnel-entry and demonstrated-intent events themselves still
   require a durable, server-side event store (preparation record §21 item 1), unaffected by this decision.

---

### Q-2 [PCG1-ATTR] — PCG-1 aggregate vs. per-funnel-entry-path attribution

1. **Decision:** Option A. One aggregate PCG-1 count, shared across both tiers' launch eligibility.
2. **Exact operational rule:** PCG-1's 500-qualified-visitor count is computed once, across all funnel-entry
   paths (₹99→₹499-oriented entry and ₹1,499-direct entry combined), consistent with PDEF-4 §6.4's literal
   "shared" wording. A visitor qualifies once per the Q-1 rule regardless of which tier they eventually purchase
   or whether they purchase at all.
3. **Rationale:** This is the only option consistent with the task's binding instruction to preserve PDEF-4's
   existing combined-primary rule and not create a new launch gate. Per-path counts (Option B) would effectively
   create two new launch-blocker gates where PDEF-4 defined one.
4. **Instrumentation implication:** A single visitor-qualification counter suffices; no per-path tagging is
   required for PCG-1 itself (though exposure-path tagging may still be needed for other gates — see Q-5/Q-6).
5. **Edge cases:** A visitor who enters via one path and later re-enters via the other is still counted once
   (deduplication is an engineering concern per preparation record §21 item 3, not reopened here).
6. **Interaction with other PCGs:** Consistent with PDEF-4 §6.4 (independent per-tier launch, shared PCG-1) and
   with the combined-primary structure already governing PCG-2/4/5/6.
7. **Engineering design still required:** Yes — visitor deduplication and the funnel-entry event store
   (preparation record §21 items 1, 3) remain engineering work, unaffected by this decision.

---

### Q-3 [PCG2-WIN] — PCG-2 measurement-window start-point event

1. **Decision:** Option A. Anchor the window to payment-capture timestamp.
2. **Exact operational rule:** A buyer's 30-day PCG-2 window begins at the moment the payment transitions to a
   captured/successful state (not at order creation, and not at activation).
3. **Rationale:** Consistent with PCG-5's already-decided "from purchase" anchor (PDEF-4 §6.6) — using the same
   underlying event (payment capture) for both gates avoids introducing two different definitions of "when a
   purchase happened" into the same instrumentation layer.
4. **Instrumentation implication:** PCG-2's window-anchoring event is the same payment-capture event PCG-5 already
   requires; no separate anchor event needs to be built for PCG-2 specifically.
5. **Edge cases:** An order created but never paid never anchors a window (it never becomes a "buyer"). A payment
   captured then later refunded still anchors its window — see Q-4.
6. **Interaction with other PCGs:** Deliberately aligned with PCG-5's anchor to keep "purchase" a single concept
   across gates. Does not alter PCG-3A/3B's exposure-side window (Q-6), which anchors to a different event.
7. **Engineering design still required:** Yes — the payment-capture event source and the rolling-window
   aggregation layer (preparation record §21 item 6) remain engineering work.

---

### Q-4 [PCG2-REFUND] — Refunded purchase and PCG-2's buyer count

1. **Decision:** Option A, per the cross-cutting refund principle (§3).
2. **Exact operational rule:** A refunded buyer still counts toward PCG-2 for whichever window their
   payment-capture event fell in. PCG-2 evaluations are immutable once a window closes; a later refund does not
   retroactively reduce a closed window's buyer count.
3. **Rationale:** See §3. This also avoids the destabilization risk the preparation record flagged (a launch
   decision already made on a cleared PCG-2 evaluation being thrown into question by a later refund).
4. **Instrumentation implication:** PCG-2's buyer count is a pure count of captured payments per window; refund
   state is not read when computing PCG-2.
5. **Edge cases:** A payment captured and refunded within the same still-open window still counts once it closes,
   per the immutable-at-close rule; it is never double-counted or removed.
6. **Interaction with other PCGs:** Explicitly does not contradict PCG-5 — PCG-5 independently and separately
   measures the refund itself as its own rate; PCG-2 measures gross buyer volume. The same transaction
   legitimately contributes to both, each gate measuring a different fact about it.
7. **Engineering design still required:** Yes — the refund-webhook handler (preparation record §21 item 5)
   remains required for PCG-5 regardless of this decision; PCG-2 itself needs no refund-state read.

---

### Q-5 [PCG3AB-POP] — PCG-3A/3B "eligible exposed population" boundary

1. **Decision:** A merged, explicit rule (Option C) combining impression and named-step specificity, to satisfy
   the "no unobservable definition" constraint.
2. **Exact operational rule:** "Exposed," for a given tier, means the user's client rendered that tier's specific
   offer-presentation step at least once — i.e., an impression of the named per-tier offer screen, not a mere
   site visit, not mere purchase/behavioral eligibility to see the offer, and not a click on the offer. For
   PCG-3A, the authoritative exposure event is the ₹499 upsell screen rendering to an eligible ₹99 purchaser. For
   PCG-3B, the authoritative exposure event is the ₹1,499 offer screen rendering to an eligible user (independent
   of ₹499 ownership, per PDEF-2). Both are impression-based (the offer was shown), not engagement-based (the
   offer was clicked) and not merely eligibility-based (the user qualified to be shown the offer but may not have
   been).
3. **Rationale:** "Merely visiting the website" and "merely eligible" are rejected as unobservable/too broad —
   they do not establish the user actually encountered the offer. "Completing an offer-view event" (i.e.,
   requiring a click or completed interaction) is rejected as too narrow — it would make PCG-3A/3B's denominator
   indistinguishable from a sub-portion of its own numerator-adjacent behavior, and PDEF-3's "exposed to the
   offer" wording does not require engagement, only exposure. An impression of the specific named per-tier screen
   is the narrowest definition that is still observably distinct from both eligibility and engagement.
4. **Instrumentation implication:** Requires a durable, server-side offer-exposure event log scoped per-tier (one
   event type/record per offer screen actually rendered), as already flagged ENGINEERING DESIGN REQUIRED in the
   preparation record (§21 item 4). This decision fixes *which* conceptual event that log must capture; it does
   not design the log.
5. **Edge cases:** A user shown the offer screen multiple times is exposed once for membership purposes (first
   exposure controls attribution — see Q-6); a user who qualifies for the offer but whose client never renders it
   (e.g., due to a client-side error) is not counted as exposed.
6. **Interaction with other PCGs:** Independent of PCG-1/2's definitions; does not alter PDEF-2's independent-
   purchase rule (PCG-3B's population remains independent of ₹499 ownership, per the Completion Decision).
7. **Engineering design still required:** Yes — the exposure-event log itself (preparation record §21 item 4).

---

### Q-6 [PCG3AB-WIN] — PCG-3A/3B exposure-window start point

1. **Decision:** Option A, with first-exposure controlling attribution.
2. **Exact operational rule:** The 30-day window for a given user's PCG-3A/3B conversion-rate membership starts
   at the moment of their **first** exposure to the tier-specific offer (as defined in Q-5), not at the moment of
   the prior qualifying purchase, and not at a later/repeat exposure.
3. **Rationale:** The task instruction explicitly prefers deterministic first-eligible-exposure attribution absent
   strong contrary evidence; no such contrary evidence exists in the governing records. First-exposure attribution
   also prevents double counting a user who is shown the offer more than once from contributing to multiple
   overlapping windows.
4. **Instrumentation implication:** The exposure-event log (Q-5) must retain, per user per tier, the timestamp of
   the first exposure specifically (not merely the most recent), since that is the authoritative window anchor.
5. **Edge cases:** A user exposed once, then exposed again inside the same still-open window, has only one
   window — anchored to the first exposure; the second exposure does not open a second, overlapping window.
6. **Interaction with other PCGs:** Distinct from Q-3's PCG-2 anchor (payment-capture); this question concerns the
   denominator (exposure) side of a different pair of gates and is not required to use the same anchor event.
7. **Engineering design still required:** Yes — same exposure-event log as Q-5, plus the rolling-window
   aggregation layer (preparation record §21 item 6).

---

### Q-7 [PCG3AB-REFUND] — Refund treatment in PCG-3A/3B's numerator/denominator

1. **Decision:** Option A, per the cross-cutting refund principle (§3).
2. **Exact operational rule:** A later-refunded ₹99, ₹499, or ₹1,499 purchase still counts in PCG-3A's or
   PCG-3B's numerator and denominator for whichever window it fell in (as a converting purchase, and — for
   PCG-3A's "eligible ₹99 purchaser" denominator condition — as a qualifying prior purchase). Evaluations are
   immutable once the window closes.
3. **Rationale:** See §3. This is also the only option that keeps Q-4 (PCG-2) and Q-7 (PCG-3A/3B) internally
   consistent: both gates treat "a purchase occurred" as a fact fixed at the moment of payment capture, with
   refund quality tracked exclusively and separately by PCG-5.
4. **Instrumentation implication:** PCG-3A/3B's conversion computation does not read refund state; refund state is
   relevant only to PCG-5.
5. **Edge cases:** A ₹99 purchase later refunded still counts as the qualifying prior purchase for a PCG-3A
   denominator member, and a resulting ₹499 purchase (if any) still counts as a conversion even if either leg is
   later refunded, for whichever window each fell in.
6. **Interaction with other PCGs:** Explicitly consistent with Q-4's treatment of PCG-2 and with PDEF-4 §6.6's
   existing treatment of PCG-5; no gate is left contradicting another on the same underlying transaction.
7. **Engineering design still required:** Yes — the refund-webhook handler (preparation record §21 item 5) is
   required for PCG-5 regardless; PCG-3A/3B themselves need no refund-state read.

---

### Q-8 [SAMPLE-FLOOR] — Insufficient-sample floor for PCG-3A/3B/4/5

1. **Decision:** Option A in principle, with the specific numeric floor explicitly deferred (not decided here).
2. **Exact operational rule:** The NOT YET EVALUABLE treatment PDEF-4 §6.5 already applies to PCG-1/2 is extended,
   as a matter of principle, to the rate-based gates: PCG-3A and PCG-3B (hard blockers) and PCG-4 and PCG-5
   (monitoring gates) each require a minimum denominator before their percentage result may be used — as a launch-
   qualification input for PCG-3A/3B, or as a monitoring input for PCG-4/5. **The specific minimum-denominator
   value for each of the four gates is NOT decided by this record** and remains PENDING a separate, explicit
   Product Owner numeric-floor decision. Until that separate decision is made, any of the four rate-based gates
   with a denominator below what a reasonable person would consider statistically usable (left undefined
   numerically here) must be reported as NOT YET EVALUABLE rather than as a pass or fail.
3. **Rationale:** The task instruction explicitly directs that a numeric floor not be invented without
   justification, and that if one cannot be responsibly set now, the gate should be left explicitly unevaluable
   with the numeric floor deferred to a separate decision. Deciding the *principle* (a floor exists, and absence
   of it is never silently treated as failure) without inventing the *number* satisfies both the instruction and
   the fail-closed design goal: a rate-based blocker gate can never be used to approve a launch off a
   statistically meaningless denominator, even before the exact number is fixed.
4. **Instrumentation implication:** Engineering must build denominator-size reporting alongside each rate-based
   gate's percentage, so that a future numeric-floor decision can be applied without re-architecting the
   computation. No numeric threshold is coded against yet.
5. **Edge cases:** Until the numeric floor is separately decided, any rate-based gate evaluation must carry its
   raw denominator alongside the percentage, so a human/Product-Owner reviewer can judge sufficiency manually in
   the interim.
6. **Interaction with other PCGs:** Does not alter PCG-1/2's already-decided absolute-count floors (500, 50); this
   decision only extends the *principle* of an evaluability floor to the four rate-based gates, consistent with,
   not contradicting, §6.5.
7. **Engineering design still required:** Yes — denominator-size reporting; the numeric floor itself requires a
   separate Product Owner decision, not an engineering one, before it can be enforced.

---

### Q-9 [PCG4-DENOM] — PCG-4's exact denominator population boundary

1. **Decision:** Option B. Denominator = users who performed at least one Client-Finder search/activation in the
   window.
2. **Exact operational rule:** PCG-4's ≥60% "useful outcome" rate is computed against the population of ₹499/
   ₹1,499 holders who performed at least one Client-Finder search or activation within the rolling 30-day window,
   not against all current entitlement holders regardless of use.
3. **Rationale:** A holder who never used the product had no opportunity to produce a "useful outcome" in the
   PDEF-3 sense; including them in the denominator would not make the gate harder in a meaningful way — it would
   conflate "product unused" with "product failed," diluting the monitoring signal's validity rather than making
   the gate rigorous. Restricting the denominator to users who had actual opportunity (at least one search/
   activation) is the population PDEF-3's "useful outcome" definition is actually describing an outcome *for*.
4. **Instrumentation implication:** Requires a Client-Finder "activation"/search event (already flagged
   ENGINEERING DESIGN REQUIRED, preparation record §21 item 7) to identify denominator membership, in addition to
   the numerator's existing `feedback.useful`/qualification-rule evaluation.
5. **Edge cases:** A holder who activates on day 29 of a 30-day window and has not yet received an outcome by
   window close is still in the denominator for that window (opportunity existed; outcome did not occur) —
   consistent with treating PCG-4 as monitoring-only, where this edge case affects a non-blocking signal, not a
   launch decision.
6. **Interaction with other PCGs:** Independent of PCG-1/2/3A/3B; PCG-4 remains monitoring-only per PDEF-4 §6.3,
   unaffected by this denominator choice.
7. **Engineering design still required:** Yes — the activation/search event itself (preparation record §21
   item 7).

---

### Q-10 [PCG4-COVERAGE] — Whether existing qualification logic covers "useful outcome"

1. **Decision:** Option A. Conditional acceptance pending engineering review.
2. **Exact operational rule:** `core-qualification`'s existing rule logic is accepted as the operative test for
   "useful outcome" condition (b) **if and only if** a subsequent, explicitly authorized engineering review
   confirms it is logically equivalent to PDEF-3's three named sub-parts (requested service, target customer
   characteristics, minimum project-value requirements). If the review finds any divergence, new, Client-Finder-
   specific logic must be written for condition (b); `core-qualification`'s existing logic may not be used as-is
   in that case.
3. **Rationale:** This decision does not redefine "useful outcome" (not reopened) and does not itself perform or
   presume the outcome of a code-level equivalence review it is not authorized to perform. It commits in advance
   to the policy consequence of either review outcome, so the review, once done, requires no further Product
   Owner round-trip.
4. **Instrumentation implication:** PCG-4's numerator computation cannot be finalized as "done" until the
   equivalence review (or new-logic authorship, if divergence is found) is complete; until then, PCG-4's
   numerator is provisional per the preparation record's own classification of this item as having a policy
   dimension contingent on an engineering finding.
5. **Edge cases:** A partial-equivalence finding (logic matches two of three sub-parts) is **not** treated as
   sufficient — "logically equivalent to all three named sub-parts" is binary; any divergence triggers the
   new-logic branch.
6. **Interaction with other PCGs:** None — confined to PCG-4's numerator construction.
7. **Engineering design still required:** Yes, explicitly and primarily — the equivalence review itself
   (preparation record §10 row 5) is the next step, not authorized by this record.

---

### Q-11 [PCG5-PARTIAL] — PCG-5 partial-vs-full refund treatment

1. **Decision:** Option A. A partial refund counts the same as a full refund (binary).
2. **Exact operational rule:** PCG-5's refund rate is **transaction-based**: the numerator is the count of
   transactions within the window that have received any refund amount greater than zero (full or partial,
   counted identically as one refund-event each); the denominator is the count of all transactions in the window.
   Fractional/revenue-weighting (Option B) is not used.
3. **Rationale:** A transaction-based, binary-any-refund-counts rule is the most deterministic and auditable of
   the three options — it requires no weighting computation and cannot silently understate refund incidence the
   way excluding partials (Option C) would. For a monitoring-only gate whose purpose is to surface refund-quality
   problems (not to measure exact revenue impact, which `MVP_SCOPE_BOUNDARY.md` §6.7 places out of scope as
   "revenue optimization"/"advanced attribution"), counting incidence rather than magnitude is the correct level
   of precision.
4. **Instrumentation implication:** PCG-5's computation needs only a boolean "was this transaction refunded at
   all, in any amount, within its window" per transaction — no refund-amount-weighted aggregation is required,
   simplifying the required refund-webhook handler's output to a boolean flag plus timestamp.
5. **Edge cases:** A transaction refunded twice (e.g., two partial refunds against one order) still counts once
   in the numerator — see Q-12 for the governing duplicate-handling principle.
6. **Interaction with other PCGs:** Confined to PCG-5; does not alter PCG-2/3A/3B's non-refund-reading
   computations decided in Q-4/Q-7.
7. **Engineering design still required:** Yes — the refund-webhook handler and refund table (preparation record
   §21 item 5), now scoped to a simpler boolean-per-transaction requirement by this decision.

---

### Q-12 [PCG5-DUPREV] — PCG-5 duplicate/refund-reversal treatment

1. **Decision:** Option A. Reversal removes the refund-event from the numerator only while the window remains
   open; once closed, immutable.
2. **Exact operational rule:** The policy requires **economic finality**: PCG-5's numerator reflects the net
   economic state of a transaction (refunded or not) at the moment its window closes, not a raw count of refund
   webhook deliveries. If a refund is reversed, disputed-and-reversed, or found to be a duplicate notification for
   the same underlying refund, the transaction is corrected back to "not refunded" for numerator purposes **only
   if** this is known before that transaction's window closes. Once a window closes, its PCG-5 evaluation is
   immutable (consistent with PDEF-4 §6.6), and a later reversal does not reopen it. A duplicate delivery of the
   same underlying refund event must never be counted as two refund-events against one transaction (one
   transaction contributes at most one numerator unit, per Q-11).
3. **Rationale:** "Economic finality, not raw webhook-event counting," is the task's own stated requirement; this
   rule implements it directly while keeping the same immutable-at-close principle used everywhere else in this
   record (§3), so PCG-5's treatment of a correction is symmetric with how PCG-2/3A/3B treat an original refund —
   both are only ever applied within the still-open window, never retroactively into a closed one.
4. **Instrumentation implication:** Idempotent refund-event recording (so redelivered webhooks do not double-
   count) is required, but this record decides only the policy outcome once duplicates are prevented, not the
   idempotency mechanism itself (e.g., an idempotency key) — that remains engineering design.
5. **Edge cases:** A refund reversed the day after its window closes is not retroactively removed from that
   closed window's numerator; it would, if it represented a new economically final state, be reflected only in
   whatever window is open at the time the reversal becomes known, if applicable to a new transaction — not by
   reopening the old evaluation.
6. **Interaction with other PCGs:** Consistent with the §3 cross-cutting principle; does not alter PCG-2/3A/3B,
   which do not read refund state at all (Q-4, Q-7).
7. **Engineering design still required:** Yes — the idempotency mechanism for refund-event recording (preparation
   record §21 item 5) remains engineering design, explicitly not answered here.

---

## 5. Engineering Design Required

Consolidated list of implementation questions that remain open after this policy record. **None of these is
answered here; they are listed only as pointers for a separate, later, explicitly authorized engineering-design
task:**

1. A durable, server-side, timestamped funnel/visitor event store (for Q-1, Q-2).
2. An anonymous-visitor-to-authenticated-user identity linkage mechanism.
3. A bot/internal-traffic exclusion and visitor-deduplication mechanism (for Q-2, Q-6 first-exposure tracking).
4. A durable, per-tier offer-exposure event log capturing first-exposure timestamp (for Q-5, Q-6).
5. A refund webhook handler, refund table, idempotent refund-event recording, and auto-revoke-on-refund wiring
   (for Q-4, Q-7, Q-11, Q-12).
6. A rolling-30-day (and first-activation-based) time-windowed query/aggregation layer, including per-gate
   denominator-size reporting (for Q-3, Q-6, Q-8).
7. A Client-Finder "activation"/search event, correctly scoped (for Q-9).
8. The `core-qualification`/`feedback.useful` logical-equivalence review against PDEF-3's "useful outcome"
   condition (b) (for Q-10) — this is the one item that is itself a precondition for finalizing a policy decision's
   practical effect, not merely an implementation of an already-fixed policy.
9. An independent-validation process/method for the four blocker gates (PCG-1/2/3A/3B), per PDEF-4 §6.10 —
   unaffected by, and not a precondition to, this record.
10. The specific numeric minimum-denominator floor(s) for PCG-3A/3B/4/5, deferred by Q-8 to a **separate Product
    Owner decision** (not an engineering decision, but explicitly not decided here).

## 6. Authorization boundary

This decision record does **NOT** authorize, and nothing in §4 should be read as authorizing: instrumentation
implementation; schema or migration changes; analytics implementation; billing changes; credit-ledger changes;
webhook implementation; validation execution; deployment; release; production traffic; or launch.

It establishes measurement policy only, as a precondition for a separate, later, explicitly authorized
engineering-design task (per §5) and, after that, independent validation of the four blocker gates (per PDEF-4
§6.10) before any launch-qualification use.

It does not modify, reopen, or alter `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`,
`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`,
`PROJECT_MASTER_CHECKLIST.md`, `MVP_SCOPE_BOUNDARY.md`, or any code, test, schema, migration, configuration, or
dependency file. It is not committed or pushed.

## 7. Provenance statement

These twelve decisions (Q-1 through Q-12) were made under **delegated Product Owner authority exercised by
Claude for this specific task**, as explicitly granted in the task instruction that produced this record. They
are not, and must not be represented as, answers directly supplied by a human Product Owner. Any future record
that treats these as human-supplied should be corrected to cite this record's actual provenance.
