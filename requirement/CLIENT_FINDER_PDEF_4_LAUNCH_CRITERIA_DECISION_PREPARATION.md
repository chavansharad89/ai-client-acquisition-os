# Client Finder / Client Intent Discovery — PDEF-4 Launch Criteria Decision Preparation

**Record ID:** CLIENT-FINDER-PDEF-4-LAUNCH-CRITERIA-DECISION-PREPARATION-001
**Date:** 2026-10-04
**Type:** read-only decision-preparation record. **Not a decision record. Not a Product Owner decision. Grants no
implementation, validation, deployment, or launch authority of any kind** (see §11).

---

## 1. Objective

To assemble, from existing repository records only, the facts, sourcing, and open questions needed for the Product
Owner to decide **PDEF-4** (launch criteria per tier), now that **PDEF-2** (product definition) and **PDEF-3**
(commercial gates) are both decided. This record prepares that decision. It does not make it, and it does not
authorize any analytics implementation, instrumentation, billing change, deployment, release, or production traffic.

## 2. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` — unchanged |
| Staged files | 0 |
| Working tree before this record | 6 untracked files: `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md`, `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION_PREPARATION.md` |
| PDEF-3 completion decision record | Present; SHA-256 verified `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` — matches the expected hash |
| PDEF-2 decision record | Present; SHA-256 `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | Present; SHA-256 `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |
| PRD V2.2 | Searched for "launch criteria," "launch gate," "launch readiness," and "PDEF-4" — **no matches found**. PDEF-4 is not defined, described, or referenced in any PRD version. |
| Existing PDEF-4 decision or equivalent launch-criteria record | None found prior to this record |
| File created by this record | this file only |

## 3. Governing records consulted

| Record | SHA-256 | Role |
|---|---|---|
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` | DECIDED product-definition facts (§4 below). Not modified. |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97` | Partial PDEF-3 decision (PCG-1/2 thresholds; PCG-3 structural split). Superseded on the numeric items by the completion record below. Not modified. |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` | `5fd2f94c74e17ba6ed9fb11ea5a8db5bb38b6e451b0ebc4558e951dc269f8a7c` | Full PDEF-3 policy decision (§5 below). Not modified. |
| `requirement/PROJECT_MASTER_CHECKLIST.md` §4.1, §4.2–§4.4 | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` | States PDEF-4's dependency on PDEF-2/PDEF-3 and lists the tasks (T99-5, T499-4, T1499-4/5) that are themselves blocked on PDEF-4. Does not define any launch-criteria content. Not modified. |
| PRD V2.0 / V2.1 / V2.2 | — | Searched for any launch-criteria concept. **NOT FOUND** in any version. Not modified. |

## 4. PDEF-2 inputs (DECIDED, not reopened)

- Client Finder belongs in both ₹499 and ₹1,499; bundled into both tiers' entitlements.
- ₹499 = Basic Client Finder access; ₹1,499 = Advanced Client Finder access.
- Either tier is independently purchasable (no sequential-purchase requirement).
- ₹499 = 50 monthly lead-unlock credits; ₹1,499 = 300 monthly lead-unlock credits, resetting each billing cycle.
- The credit accounting/overage mechanism itself remains separately undesigned.

## 5. PDEF-3 inputs (DECIDED, not reopened)

Per `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`:

- **PCG-1:** 500 qualified visitors. Definition of "qualified visitor" is DECIDED (that record §10/§13, copied verbatim in §9 below).
- **PCG-2:** ≥ 50 buyers.
- **PCG-3A:** ≥ 10% ₹99 → ₹499 conversion; population = Client-Finder-specific, among eligible ₹99 users exposed to the ₹499 offer; window = rolling 30 days.
- **PCG-3B:** ≥ 5% eligible-entry → ₹1,499 conversion; population = Client-Finder-specific, among eligible users exposed to the ₹1,499 offer; window = rolling 30 days.
- **PCG-4:** ≥ 60% useful outcome. Definition is DECIDED (copied verbatim in §9 below).
- **PCG-5:** ≤ 8% refund rate; window = rolling 30 days from purchase.
- **PCG-6:** ≥ 70% completion. Definition is DECIDED (copied verbatim in §9 below). Credit usage does **not** determine completion (explicit Product Owner "No").
- **Cross-gate rule:** measurement is Client-Finder-specific; where a gate applies to both tiers, the combined population is the primary gate, with per-tier results reported as a diagnostic only — tier-level diagnostics do not themselves constitute a separate pass/fail gate unless separately decided.
- **Default measurement window:** rolling 30 days (with PCG-5/PCG-6 using the stated variants above).

None of these figures, definitions, or rules is redesigned, reinterpreted, or reopened by this record.

## 6. PDEF-4 dependency chain

```
Product Definition (PDEF-1, PDEF-2 — DECIDED)
        |
Commercial Gates (PDEF-3 — DECIDED: PCG-1..6 thresholds, populations, windows, definitions)
        |
Measurement Readiness (instrumentation to actually observe PCG-1..6 against real traffic)
        |            <- NOT ADDRESSED by PDEF-2 or PDEF-3; no governing record authorizes or designs this
Launch Criteria (PDEF-4 — THIS RECORD'S SUBJECT; NOT STARTED per checklist §4.1)
        |
Deployment Authority (K1-10 / equivalent release gate — NOT AUTHORIZED per existing K1 records)
        |
Launch (T99-5, T499-4, T1499-4/5 — all NOT STARTED, each blocked on PDEF-4 per checklist §4.2–§4.4)
```

`PROJECT_MASTER_CHECKLIST.md` §4.1 states PDEF-4's dependency as "PDEF-2, PDEF-3" with status **NOT STARTED** and
blocker "Depends on PDEF-2, PDEF-3." With both now decided, PDEF-4 is **unblocked for Product Owner decision**, but
**not decided by that fact alone** — no governing record supplies PDEF-4's content, and none of §4.2–§4.4's
downstream tasks (T99-5, T499-4, T1499-4, T1499-5) can start until PDEF-4 itself is decided.

## 7. What the governing records actually require PDEF-4 to decide

No governing record (PDEF-2, PDEF-3, the PRD in any version, or the checklist) states explicit launch-criteria
content. The checklist names PDEF-4 only as "Launch criteria per tier," dependent on PDEF-2 and PDEF-3, with no
further specification. Accordingly, the questions below are derived from what PDEF-3's gate structure and the
checklist's downstream task list **necessarily imply must be decided** before those downstream tasks (T99-5, T499-4,
T1499-4/5 — each explicitly blocked on PDEF-4) can proceed — not from invented best practice. Each is labeled by
whether it is governed, and if not, whether it is a necessary implication or merely an analyst proposal.

### Q1 — Must all PCG gates pass simultaneously, or is launch conditioned on a subset?

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** PDEF-3 adopts six gates with thresholds but does not state whether launch requires all six, a subset, or a minimum combination. |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §7–§12 (adopts each gate independently; no all-or-subset rule stated); `PROJECT_MASTER_CHECKLIST.md` §4.2–§4.4 (T99-5/T499-4/T1499-4/5 each list PDEF-4 as a dependency without specifying which gates apply to which task) |
| Product Owner decision required | Yes — this is a necessary implication of having six adopted gates and tier-specific launch tasks (T99-5 for ₹99, T499-4 for ₹499, T1499-4/5 for ₹1,499) |
| Decision options | (i) All applicable gates must pass for a tier to launch; (ii) a named subset must pass; (iii) gates are advisory/monitoring only and do not block launch; (iv) defer |
| Analyst proposal | None offered — no option is recommended |

### Q2 — Minimum observation/cohort period before a gate can be evaluated for launch purposes

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** PDEF-3 fixes a rolling-30-day *measurement* window per gate but does not state how many such windows, or what minimum elapsed time/sample size, must be observed before a launch decision can be made from the results. |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §12 (defines the measurement window, not an observation/launch-evaluation period) |
| Product Owner decision required | Yes — necessary to operationalize "has this tier passed its gates" as opposed to merely "how is a single 30-day window measured" |
| Decision options | (i) One full rolling-30-day window; (ii) a longer minimum period (e.g., multiple consecutive windows); (iii) no minimum — launch decision may be made as soon as any window closes; (iv) defer |
| Analyst proposal | **ANALYST PROPOSAL — NOT DECIDED:** a single 30-day window may be sensitive to early-cohort noise, particularly for PCG-1/PCG-2 which require minimum counts (500 visitors, 50 buyers) that could be reached unevenly; this is noted only because it could matter to the Product Owner's choice, not as a recommendation. |

### Q3 — Are PCG gates launch blockers, or post-launch monitoring targets?

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §17 states PDEF-3 does not itself decide PDEF-4 or launch criteria; it adopts the gates as commercial policy but does not state their functional role in a launch decision. |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §16, §17 |
| Product Owner decision required | Yes |
| Decision options | (i) Gates are hard launch blockers (a tier may not launch to general availability until its applicable gates pass); (ii) gates are monitoring targets only, tracked post-launch without blocking; (iii) some gates block, others monitor — specify which; (iv) defer |
| Analyst proposal | None offered |

### Q4 — Does launch require every tier (₹99, ₹499, ₹1,499) or can tiers launch independently?

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** PDEF-2 establishes independent purchasability of ₹499/₹1,499 as a *commercial* rule; no record extends that to a *launch-sequencing* rule. |
| Evidence | `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` §10 (independent purchase, not launch sequencing); `PROJECT_MASTER_CHECKLIST.md` §4.2–§4.4 (T99-5, T499-4, T1499-4/5 are listed as separate tasks per tier, with no stated ordering or joint-launch requirement between them) |
| Product Owner decision required | Yes |
| Decision options | (i) Each tier launches independently once its own applicable gates clear; (ii) all three tiers must clear together; (iii) some other grouping (e.g., ₹499 and ₹1,499 together, ₹99 separately); (iv) defer |
| Analyst proposal | **ANALYST PROPOSAL — NOT DECIDED:** since PDEF-2 treats ₹499/₹1,499 as independently purchasable and PCG-1/PCG-4 are named specifically against the ₹99 tier (per the preparation record referenced in `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md` §7), independent per-tier launch may be structurally consistent with those existing decisions — this is an observation, not a recommendation, and is not adopted here. |

### Q5 — Treatment of insufficient sample size within the measurement window

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** No record states what happens if, e.g., fewer than 500 visitors or 50 buyers are observed within a rolling-30-day window (gate not yet evaluable vs. gate failed vs. window extended). |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §5–§11 (thresholds and windows stated; no sample-insufficiency rule) |
| Product Owner decision required | Yes — necessary because PCG-1/PCG-2 are absolute count thresholds, not rates, and a 30-day window may not reach them |
| Decision options | (i) Insufficient sample = gate not yet evaluable, launch decision deferred; (ii) insufficient sample = treated as not-passed; (iii) extend the window until the sample is reached; (iv) defer |
| Analyst proposal | None offered |

### Q6 — Treatment of refunds that occur after the measurement window closes

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** PCG-5's window is "rolling 30 days from purchase," but no record states whether a refund issued after that window retroactively affects an already-closed evaluation, or how frequently PCG-5 is re-evaluated. |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §10, §12 |
| Product Owner decision required | Yes, if PCG-5 is a launch blocker (see Q3); otherwise may be moot |
| Decision options | (i) Only refunds within the 30-day window count, regardless of later refunds; (ii) a later refund retroactively reopens the evaluation; (iii) PCG-5 is continuously re-evaluated on a rolling basis rather than evaluated once; (iv) defer |
| Analyst proposal | None offered |

### Q7 — Treatment of users who purchase/use both ₹499 and ₹1,499

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** The cross-gate rule (§12 of the completion decision) states combined-population measurement with per-tier diagnostics, but does not state how a user who holds both tiers is counted (once in the combined pool, or in each tier's diagnostic bucket, or both). |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §12 |
| Product Owner decision required | Yes, only to the extent per-tier diagnostics or launch decisions depend on de-duplication |
| Decision options | (i) Counted once in the combined population regardless of tier(s) held; (ii) counted in each tier's diagnostic bucket separately (double-counted for diagnostics only, not for the combined gate); (iii) another rule; (iv) defer |
| Analyst proposal | None offered |

### Q8 — Can diagnostic (per-tier) results block launch even though the combined gate passes?

| Field | Value |
|---|---|
| Current governing state | **DECIDED, as far as it goes:** `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §12 states explicitly that "tier-level diagnostic reporting does not itself create an additional pass/fail gate unless separately decided." That "unless separately decided" clause is itself unresolved. |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §12, §15 (item 3: "Whether tier-level diagnostic reporting... should ever become its own separate pass/fail gate — explicitly left as a future decision, not decided here.") |
| Product Owner decision required | Yes — to close the "unless separately decided" clause either way |
| Decision options | (i) Diagnostics remain informational only, never block launch; (ii) a severe enough per-tier diagnostic divergence can block launch even if the combined gate passes — if so, specify the threshold; (iii) defer |
| Analyst proposal | None offered |

### Q9 — Do the gates apply to initial launch, or to post-launch optimization only?

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED.** No record states whether PCG-1..6 are preconditions for the *first* general-availability launch of a tier's Client Finder capability, or targets evaluated only after an initial launch has already occurred (e.g., a soft/controlled launch preceding gate evaluation). |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` (silent on launch sequencing); `PROJECT_MASTER_CHECKLIST.md` §4.2 T99-5 ("QA / controlled launch") suggests a controlled-launch phase may already be contemplated as distinct from general availability, but this is not stated as governing for PDEF-4 |
| Product Owner decision required | Yes |
| Decision options | (i) Gates must be met before any general-availability launch, following an earlier controlled/QA phase that does not itself require gate-passage; (ii) gates apply to general-availability launch only, with no separate controlled phase; (iii) gates apply continuously, including pre- and post-launch; (iv) defer |
| Analyst proposal | None offered |

### Q10 — Must instrumentation be implemented and independently validated before launch can be evaluated?

| Field | Value |
|---|---|
| Current governing state | **PENDING / UNDEFINED, but flagged as a hard practical dependency.** No PCG-1..6 gate can be evaluated without instrumentation to measure qualified visitors, buyers, conversions, refunds, useful-outcome reports, and completion events — none of which exists yet or is authorized by PDEF-2/PDEF-3. |
| Evidence | `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §15 item 1 ("Instrumentation/analytics design needed to actually measure any of the above (explicitly out of scope)"), §17 ("grants no implementation, analytics, instrumentation... authority of any kind"); `PROJECT_MASTER_CHECKLIST.md` §4.2 T99-4 ("Instrumentation for proposed gate metrics," status SCOPE-DEPENDENT, "after PDEF-3") |
| Product Owner decision required | Yes — specifically, whether PDEF-4 itself requires instrumentation to be built and validated as a precondition stated within the launch-criteria decision, or whether that is left as separate downstream engineering work triggered by PDEF-4's other content |
| Decision options | (i) PDEF-4 explicitly requires instrumentation to be implemented and independently validated before any gate can be used to permit launch; (ii) PDEF-4 is decided at the policy level now, with instrumentation as separate downstream engineering work not gated by this decision; (iii) defer |
| Analyst proposal | **ANALYST PROPOSAL — NOT DECIDED:** since no gate can be observed without instrumentation, some sequencing decision on this point is likely unavoidable before T99-4 (instrumentation) or any T*-5/T*-4 (launch) task can proceed — this is noted as a practical dependency, not proposed as a specific policy. |

## 8. Separation of decided vs. undefined vs. analyst material

| Category | Items |
|---|---|
| **Already decided** (PDEF-2/PDEF-3, not reopened) | Tier structure, bundling, independent purchase, credit caps (§4); PCG-1..6 thresholds, populations, windows, and the three definitions (§5) |
| **Still undefined** (PDEF-4 questions, §7) | Q1–Q10 above — none inferred from common product practice; each recorded as PENDING / UNDEFINED pending explicit Product Owner input |
| **Analyst proposals** (clearly separated, not policy) | Noted under Q2, Q4, and Q10 only; labeled `ANALYST PROPOSAL — NOT DECIDED` in each case; not silently added to any PDEF-4 content |

## 9. Definitions carried forward verbatim (not rewritten)

Per `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §13 (and §9/§11 for the longer gate-specific definitions):

- **"Qualified visitor":** A unique visitor who (1) enters the Client Finder product funnel; (2) has demonstrated
  intent to evaluate or use Client Finder rather than merely viewing unrelated site content; and (3) satisfies the
  product's minimum eligibility criteria for the applicable Client Finder tier. A visitor is counted only once
  within the applicable measurement window.
- **"Useful outcome":** A user achieves a useful outcome when the Client Finder produces at least one qualified
  opportunity that the user considers actionable and that satisfies the user's configured target criteria, including
  the requested service, target customer characteristics, and minimum project-value requirements.
- **"Completion":** A user completes the Client Finder workflow when they complete the required workflow from
  defining or confirming their targeting criteria through receiving at least one qualified opportunity and reaching
  the product-defined opportunity review/action step. Completion does not require purchasing credits beyond the
  included monthly allocation and does not require winning or closing a client.

## 10. Explicit unresolved dependencies

1. Q1–Q10 above (all PENDING / UNDEFINED).
2. Instrumentation/analytics implementation to actually measure PCG-1..6 — not designed, authorized, or scheduled by
   this record (§7 Q10; `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §15 item 1).
3. The credit accounting/overage mechanism — separately undesigned per PDEF-2 §17; irrelevant to PCG-6 per the
   explicit "No" dependency decision, but still an open item for other product purposes.
4. Deployment/release authority (K1-10 or equivalent) — not addressed by PDEF-2, PDEF-3, or this record; remains a
   separate gate even after PDEF-4 is decided.

## 11. No authorization statement

**This record grants no authorization of any kind.** It does not decide any PDEF-4 question; does not adopt, imply,
or recommend any launch-blocking rule, observation period, sample-size treatment, refund-window treatment, dual-tier
user treatment, diagnostic-escalation rule, launch-sequencing rule, or instrumentation-sequencing rule; does not
design or authorize instrumentation, analytics, billing, deployment, release, or production traffic; and does not
modify PDEF-2, PDEF-3, the PRD, the catalog, `PROJECT_MASTER_CHECKLIST.md`, any K1 record, or any code, test, schema,
migration, configuration, or dependency. It is a read-only preparation record assembled from the governing records
cited in §3, for the Product Owner's use in deciding PDEF-4. No PDEF-4 decision record is created by this task.

**Next governance action:** Product Owner review and decision of Q1–Q10 above (adopt, redefine, or defer each),
after which a separate `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` record may be prepared — followed, only
then, by any separate instrumentation-planning and deployment-authorization decisions, neither of which is addressed
or authorized here.
