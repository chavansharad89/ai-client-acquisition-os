# PCG-4 TARGET_CUSTOMER_MATCH Integration Test — Commit Authorization Preparation

## Status
Preparation only. No decision has been made. No code, staging, commit, or push has occurred.

## Governing chain
- `PDEF4-PCG4-PO-DEC-001`
- `PDEF4-PCG4-ED-DEC-001`
- `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`
- `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001`
- `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`
- `PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001`
- PCG-4 post-commit/status audit
- `CLIENT_FINDER_PDEF_4_PCG4_REAL_RESEARCH_E2E_TEST_SCOPE_CLARIFICATION_PREPARATION.md`
- `CLIENT_FINDER_PDEF_4_PCG4_REAL_RESEARCH_E2E_TEST_SCOPE_DETERMINATION.md`
- `CLIENT_FINDER_PDEF_4_PCG4_GOVERNANCE_RECONCILIATION_PREPARATION.md`

None of these decisions are reinterpreted or reopened by this document.

## Implementation authorization already exists
Implementation authorization for the PCG-4 `TARGET_CUSTOMER_MATCH` integration (production wiring, the gate evaluation mechanism, and the test coverage for it) was already granted under the governing chain above. This preparation record does not request, extend, or create any implementation authorization. It addresses a single remaining gap: explicit authority to commit one already-existing, already-passing test file.

## Exact file boundary
Proposed commit contains exactly one file:

- `tests/integration/target-customer-match.integration.test.ts` (324 lines, currently untracked, unmodified)

Nothing else. No contents are added, removed, or altered in this file as part of this preparation.

## Why the file is independently committable
- The file already exists in the working tree in its final form.
- It was written against, and already exercises, the production wiring authorized under `PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001`.
- It has no interdependency on any other currently-dirty file (Pattern B files/lockfile, Pattern A, `packages/core-*`, migrations, the other two integration test files, `apps/web/tsconfig.tsbuildinfo`, or unrelated requirement/governance files) to compile, run, or pass.
- Committing it does not alter any production code path or behavior.

## Validation already performed
- The test suite passes 8/8 against real Postgres (prior run, referenced in the PCG-4 post-commit/status audit).
- The file was re-verified present at 324 lines and untracked (`git status --porcelain`) as part of this preparation, with no modification made.

## Explicit exclusions
The proposed commit must **not** include:
- Pattern B files
- Pattern B lockfile changes
- Pattern A
- any `packages/core-*` files
- migrations
- `tests/integration/launch-gates-phase9.integration.test.ts`
- `tests/integration/search-worker.integration.test.ts`
- `apps/web/tsconfig.tsbuildinfo`
- unrelated requirement/governance files
- any other dirty-tree changes

## Preserved conclusions (not reopened)
1. Implementation authorization already exists.
2. The test already exists and passes 8/8 against real Postgres.
3. The test is independently committable.
4. No production implementation change is being requested.
5. No new PCG-4 semantic/design decision is required.
6. The only missing authority is explicit commit authorization for this specific test file.
7. The previously identified hypothetical pipeline-level E2E ambiguity does not apply to this file and must not be reopened.

## Current authority state
Commit and push authority for this file is currently **absent**. No commit has been made under this governing chain for this file. No push has occurred on this branch (branch is ahead of upstream by 2 commits, both pre-existing and unrelated to this file).

## Proposed authorization (for Product Owner decision — see companion questionnaire)
Commit `tests/integration/target-customer-match.integration.test.ts` exactly as it currently exists, with no content modification and no other files included in the same commit.

## Stop conditions
This preparation record does not itself authorize anything. Work stops here pending the Product Owner's answers to `CLIENT_FINDER_PDEF_4_PCG4_TCMATCH_COMMIT_AUTHORIZATION_QUESTIONNAIRE.md`. Specifically:
- No file is staged until authorization is explicit.
- No commit is created until authorization is explicit.
- No push occurs under any circumstance covered by this preparation, regardless of authorization outcome, unless separately and explicitly authorized.
- If authorization is withheld or deferred, no further action is taken on this file beyond leaving it untracked.
