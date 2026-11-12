# INTENT INTAKE MVP

## Implementation Review / Release-Gate Audit Record

**Record ID:** INTENT-INTAKE-IMPL-REVIEW-001
**Date:** 2026-09-30
**Final classification:** **DECISION REQUIRED**
**Reviewed against:** INTENT-INTAKE-PO-DEC-001, revision 2
**Implementation record reviewed:** INTENT-INTAKE-IMPL-REC-001
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The §9.8 stop stays in force.

This was a review only: no source, test, migration, governance or ServiceProfile change was made. The one file created
is this record.

---

## 1. Baseline (captured before inspection; matches the implementation record's end state)

| Item | Value |
|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Working tree | 188 entries, 0 staged. That is the 187 at the implementation gate plus the implementation record, which was written after the gate. |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `bbcfc90feeab4d23f91139ce0148414d9f7c4572b265fc43fcdf0dcd9d0f836b` (matches the post-implementation value) |
| Migration 0027 | `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508` (unchanged) |
| Migration 0028 | `bd8777158f84bcfefbde4ad0dde33beeb0c47d00bf91db18ff35f09d5ced6986` (unchanged) |
| Migration 0029 | `ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c` |
| Decision record | `52ee6164…7407`. Contains D5 Round 2: `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90` (lines 22, 52). |
| Implementation record | `f1ab280412b4fa0e9710e0686e87febb6c93bac8525c479ffd2b406a7fc8d4a9` |

**Files modified since the preparation record** (by mtime), exactly the implementation record's list:
- 15 source, test or migration files
- 2 records
- the incidental `apps/web/tsconfig.tsbuildinfo`

Unmodified against HEAD: `prospectScore.ts`, `offer.ts`, `core-opportunity/adapters.ts`, `scoringAdapter.ts`,
`mapping.ts`, and all `core-qualification` sources.

## 2. Decision compliance

| Decision | Required behavior | Status | Evidence |
|---|---|---|---|
| D1 | `PUBLIC_INTENT = 0`, `FIRST_PARTY = 0` | **PASS** | See D1 notes below. |
| D2 | `SCORER_VERSION = 'prospectScore-v1'` | **PASS** | See D2 notes below. |
| D3 | ServiceProfile opt-in only | **PASS** | See D3 notes below. |
| D4 | Existing research path for an intake Prospect without a determination | **PASS** | See D4 notes below. |
| D5 | Fixed OBSERVED confidence 70 / 90 | **PASS** | See D5 notes below. |

**D1 evidence**
- `scoring.ts:57-58`.
- `SOURCE_WEIGHT` values are read only by `scoreLead()` (`scoring.ts:99`), which has no production caller.
- `scoreProspect()` does not read `SOURCE_WEIGHT`, and `prospectScore.ts` has no diff against HEAD.
- Tests assert the whole table and a `scoreLead()` contribution of 0.

**D2 evidence**
- `service.ts:193` is unchanged.
- It is pinned by `adapters.test.ts`.

**D3 evidence**
- The only change is two new `SOURCE_WEIGHT` keys, which widen the vocabulary accepted by `core-service-profile/validation.ts:24` and `adapters.ts:18`.
- `suggestOffers`, `toServiceRule` and `toOfferSignals` have no diff against HEAD, and there is no implicit trigger path.
- Tests: a profile that does not list the kind gets `needDetected = false`. PUBLIC_INTENT and FIRST_PARTY each trigger only when listed, and FIRST_PARTY opt-in does not admit PUBLIC_INTENT.
- No ServiceProfile row was written. The only DB activity was on integration throwaway databases.

**D4 evidence**
- `intentIntake.ts` runs `researchProspectForOwner` (the unmodified `runResearchForOwner`) when `getCurrentByProspectId` returns null, then `runPostResearchPipelineForOwner`.
- `core-qualification` sources are untouched.
- Tests: order is signal, then research, then determination, then Opportunity, Score and Qualification. A MISMATCH determination gives NOT_QUALIFIED. With no determination repository, no Qualification is produced.
- The extraction's equivalence rests on the 58 existing worker tests passing unmodified.

**D5 evidence**
- `INTENT_SIGNAL_CONFIDENCE = {70, 90}` and classification `'OBSERVED'` are set in `toIntentSignalInput()`.
- The presence of `confidence` or `classification` in the input is rejected as `not-allowed`, even when equal to the fixed value.
- Covered by unit, worker and real-Postgres tests.

### Other contract checks (§3 A, E)

| Check | Result |
|---|---|
| Only `PUBLIC_INTENT` and `FIRST_PARTY` added | PASS: TypeScript unions and the 0029 check list |
| Provenance persisted (URL, quote, label) | PASS: integration test reads `research_signal_sources` |
| `observed_at` required, never substituted | PASS: missing, invalid or future values are rejected; an integration test proves `observed_at` equals the supplied value and `created_at > observed_at` |
| Quote verbatim | **PASS with note:** interior text is stored exactly, but leading and trailing whitespace is trimmed (`requiredString`, `intentSignal.ts:103,160`). D1–D5 are silent on this. Minor; not a blocker. |
| Topical fields rejected | PASS: closed list of 6 problem-shaped fields; `companySummary`, `businessModel` and `targetCustomers` are rejected (tested) |
| Research supersession excludes intake kinds; research kinds unchanged | PASS: `pgRepository.ts` adds `AND kind <> ALL($3)`; unit and real-Postgres tests show intake rows stay active and research rows are superseded and replaced 1:1 |
| Intake events do not replace each other | PASS: append-only; the dedup test keeps both signals |
| G1: usable domain required | PASS: rejected before any write (tested) |
| G2: existing, caller-owned Search only | PASS: an unknown Search or another user's Search gives not-found; no Search is created (tested) |
| G3: no cross-Search merging | PASS: existing `findOrCreate(search, company)` only; no new dedup policy |
| Runtime reachability | `recordIntentSignalForOwner` has no runtime caller (it is exported only), so there is no production path, endpoint or provider wiring |

## 3. Migration 0029

- It drops and re-adds `research_signals_kind_check`, with the eight existing values plus `PUBLIC_INTENT` and
  `FIRST_PARTY`. It changes no column, default, index or other constraint.
- sha256 `ca498e33…da21c`.
- Not applied to any persistent database. It was applied only to throwaway databases created and dropped by the test
  harness on the local docker test server (`127.0.0.1:5433`).

## 4. Test audit

**Coverage of the §5 list:**

| # | Item | Result |
|---|---|---|
| 1 | Fixed 70 / 90 | Present |
| 2 | Override rejection (confidence and classification) | Present |
| 3 | Provenance persistence | Present (Postgres) |
| 4 | `observed_at` vs `created_at` | Present (Postgres) |
| 5 | Supersession exclusion | Present (unit and Postgres) |
| 6 | Opt-in | Present (worker, adapter, validation) |
| 7 | `prospectScore-v1` | Present |
| 8 | Intake-only research | Present |
| 9 | Post-research pipeline | Present |
| 10 | Schema compatibility, including rejection of other kinds | Present (Postgres) |

Coverage gaps (not blocking; no test exists for):
- `recordIntentSignalForOwner` end to end against Postgres repositories. The worker is covered with fakes and the
  repository layer with Postgres.
- The existing-Opportunity case in §6 A.
- Cross-Search non-merging.

**Tests passing** (all run in this review; local, deterministic, provider-free; provider unit tests confirmed to inject
fakes):
- core-research 303
- core-acquisition 155
- core-opportunity 97
- core-service-profile 31
- core-qualification 30
- core-personalization 31
- worker 198
- Integration, 88 in total: intent-intake 3, research 17, search-worker 7, qualification 11, opportunity 9,
  opportunity-score 13, -staleness 11, -next-action 9, -ranking 8

**Tests failing:** 14 in total: personalization 4, outreach-preparation 5, follow-up-preparation 5.

**Failures proven pre-existing:** all 14. Method:
1. The working tree, minus `.git`, was copied to the session scratchpad.
2. In that copy only, every intent-intake edit was reverted: kinds, weights, persist type, C2 SQL, the fake repository,
   exports, and the intake module, tests and migration 0029.
3. The three suites were run there, on throwaway databases.
4. Result: 14 failed and 26 passed. The failing-test list is **byte-identical** to the current tree's list (both lists
   have sha256 `6869c000…aeb`).

Root cause: the fixtures place their only need claim in `companySummary`, which R-71 (Phase 24) excludes from offers.
That gives `needDetected = false` and NOT_QUALIFIED. No changed production file is on that path: `toOfferSignals`,
`suggestOffers` and `core-qualification` are all unmodified. The intake change does not alter these fixtures' inputs,
since they use the `WEBSITE` trigger and no intake kinds. The copy was deleted afterwards.

**Failures not proven pre-existing:** none.

**Tests not run:**
- Suites that construct live providers: client-finder-web, discovery, category-plausibility-source-review,
  phase18-e2e, webhook-route, pixel-capi-dedup.
- Unrelated suites (payments etc.).
- Lint and typecheck: not re-run, because no code changed during this review.

## 5. Open items and scope audit

| Item | Finding | Status |
|---|---|---|
| **A. Existing Opportunity** | See A below. | **DECISION REQUIRED** |
| **B. Web-form triggers** | D3 requires that "a ServiceProfile must explicitly list" the kind. It does not address UI. Opt-in through validated API input satisfies D3 as worded, and the MVP is limited to controlled calls. UI exposure is a separate feature and was not added. | Consistent with D3. Not a D1–D5 gap. |
| **C. Search status** | See C below. | **DECISION REQUIRED** |
| G1: company without domain | Rejected; no behavior introduced | Deferred, unchanged |
| G2: inbound lead without Search | Rejected; no intake Search | Deferred, unchanged |
| G3: cross-Search dedup | None introduced | Deferred, unchanged |
| Acquisition events / economics | None introduced | Deferred |
| Live providers | None introduced; intake has no runtime caller | Deferred |
| abilityToPay / urgency enrichment | `neutralScoringInputs()` untouched | Deferred |

### A. Existing Opportunity

**What happens:** `runPostResearchPipelineForOwner` keeps the existing find-or-create. An intake signal on a Prospect that
already has an Opportunity is scored and qualified, but it never changes `needDetected` or the offer, even when the
profile has opted in.

**Classification:** This is not required by D1–D5. It is an implementation consequence of the pre-existing pipeline,
where the offer is computed once, at creation. D3 says "may contribute … only when", which restricts but does not
guarantee. D4 covers only Prospects without a determination.

**Why a decision is needed:** Whether intake should re-evaluate the offer for an existing Opportunity is undecided.
**Insufficient decisions:** D3 and D4. **Alternatives (unranked):**
- Accept the current behavior.
- Re-evaluate the offer on intake.
- Restrict intake to Prospects without an Opportunity.

### C. Search status

**What happens:** Intake accepts any Search the caller owns, including COMPLETE, FAILED or CANCELLED, with no status
check.

**Classification:** This is not authorized by any decision. It is an implementation choice that D1–D5 do not cover.
G2 requires only "an existing Search".

**Insufficient decision:** G2 / D4. **Alternatives (unranked):**
- Accept any status.
- Restrict to certain statuses, with the Product Owner naming which.

## 6. Governance

```text
D11 validation session: STOPPED / UNTOUCHED
Search 1: unchanged
Search 2: not submitted
P-01: not contacted
P-01 review: not performed
§6.4 spot-check: not performed
Validation executed: none
External API / provider calls: 0
Migration 0029 on persistent DB: not applied
Files staged / commits: 0 / 0
```

## 7. Final classification: **DECISION REQUIRED**

- D1–D5 are all implemented as decided (**PASS**).
- The test evidence is complete for the §5 list.
- All 14 integration failures are proven independent of this change.
- Two behaviors are not covered by any decision:
  - §5 A: an existing Opportunity's offer is not re-evaluated by intake.
  - §5 C: any Search status is accepted.

Once the Product Owner either accepts both as-is or selects an alternative, the implementation meets the criteria for
**READY FOR RELEASE REVIEW**. This record does not claim production readiness.
