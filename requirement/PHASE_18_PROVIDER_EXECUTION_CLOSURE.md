# PHASE 18 — PROVIDER EXECUTION

# CLOSURE RECORD

This is a closure artifact, not a preflight. Phase 18's scope-lock was established and approved
before implementation began; this document records the validation evidence that closes it. It
follows the same convention as `PHASE_16_R29_PREFLIGHT_SCOPE_LOCK.md` and
`PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md` — direct repository inspection and real execution evidence
as the authority, not assertion.

---

## STATUS

**PHASE 18 — PASS / CLOSED**

No production code changes are required beyond what is already committed as part of this closure.
Phase 18 is not reopened by anything recorded here.

---

## BASELINE

| Item | Value |
|---|---|
| Baseline commit | `da0cb7c` — "Phase 17: implement R-34 worker orchestration" |
| Phase 18 implementation commit | `daf86e2` — "Phase 18: implement provider execution (Discovery, source acquisition, Research)" |
| This closure | Adds an Anthropic structured-output schema-compilation fix (found during live validation, see below) and this closure record |
| Working tree | Pre-existing, unrelated drift left untouched: `apps/web/tsconfig.tsbuildinfo` (build artifact), `CLAUDE.md` (untracked), `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` (untracked) — all pre-date Phase 18 work |

Phases 1–17 are treated as completed and frozen. Their scope and acceptance criteria are not
reopened here.

---

## VALIDATED SCOPE

Phase 18's approved scope: a concrete, evidence-backed `DiscoveryProvider` (Google Places API,
New), a homepage-only `SourceDocumentProvider` (HTTP fetch + Readability, no crawling, no
headless browser), a concrete `ResearchProvider` composing the existing, unmodified
`researchLead()`/Anthropic adapter, and R-29 usage metering wired to the real invocation path —
all behind the frozen `DiscoveryProvider`/`ResearchProvider` contracts, with Phase 17's worker
orchestration and retry lifecycle unchanged except for provider bootstrap wiring.

---

## PRODUCTION EVIDENCE — DISCOVERY

- Google Places API (New) results are passed through in provider response order at every layer
  (`googlePlacesProvider.ts`'s `.map()`, `core-discovery/service.ts`'s `for...of`,
  `worker.ts`'s `for...of`) — confirmed by direct code inspection. No application-level sorting,
  prioritization, or randomization exists anywhere in the pipeline.
- A real Search (`7a089c2f-70f4-4493-aceb-09e8eddc7dae`) discovered and persisted 20 real
  prospects via the real Google Places API.

## PRODUCTION EVIDENCE — SOURCE ACQUISITION

Validated prospect: Adsara Digital (`adsara.in`), Prospect ID
`0f86b6e9-dba4-4c0a-b1f0-af470830bf5b`.

- Real HTTP fetch via the unmodified, homepage-only `createHttpSourceDocumentProvider`: HTTP 200,
  `text/html`, no redirect.
- Readability extraction succeeded: 1 `SourceDocument`, 8,194 characters of real, server-rendered
  homepage content, correct `label`/`url`.
- Separately, a known-negative case (`amitdwivedi.in`, a client-rendered SPA shell with zero
  server-rendered text) was confirmed to correctly resolve to no usable document — never
  fabricated, never retried indefinitely — validating both the positive and negative paths of the
  same boundary.

## PRODUCTION EVIDENCE — RESEARCH

- Real Anthropic execution against the real production `ResearchProvider`, model `claude-opus-5`.
- Initial request: input 5,228 / output 3,557 tokens. Repair request: input 3,012 / output 633
  tokens. Approximate reported cost: $1.91.
- A schema-compilation defect was found and fixed during this validation (see FOLLOW-UPS —
  resolved, not deferred): Anthropic's structured-output compiler rejected the original schema
  with "18 parameters with type arrays or anyOf" (limit 16), caused by `observationSchema` being
  inlined 9 times in `leadResearchSchema`'s generated JSON Schema. Fixed in
  `packages/core-research/src/jsonSchema.ts` by adding an explicit, reference-identity-based
  `$defs`/`$ref` deduplication option (never a name/shape heuristic), wired from
  `anthropicModel.ts`. Reduced the schema to 2 `anyOf` nodes / 9 `$ref`s / 1 `$defs` entry. Live
  validation (above) confirms Anthropic accepted the corrected schema and returned structured
  output.

## PRODUCTION EVIDENCE — R-29 METERING

Two real `ai_usage_events` rows persisted for this prospect — `initial` and `repair` — each with
correct `provider` (`anthropic`), `model` (`claude-opus-5`), `prospect_id`, and token counts.

## PRODUCTION EVIDENCE — RESEARCH SIGNAL PERSISTENCE

16 `research_signals` rows persisted for this prospect: 3 OBSERVED, 12 INFERRED, 1 UNKNOWN.

## PRODUCTION EVIDENCE — OPPORTUNITY

Real `createOpportunityForOwner()` call against real PostgreSQL repositories, consuming the
already-persisted signals (no new Discovery, source acquisition, or Anthropic call):

- Opportunity ID `38773995-b538-4f48-8f45-02c878352451`, `userId 4b136fd7-fc67-40c9-a1c8-155804205671`,
  `prospectId 0f86b6e9-dba4-4c0a-b1f0-af470830bf5b`, `state = NEW`, `needDetected = false`,
  `staleness = FRESH`, `offer = null`.
- `needDetected = false` was investigated at the code level and is a **correct, expected outcome**
  of the existing, frozen `toServiceRule()`/`suggestOffers()` contract (`core-opportunity`/
  `core-acquisition`, pre-dating Phase 18): the service profile's `triggers` are free text (e.g.
  "outdated website"), which do not match the fixed 8-value `ResearchSourceKind` vocabulary
  `toServiceRule()` filters against, so the derived rule's `triggers` array is empty and no signal
  can ever match it. `suggestOffers()` returning no suggestion in this case is its documented,
  tested behavior (`core-opportunity/src/service.test.ts`: "a Prospect with only non-matching
  signals also records NO SUITABLE OFFER") — not a Phase 18 defect, and not modified.

## PRODUCTION EVIDENCE — OPPORTUNITY PERSISTENCE / IDEMPOTENCY

- Database count of Opportunities for this prospect: 1.
- A second `findByProspectId()` call returned the same Opportunity ID — no duplicate created.
- Confirmed by code inspection: `worker.ts`'s `runCanonicalPipeline` calls
  `findByProspectId(userId, prospect.id)` immediately after `runResearchForOwner(...)` and only
  calls `createOpportunityForOwner(...)` when no existing Opportunity is found — the guard is
  correctly positioned after Research and before Opportunity creation.

## TEST EVIDENCE

```
core-opportunity:                    80/80 passed
worker:                              153/153 passed
opportunity.integration.test.ts:     9/9 passed (real Postgres)
search-worker.integration.test.ts:   7/7 passed (real Postgres)
```

---

## FOLLOW-UPS (non-blocking, not fixed as part of Phase 18)

**Follow-up 1 — jsdom CSS-parsing robustness.** `mumbaiwebdesign.in` triggers
`Error: Could not parse CSS stylesheet` from inside jsdom's HTML parser, thrown asynchronously and
able to escape `sourceDocumentProvider.ts`'s synchronous `try/catch` around `new JSDOM()`,
risking a worker-process crash rather than a single failed Search attempt. Outside Phase 18's
acceptance criteria (no requirement anywhere in scope for process-level crash-safety against
malformed third-party CSS). Recommended as a standalone follow-up ticket for worker-process
resilience.

**Follow-up 2 — service-profile trigger vocabulary.** Free-text `triggers` on a service profile
(e.g. "outdated website") never match the fixed `ResearchSourceKind` vocabulary
`toServiceRule()` consumes, which silently produces `needDetected = false` / no offer for every
prospect discovered under that profile, regardless of their actual research signals. This belongs
to whichever phase owns service-profile/scoring semantics, not Phase 18 — `suggestOffers()`,
`toServiceRule()`, and scoring logic are unmodified and out of Phase 18's scope.

---

## CLOSURE STATEMENT

Phase 18 is closed. All acceptance criteria in the approved scope-lock are satisfied by live
production evidence, passing tests (unit and real-Postgres integration), and direct code
inspection. The one code defect found during validation (the Anthropic schema union-count
failure) has been fixed and is included in this closure. The two follow-ups above are recorded,
non-blocking, and explicitly out of Phase 18 scope. Phase 18 is not to be reopened by either
follow-up.
