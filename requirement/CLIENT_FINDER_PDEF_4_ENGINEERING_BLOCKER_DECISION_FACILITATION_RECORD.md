# Client Finder / Client Intent Discovery — PDEF-4 Engineering Blocker Decision Facilitation Record

**Record ID:** `CLIENT-FINDER-PDEF-4-ENGINEERING-BLOCKER-DECISION-FACILITATION-001`
**Date:** 2026-10-05
**Type:** Facilitation/continuation record. Synthesizes the two existing blocker records below into a single
decision-order and conflict map. **This record creates, implies, infers, or authorizes no engineering decision,
no Product Owner decision, no implementation, no test change, no schema/migration change, no
configuration/dependency change, no validation execution, and no deployment/release/launch action of any kind.**

**Disposition on the existing preparation record:** `requirement/CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md`
does not require correction or extension — its repository evidence was re-checked against the current `HEAD`
(unchanged, see §6) and nothing in it is stale. Per instruction, this is therefore a **distinct continuation
record**, not an edit to that file or to `requirement/CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md`
(also unmodified). Both are read-only inputs here.

**Records read, in the requested order:**

| # | Record | Status at read time |
|---|---|---|
| 1 | `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md` | Exists; unchanged; B-1..B-11 PENDING |
| 2 | `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md` | Exists; unchanged; B-1..B-11 PENDING |
| 3 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md` | Exists; ED-1..ED-13 DECIDED, not reopened |
| 4 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` | Exists; Q-1..Q-12, PO-D1, PO-D2 DECIDED, not reopened |
| 5 | `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | Exists; PCG-1..6 definitions DECIDED, not reopened |
| 6 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md` | Exists; the primary input to record #1; re-read in full for this facilitation pass |
| 7 | `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION.md` | **Does not exist in the repository.** See §3, Conflict C-1. |
| 8 | PDEF-2/PDEF-3/MVP-scope records | `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`, `MVP_SCOPE_BOUNDARY.md` — read for the verbatim text in §4 below |

No file was altered. No governing decision listed above is reopened by this record.

---

## 1. B-1 through B-11 status

All eleven blockers remain exactly as recorded in `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md`
§3/§6: **`PENDING`** in every case, with no selection present in any blank field. This facilitation pass did not
find grounds to change any blocker's status, severity, or option set — the repository `HEAD` has not moved since
either prior record was written (`af9ede93830f5e3e611195dc2451a470364def74`, confirmed in §6), so no new evidence
exists to re-evaluate against.

| Blocker | Severity | Status | Authority |
|---|---|---|---|
| B-1 — Opportunity Reviewed event | HIGH | PENDING | PO + Engineering (joint) |
| B-2 — Independent validation ownership | HIGH | PENDING | PO + Engineering (joint) |
| B-3 — Qualification-equivalence evaluator contract | HIGH | PENDING | Engineering (PO on failure-behavior only) |
| B-4 — Refund contract-test scope | MEDIUM | PENDING | Engineering |
| B-5 — Activation timestamp source | MEDIUM | PENDING | Engineering |
| B-6 — Refund storage shape | HIGH | PENDING | Engineering + PO sign-off |
| B-7 — PCG-4 numerator combination logic | HIGH | PENDING | PO (primary) |
| B-8 — PCG-6 population/completion logic | MEDIUM | PENDING | PO (primary) |
| B-9 — PCG-6 sample floor | LOW | PENDING | PO |
| B-10 — Visitor identity primitive | HIGH | PENDING | Engineering (PO on privacy only) |
| B-11 — PCG-1 trust-boundary dependency | CRITICAL | PENDING | PO + Engineering (joint) |

Full governing source, repository evidence, options, tradeoffs, dependencies, and analyst observations for each
blocker are already recorded in the questionnaire (record #2 above) and are not duplicated verbatim here to
avoid creating a second, divergence-prone copy. §4 below adds only what that record did not already state
explicitly enough — the B-11 lettered-option mapping and the verbatim PDEF-3 text B-7/B-8 trace to.

## 2. Newly discovered blockers

**None.** Independent re-inspection for this facilitation pass covered the same surfaces the prior two records
already covered (events.ts, webhookHandler.ts/webhookRetention.ts, core-qualification, core-search/pgRepository,
core-opportunity/service.ts, the Prisma schema and migrations, and the Client-Finder UI routes) plus, newly for
this pass, a full re-read of `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_IMPLEMENTATION_AUTHORIZATION_PREPARATION.md`
§5–§7 (the gate computation contract and its own "Unresolved blockers" list). That re-read surfaced one item
worth flagging explicitly rather than treating as a silent restatement of B-11:

> §5, PCG-1: "rolling 30 days from each qualifying visitor's qualifying event; **exact anchor event (funnel-entry
> vs. demonstrated-intent moment) is `ENGINEERING DESIGN REQUIRED`** — not fixed by Q-1/Q-2 at the field level."

This is a narrower, separate question from B-11 — B-11 asks *whether the event type itself can be trusted*;
this is *which of two already-trusted-or-not event types anchors the rolling window*. It is a real sub-question
but does not rise to a standalone blocker: it is a parameter of whichever option is selected for B-11 (Options
B/C/D below name a server-observable or server-issued event as the anchor candidate; Option A/E leave the
existing funnel taxonomy's two event types as the only candidates). It is recorded here as a dependency of B-11
(§3 dependency table), not manufactured as B-12, consistent with the instruction not to create blockers merely
for completeness.

## 3. Critical conflicts

**C-1 — Referenced record does not exist.** The input list for this task names
`requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION.md` as item 7. No file by that exact name exists in
`requirement/`. The closest matches are `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` (a
preparation record, already superseded by the decided `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`
and `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`, both already read as items 3–4) and
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md` itself. This facilitation record does not guess
which was intended and does not fabricate the missing file; it proceeds on the two decision records that do
exist (items 3–4), which already supersede the preparation-stage content the missing filename would plausibly
have pointed to.

**C-2 — PCG-1's qualifying signal vs. this codebase's own trust principle (B-11, restated as a conflict, not a
new finding).** `apps/web/src/analytics/events.ts`'s header comment states browser-emitted events are not to be
trusted for anything downstream ("nothing downstream depends on them being truthful"). `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`
designates PCG-1 (500 qualified visitors) a **hard launch blocker**, and Q-1 (`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_PRODUCT_OWNER_DECISION.md`)
defines its qualifying condition as funnel-entry + demonstrated intent — currently only representable by the
browser-emitted event taxonomy. This is a genuine, unresolved tension between two already-decided records (the
architectural trust principle in code, and the launch-criteria decision), neither of which this record alters.
It is restated as a conflict here, not merely an open question, because — unlike B-1 through B-10, which are
each missing an operational mapping for an already-settled policy — B-11 is the one blocker where two existing,
decided artifacts (code-documented principle vs. governing decision record) point in different directions
without anything in the governance chain reconciling them.

**Architecture options under consideration for B-11 (lettered per this task's framing):**

| Option | Description | Maps to questionnaire's B-11 option | PDEF-4 amendment required? |
|---|---|---|---|
| A | Accept browser events as sufficient evidence despite their untrusted nature. | Option 1 | No |
| B | Make funnel-entry server-observable. | Option 2 | No (implementation-only, if feasible) |
| C | Use a server-issued/server-authoritative funnel event. | Option 3 | No (implementation-only, if feasible) |
| D | Hybrid — browser events assist UX/diagnostics; launch-gating evidence comes from server-authoritative events. | Option 4 | No |
| E | Amend PDEF-4 so PCG-1 is no longer a hard launch blocker. | Option 5 | **Yes — explicit Product Owner amendment to `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` required; this record does not make that amendment.** |

No option above is selected. If the evidence available to Engineering shows that B/C/D are infeasible within
the current architecture, that finding would itself become a dependency flag for Option E — not a default
fallback automatically adopted. This record does not make that determination; it is Engineering's finding to
report if and when it occurs.

## 4. Verbatim grounding added in this pass (PDEF-3, not reopened)

B-7 and B-8 in the questionnaire trace to PDEF-3's "useful outcome" and "completion" text without quoting it
verbatim (by design, to avoid restating a non-reopened record). For this facilitation pass, the exact text was
re-read in `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` and is reproduced here only to prevent B-7's four
numerator options from being evaluated against an under-specified paraphrase:

> §9: "A user achieves a useful outcome when the Client Finder produces at least one qualified opportunity
> **that the user considers actionable and that satisfies the user's configured target criteria**, including the
> requested service, target customer characteristics, and minimum project-value requirements."
>
> §11: "A user completes the Client Finder workflow when they complete the required workflow from defining or
> confirming their targeting criteria through receiving at least one qualified opportunity and reaching the
> product-defined opportunity review/action step."

This is noted as an **analyst observation, not a recommendation**: the "useful outcome" text's own grammar
("that the user considers actionable **and** that satisfies...") describes a single qualifying opportunity
carrying both properties simultaneously, which reads structurally closer to B-7's Option 3 (conjunctive) than to
Options 1, 2, or 4 — but it does not specify whether "considers actionable" is operationally `feedback.useful`
or something else, nor whether the AND is evaluated per-opportunity (any one opportunity satisfying both) or
across the holder's full set of opportunities (different opportunities separately satisfying each half). Both
readings remain open implementation questions; this observation narrows, but does not resolve, B-7, and no
selection is made.

## 5. Dependencies between blockers

```
B-11 (trust boundary)         — independent; gates which event types are even eligible to anchor PCG-1/PCG-6 timing
B-2  (validation ownership)   — independent; gates launch-qualification *use* of PCG-1/2/3A/3B, not their construction
B-10 (visitor identity)       — independent; feeds correctness of W-1/W-3/W-5/W-8 and interacts with B-11 options B/C/D
B-5  (activation timestamp)   — independent; feeds → B-1, B-7 (window anchor), B-8
B-6  (refund storage shape)   — independent; feeds → B-4 (test scope cannot finalize until shape is chosen)
B-3  (qualification evaluator)— independent; feeds → B-7 (numerator cannot finalize until evaluator contract exists)
B-1  (reviewed event)         — depends on a durable event store (ED-1, decided); feeds → B-8, B-9
B-7  (PCG-4 numerator logic)  — depends on B-3; informed by §4's verbatim-text observation
B-4  (refund test scope)      — depends on B-6; coupled to, not merely sequential after, W-6 implementation
B-8  (PCG-6 population/logic) — depends on B-1, B-5
B-9  (PCG-6 sample floor)     — depends on B-8
```

## 6. Recommended decision order

Ordering follows the dependency graph in §5 plus severity (CRITICAL/HIGH resolved before MEDIUM/LOW where no
dependency forces otherwise). This is a sequencing **recommendation for who should decide what first**, not a
selection of any blocker's content — no blank field is filled by this record.

1. **B-11** (CRITICAL, independent) — resolving the trust-boundary architecture determines what kind of event
   B-5/B-1/B-8 can even anchor on, and determines whether Option E's PDEF-4 amendment path must be opened.
2. **B-2** (HIGH, independent) — resolving who validates can proceed in parallel with B-11 (no shared
   dependency), but should not trail far behind it, since both gate launch-qualification readiness independent
   of implementation sequencing.
3. **B-10** (HIGH, independent) — should follow directly from B-11 if Option B/C/D is chosen (a server-observable
   or server-issued event may itself resolve or reshape B-10's identity-primitive question); should be decided
   before B-1/B-5/B-8 since it affects how any new event's identity field is populated.
4. **B-5** (MEDIUM) and **B-6** (HIGH) — both independent of each other and of B-11/B-2/B-10; can be decided in
   parallel once a decision-maker is available, since each only feeds its own downstream chain (B-5 → B-1/B-7/B-8;
   B-6 → B-4).
5. **B-3** (HIGH) — independent; should be decided before B-7 since B-7 cannot be finalized without it.
6. **B-1** (HIGH) — depends on B-5; should be decided before B-8/B-9.
7. **B-7** (HIGH) — depends on B-3; benefits from the §4 verbatim-text observation being read first.
8. **B-4** (MEDIUM) — depends on B-6; the test-case menu can be discussed once B-6 is decided, even though actual
   test-writing (not authorized here) is coupled to W-6.
9. **B-8** (MEDIUM) — depends on B-1 and B-5.
10. **B-9** (LOW) — depends on B-8; lowest urgency, monitoring-only gate.

## 7. Explicit authorization boundary

This record, like the two it synthesizes, authorizes **none** of the following: implementation of any
workstream or blocker resolution; schema or migration changes; test changes; instrumentation changes; billing
changes; validation execution; deployment; release; or launch. It does not modify, reopen, or alter: PDEF-2,
PDEF-3, PDEF-4, the entitlement-stacking decision, `MVP_SCOPE_BOUNDARY.md`, any previously decided instrumentation
ED, the existing blocker preparation record, or the existing blocker questionnaire. Where B-11's Option E would
require a PDEF-4 amendment, that amendment is explicitly named as a required separate Product Owner action
(§3), not performed here or implied as the default outcome.

---

## Final verification (performed before reporting completion)

- HEAD unchanged throughout: `af9ede93830f5e3e611195dc2451a470364def74`.
- Staged files: 0, before and after.
- No source, test, schema, config, or dependency file modified.
- Only this facilitation record created; the existing preparation record and questionnaire are untouched —
  SHA-256 re-verified identical to their values as cited in §0/§1 of this record:
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_PREPARATION.md` → `d199db8c6a953ca11744a27774505a503bb7935d4c0e62845887d01c30909cd0`
  - `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION_QUESTIONNAIRE.md` → `3e76f1f55186b0bc7399cc7c8d9d29644fd5550ca40cd15384c764fe3bc92286`
- All other governing records in §0's reading list (ED decision, PO decision, launch-criteria decision, PDEF-3
  completion decision) read-only, unmodified.
- No commit made. No push made.

