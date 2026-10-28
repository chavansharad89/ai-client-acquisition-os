# Client Finder / Client Intent Discovery — PDEF-3 Completion Decision Preparation

**Record ID:** CLIENT-FINDER-PDEF-3-COMPLETION-DECISION-PREPARATION-001
**Date:** 2026-10-04
**Type:** read-only decision-preparation record. **Not a decision record. Not a Product Owner decision. Grants no
authorization of any kind** (see §16).

---

## 1. Purpose

PDEF-3 (`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`, Record ID
`CLIENT-FINDER-PDEF-3-COMMERCIAL-GATES-PO-DEC-001`) is **PARTIALLY DECIDED**. This record assembles, from that
decision record and its preparation record only, the remaining unresolved PDEF-3 questions and the evidence needed
for the Product Owner to close them. It does not decide anything and does not modify either existing PDEF-3 record.

## 2. Baseline (verified before writing this record)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede9` (`af9ede93830f5e3e611195dc2451a470364def74`) — unchanged |
| Staged files | 0 |
| Working tree before this record | 4 untracked files: `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md`, `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION_PREPARATION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`, `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md` |
| Existing PDEF-3 decision record | Present; verified SHA-256 `6503c7787ea8737b01c154c9b203184dcbded2b42265a7c3e31a8b778f9ffd97`; **PARTIALLY DECIDED** per its own §1/§17 |
| Existing PDEF-3 preparation record | Present; verified SHA-256 `70e4590463ffa139bf9a726466a13ae120e30f3d79ecc9bdda445d0025a06f42` |
| PDEF-2 decision record | Present; verified SHA-256 `0db621c09a619dcf81ca0cc20bd36148614e80e756b981ef8c9674a7023f16e8`; **DECIDED**, not reopened |
| `requirement/PROJECT_MASTER_CHECKLIST.md` | Verified SHA-256 `15162827d7735bd18043430929024f5d48b2e8009610fe6f005c3d73e220e831` — matches the hash cited as governing in the existing PDEF-3 decision record (§4); not modified by this record |
| Equivalent "PDEF-3 completion" preparation record | None found prior to this record |
| File created by this record | this file only |

## 3. Governing PDEF-3 decisions (treated as authoritative, not reopened)

Per `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`:

- **PCG-1** — DECIDED: 500 qualified visitors (§6). Definition, measurement window, and measurement population remain
  PENDING.
- **PCG-2** — DECIDED: ≥ 50 buyers (§7). Measurement population/scope remains PENDING.
- **PCG-3** — DECIDED structurally only (§8): the sequential ₹499 → ₹1,499 framing is dropped; PCG-3 is redefined as
  two independent conversion rates — (a) ₹99 → ₹499, and (b) an independent conversion into ₹1,499 (not conditioned
  on prior ₹499 purchase). The numeric threshold for either rate is **NOT SUPPLIED**. The previously proposed ≥10%
  figure is explicitly **not re-confirmed** as applying to either redefined rate.
- **PCG-4** — PENDING / NOT DECIDED (§9).
- **PCG-5** — PENDING / NOT DECIDED (§10).
- **PCG-6** — PENDING / NOT DECIDED (§11).
- **Definitions** — "qualified visitor," "useful outcome," "completion" are all PENDING / UNDEFINED (§13).
- **Measurement scope** (per-tier / aggregate / Client-Finder-specific / whole-product) — PENDING / NOT DECIDED
  (§12), affecting PCG-2, PCG-3(b), PCG-5, PCG-6.

No scope, threshold, or definition is assumed below beyond what is stated above.

## 4. PDEF-2 — governing, not reopened

Per `CLIENT_FINDER_PDEF_2_PRODUCT_DEFINITION_DECISION.md` §7–§11 (DECIDED):

- ₹499: Client Finder included, Basic access, 50 monthly lead-unlock credits, independently purchasable.
- ₹1,499: Client Finder included, Advanced access, 300 monthly lead-unlock credits, independently purchasable, no
  prior ₹499 purchase required.

This record does not modify or reinterpret PDEF-2.

## 5. PCG-3 numeric decision — the two independent conversion rates

The governing PDEF-3 decision record (§8) establishes the structural split but supplies no numeric threshold for
either rate. The preparation record's original ≥10% figure (§6/§7 of
`CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION_PREPARATION.md`) was proposed generically against the old, now-dropped
sequential-transition framing and has **no governing status** for either redefined rate.

| Rate | Status | Proposed figure | Status of proposed figure | Source |
|---|---|---|---|---|
| ₹99 → ₹499 conversion | PENDING | 10% (as originally proposed for "₹99→₹499") | **PROPOSED / NOT DECIDED** | Preparation record §6/§7 (PCG-3); not reconfirmed by the decision record |
| ₹99 / overall entry → ₹1,499 conversion | PENDING | 10% (as originally proposed, generically, for the now-dropped "₹499→₹1,499" transition) | **PROPOSED / NOT DECIDED** — denominator/population not defined by any record | Preparation record §6/§7, §9; decision record §8 |

The repository does not define the denominator or population for either rate (e.g., whether the ₹1,499 rate is
measured against all visitors, ₹99 buyers, or some other population). This is stated explicitly, not assumed.

**For each rate, the Product Owner is asked to:**
1. Adopt a proposed threshold (none is currently governing for either rate), or
2. Supply a different threshold, or
3. Reject the rate as a gate, or
4. Defer the rate pending further definition.

## 6. PCG-4 — useful outcome

| Field | Value | Source |
|---|---|---|
| Status | PENDING / NOT DECIDED | Decision record §9 |
| Proposed threshold | ≥60% useful outcome | Preparation record §6/§7 (PCG-4) — **PROPOSED / NOT DECIDED**; not adopted, rejected, or redefined by the decision record |
| Definition of "useful outcome" | **NOT CURRENTLY DEFINED** in any record | Decision record §13 |

**Threshold question** (kept separate from the definition question per task instruction):
1. Adopt ≥60% as proposed, or
2. Provide another threshold, or
3. Reject the gate, or
4. Defer pending definition.

**Separate definition question:** What exactly constitutes a "useful outcome"? No existing record defines this term;
it is not inferred here from K1 or from lead-unlock credits.

## 7. PCG-5 — refund rate

| Field | Value | Source |
|---|---|---|
| Status | PENDING / NOT DECIDED | Decision record §10 |
| Proposed threshold | ≤8% refunds | Preparation record §6/§7 (PCG-5) — **PROPOSED / NOT YET DECIDED**; not adopted, rejected, or redefined by the decision record |
| Measurement window | PENDING / NOT DECIDED — not defined by any record | Decision record §10 |
| Measurement population | PENDING / NOT DECIDED — includes the open question of whether ₹499 and ₹1,499 refunds are measured together or separately | Decision record §10, §12 |

**Decision questions:**
1. Adopt ≤8%?
2. Choose another threshold?
3. Reject refund-rate gating?
4. Defer?

## 8. PCG-6 — completion

| Field | Value | Source |
|---|---|---|
| Status | PENDING / NOT DECIDED | Decision record §11 |
| Proposed threshold | ≥70% completion | Preparation record §6/§7 (PCG-6) — **PROPOSED / NOT YET DECIDED**; not adopted, rejected, or redefined by the decision record |
| Definition of "completion" | **PENDING / UNDEFINED** — not tied to credit usage or any other event by any governing record | Decision record §11, §13, §14 |

**Threshold question:**
1. Adopt ≥70%?
2. Choose another threshold?
3. Reject the gate?
4. Defer?

**Separate definition question:** What exactly constitutes "completion"? The repository does not state whether it
means workflow completion, lead unlock, successful client contact, acquisition outcome, or another event
(decision record §11, §14). No option is selected here.

## 9. Measurement-scope decision (PCG-2 through PCG-6)

The decision record (§12) leaves this explicitly open. Restated as a single Product Owner question:

For PCG-2 through PCG-6, should metrics be measured:

- **A.** separately for ₹499 and ₹1,499,
- **B.** aggregated across both Client-Finder tiers,
- **C.** only for Client Finder users,
- **D.** across the entire product,
- **E.** different scope per gate.

No option is selected here. **Analyst observation only (not a recommendation):** the gates differ in what they name —
PCG-1 and PCG-4 are named specifically against the ₹99 tier (preparation record §7, PCG-1/PCG-4), while PCG-2,
PCG-3(b), PCG-5, and PCG-6 reference buyers/conversion/refunds/completion in ways that could span the now-two
Client-Finder tiers — which may suggest different gates logically need different scopes (option E). This is recorded
as an observation surfaced from the existing records, not a choice made on the Product Owner's behalf.

## 10. Qualified-visitor definition

Decided threshold: **500** (decision record §6). Definition: **unresolved** (decision record §6, §13).

**Product Owner decision question:** What qualifies a visitor as a "qualified visitor"? No behavioral criteria are
proposed here; none is invented.

## 11. Useful-outcome definition

See §6 above. **NOT CURRENTLY DEFINED** in any record (decision record §13). Not inferred from K1 or lead-unlock
credits.

## 12. Completion definition

See §8 above. The decision record (§11, §14) explicitly leaves open whether "completion" ties to credit usage,
without deciding it either way. **Product Owner decision question:** does "completion" mean workflow completion,
lead unlock, successful client contact, acquisition outcome, or another event? No option is selected here.

## 13. Credit dependency

Per PDEF-2 (§11 of that record), credit caps are decided: ₹499 → 50/month, ₹1,499 → 300/month. The credit
accounting/overage mechanism itself remains separately undecided and undesigned (PDEF-2 §17; PDEF-3 decision record
§14).

**Dependency identified; credit mechanism remains separately undecided.** PCG-6 ("completion") is flagged by the
existing PDEF-3 decision record (§11, §14) as *possibly* depending on this mechanism, only if "completion" is
eventually defined in terms of credit usage — a mapping that is itself unresolved (§12 above). No mechanism design is
proposed here.

## 14. PDEF-4 dependency

`PROJECT_MASTER_CHECKLIST.md` records PDEF-4 (launch criteria per tier) as depending on PDEF-2 and PDEF-3. PDEF-2 is
decided. PDEF-3 is only partially decided (decision record §15, §17). **PDEF-4 therefore remains blocked.** This
record does not prepare, decide, or advance PDEF-4, and does not modify `PROJECT_MASTER_CHECKLIST.md`.

## 15. Required decision matrix

| Item | Current status | Existing proposal | Source | Decision required |
|---|---|---|---|---|
| PCG-3 ₹99→₹499 | PENDING | 10% (PROPOSED / NOT DECIDED) | Preparation record §6/§7; decision record §8 | threshold |
| PCG-3 ₹99/entry→₹1,499 | PENDING | 10% (PROPOSED / NOT DECIDED); population undefined | Preparation record §6/§7, §9; decision record §8 | threshold + population |
| PCG-4 | PENDING | ≥60% (PROPOSED / NOT DECIDED) | Preparation record §6/§7; decision record §9 | threshold + definition |
| PCG-5 | PENDING | ≤8% (PROPOSED / NOT DECIDED) | Preparation record §6/§7; decision record §10 | threshold + window + population |
| PCG-6 | PENDING | ≥70% (PROPOSED / NOT DECIDED) | Preparation record §6/§7; decision record §11 | threshold + definition |
| Qualified visitor (definition) | PENDING | — | Decision record §6, §13 | definition |
| Useful outcome (definition) | PENDING | — | Decision record §9, §13 | definition |
| Completion (definition) | PENDING | — | Decision record §11, §13 | definition |
| Measurement scope (PCG-2–6) | PENDING | — | Decision record §12 | scope |

## 16. No authorization statement

**This record grants no authorization of any kind.** It does not adopt, reject, or redefine any PCG; does not decide
any threshold, definition, or measurement scope; does not decide PDEF-4; and does not implement, validate, deploy,
or release anything. It is a read-only preparation record assembled from `CLIENT_FINDER_PDEF_3_COMMERCIAL_GATES_DECISION.md`
and its preparation record. No existing record (the PDEF-3 decision record, the PDEF-3 preparation record, the
PDEF-2 records, the PRD, the catalog, `PROJECT_MASTER_CHECKLIST.md`, any K1 record, or any code, test, schema,
migration, configuration, or dependency) was modified in producing this record. This grants NO implementation,
validation, billing, analytics/instrumentation, provider/API, external-research, deployment/release, production-
traffic, or commit/push authority.

**Next governance action: Product Owner review and decision of the remaining PDEF-3 items.**
