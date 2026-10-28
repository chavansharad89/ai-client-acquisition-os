# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: Q5 PRODUCT OWNER DECISION (Q5-A / Q5-B / Q5-C)

**Decision ID:** CF-GLOBAL-ENTITY-ARCH-Q5-PO-DEC-001
**Decision date:** 2026-10-20
**Authority:** Product Owner
**Scope of this record:** Governance-only. Formally records, in a durable `*_PO_DECISION.md` record, the three Q5 selections (Q5-A, Q5-B, Q5-C) that previously existed only as options inside documents explicitly titled "PREPARATION." This closes exactly the gap identified as Blocker #1 in `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_IMPLEMENTATION_AUTHORIZATION_READINESS_AUDIT.md` §21 ("Q5-A/B/C are not formally recorded as a Product Owner decision"). **IMPLEMENTATION NOT AUTHORIZED BY THIS RECORD.** No code, schema, migration, test, or database is changed by this record. Nothing is committed or pushed.

**Related decisions (not modified by this record):**
- [`CF-GLOBAL-ENTITY-ARCH-PO-DEC-001`](CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_PO_DECISION_RECORD.md) — D1–D23 (D20 deferred). Unaffected; D9/D22 remain exactly as stated.
- [`CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001`](CLIENT_FINDER_GLOBAL_ENTITY_ARCH_OPEN_QUESTIONS_PO_DECISION.md) — OQ-1 through OQ-9. **OQ-6 is not reopened or reinterpreted by this record.** `companySummary`/`businessModel` remain classified public-eligible under OQ-6; this record governs a separate, additional question — whether and how the *currently-produced values* of those two fields may actually be reused cross-freelancer, which OQ-6's own text explicitly reserved ("the exact implementation-level field mapping... may be specified during engineering planning before implementation").
- [`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION_PREPARATION_AUDIT.md`](CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION_PREPARATION_AUDIT.md), [`..._Q5_EVIDENCE_SUFFICIENCY_PO_DECISION_PREPARATION.md`](CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_EVIDENCE_SUFFICIENCY_PO_DECISION_PREPARATION.md), [`..._Q5_FINAL_PO_DECISION_PREPARATION.md`](CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_FINAL_PO_DECISION_PREPARATION.md) — the three read-only preparation audits whose repository findings and option analysis this record relies on without re-deriving. Their own analyst recommendations (A2 / B2(cautious) / C2) are **not** the decision — they are recorded in those documents for traceability only, and this record's decision is cross-checked against them in §4 below.
- `CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_SPECIFICATION.md` (companion document, created alongside this record) — the engineering specification for the Q5-B gate this record authorizes the *design* of (not the build).
- Explicitly **not** reopened by this record: D1–D23, OQ-1–OQ-9 (OQ-5 remains separately, intentionally deferred), C-1 through C-7, Phase 7B, Phase 8, K1 contact-identifier governance, Service+Geography-only search input, the ₹1,499 commercial model.

---

## 1. Context

Three prior read-only audits converged on the finding that Q5 — "can the currently-produced `companySummary`/`businessModel` values safely be reused across freelancers" — decomposes into three independent questions the repository itself cannot answer: evidence integrity (Q5-A), sharing policy (Q5-B), and historical treatment (Q5-C). The final implementation-readiness audit found these selections existed only as assumptions inside documents titled "PREPARATION," never in a formal `*_PO_DECISION.md` record, and withheld a GO on that basis alone. This record supplies that missing formal decision.

## 2. PRODUCT OWNER DECISION

### Q5-A — Evidence Integrity: **SELECTED = B**

An `OBSERVED` `companySummary`/`businessModel` value may be considered for the Q5 sharing pipeline only when:
- the existing provenance mechanism (`packages/core-research/src/provenance.ts`, enforced by `researcher.ts`) has verified the underlying quote/source — this is already a hard, pre-persistence gate and is not altered by this decision;
- the value is associated with that verified evidence;
- a deterministic defensive overlap check is applied between the stored `value` text and its own cited `evidence[].quote`;
- the overlap check is treated **only** as a defensive heuristic;
- the overlap check is **not** treated as semantic entailment, factual proof, or complete-accuracy proof;
- no new LLM call is introduced solely to validate the value.

**Binding constraint on all downstream interpretation:** the deterministic overlap check must never be described, in code, documentation, UI copy, or any downstream consumer, as proof that the generated `value` statement is factually or semantically entailed by its quote. It narrows one specific, repository-confirmed risk (an unverified qualifier riding on a real quote — the "primarily targets SMBs" pattern documented in the evidence-sufficiency audit); it does not close it, and it does not address evidentiary risk of any other kind.

### Q5-B — Sharing Policy: **SELECTED = B**

Even when Q5-A's evidence-integrity requirements are satisfied, `companySummary`/`businessModel` must **not** automatically become globally reusable. They may become eligible for cross-freelancer reuse **only** after passing an additional, separately designed privacy/competitive-intelligence gate. That gate is specified in the companion document `CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_SPECIFICATION.md`, created alongside this record. This decision does **not** itself authorize building or operating that gate — it authorizes the gate's *design* to proceed as an engineering specification.

### Q5-C — Historical Values: **SELECTED = B**

Existing, already-stored `companySummary`/`businessModel` values (every row, `OBSERVED` or `INFERRED`, written before the Q5-A/Q5-B mechanism exists) remain private. This record does **not** authorize, and no future document may treat this record as having implicitly authorized:
- backfilling them,
- automatically revalidating them,
- publishing them,
- migrating them into global public evidence,
- retroactively applying the newly-selected Q5-A/Q5-B standard to them.

Historical values may be reconsidered only through a **future, separate, explicit** Product Owner decision. This record leaves that door open without walking through it.

## 3. ANALYST / ENGINEERING INTERPRETATION (separate from the decision above)

The following is analysis and implementation framing, not part of the Product Owner's decision, and must not be read back into §2:

- The Q5-A overlap check's exact algorithm (e.g., token/lexical overlap threshold) and its timing (read-time filter vs. one-time batch tagging) are engineering-design choices, not decided here. The companion gate specification resolves the timing question (read-time, no new persisted flag required for Q5-A itself) as an engineering decision, consistent with the minimal-change principle these records have followed throughout.
- The Q5-B gate's actual mechanism (what, precisely, the "additional, separately designed" check consists of) is engineering specification work, performed in the companion document, not invented here.
- "Globally reusable" and "cross-freelancer reuse" in §2 refer to the not-yet-built public-evidence read path described throughout the Global Entity Architecture chain; no such read path exists today, so this decision has no live runtime effect until that read path, the Entity layer it depends on, and the Q5-B gate are all separately built.

## 4. Cross-check against analyst recommendations (traceability only)

| Question | PO selection | Prior analyst recommendation | Match? |
|---|---|---|---|
| Q5-A | B (`OBSERVED` + verified quote + deterministic overlap check) | A2 / "B" in the final questionnaire — same option | Yes |
| Q5-B | B (evidence standard + additional, separately-designed gate) | B2, offered cautiously, not as a confident pick | Yes |
| Q5-C | B (leave private now; future separate PO decision may revisit) | C2 | Yes |

No PO selection departs from the analyst's own (non-binding) recommendation. This table is provided for traceability only; the decision in §2 stands on the Product Owner's own authority, not on the analyst's agreement with it.

## 5. Relationship to prior governance (explicit)

| Prior item | Status after this record |
|---|---|
| OQ-6 (`companySummary`/`businessModel` public-eligible classification) | Unchanged. Still the controlling classification. This record governs a narrower, additional question OQ-6 explicitly deferred. |
| D9 / D22 (public evidence categories) | Unchanged. Not broadened, not narrowed. |
| Q5-A/B/C as stated in the three "PREPARATION" documents | Formally superseded by this record as the authoritative decision. Those three documents remain valid as the repository-evidence record and option analysis this decision relies on; they are not themselves decisions. |
| Implementation-readiness audit's Blocker #1 (`Q5-A/B/C not formally recorded`) | **Closed by this record.** |
| Implementation-readiness audit's Blocker #2 (`Q5-B gate has no engineering specification`) | Addressed by the companion gate specification created alongside this record (see Part 3 cross-reference). Whether that specification is sufficient to fully close Blocker #2 is evaluated independently in the consistency/readiness audit, not asserted here. |

## 6. Explicit non-goals of this record

This record does **not** decide, invent, or authorize:
- Any change to OQ-6's classification of `companySummary`/`businessModel` as public-eligible.
- Any schema, migration, code, or test change.
- Any backfill, revalidation, or retroactive publication of historical values (Q5-C is a standing prohibition, not a one-time choice).
- The Q5-B gate's operational mechanics (who/what sets any authorization state the gate design introduces, through what interface) — that is addressed, to the extent it is bounded, in the companion specification, and remains flagged there as a residual open item if not fully closed.
- Any broadening of D9/D22's four-category evidence framework.
- Any implementation plan or implementation authorization of any kind.

## 7. Dependencies

- The Q5-B gate cannot be built, and the cross-freelancer read path for `companySummary`/`businessModel` cannot be built, until the Entity layer (D1/D8, `entities`/`identity_evidence` tables) itself exists — this record does not change that pre-existing dependency.
- The Q5-A overlap check and the Q5-B gate both require the public/private field-classification reference table (OQ-6/Q4, already specified elsewhere) to exist first, since both operate only on fields already classified public-eligible.

## 8. Implementation authorization status

**NOT AUTHORIZED.** No production code, migration, configuration, schema, or test file has been changed as part of this record. No database change occurred. Nothing has been committed or pushed. The only files created in this task are the three governance/specification documents explicitly listed in the governing instruction's "Files Allowed" section.

---

**READ-ONLY GOVERNANCE RECORD.**
**IMPLEMENTATION NOT AUTHORIZED BY THIS RECORD.**
