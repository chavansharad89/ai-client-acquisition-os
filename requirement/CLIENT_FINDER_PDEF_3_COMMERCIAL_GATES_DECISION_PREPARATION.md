# Client Finder / Client Intent Discovery — PDEF-3 Commercial Gates Decision Preparation

**Record ID:** CLIENT-FINDER-PDEF-3-COMMERCIAL-GATES-DECISION-PREPARATION-001
**Date:** 2026-10-04
**Type:** read-only decision preparation record. **Not a decision record. Not a Product Owner decision. Grants no
authorization of any kind** (see §12).

---

## 1. Purpose

To assemble, from existing repository records only, the facts, sourcing, and open questions needed for the Product
Owner to decide **PDEF-3**: whether and how the six candidate commercial validation gates (PCG-1..6) are adopted,
rejected, or redefined, now that **PDEF-2 is decided** (Client Finder bundled into ₹499 — Basic, 50 monthly
lead-unlock credits — and ₹1,499 — Advanced, 300 monthly lead-unlock credits — independently purchasable). This
record prepares that decision. It does not make it.

## 2. Scope

**In scope:** reading and citing existing records; organizing PCG-1..6 sourcing, status, and dependencies into a
decision-ready questionnaire.

**Out of scope (not performed by this record):** selecting or approving/rejecting any PCG value; deciding
measurement methodology or tier-aggregation; deciding launch thresholds; deciding PDEF-4; any implementation,
validation, deployment, provider/API call, external research, or participant contact; any modification to the PRD,
catalog, `PROJECT_MASTER_CHECKLIST.md`, the PDEF-2 records, K1 records, code, tests, schemas, migrations,
configuration, or dependencies.

## 3. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged; the K1 implementation + governance-chain commit) |
| Staged files | 0 |
| Working tree before this record | 2 untracked files: `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md` (sha256 `93b8fcdb7c39feb1f5d6f18edec024fbd52e093319b2348723555394b413b6d1`) and `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` (sha256 `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8`) — both verified present and matching their recorded hashes |
| `PROJECT_MASTER_CHECKLIST.md` | Unchanged from committed baseline (sha256 `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831`); confirmed by `git diff` against commit `af9ede9` — no diff |
| K1 implementation files (`contactIdentifiers.ts`, `intentSourceProviderContract.ts`, `intentSignal.ts`, their tests) | Confirmed unchanged against commit `af9ede9` — no diff |
| Existing PDEF-3 record | None found prior to this record (confirmed by search; no duplication) |
| File created by this record | this file only |

## 4. Governing records consulted

| Record | Role |
|---|---|
| `requirement/PROJECT_MASTER_CHECKLIST.md` §3, §4.1, §7.1, §9 | **Sole origin** of the PCG-1..6 figures. Explicitly self-labels §3 "Proposed Commercial Gates — Not Yet Governing" and states for every row "Governing record: NONE." Not modified by this record. |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md` §13 | Reproduces the same PCG-1..6 table verbatim as PDEF-2 context; confirms it is the only other place the figures appear and that none is governed. Not modified. |
| `requirement/CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` §11, §17, §18 | The decided PDEF-2 record. Confirms the ₹499/₹1,499 credit caps (50/300) and confirms PDEF-2 explicitly does not decide PCG-1..6. Not modified. |
| PRD V2.0 / V2.1 / V2.2 | Searched for any of the PCG figures or a matching commercial-gate/validation-threshold concept. **NOT FOUND** in any version. Not modified. |

## 5. PDEF-2 is treated as governing input (not reopened)

The following PDEF-2 facts are treated as decided and are used only as fixed inputs to this preparation — they are
not reinterpreted, expanded, or reopened here:

- ₹499: Client Finder included, bundled, Basic access (basic matching, standard search filters, basic lead data),
  50 monthly lead-unlock credits resetting each billing cycle, independently purchasable.
- ₹1,499: Client Finder included, bundled, Advanced access (advanced behavioral filters, direct contact exports,
  automated outreach triggers), 300 monthly lead-unlock credits resetting each billing cycle, independently
  purchasable, no prior ₹499 purchase required.
- The credit/overage mechanism itself (accounting, enforcement, rollover, overage billing) is explicitly **not**
  designed or authorized by PDEF-2 and remains future work — confirmed again in §11 below.

## 6. PCG-1..6 — summary decision table

| Gate | Current definition | Source | Status | Product Owner decision required | Dependencies |
|---|---|---|---|---|---|
| PCG-1 | 500 qualified visitors (₹99 → ₹499 gate: minimum sample) | `PROJECT_MASTER_CHECKLIST.md` §3, line 134 only | **PROPOSED / NOT YET DECIDED** — no governing record | Adopt, reject, or redefine; define "qualified visitor" | PDEF-2 (tier structure now fixed); none on other PCGs; PDEF-4 depends on this decision, not vice versa |
| PCG-2 | ≥ 50 buyers (₹99 → ₹499 gate: minimum buyers) | `PROJECT_MASTER_CHECKLIST.md` §3, line 135 only | **PROPOSED / NOT YET DECIDED** — no governing record | Adopt, reject, or redefine; define measurement scope (see §8) | Same as PCG-1; also depends on §8 scope question |
| PCG-3 | ≥ 10% conversion (₹99→buyer; also proposed ₹99→₹499 and ₹499→₹1,499) | `PROJECT_MASTER_CHECKLIST.md` §3, line 136 only | **PROPOSED / NOT YET DECIDED** — no governing record | Adopt, reject, or redefine per transition; define "conversion" window/instrumentation | Depends on §8 scope question (per-tier vs aggregate) |
| PCG-4 | ≥ 60% useful outcome (₹99 gate: buyers reporting a useful outcome) | `PROJECT_MASTER_CHECKLIST.md` §3, line 137 only | **PROPOSED / NOT YET DECIDED** — no governing record | Adopt, reject, or redefine; define "useful outcome" and measurement method | None on Client Finder tiers (named gate is ₹99-specific); none on other PCGs |
| PCG-5 | ≤ 8% refunds (refund ceiling, proposed for each tier gate) | `PROJECT_MASTER_CHECKLIST.md` §3, line 138 only | **PROPOSED / NOT YET DECIDED** — no governing record | Adopt, reject, or redefine; define measurement window | Depends on §8 scope question (per-tier vs aggregate, since "each tier" includes both Client Finder tiers) |
| PCG-6 | ≥ 70% completion (₹499 and ₹1,499 progression gates) | `PROJECT_MASTER_CHECKLIST.md` §3, line 139 only | **PROPOSED / NOT YET DECIDED** — no governing record | Adopt, reject, or redefine; define "completion" (may relate to credit usage — see §11) | Depends on §8 scope question; possible dependency on undesigned credit/usage mechanism (§11) |

**No PCG is DECIDED, INFORMATIONAL ONLY, or ABSENT in the sense of "never proposed."** All six are uniformly
**PROPOSED and PENDING**, sourced from exactly one record (`PROJECT_MASTER_CHECKLIST.md` §3), which itself states
"Governing record: NONE" for every row and "None of these figures appears in any repository record" (lines
129–130). The figures were not found in any PRD version. They are recorded here as candidate inputs only, per the
task's explicit instruction not to convert previously-discussed figures into policy.

## 7. Detailed questionnaire — PCG-1 through PCG-6

For each gate: (A) identifier, (B) purpose, (C) governing evidence, (D) current status, (E) decision question, (F)
options, (G) dependencies.

### PCG-1

- **A.** PCG-1
- **B. Purpose:** Proposed as the ₹99 → ₹499 progression gate's minimum visitor sample ("500 qualified visitors").
- **C. Governing evidence:** `PROJECT_MASTER_CHECKLIST.md` §3, line 134: "PCG-1 | 500 qualified visitors | ₹99 → ₹499 gate: minimum sample | PRODUCT OWNER | PENDING | NONE | NONE until decided." No other record mentions it. Not in any PRD version.
- **D. Current status:** PROPOSED / PENDING. Not governing.
- **E. Decision question:** Should a minimum "qualified visitor" count gate progression from ₹99 to ₹499, and if so, what is the count and how is "qualified visitor" defined and instrumented?
- **F. Options:** (i) Adopt 500 as proposed; (ii) adopt a different figure; (iii) reject the gate entirely; (iv) defer the gate pending instrumentation design. No option is recommended — no governing record recommends one.
- **G. Dependencies:** Requires "qualified visitor" to be defined (undefined in any record per §3 line 141–142 of the checklist). Independent of PDEF-2 (₹99 has no Client Finder per PDEF-2's scope). Feeds PDEF-4 (launch criteria) if adopted.

### PCG-2

- **A.** PCG-2
- **B. Purpose:** Proposed as the ₹99 → ₹499 progression gate's minimum buyer count ("≥ 50 buyers").
- **C. Governing evidence:** `PROJECT_MASTER_CHECKLIST.md` §3, line 135. No other record. Not in any PRD version.
- **D. Current status:** PROPOSED / PENDING. Not governing.
- **E. Decision question:** Should a minimum buyer count gate progression from ₹99 to ₹499, and if so, what is the count?
- **F. Options:** (i) Adopt ≥50 as proposed; (ii) adopt a different figure; (iii) reject; (iv) defer. None recommended.
- **G. Dependencies:** Since ₹499 now includes Client Finder (PDEF-2), this gate's "buyer" count for ₹499 is implicated by the open scope question in §8 — does "₹499 buyers" count all ₹499 purchasers, or only those who use Client Finder? Not resolved by any record; see §8.

### PCG-3

- **A.** PCG-3
- **B. Purpose:** Proposed conversion-rate gate: ₹99 visitor → buyer; also proposed for ₹99 → ₹499 and ₹499 → ₹1,499 progression ("≥ 10% conversion").
- **C. Governing evidence:** `PROJECT_MASTER_CHECKLIST.md` §3, line 136. No other record. Not in any PRD version.
- **D. Current status:** PROPOSED / PENDING. Not governing.
- **E. Decision question:** Should a conversion-rate threshold apply to any or all of the three named transitions (₹99 visitor→buyer; ₹99→₹499; ₹499→₹1,499), and if so, at what rate and over what measurement window?
- **F. Options:** (i) Adopt ≥10% for all three named transitions; (ii) adopt different rates per transition; (iii) adopt for some transitions only; (iv) reject entirely; (v) defer pending instrumentation. None recommended.
- **G. Dependencies:** The ₹499→₹1,499 transition is now complicated by PDEF-2's independent-purchase rule — a buyer need not pass through ₹499 to reach ₹1,499, so "₹499 → ₹1,499 conversion" as a *transition* gate may not map cleanly onto independently-purchasable tiers. This is flagged as an open question, not resolved here (see §8). Also depends on "conversion" measurement window/instrumentation, undefined in any record.

### PCG-4

- **A.** PCG-4
- **B. Purpose:** Proposed ₹99-tier gate: share of buyers reporting a "useful outcome" ("≥ 60% useful outcome").
- **C. Governing evidence:** `PROJECT_MASTER_CHECKLIST.md` §3, line 137. No other record. Not in any PRD version.
- **D. Current status:** PROPOSED / PENDING. Not governing.
- **E. Decision question:** Should a minimum "useful outcome" reporting rate gate the ₹99 tier, and if so, at what rate, and how is "useful outcome" defined and measured?
- **F. Options:** (i) Adopt ≥60% as proposed; (ii) adopt a different rate; (iii) reject; (iv) defer pending definition of "useful outcome." None recommended.
- **G. Dependencies:** As recorded, this gate is specific to the ₹99 tier, which has no Client Finder (per PDEF-2 and the catalog). No direct dependency on PDEF-2's Client Finder decisions. "Useful outcome" is undefined in any record (checklist line 141–142).

### PCG-5

- **A.** PCG-5
- **B. Purpose:** Proposed refund ceiling, proposed for each tier gate ("≤ 8% refunds").
- **C. Governing evidence:** `PROJECT_MASTER_CHECKLIST.md` §3, line 138. No other record. Not in any PRD version (PRD V2.0's §63/§92/F-004 refund provisions govern the refund *mechanism/lifecycle*, not a refund-rate commercial gate, and do not state or imply 8%).
- **D. Current status:** PROPOSED / PENDING. Not governing.
- **E. Decision question:** Should a maximum refund-rate ceiling gate progression at each tier (₹99, ₹499, ₹1,499), and if so, at what rate and over what measurement window?
- **F. Options:** (i) Adopt ≤8% uniformly across tiers; (ii) adopt different ceilings per tier; (iii) reject; (iv) defer. None recommended.
- **G. Dependencies:** "Each tier" as proposed would include both ₹499 and ₹1,499, which now both include Client Finder (PDEF-2) — whether a refund tied to Client Finder dissatisfaction should be measured the same way as a refund unrelated to Client Finder is not addressed in any record; see §8.

### PCG-6

- **A.** PCG-6
- **B. Purpose:** Proposed progression-completion gate for ₹499 and ₹1,499 ("≥ 70% completion").
- **C. Governing evidence:** `PROJECT_MASTER_CHECKLIST.md` §3, line 139. No other record. Not in any PRD version.
- **D. Current status:** PROPOSED / PENDING. Not governing.
- **E. Decision question:** Should a minimum "completion" rate gate progression for ₹499 and/or ₹1,499, and if so, at what rate, and how is "completion" defined — is it tied to Client Finder usage (e.g. credits consumed), to static-deliverable consumption, or to something else?
- **F. Options:** (i) Adopt ≥70% as proposed; (ii) adopt a different rate; (iii) reject; (iv) defer pending definition of "completion" and pending design of any usage-tracking mechanism it might require. None recommended.
- **G. Dependencies:** **Flagged dependency on an undesigned mechanism:** if "completion" is intended to relate to Client-Finder credit usage (e.g., lead-unlock credits consumed per month), no accounting/instrumentation mechanism for that exists yet — PDEF-2 explicitly states the credit mechanism is undesigned (§11 of this record; §17 of the PDEF-2 decision record). This record does not assume "completion" means credit usage; that mapping is itself undecided. "Completion" is otherwise undefined in any record (checklist line 141–142).

## 8. Open Product Owner question — measurement scope across tiers

PDEF-2 now defines two Client Finder tiers (₹499, ₹1,499) plus the pre-existing ₹99 tier, which has no Client
Finder. No governing record specifies, for any of PCG-1..6, whether a count or rate should be measured:

- per Client-Finder tier independently (₹499 and ₹1,499 tracked separately), or
- aggregated across both Client-Finder tiers, or
- for Client Finder usage specifically (as distinct from a tier's static deliverables), or
- across the entire product including the ₹99 tier (which has no Client Finder).

This is recorded as an **explicit open Product Owner question**, not resolved or assumed by this record. It affects
PCG-2, PCG-3, PCG-5, and PCG-6 directly (each names "buyers," "conversion," "refunds," or "completion" in a way that
could span tiers); it does not affect PCG-1 or PCG-4, which are named specifically against the ₹99 tier only.

## 9. Open Product Owner question — PCG-3's ₹499 → ₹1,499 transition under independent purchase

PCG-3 proposes a conversion gate for the "₹499 → ₹1,499 progression." PDEF-2 decided that ₹1,499 may be purchased
independently of ₹499 (no prior ₹499 purchase required). No governing record addresses whether a "₹499 → ₹1,499
conversion" gate remains meaningful, should be redefined (e.g. as two independent acquisition-rate gates rather than
one transition gate), or should be dropped, given that the two tiers are no longer necessarily sequential purchases
for a given buyer. This is recorded as an open question, not decided here.

## 10. Credit/usage-cap mechanism dependency

PCG-6 ("completion") and, to a lesser extent, PCG-5 ("refunds") could plausibly relate to how much of their monthly
lead-unlock credit allotment (50 for ₹499, 300 for ₹1,499, per PDEF-2) a buyer consumes or whether they find it
sufficient. No governing record ties PCG-1..6 to the credit figures, and the credit **mechanism itself — accounting,
counters, enforcement, rollover, overage billing — is explicitly undesigned** per the PDEF-2 decision record (§17:
"No accounting mechanism, counter, enforcement path, or overage-billing mechanism is defined, implemented, or
authorized"). Any PCG-3/5/6 definition that would require usage data depends on that mechanism being designed first,
which is itself future work, separate from both PDEF-2 and PDEF-3.

## 11. PDEF-2 credit caps — restated as fixed input only

For reference only (not re-decided here): ₹499 = 50 monthly lead-unlock credits; ₹1,499 = 300 monthly lead-unlock
credits; both reset each billing cycle (`CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` §11, §17). This record
treats these as fixed PDEF-2 facts and does not redesign, question, or extend them, except to note the dependency in
§10 above.

## 12. No authorization statement

**This record grants no authorization of any kind.** It does not adopt, reject, or redefine any PCG; does not decide
measurement methodology or tier-aggregation scope (§8); does not decide the PCG-3 ₹499→₹1,499 transition question
(§9); does not decide PDEF-4; and does not implement, validate, deploy, or release anything. It is a preparation
record only, assembled read-only from existing repository records, for the Product Owner's use in deciding PDEF-3.
No existing record (PRD, catalog, `PROJECT_MASTER_CHECKLIST.md`, the PDEF-2 records, K1 records, code, tests,
schemas, migrations, configuration, or dependencies) was modified in producing this record.

## 13. PDEF-4 status

`PROJECT_MASTER_CHECKLIST.md` §4.1 (line 155) states PDEF-4's Dependency column as "PDEF-2, PDEF-3" and its Blocker
as "Depends on PDEF-2, PDEF-3." No record states a direct PDEF-4 dependency on K1 (K1's completion is referenced
only as an already-satisfied narrative precondition in §8 of the checklist, not as a formal Dependency-column entry
for PDEF-4). **PDEF-4 (launch criteria per tier) remains NOT STARTED and remains blocked on PDEF-3 being decided, in
addition to PDEF-2 now being decided. This record does not decide PDEF-4 and does not advance it beyond stating this
dependency, which is already established by existing governing records, not invented here.**

## 14. Governance status

| Field | Value |
|---|---|
| PDEF-3 decision status | **PENDING PRODUCT OWNER DECISION** (unchanged by this record) |
| This record's authority | NONE |
| Implementation / validation / deployment / release authority | NONE |
| Provider/API-call / external-research / participant-contact authority | NONE |
| Next governance action | Product Owner review and decision of PDEF-3 (adopt, reject, or redefine PCG-1..6; resolve the §8 measurement-scope question; resolve the §9 PCG-3 transition question) |
