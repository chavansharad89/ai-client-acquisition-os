# Client Finder / Client Intent Discovery — PDEF-3 Completion Decision

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `CLIENT-FINDER-PDEF-3-COMPLETION-PO-DEC-001` |
| Date | 2026-10-04 |
| Type | Governance decision record — recording only. **Not an implementation, validation, deployment, or release authorization** (see §16). |
| Decision status | **PDEF-3 NOW FULLY DECIDED AT THE POLICY LEVEL.** The Product Owner has explicitly supplied an Adopt decision, threshold, measurement population, and measurement window for PCG-3A, PCG-3B, PCG-4, PCG-5, and PCG-6; a definition for "qualified visitor," "useful outcome," and "completion"; a cross-gate measurement rule; a default measurement window; and an explicit No on the PCG-6 credit-usage dependency. These are recorded below exactly as supplied, without improvement, reinterpretation, or added values. |

## 2. Decision authority

**Product Owner.** All values in §7–§13 were supplied directly by the Product Owner in response to a structured
questionnaire and are recorded here verbatim. No blank, unselected, or unsupplied field from any prior round of this
questionnaire is treated as decided; this record reflects only the explicit answers actually given in this round.

## 3. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged) |
| Staged files | 0 |
| Working tree before this record | 6 untracked files, including a prior draft of this same file (recording all items as PENDING/UNDEFINED, since no values had yet been supplied) — this record supersedes that draft's content at the same path |
| File updated by this record | this file only |

## 4. Governing sources (hashes verified at baseline, unchanged by this record)

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` | `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97` |
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md` | `70e4590463ffa139bf9a726466a13ae120e30f3d79ecc9bdda445d0025a06f42` |
| `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION_PREPARATION.md` | `939277115e0000b1e3d423eb257d634bc64c45ef455575959ca2398c587545e6` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |

None of these records is modified by this decision record.

## 5. PCG-1 — inherited status (not reopened)

| Field | Value |
|---|---|
| Threshold | **500 qualified visitors** — DECIDED (inherited from `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` §6; reconfirmed by the Product Owner in §13 below) |
| Definition of "qualified visitor" | **DECIDED** — see §10 below |
| Measurement window / population | Default rolling-30-days window applies per §12/§13; population is "Client-Finder-specific" per the cross-gate rule (§11), to the extent PCG-1 is read against the Client Finder funnel entry |

## 6. PCG-2 — inherited status (not reopened)

| Field | Value |
|---|---|
| Threshold | **≥ 50 buyers** — DECIDED (inherited from `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md` §7; reconfirmed by the Product Owner in §13 below) |
| Measurement scope | **Client-Finder-specific**, per the cross-gate measurement rule (§11) |
| Measurement window | Default rolling 30 days (§12) |

## 7. PCG-3A decision — ₹99 → ₹499 conversion rate

| Field | Value |
|---|---|
| Status | **DECIDED — ADOPTED** |
| Threshold | **≥ 10%** |
| Measurement population | Client-Finder-specific, measured among eligible ₹99 purchasers/users exposed to the ₹499 offer |
| Measurement window | Rolling 30 days |

## 8. PCG-3B decision — ₹99 / eligible entry → ₹1,499 conversion rate

| Field | Value |
|---|---|
| Status | **DECIDED — ADOPTED** |
| Threshold | **≥ 5%** |
| Measurement population | Client-Finder-specific, measured among eligible users exposed to the ₹1,499 offer. The ₹1,499 tier remains independently purchasable and does not require ₹499 ownership (consistent with PDEF-2). |
| Measurement window | Rolling 30 days |

## 9. PCG-4 decision — useful outcome

| Field | Value |
|---|---|
| Status | **DECIDED — ADOPTED** |
| Threshold | **≥ 60%** |
| Definition of "useful outcome" | A user achieves a useful outcome when the Client Finder produces at least one qualified opportunity that the user considers actionable and that satisfies the user's configured target criteria, including the requested service, target customer characteristics, and minimum project-value requirements. |
| Measurement population | Client-Finder-specific, across ₹499 and ₹1,499 users; reported separately by tier as a diagnostic (not a separate gate — see §11) |
| Measurement window | Rolling 30 days |

## 10. PCG-5 decision — refund rate

| Field | Value |
|---|---|
| Status | **DECIDED — ADOPTED** |
| Maximum acceptable refund rate | **≤ 8%** |
| Measurement population | Client-Finder-specific purchasers across ₹499 and ₹1,499; reported separately by tier as a diagnostic (not a separate gate — see §11) |
| Measurement window | Rolling 30 days from purchase |

## 11. PCG-6 decision — completion

| Field | Value |
|---|---|
| Status | **DECIDED — ADOPTED** |
| Threshold | **≥ 70%** |
| Definition of "completion" | A user completes the Client Finder workflow when they complete the required workflow from defining or confirming their targeting criteria through receiving at least one qualified opportunity and reaching the product-defined opportunity review/action step. Completion does not require purchasing credits beyond the included monthly allocation and does not require winning or closing a client. |
| Measurement population | Client-Finder-specific, across ₹499 and ₹1,499 users; reported separately by tier as a diagnostic (not a separate gate — see §12) |
| Measurement window | Rolling 30 days from first Client Finder activation |
| Credit-usage dependency | **DECIDED — NO.** PCG-6 completion does not depend on exhausting or consuming the monthly lead-unlock credits. The credit mechanism remains governed by PDEF-2 (₹499: 50 credits/month; ₹1,499: 300 credits/month). Detailed credit accounting, overage pricing, and enterprise scaling remain separate, undesigned future product-design decisions — not designed, altered, or implied by this record. |

## 12. Cross-gate measurement rule and default window — DECIDED

| Field | Value |
|---|---|
| Cross-gate rule | Commercial gates are **Client-Finder-specific**. Where a gate applies to both ₹499 and ₹1,499 (PCG-2, PCG-4, PCG-5, PCG-6), the primary gate is measured across the **combined** Client Finder population, with results also reported **separately by tier for diagnostic purposes only**. Tier-level diagnostic reporting does not itself create an additional pass/fail gate unless separately decided. |
| Default measurement window | **Rolling 30 days.** The applicable event timestamp determines cohort membership; the same user must not be double-counted within the same measurement window. |
| Per-gate window overrides | PCG-5 uses "rolling 30 days from purchase"; PCG-6 uses "rolling 30 days from first Client Finder activation" (both stated explicitly above); all other gates use the unqualified rolling-30-day default. |

## 13. Definitions — DECIDED

| Term | Definition |
|---|---|
| "Qualified visitor" | A unique visitor who (1) enters the Client Finder product funnel; (2) has demonstrated intent to evaluate or use Client Finder rather than merely viewing unrelated site content; and (3) satisfies the product's minimum eligibility criteria for the applicable Client Finder tier. A visitor is counted only once within the applicable measurement window. |
| "Useful outcome" | See §9. |
| "Completion" | See §11. |

## 14. Explicit confirmation of carried-forward and newly decided items

| Item | Status |
|---|---|
| PCG-1: 500 qualified visitors | Already decided (reconfirmed, not reopened) |
| PCG-2: ≥ 50 buyers | Already decided (reconfirmed, not reopened) |
| PCG-3 sequential ₹499 → ₹1,499 framing | Rejected (reconfirmed, not reopened); PCG-3 remains split into independent PCG-3A and PCG-3B |
| PCG-3A | **DECIDED: ≥ 10%** (§7) |
| PCG-3B | **DECIDED: ≥ 5%** (§8) |
| PCG-4 | **DECIDED: ≥ 60% useful outcome** (§9) |
| PCG-5 | **DECIDED: ≤ 8% refund rate** (§10) |
| PCG-6 | **DECIDED: ≥ 70% completion** (§11) |
| Client Finder commercial measurement population | **DECIDED: Client-Finder-specific** (§12) |
| Default measurement window | **DECIDED: rolling 30 days** (§12) |
| PCG-6 credit-usage dependency | **DECIDED: No** (§11) |
| PDEF-2 (bundling, independent purchase, differentiated access, 50/300 monthly credits) | Already decided; not reopened |

No item above was inferred from a prior proposal; each reflects the explicit value supplied by the Product Owner in
this round. The previously circulated figures of 10% (for PCG-3B specifically — now superseded by the explicit
5% decision), 60%, 8%, and 70% are adopted here **only because the Product Owner explicitly selected them in this
round**, not because they were previously proposed.

## 15. Remaining open items

None of the six commercial gates (PCG-1 through PCG-6) remain pending. The following remain open as **separate,
future, non-commercial-gate work**, not decided and not authorized by this record:

1. Instrumentation/analytics design needed to actually measure any of the above (explicitly out of scope — §16).
2. The credit accounting/overage/enterprise-scaling mechanism itself (explicitly undesigned per PDEF-2 §17; not
   reopened or designed here).
3. Whether tier-level diagnostic reporting (§12) should ever become its own separate pass/fail gate — explicitly
   left as a future decision, not decided here.

## 16. PDEF-4 dependency

`PROJECT_MASTER_CHECKLIST.md` records PDEF-4 (launch criteria per tier) as depending on PDEF-2 and PDEF-3. PDEF-2 is
decided. **PDEF-3 is now decided at the policy level by this record** (all six commercial gates adopted with
thresholds, populations, windows, and required definitions). This record **does not itself decide, authorize, or
advance PDEF-4**; unblocking PDEF-4 requires a separate, explicit Product Owner/governance action using this record
as input. No launch criteria are inferred or implied here.

## 17. Governance / authorization boundaries

**This record grants no implementation, analytics, instrumentation, billing, credit-system, database/schema,
testing, validation, provider/API-call, external-research, deployment, production-traffic, or release authority of
any kind.** Recording the PCG-1..6 policy decisions does not authorize any engineering, commercial, or operational
action. No credit system, overage pricing, analytics instrumentation, billing, conversion funnel, tier entitlement,
or product behavior is designed, altered, or implied by this record. No launch criteria are inferred.

This record does not modify `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`,
`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md`,
`CLIENT_FINDER_PDEF_3_COMPLETION_DECISION_PREPARATION.md`, the PRD, the catalog, `PROJECT_MASTER_CHECKLIST.md`, any
K1 record, or any code, test, schema, migration, configuration, or dependency. It does not decide PDEF-4. It is not
committed or pushed.

**Next governance action:** use this record as input to a separate, explicit decision on unblocking PDEF-4
(launch criteria per tier), and to any future instrumentation/analytics planning needed to actually measure
PCG-1..6 — neither of which is authorized or performed by this record.
