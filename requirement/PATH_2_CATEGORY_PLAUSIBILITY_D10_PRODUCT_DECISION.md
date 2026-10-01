# D10 — Category Plausibility UI Product Decision

## 1. Status

```text
DECIDED

IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This is a governance/product-decision record. It records the Product Owner's resolution of D10-A through D10-H. It does not implement, design in code, or authorize any UI, schema, Research, Qualification, or Opportunity change. No production code, test, PRD, configuration, database/migration, provider code, or worker file is created or modified by this document, and no live API call is made.

## 2. Decision Summary

| Decision | Choice | Status |
|---|---|---|
| D10-A | **A — Opportunity detail only** | DECIDED |
| D10-B | **B — Aggregated result + individual segment results** | DECIDED |
| D10-C | Reuse existing evidence fields (URL, label, quote, confidence, basis); first-party vs. supporting evidence distinguished by label only, no new tier taxonomy | DECIDED |
| D10-D | UNKNOWN shown as literal "UNKNOWN" on the determination; Qualification criterion row shows "not satisfied" + reason; Opportunity section remains unconditionally rendered | DECIDED |
| D10-E | MISMATCH shown as literal "MISMATCH"; Qualification criterion row shows "not satisfied" + reason; Opportunity section remains unconditionally rendered, unchanged in position/prominence | DECIDED |
| D10-F | MATCH shown as literal "MATCH" with matched-segment evidence; never surfaced on the ranked Opportunities list; not a score/rank input | DECIDED |
| D10-G | Show the Search's `targetCustomer` context and the determination's timestamp on the same Opportunity page; no cross-Search comparison UI (each rediscovery is a distinct Opportunity, per Prospect/Search 1:1) | DECIDED |
| D10-H | Visible only once the Research-produced determination exists and Qualification has evaluated it — same "render only if the record exists" convention already used for Qualification/Personalization/Outreach/Follow-Up | DECIDED |

## 3. Product Decision

The Search + Prospect category-plausibility determination is presented **exclusively on the existing Opportunity detail page** (`apps/web/app/(client-finder)/opportunities/[id]/page.tsx`), as a new section following the same structural convention already used by the page's existing Evidence (lines 121-147) and Qualification (lines 149-160) sections. No new page or route is introduced.

The section shows the **aggregate** MATCH/MISMATCH/UNKNOWN result, followed by **each parsed target-customer segment's own** MATCH/MISMATCH/UNKNOWN result and its supporting evidence — mirroring the existing score-factors list pattern (`score.factors.map(...)`, lines 111-115: a heading naming the aggregate/total, followed by a flat list of contributing items). The Search's `targetCustomer` context and the determination's timestamp are shown alongside it. The category-plausibility Qualification criterion appears as one additional row in the existing Qualification criteria list (line 152-157), using the existing `satisfied`/`reason` shape — nothing about the existing Opportunity section (lines 79-105), which remains unconditionally rendered regardless of this new section's content, changes.

Category plausibility is never shown on the ranked Opportunities list page (`apps/web/app/(client-finder)/opportunities/page.tsx`) and never influences the score, band, or rank order shown there.

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

## 4. User Experience

A user opens an Opportunity's detail page (as they already do today) and, in addition to what they already see, would see:

- **Aggregate determination**: a labeled value — MATCH, MISMATCH, or UNKNOWN — for "Target-customer fit" (or equivalent product-facing label), presented the same way `qualification.state` is presented today (raw label text, no icon or color system introduced beyond what already exists on the page).
- **Segment-level information**: beneath the aggregate, one row per deterministically-parsed target-customer segment (per D2), each showing the segment's own text (e.g., "Restaurants, Cafes"), its own MATCH/MISMATCH/UNKNOWN result, and its own supporting evidence (§5). The aggregate is visually the parent summary of this list — the same relationship the existing Score section already has to its list of factors (one total, several contributing rows).
- **Evidence**: for each segment with evidence, the same evidence-item shape already used elsewhere on this page — source link, source label, quoted text, confidence (when applicable), and basis (§5).
- **UNKNOWN**: the aggregate and/or a segment shows the literal word "UNKNOWN," exactly as `signal.classification` already does today; the Qualification criteria list separately shows this criterion as "not satisfied," with a `reason` explaining insufficient evidence — the Opportunity itself (state, offer) is shown exactly as it already is today, unaffected.
- **MISMATCH**: the aggregate shows "MISMATCH"; the Qualification criteria list shows this criterion as "not satisfied," with a `reason` explaining why; the Opportunity section above/alongside it is unchanged, unconditional, and in no way suggests the Opportunity was removed, held back, or rejected.
- **MATCH**: the aggregate shows "MATCH," with the matching segment(s)' evidence visible; this appears only within this detail page's own sections — it never appears as a badge, sort key, or score component anywhere else.
- **Search context**: the `targetCustomer` value this determination was evaluated against, displayed using the same plain-text convention the Search status page already uses for `search.parameters.targetCustomer` (`searches/[id]/page.tsx:68-69`).
- **Historical attribution**: not shown as a list on this page. Because one Opportunity belongs to exactly one Prospect, and one Prospect belongs to exactly one Search (`UNIQUE(search_id, company_id)`; "One Opportunity per Prospect" per `core-opportunity/src/service.ts`'s own doc comment, both already established in this governance chain), a business rediscovered under a different Search appears as a **separate row** on the Opportunities list page, with its **own** Opportunity detail page and its **own** category-plausibility section for that Search's `targetCustomer`. No cross-Search comparison view is introduced.
- **Lifecycle visibility**: the new section appears only once it has data to show — before Research/Qualification complete for a given Opportunity, it is simply absent, exactly as the existing Qualification/Personalization/Outreach/Follow-Up sections already behave (`opportunities/[id]/page.tsx:25-33`'s own comment: each "render[s] only IF a record already exists").

## 5. Evidence Presentation

Visible, reusing the existing evidence-item shape exactly (`opportunities/[id]/page.tsx:128-143`):
- Source URL (as a link).
- Source label (the link text).
- Quoted evidence text.
- Confidence (shown for OBSERVED/INFERRED evidence; suppressed for UNKNOWN, matching the existing convention at line 131).
- Basis.

**First-party website evidence vs. search-derived supporting evidence (D3)** are distinguished by a plain text label on each evidence item (e.g., "First-party website" vs. "Supporting evidence"), the same way the page already labels evidence by its `field`/`classification` as plain text (line 130) — **no numeric tier, ranking, or score is introduced for evidence**, consistent with D3's own evidence hierarchy (first-party primary, search-derived supporting-only) and with the instruction not to invent a tier taxonomy beyond what D3 already established. This label is descriptive only, never used to sort, filter, or weight evidence in the UI.

**Evidence source type**: shown as the same plain descriptive label above — not a new, separate taxonomy.

## 6. Qualification Relationship

The page keeps three concepts visually and structurally separate, exactly as it already does today for the Opportunity/Qualification split (`opportunities/[id]/page.tsx:79-160`):

1. **Opportunity exists** — the existing Opportunity section (state, need detected, staleness, recommended offer) renders unconditionally, unaffected by anything below.
2. **Qualification result** — the existing Qualification section renders the overall `qualification.state` and, per criterion, `satisfied`/`reason`. The category-plausibility criterion appears here as one more row, using the existing shape — it does not replace or merge with `NEED_DETECTED`/`EVIDENCE_PRESENT`.
3. **Category-plausibility result** — the new section (§3, §4) renders the aggregate and per-segment MATCH/MISMATCH/UNKNOWN values and their evidence, as the *source material* the Qualification criterion's `reason` can refer to (via `evidenceSignalIds`-equivalent linkage, exact mechanism not decided here — an implementation detail).

These three remain three separate pieces of information on the page, never collapsed into one value or one visual element — a user can see "the Opportunity exists," "Qualification did or didn't pass, and why," and "here is the underlying category-plausibility evidence" as three independently true statements, exactly mirroring how the page already keeps Opportunity and Qualification independent today.

## 7. Historical Attribution

D6 (unchanged) requires the determination to be attributable to its specific Search + Prospect, with historical attribution preserved across Searches and no cross-Search overwrite. This UI decision satisfies that requirement structurally, without new cross-Search UI:

- Each Opportunity detail page corresponds to exactly one Prospect, which corresponds to exactly one Search (per the already-established `UNIQUE(search_id, company_id)` constraint and the "one Opportunity per Prospect" rule) — so the single category-plausibility section shown on that page is unambiguously the determination for *that* Search + Prospect, with no possibility of accidentally displaying a different Search's result.
- A rediscovery of the same business under a different Search produces a different Prospect and a different Opportunity, each with its own detail page and its own category-plausibility section — historical attribution is therefore preserved and navigable simply by visiting each Opportunity's own page (via the existing Opportunities list, `opportunities/page.tsx`), not by any new comparison UI.
- No collapsed/expanded/separately-navigable historical list is introduced, because there is no case where more than one Search's determination needs to appear on the same page.

## 8. Boundaries

```text
D0–D9: UNCHANGED
R-71: UNCHANGED
Scoring/Ranking: UNCHANGED
Discovery: UNCHANGED
Opportunity creation/state machine: UNCHANGED
```

No provider-specific UI semantics are introduced (consistent with D9, Option A — the UI renders whatever MATCH/MISMATCH/UNKNOWN value Research produced, with no rendering path that varies by which provider served the Research call). No new Opportunity state is introduced (D5, unchanged). Category plausibility never appears on, or influences, the ranked Opportunities list, its score, or its band (Scoring/Ranking unchanged; category plausibility is treated strictly as informational/Qualification evidence, never a ranking input).

## 9. Implementation Authorization

```text
NOT AUTHORIZED
```

This task only records the product decision. No UI, schema, Research, Qualification, Opportunity, or test code is written, modified, or authorized by this document.

## 10. Decision Rationale

**D10-A (Opportunity detail only):** Every Prospect eligible for a category-plausibility determination already receives an Opportunity, unconditionally (D5: MISMATCH does not block Opportunity creation). Since one Opportunity belongs to exactly one Prospect, and one Prospect belongs to exactly one Search, the Opportunity detail page already carries an unambiguous Search + Prospect identity — a separate "Search + Prospect detail" surface would duplicate that identity without covering any case the Opportunity page does not already reach, at the cost of building an entirely new page with no existing precedent (per the D10 preparation audit's finding that no such surface exists today). Extending the existing page is the smaller, more consistent choice; a dedicated Search+Prospect surface was not selected for this reason, not because it was ruled out on principle.

**D10-B (aggregate + segments):** D2's ANY-match aggregation means a MATCH can be driven by only one of several segments. Showing the aggregate alone would hide that nuance entirely (a user could not tell a business matched on every segment from one that barely matched on one), while showing segments alone would force the user to mentally re-derive D2's OR logic. Showing both keeps the headline result immediately legible while preserving full transparency into how it was reached.

**D10-C (existing evidence fields, no new tier):** The existing Evidence section's fields already cover everything D3 requires distinguishing (first-party vs. supporting) without inventing new data. A plain descriptive label was chosen over a new tier/ranking system because no such system exists anywhere in the current UI or data model, and introducing one was explicitly out of scope for this decision.

**D10-D/D10-E (UNKNOWN/MISMATCH as literal labels, Qualification unaffected in structure):** The existing page already uses raw enum text for `classification` and `qualification.state` — reusing that convention keeps the three states visually and terminologically consistent with everything else on the page, and keeping the Opportunity section's rendering completely unconditional (as it already is) is the simplest way to avoid ever implying an Opportunity was deleted or rejected.

**D10-F (MATCH never a ranking signal):** Explicitly required by the task's own boundary constraints and by D9/scoring's "unchanged" status — MATCH is evidence for Qualification, not a scoring or ranking input, so it must never appear where score/rank already live (the Opportunities list page).

**D10-G (Search context shown, no cross-Search comparison UI):** Because Prospect/Opportunity are already Search-scoped 1:1, exposing "which Search" is simply exposing data already implicit in the page being viewed — no new comparison mechanism is needed to satisfy D6's attribution requirement.

**D10-H (visible once the record exists):** Matches the exact convention the page already uses for every other conditionally-present section (Qualification, Personalization, Outreach, Follow-Up) — introducing a different, bespoke "in progress" state for this one section alone would be inconsistent with how every other stage-dependent section on this page already behaves.

No unrelated product options were ranked against each other beyond what was necessary to explain why the chosen option was selected; alternatives not chosen (a new Search+Prospect surface, segments-only display, a new evidence-tier system, a new Qualification/Opportunity state) are recorded as available but not selected, for the reasons above — not as inferior in any general sense.

## 11. Implementation Constraints

Recorded as constraints a future, separately-authorized implementation must respect — not implemented here:

1. The new section must be added to `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` (or its eventual componentized equivalent), not a new route.
2. The new section must read from D1's dedicated Search+Prospect entity (not yet built, per D7's confirmation it is not a `ResearchSignal`) — it cannot reuse `listResearchSignals()` unmodified, since that function reads only `ResearchSignalRepository`.
3. The aggregate MATCH/MISMATCH/UNKNOWN value and each segment's own MATCH/MISMATCH/UNKNOWN value must both be rendered — a data shape that returns only the aggregate is insufficient for this decision.
4. Each segment's evidence must reuse the existing `{sourceUrl, sourceLabel, sourceQuote, confidence, basis}` shape — no new evidence schema should be invented for this purpose alone.
5. The first-party/supporting distinction must be renderable as a plain label from whatever data D1's entity persists — this decision does not specify the exact field name or enum value, only that the distinction must be presentable as text.
6. The category-plausibility Qualification criterion must plug into the existing `QualificationCriterionResult { criterion, satisfied, reason, evidenceSignalIds }` shape without modifying that shape.
7. The Opportunity section's existing rendering (`opportunities/[id]/page.tsx:79-105`) must not become conditional on this new section's presence or content.
8. The Opportunities list page (`opportunities/page.tsx`) must not be modified to show category-plausibility data, badges, or filters as part of satisfying this decision.
9. The `targetCustomer` value and determination timestamp shown per §4/§7 must be sourced from the Search/determination actually attributable to the Opportunity being viewed — not from the participant's current `ServiceProfile`, which may have since changed (consistent with D6's immutable-snapshot attribution).
10. No implementation may introduce a new `QualificationState` or `OpportunityState` value to satisfy this decision — UNKNOWN/MISMATCH must be expressible using the existing `satisfied: false` + `reason` shape.

## 12. Decision History

```text
Prior status: requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_DECISION_PREPARATION.md
recorded D10 as "PRODUCT OWNER DECISION REQUIRED" / "IMPLEMENTATION NOT
AUTHORIZED" — a read-only audit of the existing Client Finder UI (Search
status page, Opportunities list, Opportunity detail page) that established
the available evidence, precedents, and gaps for D10-A through D10-H without
selecting among them.

This document converts D10 from PREPARATION to DECIDED: the Product Owner has
selected Opportunity-detail-only visibility (D10-A), aggregate-plus-segment
display (D10-B), and the presentation rules for evidence, UNKNOWN, MISMATCH,
MATCH, Search context, and lifecycle visibility recorded in §2-§7 above,
grounded in the preparation document's own findings and in repository facts
already established earlier in this governance chain (Prospect/Search
uniqueness, one-Opportunity-per-Prospect).

Implementation authorization remains NOT GRANTED. D0-D9 are unchanged. D11
remains open and is not addressed by this document.
```

## 13. Repository Safety / Audit Record

```text
Branch:                       phase-17-r34-worker-orchestration

Recorded starting HEAD
(git rev-parse HEAD, run at task start):     5992b82b9adff492c480442d68a954f2a03bfb28

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

File created by this task (the only file changed):
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_PRODUCT_DECISION.md

Files/facts relied upon, established earlier in this same session and not
re-read in this task since HEAD is unchanged:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_DECISION_PREPARATION.md
    (UI precedent findings: opportunities/[id]/page.tsx evidence/qualification
    sections, searches/[id]/page.tsx Search-level status, no existing
    Search+Prospect surface, no tier/freshness/segment precedent)
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D7_PRODUCT_DECISION.md
    (category plausibility outside FIELD_KIND/ResearchSignal)
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md,
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md
    (D8 Option B non-binding; D9 Option A full provider neutrality)
  packages/core-qualification/src/types.ts (QualificationCriterionResult/
    StoredQualification shape, read in full in the immediately preceding
    D10 preparation task this session)
  Prospect UNIQUE(search_id, company_id) and "one Opportunity per Prospect"
    facts, established with exact citations in this session's D8/D9
    preparation tasks (migration.sql:112-116; core-opportunity/src/service.ts
    doc comments)

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` and all
other existing governance documents: not modified by this task.

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

D10 is recorded as **DECIDED**, with **IMPLEMENTATION AUTHORIZATION: NOT GRANTED**. No production code, test, PRD, configuration, database/migration, provider, or worker file is created or modified by this task. D0–D9 are unchanged; D11 is not addressed. This task ends with the D10 decision recorded as above and repository safety verified.
