# SCENARIO E — PHASE 5 / PHASE 24 ENGINEERING RECONCILIATION SPECIFICATION

**Status:** READ-ONLY SPECIFICATION. No source, test, migration, schema, or governance file was
modified to produce this document. No database write. No commit, no push. Nothing here is
implemented.

**Final status (see §9/§10 for reasoning):**

```text
READY FOR IMPLEMENTATION
Engineering reconciliation only — no new PO decision required.
```

---

## 0. What this document assumes as already proven (not re-derived here)

From `CLIENT_FINDER_SCENARIO_E_PO_DECISION_PREPARATION_AUDIT.md` and the follow-up root-cause
audit, both already completed:

- Phase 24/Option C (`isEvidentiary()`, OBSERVED required) and K5-D1
  (`hasCredibleNeedEvidence()`, OBSERVED-at-full-confidence required for NEW searches) are both
  already decided and already implemented. Not reopened here.
- Phase 5 admission (`evaluateAdmission()`) is itself correctly implemented against its own
  spec — `admission.test.ts` passes 16/16. Not reopened here.
- Scenario E's canonical-pipeline integration test currently fails because its fixture supplies
  no deterministic signal, so admission rejects the candidate before Research ever runs — not a
  Scenario E policy failure.
- Giving the fixture the existing sibling-test helper (`qualifyingSignalCatalogue()`) would
  clear admission, but that helper's signal is persisted as a `classification: 'OBSERVED'`
  `research_signals` row, which would independently satisfy `EVIDENCE_PRESENT` and flip the
  test's expected outcome from `INSUFFICIENT_EVIDENCE` to `QUALIFIED` — inverting the test's
  purpose. This is why a naive fixture copy was rejected and this reconciliation was
  commissioned instead.

---

## 1. Exact data-flow trace — where the ambiguity is introduced

```text
ServiceSignalCatalogue.evaluate(supplied)                    [worker.ts Pass 1]
  → DeterministicSignal { field, signal: {kind, signal, confidence, observedAt}, dimension }
  ↓
evaluateAdmission() / previewOpportunityRanking()             [admission.ts; preview.ts]
  — toPreviewStoredSignal() (preview.ts:33-45) stamps the IN-MEMORY preview row's
    `field` to the constant DETERMINISTIC_ABSENT_SSL_FIELD, REGARDLESS of the signal's
    real `field` — a preview-only shortcut, never persisted.
  — needOpportunityTier() on this preview reads ONLY `field === DETERMINISTIC_ABSENT_SSL_FIELD`
    among live signals (service.ts:329-334) → any single deterministic signal of any real
    meaning reads as STRONG in the preview → clears meetsAdmissionThreshold.
  ↓ (admitted only)
saveDeterministicSignals() → toNewResearchSignalInput()       [deterministicSignalPersistence.ts:28-44]
  — persists the REAL `entry.field` this time (not the preview's hardcoded one) and
  — UNCONDITIONALLY sets `classification: 'OBSERVED'`, regardless of what the signal
    actually represents, with a synthetic `sources[0]` (sourceUrlFor() — often '').
    *** THIS IS THE EXACT POINT WHERE AN ADMISSION-ENABLING SIGNAL BECOMES A
    research_signals ROW INDISTINGUISHABLE, BY classification ALONE, FROM A
    PROVENANCE-VERIFIED AI-RESEARCH OBSERVED CLAIM. ***
  ↓
research_signals table — classification ∈ {OBSERVED, INFERRED, UNKNOWN}; `field` is preserved
  (real value: either a LeadResearch property name like 'websiteIssues', or a deterministic
  constant like DETERMINISTIC_ABSENT_SSL_FIELD / DETERMINISTIC_PLACES_CLOSED_*_FIELD)
  ↓
toOfferSignals()/hasCredibleNeedEvidence() (adapters.ts)      — read `classification`+`field`
  via eligibleRows(); exclude UNKNOWN and TOPICAL_FIELDS; otherwise classification-blind
  ↓
needDetected                                                   — unaffected by this ambiguity
  (suggestOffers() never looks at classification at all)
  ↓
isEvidentiary() (rules.ts:26-28)                               *** READS ONLY `classification`
  === 'OBSERVED' && supersededAt === null. Does NOT read `field`, `kind`, or any
  origin marker. This is the second, and decisive, point where the ambiguity
  actually bites: it cannot tell a deterministic admission signal's OBSERVED row
  from a genuine, provenance-verified AI-research OBSERVED row. ***
  ↓
EVIDENCE_PRESENT / QUALIFIED
```

**Precise answer to §1's question:** the signal becomes indistinguishable at **persistence**
(`toNewResearchSignalInput`, which hardcodes `classification: 'OBSERVED'` for every
deterministic signal, with no record of *why* it is OBSERVED), and the ambiguity becomes
**consequential** at `isEvidentiary()` (`rules.ts:26-28`), the only place that later reads
`classification` to decide qualification, without ever reading the `field`/origin information
that was in fact preserved alongside it.

---

## 2. Existing signal-provenance mechanisms — full audit before assuming a new field is needed

| Mechanism | Where | Distinguishes? | Already relied upon elsewhere? |
| --- | --- | --- | --- |
| `field` (string) | `StoredResearchSignal.field` | **Yes** — deterministic producers use reserved constants (`DETERMINISTIC_ABSENT_SSL_FIELD = 'deterministic.absentSsl'`, `DETERMINISTIC_PLACES_CLOSED_PERMANENTLY_FIELD`, `DETERMINISTIC_PLACES_CLOSED_TEMPORARILY_FIELD` — `deterministicSignals.ts:107,144-145`); AI-research producers use `LeadResearch` property names (`companySummary`, `websiteIssues`, ...). **This is already a clean, two-category partition that exists today**, not something to invent. | **Yes** — `needOpportunityTier()` (`service.ts:329-334`) already keys off `field === DETERMINISTIC_ABSENT_SSL_FIELD` to decide ranking. `isEvidentiary()`/`toOfferSignals()`/`hasCredibleNeedEvidence()` do **not** currently consult it. |
| `kind` (`ResearchSourceKind`) | `StoredResearchSignal.kind` | Partially — `GOOGLE_PLACES_STATUS` is reserved and "produced only by `deterministicSignals.ts`... never by FIELD_KIND/Research" (`persist.ts:16-30`). But absent-SSL's kind is `WEBSITE`, the **same** kind an AI-research WEBSITE-sourced OBSERVED claim can carry — `kind` alone cannot separate those two. | Used for cache keys and trigger matching; not for origin. |
| `classification` | `StoredResearchSignal.classification` | No — purely epistemic (OBSERVED/INFERRED/UNKNOWN), carries no origin information by design. | Used everywhere; this is the field the ambiguity hides behind. |
| `sources` / provenance verification | `provenance.ts` (`verifyProvenance()`) | Indirectly — `verifyProvenance()` is **only ever invoked on AI-Research output**, before persistence (`service.ts`'s Research flow). Deterministic signals never pass through it; their `sources[0]` is synthesized by `sourceUrlFor()` (`deterministicSignalPersistence.ts:23-26`), frequently an empty string. This is a real, existing distinction (verified vs. never-checked) but it is **not persisted as a flag** — it is a fact about the write path, not the row. | Not read back after persistence anywhere. |
| `basis` | `StoredResearchSignal.basis` | No — free text, only populated for INFERRED, never parsed. | Not used for origin. |
| `authorizationEvidence` | `NewResearchSignalInput.authorizationEvidence` | No — reserved for FIRST_PARTY intent-intake only (OD-7/OD-8), unrelated to this problem. | N/A here. |
| `aiEnrichment` / `aiEnrichmentReason` (Phase 6) | Persisted on the **Opportunity**, not the signal (`recordAiEnrichmentForOwner`) | No, not at signal granularity — records whether AI ran for the *candidate*, but when both a deterministic signal and AI-research signals coexist on the same Prospect (the admitted, research-succeeded branch), this flag alone cannot say which *specific signal* is which. | Used for freelancer-facing "not AI-reviewed" provenance; orthogonal to this problem. |

**Conclusion of §2: no new field, column, or classification value is necessary.** The `field`
naming convention already partitions every signal in the system into "deterministic-origin"
(the two reserved constants) vs. "AI-research-origin" (the nine `LeadResearch` property names),
and this partition is already relied upon, today, by `needOpportunityTier()`. The gap is purely
that `isEvidentiary()` (and, if ever extended, `toOfferSignals()`/`hasCredibleNeedEvidence()`)
do not consult it.

---

## 3. Reconciliation options

### Option A — Admission-only signals are not persisted as research evidence unless independently eligible

As literally stated, this is **already true for every signal that exists in production today.**
There are currently exactly two deterministic signal producers (absent-SSL,
`detectPlacesEntityReality()`), and both are *intentionally* "independently eligible as research
evidence" — that is the explicit point of C-3B (§6 below: zero-AI qualification must work from
deterministic evidence alone). There is no production category of "admission-only, not
evidentiary" deterministic signal today. The only place such a signal exists is the **test**
helper `qualifyingSignalCatalogue()`, which is a synthetic, meaning-free stand-in invented purely
to satisfy the Pass-1 ranking preview in tests that don't care about evidentiary purity.
**Option A, as a production change, has nothing to implement** — the gap it describes is a test
fixture problem, not a production one.

### Option B — Persist admission signals separately from research evidence

Would require a new storage path (and likely a new table or a new discriminant column) purely to
represent a category of signal — "admission-only, non-evidentiary deterministic fact" — that
does not exist in production today and that no approved decision calls for. This is the kind of
new architecture §3's own instruction says to avoid introducing without need. **Rejected as
disproportionate to the actual, current gap.**

### Option C — Persist the existing deterministic signal, but have consumers distinguish it explicitly by provenance

This is the closest "fix the ambiguity at its exact point" option: have `isEvidentiary()` (and,
symmetrically, anywhere else that currently treats "non-UNKNOWN" or "OBSERVED" as sufficient)
recognize deterministic-origin rows **by the existing, already-used `field` allowlist**
(`DETERMINISTIC_ABSENT_SSL_FIELD`, `DETERMINISTIC_PLACES_CLOSED_PERMANENTLY_FIELD`,
`DETERMINISTIC_PLACES_CLOSED_TEMPORARILY_FIELD`), rather than changing the schema. Correctly
scoped, this does **not** mean "exclude deterministic signals from evidence" (that would break
C-3B, see §6) — it means "know, explicitly, when a given OBSERVED row's evidentiary weight comes
from a named, approved deterministic fact vs. a generic admission artifact," which today is true
of 100% of real deterministic rows and would also correctly classify any *future*
non-evidentiary deterministic signal (none exists yet) the same way, defensively. This requires
no schema change — it is a pure, additive code change to a lookup already keyed by `field`.

### Option D — The existing architecture already has a cleaner mechanism

**Two independent existing mechanisms, combined, already cover this without new code:**

1. The `field`-constant partition (§2) already tells a reader which OBSERVED rows are
   deterministic vs. AI-research-derived — it is simply not yet consulted by the qualification
   layer.
2. **Intent intake already exists as a second, approved, admission-exempt production entry
   point** (`apps/worker/src/searchWorker/intentIntake.ts:139,142` calls
   `researchProspectForOwner`/`runPostResearchPipelineForOwner` **directly**, never touching
   `evaluateAdmission()`, Pass 1, or any deterministic-signal requirement at all). A candidate
   that reaches Research through intent intake can legitimately end up with INFERRED-only,
   zero-OBSERVED evidence — exactly the shape Scenario E was written to exercise — with **zero**
   production change.

**Recommendation: Option D, informed by Option C's field-allowlist insight as an optional,
defense-in-depth refinement (see §9).** No new schema, column, table, or classification value
anywhere.

---

## 4. Evaluation against every existing decision

| Decision | Option A | Option B | Option C | Option D (recommended) |
| --- | --- | --- | --- | --- |
| Phase 5 admission | preserved (nothing to change) | preserved | preserved (admission logic untouched; only a downstream *reader* changes) | preserved |
| C-3B zero-AI | preserved | preserved | preserved — the allowlist still treats the two real deterministic producers as evidentiary | preserved — unaffected; deterministic-only qualification keeps working exactly as today |
| K5-D1 | preserved | preserved | preserved if the same allowlist is applied symmetrically to `hasCredibleNeedEvidence()` (not required for Scenario E itself) | preserved, untouched |
| R-70 | preserved | preserved | preserved — `hasConflictingSource`/`eligibleRows` untouched | preserved |
| R-71 | preserved | preserved | preserved — `TOPICAL_FIELDS` exclusion untouched | preserved |
| Phase 24 qualification / Option C | preserved | preserved | **clarified**, not changed — `isEvidentiary()`'s intent ("an OBSERVED signal" meaning "a genuinely evidentiary OBSERVED signal") becomes explicit rather than implicit | preserved, untouched |
| Universal Ranking | preserved | preserved | preserved — ranking tiers (`needOpportunityTier`/`serviceFitTier`) are untouched by either option | preserved |
| Research provenance (`provenance.ts`) | preserved | preserved | preserved — not touched by any option | preserved |
| Cache behavior (`signalCache`) | preserved | preserved | preserved | preserved — confirmed below (§5) that deterministic signals never reach the cache under any option |
| Global Entity architecture | preserved | preserved | preserved | preserved |
| Q5-A/B/C | preserved | preserved | preserved | preserved — confirmed below (§5) these gates are not reachable from this code path at all today |
| Historical searches | preserved | preserved | preserved — the allowlist change, if made, applies identically regardless of search type, same as the existing Option C gate already does | preserved |
| Deterministic-only fallback | preserved | preserved | preserved — still evidentiary, as C-3B requires | preserved |
| AI-present path | preserved | preserved | preserved | preserved — intent intake's AI-present path is already live and already exercises exactly this shape |

No decision is reopened, changed, or weakened by any option, including the recommended one.

---

## 5. Security / privacy implications

Checked directly against the repository's own cache/Entity code, not assumed:

- **Cross-freelancer / global reuse:** `ResearchSignalCacheRepository.record()` has exactly one
  call site in the entire repository — `packages/core-research/src/service.ts:305`, inside the
  AI-Research persistence flow. `deterministicSignalPersistence.ts` has **no call to
  `signalCache` at all** — grep-confirmed. A deterministic/admission signal (real or synthetic)
  **never reaches the same-freelancer cache, and therefore never reaches the cross-freelancer
  Entity cache either**, under any of the options above (none of them change this call graph).
- **Entity public-signal cache / Q5-A:** `findByEntity()`'s own doc comment
  (`signalCache.ts:49-66`) states plainly that it requires a live field-classification check
  (Phase H) and a live Q5-B authorization check (Phase I), "neither of which exists yet... no
  production code path may call this method at all" today. This is independently true,
  regardless of this reconciliation — deterministic/admission signals were never going to reach
  this path, since (as above) they never enter the cache in the first place.
- **Q5-B authorization:** not reachable from this code path; see above.
- **Cross-freelancer effect on another freelancer's search:** none — `saveSignals` writes to the
  one Prospect row owned by the one Search/freelancer that triggered Discovery; no code path
  shares it.
- **User-facing evidence:** the deterministic signal's synthetic `sourceLabel: 'Deterministic
  check'` (`deterministicSignalPersistence.ts:40`) already marks it, in the persisted row
  itself, as distinct from a real quoted source — this is already a user-facing honesty signal
  that exists today, independent of this reconciliation.

**No option introduces a privacy bypass.** None of them changes what gets cached, what gets
shared across freelancers, or what Q5-A/B/C gate — those boundaries are enforced upstream of, and
untouched by, anything discussed here.

---

## 6. Zero-AI requirement

Confirmed preserved under every option, and **especially** under the recommended one: Option D
makes no change to deterministic-signal evidentiary weight at all. C-3B's requirement — "Client
Finder's core functionality must be capable of operating without AI/LLM calls... AI must not be
required for discovery, opportunity creation, qualification, or ranking"
(`CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md`, C-3B) — is exactly what makes a
deterministic signal's `classification: 'OBSERVED'` persistence *correct, not a bug*, for the two
real producers that exist today. The recommended fix does not touch this in any way; it only
concerns a hypothetical *future* non-evidentiary deterministic signal, and a *test's* synthetic
one, neither of which is C-3B's deterministic-only path.

---

## 7. How this lets Scenario E exercise its original intent

Two concrete, non-exclusive paths, both using only what already exists:

**(a) Canonical pipeline, reframed (recommended primary fix — see §9/§10):** give the
`worker.test.ts` E1 fixture the real `createWebDevelopmentSignalCatalogue()` (or an equivalent
real producer) wired to a source document that genuinely triggers the absent-SSL deterministic
signal — a real, legitimately evidentiary fact, exactly like B1/D2's own fixtures already use
real OBSERVED evidence to admit their candidates. Research still runs and still returns the same
INFERRED-only claims. The candidate is admitted via the **real** deterministic OBSERVED signal
(not an artificial one); `EVIDENCE_PRESENT` is satisfied by **that** signal
(`evidencePresent.evidenceSignalIds` will show the deterministic row's id, not any INFERRED
row's); the test's assertions are updated to assert exactly this — qualification succeeding
*because of* the real deterministic fact, while separately asserting that the INFERRED rows are
**not** among `evidenceSignalIds`. This proves the Option C distinction (OBSERVED required,
INFERRED insufficient on its own) in a state the canonical pipeline can actually reach, with zero
artificial evidence.

**(b) Intent intake (no code change, available today):** a candidate entering through
`intentIntake.ts` reaches `researchProspectForOwner` directly, with no admission gate at all. An
INFERRED-only, zero-OBSERVED research result there reaches `EVIDENCE_PRESENT` exactly as the
**already-passing** `evaluator.test.ts` unit test models it — `INSUFFICIENT_EVIDENCE`, not
`QUALIFIED`. This is the precise, pure "INFERRED-only" shape the original Scenario E fixture
intended, and it remains fully reachable and fully correctly handled today, with no change
anywhere.

Either path — or both, as complementary regressions — satisfies §7's requirement list: the
candidate reaches Research; INFERRED evidence is persisted when genuinely produced; no
artificial OBSERVED evidence is introduced; qualification continues to require OBSERVED per the
existing Option C/K5-D1 contract.

---

## 8. Migration / schema impact

```text
Recommended solution (Option D, primary):    NO SCHEMA CHANGE. Test-fixture-only change
                                              (worker.test.ts), using an EXISTING production
                                              signal catalogue (createWebDevelopmentSignalCatalogue)
                                              and an EXISTING production entry point
                                              (intentIntake.ts) — nothing new is built.

Optional defensive refinement (Option C):    NO SCHEMA CHANGE. Reuses the EXISTING `field`
                                              column and EXISTING exported constants
                                              (DETERMINISTIC_ABSENT_SSL_FIELD,
                                              DETERMINISTIC_PLACES_CLOSED_PERMANENTLY_FIELD,
                                              DETERMINISTIC_PLACES_CLOSED_TEMPORARILY_FIELD) —
                                              an additive code-level allowlist check only.

Option B (rejected):                         Would likely require an additive migration (a new
                                              table or discriminant column) — moot, since Option B
                                              itself is rejected in §3.

Data migration / historical backfill:        NONE under the recommended solution. No persisted
                                              row's meaning changes; historical data is untouched.
```

---

## 9. Recommended engineering solution

```text
Engineering reconciliation only — no new PO decision required.
```

**Primary recommendation:** Option D — reframe the canonical-pipeline Scenario E integration
test (§7a) to admit its candidate via a real deterministic evidentiary signal and assert the
Option C distinction through `evidenceSignalIds` rather than through an absence of any
deterministic admission signal; keep the already-passing `evaluator.test.ts` pure-unit test, and
optionally intent-intake coverage (§7b), as the exact-shape regression for "INFERRED-only, zero
OBSERVED." No production code changes are required to achieve this.

**Optional, non-blocking refinement:** apply Option C's field-allowlist distinction inside
`isEvidentiary()` as defense-in-depth against a hypothetical future non-evidentiary deterministic
signal. This is **not required** to fix Scenario E (§7a does not depend on it — a *real*
deterministic signal is, correctly, evidentiary either way) and is offered only as an optional
hardening step, since §2 already found the mechanism it would use pre-existing and idle.

No existing PO decision is insufficient. Phase 5, C-3B, K5-D1, Option C, R-70, and R-71 all
remain exactly as decided; nothing here asks the Product Owner to choose between policy
alternatives — the ambiguity was a test-representability gap, not a policy gap, confirmed by
§1-§5's trace.

---

## 10. Implementation plan (not executed by this document)

```text
Primary fix (recommended):
  Test file:        apps/worker/src/searchWorker/worker.test.ts
                     — E1 (currently ~line 2162): replace the no-op fixture with
                     signalCatalogue: createWebDevelopmentSignalCatalogue() wired to a
                     sourceDocuments fake that genuinely lacks a valid SSL/TLS indicator
                     (mirroring how the real absent-SSL producer is exercised elsewhere,
                     e.g. deterministicSignals.test.ts). Update the test's assertions:
                       - byClassification('OBSERVED') now has exactly 1 row (the real
                         deterministic signal) — update the expected count from 0 to 1.
                       - qualification state: QUALIFIED (via the deterministic OBSERVED
                         fact), not INSUFFICIENT_EVIDENCE.
                       - ADD an assertion that evidencePresent.evidenceSignalIds contains
                         only the deterministic signal's id, NOT any INFERRED row's id —
                         this is what actually proves Option C's distinction survives.
                     Rename the test and update its comments to describe this reframed
                     intent (admission-eligible candidate; INFERRED findings present but
                     not independently relied upon for qualification).

  Optional second regression (not required, additive):
                     A NEW test, either in worker.test.ts (intent-intake describe block,
                     if one exists / is added) or left entirely to the existing
                     evaluator.test.ts E1 unit test, to keep an explicit "pure
                     INFERRED-only, zero deterministic signal, zero OBSERVED" regression
                     on record at the integration level via intentIntake.ts. OPTIONAL —
                     the unit test already covers this correctly today.

  Production files: NONE required for the primary fix.

  Optional defensive refinement (not required):
    packages/core-qualification/src/rules.ts  — isEvidentiary() would additionally accept
                                                 (classification === 'OBSERVED') only when
                                                 either the row is AI-research-sourced (field
                                                 not in the deterministic allowlist) or the
                                                 field IS one of the two named, approved
                                                 deterministic-evidence constants — i.e.,
                                                 formalizing, not changing, today's actual
                                                 set of evidentiary rows.

Migration:          NONE.

Regression tests that must remain green throughout:
  - packages/core-research/src/admission.test.ts           (16/16 — untouched)
  - packages/core-qualification/src/evaluator.test.ts       (incl. Scenario E unit test,
                                                              E1 "INFERRED-only ... is
                                                              INSUFFICIENT_EVIDENCE")
  - packages/core-qualification/src/service.test.ts
  - packages/core-opportunity/src/adapters.test.ts          (R-70/R-71, K5-D1 fixtures)
  - packages/core-opportunity/src/service.test.ts
  - packages/core-opportunity/src/preview.test.ts
  - apps/worker/src/searchWorker/worker.test.ts — B1/B2/B3/D1/D2/D3 (R-70/R-71), and every
    other describe block in the file (claiming, canonical pipeline, Phase 8 Entity Reality,
    scoring, personalization, outreach/follow-up preparation, ownership, idempotency)

Scenario E expected final behavior after the primary fix:
  - Canonical pipeline (reframed E1): candidate admitted via a REAL deterministic OBSERVED
    signal; Research's INFERRED findings persisted alongside it; QUALIFIED via the
    deterministic signal only; evidenceSignalIds excludes every INFERRED row.
  - Pure qualification unit test (unchanged): INFERRED-only, zero OBSERVED →
    INSUFFICIENT_EVIDENCE, exactly as today.
  - K5-D1/R-70/R-71 regression tests: unchanged, remain green throughout (none of them are
    touched by this plan).
```

---

## Final status

```text
READY FOR IMPLEMENTATION
Engineering reconciliation only — no new PO decision required.
```
