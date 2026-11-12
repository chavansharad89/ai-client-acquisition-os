# CLIENT FINDER — PCG-4 / CATEGORY-PLAUSIBILITY TEST COVERAGE (K5-D2) — PRODUCT OWNER DECISION

**Decision ID:** CF-PCG4-CATEGORY-PLAUSIBILITY-TEST-COVERAGE-PO-DEC-001
**Related decisions/documents:** `requirement/CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` (PO Decision 2, Options A-D, where this selection was prepared); `requirement/CLIENT_FINDER_PHASE_K5_IMPLEMENTATION_READINESS_AUDIT.md` (confirms the selected option is implementable with zero production-code change); `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002` (Service+Geography-only NEW-search input — this decision preserves, not reopens, that restriction); `CLIENT_FINDER_QUALIFICATION_WITHOUT_CATEGORY_PLAUSIBILITY_PO_DECISION.md` (the underlying reason NEW searches cannot reach category plausibility at all).
**Decision title:** PCG-4/category-plausibility/target-customer-match integration coverage is preserved via a test-only construction helper, with no new production API
**Date:** 2026-10-24
**Authority:** Product Owner
**Status:** DECIDED
**Selected option:** Option B (of the four options presented in `CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` §4) — "Preserve the tests through a test-only/back-door construction path"
**Scope of this record:** Formally documents a decision that was already made and is already implemented as a test-only helper prior to this record's creation. This record does not authorize new implementation, redesign, or any change to production code — it records, for the governance trail, the decision the existing test helper already reflects.

## Context

`CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002` made NEW Service+Geography-only searches unable to supply a caller-provided `targetCustomer` (it is forced to a system sentinel by `applySystemServiceProfileDefaults()`). As a direct, already-authorized consequence, this disabled, for NEW searches: the target-customer-match (TCM) write path and category-plausibility determination-writing, both of which are gated on `parseTargetSegments(search.parameters.targetCustomer).length > 0` (`packages/core-research/src/categoryPlausibilityPgRepository.ts:178-195` and `packages/core-research/src/service.ts`). This left pre-existing PCG-4/TCM/category-plausibility integration tests — written against the pre-restriction behavior — unable to construct the input they need, since the real HTTP path can no longer produce a real `targetCustomer`.

`CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` §4 presented four options for what should happen to that coverage (A: retire/rewrite the tests; B: preserve them via a test-only/back-door construction path; C: formalize two explicit search modes as a durable architectural concept; D: other). The implementation-readiness audit confirmed Option B requires zero production-code change: the repository layer underneath `createServiceProfile()` (`ServiceProfileRepository.create`, `SearchRepository.create`) already accepts the full `ServiceProfileFields` shape including a real `targetCustomer` — only `createServiceProfile()`'s own public signature restricts callers to `NewSearchServiceProfileInput`. A test-only helper can call the repository layer directly, bypassing `createServiceProfile()`/`applySystemServiceProfileDefaults()` entirely, exercising the real TCM/category-plausibility write paths end-to-end with no new production surface.

**The PO selected Option B.** It is now implemented as `createHistoricalServiceProfile()` in `tests/integration/support/historicalServiceProfile.ts`.

## PO decision

**Production NEW searches remain Service+Geography-only; callers cannot supply `targetCustomer`, `minProjectValuePaise`, `triggers`, `keywords`, or `rationale`. Where existing PCG-4/historical-behavior tests require the historical ServiceProfile shape, tests may use a test-only construction helper that directly constructs the existing full `ServiceProfileFields` through the repository layer.**

This helper, `createHistoricalServiceProfile()` (`tests/integration/support/historicalServiceProfile.ts:31-38`):

1. must remain test-only — it lives under `tests/integration/support/`, imported only by test files, never by any file under `apps/web`, `apps/worker`, or any package's non-test source;
2. must not be exported through a production HTTP/API path — confirmed: `createServiceProfile()`'s public `NewSearchServiceProfileInput` restriction (`packages/core-service-profile/src/types.ts:58`, `Pick<ServiceProfileFields, 'service'|'geography'>`) is untouched, and the one real production HTTP route, `apps/web/app/api/service-profiles/route.ts`, is not modified by or aware of this helper;
3. must not weaken the production Service+Geography contract — the helper calls `profiles.create(userId, fields, now)` directly, the same repository call `createServiceProfile()` itself makes internally, bypassing only `applySystemServiceProfileDefaults()`; no change to `createServiceProfile()`, the HTTP route, or any caller-facing type;
4. must not permit new-search callers to provide `targetCustomer` — "new-search caller" here means any real request path (HTTP or otherwise) available to a freelancer or integration; the helper is reachable only from test code that constructs its own repository instances directly, not from any caller-facing flow;
5. exists only to preserve coverage of historical behavior — specifically, PCG-4/TCM/category-plausibility integration tests that exercise the real write paths gated on a non-sentinel `targetCustomer`.

## Historical behavior

Unchanged. A genuine historical `ServiceProfile`/`Search` row (one already carrying a real `targetCustomer`, created before or independent of the Service+Geography-only restriction) is never read, rewritten, or reinterpreted by this decision or its helper. The helper only ever constructs new, test-fixture rows that mimic a historical search's shape for test purposes; it does not touch, migrate, or backfill any actual historical data.

## Relationship to R-70/R-71

Not applicable — this decision concerns ServiceProfile/Search construction for test fixtures, not opportunity-adapter evidence filtering. R-70/R-71 are unaffected and unreferenced by this decision or its helper.

## Mandatory boundaries on this decision

1. This is a governance/documentation decision only, recording an already-made PO selection and its already-existing test-only implementation.
2. No production code, configuration, `.env`, database schema, or migration change is authorized, introduced, or implied by this record.
3. `createServiceProfile()`'s `NewSearchServiceProfileInput` restriction, and the Service+Geography-only contract it enforces, are not changed, weakened, or reopened by this record.
4. No new HTTP route, API surface, or freelancer-facing field is authorized by this record.
5. Global Entity architecture, Phase 7B, Phase 8, K5-D1, qualification, ranking, and the ₹1,499 commercial architecture are not changed, reinterpreted, or reopened by this record.

## Explicit non-decisions

This record does **not** decide or authorize:

- Option C's "formalize two explicit search modes as a durable architectural concept" — that broader scope was not selected and is not revisited here.
- Any rewrite or retirement of the integration test files that use this helper.
- Any change to `createServiceProfile()`, its HTTP route, or any production repository interface — the helper calls existing, unmodified repository functions only.
- Any migration, schema change, or backfill of historical data.

## Implementation status

**ALREADY IMPLEMENTED (test-only).** `createHistoricalServiceProfile()` exists at `tests/integration/support/historicalServiceProfile.ts:31-38`, confirmed present in the current working tree, confirmed test-only (no non-test import found), and confirmed to call only existing, unmodified repository functions. This record does not authorize new implementation — it documents the decision the existing helper already reflects. No code, test, migration, or schema file was changed to produce this record.
