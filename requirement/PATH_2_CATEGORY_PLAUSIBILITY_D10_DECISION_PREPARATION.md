# Path 2 — D10 Category Plausibility Product Decision Preparation

## 1. Status

```text
PRODUCT OWNER DECISION REQUIRED
IMPLEMENTATION NOT AUTHORIZED
```

This is a READ-ONLY governance/product-decision-preparation document. It does not implement, design, or select any UI behavior. No production code, test, PRD, configuration, database/migration, provider code, or worker file is created or modified by this document, and no live API call is made.

## 2. Decision Question

> What should the participant see about the Search + Prospect category-plausibility determination — where should it be visible, at what level of detail (aggregate vs. per-segment), and how should MATCH, MISMATCH, and UNKNOWN each be presented, given that D5 already establishes MISMATCH fails Qualification without blocking Opportunity creation and UNKNOWN fails/holds without a new Opportunity state?

## 3. Current UI / Evidence Architecture

Traced directly against the repository at HEAD `5992b82b9adff492c480442d68a954f2a03bfb28` (confirmed unchanged before and after this task, §19).

**FACT — Client Finder page inventory** (`apps/web/app/(client-finder)/`):
- `searches/new/page.tsx` — Search creation form.
- `searches/[id]/page.tsx` — per-Search status page (`§4.1`).
- `opportunities/page.tsx` — cross-Search, ranked Opportunity list (`§4.2`).
- `opportunities/[id]/page.tsx` — single-Opportunity detail page (`§4.3`–`§4.5`).
- `login/page.tsx` — authentication only.

**FACT — no other Client Finder page exists.** There is no per-Prospect page, no per-Search Prospect list, no Research-run detail page, and no Qualification-only page distinct from the Opportunity detail page.

## 4. Existing UI Precedents

### 4.1 Search status surface

`apps/web/app/(client-finder)/searches/[id]/page.tsx:50-103`. Renders: `search.status` (PENDING/RUNNING/COMPLETE/FAILED/CANCELLED, lines 13-27, 58-61), `search.parameters.service`/`.targetCustomer`/`.geography` (lines 63-74), `search.attempts`, `search.createdAt`/`.updatedAt` (lines 75-86), and `search.lastError` when `status === 'FAILED'` (lines 88-90). `SearchStatusPoller.tsx:16-26` re-fetches the page every 4 seconds while the Search is non-terminal, via `router.refresh()` — no client-side progress simulation.

**FACT: this page shows Search-level lifecycle status only.** It contains **no list of the Search's discovered Prospects, no per-Prospect data of any kind, and no evidence of any kind.** On `COMPLETE`, it links only to the global `/opportunities` list (line 94), not to a Search-scoped subset. There is currently no "Search + Prospect result/details surface" distinct from the Opportunity detail page (§4.3) — such a surface does not exist today and would be new, not an extension.

### 4.2 Opportunity list surface

`apps/web/app/(client-finder)/opportunities/page.tsx:54-89`. Renders, per row: rank (`entry.rank`), company name, `entry.score.total`/`.band`, and either `` `Recommended: ${opportunity.offer.service}` `` or `'No suitable offer detected'` (lines 70-79) — sourced from `rankOpportunities()` (`@acos/core-opportunity`, unmodified, per the page's own comment lines 13-28). **FACT: no evidence, classification, confidence, or Qualification state of any kind is rendered on this list surface** — only score, band, and offer summary per row.

### 4.3 Opportunity detail surface — Evidence section

`apps/web/app/(client-finder)/opportunities/[id]/page.tsx:121-147`, backed by `listResearchSignals(repos, token, opportunity.prospectId)` (line 62, `@acos/core-research`). Per signal (`StoredResearchSignal`):
```tsx
<li key={signal.id} className="evidence-item">
  <p><strong>{signal.field}</strong> — {signal.classification}
    {signal.classification !== 'UNKNOWN' ? ` (confidence ${signal.confidence})` : ''}
  </p>
  {signal.signal ? <p>{signal.signal}</p> : null}
  {signal.basis ? <p className="hint">Basis: {signal.basis}</p> : null}
  {signal.sources.map((source) => (
    <p key={source.id} className="hint">
      <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.sourceLabel}</a>
      : "{source.sourceQuote}"
    </p>
  ))}
</li>
```
(lines 128-143). **This is the repository's one and only established pattern for presenting an evidence-backed, classified Research claim to a participant.** It already demonstrates, as existing precedent:
- Displaying a `classification` value (`OBSERVED`/`INFERRED`/`UNKNOWN`) as raw text next to the claim (line 130).
- Suppressing `confidence` specifically for `UNKNOWN` (line 131) — the only special-cased treatment of UNKNOWN anywhere in the web app (confirmed by repository-wide grep in this task: `signal.classification !== 'UNKNOWN'` at line 131 is the only UNKNOWN-related conditional in `apps/web/src` or `apps/web/app`).
- A source link (`sourceUrl`/`sourceLabel`) plus an inline quoted `sourceQuote` (lines 135-141) — the established source-provenance pattern.
- **FACT: no evidence "tier" concept exists or is rendered** — D3's Tier 1/2/3 vocabulary is a governance-document concept only, with no corresponding field on `StoredResearchSignal` (`packages/core-research/src/types.ts`, confirmed by the field list already established in this governance chain: `id, prospectId, field, kind, classification, signal, confidence, basis, sources[], observedAt, supersededAt`) and no rendering of one.
- **FACT: `signal.observedAt`/`signal.supersededAt` are never rendered anywhere in this loop or elsewhere in the page** — no freshness/timestamp is shown for any evidence item today, despite the field existing on the underlying type.
- **FACT: no expand/collapse UI pattern exists anywhere in the Client Finder surfaces** (confirmed by repository-wide grep for `details`/`Collapse`/`expand` in `apps/web/app` and `apps/web/src`: the only match, `CheckoutPanel.tsx`, belongs to an unrelated commerce surface, not Client Finder). Every list in the Opportunity detail page is rendered fully expanded, always-visible.
- **FACT: no per-segment or nested-list structure exists anywhere** — every list (`evidence-list`, `qualification` criteria) is a single flat `<ul>`/`<li>` of independent, non-nested items.

### 4.4 Opportunity detail surface — Qualification section

`apps/web/app/(client-finder)/opportunities/[id]/page.tsx:149-160`:
```tsx
{qualification ? (
  <section className="card">
    <h2>Qualification: {qualification.state}</h2>
    <ul>
      {qualification.criteria.map((criterion) => (
        <li key={criterion.criterion}>
          {criterion.criterion}: {criterion.satisfied ? 'satisfied' : 'not satisfied'} — {criterion.reason}
        </li>
      ))}
    </ul>
  </section>
) : null}
```
Backed by `QualificationCriterionResult { criterion, satisfied, reason, evidenceSignalIds }` and `StoredQualification { state, criteria, evidenceSignalIds, ... }` (`packages/core-qualification/src/types.ts:9-48`). **This is the repository's established pattern for showing why a criterion failed** (`criterion.reason`, a "Human-readable, observability only... never parsed back into a decision" field per the type's own doc comment, line 23) — directly reusable in shape for a future category-plausibility criterion's failure reason.

**FACT, directly relevant to D3/D10-E:** `QUALIFICATION_STATES = ['QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE']` (`types.ts:9`) — an `INSUFFICIENT_EVIDENCE` state **already exists** at the Qualification level, distinct from `NOT_QUALIFIED`, and would render literally via `qualification.state` (line 151) if a future evaluator ever produced it. Whether a category-plausibility UNKNOWN result should ever cause this state to be produced is **not decided by D4/D5** (D5 says UNKNOWN "fails/holds" the criterion, without specifying which `QualificationState` value that maps to) and is **not decided by this document either** — recorded here only as an existing UI/data-model fact.

### 4.5 Opportunity detail surface — Opportunity section (independent of Qualification)

`apps/web/app/(client-finder)/opportunities/[id]/page.tsx:79-105`. Renders `opportunity.state`, `opportunity.needDetected`, `opportunity.staleness`, and the recommended offer (or "No suitable offer... (AC-14)") — **unconditionally, regardless of whether a `StoredQualification` exists or what it says.** The Qualification section (§4.4) is rendered as a separate, independent, conditionally-present section immediately below it (`qualification ? (...) : null`, line 149) — the page's own header comment (lines 25-33) states explicitly: *"Qualification, Personalization, Outreach Preparation and Follow-Up Preparation each render only IF a record already exists... this page never triggers generation itself."*

**This is directly load-bearing evidence for D10-D**: the existing page structure **already** demonstrates the pattern D5 requires communicating — the Opportunity section (state, offer) and the Qualification section (state, per-criterion pass/fail + reason) are two separate, independently-rendered sections on the same page, with the Opportunity section never gated on the Qualification section's outcome. A user viewing this page today already sees "the Opportunity exists, here is its offer" and, separately, "here is why Qualification did or didn't pass" as two distinct pieces of information — no new page structure is required to express "MISMATCH failed Qualification but did not block the Opportunity," only a new row within the existing Qualification criteria list (§4.4) once D4's criterion is built. This is an `INFERENCE` about UI *feasibility using the existing pattern*, not a decision that this is how D10 should be resolved.

## 5. D10-A — Visibility Location

Choices, restated from the task, evaluated against §4's findings without ranking:

**A. Search + Prospect result/details surface.** `FACT`: does not exist today (§4.1). Would require building an entirely new page/section — the Search status page has no per-Prospect listing of any kind.

**B. Opportunity detail surface.** `FACT`: exists and already has an established Evidence section (§4.3) and Qualification section (§4.4) that a category-plausibility determination could extend, in shape, without new page-level scaffolding — `INFERENCE`, since no such extension has been built or authorized.

**C. Research detail surface.** `FACT`: no standalone "Research detail" page exists separate from the Opportunity detail page's embedded Evidence section (§4.3) — Research results are visible only as a sub-section of the Opportunity page, never as their own page.

**D. Qualification detail surface.** `FACT`: same as C — Qualification is a sub-section of the Opportunity detail page (§4.4), never its own page.

**E. Multiple surfaces.** Would combine any of A–D; not evaluated as a distinct architectural option beyond the individual facts above.

**F. Not user-visible during MVP.** `FACT`: architecturally trivial — the capability's persistence (D1's dedicated Search+Prospect entity, not yet built) and Qualification consumption (D4) do not require any UI change to function; this is confirmed by the existing pattern where `qualification`/`personalization`/`outreachPrep` all already render conditionally, `null` when absent (§4.5), so a new data source that produces no UI at all requires zero page changes.

**PRODUCT DECISION REQUIRED**: which of A–F (or combination) is selected. Not decided here.

## 6. D10-B — Determination Visibility

Should the UI show MATCH/MISMATCH/UNKNOWN as an aggregate value, per-segment values, or both?

`FACT`: the existing Qualification criteria list (§4.4) already renders one boolean (`satisfied`) plus one free-text `reason` per criterion — no existing UI element renders a three-state (MATCH/MISMATCH/UNKNOWN) value directly; the closest analogue is `signal.classification` (`OBSERVED`/`INFERRED`/`UNKNOWN`, §4.3) which is a **different**, already-existing three-state enum for evidence *quality*, not plausibility *result* — reusing that same rendering pattern (raw enum text) for a plausibility *result* value is structurally straightforward (`INFERENCE`) but would require care not to visually or semantically conflate the two distinct "UNKNOWN" vocabularies (already flagged as a distinct-meanings concern in the D8/D9 governance chain, `PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md` §8.1).

Per D2 (locked, not reopened), the aggregate is computed by ANY-match semantics over per-segment results. Showing only the aggregate (MATCH/MISMATCH/UNKNOWN) is the smallest UI surface; showing per-segment results additionally requires a nested/segmented list — a structure with **no existing precedent anywhere in the Client Finder UI** (§4.3, "no per-segment or nested-list structure exists").

**PRODUCT DECISION REQUIRED**: aggregate-only, per-segment-only, or both. Not decided here.

## 7. D10-C — Evidence Visibility

Per the task's enumerated items, mapped against §4.3's established pattern:

| Item | UI precedent status |
|---|---|
| Primary first-party website evidence | `FACT`: precedent exists — `signal.signal`/`sources[].sourceQuote` (§4.3) |
| Supporting search-derived evidence | `FACT`: no distinct rendering exists for "supporting" vs. "primary" evidence — the existing loop treats every source uniformly, with no tier/priority distinction rendered |
| Evidence snippets | `FACT`: precedent exists — `source.sourceQuote`, quoted inline (§4.3, line 140) |
| Source URLs | `FACT`: precedent exists — `source.sourceUrl` as an `<a href>` (§4.3, line 137) |
| Source titles | `FACT`: precedent exists — `source.sourceLabel` as the link text (§4.3, line 138) |
| Timestamps/freshness | `FACT`: **no precedent** — `signal.observedAt` exists on the data type but is never rendered anywhere (§4.3) |
| Confidence | `FACT`: precedent exists, with the UNKNOWN-suppression convention already noted (§4.3, line 131) |
| Evidence tier (D3's Tier 1/2/3) | `FACT`: **no precedent, and no corresponding field exists on `StoredResearchSignal`** — this is a governance-document concept only |
| Rationale/basis | `FACT`: precedent exists — `signal.basis` (§4.3, line 134) |

**PRODUCT DECISION REQUIRED**: which subset of the above to surface for category plausibility specifically, and whether a new "supporting vs. primary" or "tier" distinction should be introduced into the UI (neither has any existing precedent to extend).

## 8. D10-D — MISMATCH Presentation

Per D5 (locked, not reopened): MISMATCH fails the Qualification criterion but does not block Opportunity creation.

**FACT, established in §4.5**: the existing page structure already separates "the Opportunity exists, here is its offer" (unconditional) from "here is the Qualification outcome, per criterion" (conditional, independent section) — this is precisely the structural separation needed to communicate "category plausibility did not pass Qualification, but the Opportunity still exists," using the existing Qualification criteria list pattern (§4.4) for the "did not pass" half and the existing, already-unconditional Opportunity section (§4.5) for the "still exists" half. **This is an `INFERENCE` about feasibility using the existing pattern** — no such MISMATCH-specific row has been built, and whether it is sufficient (versus needing, e.g., a more prominent visual distinction, a warning banner, or explanatory copy beyond the generic `reason` string) is `PRODUCT DECISION REQUIRED`.

**Confirmed constraint, not to be changed by this document**: D5's behavior (MISMATCH does not block Opportunity creation, no new Opportunity state) is not altered by any D10 choice — D10 only concerns how an already-decided behavior is *presented*, not what that behavior *is*.

## 9. D10-E — UNKNOWN Presentation

`FACT`: the only existing UI treatment of any "UNKNOWN" value is `signal.classification !== 'UNKNOWN'` suppressing the confidence number (§4.3, line 131) — there is no dedicated "insufficient evidence" copy, icon, or visual pattern anywhere in the Client Finder UI today. The word "UNKNOWN" itself, when it is the value, would render as the literal enum string with no special treatment beyond the confidence suppression.

Choices, per the task, none selected:
- **Explicitly displayed as "UNKNOWN"** — matches the existing raw-enum-text convention (`signal.classification`, `qualification.state`) exactly, requiring no new UI vocabulary.
- **Displayed as "insufficient evidence"** — a new, humanized label not currently used anywhere in the Client Finder UI (the closest existing string, `'No research signals recorded.'`, §4.3 line 124, and `'No suitable offer — evidence was insufficient to recommend one (AC-14).'`, §4.5 line 103, are both *absence-of-data* messages, not a *result classification* label — a genuine `INFERENCE`-supported but not `FACT`-established precedent for this specific phrasing).
- **An existing uncertainty pattern** — `FACT`: the only existing "uncertainty" treatment in the UI is the confidence-suppression convention (§4.3); there is no broader, reusable "uncertainty" component or pattern beyond that one conditional.

**Also relevant, per §4.4**: `QUALIFICATION_STATES` already includes `INSUFFICIENT_EVIDENCE` as a distinct top-level Qualification state (`types.ts:9`) — if a future D4/D5 implementation ever maps category-plausibility UNKNOWN onto this existing state (not decided by any document, including this one), it would render via the existing `Qualification: {qualification.state}` heading (§4.4, line 151) automatically, using existing rendering with no new UI code — this is recorded as an available option's mechanical consequence, not a recommendation.

**PRODUCT DECISION REQUIRED**: which presentation to use. Not decided here.

## 10. D10-F — Segment-Level Transparency

Per D2 (locked, not reopened): deterministic multi-segment parsing + ANY-match aggregation. A participant with segments `A → MATCH`, `B → UNKNOWN`, `C → MISMATCH` aggregating to `MATCH` (since ANY segment matching is sufficient) raises a genuine transparency question: without segment-level detail, the participant sees only "MATCH" and has no way to know segments B and C did not themselves match.

**FACT**: no existing UI structure could display this today without new code — the flat, non-nested list pattern (§4.3) has no precedent for a two-level (segment → result) hierarchy anywhere in the Client Finder surfaces.

**PRODUCT DECISION REQUIRED**, restated from the task without a proposed answer: whether the aggregate alone is sufficient, or whether per-segment detail must be shown (at minimum for transparency into which specific segment(s) drove a MATCH, and which did not) — and if the latter, whether that detail should be always-visible, or hidden behind some disclosure mechanism (noting again, per §4.3, that no expand/collapse pattern exists anywhere in this UI today, so introducing one would itself be a new UI concept, not an extension of an existing one).

## 11. D10-G — Source Provenance

`FACT`, restated from §4.3 and §7: exposing a first-party website URL and an evidence snippet is **already fully supported by the existing UI contract** — `source.sourceUrl`/`source.sourceLabel`/`source.sourceQuote` (`StoredResearchSignal.sources[]`) are already rendered, unconditionally, for every existing Research signal on the Opportunity detail page (§4.3, lines 135-141). No new data shape or rendering mechanism would be required to expose the same fields for a category-plausibility determination's evidence, **provided** that evidence is represented using the same `evidence[]`/`sources[]` shape every other `Observation`-derived field already uses — a shape question governed by D1 (already locked as a dedicated Search+Prospect entity, not a `ResearchSignal` row, per `PATH_2_CATEGORY_PLAUSIBILITY_D7_PRODUCT_DECISION.md`) and D3, not by this document.

## 12. D10-H — Freshness

D6 establishes Search + Prospect attribution and historical preservation across Searches with different `targetCustomer` values.

`FACT`: `StoredResearchSignal.observedAt`/`.supersededAt` exist on the underlying data type (confirmed in this governance chain's prior D7/D8 tracing) but are **never rendered anywhere in the Client Finder UI** — not on the Opportunity detail page's Evidence section (§4.3), not on the Search status page (§4.1, which does show `search.createdAt`/`.updatedAt` for the *Search* itself, but not for any individual Research signal or Prospect-level record), and not anywhere else.

**Consequence for D10, stated as an observation, not a decision:** because D6 requires multiple, historically-preserved, Search-scoped determinations to coexist for the same Prospect across different Searches (e.g., Search A → MATCH against "Restaurants," Search B → MISMATCH against "Hotels," both retained per D6), a participant viewing a Prospect that was researched under more than one Search could, in principle, need some way to know *which Search's* determination they are looking at — a freshness/attribution-disambiguation need that does not arise for any existing field today, because no existing field has more than one *simultaneously valid* determination per Prospect (per-Prospect supersession, `repository.ts:18`, already discards the prior value for every existing `ResearchSignal` field). This is a **newly surfaced UI implication of D6**, not a new decision — whether and how to expose Search-scoping/freshness in the UI remains `PRODUCT DECISION REQUIRED`, and no existing UI pattern currently solves it, because the underlying multi-valid-determination case D6 describes has no analogue among any field the current UI already renders.

## 13. Candidate D10 Choices

Presented as neutral alternatives; none ranked, scored, or selected.

**Location (D10-A):**
- Extend the existing Opportunity detail page's Evidence and/or Qualification sections (smallest change, reuses existing patterns, §4.3–§4.5).
- Build a new Search + Prospect result surface (largest change, no existing precedent, §4.1).
- Defer visibility entirely for MVP (zero UI change, §5 Option F).

**Determination granularity (D10-B, D10-F):**
- Aggregate MATCH/MISMATCH/UNKNOWN only.
- Aggregate plus per-segment breakdown, always visible.
- Aggregate plus per-segment breakdown, behind a new disclosure mechanism (no existing precedent, §4.3).

**Evidence depth (D10-C, D10-G):**
- Reuse the existing Evidence-section fields exactly (`field`/`classification`/`confidence`/`signal`/`basis`/`sources[]`), no additions.
- Add a new "supporting vs. primary" distinction (no existing precedent).
- Add a new evidence-tier label (no existing precedent, no existing data field).

**MISMATCH/UNKNOWN wording (D10-D, D10-E):**
- Raw enum text (`MATCH`/`MISMATCH`/`UNKNOWN`), matching the existing `classification`/`qualification.state` convention exactly.
- Humanized copy (e.g., "insufficient evidence"), a new UI vocabulary not used elsewhere today.
- Map UNKNOWN onto the existing `INSUFFICIENT_EVIDENCE` Qualification state (a mechanical option available per §9, not evaluated for correctness by this document).

**Freshness (D10-H):**
- Do not expose freshness/Search-scoping in the UI (matches every existing field's current treatment).
- Expose which Search a determination belongs to, given D6's multi-valid-determination case has no existing analogue.

## 14. Dependencies on D0–D9

D10 consumes, and does not reopen, every locked decision:

- **D0** (MVP enhancement) — governs *whether/when* this is built at all; D10 assumes the capability exists to be displayed, consistent with D0's scope, without reopening D0's timing.
- **D1** (dedicated Search+Prospect entity) — governs the data shape D10 would read from; §11 notes the UI contract is reusable *if* D1's entity exposes an `evidence[]`/`sources[]`-shaped structure, but D10 does not require or propose any specific D1 schema.
- **D2** (deterministic parsing + ANY-match) — directly informs D10-B/D10-F's granularity question (§6, §10) without D10 altering D2's semantics.
- **D3** (evidence policy) — informs D10-C's evidence-depth question (§7) without D10 altering D3's sufficiency bar.
- **D4** (distinct Qualification criterion, not R-71) — the Qualification section (§4.4) D10 would extend already exists for exactly this purpose; D10 does not touch R-71 or `TOPICAL_FIELDS`.
- **D5** (MATCH/MISMATCH/UNKNOWN Qualification/Opportunity behavior) — directly informs D10-D/D10-E (§8, §9) without D10 altering D5's gating behavior; the Opportunity/Qualification section independence (§4.5) that makes D5's distinction presentable already exists, unmodified by D10.
- **D6** (per-Search+Prospect attribution) — directly informs D10-H (§12) without D10 altering D6's attribution rule.
- **D7** (outside `FIELD_KIND`/`ResearchSignal`) — confirms the category-plausibility determination will not automatically inherit the existing Evidence section's exact backing query (`listResearchSignals`, §4.3, line 62); a future implementation reading from D1's separate entity would need its own read path, a fact for implementation scope, not a reason to alter D7.
- **D8** (Option B, non-binding) and **D9** (Option A, full provider neutrality) — govern Research's input/provider architecture; D10 is a presentation-layer decision entirely downstream of Research's output and has no interaction with either.

## 15. Implementation Constraints

Recorded as facts discovered in this task, not as implementation instructions:

1. Any new UI element must be added to `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` (or a new page, per whichever D10-A choice is made) — no existing shared "evidence card" or "criterion row" component exists as an extractable unit; both patterns are inlined directly in this one page file (§4.3–§4.4).
2. No existing data-fetching function reads D1's (unbuilt) dedicated Search+Prospect entity — `listResearchSignals` (§4.3) reads only `ResearchSignalRepository`, which per D7 the category-plausibility determination will not be part of; a future implementation would need a new read call, not an extension of the existing one.
3. No freshness/timestamp rendering convention exists to extend (§4.3, §12) — introducing one is a new UI pattern, not a reuse.
4. No expand/collapse or nested-list convention exists to extend (§4.3, §10) — introducing one is a new UI pattern, not a reuse.
5. No evidence-tier or primary/supporting distinction exists to extend (§7) — introducing one is a new UI pattern, not a reuse.
6. The Opportunity list page (§4.2) currently shows no per-Opportunity evidence, classification, or Qualification detail at all — if category plausibility is meant to be visible at a glance across the whole ranked list (not evaluated as a location option in this document, since it was not one of the task's named choices), that would be a larger change than any of D10-A's named options.
7. No conflict between D10 and any of D0–D9/R-71/scoring/Discovery/Opportunity creation was discovered in this task — every UI precedent traced in §4 already respects the existing separation (Opportunity/Qualification/Score are already three independent sections; none of them is proposed to change).

## 16. Open Product Decisions

The Product Owner must answer:

1. **D10-A**: Where should category plausibility be visible — the Opportunity detail page's existing sections, a new Search + Prospect surface, a new standalone Research/Qualification page, multiple of these, or not at all for MVP?
2. **D10-B**: Should the UI show only the aggregate MATCH/MISMATCH/UNKNOWN result, or also the per-segment breakdown D2's ANY-match aggregation is computed from?
3. **D10-C**: Which evidence fields should be shown (all of the existing Evidence-section fields, a subset, or additional fields — such as a primary/supporting distinction or an evidence tier — that have no existing UI or data-model precedent)?
4. **D10-D**: Is extending the existing, already-independent Opportunity/Qualification section pattern (§4.5) sufficient to communicate "MISMATCH failed Qualification but did not block the Opportunity," or is additional explanatory UI needed?
5. **D10-E**: Should UNKNOWN be shown as the raw literal word "UNKNOWN" (matching existing convention), as humanized "insufficient evidence" copy (a new UI vocabulary), or via the existing `INSUFFICIENT_EVIDENCE` Qualification state (a mechanical option not evaluated for correctness here)?
6. **D10-F**: If per-segment detail is shown (per D10-B), should it always be visible, or hidden behind a new disclosure mechanism (noting none currently exists)?
7. **D10-H**: Given D6 allows multiple, simultaneously valid, Search-scoped determinations for the same Prospect (a case with no existing UI analogue), should the UI expose which Search a shown determination belongs to, or is this acceptable to leave unaddressed for MVP?
8. **Timing**: Should D10 be resolved and built before or after D1's persistence entity and D4's Qualification criterion are implemented, or can UI work proceed independently once those exist (per §14, D10 is downstream of, but not blocking, D1/D4)?

No option above is selected, ranked, or recommended by this document.

## 17. Recommended Decision Order

A dependency ordering is identified; no decision is made:

```text
D10-C (evidence depth) and D10-B/D10-F (determination granularity)
  ↓  — these determine what data must exist before any layout choice can be finalized
D10-A (visibility location)
  ↓  — once "what" is fixed, "where" can be decided; D10-A also depends on whether
       D10-H's freshness/Search-scoping need is judged significant enough to require
       a location that can show multiple Search-scoped results (favoring a new
       surface) versus one that shows only the current Search's result (compatible
       with extending the existing Opportunity detail page)
D10-D and D10-E (MISMATCH/UNKNOWN wording)
  ↓  — presentational wording choices, independent of location/granularity, but
       most naturally finalized once the surrounding section structure (D10-A) is fixed
D10-H (freshness/Search-scoping exposure)
  — can be decided at any point after D10-A, since it is a presentational addition
    to whichever surface is chosen, not a structural prerequisite for it
```

This ordering reflects structural dependency (what must be known before what can be laid out), not a recommendation about which choice to make at each step.

## 18. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION

NOT GRANTED
```

Nothing in this document authorizes writing, modifying, or generating any production code, test, schema, migration, configuration, or UI file. A separate, explicit implementation-authorization step is required after D10 (and D11) are resolved.

## 19. Repository Safety

```text
Branch:                       phase-17-r34-worker-orchestration

Recorded starting HEAD
(git rev-parse HEAD, run at task start):     5992b82b9adff492c480442d68a954f2a03bfb28

Expected baseline (per task instructions):   5992b82b9adff492c480442d68a954f2a03bfb28
Match:                                       CONFIRMED — no discrepancy.

HEAD after task completion:                  5992b82b9adff492c480442d68a954f2a03bfb28
                                              (unchanged — verified below)

Production code changed:      0
Tests changed:                 0
PRD changed:                    0
Configuration changed:           0
Database/migrations changed:      0
Provider code changed:              0
Worker code changed:                 0
Live API calls:                       0
Staged:                                 none
Commit:                                  none
Push:                                     none

File created by this task (the only new file):
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_DECISION_PREPARATION.md

D0–D9 governance documents: read where relevant to this task's own citations
(D7 and D8 product decisions, and the Final Decision Record's locked D0–D6/D9
summaries as already established in this session), NOT modified. No existing
governance document, including PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md,
was modified by this task.

Files read for this task, not modified:
  apps/web/app/(client-finder)/opportunities/[id]/page.tsx
  apps/web/app/(client-finder)/opportunities/page.tsx
  apps/web/app/(client-finder)/searches/[id]/page.tsx
  apps/web/src/components/client-finder/SearchStatusPoller.tsx
  packages/core-qualification/src/types.ts
  (grep-based verification, not full reads: repository-wide search for
  "evidence"/"confidence"/"UNKNOWN"/"details"/"Collapse"/"expand" across
  apps/web/app and apps/web/src)

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, .claude/, CLAUDE.md, and
the full pre-existing requirement/*.md set included).
```

## STOP

D10 is **not** selected by this document. No option in §13 is ranked or recommended. No existing file is modified. This task ends with this read-only D10 decision-preparation document and the repository-safety verification above.
