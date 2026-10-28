# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: Q5-B PRIVACY / COMPETITIVE-INTELLIGENCE SHARING GATE — ENGINEERING SPECIFICATION

**Status: READ-ONLY ENGINEERING SPECIFICATION. NO IMPLEMENTATION AUTHORIZED.**
No code, schema, migration, test, or database is changed by this document. This document resolves the engineering design for the Q5-B gate required by `CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION.md` (`CF-GLOBAL-ENTITY-ARCH-Q5-PO-DEC-001`), closing Blocker #2 of `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_IMPLEMENTATION_AUTHORIZATION_READINESS_AUDIT.md` §21 at the specification level only.

**Authoritative, not reopened by this document:** D1–D23 (D20 deferred), OQ-1–OQ-9 (OQ-5 deferred), Q5-A/B/C as formally recorded in the companion PO decision, C-1–C-7, Phase 7B, Phase 8, K1, Service+Geography-only search, the ₹1,499 commercial model.

---

## A. Purpose

This gate governs exactly one question: **once a `companySummary`/`businessModel` value has (i) passed Q5-A's evidence-integrity floor and (ii) is already classified public-eligible under OQ-6, is *this specific generated row* authorized to be served to a freelancer other than the one whose research run produced it?**

Three distinct questions, deliberately kept separate, are not conflated by this gate:

| Question | Governed by | What it establishes |
|---|---|---|
| Evidence correctness | Q5-A (provenance.ts hard gate + deterministic overlap check) | The cited quote is real and correctly sourced; the `value` text does not grossly overreach a real quote. **Does not** establish the `value` is free of outreach-angle synthesis. |
| Public factual status (field-level) | OQ-6 / D9 / D22 | `companySummary`/`businessModel` are, as a *field*, the kind of content that *may* be considered for sharing. **Does not** establish that any individual row's actual generated text is safe to share — OQ-6 classifies the field, not the content. |
| Cross-freelancer sharing authorization | **This gate (Q5-B)** | Whether this specific row may actually be handed to a different freelancer. |

**What this gate exists to prevent:** redistributing one freelancer's paid, LLM-synthesized research output — text that this architecture's own evidence base (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_FINAL_PO_DECISION_PREPARATION.md` fact 13) confirms is produced under the *identical* prompt, schema, and commercially-oriented framing ("for a freelancer deciding who to approach and what to offer") as the four fields OQ-6 already kept private — to a second freelancer who did not pay for or perform that research, without the first freelancer's research effort or any resulting competitive/sales framing being redistributed as if it were a neutral, verified public fact.

**Explicit rejection of the shortcut this gate must not take:** "source is public" does not imply "LLM-generated interpretation of that source is public." A verified quote proves the *input* was public and the *citation* is real; it proves nothing about whether the model's *composed sentence* built on top of that quote constitutes the kind of research-angle synthesis the product has already decided, for four sibling fields, must stay private. OQ-6's classification rests on field *naming*, not on any verified mechanistic difference — this gate is the mechanism that supplies the missing, row-level judgment OQ-6 itself deferred.

## B. Scope

**Fields in scope:** `companySummary`, `businessModel` only. No other `research_signals` field is touched by this gate — the seven others (`websiteIssues`, `contentOpportunities`, `aiOpportunities`, `growthOpportunities`, `targetCustomers`, `visibleProblems`, `automationOpportunities`) are excluded upstream of this gate, by the existing field-level classification reference table (OQ-6/Q4), before this gate is ever consulted.

**Unit of evaluation: per `research_signals` row (per Observation), not per field-kind, not per Entity, not per freelancer.**

Rationale, grounded in existing repository structure rather than invented:
- `research_signals` already stores exactly one row per Observation — one specific research run's specific generated value for one specific field for one specific Prospect (`packages/core-research/src/mapping.ts:16-27`). There is no coarser existing unit ("the field, globally" or "the business, globally") that corresponds to anything actually stored.
- OQ-6 already decided classification is **field-level, not kind-level** (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_OPEN_QUESTIONS_PO_DECISION.md` OQ-6). A per-row gate is the natural continuation of that same granularity, not a new one.
- Provenance (`research_signal_sources`) is already stored per-row, not per-field-in-the-abstract (`pgRepository.ts:104`). The thing this gate evaluates — "does *this* generated text, with *this* evidence, from *this* research run, pass" — only exists at row granularity.
- D11's append-only evidence model and D18's relationship-evidence pattern are both row/observation-level, not field-level or Entity-level; a row-level gate is consistent with the one granularity every other append-only evidence concept in this architecture already uses.

A row that passes this gate is eligible to be served through a *future* Entity-level public-evidence read path once that path and the Entity layer it depends on exist (see §H). Eligibility is evaluated and recorded at the row level; *consumption* additionally requires the row's owning Company to have a resolved `entity_id`, which is a separate, pre-existing dependency of the entire public-evidence read path (not something this gate introduces).

## C. Inputs

Fields confirmed to exist in the repository today, available to this gate without inventing anything:

| Input | Source | Notes |
|---|---|---|
| `research_signals.id` | `packages/db/prisma/migrations/0016_research_signals/migration.sql` | Row identity. |
| `research_signals.prospect_id` | same | FK; ownership inherited via `prospects.user_id` (no direct `user_id` on `research_signals` — DEC-008 pattern). |
| `research_signals.field` | same | Must equal `companySummary` or `businessModel` for this gate to apply at all. |
| `research_signals.classification` | same | `OBSERVED` / `INFERRED` / `UNKNOWN`. |
| `research_signals.value` | same | The generated text. |
| `research_signals.confidence` | same | 0–100. |
| `research_signals.observed_at` | same | Used by the existing freshness mechanism, not redefined by this gate. |
| `research_signal_sources.signal_id, source_url, source_quote, source_label` | `pgRepository.ts:104` | Present only for `OBSERVED` rows that passed `provenance.ts`'s hard gate. |
| `prospects.user_id` | existing | The freelancer who produced this row — reachable via join, not stored on `research_signals` directly. |
| `companies.normalized_domain` / (future) `companies.entity_id` | existing / Part 4 of the companion readiness document | Business identity proxy; `entity_id` does not exist yet (no Entity layer built) — consumption of a gate-eligible row is additionally blocked on this, independent of the gate itself. |
| Public/private field-classification reference table | OQ-6/Q4 (readiness audit §10/§11) | Already-specified, not-yet-built reference table; this gate is only ever consulted for a row whose `field` this table marks public-eligible. |

**Fields that do NOT exist and are not invented by this gate:**
- A model/provider/prompt-version column (confirmed absent through migration 0049).
- Any existing public/private flag on `research_signals` itself (none — confirmed absent).
- Any existing cross-freelancer authorization/visibility column anywhere (none — confirmed absent across three prior audits).
- `entity_id` on `research_signals` or `companies` (not built yet — tracked separately in Part 4 of the companion readiness document).

## D. Evidence Integrity Interaction (Q5-A ↔ Q5-B)

Restated precisely, per the governing instruction, and not weakened:

- Q5-A's `provenance.ts` hard gate proves the cited **quote** is real, verbatim, and correctly sourced. This is established fact, not assumed.
- Q5-A's deterministic overlap check (if a row is to qualify at all) is a **defensive heuristic only**. It narrows, but does not eliminate, the risk that `value` contains an unverified qualifier or generalization beyond its own cited quote (the "primarily targets SMBs" pattern).
- **Neither of the above is Q5-B's job, and neither substitutes for it.** This gate (Q5-B) treats Q5-A's outcome as a **precondition floor** — a row that fails Q5-A can never reach this gate's evaluation at all — but passing Q5-A is never, by itself, sufficient for this gate to grant eligibility. The two checks are structurally independent: Q5-A is enforced inside the research-signal persistence/validation path (`provenance.ts`, `researcher.ts`); Q5-B's authorization state (§E) is a **separate** piece of state, never set as a side effect of Q5-A passing.
- No part of this gate's design represents the Q5-A overlap check, or Q5-A's hard provenance gate, as proof of semantic entailment, factual accuracy, or absence of inference. Both remain exactly what the PO decision record states them to be: a heuristic and a citation-authenticity check, respectively — nothing more.

## E. The Privacy / Competitive-Intelligence Gate

### E.1 Why a content-classification gate is not the answer, stated honestly

The governing instruction forbids introducing a new LLM call and forbids inventing a generic privacy framework, while requiring the gate be "concrete, deterministic, implementation-ready" and "as narrow as possible." The repository evidence (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_FINAL_PO_DECISION_PREPARATION.md` fact 13, reconfirmed by `ENGINEERING_SPECIFICATION_FINAL.md` Correction A) establishes that **no deterministic textual feature in `value` reliably distinguishes "safe public fact" from "sales-angle synthesis."** `companySummary`/`businessModel` are produced by the exact same prompt, schema, and commercially-framed instructions as the four already-private fields; the only difference is the English property name sent to the model. Building a keyword/heuristic scanner over free text to detect "competitive intelligence content" would itself be exactly the kind of invented, ungrounded privacy framework the instruction prohibits — there is no existing repository precedent for content-based classification of this kind, and inventing one here would be guessing, not specifying.

**Consequence, stated as a specification decision, not an avoidance:** because the repository provides no deterministic signal *inside the generated text* that can safely answer "is this specific synthesis safe to redistribute," the gate's differentiator cannot be a content heuristic. It must instead be an **explicit, out-of-band authorization state** that is never set automatically by the research pipeline itself. This is the narrowest mechanism available that is still deterministic, still non-AI, and still answers the actual question Q5-B asks — and it is the one mechanism every prior audit's own option set already named without being able to specify further (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION_PREPARATION_AUDIT.md` §14 Option E; `..._Q5_FINAL_PO_DECISION_PREPARATION.md` §5 Option B2's "human review... staged rollout").

### E.2 Gate design

**Mechanism type:** explicit allowlist, evaluated per row (§B), fail-closed by default. **Rule-based** (the floor in §E.3) **combined with an explicit per-row allowlist flag** (the actual Q5-B differentiator) — using the instruction's own taxonomy (§G.7 of the brief): this gate is **field-based + source-based (the floor) plus allowlist-based (the differentiator)**, not denylist-based and not a scoring/classifier model.

**New, additive storage required:** one new, narrow table, `research_signal_global_authorizations`, append-only, structurally separate from `research_signals` and never written by `saveSignals()` or any other existing research-persistence code path:

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID / text PK | No | |
| `signal_id` | FK → `research_signals.id` | No | One authorization record per signal row; a row with no entry here has never been authorized. |
| `authorized_at` | timestamp | No | When the explicit authorization was recorded. |
| `authorized_by` | text | No | Identifier of the out-of-band actor/process that set this — never `'system'` or a research-pipeline process identifier, enforced by convention plus the invariant in §E.3 that `saveSignals()` never writes here. |
| `revoked_at` | timestamp | Yes | Append-only revocation: a later row's presence does not delete an earlier authorization; a read-time check (§H) must treat a revoked authorization as currently ineligible without deleting the historical record — consistent with D11's append-only evidence principle. |

No column is added to `research_signals` itself. This keeps the gate's storage wholly additive, auditable independently of the research pipeline, and trivially reversible (dropping the new table affects nothing else).

**Why a separate table, not a boolean column on `research_signals`:** a column on `research_signals` would be set by the same write surface (`saveSignals`) that produces every other field, making it one accidental refactor away from being silently defaulted to `true` or written automatically. A wholly separate table that no existing write path touches is the structurally-enforced version of "never set automatically by the research pipeline" — not merely a convention.

### E.3 Eligibility, rejection, and "not yet eligible" conditions

A row is **ELIGIBLE** for the cross-freelancer read path if and only if, at read time, **all** of the following hold:

1. `research_signals.field` ∈ `{companySummary, businessModel}` (OQ-6 precondition).
2. `research_signals.classification = 'OBSERVED'` (Q5-A precondition; `INFERRED`/`UNKNOWN` never qualify).
3. At least one `research_signal_sources` row exists for this `signal_id`, with a non-empty `source_quote` and `source_url` (Q5-A precondition; structurally guaranteed by `provenance.ts` for every genuine `OBSERVED` row, re-checked here defensively, not merely trusted).
4. The Q5-A deterministic overlap check passes for `value` against its own cited `evidence[].quote` (Q5-A precondition; see §D — a heuristic, not a factuality proof).
5. A `research_signal_global_authorizations` row exists for this `signal_id` with `revoked_at IS NULL` (this gate's own, additional differentiator).

A row is **REJECTED** (permanently excluded; re-evaluation would require the underlying research to be regenerated, not merely re-flagged) when:
- `classification ≠ 'OBSERVED'`,
- no evidence row exists for an `OBSERVED` classification (schema-invariant violation; should not occur, tested defensively),
- the Q5-A overlap check fails,
- `field` is not in the public-eligible set.

A row is **NOT YET ELIGIBLE** (could become eligible later, without regenerating the research, if authorization is granted) when:
- it satisfies conditions 1–4 above, but no `research_signal_global_authorizations` row exists yet, or the most recent one has `revoked_at` set.

**This is the expected, common, correct state for every freshly-generated qualifying row.** Q5-B's own text requires exactly this: evidence-integrity satisfaction is necessary but never sufficient.

**Missing-information behavior:** any condition that cannot be evaluated because required data is absent (e.g., a classification value outside the known enum, a malformed/absent evidence row for a nominally-`OBSERVED` row) is treated identically to REJECTED — never defaulted to eligible. This gate never resolves ambiguity in the permissive direction.

**Ambiguous classification (a field not yet present in the OQ-6/Q4 reference table):** excluded by that table's own existing fail-closed invariant, before this gate is even reached (§C). This gate adds no separate "ambiguous field" handling because that case is already closed upstream.

## F. Important Safety Rule (restated, structurally enforced)

**"`OBSERVED` + quote + overlap-check-pass ≠ globally shareable."** This is not merely a documentation statement in this design: condition 5 in §E.3 is stored in a table no existing code path writes to, so satisfying conditions 1–4 can never, by any existing or accidentally-reused code path, cause condition 5 to become true. The two halves of the gate (the Q5-A evidence floor and the Q5-B authorization state) are independently evaluated and independently persisted, by construction, not merely by intention.

## G. Fail-safe behavior

| Condition | Behavior |
|---|---|
| Missing provenance (no evidence row) | Excluded. |
| Missing quote | Excluded. |
| Missing source URL | Excluded. |
| `INFERRED` value | Excluded, unconditionally — never reaches the authorization check. |
| Failed overlap check | Excluded. |
| Ambiguous field classification | Excluded (upstream fail-closed default, §C). |
| Stale evidence | Not this gate's concern to define; the existing `SIGNAL_FRESHNESS`/`SIGNAL_SPECIFIC_FRESHNESS` governance is reused as-is by whatever future read path serves eligible rows — no new freshness window is introduced here. A stale-but-otherwise-eligible row is not specially exempted or specially penalized by this gate; freshness and Q5-B authorization are orthogonal (tested in K.14). |
| Conflicting evidence (two freelancers' rows for the same future Entity disagree) | Each row is evaluated independently by this gate; the gate does not pick a winner or merge — conflict *preservation* is D11/D18's job, unaffected by this gate. |
| Private evidence (the seven non-public fields) | Excluded upstream of this gate entirely (§B). |
| Competitive-intelligence concern | Addressed by this gate's default-deny posture (§E.1/E.3), not by a content detector — see §A's explicit statement that no reliable detector exists. |
| Unknown classification value | Excluded (missing-information handling, §E.3). |

**No condition above results in silent publication.** Every unresolved or missing-information case resolves to excluded, never to eligible.

## H. Cross-freelancer data flow and enforcement boundary

Traced from actual repository structure, not assumed:

```
research_signals write path (unchanged)
  packages/core-research/src/pgRepository.ts saveSignals()
  — never writes to research_signal_global_authorizations.
        │
        ▼
Existing read path (unchanged, unaffected by this gate)
  apps/web/app/(client-finder)/opportunities/[id]/page.tsx
  listResearchSignals(repos, token, opportunity.prospectId)
  — scoped to the owning freelancer via token+prospectId.
  — This gate does not apply here. A freelancer always sees
    their own research regardless of this gate's state (K.12).
        │
        ▼
research_signal_global_authorizations (NEW, additive, out-of-band)
  — written only by an explicit action outside the research
    pipeline (mechanism intentionally unspecified beyond "not
    automatic" — see §K residual item). Read, never written,
    by the gate-evaluation logic itself.
        │
        ▼
Future cross-freelancer public-evidence read path
  DOES NOT EXIST TODAY (confirmed across four prior audits).
  When built, it MUST:
    (a) join research_signals → research_signal_sources →
        research_signal_global_authorizations,
    (b) apply all five §E.3 conditions at READ TIME, against
        current state — never trust a previously-cached verdict,
    (c) additionally require company.entity_id IS NOT NULL
        (a pre-existing, unrelated dependency of the entire
        Entity-evidence layer, not introduced by this gate).
```

**Enforcement boundary: both write-time and read-time, each for a different half of the gate — not redundant, defense-in-depth.**
- **Write-time** (when `research_signal_global_authorizations` is written): whatever out-of-band process sets this row must itself re-verify conditions 1–4 of §E.3 before writing — i.e., it is never possible to authorize a row that fails the Q5-A floor. This prevents an operator error or future tooling bug from authorizing an ineligible row in the first place.
- **Read-time** (when the future public-evidence path actually serves a row): the full five-condition check in §E.3 is re-evaluated against current state on every read, not read once and cached as a verdict. This protects against a row's underlying classification or evidence being affected by any future code change, and against a revoked authorization being served from stale application-level cache.

Enforcing only at write-time would mean a later data correction or revocation could silently leave an ineligible row still being served; enforcing only at read-time would mean a buggy authorization-writing tool could pollute the new table with entries that the read path alone has to keep re-filtering forever. Both are required, each cheaply, since both operate over data already available without extra joins beyond what §H's diagram shows.

## I. Cache interaction

`research_signal_cache_index` (`packages/db/prisma/migrations/0045_research_signal_cache_index/migration.sql`), keyed `(user_id, normalized_domain, signal_kind)` today, confirmed per-user only, with no cross-user path (`CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION_PREPARATION_AUDIT.md` §11).

- **Private rows must not become globally reusable via cache:** already true — no cache read path crosses the user boundary today, and this gate introduces no new cache-read code path. Not a new invariant this gate adds; it's inherited.
- **Public rows must satisfy the Q5 gate:** the planned `entity_id`-keyed cache dimension (readiness-audit Part 4 / `ENGINEERING_SPECIFICATION_FINAL.md` §6 "Cache") is a **separate, pre-existing, NEEDS-ENGINEERING-SPEC item**, not something this gate builds. Once that dimension exists, any cache hit served from it **must** re-run the full §E.3 check against current state before being served — a cache hit must never be treated as an implicit, pre-verified authorization. The cache's role is limited to avoiding redundant *lookups* of already-computed research; it must never become a shortcut around re-checking §E.3's live state.
- **Stale evidence follows existing freshness rules** — no new TTL is introduced by this gate (§G).
- **Conflicts remain preserved** — this gate does not alter the existing `observed_at DESC` conflict-coexistence read pattern.
- **Schema needs:** **none beyond what Part 4 of the companion readiness document already anticipates** for the `entity_id` cache dimension. This gate requires no cache schema change of its own; `research_signal_global_authorizations` is consulted by the future read path, not by the cache layer itself.

## J. Historical data (Q5-C enforcement)

Per `CF-GLOBAL-ENTITY-ARCH-Q5-PO-DEC-001` §2 (Q5-C = B): every `companySummary`/`businessModel` row written before this gate's authorization mechanism exists remains private, structurally, by construction — not by a separately-maintained cutoff date or flag:

- `research_signal_global_authorizations` is a **new** table that starts **empty**.
- No migration introduced by a future implementation of this gate may backfill, batch-authorize, or infer an authorization row for any existing `research_signals` row.
- Every historical row is therefore automatically **NOT YET ELIGIBLE** (§E.3) the moment this gate exists, with zero special-casing required to achieve that outcome — the absence of a row in a table that starts empty already is the correct, conservative default.
- A future, separate, explicit PO decision would be required to authorize any one-time historical re-evaluation; this document does not propose, design, or pre-approve one.

**New vs. historical observations, made explicit:** "historical" here means any row that exists at the moment this gate's storage is introduced. There is no need for, and this specification does not introduce, a timestamp-based historical/new boundary column — the boundary is simply "has an authorization row ever been written for this `signal_id`," which is `false` for every historical row by construction.

## K. Security / privacy regression tests

Each test below is grounded in a specific repository mechanism or a specific condition in §E–§G, not invented generically.

| # | Scenario | Expected outcome | Grounds |
|---|---|---|---|
| 1 | `companySummary`, `OBSERVED`, verified quote, overlap check passes, `research_signal_global_authorizations` row present with `revoked_at IS NULL` | **Eligible** — appears in the future read path's result set | §E.3, all five conditions satisfied |
| 2 | Same field, `classification = 'INFERRED'` | **Excluded**, regardless of any authorization row | §E.3 condition 2; §F structural independence |
| 3 | `OBSERVED`, verified quote, but Q5-A overlap check fails (e.g. "We serve small businesses" → "primarily targets SMBs") | **Excluded** | §E.3 condition 4; Q5-A Case 2 precedent |
| 4 | `websiteIssues`/`contentOpportunities`/`aiOpportunities`/`growthOpportunities`/`targetCustomers`/`visibleProblems`/`automationOpportunities`, any classification | **Excluded unconditionally**, before this gate is even consulted | §B scope boundary |
| 5 | A qualifying `companySummary` row (passes §E.3 conditions 1–4) with **no** authorization row | **Excluded** — this is the test that demonstrates the gate's actual protective mechanism: default-deny, not content detection (§A, §E.1) | §E.3 condition 5 |
| 6 | `OBSERVED`-classified row with no `research_signal_sources` row at all (schema-invariant violation; should not occur) | **Excluded** (defensive) | §E.3 condition 3; missing-information handling §G |
| 7 | `OBSERVED` row whose evidence row has an empty `source_quote` | **Excluded** | §E.3 condition 3 |
| 8 | `OBSERVED` row whose evidence row has an empty `source_url` | **Excluded** | §E.3 condition 3 |
| 9 | A `research_signals.field` value not present in the OQ-6/Q4 classification table | **Excluded** (conservative, fail-closed) | §C / §E.3 "ambiguous classification" |
| 10 | A `companySummary` row with `observed_at` predating the existence of `research_signal_global_authorizations` | **Remains excluded permanently** unless a future, separate PO decision and a corresponding explicit authorization act on it | §J (Q5-C) |
| 11 | A cache hit (once the `entity_id` cache dimension exists) for a signal whose authorization was later revoked | **Excluded** — read-time re-check (§H) catches this; the cache never serves a stale "was once eligible" verdict | §H, §I |
| 12 | The owning freelancer views their own `companySummary` row via the existing `listResearchSignals` path, with no authorization row present at all | **Visible** — this gate never restricts a freelancer's own research; it only ever gates the *other*, not-yet-built cross-freelancer path | §H (existing read path unaffected) |
| 13 | Two different freelancers independently research the same (eventual) Entity and produce two different `companySummary` rows, one eligible, one not | **Each evaluated independently**; the ineligible one is never "covered" by the eligible one, and the eligible one is never blocked by the other's conflict | §G "conflicting evidence" |
| 14 | A fresh (`observed_at` within the freshness window), qualifying `companySummary` row with no authorization row, versus a stale, previously-*authorized* row | Freshness state does **not** grant eligibility on its own (first case excluded), and does not revoke an existing valid authorization on its own (second case still eligible, subject to whatever the future read path's own freshness filter separately decides for staleness, which is not this gate's concern) — freshness and authorization are tested as orthogonal | §G "stale evidence" |
| 15 | Static/import-boundary check of the gate-evaluation module | Asserts **zero** imports of any Anthropic SDK / LLM client module from the gate-evaluation code path | §A "no new LLM call"; mirrors this codebase's existing zero-AI import-boundary testing convention |

## Implementation impact (not performed by this document)

| Area | Impact |
|---|---|
| Schema | One new, additive table: `research_signal_global_authorizations` (§E.2). No change to any existing table. |
| `research_signals` write path (`saveSignals`) | **Unchanged.** Never writes to the new table. |
| Q5-A overlap check | Specified by the companion PO decision; implemented as a read-time, deterministic check (no new persisted column required for Q5-A itself; may be computed on demand or memoized without schema impact). |
| Existing single-freelancer read path | **Unchanged.** |
| Future cross-freelancer read path | Must implement the five-condition query in §E.3 and the dual write-time/read-time enforcement in §H — this read path itself remains **blocked** on the Entity layer (Part 4 of the companion readiness document), independent of this gate's own readiness. |
| Cache | No schema change required by this gate specifically (§I). |
| UI | None required by this gate. A future disclosure ("this summary may contain AI interpretation") remains a product option, not specified or required here. |
| Historical data | None touched (§J). |
| Operational residual item | **Not fully closed by this document:** the out-of-band mechanism by which `research_signal_global_authorizations` rows are actually created (a manual PO/admin action, a reviewed-workflow tool, or something else) is intentionally left unspecified beyond the invariant that it must not be the automatic research pipeline. This is a bounded, narrow, non-blocking engineering/operational detail for a future pass — it does not require further PO input (the PO decision already requires "an additional, separately designed" gate; it does not require the gate's *authoring tool* to be designed in this same pass), but it is flagged here, not silently assumed, consistent with this document's own instruction not to invent detail it cannot ground. |

## Final status

**READ-ONLY ENGINEERING SPECIFICATION ONLY.**
**NO CODE CHANGED. NO SCHEMA CHANGED. NO DATABASE CHANGED. NO MIGRATION CREATED. NO TEST CHANGED. NO COMMIT. NO PUSH.**
OQ-6, D9, D11, D22, D23, and every other named governance record remain exactly as previously decided. This document does not reopen, reinterpret, or supersede any of them.
