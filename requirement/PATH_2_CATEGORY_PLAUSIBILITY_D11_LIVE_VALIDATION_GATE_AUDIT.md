# Path 2 — Research-Level Category Plausibility

## D11 Live Validation Gate Audit (Read-Only Preparation)

```text
DOCUMENT TYPE: READ-ONLY LIVE-VALIDATION GATE PREPARATION AUDIT
FINAL CLASSIFICATION: NOT READY FOR LIVE VALIDATION
SCOPE: PREPARATION ONLY. NO LIVE SESSION, NO PROVIDER/API CALL, NO CODE,
       TEST, CONFIG, SCHEMA, MIGRATION, PROVIDER, WORKER, UI, PRD, TEMPLATE,
       FACILITATOR-RECORD, OR GOVERNANCE CHANGE. THIS DOCUMENT IS THE ONLY
       FILE CREATED.
```

---

### 1. Purpose

This audit decides whether the repository and local environment are ready for
the actual D11 live validation session for Path 2. It uses the locked D11
requirements (`PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md`, D11-A … D11-I)
and the existing D11-H Facilitator Observation Record as the observation
instrument.

D0–D11 are treated as immutable. This audit does not reinterpret them, reopen
them, redesign the D11-H record, or run any part of the live session.

---

### 2. Baseline Repository State

Captured before any other operation and re-verified at the end (§12).

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28   (matches expected)
Branch .................... phase-17-r34-worker-orchestration
Staged (git diff --cached)  none
git status --short ........ 100 lines (48 tracked-modified, 52 untracked)
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff --check .......... clean (exit 0)
```

Integrity snapshot, used for the end-of-task comparison:
- the SHA-1 of the full `git diff` output;
- the SHA-1 of every pre-existing untracked file (52 files).

Both are stored in the session scratchpad, outside the repository.

The pre-existing working-tree modifications (Path 2 implementation plus earlier
unrelated diffs) and the untracked governance documents were present before
this task. They are not modified by it.

---

### 3. Authoritative D11 Requirements

Documents re-read for this task:
- `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md`
- `PATH_2_CATEGORY_PLAUSIBILITY_D11_VALIDATION_READINESS_AUDIT.md`
- `PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md`
- `PATH_2_CATEGORY_PLAUSIBILITY_D8_WIDENING_PRODUCT_DECISION.md`
- `PATH_2_CATEGORY_PLAUSIBILITY_D8_WIDENING_CONFORMANCE_AUDIT.md`
- the relevant sections of `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` and `PATH_2_CATEGORY_PLAUSIBILITY_D10_PRODUCT_DECISION.md`

These are the requirements that gate a live session. They are summarized here, not restated in full.

| Ref | Requirement | Tier |
|---|---|---|
| §3.1 | Live trace/log showing that `targetCustomer` reaches Research | MANDATORY (live) |
| §3.2–3.4 | Real compound string parsed correctly; a result for each segment; ANY/OR aggregate | MANDATORY (live) |
| §3.5 | At least one UNKNOWN with the insufficiency reasoning recorded, distinct from MISMATCH | MANDATORY (live) |
| §3.6 / §6.4 | Provenance shown to have run, or at least one OBSERVED claim manually spot-checked against its fetched source | MANDATORY (live/manual) |
| §3.7 / §4.7 | Two Searches with different `targetCustomer` values covering the same business, each determination retained independently | MANDATORY (live) |
| §3.8 | D7 separation | STRUCTURAL |
| §3.9 / §4.8 | Fallback, only if it fires naturally | OBSERVATIONAL |
| §4.1–4.6, 4.9 | Coverage: MATCH, MISMATCH, UNKNOWN, multi-segment, first-party basis, genuine insufficiency, one real participant | MANDATORY (categorical, no numeric threshold) |
| §6.1–6.3 | Every OBSERVED claim has a URL and a verbatim quote; first-party evidence is the primary basis, and supporting-only evidence gives UNKNOWN; **confidence and basis populated and consistent with the classification** | MANDATORY per session |
| §7 | The D9 §9 fields are recorded every session | MANDATORY per session |
| D11-B | D10 UI rendered with real data (needed for full sign-off) | MANDATORY (full tier) |
| D11-C / H | Unprimed participant; facilitator record kept separately | MANDATORY |
| D11-F | Structured-output capability for each configured provider, proven by tests **before** any session | IMPLEMENTATION PRECONDITION |
| D11-G | `core-opportunity` / `core-qualification` / `core-discovery` suites green | REGRESSION GATE |
| D11-I | A funded, working provider account | MANDATORY ENVIRONMENT PRECONDITION to scheduling any session |

---

### 4. Current Implementation Trace

Every file in this trace was opened in this task. No execution was performed.

```text
Search (immutable parameters.targetCustomer snapshot)
  │
Discovery   packages/core-discovery/src/service.ts:118-123
  │  companies.findOrCreateByDomain(userId, normalized)  → Company shared per user+domain
  │  prospects.findOrCreate(userId, {searchId, companyId}) → one Prospect per (Search, Company)
  │  ⇒ the same business found by two Searches = same company_id, two prospect_ids
  │
Worker      apps/worker/src/searchWorker/worker.ts:388-397
  │  runResearchForOwner({companies, prospects, signals, provider, searches,
  │                       categoryPlausibility?}, userId, {prospectId})
  │  production wiring: apps/worker/src/index.ts:136  createPgCategoryPlausibilityRepository(pool)
  │
Research service  packages/core-research/src/service.ts:108-139
  │  search = searches.getById(userId, prospect.searchId)
  │  targetSegments = parseTargetSegments(search.parameters.targetCustomer)
  │                   (categoryPlausibility.ts:36 — split(';').trim().filter(nonEmpty))
  │  provider.research({prospectId, companyId, companyName, normalizedDomain, targetSegments})
  │
ResearchProvider  packages/core-research/src/provider.ts:29  targetSegments?: readonly string[]
  │  (D8 widening — OPTION A, DECIDED)
  │
Fallback-provider path  packages/core-research/src/fallbackResearchProvider.ts:93-120
  │  used UNCONDITIONALLY (apps/worker/src/index.ts:61-104); chain = [RESEARCH_PROVIDER]
  │  + optional RESEARCH_FALLBACK_PROVIDER. researchInput built ONCE, reused per attempt.
  │  onUsage(usage, isFallback ? 'fallback' : requestKind, prospectId)
  │     → ai_usage_events (provider, model, request_kind, prospect_id)   [index.ts:129-132]
  │
Source documents  sourceDocumentProvider.ts:151-181 — homepage only,
  │  one document labeled "Homepage" (https://{normalizedDomain}); fetched text NOT persisted
  │
Prompt      packages/core-research/src/prompt.ts:31, 43-49
  │  "TARGET CUSTOMER SEGMENTS TO EVALUATE (in this exact order)" + numbered segments
  │
Model output  schema.ts:190-242  categorySegmentSchema {fit, rationale, evidence[{quote,sourceUrl,sourceLabel}]}
  │  UNKNOWN ⇒ rationale MUST be null and evidence MUST be []
  │  MATCH/MISMATCH ⇒ rationale + ≥1 evidence required
  │
Verification  categoryPlausibility.ts:90-176  verifyCategoryPlausibility()
  │  count = segment count (only when the response is non-empty); cited URL ∈ supplied sources;
  │  verbatim quote match; minimum quote length. Failures go to the repair round (researcher.ts)
  │
Deterministic aggregation  categoryPlausibility.ts:51-56  aggregateCategoryFit()
  │  []→UNKNOWN; any MATCH→MATCH; all MISMATCH→MISMATCH; else UNKNOWN
  │  toSegmentDeterminations() :204-219 — a missing per-position result becomes UNKNOWN / null rationale
  │
Persistence  categoryPlausibilityPgRepository.ts:36-95 (migration 0027)
  │  supersedePrevious(searchId, prospectId) — scoped to BOTH keys
  │  save({searchId, prospectId, targetCustomer, targetSegments, aggregateResult, segmentResults})
  │  getCurrentByProspectId — superseded_at IS NULL ORDER BY created_at DESC, id DESC
  │
Qualification  packages/core-qualification/src/evaluator.ts:35-70  (worker.ts:430-440)
  │  CATEGORY_PLAUSIBLE is always evaluated and recorded
  │  NEED_DETECTED fails ⇒ NOT_QUALIFIED (category criterion still recorded, cannot override)
  │  else: evidence missing ⇒ INSUFFICIENT_EVIDENCE; MATCH ⇒ QUALIFIED;
  │        MISMATCH ⇒ NOT_QUALIFIED; UNKNOWN/none ⇒ INSUFFICIENT_EVIDENCE
  │
Opportunity detail UI  apps/web/app/(client-finder)/opportunities/[id]/page.tsx:73, 160-185
     getCategoryPlausibilityDetermination(repos, token, opportunity.prospectId)
     renders: aggregate, targetCustomer, observedAt, per-segment fit, rationale,
              evidence (label link + quote). Section guarded by `categoryPlausibility ? … : null`.
     Does NOT render confidence or basis for segment evidence (none exist — see §10).
```

Trace conclusions:
- `targetCustomer` / `targetSegments` are carried end to end without any provider-specific branching.
- Search+Prospect attribution and supersession are scoped correctly.
- The Qualification mapping matches D4/D5.
- The D10 section is wired to the real data path.

---

### 5. Required Categorical Coverage — Can the Implementation Produce It?

None of the cases below has occurred live. The repository contains no evidence of any live category-plausibility determination.

| # | Case | Producible? | Basis / caveat |
|---|---|---|---|
| 1 | MATCH | YES | Schema, verifier, and aggregation paths exist and are unit-tested. |
| 2 | MISMATCH | YES | Same. Needs a Search whose segment the homepage visibly excludes. |
| 3 | UNKNOWN | YES | Same. |
| 4 | Multi-segment Search | YES | `parseTargetSegments` on `;`. The three-segment example on record can be reused (D11 §4.4). |
| 5 | Same business, two Prospects, two `targetCustomer` values | YES | Company is deduplicated by domain per user; the Prospect is per (Search, Company). Supersession is scoped per (search_id, prospect_id). **Operational prerequisite:** Discovery (Google Places) must actually return the same business for both Searches. The facilitator must choose location/inputs to make that happen. |
| 6 | Live trace that `targetCustomer` reaches Research | PARTIAL | **No prompt/request log exists.** Available live evidence: (a) the persisted row's `target_customer` and `target_segments`; (b) a non-empty `segment_results` whose count equals the segment count, which the verifier enforces and which the model can only satisfy if it received the segments; (c) `ai_usage_events` rows for the prospect. The facilitator must decide before the session whether (a)–(c) count as the §3.1 "trace/log". This audit does not decide that. |
| 7 | UNKNOWN from genuinely insufficient evidence, reasoning recorded | PARTIAL | The system **cannot** record insufficiency reasoning: the schema forces `rationale = null` for UNKNOWN. Persisted UNKNOWN also cannot distinguish (i) the model judging a segment UNKNOWN, (ii) the model returning an empty `categoryPlausibility` array (`verifyCategoryPlausibility` accepts it; `toSegmentDeterminations` fills UNKNOWN), and (iii) a missing determination. The reasoning and the "genuine" judgment must come from facilitator review of the homepage (D11-H §9 supports this). |
| 8 | MATCH/MISMATCH based mainly on first-party evidence | YES | The only source is the business's own homepage, so every MATCH/MISMATCH is first-party by construction. |
| 9 | Only secondary/supporting evidence exists → UNKNOWN | NOT NATURALLY PRODUCIBLE AS SPECIFIED | The pipeline supplies **no secondary documents** (homepage only; D11-H §13 already records this). The nearest case: the homepage is uninformative but the company name suggests the category. The name cannot be cited, so the result must be UNKNOWN. Whether that counts as the D11 §6.2 "supporting-tier only" case is a facilitator/Product Owner judgment, not something this audit settles. If the homepage fetch fails entirely, `InsufficientEvidenceError` means no determination is persisted, so that is **not** this case. |

---

### 6. D11-H Field Readiness

Legend: **R** = repository-verifiable, **L** = requires live execution, **H** = requires human observation, **F** = requires facilitator entry. No live field was populated.

| D11-H section / field | Class | Capacity present? |
|---|---|---|
| §1 Session date, facilitator, participant, session ID | F | Yes |
| §2 HEAD / implementation baseline | R | Yes (prefilled) |
| §3 Search ID, Prospect ID, company, targetCustomer | L + F | Yes |
| §4 Discovery → Research → persisted → Qualification timestamps, live trace | L + F | Yes |
| §5 Raw targetCustomer, parsed segments, segments reaching Research | L + F (rule prefilled R) | Yes |
| §6 Segment count/order | L + F | Yes (5 rows) |
| §7 Aggregate result | L (rule prefilled R) | Yes |
| §8 Per-segment fit / rationale / evidence | L + F | Yes. There are no confidence/basis columns, which matches what the system actually stores (§10). |
| §9 UNKNOWN case: segment, insufficiency reason, evidence reviewed | L + H + F | Yes. This is the only place insufficiency reasoning can be recorded (§5 row 7). |
| §10 / §11 MATCH / MISMATCH case, primary source | L + F | Yes |
| §12 Spot-check: claim, source URL, quote, manual verification, notes | L + H + F | Yes |
| §13 Evidence source type (first-party / supporting) | L + F | Yes. The homepage-only limitation is already recorded. |
| §14 Provider, model, fallback invoked/status, attempts | L + F | Yes. The values come from `ai_usage_events` (provider, model, request_kind='fallback'). |
| §15 Provider-neutrality observation | L + F | Yes |
| §16 Persistence: determination, search/prospect IDs, timestamp, supersession | L + F | Yes |
| §17 Cross-Search scenario A/B | L + F | Yes |
| §18 Qualification criteria / state / Opportunity exists | L + F | Yes. NEED_DETECTED is a separate field, so masking by R-71 is visible. |
| §19 UI review fields | L + H + F | Yes |
| §20 Participant response, comments, reactions, priming check | H + F | Yes |
| §21 Facilitator assessment | F | Yes |
| §22 Sign-off, disposition, signature | F | Yes |

The capacity checklist from the task is fully covered: Search/Prospect IDs, targetCustomer, parsed segments, provider used, fallback status, MATCH/MISMATCH/UNKNOWN, per-segment outcomes, evidence provenance, source URL, evidence quote, confidence/basis (only as far as §8/§12 free text allows), timestamp, UI review, participant judgment, facilitator notes and sign-off. The D11-H record needs no redesign for session use.

---

### 7. Environment-Readiness Assessment (D11-I)

The local `.env` was inspected for presence and length only. No value was printed or copied.

| Item | Finding |
|---|---|
| `ANTHROPIC_API_KEY` | Present, non-empty. **Credential exists.** |
| `RESEARCH_PROVIDER` / `RESEARCH_MODEL` | Absent, so the defaults apply (Anthropic). |
| `RESEARCH_FALLBACK_PROVIDER` / `_MODEL` | Absent. The fallback chain has exactly one attempt, so no fallback can fire. |
| `OPENAI_API_KEY`, `GEMINI_API_KEY` | Absent. Not configured. |
| `GOOGLE_PLACES_API_KEY` | Present, non-empty (Discovery). |
| `DATABASE_URL` | Present, non-empty. Reachability not tested. |
| `ANTHROPIC_API_KEY` in the shell environment | Not set. The worker reads it from `.env` at runtime. |

**Can the provider theoretically be invoked?** Yes. The worker wiring (`apps/worker/src/index.ts:92-132`) together with a present key is structurally sufficient to attempt a call.

**Has the test harness ever shown live-provider execution?** No. All Research tests use fake `ResearchModel`s. No repository record exists of a successful live Research call.

**Is the Anthropic funding/credit blocker resolved?** There is no evidence that it is. The only recorded live attempt (Search `b81ab156-…`) failed with `HTTP 400` insufficient credit balance, 3 of 3 attempts. No later document records a funded or successful run. `.env` was last modified 2026-09-25 00:06, but that says nothing about account funding.

```text
credential exists ............... YES
provider account is funded ...... UNVERIFIED (last evidence: NOT funded)
live provider call has succeeded  NO EVIDENCE
D11-I ........................... UNRESOLVED — MANDATORY PRECONDITION NOT MET
```

Other runtime prerequisites that this read-only audit did not verify: a running web app and worker, a reachable Postgres with migration 0027 applied, and a working Google Places key and quota.

---

### 8. Regression Readiness

No source file in `core-research`, `core-qualification`, `core-opportunity`, `core-discovery`, `apps/worker/src`, `apps/web`, or `packages/db/prisma` has changed since the D11 Validation-Readiness Audit ran the suites. `find -newer` against that audit's mtime (2026-09-26 13:41) returned zero files. Its results therefore still describe the current code and were reused. Nothing was re-run.

| Suite | Result | Status |
|---|---|---|
| `core-opportunity` | 95/95 | GREEN (zero diff from HEAD) |
| `core-qualification` | 30/30 | GREEN (only the D4-authorized criterion additions) |
| `core-discovery` | 25/25 | GREEN (carries a pre-existing, non-Path-2 diff) |
| `core-research` | 249/249; `tsc --noEmit` clean | GREEN |
| Integration: 14 failures | not re-run | **PRE-EXISTING** (R-71 `companySummary`/`TOPICAL_FIELDS` fixture interaction). Not a Path 2 regression. Not repaired. |

D11-F precondition: the Anthropic structured-output schema is generated through `zodToJsonSchema` (`anthropicModel.ts:2`), and `jsonSchema.test.ts:~191` covers the `categoryPlausibility` item type. That satisfies the precondition for the one configured provider. Gemini and OpenAI are not configured, so their precondition does not currently apply.

**D11-G regression gate: SATISFIED.** Green regression suites are a separate question from live-validation prerequisites (§11). Being green does not make the environment ready.

---

### 9. Pre-Existing Issues

Each of these was present before Path 2 or is already documented as unrelated.

1. **14 integration failures.** Personalization, outreach and follow-up integration files; the R-71 fixture interaction.
2. **Provider funding/credit blocker.** Recorded before Path 2 implementation (Search `b81ab156-…`).
3. **Homepage-only source pipeline.** `sourceDocumentProvider.ts` has no Path 2 change. It limits the D3 first-party/supporting distinction.
4. **Pre-existing `core-discovery` working-tree diff.** Unrelated to Path 2.
5. **Stale D7–D11 "OPEN" status text** in `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` (lines 557–573). The dedicated decision documents are authoritative.
6. **R-71 masking.** A strict NEED_DETECTED means many live Opportunities may be NOT_QUALIFIED whatever the category result. This is expected behavior (evaluator short-circuit), not a defect, but it will affect what the facilitator sees in Qualification.

---

### 10. Path 2 Findings

**F-1 — Segment evidence has no `confidence` or `basis` (a gap against D10-C and D11 §6.3).**
- **What:** `categorySegmentSchema` (`schema.ts:190-242`) and `SegmentDetermination` (`categoryPlausibility.ts:179-184`) carry evidence as `{quote, sourceUrl, sourceLabel}` only. Segments have no confidence field and no OBSERVED/INFERRED classification. The D10 UI block (`page.tsx:160-185`) renders neither field.
- **Requirement:** D10-C, D10 Implementation Constraint 4, and consolidated scope lock line 435 require reuse of `{sourceUrl, sourceLabel, sourceQuote, confidence, basis}`. D11 §6.3 makes "confidence and basis fields are populated and consistent with the claim's classification (OBSERVED vs. INFERRED)" **MANDATORY per validation session**.
- **Effect:** as built, a live session **cannot** satisfy D11 §6.3. The per-segment `rationale` might be argued to stand in for `basis`, but that would be a reinterpretation of D10/D11, which this audit may not make. No earlier Path 2 audit recorded this gap.
- **Classification:** Path 2 implementation finding. It blocks a passing D11 disposition, not the mechanics of running a session. Resolving it needs either an authorized implementation change or an explicit Product Owner ruling. Neither is made here.

**F-2 — Persisted UNKNOWN carries no reasoning and no cause (non-blocking).**
The schema forces `rationale = null` for UNKNOWN. An empty model `categoryPlausibility` array is accepted and stored as all-UNKNOWN. The persisted row cannot tell a considered UNKNOWN from an omitted one. D11 §3.5 can still be satisfied through facilitator-recorded reasoning (D11-H §9). This is a traceability limitation, not a correctness defect.

**F-3 — No live request/prompt trace for `targetSegments` (non-blocking).**
Nothing logs what the provider received. D11 §3.1 must rely on indirect persisted evidence (§5 row 6).

No other Path 2 defect was found. D7 separation, provider neutrality, attribution scoping, aggregation, and the Qualification mapping all match the locked decisions (§4).

---

### 11. Live-Validation Prerequisites (not defects)

These must be met before a D11 session can be **scheduled**. None of them is a defect.

1. **D11-I:** confirm a funded, working provider account. Anthropic is the default. The key is present; funding is not demonstrated.
2. **F-1 disposition:** decide how D11 §6.3 (confidence/basis) will be satisfied. Without that decision, no session can reach PASS.
3. **Runtime:** web app and worker running; Postgres reachable with migration 0027 applied; Google Places key/quota working.
4. **Cross-Search design:** choose `targetCustomer`/location inputs so that Discovery returns the same real business in two Searches, and pre-plan a compound (≥2 segment) `targetCustomer`.
5. **Trace-evidence definition:** agree before the session that persisted `target_segments`, matching `segment_results` counts, and `ai_usage_events` together form the §3.1 trace. Otherwise, arrange a separate authorized capture.
6. **Spot-check source capture:** fetched homepage text is not persisted. The facilitator must save or snapshot the source page at session time so the D11-E manual spot-check is against the document the model actually saw.
7. **Coverage-9 judgment:** agree in advance how the "supporting-only → UNKNOWN" case will be recognized, given the homepage-only pipeline (§5 row 9).
8. **Provider-field capture:** capture the `ai_usage_events` provider, model and request_kind per prospect for the D9 §9 fields by reading them from the authorized application UI; the evidence requirement is unchanged, and direct human database queries are not authorized. *(Amended 2026-09-29 under VS-READY-PO-DEC-001 §9.1, R-9 = B, as the bounded UI-reading edit. Previous wording: "plan to query `ai_usage_events` (provider, model, request_kind) per prospect". No other Gate Audit wording is changed.)* With no fallback configured, fallback cannot fire, so record "not configured".
9. **Participant:** a real, anonymized participant; the template unmodified; the D11-H record ready and blank.

---

### 12. Explicit Non-Actions

- No live API, provider, Google Places, or Anthropic call was made.
- No participant session was held and no browser/manual real-data validation was done.
- No database connection, query, or mutation; no fixture mutation.
- No test run. Existing current results were reused (§8).
- No production code, test, PRD, configuration, schema, migration, provider, worker, or UI file was modified.
- The D11-H Facilitator Observation Record, `MVP_REAL_USER_VALIDATION_TEMPLATE.md`, and all governance documents were not modified.
- No staging, commit, or push.
- No secret value was printed. `.env` was checked for key presence and length only.
- The 14 integration failures were not repaired.

End-of-task verification:

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ identical to baseline
git diff --check .......... clean
git status --short ........ 100 → 101 lines (+ this document only)
Pre-existing untracked files: all 52 SHA-1s identical to baseline
```

---

### 13. Final Gate Classification

```text
NOT READY FOR LIVE VALIDATION
```

**Blocking:**
1. **D11-I is unresolved.** A credential exists, but there is no evidence that the provider account is funded and no live call has ever succeeded. D11 §10 makes this a MANDATORY precondition to *scheduling* any session.
2. **F-1.** D11 §6.3 (confidence/basis) cannot be satisfied by the current implementation. A session run today could not reach a PASS disposition without an authorized change or a Product Owner ruling.

**Not blocking:**
- The implementation is otherwise structurally capable of the coverage set. Coverage items 6, 7 and 9 are only partially or indirectly producible (§5), so they need facilitator preparation.
- The D11-H record is fit for use as-is.
- The D11-G regression gate is satisfied.
- The 14 integration failures stay PRE-EXISTING and are not attributed to Path 2.

D11 live validation cannot begin until items 1 and 2 are resolved and the §11 prerequisites are arranged.

## STOP
