# Client Finder / Client Intent Discovery — PDEF-3 Commercial Gates Decision

## 1. Record metadata

| Field | Value |
|---|---|
| Record ID | `CLIENT-FINDER-PDEF-3-COMMERCIAL-GATES-PO-DEC-001` |
| Date | 2026-10-04 |
| Type | Governance decision record — recording only. **Not an implementation, validation, deployment, or release authorization** (see §18). |
| Overall PDEF-3 status | **PARTIALLY DECIDED.** PCG-1 and PCG-2 are decided at the threshold-value level (definitions/measurement population still pending). PCG-3 is decided at the structural level only (the proposed numeric value is not reconfirmed for the redefined gates — see §8). PCG-4, PCG-5, and PCG-6 remain PENDING / NOT DECIDED, by explicit Product Owner instruction. |

## 2. Decision authority

**Product Owner.** The decisions in §6–§11 were supplied directly by the Product Owner in response to a structured
set of questions and are recorded here exactly as given, without improvement, reinterpretation, or invented values.
Where the Product Owner explicitly chose to leave an item pending, it is recorded as PENDING / NOT DECIDED, not as a
default or inferred value.

## 3. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged) |
| Staged files | 0 |
| Working tree before this record | 3 untracked files: `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md`, `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md` — all verified present with hashes matching their previously recorded values (see §4) |
| Existing PDEF-3 decision record | None found prior to this record |
| File created by this record | this file only |

## 4. Governing sources (hashes verified at baseline, unchanged by this record)

| Record | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md` | `70e4590463ffa139bf9a726466a13ae120e30f3d79ecc9bdda445d0025a06f42` |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` | `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8` |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` |

## 5. PDEF-2 dependency

PDEF-2 is treated as **already decided and is not reopened** by this record. Fixed inputs carried forward from
`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`:

- ₹499: Client Finder included, bundled, Basic access, 50 monthly lead-unlock credits (resets each billing cycle),
  independently purchasable.
- ₹1,499: Client Finder included, bundled, Advanced access, 300 monthly lead-unlock credits (resets each billing
  cycle), independently purchasable, **no prior ₹499 purchase required**.
- The credit/overage accounting mechanism itself remains explicitly undesigned (§14).

This independent-purchase fact is precisely why PCG-3 required a structural decision — see §8.

## 6. PCG-1 decision — qualified visitors

| Field | Value |
|---|---|
| Chosen status | **DECIDED** |
| Chosen threshold | 500 qualified visitors (adopted as proposed, unchanged from the preparation record's candidate figure) |
| Measurement population | PENDING / NOT DECIDED — not supplied |
| Definition | "Qualified visitor" — **PENDING / UNDEFINED** — not supplied |
| Measurement period / window | PENDING / NOT DECIDED — not supplied |
| Per tier or aggregate | As originally proposed, this gate applies to the ₹99 → ₹499 progression specifically; no change to that scope was requested or supplied |
| Dependencies | Requires the "qualified visitor" definition and measurement window to be supplied before this gate can be operationalized |
| Unresolved questions | Definition of "qualified visitor"; measurement window; instrumentation method |

## 7. PCG-2 decision — buyers

| Field | Value |
|---|---|
| Chosen status | **DECIDED** |
| Chosen threshold | ≥ 50 buyers (adopted as proposed, unchanged) |
| Measurement population | **PENDING / NOT DECIDED** — the general measurement-scope question (per-tier vs. aggregate vs. Client-Finder-specific vs. whole-product; preparation record §8) was explicitly left pending by the Product Owner and applies directly to this gate, since ₹499 now includes Client Finder |
| Definition | "Buyer" for this gate is not further defined beyond the proposed figure; no additional definition was supplied |
| Measurement period / window | PENDING / NOT DECIDED — not supplied |
| Per tier or aggregate | **PENDING / NOT DECIDED** (see Measurement population above) |
| Dependencies | Depends on resolution of the measurement-scope open question before it can be operationalized |
| Unresolved questions | Measurement population/scope; measurement window |

## 8. PCG-3 decision — conversion / ₹499 → ₹1,499 transition

| Field | Value |
|---|---|
| Chosen status | **DECIDED at the structural level only.** The numeric threshold for the redefined gates is **NOT DECIDED** (see below). |
| Structural decision | The Product Owner rejected the sequential ₹499 → ₹1,499 transition framing, consistent with PDEF-2's independent-purchase rule. PCG-3 is **redefined as two independent conversion measurements** rather than one transition gate: (a) a ₹99 → ₹499 conversion rate, and (b) a conversion rate into ₹1,499 measured independently (i.e., not conditioned on prior ₹499 purchase). |
| Chosen threshold | **NOT SUPPLIED.** The Product Owner's instruction addressed only the structural redefinition (dropping the sequential-transition framing), not the numeric rate(s) that should apply to the two newly-independent measurements. The previously proposed figure (≥10% conversion) was stated generically against multiple transitions in the preparation record and is **not re-confirmed here as applying to either or both of the redefined independent rates.** Per instruction not to invent missing values, this threshold is recorded as **PENDING / NOT DECIDED** for both redefined rates. |
| Measurement population | PENDING / NOT DECIDED |
| Definition | "Conversion" is not further defined; measurement window and instrumentation not supplied |
| Measurement period / window | PENDING / NOT DECIDED |
| Per tier or aggregate | Decided structurally to be independent per the two redefined measurements (a) and (b) above; whether each is itself per-tier or aggregate in any other sense is not applicable beyond that redefinition |
| Dependencies | Depends on PDEF-2's independent-purchase rule (already decided, not reopened); depends on a future numeric-threshold decision for each of the two redefined rates |
| Unresolved questions | **Exact missing decision:** what numeric conversion-rate threshold, if any, applies to (a) the ₹99 → ₹499 rate and (b) the independent rate into ₹1,499 — these were not supplied and are not assumed to be 10% merely because that figure was previously proposed against the old, now-rejected transition framing. Also unresolved: exact definition of the ₹1,499 conversion population (e.g., visitors, ₹99 buyers, or all traffic) for measurement (b). |

## 9. PCG-4 decision — useful outcome

| Field | Value |
|---|---|
| Chosen status | **PENDING / NOT DECIDED** — explicitly left pending by the Product Owner |
| Chosen threshold | Not decided. The previously proposed figure (≥60% useful outcome) is not adopted, rejected, or redefined by this record |
| Measurement population | PENDING / NOT DECIDED |
| Definition | "Useful outcome" — **PENDING / UNDEFINED** |
| Measurement period / window | PENDING / NOT DECIDED |
| Per tier or aggregate | PENDING / NOT DECIDED |
| Dependencies | None beyond its own definition |
| Unresolved questions | Whether to adopt, reject, or redefine; definition of "useful outcome"; measurement method |

## 10. PCG-5 decision — refund rate

| Field | Value |
|---|---|
| Chosen status | **PENDING / NOT DECIDED** — explicitly left pending by the Product Owner |
| Chosen threshold | Not decided. The previously proposed figure (≤8% refunds) is not adopted, rejected, or redefined by this record |
| Measurement population | PENDING / NOT DECIDED (includes the open question of whether ₹499 and ₹1,499 refunds are measured together or separately, given both now include Client Finder) |
| Definition | Not further defined |
| Measurement period / window | PENDING / NOT DECIDED |
| Per tier or aggregate | PENDING / NOT DECIDED |
| Dependencies | None beyond the general measurement-scope open question |
| Unresolved questions | Whether to adopt, reject, or redefine; measurement scope; measurement window |

## 11. PCG-6 decision — completion

| Field | Value |
|---|---|
| Chosen status | **PENDING / NOT DECIDED** — explicitly left pending by the Product Owner |
| Chosen threshold | Not decided. The previously proposed figure (≥70% completion) is not adopted, rejected, or redefined by this record |
| Measurement population | PENDING / NOT DECIDED |
| Definition | "Completion" — **PENDING / UNDEFINED.** Whether it relates to Client-Finder credit usage is itself unresolved (see §14) |
| Measurement period / window | PENDING / NOT DECIDED |
| Per tier or aggregate | PENDING / NOT DECIDED |
| Dependencies | Possible dependency on the credit/usage-accounting mechanism, which is itself undesigned (§14) — recorded as a dependency only, not decided |
| Unresolved questions | Whether to adopt, reject, or redefine; definition of "completion"; whether it ties to credit usage; measurement window |

## 12. Measurement-population decision (general, §8 of the preparation record)

**PENDING / NOT DECIDED.** The Product Owner explicitly chose to leave open whether buyer/conversion/refund/
completion gates (PCG-2, PCG-3, PCG-5, PCG-6) are measured per Client-Finder tier independently, aggregated across
both Client-Finder tiers, for Client-Finder usage specifically, or across the whole product including the ₹99 tier.
No default or inferred answer is recorded here.

## 13. Definitions

| Term | Status |
|---|---|
| "Qualified visitor" | **PENDING / UNDEFINED** — not supplied |
| "Useful outcome" | **PENDING / UNDEFINED** — not supplied |
| "Completion" | **PENDING / UNDEFINED** — not supplied |

No definition has been manufactured for any of these terms.

## 14. Credit dependency

Per PDEF-2, ₹499 carries 50 and ₹1,499 carries 300 monthly lead-unlock credits, resetting each billing cycle; the
credit **accounting/enforcement mechanism itself (rollover, overage billing, top-ups, abuse controls) remains
explicitly undesigned and is not implemented, designed, or decided by this record.** PCG-6 ("completion") is flagged
as **possibly** depending on that mechanism if "completion" is eventually defined in terms of credit usage — this is
recorded as a dependency only; it is not assumed, decided, or treated as settled. No implementation of the credit
mechanism is authorized by this record or by PDEF-2.

## 15. PDEF-4 dependency

`PROJECT_MASTER_CHECKLIST.md` records PDEF-4 (launch criteria per tier) as depending on both PDEF-2 and PDEF-3. PDEF-2
is decided; **PDEF-3 is only partially decided by this record** (PCG-1/PCG-2 threshold-decided but with pending
definitions; PCG-3 structurally decided but numerically pending; PCG-4/5/6 fully pending). **PDEF-4 therefore remains
blocked and is not decided, authorized, or advanced by this record.** This record does not mark PDEF-4 as decided or
authorized under any circumstance.

## 16. Open questions

1. Definition, measurement window, and instrumentation for "qualified visitor" (PCG-1).
2. Measurement population/scope for "buyers" (PCG-2) — per-tier vs. aggregate vs. Client-Finder-specific vs.
   whole-product.
3. Numeric threshold(s) for the two redefined independent PCG-3 conversion rates ((a) ₹99→₹499, (b) independent
   ₹1,499 conversion), and the exact population definition for measurement (b).
4. Whether, at what threshold, and over what window PCG-4 ("useful outcome") applies — including its definition.
5. Whether, at what threshold, and over what window PCG-5 ("refund rate") applies — including measurement scope.
6. Whether, at what threshold, and over what window PCG-6 ("completion") applies — including its definition and
   whether it ties to credit usage.
7. The general measurement-population/scope question (§12), which affects PCG-2, PCG-3(b), PCG-5, and PCG-6.

## 17. Decision summary

| Gate | Status | Threshold | Notes |
|---|---|---|---|
| PCG-1 | DECIDED (threshold) | 500 qualified visitors | Definition/window/population PENDING |
| PCG-2 | DECIDED (threshold) | ≥ 50 buyers | Measurement population PENDING |
| PCG-3 | DECIDED (structure only) | NOT DECIDED (numeric) | Sequential ₹499→₹1,499 framing rejected; redefined as two independent rates; thresholds for both PENDING |
| PCG-4 | PENDING | — | Not adopted, rejected, or redefined |
| PCG-5 | PENDING | — | Not adopted, rejected, or redefined |
| PCG-6 | PENDING | — | Not adopted, rejected, or redefined; possible credit-usage dependency flagged only |

## 18. Governance / authorization boundaries

**This record grants no implementation, analytics, instrumentation, billing, credit-system, database/schema,
testing, validation, provider/API-call, external-research, deployment, production-traffic, or release authority of
any kind.** Recording PDEF-3 (even partially) does not authorize any engineering, commercial, or operational action.
Implementation of any adopted gate, any instrumentation needed to measure it, and any resolution of the open
questions in §16 require separate, explicit authorization in a future task.

This record does not modify the PDEF-3 preparation record, the PDEF-2 preparation or decision records, the PRD, the
catalog, `PROJECT_MASTER_CHECKLIST.md`, any K1 record, or any code, test, schema, migration, configuration, or
dependency. It does not decide PDEF-4. It is not committed or pushed.

**Next governance action:** supply the remaining Product Owner decisions needed to fully close PDEF-3 — the
definitions and measurement scope for PCG-1/PCG-2, the numeric thresholds and population for the redefined PCG-3
rates, and the adopt/reject/redefine decisions (with definitions) for PCG-4, PCG-5, and PCG-6 — before PDEF-4 can be
unblocked.
