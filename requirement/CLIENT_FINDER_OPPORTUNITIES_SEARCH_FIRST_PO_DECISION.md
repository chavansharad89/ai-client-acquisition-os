# Client Finder — Search-First Results with Cumulative Workspace (B2)

## 1. Decision ID

`CF-OPPORTUNITIES-SEARCH-FIRST-PO-DEC-001`

## 2. Decision status

**DECIDED.** This is a **Product Owner product decision record only**. It grants **no implementation, schema,
migration, route, test, or UI-code authority**. No code, test, schema, migration, route, service, or UI file is
modified, authorized, or implied by this record. Nothing is staged, committed, pushed, or deployed as a result of
this record.

This record resolves the "global vs. search-scoped" question left explicitly open by the prior read-only audit
(immediately preceding this record): no PO record previously decided whether `/opportunities` should be global or
search-scoped. This record closes that gap with **B2**. It does not reopen or conflict with any decision listed in
§6.

## 3. Decision authority

**Product Owner.** The decision in §4 below was supplied directly by the Product Owner and is recorded here
substantially as stated, without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. THE DECISION — B2

> **Search-first results with cumulative workspace.**

The Client Finder results experience must distinguish between two views:

### 4.1 Current/Search Results (default after a Search)

- `/opportunities` defaults to the Opportunities belonging to the relevant Search.
- After a Search completes, the user must be able to see the Opportunities produced by that Search without
  unrelated Opportunities from previous Searches being mixed into the default result set.
- Opportunities from unrelated Searches must **not** appear in the Search-specific result view.

### 4.2 Cumulative Workspace

- Historical Opportunities remain persisted (unchanged — this record does not authorize deleting, archiving, or
  migrating any historical data).
- Users must retain access to their cumulative/all-time Opportunity workspace through a **separate, explicit**
  view/control.
- The cumulative workspace may contain Opportunities from multiple Searches.

### 4.3 Scope clarification — mechanism deferred

This record decides **product behavior only**: results are Search-scoped by default, with a separate explicit
cumulative workspace. It does **not** decide the exact navigation/UI mechanism (latest-search redirect, explicit
Search ID in the route, a search-history page, tabs, a query parameter, a new route structure, or any other
shape). That is an implementation/UX question, audited read-only immediately after this record, to be authorized
separately.

### 4.4 Ranking tie-break issue — explicitly out of scope

The previously-identified issue that ranking ties on `UNKNOWN` for the large majority of records, with a
recency-blind tie-break (`score.id.localeCompare()`), is **explicitly out of scope for B2**. B2 does not alter
ranking behavior in any way. That issue may require its own, separate, future PO/engineering decision.

## 5. This decision does NOT change

- Search creation, Search processing, or Search lifecycle (`PENDING`/`RUNNING`/`COMPLETE`/`FAILED`/`CANCELLED`).
- Discovery or Research.
- Opportunity creation (`createOpportunityForOwner` and the pipeline that calls it).
- Company deduplication (`findOrCreateByDomain`, `UNIQUE(user_id, normalized_domain)`).
- Prospect creation or the `UNIQUE(search_id, company_id)` constraint.
- Opportunity persistence — no Opportunity, Prospect, Score, or Qualification row is deleted, archived, or altered.
- B1 qualification presentation (`CF-OPPORTUNITIES-LIST-VISIBILITY-PO-DEC-001`) — unaffected and unmodified.
  `QUALIFIED` → normal/high-priority presentation; `NOT_QUALIFIED` → visible and de-emphasized;
  `INSUFFICIENT_EVIDENCE` → visible and de-emphasized. This remains true identically within Search-scoped results
  and within the cumulative workspace.
- Qualification logic, evidence thresholds, ranking dimensions, ranking scores, ranking algorithms, or
  contact-unlock eligibility.

## 6. Relationship to prior records — conflict check

**No governance conflict found.**

- `CF-OPPORTUNITIES-LIST-VISIBILITY-PO-DEC-001` (B1) — decided *which qualification states* are visible and how
  they're presented, independent of scope. B2 decided *which Opportunities are in scope* (Search-specific vs.
  cumulative). These compose cleanly: B1's presentation rules apply identically inside whichever scope B2 selects
  for a given view. Neither record changes the other.
- `CF-C-SERIES-PO-DEC-001` §C-6 (Minimum Useful Lead Result list content) — decided row *content*; unaffected,
  applies identically in both the Search-scoped and cumulative views.
- `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`/`-002` (Search creation/input) — unaffected; B2 does not
  change how a Search is created or what it captures.
- `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` D4/D5 (Opportunity creation unconditional on
  qualification outcome) — unaffected; B2 does not change what gets created, only what is displayed and when.
- `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001` (seven-dimension ranking) — unaffected (§4.4, §5).
- `CF-ZERO-AI-MVP-PO-DEC-001` — unaffected; B2 does not touch AI-escalation policy.
- No PO record previously decided `/opportunities` scope (confirmed by the audit preceding this record); B2 is the
  first record to do so, and does not supersede anything.

## 7. Governance safety — not decided here

The following remain separate, unresolved implementation/UX questions, **not** decided by this record, to be
addressed in the (separate) implementation-delta audit and its own authorization:

- The exact navigation/UI mechanism connecting a completed Search to its Search-scoped results (§4.3).
- The exact mechanism for reaching the cumulative workspace (separate route, query parameter, tab, link, etc.).
- Whether a Search-scoped view's rank badges show the Opportunity's global rank or a position recomputed within
  the filtered subset — a presentation detail, not a ranking-algorithm change.
- Any schema change (e.g., whether an `opportunities.search_id` column is actually needed, versus using existing
  relationships) — to be determined by the implementation audit, not pre-decided here.
- The ranking tie-break issue (§4.4) — explicitly deferred to its own future decision.

## 8. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, route, or service change; any change to
Search creation/processing, Discovery, Research, Opportunity creation, Company/Prospect deduplication, or
Opportunity/Score/Qualification persistence; any change to ranking dimensions, scores, or algorithms; any change
to B1's qualification presentation rules; any change to contact-unlock eligibility; database changes; UI
implementation; deployment, release, or production traffic of any kind; commit or push of any file.

**Next governance action:** none required to proceed with a read-only implementation-delta audit under this
decision's constraints. Actual implementation requires its own, separate, explicit Product Owner authorization.

## 9. Governance statement

This is a Product Owner product decision record only. It decides that the Client Finder results experience must
distinguish a Search-scoped default view (Opportunities belonging to the relevant Search, with unrelated
Searches' Opportunities excluded from that default) from a separate, explicit cumulative/all-time workspace
(historical Opportunities across all Searches, retained and accessible). It does not decide the navigation/UI
mechanism for either view, and explicitly excludes the ranking tie-break issue from its scope. It does not change
Search creation/processing, Discovery, Research, Opportunity creation, Company/Prospect deduplication, Opportunity
persistence, B1's qualification presentation, qualification logic, evidence thresholds, ranking dimensions/scores/
algorithms, or contact-unlock eligibility. No code, schema, migration, test, route, or service file is changed,
staged, committed, pushed, or deployed as a result of this record.
