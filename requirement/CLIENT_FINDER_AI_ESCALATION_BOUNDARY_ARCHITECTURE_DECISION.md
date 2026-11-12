# Client Finder — AI/LLM Escalation Boundary: Architecture Decision

**Decision ID:** `CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001`
**Date:** 2026-10-12
**Status:** ENGINEERING ARCHITECTURE DECISION — PRINCIPLE AND MECHANISM RESOLVED. NUMERIC PARAMETERS NOT SET. IMPLEMENTATION NOT AUTHORIZED.
**Authority:** Resolved directly from existing PO decisions (Items #4, #5, #8, #9, #10; S5; S6; evidence-based elimination; cross-freelancer/same-freelancer evidence reuse; discovery-quality launch gate) under explicit delegated authority to resolve this specific open architecture question without a further PO questionnaire. This record does not reopen, amend, or override any PO decision listed in "Decisions this record does not reopen" below.

---

## 1. Problem this record resolves

Items #8, #9, and #10 jointly decided the *shape* of AI escalation (hybrid, budgeted, Top-N + threshold, with strong-signal bypass) but explicitly left open the concrete mechanism connecting them, including:

- Whether Research and Target Customer Match remain two independently-mandatory calls per candidate (Item #8's own "still open" list).
- Whether strong-signal bypass candidates count toward Top-N or consume the AI budget (Item #9 and Item #10 "still open").
- How cache-first reuse concretely gates escalation.
- What happens on budget exhaustion or AI failure.
- Whether a deterministic-only candidate can still satisfy the Minimum Useful Lead Result.

Current production code (`packages/core-research/src/service.ts:149`, `:198`; wired unconditionally in `apps/worker/src/index.ts:142-166` and `apps/worker/src/searchWorker/worker.ts:400-439`) runs **two unconditional LLM calls per candidate with no deterministic gate in front of either** — directly violating the hard constraint that the core product must not require mandatory paid LLM cost. This record defines the architecture that closes that gap.

## 2. Decision statement

AI escalation is admission-gated, budget-metered, and always optional. A candidate reaches AI only after clearing deterministic elimination and either (a) winning a bounded escalation slot by rank, or (b) qualifying for strong-signal bypass — and in both cases consuming one unit of a single, finite per-search escalation cap. If AI is skipped, denied, unavailable, or exhausted, the candidate is still shown, using deterministic evidence only, with a transparent "not AI-reviewed" provenance marker. AI never decides eligibility and never produces the ranking; it only researches/qualifies/enriches candidates the deterministic layer already selected.

## 3. Exact architecture

```
Discovery
  → Normalization + dedup
  → Deterministic elimination (evidence-based exclusion only; weak/missing evidence never eliminates)
  → Deterministic ranking (service-specific weighting, Item #5)
  → Cache-first reuse check (same-freelancer; cross-freelancer public-evidence reuse once that
     caching infrastructure is separately authorized — see §13)
       ├─ reusable fresh evidence found → skip AI entirely, use cached result
       └─ no reusable evidence → proceed
  → Escalation admission, against ONE shared per-search cap (see §8):
       ├─ Strong-signal bypass candidates (Item #9) — admitted first, in signal-strength order,
       │    skipping the rank/threshold test, but still drawing from the shared cap
       └─ Remaining candidates — admitted in deterministic rank order, subject to the
            Top-N + threshold AND-gate (Item #10), until the shared cap is exhausted
  → AI research/qualification (only for admitted candidates; see §5)
  → Minimum Useful Lead Result assembly (deterministic OR AI-enriched; see §11)
  → Evidence transparency / provenance marking
  → Stop
```

No LLM call of any kind occurs before deterministic elimination, ranking, and the cache check have all run.

## 4. Research vs. Target Customer Match treatment

They remain **two independent calls, conditionally staged — not merged.**

- **Research** (`researcher.ts:212`) is mandatory for every admitted candidate, because category plausibility is bundled inextricably into that same call ("parsing/prompting is unconditional" per the category-plausibility decision record) and cannot be split out without a separate, unauthorized provider-contract change.
- **Target Customer Match** (`targetCustomerMatch.ts:262`) becomes **conditional**: it runs only when the search actually carries a target-customer criterion to evaluate against. A search with no target-customer input has nothing for TCM to match, so the call is structurally skipped — this is a deterministic gate on an existing input field, not a reopening of what TCM means or does.
- Both calls, whichever run, count as **one escalation unit** against the shared cap for that candidate (the cap meters *candidates escalated*, not raw LLM call count) — satisfying "does not make two separate LLM calls mandatory for every candidate" without merging the calls technically. A future engineering decision may combine them into a single provider request for cost/latency reasons; that is an implementation optimization, not part of this architecture decision, and remains open.

## 5. AI's role

Enrichment + qualification-input, never elimination or ranking authority:
- Research supplies narrative/evidence content (the human-readable "why found") and the category-plausibility determination consumed by Qualification.
- Target Customer Match supplies a stored signal consumed by downstream display/ranking-adjacent use — it is not an eligibility gate (already superseded by `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` DEC-002).
- Neither call performs elimination or computes the ranking score. Both happen only after deterministic ranking has already ordered the candidate pool.

## 6. Deterministic prerequisites before any AI escalation

A candidate must have, in order: survived normalization/dedup → survived deterministic elimination (evidence-based exclusion only) → received a deterministic rank → been cache-checked with no reusable fresh evidence found → cleared escalation admission (§8). Any candidate failing an earlier step never reaches a later one, and in particular never reaches AI.

## 7. Cache-first reuse

Before any LLM call, check for existing persisted research for the same (freelancer, entity) pair within a freshness window (same-freelancer reuse — already PO-decided, no new authorization needed). If found and fresh, reuse it and skip AI for that candidate entirely. Extending this check to cross-freelancer **public, non-owner-specific** evidence is already permitted at the product-decision level (`CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md`), but Item #8 explicitly leaves the **shared-cache infrastructure** itself unauthorized — so this record scopes the cache-first check to same-freelancer reuse now, with a forward hook for cross-freelancer reuse once that infrastructure is separately authorized. Freshness/TTL windows are not numerically set here (Item #8 leaves this open); engineering may propose values during implementation planning.

## 8. AI escalation / budget behavior

One shared per-search cap, expressed as a **count of candidates escalated to AI** (not rupees, not raw tokens — directly satisfying "no mandatory paid LLM cost" without inventing a price). Top-N (the selection-breadth concept from Item #10) and the AI budget (the spend-limit concept from Item #8) default to being the same number for this architecture — they are named separately because engineering may later diverge them (e.g., a looser selection breadth with a stricter spend sub-cap), but nothing in current governance requires that split yet. **The exact numeric value is not set by this record** — per Item #8's own open item and this task's explicit instruction not to invent a cost ceiling, the number is left for implementation planning, informed by engineering/cost evidence once a provider is chosen.

Escalation order within the cap: strong-signal bypass candidates first (§9), then remaining candidates in deterministic rank order, until the cap is reached. Once reached, no further escalation occurs in that search — regardless of whether remaining candidates are bypass-eligible or highly ranked.

## 9. Strong-signal bypass behavior

Per Item #9 (unchanged): a bypass candidate skips the rank/threshold admission test — it does not need to compete for a Top-N slot by score. But per this record, it is **not exempt from the shared cap**: it still consumes one unit of the same Top-N/budget pool, simply with priority (admitted ahead of normally-ranked candidates). This resolves Item #9/#10's open "does bypass count toward Top-N / consume budget" questions as **yes to both**, which is the only reading consistent with "no mandatory paid LLM cost" — an unbounded bypass path would reintroduce unmetered AI spend. Bypass changes *admission order and admission criteria*, never the *existence* of the cap.

## 10. AI failure / unavailability behavior

Budget exhaustion, provider failure, timeout, and "no usable provider" are all treated identically: the escalation attempt simply does not produce a result for that candidate. The candidate is **not dropped, not hidden, and not blocked** — it falls back to deterministic-only presentation (§11). The existing `ResearchProvider` interface (`packages/core-research/src/provider.ts:59-61`) already supports this: a failed or absent provider call is caught and the candidate is marked not-AI-reviewed rather than treated as a fatal error for the search.

## 11. Eligibility / ranking / Minimum Useful Lead Result implications

- Eligibility and ranking are unaffected — both remain fully deterministic (Items #4/#5/S6), computed before AI ever runs, and are never recomputed or gated by AI's presence or absence.
- **Deterministic-only candidates CAN and MUST be able to become a Minimum Useful Lead Result.** This directly follows from the hard constraint ("if deterministic evidence is sufficient to show an opportunity, the system must be able to show it without AI") and resolves a genuine silence in `CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md` (which is agnostic on field provenance). Where an MULR field would otherwise be AI-derived (e.g. "why found"), a deterministic-only candidate populates it from the deterministic signal(s) that drove discovery/ranking instead, and any field genuinely unavailable without AI is disclosed via the existing "missing information" MULR item and the OBSERVED/INFERRED/UNKNOWN provenance model — never by hiding the candidate.
- Category plausibility remains exactly as already classified (`PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md`, Option B): an AI/Research-stage output consumed by Qualification, not a Discovery-stage deterministic signal and not an eligibility gate. A deterministic-only candidate therefore has no category-plausibility value yet; Qualification must treat that as "not yet evaluated," not as a failure.

## 12. Impact on current code (legacy behavior to be replaced — not authorized here)

- `packages/core-research/src/service.ts:149` (Research call) and `:198` (Target Customer Match call), unconditionally wired via `apps/worker/src/index.ts:142-166` and `apps/worker/src/searchWorker/worker.ts:400-439`, are legacy and must be replaced by the gated flow in §3 — no deterministic elimination/ranking/cache/admission gate currently exists in front of either call.
- The `ResearchProvider` abstraction (`provider.ts:59-61`) already supports swapping in a gated/no-op path without interface changes.
- No application-level evidence cache exists today (only provider-level prompt-cache token accounting) — the cache-first check in §7 requires new implementation, not a rewire of something existing.
- `apps/worker/src/normalize.ts:43-52` discarding no-website candidates before a Prospect row exists is a related but separate structural issue (flagged by the engineering proposal as a conflict with the no-website-preservation decision) — out of scope for this record; not resolved here.

## 13. Governance documents needing reconciliation

- `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md` — add a forward cross-reference: this record resolves its "Research/TCM separate-or-combined" and "cross-freelancer cache sharing" framing (combined-call question answered: stay separate, conditionally staged; cross-freelancer cache scoped out for now); Top-N value, threshold value, exact budget number, and TTL windows remain open per that record.
- `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md` and `..._ITEM_10_AI_FRONTIER_FORMATION_PO_DECISION.md` — add a forward cross-reference: this record resolves their shared "does bypass count toward Top-N / consume budget" open item (yes to both).
- `CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md` — add a forward cross-reference noting this record resolves the provenance-of-fields silence: deterministic-only MULR is explicitly permitted.
- `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ENGINEERING_PROPOSAL.md` — superseded in part: its unselected scoring/escalation-mechanism menus (§5, §6) are no longer all live options; this record selects the admission mechanism (AND-gate + priority-ordered shared cap). Its cost/recall estimates remain unverified and are unaffected.

(Cross-reference notices above have now been appended, additive-only, to each of the four files listed — appended 2026-10-13 during the Phase 1 governance reconciliation pass. No historical decision content in those files was rewritten; each addition is a clearly-marked "Forward cross-reference" section.)

## 14. Implementation authorization status

**NOT AUTHORIZED.** This record resolves the architecture and mechanism. It does not authorize writing code, changing the database schema, changing tests, committing, or pushing. A separate implementation-authorization decision is required before any of the above is built, consistent with every other architecture/engineering-proposal record in this project.

## 15. Tests / release gates eventually needed (not authorized to build now)

- Unit coverage proving: a candidate failing deterministic elimination never reaches AI; a candidate with fresh cached evidence never reaches AI; the shared cap is never exceeded under any mix of bypass and normal admissions; TCM is skipped when no target-customer criterion is present; AI failure/timeout/budget-exhaustion all produce a deterministic-only MULR, never a dropped candidate.
- Integration coverage against the discovery-quality launch gate (`CLIENT_FINDER_DISCOVERY_QUALITY_LAUNCH_GATE_PO_DECISION.md`) confirming deterministic-only candidates still satisfy the Minimum Useful Lead Result categorical-coverage check.
- A measured-cost test/report (not a numeric gate yet) establishing real per-escalation LLM cost/latency, which is the engineering evidence Item #8 requires before Top-N/budget numeric values can be set.

## 16. Remaining genuine PO conflict

**NONE.** Every open item resolved above was an explicitly-flagged "still open" mechanism question in Items #8/#9/#10, not a settled decision — nothing here reopens the five-dimension framework, universal ranking framework, Service Fit, Need/Opportunity Gap independence, evidence transparency, cross-freelancer public evidence reuse, top-level-service-only search, contactability/commercial-readiness-as-ranking-only, the discovery-quality launch gate, or the evidence-suppression decision. The only numbers intentionally left unset (Top-N count, budget count, threshold value, cache TTL, provider/model choice) are left unset because no existing governance, testing practice, or engineering measurement supports a specific value yet — inventing one would itself have been the kind of ungrounded decision this project's governance process exists to avoid.

---

## Decisions this record does not reopen

Universal five-dimension framework; Entity Reality; Current Activity; Need/Opportunity Gap service independence; Service Fit = Capability Fit; Service Fit as ranking (not eligibility); evidence transparency; stale/conflicting evidence preservation; cross-freelancer public factual evidence reuse (product-level); top-level-service-only search with internal subservices; universal ranking framework (ordering only, no composite score); supersession of the legacy seven-factor scoring model; contactability/commercial-readiness as ranking-only; Minimum Useful Lead Result (content requirements); the discovery-quality launch gate; the evidence-suppression decision; the zero-mandatory-paid-LLM-cost constraint itself.
