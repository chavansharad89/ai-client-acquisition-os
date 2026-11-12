# Client Finder — Deterministic Opportunity Layer — Engineering Proposal

**Status: ENGINEERING PROPOSAL ONLY. IMPLEMENTATION NOT AUTHORIZED.**

This document proposes engineering designs for the deterministic opportunity-filtering stage authorized in principle by `CF-DISCOVERY-ARCH-001` (staged selective-AI architecture: `DISCOVERY → DETERMINISTIC OPPORTUNITY FILTERING → SELECTIVE AI RESEARCH/QUALIFICATION`). No code, configuration, dependency, or schema change has been made. Nothing below should be read as a requirement until a separate PO decision record authorizes it.

## Governing PO decisions (context, not restated as new authority)

`CF-DISCOVERY-ARCH-002-Q1` (no-website ≠ proof of absence, states must stay distinct) · `Q2` (reachability persistence required, count/window = engineering decision) · `Q3` (website-observable signals only; #24–#29 deferred) · `Q4` (investigate, don't integrate, a public-intent source for signal #30) · `Q5` (vague signals must decompose into objective sub-checks) · `Q6` (WHOIS/RDAP excluded from scope) · `S5` (category-specific thresholds allowed; no numeric weights/thresholds approved) · `S6` (deterministic stage may eliminate and rank; mechanism unapproved).

---

## 1. Audit of the current pipeline and insertion point

Traced end-to-end, with file:line citations (all paths repo-relative):

| Stage | Code | Behavior (OBSERVED) |
|---|---|---|
| Discovery | [`packages/core-discovery/src/googlePlacesClient.ts:52-168`](packages/core-discovery/src/googlePlacesClient.ts), [`googlePlacesProvider.ts:17-30`](packages/core-discovery/src/googlePlacesProvider.ts) | Calls Places `searchText` with field mask `places.displayName,places.websiteUri` only. No pagination (`pageSize`/`pageToken` never sent) — ≤20 raw candidates/search, already documented as a known limitation in `requirement/DISCOVERY_PROVIDER_SELECTION_AUDIT.md:101`. Transient errors (timeout/429/5xx) retried twice; permanent errors are not. Website-less candidates pass through unfiltered at this layer. |
| Candidate normalization | [`packages/core-discovery/src/normalize.ts:8-52`](packages/core-discovery/src/normalize.ts) | `normalizeDomain()` is the existing "deterministic identity key (PFR-10)". `normalizeCandidate()` returns `null` — **and the candidate is discarded, never persisted** — when `website` is falsy or the domain is unparsable (`normalize.ts:43-52`, called from [`service.ts:113-118`](packages/core-discovery/src/service.ts)). |
| Prospect creation | `service.ts:93-132` | Only candidates that survived normalization become Company/Prospect rows. **A confirmed-no-website candidate never becomes a Prospect today.** |
| Research | [`packages/core-research/src/researcher.ts:142-227`](packages/core-research/src/researcher.ts), using [`sourceDocumentProvider.ts`](packages/core-research/src/sourceDocumentProvider.ts) | One LLM call (`researchLead()`) per Prospect, against homepage-only text extracted via Readability. `sourceDocumentProvider.ts` already distinguishes transient (one retry) vs permanent fetch failure — a useful building block, not yet a persistence/repeated-check policy (see §4). |
| Target-customer match | [`packages/core-research/src/targetCustomerMatch.ts`](packages/core-research/src/targetCustomerMatch.ts) | Second LLM call, deterministically verified against source quotes, aggregated to a tri-state (`MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED`). |
| Qualification | `@acos/core-qualification-equivalence` (`rules.ts`), fed by `toObservedTargetCustomer()` | Not modified by this proposal. |
| Opportunity creation / ranking | [`packages/core-opportunity/src/service.ts:93-381`](packages/core-opportunity/src/service.ts) | `createOpportunityForOwner` is already deterministic (rule-based `suggestOffers()`, no LLM). `scoreOpportunityForOwner` already computes a numeric 0–100 score + `HIGH/MEDIUM/LOW` band via `@acos/core-acquisition`'s seven-factor `scoreProspect()` (`prospectScore.ts:40-48`, weights sum to 100). `rankOpportunities` is a pure sort over already-persisted scores. |

**Insertion point:** between *candidate normalization* and *research* — i.e. the deterministic layer should run on normalized candidates (or their would-be Prospect records) before either LLM call (`researcher.ts`, `targetCustomerMatch.ts`) fires, and its elimination/ranking output should be consulted by `createOpportunityForOwner`/the worker loop that currently calls `researchProspectForOwner` unconditionally.

**The current architecture cannot support `Q1` without a change.** `normalize.ts:43-52` discards any candidate with no website *today*, before a Prospect row ever exists. That is a direct structural conflict with `Q1` ("no website" must be preserved as a distinct, positive-signal candidate, not proof of absence). Implementing this proposal requires changing `normalizeCandidate()`'s discard behavior — this is flagged here as a structural dependency, not decided (see §8–§9).

---

## 2. Concrete signal definitions

All signals below are **website-observable** (`Q3`) and **objectively machine-testable** (`Q5` — no vague signal is proposed standalone). Each is tagged for its possible roles; none of these role-assignments are PO-approved (`S5`, `S6`).

### Website presence (see §3 for full state model)

| Signal | Evidence | Input | Algorithm | Output states | Confidence/false-positive notes | Cost | Repeat required? | Eliminate? | Rank? | Escalate? |
|---|---|---|---|---|---|---|---|---|---|---|
| `WEBSITE_ABSENT_CONFIRMED` | Places API response has no `websiteUri` field | Places response | `candidate.website == null` | present/absent | Places itself can be wrong/stale about a business having no listed site — this is "Places says no site," not "no site exists." Must not be treated as proof (`Q1`). | Free (already fetched) | No | No (per `Q1`, must not eliminate) | Yes — positive signal | Yes — immediate-escalation candidate (§6) |
| `WEBSITE_REACHABLE` | HTTP 2xx within timeout, readable body | Homepage fetch | Existing `sourceDocumentProvider` success path | reachable | Low false-positive (parked/placeholder pages can read as "reachable" — not solved here) | 1 fetch | No | No | Yes (enables all other checks below) | No, by itself |
| `WEBSITE_TEMPORARY_FAILURE` | Single transient fetch error (timeout/5xx/network) | Homepage fetch | Existing `SourceFetchTransportError` path, 1 retry already built in | transient | Single observation — cannot distinguish a blip from a dead site | 1–2 fetches | Yes, before escalating to "persistent" | No | No | No |
| `WEBSITE_PERSISTENT_UNREACHABLE` | Repeated transient/permanent failures across a time window | History of fetch outcomes | See §4 alternatives | persistent-unreachable | Risk: a slow/rate-limited site looks "unreachable" under an aggressive window | N fetches over window | **Yes — this is the signal §2/§4 is about** | Yes, candidate for elimination (with care — see §9) | Yes | Possibly (Q1-style: unreachable-but-real-business is still a lead) |
| `WEBSITE_STATUS_UNKNOWN_AMBIGUOUS` | Any state not yet resolved into the above (e.g. only 1 of N required checks done) | — | Default/pending state | ambiguous | By construction, never mis-signals — it's the "don't know yet" bucket | — | — | No | No | No — must not trigger escalation prematurely |

### Security

| Signal | Evidence | Algorithm | Output | False positives | Cost |
|---|---|---|---|---|---|
| `HTTPS_ENABLED` | Final resolved URL scheme after redirects is `https:` | Inspect response URL post-redirect | enabled/disabled | A site redirecting `http→https` only on first load but serving mixed content isn't caught — acceptable, this is a scheme check only | Free (same fetch) |
| `CERT_VALID` / `CERT_INVALID_OR_EXPIRED` | TLS handshake succeeds under default (non-permissive) validation | Explicit TLS validation distinct from a generic fetch failure (today's fetch already fails closed on bad certs, but doesn't *label* the reason) | valid/invalid/unknown | Self-signed certs on legitimately-run small-business sites are common — "invalid" here is evidence, not condemnation | 1 extra handshake if isolated from the main fetch |

### Mobile (objective only — no "poor mobile UX")

| Signal | Evidence | Algorithm | Output | Notes |
|---|---|---|---|---|
| `VIEWPORT_META_PRESENT` | `<meta name="viewport">` tag exists in raw HTML | String/DOM search on **raw HTML**, not Readability-extracted text | present/absent | **Architecture gap:** `sourceDocumentProvider.ts` currently discards raw HTML after Readability extraction (`extractText()`). This signal needs raw-HTML access — an architecture change (§8), not just a new check. |
| `RESPONSIVE_MEDIA_QUERY_PRESENT` | `@media` rule in inline `<style>` | Regex over raw HTML `<style>` blocks only (external CSS out of scope — extra fetch cost) | present/absent/not-evaluated | External stylesheets are common and this check would miss them — explicitly scoped to inline CSS only to avoid a second fetch per candidate |

### Performance (objective only — no "slow website")

| Signal | Evidence | Algorithm | Output | Notes |
|---|---|---|---|---|
| `FETCH_LATENCY_MS` | Wall-clock time of the existing homepage fetch | Timestamp before/after fetch call already made by `sourceDocumentProvider` | numeric ms | Zero marginal cost — purely instrumenting an existing call |
| `PAGE_WEIGHT_BYTES` | Bytes actually read, already bounded by `DEFAULT_MAX_BYTES = 2_000_000` (`sourceDocumentProvider.ts:64`) | Byte count from `readBodyBounded()` | numeric bytes | Zero marginal cost |

### Technical quality (objective only — no "poor HTML")

| Signal | Evidence | Algorithm | Output | Notes |
|---|---|---|---|---|
| `DOCTYPE_PRESENT` | Literal `<!DOCTYPE html>` (case-insensitive) at document start | String check on raw HTML | present/absent | Needs raw HTML (same gap as mobile) |
| `HTML_PARSE_ERROR_COUNT` | Count of parser errors from a tolerant HTML parser | Requires a parser that surfaces error counts (JSDOM, already a dependency via Readability, does not expose this cleanly) | integer count or not-evaluated | Possible new-dependency implication — flagged, not decided (§9) |

### SEO (concrete metadata checks only)

| Signal | Evidence | Algorithm | Output |
|---|---|---|---|
| `TITLE_TAG_PRESENT` / `TITLE_LENGTH` | `<title>` element | DOM query | present/absent + length |
| `META_DESCRIPTION_PRESENT` | `<meta name="description">` | DOM query | present/absent |
| `H1_COUNT` | Count of `<h1>` elements | DOM query | 0 / 1 / >1 |
| `CANONICAL_TAG_PRESENT` | `<link rel="canonical">` | DOM query | present/absent |

### Contact / conversion (objective only — no "poor conversion")

| Signal | Evidence | Algorithm | Output | Notes |
|---|---|---|---|---|
| `CONTACT_LINK_PRESENT` | An `<a>` whose text or `href` matches `/contact/i` | DOM query | present/absent | — |
| `PHONE_PATTERN_ON_HOMEPAGE` | A phone-shaped substring exists on the homepage | Presence-only boolean reuse of the existing phone regex pattern already used by K1 (`contactIdentifiers.ts`) — **boolean presence only, not value extraction/classification** | present/absent | Deliberately does *not* reuse K1's full classification pipeline; K1 is purpose-built for lead-unlock contact qualification and is documented read-only (§8) |
| `EMAIL_PATTERN_ON_HOMEPAGE` | Same, for email-shaped substrings | Same approach | present/absent | Same caveat |
| `FORM_ELEMENT_PRESENT` | `<form>` tag count > 0 | DOM query | present/absent | — |

Signals explicitly **not** proposed here because they cannot be made objective without PO-directed decomposition (`Q5`): anything resembling "poor mobile experience," "slow site," "low-quality HTML," "weak conversion path" as standalone signals. Business-activity signals (#24–#29) are out of scope per `Q3`. WHOIS/RDAP is out of scope per `Q6`. Signal #30 (public-intent source) is investigation-only per `Q4` and is not included as a production signal here.

---

## 3. No-website handling — five distinct states

| State | Meaning | How reached | Current architecture behavior | Proposed preservation |
|---|---|---|---|---|
| **A. Confirmed no website** | Places itself reports no `websiteUri` | `candidate.website == null` straight from discovery | **Discarded** — `normalize.ts:47`, never becomes a Prospect | Must become a Prospect (or equivalent record) carrying `WEBSITE_ABSENT_CONFIRMED` as a *positive* signal (`Q1`), not a discard reason |
| **B. Temporarily unreachable** | Website field present, single fetch attempt failed transiently | `sourceDocumentProvider` transient path | Today: research simply fails/returns empty for that attempt; no persistence model exists to distinguish this from C | Record as `WEBSITE_TEMPORARY_FAILURE`; do not escalate or eliminate off a single observation |
| **C. Persistently unreachable** | Website field present, repeated failures across a time window | New logic (§4) | **Does not exist today** — no repeated-check mechanism is implemented | Record as `WEBSITE_PERSISTENT_UNREACHABLE` only after the chosen §4 policy's criteria are met |
| **D. Exists but not yet analyzed** | Website field present, fetch not yet attempted or only partially attempted | Natural transient state before first fetch | Implicit, not named | Represent explicitly as `WEBSITE_STATUS_UNKNOWN_AMBIGUOUS` rather than silently treating as reachable or absent |
| **E. Unknown/ambiguous** | Any case not cleanly resolved into A–D (e.g. redirect loops, non-HTML content-type at a domain that otherwise resolves) | `sourceDocumentProvider`'s "permanent/unusable" bucket (non-5xx error, non-HTML content-type, body too large, extracted text < 200 chars) currently collapses several distinct causes into one `[]` result (`sourceDocumentProvider.ts:119-134`) | Collapsed today | Worth keeping distinct from C — "could not analyze" is not the same claim as "confirmed unreachable repeatedly" |

**Today's discard-and-recreate problem, explained:** a Google Places candidate with no website is discarded at `normalize.ts:47` before any Prospect exists — there is nothing to "preserve" because the record is never created. The future architecture must create a candidate/Prospect-equivalent record for state A immediately (it requires no network check at all — Places already told us), and must create one for states B/D/E as soon as the website field is present, deferring only the B→C transition until the §4 policy's evidence threshold is met.

---

## 4. Reachability persistence — alternatives (none selected)

| | Alt 1: Fixed schedule | Alt 2: Rolling window | Alt 3: Single + one confirmation |
|---|---|---|---|
| Checks | 3 fixed checks (e.g. immediate, +12h, +36h) | K failures out of last N observations spanning ≥T hours | 1 check now + 1 re-check after a fixed delay (e.g. 24h) |
| Declares "persistent" after | All 3 fail | Rolling threshold met (e.g. 3-of-5 over 72h) | 2-of-2 fail |
| Time-to-decision | ~36–48h | Variable, tends longer, more tolerant | ~24h (fastest) |
| Robustness to flakiness | Moderate | **Highest** — tolerates isolated recoveries | Lowest — one lucky recovery resets evidence entirely |
| Storage | Fits existing `research_signals` append-only pattern (`kind=WEBSITE`, one row per check, `observed_at`/`superseded_at`) | Same, but needs a window query over multiple non-superseded rows rather than "most recent" | Same, simplest query (last 2 rows) |
| Rate limiting | Self-imposed: never re-check the same domain inside its own schedule gaps | Self-imposed: cap checks/domain/day | Self-imposed: trivially low volume |
| Retry/backoff within a single check | Reuses `sourceDocumentProvider`'s existing single internal retry (500ms) unchanged | Same | Same |

All three alternatives can reuse the existing `research_signals` table (`packages/db/prisma/migrations/0016_research_signals/migration.sql`) without a new table, by writing one `WEBSITE`-kind signal row per check and reading the currently-active (`superseded_at IS NULL`) rows for a domain. A dedicated reachability-history table would be cleaner for high check volumes but is not required by any of these alternatives. **No alternative is selected here per the task's instruction; exact count/window remains a PO or engineering decision depending on whether it is treated as policy (PO) or implementation detail — flagged in §9.**

---

## 5. Scoring / ranking — three candidate architectures (none selected)

### Design A — Simple weighted score
Formula: `score = Σ(signal_i.points × present_i)`, single number, compared against one threshold. Mirrors the pattern already used by `@acos/core-acquisition`'s `scoreProspect()` (`prospectScore.ts:40-48`, seven weighted factors summing to 100).
- Strengths: simplest to implement; precedent already exists in this codebase for exactly this shape.
- Weaknesses: no PO-approved weights exist (`S5` explicitly withholds them); a single number obscures *why* a candidate scored high; several weak signals can sum past a threshold despite no single load-bearing problem (false-positive risk).
- Complexity: low. Expected AI-call reduction: ESTIMATED, depends entirely on unknown weight/threshold choices.

### Design B — Category-specific thresholds
Each category (presence, security, mobile, performance, technical, SEO, contact) is evaluated independently against its own pass/fail bar (`S5` explicitly authorizes different thresholds per category). Output is a vector of per-category pass/fail, not one number.
- Strengths: directly matches the one scoring-related PO authorization that exists (`S5`); more explainable; avoids conflating unrelated weaknesses.
- Weaknesses: still needs PO-approved thresholds per category (not yet given); a multi-dimensional output needs its own aggregation rule to produce a sortable escalation queue, reintroducing some of Design A's problem one level up.
- Complexity: medium. Expected AI-call reduction: ESTIMATED, likely similar order of magnitude to Design A but with a different false-positive profile.

### Design C — Two-stage: elimination gate + ranking
Stage 1 (binary, deterministic): "is this a plausible, evaluable local-business candidate or a confirmed-absence candidate" gate. Stage 2 (ranking, computed only for candidates that pass the gate): orders survivors for AI escalation, using either Design A's weighted sum or Design B's category vector as the ranking function.
- Strengths: matches `S6` precisely (deterministic stage both eliminates and ranks, as two separate steps); limits the blast radius of an aggressive composite score to ranking only, not elimination; aligns with the existing `core-opportunity/service.ts` split between `createOpportunityForOwner` (need detection) and `scoreOpportunityForOwner` (ranking) — this stage would slot in before the first, feed the second.
- Weaknesses: requires two sets of PO decisions instead of one (gate criteria *and* ranking formula); marginally more implementation surface.
- Complexity: medium-high. Expected AI-call reduction: ESTIMATED, likely the best worst-case protection against false elimination among the three, at the cost of needing more governance decisions up front.

No design is selected. Each requires PO-approved numeric values before it is implementable (`S5`).

---

## 6. AI escalation — alternatives (none selected)

| Mechanism | Cost | Recall | Lead quality | Scalability |
|---|---|---|---|---|
| Score threshold | Predictable per-candidate cost, unpredictable aggregate cost (depends how many candidates clear the bar) | Depends entirely on threshold choice — ESTIMATED risk of under/over-escalating | Consistent with the threshold's intent | Poor cost-ceiling guarantee at high candidate volume |
| Top-N per search | Deterministic cost ceiling per search (N × 2 LLM calls) | Can miss good candidates in a search with many strong candidates (capped), or waste calls on weak ones in a sparse search | Variable — a weak Top-N in a thin search still escalates | Best cost predictability |
| Score threshold + Top-N cap | Bounded worst case while preserving a quality floor | Better balance than either alone | Best of both, at the cost of two decisions instead of one | Good |
| Strong-signal immediate escalation | Unbounded by construction unless combined with a cap | Protects specific PO-flagged signals (e.g. `WEBSITE_ABSENT_CONFIRMED`, per `Q1`) from ever being buried by a generic threshold | High for the flagged signal type specifically | Needs a cap elsewhere to stay scalable |
| Category-specific escalation | Most complex to budget | Richest, most targeted | Potentially highest, if categories are well chosen | Hardest to govern (ties directly to Design B) |

All quantitative cost/recall effects above are **ESTIMATED**, not measured — no production candidate/signal distribution was available to this audit (see §7). No mechanism is selected.

---

## 7. Current LLM pipeline — quantified

**OBSERVED** (direct code citations):
- Exactly **2 LLM calls per Prospect** occur in the discovery→opportunity-creation path today: `researcher.ts:212` (`researchLead()`) and `targetCustomerMatch.ts:262` (`callTargetCustomerMatchModel()`), both wired per-prospect in `apps/worker/src/searchWorker/worker.ts:400-432`.
- Provider abstraction: `packages/core-research/src/researchModelFactory.ts:94-130`, supporting `anthropic | openai | gemini`. Default provider `anthropic` (`packages/config/src/env.ts:88`, `.env.example:59`). Default model when unset: `claude-opus-5` (`anthropicModel.ts:63`).
- Retry: `maxAttempts: 3, baseDelayMs: 1_000, maxDelayMs: 30_000` (`researcher.ts:142-145`), same skeleton reused in `targetCustomerMatch.ts:214`. An optional configured fallback provider/model pair exists (`fallbackResearchProvider.ts`, `.env.example:64-65`).
- No batching found in any of `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts`.
- **No deterministic filtering currently happens before these calls.** Every candidate that survives normalization (i.e. every candidate *with* a website) gets both LLM calls run, unconditionally, in the worker loop.
- Target-customer match occurs in the second of the two calls (`targetCustomerMatch.ts`), already deterministically verified and tri-state-aggregated — it is not itself an LLM-call-volume problem, but it is one of the two calls any deterministic pre-filter would be reducing exposure to.
- Candidate volume: no app-level cap in code; Google Places default returns ≤20 results/search (no `pageSize`/`pageToken` sent — `googlePlacesClient.ts`), documented as a known limitation in `requirement/DISCOVERY_PROVIDER_SELECTION_AUDIT.md:101`.

**ESTIMATED:** if a deterministic gate removed some fraction of candidates before both LLM calls, call volume would drop by roughly that same fraction (2 calls removed per eliminated candidate). The size of that fraction is unknown.

**UNKNOWN:** per-call dollar cost (no pricing constants exist in this repo), real production candidate volume per search, and the actual pass/fail rate any proposed deterministic check would see against the real website population — none of this data was found during the audit.

---

## 8. Data / architecture impact

**Files likely to change** (not modified by this proposal):
- [`packages/core-discovery/src/normalize.ts`](packages/core-discovery/src/normalize.ts) — must stop discarding no-website candidates outright (structural dependency identified in §1/§3).
- [`packages/core-discovery/src/service.ts`](packages/core-discovery/src/service.ts) — candidate flow and `skipped` counting logic tied to the above.
- [`packages/core-research/src/sourceDocumentProvider.ts`](packages/core-research/src/sourceDocumentProvider.ts) — several proposed signals (viewport meta, DOCTYPE, inline media queries) need **raw HTML**, which this file currently discards after Readability extraction. This is an architecture change, not a config change.
- [`packages/core-opportunity/src/service.ts`](packages/core-opportunity/src/service.ts) — natural insertion point for an elimination gate before `createOpportunityForOwner`, and a ranking input before/alongside `scoreOpportunityForOwner`.
- [`apps/worker/src/searchWorker/worker.ts`](apps/worker/src/searchWorker/worker.ts) — orchestration: deciding whether to call `researchProspectForOwner` at all is the actual AI-escalation decision point.
- Likely a new module (new file or new package, e.g. under `packages/core-research` or a new `packages/core-opportunity-signals`) to hold the deterministic checks themselves — not decided.

**Packages likely to change:** `core-discovery`, `core-research`, `core-opportunity`, possibly `core-acquisition` (if ranking extends/reuses `scoreProspect()`), `apps/worker`.

**Database changes:** likely a **new migration only if** a dedicated reachability-history table is chosen (§4); all three §4 alternatives can instead reuse the existing `research_signals` table (`kind=WEBSITE`, append-only, `observed_at`/`superseded_at` — the same pattern already used for every other signal) without schema change. A genuinely new signal `kind` (e.g. for technical/SEO signals that don't fit `WEBSITE`) would need an enum migration similar to the precedent in `0029_research_signal_intent_kinds/migration.sql`.

**Persisted vs read-time:** `research_signals` is already an append-only evidence ledger — every existing signal is persisted, none are computed ad hoc at read time. Persisting the new deterministic signals is consistent with that precedent and gives an audit trail; cheap signals derived from a fetch already being made (HTTPS, latency, byte size) could alternatively stay read-time-only if the PO prefers to avoid schema growth. Not decided.

**Interaction with `research_signals`:** likely needs new `kind`/signal-name values; whether that's a schema (enum) change or fits inside the existing `WEBSITE` kind is an open question.

**Interaction with existing opportunity scoring (`core-acquisition/prospectScore.ts`):** the new layer's output could feed into/replace/augment the existing `evidenceQuality` or `contactability` factors of the seven-factor model, or remain a fully separate pre-filter stage. Unresolved.

**Interaction with K1 (`contactIdentifiers.ts`):** K1 is documented read-only and purpose-built for lead-unlock contact qualification. The proposed `PHONE_PATTERN_ON_HOMEPAGE`/`EMAIL_PATTERN_ON_HOMEPAGE` signals should be **boolean presence checks only**, not reuse of K1's full classification — consistent with the existing precedent in `contactValueExtraction.ts`, which reuses K1 unmodified only for its specific lead-unlock purpose. Whether the deterministic layer reuses K1's regex directly (read-only) or defines its own lighter pattern is an engineering choice.

**Interaction with contact extraction (`contactValueExtraction.ts`):** no coupling required — that module operates post-research, on persisted signals, for lead-unlock eligibility; a separate concern from pre-research deterministic filtering.

**Interaction with the subscription/access system:** none required. The deterministic layer sits entirely upstream of opportunity creation and lead-unlock; `leadUnlockService.ts`'s boundary (active-subscription check + K1-qualifying-contact check at unlock time) is unaffected by anything proposed here.

---

## 9. Governance boundary

| Item | Engineering detail | Requires new PO decision | Existing PO authorization |
|---|---|---|---|
| Signal definitions (final list, exact algorithms) | Yes | Yes — final list needs sign-off per `Q5`'s decomposition requirement | `Q1`–`Q6`, `S5` set boundaries, not the concrete list |
| Retry/persistence policy (exact check count, time window) | Yes (the alternatives themselves) | Yes — the exact values | `Q2` authorizes the requirement, not the values |
| Weights | No | **Yes** | `S5` explicitly withholds |
| Thresholds | No | **Yes** | `S5` explicitly withholds |
| Ranking mechanism (Design A/B/C) | Partially | **Yes** | `S6` authorizes that the stage may rank, not how |
| Top-N / escalation rule | Partially | **Yes** | Not yet addressed by any PO decision |
| Storage mechanics (reuse `research_signals` vs new table) | Yes | No, if reusing the existing `WEBSITE` kind as-is | N/A |
| New `research_signal` kind/enum value, if needed | Yes (mechanics) | Possibly — if the new kind encodes policy rather than pure storage (akin to the `research_signal_intent_kinds` precedent) | N/A |
| Caching | Yes | No | N/A |
| Batching | Yes | No | N/A |
| Provider/model choice for any AI step that remains | Yes | No — governed by the existing `researchModelFactory` abstraction | Existing |
| Raw-HTML access in `sourceDocumentProvider` | Yes | No (engineering) | N/A |
| `normalize.ts` no-website discard behavior change | Yes | No, if purely a mechanical fix to already-decided `Q1` — but flag for PO awareness since it changes a discard point that has existed since PFR-10 | `Q1` already requires the outcome |
| Signal #30 public-intent source, production use | N/A | Yes, before any production integration | `Q4` authorizes investigation only |
| WHOIS/RDAP signals | N/A | Yes, to bring back into scope | `Q6` excludes |
| Business-activity signals #24–#29 | N/A | Yes, to bring into scope | `Q3` defers |

No engineering recommendation in this document is to be read as a requirement. Every "Yes" in the "Requires new PO decision" column above is unresolved.

---

## 10. Final recommendation

1. **Recommended engineering design:** Design C (§5, two-stage elimination gate + ranking) combined with Alt 2 (§4, rolling window) for reachability persistence, and a hybrid "strong-signal immediate escalation + score threshold/Top-N cap" (§6) so that `WEBSITE_ABSENT_CONFIRMED` (the signal `Q1` specifically protects) always reaches AI escalation regardless of its rank, while general escalation stays cost-bounded.
2. **Two alternative designs:** Design A (§5, simple weighted score) if the PO wants to govern fewer numeric decisions up front; Design B (§5, category-specific thresholds) if the PO wants maximal per-category explainability, at the cost of one threshold decision per category.
3. **Expected benefits:** fewer unconditional LLM calls on clearly-unsuitable candidates; no-website candidates preserved as opportunities instead of silently discarded today (closes the `Q1` conflict identified in §1); an auditable evidence trail consistent with the existing `research_signals` precedent; a clean split between elimination and ranking that mirrors the already-existing split between `createOpportunityForOwner` and `scoreOpportunityForOwner`.
4. **Main risks:** false elimination of a genuine opportunity from an overly strict gate; the proposal's central benefit (preserving no-website candidates) cannot be realized unless `normalize.ts`'s discard behavior changes in lockstep; added fetch volume/latency from repeated reachability checks; governance overhead from any new `research_signal` kind that encodes policy.
5. **Expected reduction in AI calls:** ESTIMATED only — no production candidate/signal distribution exists in this repo to quantify it; genuinely UNKNOWN until measured against real traffic.
6. **What must be decided by PO:** final signal list (post-`Q5` decomposition), weights/thresholds (`S5`), the concrete ranking/escalation mechanism (`S6`), the exact reachability check count/window (`Q2`), and any new `research_signal` kind that encodes policy rather than storage mechanics.
7. **What can remain engineering detail:** exact file/package layout, caching, batching, retry/backoff implementation details, the raw-HTML access refactor in `sourceDocumentProvider`, and whether storage reuses `research_signals` or a new table (pure mechanics).
8. **Whether a new governance record is required before implementation:** **Yes.** Weights/thresholds, the ranking/escalation mechanism, and the `normalize.ts` discard-behavior change are policy decisions, and none are authorized yet at the concrete level required to implement.

## 11. Forward cross-reference / partial supersession (added 2026-10-13)

`CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` (`CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md`) selects, at the architecture-mechanism level, the admission mechanism this document's §6 left as "none selected": a priority-ordered shared escalation cap — strong-signal bypass candidates admitted first, then remaining candidates in deterministic rank order, subject to a threshold-AND-Top-N gate, all drawing from one shared per-search cap. This **narrows but does not fully resolve** §5's Design A/B/C ranking-formula menu or §6's mechanism menu — the new record decides *admission*, not the underlying *ranking score* a candidate's rank position comes from, so §5's three designs remain open as candidate ranking formulas. §6–§7's cost/recall/call-volume figures remain ESTIMATED/UNKNOWN and are unaffected. The §1/§3 structural conflict (`normalize.ts:43-52` discarding no-website candidates before a Prospect exists) is unchanged by the new record and remains explicitly out of scope for it (per that record's §12). Numeric values (Top-N, threshold, budget, cache TTL/window per §4) remain open exactly as this document already states.

**IMPLEMENTATION NOT AUTHORIZED.**
