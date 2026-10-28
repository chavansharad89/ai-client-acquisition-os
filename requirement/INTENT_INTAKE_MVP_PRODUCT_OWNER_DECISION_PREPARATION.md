# INTENT INTAKE MVP

## Public-Intent / First-Party Signal Intake — Product Owner Decision Preparation

**Decision ID (reserved):** INTENT-INTAKE-PO-DEC-001
**Status:** **PENDING PRODUCT OWNER DECISION**
**Implementation status:** **NOT STARTED — STOPPED BEFORE ANY CODE, SCHEMA OR TEST CHANGE**
**Repository HEAD at preparation:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Relation to other tracks:** Separate from the Path 2 / P8 / D11 validation track. That session remains
stopped under §9.8. This record neither reads nor changes any Path 2 decision, preparation or validation record.

```text
INTENT-INTAKE-PO-DEC-001 .. PENDING — 5 DECISIONS (D1–D5), OPTIONS UNRANKED
IMPLEMENTATION ............ NOT STARTED
MIGRATION 0029 ............ NOT CREATED
```

---

## 1. Baseline

| Item | Value |
|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` (branch `phase-17-r34-worker-orchestration`) |
| `git status --short` | 173 entries (all pre-existing; md5 of listing `737a39e79a9f0bd0b720455df06c5f1c`) |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `3ce19e2b00abd8e06fa70d0f517a15acf5ec3edcfbcfe6324cb04e59efc68a2e` (equal to the reference value in VS-SETUP-REC-001 §1) |
| 0027 `migration.sql` sha256 | `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508` (matches MIGRATION-SETUP-PO-DEC-001 §3) |
| 0028 `migration.sql` sha256 | `bd8777158f84bcfefbde4ad0dde33beeb0c47d00bf91db18ff35f09d5ced6986` (matches MIGRATION-SETUP-PO-DEC-001 §3) |
| Governance records modified | None |

## 2. Files inspected

- `packages/db/prisma/migrations/0014_searches`, `0015_discovery`, `0016_research_signals`, `0017_opportunities`,
  `0018_opportunity_scores`, `0019_opportunity_staleness`, `0021_ai_usage_events`, `0022_qualifications`
- `packages/core-acquisition/src/scoring.ts` (`ResearchSourceKind`, `SOURCE_WEIGHT`, `scoreLead`, `decayFactor`)
- `packages/core-acquisition/src/prospectScore.ts` (`scoreProspect`, `INFERENCE_DISCOUNT`)
- `packages/core-acquisition/src/offer.ts` (`suggestOffers`), `staleness.ts`, `opportunityAction.ts`, `stages.ts`
- `packages/core-research/src/scoringAdapter.ts`, `persist.ts`, `types.ts`, `schema.ts`, `repository.ts`,
  `pgRepository.ts` (`supersedePrevious`), `service.ts`
- `packages/core-opportunity/src/service.ts` (`createOpportunityForOwner`, `SCORER_VERSION`,
  `neutralScoringInputs`), `adapters.ts` (R-70/R-71, `toOfferSignals`, `toServiceRule`), `types.ts`
- `packages/core-discovery/src/service.ts`, `normalize.ts`, `types.ts`, `provider.ts`
- `packages/core-qualification/src/rules.ts`, `evaluator.ts`, `types.ts`
- `packages/core-service-profile/src/validation.ts` (trigger vocabulary)
- `apps/worker/src/searchWorker/worker.ts` (`runCanonicalPipeline`)

## 3. Why implementation stopped

The implementation prompt contains three stop conditions. Each one was met:

- §2 / §12: the exact weights are product decisions.
- §1: stop if the repository differs materially from the review.
- §12: stop if any decision goes beyond the existing repository contract.

The repository matches the earlier review on every structural point: tables, kinds, supersession,
identity and state vocabulary. The review, however, **did not identify two gates**. Both mean an intent
signal cannot reach the later stages it was meant to reach:

1. **Offer-trigger gate (§5 D3).** `suggestOffers()` matches a signal only when `signal.kind` is in the rule's
   `triggers` (`offer.ts`). The rule's `triggers` come from the caller's ServiceProfile (`toServiceRule`), and
   ServiceProfile validation accepts only kinds in `SOURCE_WEIGHT`'s keys (`core-service-profile/validation.ts`).
   No existing ServiceProfile can contain `PUBLIC_INTENT` or `FIRST_PARTY`. As a result, intent signals by
   themselves produce `needDetected = false`. That leads to NO SUITABLE OFFER, then NEED_DETECTED failing
   (NOT_QUALIFIED), then Next Action HOLD, and no Personalization or preparation.
2. **CATEGORY_PLAUSIBLE gate (§5 D4).** Qualification requires a category-plausibility determination
   (`evaluateCategoryPlausible`, Path 2 D4). Only a Research run produces that determination: a homepage fetch
   plus a model call. When no determination exists, the result is at best INSUFFICIENT_EVIDENCE. An intake-only
   Prospect therefore cannot reach Personalization or Outreach/Follow-up Preparation unless it is researched.
   Research is the Path 2 validation feature and involves live fetches and provider calls.

A further fact was established that bears on D1 and D2. The **numeric** values in `SOURCE_WEIGHT` are read only
by `scoreLead()` (`scoring.ts:83`). No production caller in `packages/` or `apps/` uses `scoreLead()`. Production
scoring is `scoreProspect()`, which never reads `SOURCE_WEIGHT` values: `visibleProblem` and `evidenceQuality`
depend on confidence, freshness and classification only. `SOURCE_WEIGHT`'s **keys**, on the other hand, define
the trigger vocabulary accepted by ServiceProfile validation and the offer adapter.

## 4. Established technical facts (no decision needed)

| Topic | Fact |
|---|---|
| Signal entity | `research_signals` plus `research_signal_sources` already hold kind, classification, raw confidence, basis, `observed_at`, `superseded_at`, and URL/quote/label. No new entity is needed. |
| Inference discount | Applied only to `classification = 'INFERRED'` (`scoringAdapter.ts`). OBSERVED intake signals are never discounted, so no change is needed. |
| Freshness | `decayFactor` applies to `observed_at`. Intake sets `observed_at` to the original post or submission time. `created_at` (DB default) records capture time, so the two stay distinct without a schema change. |
| Supersession (C2) | `supersedePrevious` (`pgRepository.ts:54`) supersedes **every** active row for the Prospect. It needs a kind filter so that only research-produced kinds participate. This is a technical fix, with no behavior change for the existing 8 kinds. |
| Kind vocabulary (C1) | Adding a kind requires a migration that widens `research_signals_kind_check` (additive only). It also requires TypeScript additions to `ResearchSourceKind` in `scoring.ts` and `persist.ts`, and a `SOURCE_WEIGHT` entry, because the type is `Record<ResearchSourceKind, number>`. The next free number is `0029`. `migrations-blocked/` holds 0005/0006 only, so there is no collision. |
| R-71 | Intake must use problem-shaped `field` names (e.g. `statedRequirement`), never the topical fields `companySummary`, `businessModel` or `targetCustomers`. |
| R-70 | Unchanged. A quote that opens with a different business's name ("Acme. …") excludes that Prospect's evidence from offers. Intake tests must include this case. |
| Pipeline reuse | The post-research segment lives in the private `runCanonicalPipeline` (`apps/worker/src/searchWorker/worker.ts:356`). Reusing it for intake needs that segment extracted into an exported function. This is a refactor of an uncommitted, in-progress file and involves no product choice. |
| G1 / G2 / G3 | Out of scope, per the prompt. Intake would reject a missing or unparsable website (`normalizeDomain` → null) and require an existing, caller-owned Search. It would not merge across Searches, because Prospect is unique on `(search_id, company_id)`. |

## 5. Decisions required (options unranked)

### D1 — `SOURCE_WEIGHT` values for `PUBLIC_INTENT` and `FIRST_PARTY`

The type requires a number. The value affects `scoreLead()` only, which has no production caller (§3).
Existing values for reference: JOB_POST 30 ("a company stating a need in public and attaching a budget"),
FUNDING 25, MANUAL 20, NEWS 15, TECH_STACK 15, LINKEDIN 12, REVIEW 10, WEBSITE 8. `scoreLead` clamps the total
at 100.

- **Option A — Product Owner supplies explicit values** for each kind.
- **Option B — Each new kind reuses an existing kind's value.** The Product Owner names which kind.
- **Option C — Both set to 0.** They then add nothing to `scoreLead`, which records that they carry no
  legacy-ranking weight. Their keys still widen the trigger vocabulary.

### D2 — `SCORER_VERSION` (`prospectScore-v1`)

`scoreProspect()` gives the same output as before for every existing input. Adding kinds does not change its
arithmetic.

- **Option A — Bump** (e.g. `prospectScore-v2`). Every re-scored Opportunity records the new version.
- **Option B — Do not bump.** The version continues to mean "the same `scoreProspect` arithmetic".

### D3 — How intent signals reach the offer engine

- **Option A — Per-ServiceProfile opt-in.** C1 widens the trigger vocabulary, and a ServiceProfile must list
  `PUBLIC_INTENT` / `FIRST_PARTY` in `triggers` to match them. No existing profile changes. How triggers are
  derived remains OQ-4.
- **Option B — Implicit triggers.** `toServiceRule()` adds the intake kinds to every rule's triggers. A keyword
  match against `service_profiles.keywords` is still required.
- **Option C — Offer-inert in the MVP.** Intake signals are stored and scored but never trigger an offer. The
  MVP proves storage, identity, supersession and scoring only, and the pipeline ends at HOLD.

### D4 — Qualification of an intake-only Prospect (CATEGORY_PLAUSIBLE)

- **Option A — Intake triggers the existing Research run** for the Prospect. At runtime this means a homepage
  fetch plus a model call, and category plausibility stays under the Path 2 records. Tests would use existing
  fakes.
- **Option B — Intake stops at Score and Qualify.** Qualification records INSUFFICIENT_EVIDENCE or
  NOT_QUALIFIED unchanged. Personalization and preparation do not run until a later Research run.
- **Option C — Change qualification for intake kinds.** This alters a Path 2 (D4) criterion and would need its
  own governance, outside this record.

### D5 — Confidence assigned to intake signals

The schema allows OBSERVED 0–100. The thresholds that matter are ≥50 (`visibleProblem` eligibility) and ≥70
(counted as well-sourced in `evidenceQuality`).

- **Option A — Fixed value per kind,** supplied by the Product Owner.
- **Option B — Caller-supplied value** within a range set by the Product Owner for each kind.

### Already deferred by the prompt (not decided here)

- Whether first-party budget and timeline should fill `abilityToPay` / `urgency`
- G1 (company without a domain)
- G2 (inbound Search identity)
- G3 (cross-Search deduplication)
- `acquisition_events` and economics
- Live providers

## 6. What is ready once D1–D5 are decided

1. Migration `0029_research_signal_intent_kinds` (widen the check constraint only). Created and hashed, **not
   executed**.
2. C1: add the kinds in `scoring.ts` and `persist.ts`, add the `SOURCE_WEIGHT` entries (D1), and apply the
   `SCORER_VERSION` decision (D2).
3. C2: kind-scoped `supersedePrevious`, with regression tests for the existing kinds and for intake survival.
4. C3: `recordIntentSignalForOwner` with validation, `findOrCreateByDomain`, Prospect `findOrCreate`, an OBSERVED
   `saveSignals` call with `observedAt`, then the extracted post-research pipeline segment, following D3 and D4.
5. The tests listed in the prompt (§10).

## 7. Privacy / data-minimization boundary (technical, not a legal conclusion)

Intake would accept only: company name, website, kind, a problem-shaped field, a quote, a source URL, a source
label and an observation time. It stores no author profile, no personal identifiers beyond those contained in
the quote, and no inferred sensitive attributes. It sends nothing, because the preparation layers have no
SENT state. It adds no live provider and no retrieval of private or login-only content. Whether these
boundaries are legally sufficient under DPDP, the IT Act, TRAI or platform terms is not assessed here.

## 8. Execution counters (this preparation)

```text
Anthropic API calls: 0
Google API calls: 0
External API calls: 0
Live-source fetches: 0
Participant contacts: 0
Validation sessions: 0
Searches submitted: 0
Manual retries: 0
Worker jobs initiated: 0
Database writes: 0
Migrations executed: 0
Production runtime changes: 0
```

Files created: this record only. Files modified: none. Files staged: 0. Commits: 0.
