# Client Finder / Client Intent Discovery — PDEF-4 Instrumentation Product Owner Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-INSTRUMENTATION-PRODUCT-OWNER-DECISION-PREPARATION-001`
**Date:** 2026-10-04
**Type:** Read-only Product Owner decision-**preparation** record (questionnaire). **This record creates, implies,
infers, or authorizes no Product Owner decision, no implementation, no instrumentation, no validation, no
provider/API call, and no deployment/release/launch action of any kind** (see §9, Authorization Boundaries).
Every one of the 12 items below ends in a blank `PRODUCT OWNER SELECTION` field.

---

## 1. Provenance

| Field | Value |
|---|---|
| Requested by | Project owner, via task instruction: "Prepare a read-only Product Owner decision-preparation record for the 12 instrumentation/governance questions identified in `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md`." |
| Prepared by | Claude, performing read-only repository/document research only. No Product Owner authority is exercised or implied by this record — contrast with `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`, where the project owner explicitly delegated Q1–Q10 policy authority; **no equivalent delegation was given for this task**, so every question below is left for a human Product Owner (or an explicitly, separately delegated authority) to answer. |
| Source of the 12 questions | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` §20, "Missing governance decisions (PENDING PRODUCT OWNER DECISION — consolidated)." That section lists exactly 12 numbered items; all 12 are preserved below, in the same order, without collapsing or merging any of them. |

## 2. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` — verified unchanged before and after writing this record |
| Staged files | 0, before and after |
| Untracked files present before this record | 15 (per `git status --porcelain`), including the existing PDEF-4 instrumentation preparation record this task reads from |
| Existing instrumentation decision-preparation record | `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` — confirmed present |
| Existing instrumentation *Product Owner* decision-preparation record (this record's own path) | Confirmed **absent** prior to this task — no equivalent record found at this path or any other |
| File created by this task | this file only |

## 3. Governing-record hashes (verified at baseline; none modified by this record)

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` | `6692065324a1de16af8b065d8f17da296b98ed7d814adfed120e7923cef42ee3` |
| `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md` | `b3d2d2ae99b1a61810274ad043101c73d28daab7377b07ded7e9433b6b87598e` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `requirement/MVP_SCOPE_BOUNDARY.md` | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |

All eight were inspected and reconciled in full for this record. None is modified, reopened, or superseded by
anything below.

## 4. Already-decided policy carried forward as immutable (NOT reopened by this record)

Per PDEF-4 (`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`):

- PCG-1, PCG-2, PCG-3A, PCG-3B are **hard launch blockers**; PCG-4, PCG-5, PCG-6 are **monitoring/optimization
  gates only** (§6.1, §6.3).
- ₹499 and ₹1,499 may launch independently; each tier is evaluated only against its own applicable mandatory
  gates (§6.4).
- One complete, closed rolling-30-day window is the minimum observation period (§6.2).
- If an absolute-count gate (PCG-1: 500; PCG-2: 50) has not reached its count at window close, it is **NOT YET
  EVALUABLE** — neither passed nor failed; evaluation resumes each subsequent window (§6.5).
- PCG-5 evaluations are window-scoped (rolling 30 days from purchase) and immutable once recorded; a late refund
  attaches to its own later window, never retroactively reopening a closed evaluation (§6.6).
- A dual-tier holder counts **once** in the combined population for combined-primary gates (PCG-2/4/5/6), and is
  additionally attributed, non-exclusively, to **both** tiers' per-tier diagnostic buckets (§6.7).
- Per-tier diagnostic results **cannot** block launch on their own (§6.8).
- The four blocker gates (PCG-1/2/3A/3B) govern both launch qualification and ongoing post-launch monitoring; the
  three monitoring gates (PCG-4/5/6) govern post-launch optimization only, never launch qualification (§6.9).
- Blocker-gate instrumentation requires implementation **and** independent validation (by a party distinct from
  the implementing team) before launch-qualification use; monitoring-gate instrumentation requires implementation
  only, no independent pre-validation (§6.10).

Per PDEF-2 / entitlement stacking (`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`,
`CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`):

- ₹499 and ₹1,499 Client Finder access coexist (ES-1); credit buckets remain separate, not forfeited or pooled on
  purchase of the other tier (ES-5/ES-6); ₹1,499 Advanced access governs feature access when both are held (ES-7);
  both tiers' credit limits remain independently available (ES-8); ₹499 may be purchased after ₹1,499 (ES-10).
- Subscription lifecycle mechanics (renewal, expiry, cancellation, downgrade) remain out of MVP scope (ES-9,
  consistent with `MVP_SCOPE_BOUNDARY.md` §6.5).
- ES-11 explicitly defers measurement-policy questions to PDEF-4 rather than deciding them itself — this record is
  part of that deferred chain, not a reopening of ES-11.

Per PDEF-3 (`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` + `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`,
the latter superseding the former's PENDING items for PCG-3A/3B/4/5/6):

- All six gates' thresholds, measurement populations (Client-Finder-specific; combined-primary with per-tier
  diagnostic where a gate spans both tiers), and windows (rolling 30 days, with PCG-5 "from purchase" and PCG-6
  "from first Client Finder activation") are **DECIDED** — PCG-1: 500; PCG-2: ≥50; PCG-3A: ≥10%; PCG-3B: ≥5%;
  PCG-4: ≥60%; PCG-5: ≤8%; PCG-6: ≥70%.
- The definitions of "qualified visitor," "useful outcome," and "completion" are **DECIDED verbatim** (Completion
  Decision §9, §11, §13) and are quoted, not altered, in the questions below.
- PCG-6 does **not** depend on credit usage (Completion Decision §11; PDEF-3 §11's explicit Product Owner "No" —
  not reopened here).

None of the above is reopened, altered, or treated as ambiguous by this record. Every question below concerns
only what these decisions did **not** state.

## 5. Boundary note: "advanced analytics" vs. basic PCG instrumentation

`MVP_SCOPE_BOUNDARY.md` §6.7 places "revenue optimization," "cohort analytics," "advanced attribution," and
"predictive conversion models" out of MVP scope. The instrumentation preparation record's open items (§20, and the
12 questions below) concern only the **basic** measurement already mandated by PDEF-3/PDEF-4 — e.g., which
population counts as "exposed" for a conversion-rate denominator, not a predictive or optimization-grade
attribution model. This record does not ask the Product Owner to approve anything in §6.7's excluded list, and no
answer to the 12 questions below should be read as expanding MVP scope into advanced analytics. Flagged here only
so the Product Owner does not need to separately re-derive this boundary while answering §7.

## 6. Engineering/policy separation (read before answering)

The questions below ask only for **policy** — definitions, populations, boundaries, and treatment rules. None of
the following is decided, proposed as decided, or requested here; each remains engineering design work for a
separate, later, explicitly authorized task, per the source preparation record's §21:

event schema · table/column names · database architecture · analytics vendor · queue/event-bus technology ·
API design · SQL · migration structure · identity/session-id implementation · webhook implementation ·
instrumentation code.

Where a question's answer has an unavoidable downstream engineering consequence, that consequence is stated under
"Why this matters," not folded into the options themselves.

## 7. The 12 decision questions

Each question is numbered exactly as it appears in `CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md`
§20 (items 1–12), with a short mnemonic ID added only for cross-reference convenience in this record.

---

### Q-1 [PCG1-ELIG] — PCG-1 minimum eligibility criteria

**Current governing state:** PDEF-3's "qualified visitor" definition (Completion Decision §13) requires, as its
third condition, that the visitor "satisfies the product's minimum eligibility criteria for the applicable Client
Finder tier." No governing record states what those criteria actually are.

**Existing evidence:** Instrumentation preparation record §6 row 5. No code implements any eligibility check tied
to this definition; no governing record (PDEF-2, PDEF-3, PDEF-4, entitlement stacking) names a candidate criterion
(e.g., account status, geography, device type, prior purchase history).

**Already decided:** The three-part structure of "qualified visitor" (funnel entry + demonstrated intent +
minimum eligibility). Not reopened.

**What remains genuinely undecided:** What the "minimum eligibility criteria" concretely are, if any.

**Why it matters to measurement/gate integrity:** PCG-1 is a hard launch blocker (500-visitor absolute count).
Without a concrete eligibility rule, the "qualified visitor" count cannot be computed consistently, and a
too-loose or too-strict eligibility rule directly moves the count toward or away from the 500 threshold —
materially affecting whether ₹499 and ₹1,499 can launch.

**Decision options:**
- **A** — Adopt a specific, named eligibility rule (e.g., a verified account, a minimum session-engagement
  signal, a specific geography). `VALUE: __________`
- **B** — Decide that no additional eligibility criterion applies beyond funnel entry + demonstrated intent (i.e.,
  condition (3) is satisfied by definition once (1) and (2) are met).
- **C** — Define a different explicit rule not covered by A/B. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** The repository currently has no concept of "visitor eligibility"
distinct from authentication/purchase state; any option other than D will require a new, currently-unbuilt
eligibility check.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-2 [PCG1-ATTR] — PCG-1 aggregate vs. per-funnel-entry-path attribution

**Current governing state:** The original commercial-gates framing (`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`
§6) stated PCG-1 "applies to the ₹99 → ₹499 progression specifically." PDEF-2 separately allows ₹1,499 to be
purchased directly, with no prior ₹99/₹499 purchase. Neither the Commercial Gates Decision, the Completion
Decision, nor PDEF-4 states whether PCG-1 is evaluated once in aggregate (across all funnel-entry paths) or
separately per entry path (e.g., a distinct 500-visitor count for a ₹1,499-direct-entry funnel).

**Existing evidence:** Instrumentation preparation record §6 row 8; §20 item 2.

**Already decided:** PCG-1's threshold (500) and its status as a hard blocker (PDEF-4 §6.3). Not reopened.

**What remains genuinely undecided:** Whether PCG-1 is one combined count across every way a visitor can enter
the Client Finder funnel, or a separate 500-visitor count per distinct entry path (at minimum, a ₹99→₹499-oriented
path and a ₹1,499-direct path).

**Why it matters to measurement/gate integrity:** PDEF-4 §6.4 lets ₹499 and ₹1,499 launch independently, each
evaluated against its own applicable gates, with PCG-1 "shared" between them per §6.4's own wording. If PCG-1 is
in fact meant to be measured per-path rather than shared, the current §6.4 framing may itself need revisiting —
this question exists precisely to resolve that ambiguity before instrumentation is built either way.

**Decision options:**
- **A** — One aggregate PCG-1 count, shared across both tiers' launch eligibility (consistent with PDEF-4 §6.4's
  literal wording that PCG-1 is "shared").
- **B** — Separate PCG-1 counts per funnel-entry path (e.g., one for the ₹99→₹499 path, a distinct one for a
  ₹1,499-direct path), each needing its own 500-visitor threshold cleared.
- **C** — Define a different explicit rule. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** No code today distinguishes a visitor's funnel-entry path from
their eventual tier of purchase; building per-path measurement (Option B) would require a new, currently-unbuilt
path-tagging mechanism at funnel entry.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-3 [PCG2-WIN] — PCG-2 measurement-window start-point event

**Current governing state:** PDEF-3/PDEF-4 decide PCG-2's threshold (≥50 buyers), population (Client-Finder-
specific, combined-primary with per-tier diagnostic), and window length (rolling 30 days). Unlike PCG-5 ("from
purchase") and PCG-6 ("from first activation"), no record states what event starts a given buyer's 30-day window
for PCG-2.

**Existing evidence:** Instrumentation preparation record §7 row 7; §20 item 3.

**Already decided:** The ≥50 threshold, Client-Finder-specific population, combined-primary/per-tier-diagnostic
structure, and 30-day window length. Not reopened.

**What remains genuinely undecided:** The exact timestamp/event that anchors each 30-day window for counting a
buyer toward PCG-2 (e.g., funnel entry, order creation, or payment capture).

**Why it matters to measurement/gate integrity:** PCG-2 is a hard launch blocker. A different anchor event shifts
which purchases fall inside vs. outside a given closed window, which can change whether the 50-buyer threshold is
met at a specific window-close evaluation.

**Decision options:**
- **A** — Anchor the window to payment-capture timestamp (the point at which `Payment.status` becomes `CAPTURED`).
- **B** — Anchor the window to order-creation timestamp.
- **C** — Define a different explicit anchor event. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** The instrumentation preparation record noted that treating
payment-capture as the anchor would be "by analogy" to PCG-5's explicit "from purchase" wording, but stated this
is not itself decided anywhere.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-4 [PCG2-REFUND] — Whether a refunded purchase still counts toward PCG-2's buyer count

**Current governing state:** PDEF-4 §6.6 decides PCG-5's own refund-rate window-scoping (immutable, window-scoped,
late refunds attach to their own later window). No record addresses whether a buyer whose payment is later
refunded still counts as a "buyer" for PCG-2's separate buyer-count gate.

**Existing evidence:** Instrumentation preparation record §7 row 15; §20 item 4.

**Already decided:** PDEF-4 §6.6's refund-window-scoping rule for PCG-5 specifically. Not reopened; this question
does not extend or alter that rule — it asks a distinct question about PCG-2.

**What remains genuinely undecided:** Whether a buyer counted in a closed PCG-2 window remains counted if their
payment is refunded after that window closes (or within it), or whether a refund retroactively removes them from
the buyer count.

**Why it matters to measurement/gate integrity:** PCG-2 is a hard launch blocker. If refunded buyers are excluded,
PCG-2's count could drop below 50 after an evaluation already treated the gate as cleared, creating a question of
whether a launch decision made on that evaluation remains valid — this record does not resolve that follow-on
question either; it is listed here only to be surfaced, not answered.

**Decision options:**
- **A** — A refunded buyer still counts toward PCG-2 for whichever window their original purchase fell in; PCG-2
  evaluations are immutable once a window closes (consistent in spirit with PDEF-4 §6.6's treatment of PCG-5).
- **B** — A refunded buyer is excluded from PCG-2's count, recomputed retroactively if the refund is known before
  the relevant window's evaluation is used in a launch decision.
- **C** — Define a different explicit rule. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** None offered; this item has no existing analyst recommendation in
the governing chain and the preparation record did not supply one either.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-5 [PCG3AB-POP] — PCG-3A/3B "eligible exposed population" boundary

**Current governing state:** The Completion Decision (§7, §8) states PCG-3A's population as "eligible ₹99
purchasers/users exposed to the ₹499 offer" and PCG-3B's as "eligible users exposed to the ₹1,499 offer,"
independent of ₹499 ownership. The Commercial Gates Decision §8 explicitly flagged "exact definition of the
₹1,499 conversion population... for measurement (b)" as unresolved and the Completion Decision did not close that
specific operational boundary — it fixed the threshold and the population *label*, not the population's exact
membership rule.

**Existing evidence:** Instrumentation preparation record §8 row 5, §9 row 5; §20 item 5.

**Already decided:** PCG-3A threshold ≥10%, PCG-3B threshold ≥5%; both independent (not sequential) per PDEF-2;
both Client-Finder-specific. Not reopened.

**What remains genuinely undecided:** The precise membership rule for "eligible [users/purchasers] exposed to the
[₹499/₹1,499] offer" — e.g., does "exposed" mean shown the offer UI at least once, visiting a specific page, or
something else; and for PCG-3B specifically, is the denominator all site visitors, all ₹99 buyers, or some other
named population.

**Why it matters to measurement/gate integrity:** Both PCG-3A and PCG-3B are hard launch blockers. The
denominator's exact boundary directly determines the conversion rate computed against the ≥10%/≥5% thresholds —
a narrower "exposed" population inflates the rate; a broader one deflates it.

**Decision options:**
- **A** — "Exposed" means the offer UI was rendered/shown to the user at least once (an impression-based
  definition), for both PCG-3A and PCG-3B.
- **B** — "Exposed" means the user reached a specific named page/step in the funnel (not merely an impression).
  `VALUE: __________` (name the step)
- **C** — Define a different explicit population-membership rule, separately for PCG-3A and PCG-3B if they should
  differ. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** No durable, server-side "offer exposure" event exists in the
repository today under any candidate definition; whichever definition is chosen will require a new, currently-
unbuilt exposure-logging mechanism.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-6 [PCG3AB-WIN] — PCG-3A/3B exposure-window start point

**Current governing state:** The Completion Decision fixes PCG-3A/3B's window length at rolling 30 days but does
not state what event starts that window for the *exposure* side of the conversion-rate denominator (as distinct
from Q-3's PCG-2 question, which concerns the buyer side of a different gate).

**Existing evidence:** Instrumentation preparation record §8 row 7, §9 row 7; §20 item 6.

**Already decided:** Rolling 30 days as the window length for both gates (Completion Decision §7, §8). Not
reopened.

**What remains genuinely undecided:** Whether the 30-day window for a given cohort starts at the moment of
exposure to the offer, or at the moment of the prior purchase (₹99 for PCG-3A) that made the user eligible to be
exposed.

**Why it matters to measurement/gate integrity:** Both gates are hard launch blockers. A window anchored to
exposure vs. to prior purchase can place the same user's eventual conversion inside or outside a given closed
window, changing the computed rate for that window.

**Decision options:**
- **A** — Window starts at the moment of exposure to the offer.
- **B** — Window starts at the moment of the prior qualifying purchase (₹99 for PCG-3A; the user's general
  eligibility event for PCG-3B).
- **C** — Define a different explicit anchor. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** None offered beyond noting the structural similarity to Q-3; no
governing record supplies a default for this specific question.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-7 [PCG3AB-REFUND] — Refund treatment in PCG-3A/3B's numerator/denominator

**Current governing state:** No governing record states whether a later-refunded ₹99, ₹499, or ₹1,499 purchase
still counts in PCG-3A's or PCG-3B's conversion numerator (the converted purchase) or denominator (the
eligible/exposed population, where the prior purchase is itself a membership condition, e.g. PCG-3A's "eligible
₹99 purchasers").

**Existing evidence:** Instrumentation preparation record §8 row 15, §9 row 15; §20 item 7.

**Already decided:** PDEF-4 §6.6's refund-window-scoping rule applies specifically to PCG-5, not to PCG-3A/3B.
Not extended here.

**What remains genuinely undecided:** Whether a refunded purchase is excluded from, or still counts in, PCG-3A/
3B's numerator and/or denominator.

**Why it matters to measurement/gate integrity:** Both gates are hard launch blockers. Since refunds can occur
after a purchase that already contributed to a closed window's conversion-rate calculation, this choice affects
whether that window's result is treated as final (consistent with the immutability principle PDEF-4 §6.6 applies
to PCG-5) or subject to retroactive adjustment.

**Decision options:**
- **A** — Refunded purchases still count in both numerator and denominator for whichever window they fell in;
  evaluations are immutable once the window closes (consistent in spirit with PDEF-4 §6.6).
- **B** — Refunded purchases are excluded from both numerator and denominator, recomputed if known before the
  window's evaluation is used in a launch decision.
- **C** — Define a different explicit rule (e.g., excluded from the numerator only). `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** None offered; no refund-webhook handling exists in the repository
today under any of these options (confirmed absent per the instrumentation preparation record §5, §11 row 6), so
all options require new, currently-unbuilt refund-event capture regardless of which is chosen.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-8 [SAMPLE-FLOOR] — Whether an insufficient-sample floor applies to PCG-3A/3B/4/5's denominators

**Current governing state:** PDEF-4 §6.5 names an explicit "NOT YET EVALUABLE" floor only for PCG-1 (500) and
PCG-2 (50) — both absolute-count gates. PCG-3A, PCG-3B, PCG-4, and PCG-5 are rate-based gates (percentages), and
no governing record states whether an analogous "the underlying population is too small to evaluate meaningfully"
floor applies to their denominators, or whether a rate computed over any denominator size (even very small) is
treated as a valid pass/fail result.

**Existing evidence:** Instrumentation preparation record §8 row 19, §11 row 19, §18; §20 item 8.

**Already decided:** PDEF-4 §6.5's NOT YET EVALUABLE rule for PCG-1/PCG-2 specifically. Not extended to the
rate-based gates by this question; this question asks whether it should be, by a separate, explicit decision.

**What remains genuinely undecided:** Whether PCG-3A, PCG-3B, PCG-4, and/or PCG-5 should have their own minimum-
denominator floor before their percentage result is used (for PCG-3A/3B, in a launch-qualification decision,
since both are hard blockers; for PCG-4/5, in a monitoring report, since both are monitoring-only).

**Why it matters to measurement/gate integrity:** Without a floor, a rate-based gate could technically "pass" or
"fail" off a denominator of 1 or 2, producing a statistically meaningless result that is nonetheless usable, as
written, in a launch-qualification decision for PCG-3A/3B.

**Decision options:**
- **A** — Adopt the same NOT YET EVALUABLE treatment PDEF-4 §6.5 already applies to PCG-1/2, with an explicit
  minimum denominator for each rate-based gate. `VALUE: __________` (minimum denominator per gate)
- **B** — No floor; any denominator size, however small, produces a valid pass/fail (or monitoring) result.
- **C** — Define a different explicit rule (e.g., a floor for the blocker gates PCG-3A/3B only, none for the
  monitoring gates PCG-4/5). `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** None offered; the source preparation record raised this gap
without proposing a value, consistent with the instruction not to invent a numeric floor.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-9 [PCG4-DENOM] — PCG-4's exact denominator population boundary

**Current governing state:** The Completion Decision §9 states PCG-4's population as "Client-Finder-specific,
across ₹499 and ₹1,499 users," with the numerator being users achieving the decided "useful outcome" definition.
It does not state the exact base population the rate is computed against (the denominator) beyond that general
population label.

**Existing evidence:** Instrumentation preparation record §10 row 2–3; §20 item 9.

**Already decided:** The ≥60% threshold, the verbatim "useful outcome" definition, the Client-Finder-specific/
combined-primary-with-per-tier-diagnostic population structure, and the rolling-30-day window (Completion Decision
§9). Not reopened.

**What remains genuinely undecided:** The exact denominator — e.g., all current ₹499/₹1,499 entitlement holders in
the window, or only holders who performed at least one Client-Finder search/activation in the window.

**Why it matters to measurement/gate integrity:** PCG-4 is monitoring-only, so this does not block launch, but a
denominator that includes never-active holders versus one limited to actively-searching holders can produce
materially different rates against the same ≥60% threshold, changing what the monitoring signal actually means.

**Decision options:**
- **A** — Denominator = all users holding an active ₹499 or ₹1,499 entitlement at any point in the window,
  regardless of whether they performed a search.
- **B** — Denominator = users who performed at least one Client-Finder search/activation in the window.
- **C** — Define a different explicit denominator. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** None offered; no governing record states a default, and the
source preparation record flagged this as open without proposing a value.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-10 [PCG4-COVERAGE] — Whether the existing qualification-rule evaluator already encodes PDEF-3's "useful outcome" sub-conditions

**Current governing state:** PDEF-3's "useful outcome" definition (Completion Decision §9) is a compound
condition: the Client Finder produces ≥1 qualified opportunity that (a) the user considers actionable, and (b)
satisfies the user's configured target criteria — specifically the requested service, target customer
characteristics, and minimum project-value requirements. `packages/core-qualification/` evaluates whether a
*prospect* meets qualification rules (an existing, different-purpose mechanism), and `feedback.useful`
(`packages/core-opportunity`) captures condition (a) directly, but whether `core-qualification`'s existing rule
logic already encodes exactly conditions (b)'s three named sub-parts — or encodes something else that merely
looks similar — has not been verified at the code level, and no governing record states whether the existing
logic should be treated as sufficient or whether new, Client-Finder-specific logic must be defined.

**Existing evidence:** Instrumentation preparation record §10 row 5, §20 item 10 ("this is partly an engineering
question but has a policy dimension if the existing rules diverge from the PDEF-3 definition").

**Already decided:** The verbatim "useful outcome" definition itself (Completion Decision §9). Not reopened —
this question is about whether existing code already matches that definition, not about changing the definition.

**What remains genuinely undecided:** Whether the Product Owner is willing to accept `core-qualification`'s
existing rule logic as the operative test for condition (b) if a later engineering review finds it already
matches, or whether new Client-Finder-specific logic must be written regardless of what the review finds, because
`core-qualification` was built for a different purpose (evaluating discovered prospects, not Client-Finder search
outcomes).

**Why it matters to measurement/gate integrity:** PCG-4 is monitoring-only, but a mismatch between the governed
definition and whatever logic actually computes the numerator would make the reported ≥60% figure not actually
measure what PDEF-3 defined, undermining the monitoring signal's validity regardless of its non-blocking status.

**Decision options:**
- **A** — Accept `core-qualification`'s existing logic as the operative test for condition (b), *if and only if* a
  subsequent engineering review confirms it is logically equivalent to PDEF-3's three named sub-parts; otherwise
  require new logic.
- **B** — Require new, Client-Finder-specific logic regardless of what a review finds, on the basis that
  `core-qualification` was built for an unrelated purpose and should not be repurposed for a commercial gate.
- **C** — Define a different explicit rule. `VALUE: __________`
- **D** — Defer; leave PENDING (engineering review proceeds first, decision made after findings are in hand).

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** The source preparation record explicitly declined to verify
code-level equivalence in its own pass, calling it "ENGINEERING DESIGN REQUIRED" and out of scope for a read-only
record; this question's answer may usefully be revisited once that review exists, regardless of which option is
chosen now.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-11 [PCG5-PARTIAL] — PCG-5 partial-vs-full refund treatment

**Current governing state:** The Completion Decision §10 fixes PCG-5's threshold (≤8%), population (Client-
Finder-specific purchasers across both tiers), and window ("rolling 30 days from purchase"). No record states
whether a *partial* refund counts the same as a full refund toward the refund-rate numerator.

**Existing evidence:** Instrumentation preparation record §11 row 8; §20 item 11.

**Already decided:** The ≤8% threshold, population, and window. Not reopened. PCG-5's monitoring-only status
(PDEF-4 §6.3) — not reopened.

**What remains genuinely undecided:** Whether a partial refund (less than the full purchase amount) counts as a
full refund-event, a fractional refund-event (e.g., weighted by refunded amount), or is excluded entirely from the
PCG-5 numerator.

**Why it matters to measurement/gate integrity:** PCG-5 is monitoring-only, so this does not block launch, but it
materially changes what the reported refund rate means — treating every partial refund as a full refund-event
could overstate the true refund rate; excluding them entirely could understate it.

**Decision options:**
- **A** — A partial refund counts the same as a full refund (binary: any refund amount > 0 counts as one
  refund-event).
- **B** — A partial refund counts fractionally, weighted by the proportion of the purchase amount refunded.
- **C** — A partial refund is excluded from the numerator entirely; only full refunds count.
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** None offered; the source preparation record explicitly stated it
does not invent a partial-refund rule, per the instruction not to invent governed refund rules.

**PRODUCT OWNER SELECTION:** `__________`

---

### Q-12 [PCG5-DUPREV] — PCG-5 duplicate/refund-reversal treatment

**Current governing state:** No governing record addresses what happens if a recorded refund is itself later
reversed, disputed, or duplicated (e.g., a webhook delivered more than once for the same refund event).

**Existing evidence:** Instrumentation preparation record §11 row 12; §20 item 12.

**Already decided:** PDEF-4 §6.6's window-scoping/immutability rule for PCG-5 evaluations generally. Not
reopened — this question is about a narrower case (duplicate or reversed refund records) that rule does not
explicitly address.

**What remains genuinely undecided:** Whether a reversed/disputed refund should un-count itself from a
not-yet-closed window's refund-rate numerator, and how a duplicate refund-event record (e.g., from webhook
redelivery) should be prevented from double-counting.

**Why it matters to measurement/gate integrity:** PCG-5 is monitoring-only, but an uncontrolled duplicate-counting
or reversal-handling gap could silently inflate or distort the reported refund rate, undermining the reliability
of the only monitoring signal this gate provides.

**Decision options:**
- **A** — A reversed/disputed refund removes the original refund-event from the numerator, but only for a window
  that has not yet closed (consistent with PDEF-4 §6.6's "immutable once recorded" principle for closed windows).
- **B** — Once recorded, a refund-event counts permanently regardless of any later reversal/dispute, mirroring the
  general immutability principle even more strictly than Option A.
- **C** — Define a different explicit rule. `VALUE: __________`
- **D** — Defer; leave PENDING.

**ANALYST OBSERVATION — NOT A RECOMMENDATION:** Deduplication of the underlying event record itself (e.g., by a
refund-event's own idempotency key) is a separate engineering concern, not addressed here — this question is about
the *policy* result once duplicates are technically prevented, not about how to prevent them.

**PRODUCT OWNER SELECTION:** `__________`

---

## 8. Dependencies

| Dependency | Status |
|---|---|
| Resolution of Q-1 through Q-12 | Required before the instrumentation-build task (preparation record §21) can be scoped without re-litigating policy mid-build. |
| Engineering review of `core-qualification`/`feedback.useful` coverage (Q-10) | Recommended before Q-10 is finally answered, though the Product Owner may answer conditionally (Option A) without waiting for it. |
| Independent-validation method/validator for PCG-1/2/3A/3B (PDEF-4 §6.10) | A separate, not-yet-performed engineering/process definition; not affected by this record and not a precondition to answering Q-1–Q-12. |
| Instrumentation implementation itself (preparation record §21) | Not started; explicitly not authorized by this record or any record it reconciles. |

## 9. Explicit authorization boundary

**This record grants none of the following, under any circumstance:** a Product Owner decision on any of Q-1
through Q-12; code implementation; instrumentation implementation; billing or credit-ledger implementation; schema
or migration changes; test execution; independent validation; provider/API calls; external research beyond the
read-only document inspection performed for this record; deployment; release; production traffic; launch; commit;
or push.

It does not modify, reopen, or alter `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`,
`CLIENT_FINDER_PDEF_4_INSTRUMENTATION_DECISION_PREPARATION.md`, `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`,
`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`, `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`,
`CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`, `PROJECT_MASTER_CHECKLIST.md`, `MVP_SCOPE_BOUNDARY.md`, or any
code, test, schema, migration, configuration, or dependency. It is not committed or pushed. K1-10
(deployment/release) remains explicitly **NOT AUTHORIZED**, unaffected by anything in this record.

## 10. Newly discovered governance observations (not conflicts in substance, flagged for completeness)

1. `PROJECT_MASTER_CHECKLIST.md` (line 155) still lists PDEF-4 as "NOT STARTED," and line 166 (`T99-4`) still
   describes PCG metrics as "not defined" — both appear stale relative to
   `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` and `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` (both dated
   2026-10-04, both DECIDED). This record does not update the checklist — that is a separate, explicit maintenance
   action — but notes the discrepancy so it is not mistaken for a substantive policy conflict.
2. No substantive conflict was found between PDEF-3's two decision records: `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`
   left PCG-3A/3B/4/5/6 thresholds PENDING; `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` later supplied and
   DECIDED all of them. The later record's explicit text treats this as the Product Owner's follow-up round, not a
   contradiction, and this record relies on the Completion Decision's values throughout.
3. `MVP_SCOPE_BOUNDARY.md` §6.7 ("advanced analytics": cohort analytics, advanced attribution, predictive
   conversion models) does not conflict with anything here — see §5 above — but is worth the Product Owner's
   awareness when reviewing Q-1/Q-2/Q-5's attribution-adjacent language, so no answer is read as silently
   expanding MVP scope.

## 11. Questions already decided elsewhere and therefore excluded from this questionnaire

For completeness, the following items from the instrumentation preparation record are **not** included above
because they are `ENGINEERING DESIGN REQUIRED` (not Product Owner policy questions) per that record's own
classification, and are preserved here only as a pointer, not re-litigated:

- A durable, server-side, timestamped funnel/visitor event store (preparation record §21 item 1).
- An anonymous-visitor-to-authenticated-user identity linkage mechanism (§21 item 2).
- A bot/internal-traffic exclusion and visitor-deduplication mechanism (§21 item 3).
- A durable offer-exposure event log (§21 item 4).
- A refund webhook handler, refund table, and auto-revoke-on-refund wiring (§21 item 5).
- A rolling-30-day (and first-activation-based) time-windowed query/aggregation layer (§21 item 6).
- A Client-Finder "activation" event and a correctly-scoped "completion" event (§21 item 7).
- An independent-validation process/method for the four blocker gates (§21 item 9).

## 12. Recommended next governance step

1. Product Owner (or an authority explicitly, separately delegated for this specific task, per this project's
   established practice in `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`) answers Q-1 through Q-12 above.
2. Only after that: a separate, explicitly authorized engineering-design task scopes the preparation record's §21
   implementation dependencies into an actual instrumentation build plan.
3. Only after instrumentation is implemented: independent validation is performed for the four blocker gates
   (PCG-1/2/3A/3B), per PDEF-4 §6.10.
4. Only after validation: any launch-qualification decision may use PCG-1/2/3A/3B results — and even then,
   deployment/release (K1-10) requires its own separate authorization, unaffected by any of the above.

**Next governance action:** none of steps 1–4 is performed or authorized by this record. This record exists
solely to convert the preparation record's §20 gap list into an answerable questionnaire before step 1 is
undertaken.
