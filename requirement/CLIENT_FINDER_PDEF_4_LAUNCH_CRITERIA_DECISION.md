# Client Finder / Client Intent Discovery — PDEF-4 Launch Criteria Decision

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `CLIENT-FINDER-PDEF-4-LAUNCH-CRITERIA-PO-DEC-001` |
| Date | 2026-10-04 |
| Type | Governance decision record — recording only. **Not an implementation, instrumentation, validation, deployment, release, or launch authorization** (see §9). |
| Decision status | **DECIDED — UNDER DELEGATED PRODUCT OWNER AUTHORITY.** |
| **Decision authority** | **Delegated Product Owner authority exercised by Claude for this task.** The project owner explicitly delegated the PDEF-4 Q1–Q10 policy decisions to Claude for this task, instructing Claude to read and reconcile the governing chain and decide. **These values were NOT supplied directly by a human Product Owner** — unlike `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`, and `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md`, which record answers a human Product Owner supplied directly. This record's provenance is explicitly different and is stated as such throughout, to preserve the project's audit chain. |

## 2. Provenance distinction (read before using this record)

| Prior record | Provenance |
|---|---|
| `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | Answers supplied directly by a human Product Owner |
| `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | Answers supplied directly by a human Product Owner |
| `CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | Answers supplied directly by a human Product Owner |
| **This record (PDEF-4)** | **Answers decided by Claude, under explicit delegated Product Owner authority granted by the project owner for this specific task.** Claude independently reconciled the governing chain and the prior analyst recommendation (`CLIENT_FINDER_PDEF_4_ANALYST_RECOMMENDATION.md`) and made the Q1–Q10 policy choices recorded in §7. Where this record adopts an analyst-recommended value, that is stated explicitly per question — adoption of a prior proposal is itself part of the delegated decision, not a separate analyst-to-decision conversion performed silently. |

Anyone relying on this record for commercial, engineering, or compliance purposes should treat its provenance as
**delegated-AI decision, not independently supplied human Product Owner input**, and should seek human Product
Owner ratification before treating Q1–Q10 as final if that distinction matters to their use of this record.

## 3. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` — unchanged |
| Staged files | 0 |
| Prior PDEF-4 decision record | Existed at this same path, status NOT DECIDED (all Q1–Q10 PENDING/UNDEFINED), SHA-256 `7e895893ca7bd774ff9314186d592dc76d30b701d4b17c3530e37f79a01e019e` — no contradictory decision existed; this record **supersedes that file's content at the same path**, updating status to DECIDED under the provenance stated in §1–§2 |
| File updated by this record | this file only |

## 4. Governing records reconciled (hashes verified at baseline, unchanged by this record)

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_PRODUCT_OWNER_ADOPTION_QUESTIONNAIRE.md` | `e77319696e0e2e9c4b7c3e1e5bf90dd6858699e77fb914ddb93e06adb398becd` |
| `requirement/CLIENT_FINDER_PDEF_4_ANALYST_RECOMMENDATION.md` | `a1f35824bc80e1b2e16e9aed9479f0eb0623f74138820f3dd32ff788d5ac55cc` |
| `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md` | `5b54709269a16a75d3dc22394c102af5be77b4c55d1b66909a96375fab26d4ef` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` |
| `requirement/CLIENT_FINDER_ENTITLEMENT_STACKING_DECISION.md` | `0333d2bc8805348bf789d7abba569611df561eb7ec4c6e8a9b076ff275b3acca` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| `requirement/MVP_SCOPE_BOUNDARY.md` §6.5 | not independently hashed (read-only reference) |

None of these records is modified by this decision record. PDEF-2, PDEF-3, and entitlement stacking are not
reopened or altered.

## 5. Inherited policy (DECIDED elsewhere — not reopened, not altered by this record)

- **PDEF-2:** Client Finder in both ₹499 and ₹1,499; ₹499 = Basic, ₹1,499 = Advanced; independent purchase in
  both directions; ₹499 = 50, ₹1,499 = 300 monthly lead-unlock credits.
- **PDEF-3:** PCG-1 = 500 qualified visitors; PCG-2 = ≥50 buyers; PCG-3A = ≥10% (₹99→₹499); PCG-3B = ≥5%
  (independent ₹1,499 conversion); PCG-4 = ≥60% useful outcome; PCG-5 = ≤8% refund rate; PCG-6 = ≥70% completion.
  Measurement population is Client-Finder-specific; default window is rolling 30 days (PCG-5: from purchase;
  PCG-6: from first activation). Combined population is the primary gate where a gate spans both tiers, with
  per-tier diagnostics.
- **Entitlement stacking:** ₹499/₹1,499 entitlements are cumulative/coexisting (ES-1); separate credit buckets,
  not forfeited or pooled (ES-5/ES-6); ₹1,499 Advanced access governs feature access when both held (ES-7); both
  credit limits remain independently available (ES-8); renewal/expiry/cancellation/downgrade out of MVP (ES-9);
  ₹499 may be purchased after ₹1,499 (ES-10).
- **K1:** implementation and validation COMPLETE (checklist §5.0, K1-05/K1-08); deployment/release (K1-10)
  remains **NOT AUTHORIZED** and is unaffected by K1's completion or by this record.
- **MVP scope:** recurring subscriptions, usage-based billing, team workspaces, enterprise accounts, advanced
  quotas, and subscription plans remain out of MVP (`MVP_SCOPE_BOUNDARY.md` §6.5), consistent with ES-9.

None of the above is changed by this record.

## 6. Newly decided PDEF-4 policy (Q1–Q10) — decided by Claude under delegated Product Owner authority

### 6.1 Q1 — Gate composition

**DECISION:** A named subset of PCG-1..6 is mandatory for launch: **PCG-1, PCG-2, PCG-3A, PCG-3B.** PCG-4, PCG-5,
and PCG-6 are monitoring-only and do not block launch.

| Field | Content |
|---|---|
| Rationale | PCG-1/PCG-2 establish that real traffic and paying demand exist at all, which every other gate's measurement depends on being meaningful; PCG-3A/PCG-3B establish that the ₹99→₹499 and independent-₹1,499 acquisition economics the pricing ladder depends on actually function. PCG-4 (useful outcome), PCG-5 (refunds), and PCG-6 (completion) are product-quality and retention signals that are more effectively improved through iteration on a live, already-launched product than held as preconditions — gating launch on all six risks a single lagging quality metric indefinitely withholding a tier whose core acquisition economics are already proven. |
| Interaction with PDEF-2/PDEF-3/ES | Does not alter any PCG threshold, population, or window from PDEF-3; selects which of the already-adopted six gates function as launch blockers, a question PDEF-3 explicitly left to PDEF-4. No interaction with PDEF-2 or entitlement stacking. |
| Trade-off | A tier can launch with weak useful-outcome, refund, or completion performance. Accepted deliberately in favor of not making launch structurally difficult to clear. |
| Implementation work required later | None by this decision alone; measuring PCG-1/2/3A/3B still requires instrumentation (Q10). |

### 6.2 Q2 — Minimum observation period

**DECISION:** One complete, closed rolling-30-day measurement window is the minimum observation period required
before a gate may be used in a launch-qualification decision. No second or subsequent window is required by this
decision alone.

| Field | Content |
|---|---|
| Rationale | PDEF-3's rolling-30-day window is already the smallest unit of measurement the governing records define; evaluating against a partial window would compare an incomplete cohort to a fixed threshold, while requiring multiple windows adds delay with no commercial justification supplied anywhere in the governing chain. |
| Interaction with PDEF-2/PDEF-3/ES | Uses PDEF-3's existing window definition without altering it; clarifies only that "rolling 30 days" is a measurement-window definition, not an independent mandatory pre-launch wait beyond one window's closure. |
| Trade-off | A single window may be statistically noisy for the absolute-count gates (PCG-1/PCG-2), which could reach their thresholds unevenly across the window. Accepted in favor of not open-endedly delaying evaluation; Q5 provides the fallback when the threshold genuinely is not reached. |
| Implementation work required later | None by this decision alone; requires instrumentation capable of detecting window closure (part of Q10's prerequisite). |

### 6.3 Q3 — Per-gate severity

**DECISION:**

| Gate | Classification |
|---|---|
| PCG-1 (500 qualified visitors) | **HARD LAUNCH BLOCKER** |
| PCG-2 (≥50 buyers) | **HARD LAUNCH BLOCKER** |
| PCG-3A (≥10% ₹99→₹499) | **HARD LAUNCH BLOCKER** |
| PCG-3B (≥5% independent ₹1,499 conversion) | **HARD LAUNCH BLOCKER** |
| PCG-4 (≥60% useful outcome) | **MONITORING / OPTIMIZATION TARGET** |
| PCG-5 (≤8% refund rate) | **MONITORING / OPTIMIZATION TARGET** |
| PCG-6 (≥70% completion) | **MONITORING / OPTIMIZATION TARGET** |

| Field | Content |
|---|---|
| Rationale | Directly implements Q1's composition decision at the per-gate level. PCG-5 specifically is treated as monitoring rather than a blocker because refund rate is inherently retrospective (measured after purchase) and an early cohort may not yet have had time to request refunds within a single 30-day window, making it operationally unstable as a pre-launch blocker; PCG-4 and PCG-6 are UX/quality-maturity signals best improved once real usage data exists. |
| Interaction with PDEF-2/PDEF-3/ES | No PDEF-3 threshold, population, or window is altered — only each gate's functional role in a launch decision is assigned, consistent with Q1. |
| Trade-off | Same as Q1 — three of six gates never block launch regardless of how poor they are, absent a future separate decision (see Q8 for the diagnostic-escalation question this interacts with). |
| Implementation work required later | None by this decision alone. |

### 6.4 Q4 — Tier launch structure

**DECISION:** ₹499 and ₹1,499 may launch independently. Each tier's launch eligibility is evaluated against only
its own applicable mandatory gates (per §6.3): ₹499 depends on PCG-1, PCG-2 (as attributed per §6.7), and PCG-3A;
₹1,499 depends on PCG-1 (shared), PCG-2 (as attributed per §6.7), and PCG-3B. Neither tier's launch is conditioned
on the other tier's gates clearing.

| Field | Content |
|---|---|
| Rationale | PDEF-2 makes the two tiers independently purchasable in both directions, and entitlement stacking (ES-1/ES-10) confirms they coexist without sequential dependency. A joint-launch requirement would make a tier that is independently purchasable not independently launchable, with no governing record supplying a reason to diverge from the existing commercial model. |
| Interaction with PDEF-2/PDEF-3/ES | Directly reinforces, and does not alter, PDEF-2's independent-purchase rule and ES-1/ES-10's coexistence/reverse-order rules. |
| Trade-off | Where a gate is combined-population by PDEF-3 (e.g., PCG-2), a tier could clear its own launch eligibility on a combined pass even while its own per-tier diagnostic is comparatively weak; this is addressed by Q8, not by this decision. |
| Implementation work required later | None by this decision alone; requires per-tier launch-eligibility tracking once instrumentation exists. |

### 6.5 Q5 — Insufficient sample size

**DECISION:** If, at the close of the observation window (§6.2), an absolute-count gate (PCG-1: 500 visitors;
PCG-2: 50 buyers) has not reached its required count, that gate is marked **NOT YET EVALUABLE** — neither passed
nor failed. A tier whose launch depends on a NOT YET EVALUABLE gate cannot be marked as having cleared its launch
gates, but the gate is not recorded as failed, and launch is not permanently blocked — evaluation resumes at the
close of each subsequent rolling-30-day window, using the same threshold, until the count is reached.

| Field | Content |
|---|---|
| Rationale | A threshold not being reached because of insufficient traffic is evidence of a demand/volume problem, not a conversion/quality problem — collapsing the two into "failed" would misdiagnose the issue and could drive the wrong corrective action (e.g., changing the product instead of increasing acquisition spend). |
| Interaction with PDEF-2/PDEF-3/ES | Does not alter PCG-1/PCG-2's 500/50 thresholds; only defines the state when they are not yet reached, a question PDEF-3 left open. |
| Trade-off | This rule has no explicit maximum wait: if traffic never reaches the threshold, launch eligibility for the dependent tier never resolves. No escalation/maximum-wait rule is adopted here, to avoid inventing a further numeric policy beyond what was asked; a future amendment may add one if needed. |
| Implementation work required later | None by this decision alone; requires instrumentation to detect sample sufficiency at window close. |

### 6.6 Q6 — Late refunds

**DECISION:** Each PCG-5 evaluation is scoped to the specific rolling-30-day-from-purchase window it was computed
over, and is immutable once recorded. A refund issued after that window closes is attributed to whichever later
window its purchase's own 30-day-from-purchase period falls into, if any; it does not retroactively alter an
already-closed evaluation. PCG-5 continues to be evaluated on an ongoing rolling basis for monitoring, consistent
with its §6.3 classification as monitoring rather than a launch blocker.

| Field | Content |
|---|---|
| Rationale | An immutable, window-scoped evaluation is deterministic and auditable. A retroactively-reopening rule would leave every historical PCG-5 evaluation permanently provisional, which is operationally unstable; because PCG-5 is monitoring-only under §6.3, the practical launch stakes of this choice are low, but the deterministic rule is adopted regardless, for reporting integrity. |
| Interaction with PDEF-2/PDEF-3/ES | Uses PDEF-3's existing "rolling 30 days from purchase" window definition without altering it. |
| Trade-off | If a future amendment reclassifies PCG-5 as a hard blocker, this immutability rule becomes more consequential, since a favorable early evaluation could be used to justify a launch decision before a less favorable later window is observed. Accepted as the deterministic default; a future amendment could add a bounded retroactive-revision rule if the severity classification changes. |
| Implementation work required later | None by this decision alone; requires refund-event instrumentation attributing each refund to its correct window. |

### 6.7 Q7 — Dual-tier users

**DECISION:** A user holding both ₹499 and ₹1,499 is counted exactly **once** in the combined Client-Finder-
specific population for every combined-primary gate (PCG-2, PCG-4, PCG-5, PCG-6). The same user is additionally
attributed to **both** tiers' per-tier diagnostic buckets (non-exclusively — i.e., appearing once in each tier's
diagnostic row, not split or prorated between them), since both entitlements are genuinely active per ES-1.
Tier-specific gates measuring a specific transition (PCG-1 funnel entry, PCG-3A, PCG-3B) attribute the user
according to the specific transition each gate measures, independent of this rule.

| Field | Content |
|---|---|
| Rationale | This is the option consistent with both ES-1 (both entitlements genuinely active and coexisting) and PDEF-3's combined-primary-gate rule (the combined population must not double-count a single user). Attributing diagnostics by "higher tier only" was considered and rejected: ES-8 decides that both credit limits remain independently available, meaning a dual-tier user may be actively drawing on both buckets, so excluding them from the ₹499 diagnostic would understate ₹499's actual usage and mask real per-tier signal. |
| Interaction with PDEF-2/PDEF-3/ES | Directly implements ES-11's deferral of this question to PDEF-4; preserves ES-1/ES-7/ES-8 and PDEF-3 §12's combined-primary/per-tier-diagnostic structure without altering either. |
| Trade-off | Per-tier diagnostic totals will not sum to the combined population total when dual-tier users exist — this is intentional, not an error, and any report using this data must label diagnostic totals as non-exclusive membership, not a partition of the combined population. |
| Implementation work required later | None by this decision alone; requires instrumentation capable of identifying dual-tier holders and attributing them per this rule. |

### 6.8 Q8 — Per-tier diagnostics

**DECISION:** Per-tier diagnostic results **cannot** block launch, regardless of how divergent they are from the
combined primary gate's result. They remain diagnostic/informational only. This closes PDEF-3 §12's "unless
separately decided" clause in the non-blocking direction.

| Field | Content |
|---|---|
| Rationale | PDEF-3 §12 already defaults to diagnostics-only; introducing a numeric blocking threshold here would be a new policy value with no principled basis supplied by any governing record, and the preparation record explicitly warned against silently converting diagnostic reporting into a new commercial gate. Resolving the open clause by preserving the existing default is the option best supported by the governing chain as written. |
| Interaction with PDEF-2/PDEF-3/ES | Definitively resolves the one explicit open item PDEF-3 §12/§15 left for a future decision, without altering PDEF-3's text or any threshold. |
| Trade-off | A tier can launch with a materially worse per-tier outcome on a monitoring-classified gate (PCG-4/5/6, per §6.3) than the combined figure suggests, and nothing in this policy stops that tier's launch. If this trade-off proves unacceptable in practice, a future amendment could introduce an explicit numeric diagnostic-escalation threshold — none is adopted here. |
| Implementation work required later | None by this decision alone. |

### 6.9 Q9 — Lifecycle

**DECISION:** The four §6.3 HARD LAUNCH BLOCKER gates (PCG-1, PCG-2, PCG-3A, PCG-3B) govern **both** launch
qualification and ongoing post-launch monitoring — they do not stop being tracked once a tier has launched. The
three §6.3 MONITORING/OPTIMIZATION gates (PCG-4, PCG-5, PCG-6) govern **post-launch optimization only** and are
never used as a launch-qualification precondition.

| Field | Content |
|---|---|
| Rationale | This is the direct lifecycle consequence of the §6.3 severity classification; stating it explicitly prevents any ambiguity about whether a blocker gate's role ends at the moment of launch (it does not). |
| Interaction with PDEF-2/PDEF-3/ES | No interaction beyond consuming §6.3's classification; no PDEF-3 figure is altered. |
| Trade-off | This decision does not introduce a separate controlled/QA launch phase distinct from general availability (an option the preparation record raised as possible, citing T99-5's "QA / controlled launch" label), because no governing record defines what such a phase would require; a future amendment could add one explicitly if needed. |
| Implementation work required later | None by this decision alone; requires ongoing measurement infrastructure for all six gates post-launch, not just the four blocker gates. |

### 6.10 Q10 — Instrumentation prerequisite

**DECISION:** For the four §6.3 HARD LAUNCH BLOCKER gates (PCG-1, PCG-2, PCG-3A, PCG-3B): instrumentation
producing each metric must (a) exist in production and (b) have passed an independent validation step — distinct
from the engineering team that built the instrumentation — before that gate may be used for a launch-qualification
decision. For the three §6.3 MONITORING/OPTIMIZATION gates (PCG-4, PCG-5, PCG-6): instrumentation must be
implemented, but independent validation is not required as a precondition to using those gates for post-launch
monitoring.

| Field | Content |
|---|---|
| Rationale | Proportionate to stakes: an instrumentation error in a gate that directly decides a real launch could incorrectly green-light or withhold that launch, which independent validation specifically guards against; requiring the same bar for monitoring-only dashboards would add cost without a correspondingly high-stakes decision riding on the result. |
| Interaction with PDEF-2/PDEF-3/ES | None of PDEF-2/PDEF-3/ES is altered; this is purely a sequencing/evidentiary-bar policy for how the already-adopted gates may be used. |
| Trade-off | "Independent validation" is deliberately left undefined as to method or validator (e.g., which team, what process) — specifying that would begin to design the instrumentation itself, which this decision keeps explicitly out of scope (see §9). Engineering leadership must separately define the validation method before this prerequisite can actually be satisfied. |
| Implementation work required later | Yes — directly implicates building the instrumentation for all six gates (§4.2 T99-4 per `PROJECT_MASTER_CHECKLIST.md`) and defining/performing independent validation for the four blocker gates. **Deciding this policy does not itself authorize, schedule, or perform any of that work** (see §9). |

## 7. Deferred / open items (not decided by this record)

1. The exact independent-validation method/validator for Q10's blocker-gate instrumentation — left for separate
   engineering definition, as noted in §6.10.
2. Whether to add a maximum-wait/escalation rule to Q5's NOT YET EVALUABLE state — not adopted here; may be
   addressed by a future amendment if needed.
3. Whether to introduce a numeric diagnostic-escalation threshold for Q8 if the non-blocking default later proves
   commercially unacceptable — not adopted here.
4. Whether a separate controlled/QA launch phase distinct from general availability should exist (Q9) — not
   adopted here; no governing record defines one.
5. Credit-ledger mechanics, overage/enterprise mechanisms — remain undesigned per PDEF-2/entitlement stacking;
   untouched by this record.
6. Subscription renewal/expiry/cancellation/downgrade — remains out of MVP per ES-9 and `MVP_SCOPE_BOUNDARY.md`
   §6.5; untouched.

## 8. Dependencies

| Dependency | Status |
|---|---|
| Instrumentation to measure PCG-1..6 | Not designed, built, or authorized by this record (§9). Directly required by §6.10. |
| Independent validation method for blocker-gate instrumentation | Not defined by this record; separate engineering/process definition required. |
| Credit-ledger / overage mechanics | Remain undesigned; unaffected by this record. |
| Deployment / release authority (K1-10) | Remains **NOT AUTHORIZED**; this record's decisions do not change that status in any way. |

## 9. Explicit authorization boundaries

**Deciding PDEF-4 Q1–Q10 in this record grants NONE of the following, under any circumstance:**

- Implementation authority (no code, test, schema, or migration change is authorized or performed).
- Instrumentation implementation authority (building the measurement described in §6.10 is not authorized).
- Billing or credit-ledger implementation authority.
- Validation authority (performing the independent validation described in §6.10 is not authorized by naming the
  requirement for it).
- Provider/API-call authority or external-research authority.
- Deployment or release authority — **K1-10 remains explicitly NOT AUTHORIZED**, unaffected by K1's
  implementation/validation completion and unaffected by PDEF-4 now being decided.
- Production-traffic or launch authority — no tier is authorized to launch by virtue of this record; this record
  states the *policy* a launch decision must satisfy, not an authorization to make that launch decision or to act
  on it.
- Commit or push authority — this task performs neither.

No authority of any kind is inferred merely from PDEF-4 having moved from NOT DECIDED to DECIDED. This record
does not modify `CLIENT_FINDER_PDEF_4_PRODUCT_OWNER_ADOPTION_QUESTIONNAIRE.md`,
`CLIENT_FINDER_PDEF_4_ANALYST_RECOMMENDATION.md`,
`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_COMPLETION_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION_PREPARATION.md`, PDEF-2, PDEF-3, entitlement stacking, the PRD, the
catalog, `PROJECT_MASTER_CHECKLIST.md`, `MVP_SCOPE_BOUNDARY.md`, any K1 record, or any code, test, schema,
migration, configuration, or dependency. It is not committed or pushed.

**Next governance action:** If human Product Owner ratification of these delegated decisions is desired before
they are treated as final for commercial purposes, that ratification should be recorded as an explicit amendment
to this record, stating the human Product Owner's review and either confirmation or revision of §6. Separately,
and only after any such ratification: instrumentation design/build (§6.10, §8), the independent-validation method,
and deployment/release authorization (K1-10) each require their own distinct, explicit authorization — none is
performed or granted here.
