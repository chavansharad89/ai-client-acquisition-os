# INTENT INTAKE MVP

## E1/E2 and Multi-Signal Intake — Implementation Record

**Record ID:** INTENT-INTAKE-IMPL-REC-002
**Status:** **IMPLEMENTED** (not committed; migration 0029 not applied to any persistent database)
**Governing decision (E1/E2):** INTENT-INTAKE-PO-DEC-002 (`requirement/INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION.md`,
sha256 `638b9aa30a3c1f36598b14278fd994729a8f14bbd320c0607244ba23f2f132c4`)
**Predecessor preparation record:** `requirement/INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION_PREPARATION.md` (sha256
`d4858705e70002839a97acdcc460385ead2e2857bee6dc49cd599b46aceeb4c9`, unchanged)
**D1–D5:** governed by INTENT-INTAKE-PO-DEC-001 (`requirement/INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md`, sha256
`52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407`, unchanged)
**Prior records:** INTENT-INTAKE-IMPL-REC-001 (`f1ab2804…d4a9`), INTENT-INTAKE-IMPL-REVIEW-001 (`27c534d5…f89a`),
both unchanged
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28` (unchanged)
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under §9.8.

> This record documents implementation only. It does not authorize live validation.

```text
E1 ........................ A — IMPLEMENTED (existing behavior kept; no code change needed)
E2 ........................ A — IMPLEMENTED (no status gate; no code change needed)
MULTI-SIGNAL INTAKE ....... IMPLEMENTED AND VERIFIED
MIGRATION 0029 ............ UNCHANGED — NOT APPLIED TO THE VALIDATION DATABASE
VALIDATION SESSION ........ NOT AUTHORIZED BY THIS RECORD — REMAINS STOPPED (§9.8)
```

**Sequence note:** the Product Owner supplied E1 = A and E2 = A in the 2026-09-30 implementation authorization, and
the implementation was carried out under it. The decision was then recorded as INTENT-INTAKE-PO-DEC-002. That record,
not this one and not the implementation, is the decision authority for E1/E2.

---

## 1. Baseline

| Item | Before implementation | After implementation |
|---|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | unchanged |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `bbcfc90feeab4d23f91139ce0148414d9f7c4572b265fc43fcdf0dcd9d0f836b` (matches INTENT-INTAKE-IMPL-REVIEW-001) | `5401f9491d38f7c5df97081eaab00abd81608b83d87948a00a271cec156e3100` |
| Staged files | 0 | 0 |
| Migration 0027 | `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508` | unchanged |
| Migration 0028 | `bd8777158f84bcfefbde4ad0dde33beeb0c47d00bf91db18ff35f09d5ced6986` | unchanged |
| Migration 0029 | `ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c` | unchanged |

The "after" fingerprint was re-confirmed when this record was written.

## 2. Decision-to-implementation mapping

| Decision | Selected option | Implementation behavior | Evidence |
|---|---|---|---|
| E1 | A — Accept/keep the current behavior | Existing find-or-create is unchanged. Intake on a Prospect that already has an Opportunity creates no second Opportunity and does not re-evaluate the existing one's offer or next action. | `runPostResearchPipelineForOwner` (`apps/worker/src/searchWorker/worker.ts`, unchanged by this work); worker test `E1: intake on a Prospect with an existing Opportunity creates no second Opportunity and leaves its offer / next action untouched` |
| E2 | A — Accept any Search status | No status allow-list. The Search lookup is an ownership check only; status is never read and never counts as evidence. | `recordIntentIntakeForOwner` (`apps/worker/src/searchWorker/intentIntake.ts`), `deps.searches.getById(userId, searchId)` with a not-found check only; worker test `E2: a %s Search is accepted …` (5 cases) |

## 3. E1 — implemented behavior

```text
Existing Prospect + existing Opportunity + new intake signal
  = signal persisted on the Prospect
    without a second Opportunity
    and without re-evaluating the existing Opportunity's offer or next action
```

- Existing find-or-create behavior remains unchanged.
- No second Opportunity is created.
- The existing Opportunity is not re-evaluated merely because another intake signal arrives.
- No new offer or next-action evaluation is introduced.

**Evidence:** the E1 worker test uses a ServiceProfile that opts into `PUBLIC_INTENT`.
1. A first intake of `FIRST_PARTY`, which is not opted in, creates the Opportunity with `needDetected = false`.
2. A second intake of `PUBLIC_INTENT` + `FIRST_PARTY` returns the same `opportunityId`.
3. The Opportunity row is deep-equal to its pre-intake snapshot, and there is still exactly one row.
4. The new `PUBLIC_INTENT` signal is active on the Prospect.

## 4. E2 — implemented behavior

```text
Search status is not used as an intake rejection gate.
Accepting a Search reference does not establish research evidence.
```

- Intake does not reject a Search based on status. No status allow-list was added.
- The Search lookup remains an ownership check (an unknown or another user's Search → `IntentIntakeSearchNotFoundError`).
- The repository's `SearchStatus` (`packages/core-search/src/types.ts`) is `PENDING | RUNNING | COMPLETE | FAILED |
  CANCELLED`. All five are accepted.
- Search status is not treated as evidence of research success; no CATEGORY_PLAUSIBLE determination comes from it.

**Evidence:** worker test `E2: a %s Search is accepted — status is neither gated nor changed, and never stands in for
research evidence`, run for each of the five statuses. In each case:
- both signals persist;
- the Search's status is unchanged;
- the only determination is the MISMATCH produced by the existing Research run (fake provider);
- the Qualification is NOT_QUALIFIED with CATEGORY_PLAUSIBLE unsatisfied.

## 5. Multi-signal intake

**Input shape** (`packages/core-research/src/intentSignal.ts`):
- `RecordIntentIntakeInput`: `{ searchId, companyName, website, signals: IntentSignalEntry[] }`
- `IntentSignalEntry`: the per-signal part of `RecordIntentSignalInput`, i.e. `kind`, `field`, `quote`, `sourceUrl`,
  `sourceLabel` and `observedAt`.

**Validation** (`toIntentIntakeInput`):
- An empty or missing signal list is rejected (`signals`, `required`).
- All signals are validated before any persistence begins.
- Each entry goes through the existing `toIntentSignalInput`, so the single-signal rules remain authoritative per
  signal.
- Caller-supplied `confidence` or `classification` is rejected (`not-allowed`), at event level and on any entry.
- Entry errors name the entry, e.g. `signals[1].confidence`. Event-level errors keep their field names.

**Fixed confidence (D5, unchanged):** `PUBLIC_INTENT = 70` and `FIRST_PARTY = 90`, both `OBSERVED`.

**Orchestration** (`recordIntentIntakeForOwner`, `apps/worker/src/searchWorker/intentIntake.ts`):
1. Validate the whole event.
2. Look up the caller's own Search (ownership only; E2).
3. Company via `normalizeCandidate` + `findOrCreateByDomain`; an unusable website is rejected (G1).
4. Prospect via `findOrCreate` on (Search, Company) (G3).
5. Persist each signal with its own `saveSignals` call and its own `observedAt`.
6. If no CATEGORY_PLAUSIBLE determination exists, run the existing Research path (`researchProspectForOwner`) (D4).
7. Run the existing post-research pipeline (`runPostResearchPipelineForOwner`): Opportunity (E1 find-or-create),
   Score, Qualification and the downstream steps it already runs. This runs once per event.

`recordIntentSignalForOwner`, the existing single-signal form, is kept. It validates with `toIntentSignalInput`, which
keeps its original error field names, and then calls `recordIntentIntakeForOwner` with a one-signal list.

**Persistence and supersession:**
- Signals are persisted separately, one write per signal. **Persistence is not transactionally atomic.**
- Saving is append-only, so signals in the same event do not supersede one another.
- Research-signal supersession (`supersedePrevious`, `kind <> ALL(…)` in `pgRepository.ts`) is unchanged and
  remains restricted to research signals.
- ServiceProfile opt-in (D3) remains the only offer-triggering mechanism.

## 6. Files changed by the implementation

**Production (4):**
- `packages/core-research/src/intentSignal.ts`: `IntentSignalEntry`, `RecordIntentIntakeInput`,
  `ValidatedIntentIntake`, `toIntentIntakeInput`.
- `packages/core-research/src/index.ts`: exports for the above.
- `apps/worker/src/searchWorker/intentIntake.ts`: `recordIntentIntakeForOwner` and `SingleIntentIntakeResult`;
  `recordIntentSignalForOwner` now delegates.
- `apps/worker/src/searchWorker/index.ts`: exports for the above.

**Tests (3):**
- `apps/worker/src/searchWorker/worker.test.ts`
- `packages/core-research/src/intentSignal.test.ts`
- `tests/integration/intent-intake.integration.test.ts`

No schema, migration, configuration or dependency changes. None of these files was modified by this documentation
task.

## 7. Tests

**Added (16):**

| File | Tests |
|---|---|
| `worker.test.ts` (10) | PUBLIC_INTENT + FIRST_PARTY in one event (both persisted, OBSERVED, 70/90, own `observedAt`, neither superseded, research once, one Opportunity); one-signal event; whole-event rejection with nothing persisted (entry `confidence`, event `confidence`, empty list); repeated multi-signal intake + later Research run (intake rows stay active, research rows superseded same-kind); E1; E2 × 5 statuses |
| `intentSignal.test.ts` (5) | per-signal 70/90 and `observedAt`; one-signal event equals single-signal construction; empty/missing list; `confidence`/`classification` at event and entry level; event-level vs entry-level error fields |
| `intent-intake.integration.test.ts` (1) | real Postgres: both intake kinds saved per signal remain active after a research run |

**Results (all passing):**

| Area | Result |
|---|---|
| Worker | 208/208 passed (198 prior + 10 new) |
| Core research | 308/308 passed (303 prior + 5 new) |
| Core acquisition | 155 passed |
| Core opportunity | 97 passed |
| Core service profile | 31 passed |
| Core qualification | 30 passed |
| Core personalization | 31 passed |
| Integration suites (11 files: intent-intake, research, search-worker, qualification, opportunity, opportunity-score, -staleness, -next-action, -ranking, -feedback, -tracking) | 108/108 passed |
| Core-research typecheck (`tsc --noEmit`) | Passed |
| Worker typecheck (`tsc --noEmit`) | Passed |
| Real-Postgres multi-signal test | Passed |

**Commands used:**
- Unit suites: `npx vitest run` in each package directory.
- Integration: `npx vitest run --config integration/vitest.config.ts integration/intent-intake integration/research.integration integration/search-worker integration/qualification integration/opportunity`
  in `tests/`.

**Environment:**
- Provider calls in tests were fakes.
- Integration tests used throwaway databases on the local test server (`127.0.0.1:5433`).
- The validation database on port 5434 was not touched.

**Not re-run:** the personalization, outreach-preparation and follow-up-preparation integration suites. They are not
represented as passing. INTENT-INTAKE-IMPL-REVIEW-001 §4 already established their 14 failures as pre-existing.

## 8. Migration

| Item | Value |
|---|---|
| File | `packages/db/prisma/migrations/0029_research_signal_intent_kinds/migration.sql` |
| sha256 | `ca498e339d76960b48dda9b0b6ee836d10759af4696428da1d0a5437b91da21c` |
| Created by this work | No, it already existed |
| Modified | No |
| Applied to the validation database | No |

- Migrations 0027 and 0028 are unchanged.
- No migration was executed against any persistent database during the implementation.
- This documentation task applied no migrations.
- This record does not authorize applying 0029.

## 9. Known limitations

1. Multi-signal persistence uses separate writes and is not transactionally atomic.
2. There is no maximum signal count for one intake event.
3. Intake has no HTTP caller yet.
4. Migration 0029 still needs separate authorization before it is applied to the validation database.
5. No live validation is authorized by this implementation record.

## 10. Safety counters (implementation task)

```text
Anthropic API calls: 0
Google API calls: 0
Gemini API calls: 0
Claude consumer calls: 0
Live-source fetches: 0
Participant contacts: 0
Validation sessions: 0
Searches submitted: 0
Manual retries: 0
Validation DB writes: 0
Validation migrations executed: 0
```

This documentation task performed no provider, database, worker or application activity.

## 11. Governance linkage

- **D1–D5:** remain governed by INTENT-INTAKE-PO-DEC-001. This record does not restate or modify them.
- **E1–E2:** governed exclusively by INTENT-INTAKE-PO-DEC-002 (sha256
  `638b9aa30a3c1f36598b14278fd994729a8f14bbd320c0607244ba23f2f132c4`).
- **Predecessor preparation:** `requirement/INTENT_INTAKE_MVP_OPEN_BEHAVIOR_DECISION_PREPARATION.md` (sha256
  `d4858705e70002839a97acdcc460385ead2e2857bee6dc49cd599b46aceeb4c9`). Not modified.

## 12. Scope boundary

- E1 does not authorize offer re-evaluation.
- E2 does not create a Search-status allow-list.
- This record does not alter D1–D5.
- This record does not authorize:
  - live validation, or starting or resuming the validation session;
  - submitting or retrying Search 1 or Search 2;
  - contacting P-01, participant review or the §6.4 spot-check;
  - provider calls (Anthropic, Google Places, Google Search, Gemini);
  - live-source fetches;
  - worker jobs;
  - inspecting or modifying the validation database;
  - applying migration 0029;
  - modifying validation-session records;
  - any new validation authorization.

Files created by this task: this record only. Files modified: none.

## 13. Conclusion

**INTENT-INTAKE E1/E2 IMPLEMENTATION RECORDED**

E1 = A — Accept/keep the current behavior.

E2 = A — Accept any Search status.

Multi-signal intake is implemented and verified.

`INTENT-INTAKE-PO-DEC-002` is the authoritative Product Owner decision source for E1/E2.

**NO LIVE VALIDATION AUTHORIZED BY THIS RECORD.**
