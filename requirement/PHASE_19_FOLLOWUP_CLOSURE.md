# Phase 19 — Provider Robustness & Trigger Vocabulary Contract — Closure

## STATUS

**PASS / CLOSED**

## OBJECTIVE

This phase addressed the two non-blocking follow-ups documented at Phase 18 closure
(`requirement/PHASE_18_PROVIDER_EXECUTION_CLOSURE.md`, "FOLLOW-UPS" section) without reopening
Phase 18. Phase 18's implementation, acceptance criteria, and closure statement are unmodified.

---

## WORKSTREAM A — SOURCE-DOCUMENT PROVIDER ROBUSTNESS

**Original issue.** Phase 18 validation observed that `mumbaiwebdesign.in`'s homepage triggers
`Error: Could not parse CSS stylesheet` from inside jsdom, and flagged this as a risk that the
error could escape `sourceDocumentProvider.ts`'s synchronous `try/catch` around `new JSDOM()` and
crash the worker process.

**Empirical finding.** The live `mumbaiwebdesign.in` homepage was fetched and fed through
`new JSDOM(html)` directly, with `process.on('uncaughtException'/'unhandledRejection')` handlers
attached to detect any escape. Construction completed successfully — jsdom's own default
`VirtualConsole` (`new VirtualConsole().sendTo(console)`, installed automatically when no
`virtualConsole` option is passed) already catches this failure internally: `createStylesheet()`
in jsdom's `stylesheets.js` wraps `cssom.parse()` in its own `try/catch` and, on failure, emits a
`jsdomError` event rather than throwing. **No literal process crash was reproduced.** The real,
confirmed risk is different: the default `VirtualConsole` forwards that `jsdomError` event to
`console.error(e.stack, e.detail)`, where `e.detail` is the full raw (potentially very large)
offending CSS text — dumping unbounded, uncontrolled content to stderr for every malformed-CSS
page a worker processes. For a long-running worker this is a log-flooding / observability
robustness risk, not a demonstrated crash.

**Implementation.** `extractText()` in
[`packages/core-research/src/sourceDocumentProvider.ts`](../packages/core-research/src/sourceDocumentProvider.ts)
now constructs `new JSDOM(html, { virtualConsole: new VirtualConsole() })` — a `VirtualConsole`
with no listeners attached. jsdom's internal `jsdomError` emission is absorbed silently (Node's
`EventEmitter` only throws on an unhandled `"error"` event specifically; `VirtualConsole`'s own
constructor already registers a no-op `"error"` listener to guard against that). No other line in
`extractText()`, `fetchHomepage()`, or `createHttpSourceDocumentProvider()` changed. Source
provenance (`label`/`url`/`text` shape), the homepage-only acquisition boundary, retry/non-retry
classification (`SourceFetchTransportError` vs. `[]`), and `SourceDocument` output semantics are
byte-for-byte unchanged.

**Regression coverage.** A new test in
[`packages/core-research/src/sourceDocumentProvider.test.ts`](../packages/core-research/src/sourceDocumentProvider.test.ts)
("extracts text safely when the homepage contains malformed CSS jsdom cannot parse —
mumbaiwebdesign.in regression") feeds a minimal `<style>` block reproducing the same jsdom
`cssom.parse()` failure path alongside real extractable article copy, and asserts extraction
still succeeds and returns exactly one `SourceDocument` — i.e. malformed CSS never blocks
extraction of the surrounding page content, and the call does not throw.

**Validation result.** `@acos/core-research`: 11/11 tests passed. Typecheck clean.

---

## WORKSTREAM B — SERVICE-PROFILE TRIGGER VOCABULARY CONTRACT

**Original mismatch.** Phase 18 validation found that `ServiceProfile.triggers` accepted
arbitrary free text (e.g. `"outdated website"`, `"poor mobile experience"`), while
`@acos/core-opportunity`'s `toServiceRule()` filters `triggers` against the fixed
`ResearchSourceKind` vocabulary (`WEBSITE`, `JOB_POST`, `LINKEDIN`, `NEWS`, `FUNDING`,
`TECH_STACK`, `REVIEW`, `MANUAL`). A free-text value never matches that vocabulary, so it was
silently filtered to an empty trigger array — deterministically producing `needDetected=false`,
`offer=null` for every prospect discovered under such a profile, regardless of its actual
research signals ("Adsara-class" scenario).

**Canonical vocabulary.** `ServiceProfileFields.triggers` (each item) MUST be one of
`@acos/core-acquisition`'s eight `ResearchSourceKind` values. This is the only representation any
consumer of the field (`toServiceRule()`) ever matches against a `ResearchSignal`; PRD OQ-4
("Derivation of ServiceProfile rule fields... not decided") is resolved only as far as
*representation* — the derivation *mechanism* (catalogue vs. AI pass) remains explicitly out of
scope, unchanged. This contract is now documented directly on
[`ServiceProfileFields.triggers`](../packages/core-service-profile/src/types.ts) in a JSDoc
comment.

**Validation boundary.** Enforced inside `validateServiceProfileInput()` in
[`packages/core-service-profile/src/validation.ts`](../packages/core-service-profile/src/validation.ts)
— the single input boundary both `createServiceProfile()` and `updateServiceProfile()` already
call before any persistence. Each `triggers` item is checked against a `VALID_TRIGGER_KINDS` set
derived from `@acos/core-acquisition`'s `SOURCE_WEIGHT` keys (the same runtime-vocabulary pattern
`toServiceRule()`'s own `isResearchSourceKind()` already uses, in `core-opportunity/adapters.ts`
— same source of truth, no duplicated literal list).

**Failure behavior.** A `triggers` item outside the vocabulary now throws
`ServiceProfileValidationError({ field: 'triggers', reason: 'not-in-vocabulary' })` synchronously
at profile creation/update time — a new, explicit `ServiceProfileValidationReason` value. This
replaces "accepted, then silently dropped several steps downstream" with "rejected, loudly, at
the boundary where the caller can act on it." `keywords` validation (`requireStringList`, same
length/item bounds) is untouched — `keywords` remains free text, matched against signal text by
`suggestOffers()`, a distinct field with distinct semantics.

**Regression coverage.** New tests in
[`packages/core-service-profile/src/validation.test.ts`](../packages/core-service-profile/src/validation.test.ts):
accepts valid `ResearchSourceKind` triggers; rejects a single free-text trigger; rejects the
exact Adsara-class pair (`"outdated website"`, `"poor mobile experience"`) and asserts the
specific `field`/`reason` on the thrown error; rejects a mix of one valid and one invalid trigger.

**Opportunity/scoring confirmation.** `toServiceRule()` and `suggestOffers()`
(`packages/core-opportunity/src/adapters.ts`, `src/service.ts`) were not modified — confirmed by
`git diff` containing zero changes under `packages/core-opportunity/`. `@acos/core-opportunity`:
80/80 tests passed, unchanged.

**Consumer audit.** Every existing `triggers:` literal across the repository
(`tests/integration/*.integration.test.ts`, `packages/core-discovery`, `packages/core-search`,
`packages/core-opportunity`, `apps/worker`) already supplies valid `ResearchSourceKind` values
(`JOB_POST`, `WEBSITE`, `TECH_STACK`, `FUNDING`, `REVIEW`, `NEWS`, `MANUAL`) — none required
changes. The one non-vocabulary literal in the repository,
`packages/core-opportunity/src/adapters.test.ts:39` (`'not-a-real-kind'`), constructs the
post-validation `ServiceProfileFields` shape directly to unit-test `toServiceRule()`'s own
defensive filter in isolation; it never calls `validateServiceProfileInput()` and is unaffected.

**Validation result.** `@acos/core-service-profile`: 30/30 tests passed. Typecheck clean.

---

## VALIDATION

```
core-research:            11/11 passed
core-research typecheck:  clean
core-service-profile:     30/30 passed
core-service-profile typecheck: clean
core-opportunity:         80/80 passed
repo typecheck:           25/25 packages passed
repo test:                25/25 tasks passed
git diff --check:         clean
```

**Integration tests were NOT executed.** `tests/integration/*.integration.test.ts` (including
`service-profile.integration.test.ts`) require a live PostgreSQL database
(`createPgServiceProfileRepository`, `createPgIdentityRepository`, etc.). No `DATABASE_URL` was
set and no local Postgres instance was reachable in this environment. No mocks were substituted
and no pass was fabricated for these tests.

---

## PHASE 18 RELATIONSHIP

```
Phase 18 remains CLOSED.
These changes resolve its documented non-blocking follow-ups in a subsequent phase.
No Phase 18 acceptance criterion was reopened or changed.
```

Verified directly: `git diff` for this phase touches only
`packages/core-research/src/sourceDocumentProvider.{ts,test.ts}`,
`packages/core-service-profile/{package.json,src/errors.ts,src/types.ts,src/validation.ts,src/validation.test.ts}`,
and `pnpm-lock.yaml`. No file under `packages/core-opportunity/`, `packages/core-acquisition/`,
`apps/worker/`, any discovery/research-provider contract file, the Anthropic provider, or
`requirement/PHASE_18_PROVIDER_EXECUTION_CLOSURE.md` appears in the diff.

## REMAINING LIMITATIONS

- Integration tests requiring live Postgres were not executed in this environment (see
  Validation section above) — deferred to whichever environment has DB access; no code change is
  pending on them, this is purely an execution-environment gap.
- PRD OQ-4's *derivation mechanism* for `triggers` (curated catalogue vs. AI pass) remains
  explicitly undecided — out of scope for this phase, which only fixed the *representation*
  contract.
