# INTENT INTAKE MVP

## Implementation Record

**Record ID:** INTENT-INTAKE-IMPL-REC-001
**Status:** **IMPLEMENTED — READY FOR REVIEW** (not committed; migration 0029 not applied to any persistent database)
**Governing decision:** INTENT-INTAKE-PO-DEC-001, revision 2 (`INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md`, sha256
`52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` after this task's revision-2 update)
**Preparation record:** `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION_PREPARATION.md` (sha256
`90d924c3376e8ece79bba31dcd391ee7ca67289ec31a5814c36c43dcb61e15f1`, unchanged)
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28` (unchanged)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

---

## 1. Baseline

| Item | Value |
|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| `git status --short` before | 175 entries |
| Implementation fingerprint before (`git diff HEAD --binary`, excl. `requirement/`) | `3ce19e2b00abd8e06fa70d0f517a15acf5ec3edcfbcfe6324cb04e59efc68a2e` |
| 0027 / 0028 sha256 | `11823808…c508` / `bd877715…6986` (unchanged before and after) |

## 2. Decisions implemented

| ID | Decision | Implementation |
|---|---|---|
| D1 | `SOURCE_WEIGHT` `PUBLIC_INTENT = 0`, `FIRST_PARTY = 0` | Added in `core-acquisition/src/scoring.ts`. Weights feed `scoreLead()` only. `scoreProspect()` is not modified. |
| D2 | `SCORER_VERSION = 'prospectScore-v1'` | Unchanged. Pinned by a test. |
| D3 | ServiceProfile opt-in | Adding the two keys to `SOURCE_WEIGHT` lets ServiceProfile validation and `toServiceRule()` accept them. `suggestOffers()`, `toServiceRule()` and `toOfferSignals()` are unmodified. No ServiceProfile was changed. |
| D4 | Run the existing research | Intake runs `runResearchForOwner` (through `researchProspectForOwner`) when the Prospect has no current CATEGORY_PLAUSIBLE determination. It then runs the same post-research code as the canonical pipeline. Qualification is unmodified. |
| D5 | Fixed confidence: `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90`, OBSERVED | System-assigned in `toIntentSignalInput()`. A caller-supplied `confidence` or `classification` is rejected (`not-allowed`). |

Recording D5 revision 2 was a narrow governance update to the decision record. It adds a revision-history row,
changes the status lines, and adds §7.1. The revision-1 D5 text is kept as §7.2.

## 3. Behavior

- **Signal model:** Intake signals are ordinary `research_signals` rows. Their `kind` is `PUBLIC_INTENT` or
  `FIRST_PARTY`, their classification is `OBSERVED`, and `basis` is null. `signal` holds the verbatim quote, and there
  is exactly one `research_signal_sources` row with URL, quote and label. The `field` must be one of `statedRequirement`,
  `requestedWebsite`, `requestedMobileApp`, `requestedRedesign`, `requestedDevelopment` or `requestedFeature`. Topical
  fields are rejected (R-71).
- **Timestamps:** `observed_at` is the caller's `observedAt`. It is required, never invented, and must not be in the
  future. `created_at` is the database default capture time.
- **Supersession (C2):** `supersedePrevious` now excludes `PUBLIC_INTENT` and `FIRST_PARTY`
  (`AND kind <> ALL($3)`). Research re-runs supersede the eight research kinds exactly as before. Intake signals are
  append-only evidence: each is a distinct observed event, so a new intake signal never supersedes an earlier one.
- **Identity:**
  - G1: a website that doesn't normalize to a usable domain is rejected, and nothing is persisted.
  - G2: the caller's own existing Search is required. No Search is created and `search_id` is not nullable.
  - G3: Company is found or created by domain, and Prospect by `(search, company)`. There is no merging across Searches.
- **Pipeline extraction:** `runCanonicalPipeline`'s per-Prospect loop body now calls two exported functions,
  `researchProspectForOwner` and `runPostResearchPipelineForOwner`. Their content, order, gating and error propagation
  are unchanged. The existing worker tests pass unmodified.

## 4. Files

**Created:**
- `packages/core-research/src/intentSignal.ts` and `intentSignal.test.ts`
- `apps/worker/src/searchWorker/intentIntake.ts`
- `packages/db/prisma/migrations/0029_research_signal_intent_kinds/migration.sql`
- `tests/integration/intent-intake.integration.test.ts`
- this record

**Modified:**
- `packages/core-acquisition/src/scoring.ts`: kinds and D1 weights
- `packages/core-research/src/persist.ts`: kind type
- `packages/core-research/src/repository.ts`: C2 documentation
- `packages/core-research/src/pgRepository.ts`: C2 SQL
- `packages/core-research/src/testSupport.ts`: the fake repository mirrors C2
- `packages/core-research/src/index.ts`: exports
- `apps/worker/src/searchWorker/worker.ts`: the extraction
- `apps/worker/src/searchWorker/index.ts`: exports
- `apps/worker/src/searchWorker/worker.test.ts`: the local fake mirrors C2, plus 13 intake tests
- `packages/core-opportunity/src/adapters.test.ts`: D3 and D2 tests
- `packages/core-service-profile/src/validation.test.ts`: D3 test
- `requirement/INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md`: D5 revision 2

**Incidental:** `apps/web/tsconfig.tsbuildinfo` (the incremental `tsc` cache) was rewritten by the web typecheck. It
was already modified relative to HEAD at baseline.

## 5. Migration

`0029_research_signal_intent_kinds/migration.sql`, sha256
`ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c`. It drops and re-adds
`research_signals_kind_check` with the eight existing values plus `PUBLIC_INTENT` and `FIRST_PARTY`. Nothing else
changes.

It has **not** been applied to any development, validation or production database. The integration harness applied
it only to its own throwaway databases on the docker test server (`127.0.0.1:5433`), which it dropped at teardown.

## 6. Tests

| Command / suite | Result |
|---|---|
| Typecheck: core-acquisition, core-research, core-opportunity, core-service-profile, core-personalization, core-qualification, worker, web, tests | pass |
| ESLint on changed files | 0 errors. One warning in moved, pre-existing code (the `discovery.completed` `console.log`). |
| `vitest run`: core-research 303, core-acquisition 155, core-opportunity 97, core-service-profile 31, core-qualification 30, core-personalization 31, worker 198, tests (fixtures/pipeline) 47 | all pass |
| Integration (real Postgres, throwaway DB): intent-intake 3, research 17, search-worker 7, qualification 11, opportunity 9, opportunity-score 13, -staleness 11, -next-action 9, -ranking 8 | all pass |
| Integration: personalization, outreach-preparation, followup-preparation | **14 failures, pre-existing and not caused by this change.** Their fixtures put the only need signal in `companySummary`, a topical field that R-71 (Phase 24) excludes from offers. `needDetected` is therefore false and qualification returns NOT_QUALIFIED. This change does not touch R-71 or `toOfferSignals`. Not fixed: out of scope. |
| `git diff --check` | clean |

## 7. Remaining issues (not addressed)

1. The three integration suites in §6 need their fixtures updated for R-71. The worker unit fixture was already
   updated this way.
2. An intake signal for a Prospect that **already has an Opportunity** does not change `needDetected` or the offer.
   The existing pipeline computes the offer once, at Opportunity creation (`findByProspectId` then skip create). Scoring
   and Qualification do re-run.
3. The web `NewSearchForm` trigger checklist does not list `PUBLIC_INTENT` / `FIRST_PARTY`. Opting in is currently
   possible only through validated API input.
4. Intake accepts any existing Search owned by the caller, regardless of its status. No decision covers status
   restrictions.
5. Deferred by governance: G1, G2, G3, acquisition events and economics, live providers, and
   `abilityToPay` / `urgency` from first-party data.

## 8. Governance and safety

```text
D11 validation session: STOPPED / UNTOUCHED
Search 1: unchanged
Search 2: not submitted
P-01: not contacted
P-01 review: not performed
§6.4 spot-check: not performed
```

```text
Anthropic API calls: 0
Google API calls: 0
Google Places calls: 0
Google Search calls: 0
Gemini API calls: 0
Other external API calls: 0
Live-source fetches: 0
Participant contacts: 0
Validation sessions executed: 0
Searches submitted: 0
Manual retries: 0
Database writes to validation DB: 0
Production database writes: 0
```

Database activity was limited to integration-test throwaway databases on the local docker test server. No
development, validation or production database was connected to. Nothing is staged or committed.
