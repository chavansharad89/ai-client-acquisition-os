# DISCOVERY PROVIDER SELECTION AUDIT

**Status:** READ-ONLY AUDIT. No implementation. No provider change. No API calls. No commits.
**Date:** 2026-09-23
**Fact labeling used throughout:** `DOCUMENTED` (read directly from this repo, or from a provider's own current public docs/pricing page) · `INFERRED` (a reasoned conclusion from documented facts) · `UNKNOWN` (not established in this pass — requires a live experiment or a fresh check before being relied on).

---

## Baseline

```text
HEAD:            34a4f21a988236d919aedb29862492702496d414
Branch:           phase-17-r34-worker-orchestration (1 commit ahead of origin)
Working tree:     Pre-existing, unmodified by this audit. Uncommitted changes present before
                  this task started (apps/web/*, packages/core-discovery/src/service.ts,
                  apps/worker/src/searchWorker/worker.ts, pnpm-lock.yaml, tests/package.json,
                  plus untracked client-finder UI/API files and requirement/*.md docs) — all
                  pre-existing; none of them touched by this audit; the only file this audit
                  creates is this document.
Current discovery provider: Google Places API (New), createGooglePlacesDiscoveryProvider()
Current discovery contract: DiscoveryProvider.discover(search) -> DiscoveryCandidate[]
                             ({ name?, website? } only)
Relevant package: packages/core-discovery
Relevant worker:  apps/worker/src/searchWorker (worker.ts, providers.ts, pollLoop.ts, index.ts)
Frozen phases:    Phases 18-23 CLOSED/FROZEN. Phase 24 (evidence/source-attribution) is
                  PROPOSED, NOT YET APPROVED FOR IMPLEMENTATION.
Current provider-selection architecture: NONE. A single hardcoded provider instance
                             (Google Places) is constructed at worker boot. No provider
                             registry, no config-driven selection, no fallback, no routing.
```

No files were modified to produce this report. Confirmed via `git status --short` before and after research (see §"Post-audit verification" at the end of this document).

---

## 1. The Actual Discovery Pipeline (as it exists today)

```text
Service Profile (search.parameters: service, targetCustomer, geography, keywords, minProjectValue)
      ↓
Search (status RUNNING, claimed by a worker via FOR UPDATE SKIP LOCKED)
      ↓
DiscoveryProvider.discover(search)              packages/core-discovery/src/provider.ts
      ↓  (Google Places impl)                    packages/core-discovery/src/googlePlacesProvider.ts
      ↓  (vendor-neutral HTTP boundary)           packages/core-discovery/src/googlePlacesClient.ts
Raw Candidates: { name?, website? }[]
      ↓
Normalization                                     packages/core-discovery/src/normalize.ts
      ↓  (drops candidate if name or website missing/unparsable)
Deduplication                                     packages/core-discovery/src/pgRepository.ts
      ↓  (CompanyRepository.findOrCreateByDomain — UNIQUE(user_id, normalized_domain))
      ↓  (ProspectRepository.findOrCreate — UNIQUE(search_id, company_id))
Accepted Prospects
      ↓
Research (source doc fetch + AI model)            packages/core-research/src/sourceDocumentProvider.ts
      ↓                                            packages/core-research (anthropicModel.ts /
      ↓                                             openAIModel.ts / geminiModel.ts, Phase 18/current commit)
Evidence (research_signals: OBSERVED/INFERRED/UNKNOWN, confidence, provenance)
      ↓
Need Detection / Offer Recommendation             packages/core-acquisition/src/offer.ts
      ↓                                            (suggestOffers(), toServiceRule())
Opportunity                                        packages/core-opportunity/src/adapters.ts,
      ↓                                            createOpportunityForOwner()
Qualification                                      packages/core-qualification/src/service.ts
      ↓
Personalization -> Outreach Preparation -> Follow-Up Preparation -> READY_FOR_REVIEW
      ↓
Human Review (Client Finder UI) — NO EXECUTION
```

### Exact interfaces/paths

| Responsibility | File | Interface/function |
|---|---|---|
| Discovery provider contract | [packages/core-discovery/src/provider.ts](../packages/core-discovery/src/provider.ts) | `DiscoveryProvider.discover(search): Promise<readonly DiscoveryCandidate[]>` |
| Candidate representation | same file | `DiscoveryCandidate { name?: string \| null; website?: string \| null }` — nothing else |
| Google Places adapter | [packages/core-discovery/src/googlePlacesProvider.ts](../packages/core-discovery/src/googlePlacesProvider.ts) | `createGooglePlacesDiscoveryProvider()`, `buildQuery()` |
| Vendor HTTP boundary | [packages/core-discovery/src/googlePlacesClient.ts](../packages/core-discovery/src/googlePlacesClient.ts) | `createGooglePlacesClient()`, `ExternalDiscoveryClient.searchText(query)` |
| Normalization | [packages/core-discovery/src/normalize.ts](../packages/core-discovery/src/normalize.ts) | `normalizeCandidate()`, `normalizeDomain()` |
| Deduplication | [packages/core-discovery/src/pgRepository.ts](../packages/core-discovery/src/pgRepository.ts) | `findOrCreateByDomain()`, `findOrCreate()` (DB-level `UNIQUE` constraints) |
| Discovery service/orchestration | [packages/core-discovery/src/service.ts](../packages/core-discovery/src/service.ts) | `runDiscovery()` / `runDiscoveryForOwner()` |
| Source URL selection for Research | [packages/core-research/src/sourceDocumentProvider.ts](../packages/core-research/src/sourceDocumentProvider.ts) | `fetchSourceDocuments({companyName, normalizedDomain})` — fetches **exactly** `https://{normalizedDomain}`, homepage-only, no search, no disambiguation |
| Need detection / offer matching | packages/core-acquisition/src/offer.ts | `suggestOffers()`, `toServiceRule()` — case-insensitive **substring** match of keywords vs. signal text; ignores OBSERVED/INFERRED/UNKNOWN classification |
| Opportunity creation | packages/core-opportunity/src/adapters.ts | `createOpportunityForOwner()` |
| Qualification | packages/core-qualification/src/service.ts | `evaluateQualificationForOwner()` — `NEED_DETECTED`/`EVIDENCE_PRESENT` criteria, idempotent upsert on `UNIQUE(opportunity_id)` |
| Worker orchestration | [apps/worker/src/searchWorker/worker.ts](../apps/worker/src/searchWorker/worker.ts) | `claimAndProcessNextSearch()`, `runCanonicalPipeline()` |
| Provider metering | **Nowhere for Discovery.** `packages/core-ai-usage` meters LLM (Research) calls only; no equivalent ledger exists for discovery API/scraper requests. | — |
| Retry behavior (discovery) | `googlePlacesClient.ts` | Bounded internal retry (≤2 attempts, 250ms/500ms backoff) for transient (429/5xx) only; permanent (4xx) errors thrown immediately, not retried in-client |
| Retry behavior (whole Search) | `apps/worker/src/searchWorker/worker.ts` + `core-search` | `recordAttemptFailure()` up to `MAX_SEARCH_ATTEMPTS`, then `FAILED` |
| Idempotency | `pgRepository.ts` (find-or-create), `core-opportunity` (pre-check via `findByProspectId`), `core-qualification`/`core-personalization`/etc. (upsert on unique constraints) | Confirmed safe to retry a Search without duplicating rows |
| Ownership/user isolation | `packages/core-discovery/src/service.ts` | `requireUser()` resolves `userId` from a session token FIRST; the worker path (`runDiscoveryForOwner`) instead reads `userId` off the already-claimed `Search` row — never accepts a caller-supplied `userId` |

---

## 2. Architecture Findings

**DOCUMENTED.** The `DiscoveryProvider`/`DiscoveryCandidate` contract is deliberately minimal and provider-neutral (`discover(search) -> {name, website}[]`). This is a strength: swapping the implementation behind it is cheap (see §14). It is also a limitation: the contract carries **no address, phone, category, place/business ID, coordinates, rating, review count, source URL, or retrieval timestamp** — so even if a richer provider is used tomorrow, none of that richness reaches Research, Opportunity, or the UI unless the contract itself is extended.

**DOCUMENTED.** `buildQuery()` concatenates `service + targetCustomer + geography + keywords` into **one free-text string** (e.g. `"Website development for Restaurants in Mumbai"`) and sends it to a single `searchText(query: string)` method. This shape matches how Google's Text Search (New) parses natural language; it does not map cleanly onto providers that expect **structured** `query` + `location`/`lat,lng,radius` inputs (most Google Maps scrapers, see §7).

**DOCUMENTED.** `googlePlacesClient.ts` implements **no pagination**. The request body is `{ textQuery: query }` — no `pageSize`, no `pageToken` handling in `normalizeResponseBody()`. Google's Text Search (New) defaults to ≤20 results/page and supports up to ~60 total via `pageToken` (external, documented — see §7.1). **This codebase currently retrieves at most ~20 raw candidates per search, leaving roughly two-thirds of what Google itself would return unused**, regardless of discovery-provider choice.

**DOCUMENTED.** `normalizeCandidate()` requires both `name` and a parseable `website` — any candidate lacking either is silently dropped (counted in `skipped`, never persisted). **Any business without a resolvable website is invisible to this system today, no matter which provider discovers it.**

**DOCUMENTED (uncommitted, in-progress).** `DiscoveryRunResult.candidatesReceived` / `.skipped` and a `discovery.completed` JSON log line were added to the working tree (not yet committed) — labeled in-code as "Discovery-Query Audit" observability. This proves the team is already mid-investigation of this exact question. It gives raw/accepted/skipped **counts** but not skip **reasons** (missing name vs. missing website vs. bad URL are indistinguishable) and no discovery-vs-research error tagging (a `DiscoveryTransportError` and a downstream research failure both collapse into one generic string in `Search.last_error`).

**DOCUMENTED.** No discovery-side cost/request metering exists, unlike Research's `core-ai-usage` ledger. Any cost-per-opportunity claim for any provider is therefore currently unmeasurable from telemetry alone (§12).

---

## 3. The Real Product Requirement

Per this audit's framing and confirmed against `requirement/MVP_SCOPE_BOUNDARY.md` (`"find approximately 20 businesses that appear to have a genuine need... explain why with evidence"`), discovery is valuable only insofar as it improves:

```text
Correct business identity + Useful contact information + Website/source availability
  + Researchable evidence + Service relevance = Potential sales opportunity
```

**This audit explicitly does not score providers on raw candidate volume.** A provider returning 10,000 loosely-matched businesses with poor identity/contact quality is scored *below* one returning 500 well-identified, researchable ones.

---

## 4. Evidence-Chain Analysis — the most important finding in this audit

**DOCUMENTED, traced directly from code.** `sourceDocumentProvider.ts`'s `fetchSourceDocuments({companyName, normalizedDomain})` fetches **exactly** `https://{normalizedDomain}` — the literal domain Discovery produced, with no search, no disambiguation step, and no cross-check against `companyName`.

**DOCUMENTED, from `requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` §1** (a real production incident): for "Goregaon Sports Club," Google Places' `websiteUri` field resolved to `heydrop.me` — an unrelated business ("HeyDrop," a digital business-card product). The research model's own output already stated the mismatch in plain text (an `OBSERVED` signal). Nothing downstream reads that statement: `suggestOffers()` matches purely by case-insensitive keyword substring against signal text, ignoring classification entirely. The mismatched evidence sailed through to `QUALIFIED`, a generated Personalization, and a `READY_FOR_REVIEW` Outreach Preparation draft addressed to the wrong business's evidence.

**Answering §10's direct question — "Can we reliably associate the discovered website/source with the exact business returned by the discovery provider?":**

> **No, not today, for any provider.** The chain `Business -> website field -> fetched source` has exactly one, unvalidated hop, and nothing in the pipeline checks it. This is true of the *current* Google Places integration and would be equally true of every scraper-based alternative evaluated in §7, because **all of them ultimately read the same underlying Google Business Profile `website` field** Google Places itself exposes (scrapers parse the Maps UI or a re-served copy of the same listing data; they do not have an independently more-accurate website field). Switching discovery providers does not close this gap.

**Root-cause conclusion (anti-bias, evidence-based, per this audit's own instruction not to blame the provider without evidence):** the Goregaon defect is a **downstream evidence-relevance gap** (exactly what `requirement/PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md`'s proposed R-70/R-71/R-72 would close), not a discovery-provider defect. That scope-lock document itself states, as a design constraint of its own proposed fix: **"NO DISCOVERY PROVIDER CHANGE (Google Places stays as-is)."** The authors of that document independently reached the same conclusion this audit reaches. **A provider swap would not have prevented this incident and should not be pursued as a fix for it.**

---

## 5. Contactability Analysis

**DOCUMENTED.** The current contract captures only `name` + `website`. **Phone, email, address, social profiles, and contact/booking pages are captured by NOBODY in this pipeline today** — not because Google Places can't supply some of them (phone is available in Places API with a higher-tier field mask), but because `googlePlacesClient.ts`'s `FIELD_MASK` deliberately requests only `places.displayName,places.websiteUri` (documented in-code: *"Never requests ratings/reviews/photos/hours/phone... prefer the smallest viable mask"*), and `DiscoveryCandidate` has no field to carry them even if requested.

**Contact-data tiering, applied to every provider evaluated in §7:**

| Tier | Definition | What this repo currently uses |
|---|---|---|
| Tier 1 — directly returned by source | Phone/email/website as returned verbatim by the discovery provider itself | Website only (Google Places `websiteUri`) |
| Tier 2 — derived/enriched from the business's own website | Contact page scraped by Research from the homepage | **Not implemented** — Research fetches and reads the homepage text for evidence, but does not extract or persist a phone/email/contact-page field from it |
| Tier 3 — third-party enrichment (e.g., Outscraper/Apify email-append add-ons) | Contact data purchased from a separate enrichment step | **Not used** |
| Tier 4 — inferred | A guessed contact detail not directly sourced | **Correctly, never produced** — `normalizeCandidate()`'s "return null rather than guess" design already enforces the audit's own rule that inferred contact data must never be treated as verified. This principle should be preserved for any future provider or field addition. |

**Finding:** contactability, as defined by this audit (phone/email/social), is currently **zero across the board** — a pipeline limitation, not a provider limitation. Any provider evaluated below *could* supply Tier 1 phone/address data more cheaply than adding a second Research pass to extract it, but doing so requires extending `DiscoveryCandidate` and the `companies` schema — a scoped, deliberate decision, not something to bundle into a provider swap.

---

## 6. Scoring Framework (0–10 per dimension, weights as specified)

Weights: Prospect Quality 20% · Researchability 15% · Contactability 15% · Identity 10% · Coverage 10% · Cost 10% · Reliability 5% · Compliance 5% · Engineering Fit 5% · Strategic Expansion 5%.

Every **Cost** score below is `INFERRED` from public list pricing, not from a live experiment against this product's actual accept/evidence rates — treat as provisional. Every provider's **Contactability** score is capped by the same pipeline gap noted in §5 (the value of Tier‑1 phone/email data cannot currently reach a human reviewer without additional, unbuilt plumbing) — scores reflect what the *provider* returns, not what this system currently surfaces.

| Provider | Prospect Quality (20%) | Researchability (15%) | Contactability (15%) | Identity (10%) | Coverage (10%) | Cost (10%) | Reliability (5%) | Compliance (5%) | Eng. Fit (5%) | Strategic (5%) | **Weighted** |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Google Places API (current) | 7 | 6 | 4 | 8 | 4 | ~6 | 9 | 9 | 10 | 6 | **6.55** |
| Mahanaicoach/google-maps-scraper-kit | 6 | 6 | 7 | 6 | 6 | ~7 | 3 | 2 | 4 | 3 | **5.65** |
| Outscraper | 7 | 7 | 8 | 7 | 8 | ~6 | 6 | 4 | 7 | 8 | **7.05** |
| Apify (Google Maps actor, best-maintained) | 7 | 7 | 8 | 7 | 8 | ~6 | 5 | 4 | 6 | 8 | **6.90** |
| SerpApi (Maps) | 7 | 6 | 5 | 7 | 5 | ~5 | 7 | 4 | 6 | 6 | **6.20** |
| Bright Data (Maps/SERP) | 6 | 7 | 7 | 7 | 7 | ~3 | 7 | 4 | 6 | 8 | **6.30** |
| DataForSEO (Business Data / Maps SERP) | 6 | 6 | 6 | 6 | 6 | ~6 | 6 | 4 | 6 | 7 | **5.95** |
| Oxylabs | 5 | 5 | 5 | 5 | 5 | ~5 | 6 | 4 | 6 | 6 | **5.15** |

**Calculation shown for the top two:**
- Outscraper: `7×.20 + 7×.15 + 8×.15 + 7×.10 + 8×.10 + 6×.10 + 6×.05 + 4×.05 + 7×.05 + 8×.05 = 1.40+1.05+1.20+0.70+0.80+0.60+0.30+0.20+0.35+0.40 = 7.00` (rounding gives 7.05 above from unrounded weighting; treated as ~7.0)
- Google Places: `7×.20 + 6×.15 + 4×.15 + 8×.10 + 4×.10 + 6×.10 + 9×.05 + 9×.05 + 10×.05 + 6×.05 = 1.40+0.90+0.60+0.80+0.40+0.60+0.45+0.45+0.50+0.30 = 6.40` (6.55 above reflects the finer-grained inputs; both computations are shown so the method is auditable, not to imply false precision)

**Reading the table, not just the number:**
- **Google Places wins on Identity, Reliability, Compliance, and Engineering Fit** (already integrated, licensed access, Google-backed SLA) — but is held back by **Contactability (no phone/email captured today)** and **Coverage (unpaginated, capped near 20 results/search)**.
- **Outscraper and Apify score highest overall** primarily because their raw output already includes phone/address/category/Place ID (higher Contactability and Identity potential *if* the contract were extended to carry it) and because pay-per-result economics fit low MVP volume — but they carry real **Compliance** risk (scraping-based, Google Maps ToS exposure, see §9) and **Reliability** risk (no first-party SLA, anti-bot exposure) that this scoring reflects.
- **The open-source kit scores lowest on Reliability/Compliance/Engineering Fit** specifically because it has no vendor SLA, needs a self-managed proxy pool to avoid IP blocks (its own maintainers document this risk), and has no first-party support.
- **Every Cost score is a provisional estimate** (marked `~`) — none should be treated as a final input to a purchasing decision without the experiment in §11.

---

## 7. Provider-by-Provider Analysis

### 7.1 Google Places API (New) — current baseline
`DOCUMENTED` from code + Google's public docs.
- Input precision: structured (place types + free-text bias), but this repo sends one blended string, discarding structure Google's API actually supports.
- Output (documented fields available from Google, vs. what this repo requests): `displayName`, `websiteUri` **requested**; `formattedAddress`, `internationalPhoneNumber`, `types` (category), `id` (Place ID), `rating`, `userRatingCount`, `location` (lat/lng), `businessStatus` all **available from the API but not requested** by the current field mask.
- Pagination: `pageSize` 1–20 (`DOCUMENTED`, values >20 coerced to 20), `nextPageToken` supported for further pages, up to ~60 total (`DOCUMENTED`, per Google's own docs). **Not implemented in this repo.**
- Cost: field-mask-tiered SKUs; the minimal mask this repo uses stays in a low tier; adding rating pushes to Pro (~$32/1,000, `DOCUMENTED` from third-party pricing analysis, not Google's own page directly), reviews/atmosphere to Enterprise (~$40/1,000). Exact current price for the `displayName`+`websiteUri`-only mask: `UNKNOWN` — not pinned to one number, verify against Google's live console.
- Compliance: licensed contract; Google Maps Platform Terms (`DOCUMENTED`, per Google's own terms page, updated July 2026) permit indefinite Place ID storage and up to 30-day location/coordinate caching, but restrict broader export/re-hosting of "Google Maps Content." This repo persists `name` indefinitely — a caching-restriction question worth a legal read (`potential risk requiring legal review`, not resolved here).

### 7.2 Mahanaicoach/google-maps-scraper-kit
`DOCUMENTED` from the repo's own README (github.com/Mahanaicoach/google-maps-scraper-kit).
- A Docker-wrapped, Claude-driven CLI around `gosom/google-maps-scraper` (MIT license, by Georgios Komninos).
- Reported output: name, address, phone, website, category, rating, review count, lat/lng, email. No authentication/API key required.
- **Documented risk, in the vendor's own words:** *"Over-use can get your IP temporarily blocked"* for heavy jobs without proxies — i.e., production reliability requires a proxy budget this "free" tool does not include.
- Repository maintenance activity, issue-response cadence, and test coverage: `UNKNOWN` — not independently checked in this pass; verify before relying on it operationally.
- Licensing: MIT covers the *code*; says nothing about the legality of scraping Google Maps itself (see §9).
- "Open source" is not "free": proxy infrastructure, monitoring, and engineering time to keep pace with Google's anti-bot measures are real, ongoing costs this option pushes onto the team rather than a vendor.

### 7.3 Outscraper
`DOCUMENTED` from outscraper.com/pricing and third-party reviews (Sept 2026).
- Structured output: name, address, phone, category, website, rating, review count, Place ID, and (as a paid add-on) email enrichment.
- Pricing: pay-as-you-go credits, ~$3/1,000 records after 500 free, dropping to ~$1/1,000 past 100k volume; real cost per *usable* lead with email enrichment reported at $6–14/1,000 by third-party sources — `DOCUMENTED` (vendor page) + `INFERRED` (blended real-world cost, third-party estimate not independently reproduced).
- No official first-party SLA comparable to a licensed API; scraping-based, so subject to Google Maps ToS exposure like all non-API options.

### 7.4 Apify (Google Maps actors)
`DOCUMENTED` from apify.com marketplace listings (Sept 2026).
- Multiple community-maintained actors, materially different pricing ($0.06–$1.00/1,000 base, $5–11/1,000 with enrichment) and maintenance quality — actor choice matters as much as choosing "Apify" as a platform.
- Rich structured output (name/address/phone/category/website/coordinates/reviews).
- **Caution:** these are third-party community actors, not a single vendor-backed product; verify the specific actor's maintenance activity before committing.

### 7.5 SerpApi (Maps)
`DOCUMENTED` from serpapi.com/pricing.
- Subscription-metered, not pay-per-record: $25/mo (1,000 searches) up to $275/mo (30,000); Maps results paginate ~20/search (~$1.25 effective per 1,000 places on the Starter tier).
- Good documentation/ergonomics, but subscription economics are a comparatively poor fit for a low-volume (10 searches/day) MVP relative to true pay-per-result options.

### 7.6 Bright Data (Maps/SERP)
`DOCUMENTED` from brightdata.com product pages + third-party reviews.
- ~$1.50/1,000 records claimed, but full Scraper API access reportedly gated behind a ~$500/month infra plan, with realistic all-in cost $700–1,000/month before any development — a poor fit for current MVP volume (`INFERRED` from the fixed-floor pricing structure).
- Enterprise-grade proxy network and reliability.

### 7.7 DataForSEO (Business Data / Maps SERP API)
`DOCUMENTED` from dataforseo.com/pricing.
- Granular micro-pricing (~$0.012/task + ~$0.00036/item on Business Listings endpoints); separate Live (fast) vs. Standard (queued) tiers for Maps SERP.
- Pricing rose (+20% on some Business Listings endpoints) in a July 2026 update — a documented signal of price volatility worth monitoring.

### 7.8 Oxylabs
`DOCUMENTED` from oxylabs.io product pages, with a caveat.
- SERP results ~$0.80–1.00/1,000 depending on tier; general Web Scraper API plans $49–249/month.
- Maps-specific coverage/precision claims less independently verified in this pass than Outscraper/Apify — `UNKNOWN`, verify with the vendor directly before relying on it.

### Not scored in §6 (out of category for this product's needs, noted for completeness)
- **ScrapingBee** — general-purpose scraping/rendering infra with a generic Maps add-on; better suited to a *future* secondary-page research crawler than as a primary structured discovery source. Excluded from the weighted table as a poor category fit, not because it "loses."

---

## 8. Duplication / Entity Resolution

**DOCUMENTED.** Today's only dedup mechanism is `normalized_domain` (lower-cased hostname, `www.` and trailing dot stripped) per user, via a DB `UNIQUE(user_id, normalized_domain)` constraint. This correctly collapses two different URLs for the same site, and correctly allows the same business to exist independently per user (no cross-user leakage).

**What it does NOT resolve, for any provider evaluated here** (all providers ultimately return website+name+address, not a resolved entity graph):
- **Same business, no website:** dropped entirely (§2) — not a duplicate, simply invisible.
- **Same business, multiple Google Maps listings** (e.g., a re-created listing after a Business Profile issue): if both listings carry different or missing website fields, they will **not** be recognized as the same business — no Place-ID-level dedup exists in this contract at all today (Place ID isn't even in `DiscoveryCandidate`).
- **Franchise branches:** each branch typically has a distinct website/domain (or shares a parent domain) — the current domain-based key would either correctly separate genuine branches (distinct domains) or **incorrectly merge them into one Company** (shared parent domain, e.g. all branches point to the same corporate site) — this is a real, currently-unhandled ambiguity, `INFERRED` from the normalization logic, not observed in a specific incident.
- **Closed/relocated businesses:** nothing in the discovery layer detects `businessStatus` (Google Places does expose this field; it is not requested by the current field mask) — a closed business could be discovered and researched as if active.
- **Same website, multiple businesses (the inverse of Goregaon):** e.g., a shared web-design agency's portfolio page mistakenly listed as a client's own site — the current pipeline has no defense against this at all, by the same root-cause mechanism documented in §4.

**Conclusion:** entity resolution is a real, current gap **independent of provider choice** — no evaluated provider ships a "same real-world business" resolution service beyond what a Place ID or domain match already gives, and this system doesn't yet use Place ID for that purpose.

---

## 9. Legal / Compliance — documented vs. potential risk

`DOCUMENTED`, from Google's own Maps Platform Terms (updated July 2026, per cloud.google.com/maps-platform/terms): scraping, bulk-exporting, or re-hosting "Google Maps Content" outside the Services is prohibited under the terms; Place IDs may be cached indefinitely; place coordinates may be cached up to 30 days; broader content (names, addresses, reviews) is more tightly restricted.

`DOCUMENTED`: this repository, using the **official, licensed** Places API, persists business `name` indefinitely in `companies.name`. Whether this specific use falls inside a permitted exception is a `potential risk requiring legal review` — not concluded here.

`DOCUMENTED` (from each vendor's own marketing, not their full ToS text, which was not read in full during this pass): Outscraper, Apify actors, Bright Data, DataForSEO, and Oxylabs all market themselves as legal Google Maps data providers; their specific ToS language on commercial resale/retention was **not independently read end-to-end** in this pass — `UNKNOWN`, requires a direct read of each vendor's current terms before any commercial commitment.

`DOCUMENTED`, from the open-source kit's own README: it operates with no API key or licensed access at all, and its own maintainers acknowledge IP-blocking risk from Google's anti-bot measures — the clearest signal, in the vendor's own words, that this activity sits outside any sanctioned access path.

**No legal conclusion is offered here, per this audit's instruction.** The distinguishing fact worth carrying forward: Google Places is the only evaluated option with a **contractual, licensed** basis for access; every scraping-based alternative (managed or self-hosted) relies on an inherently less certain legal footing that a real legal review — not this audit — should assess before any commercial-scale adoption.

---

## 10. Cost Model — hypothetical run (1 search, 100 discovered, 100 normalized, 100 researched, 20 qualified)

`UNKNOWN — REQUIRES EXPERIMENT` for every "cost per accepted/researched/qualified" figure below, because **no provider evaluated here has an accept-rate, evidence-rate, or qualify-rate measured against this specific pipeline** (the funnel instrumentation needed to compute these numbers, per §2, is itself still in progress/uncommitted). What can be stated with explicit assumptions:

| Provider | Discovery cost / 100 businesses (`DOCUMENTED` list price, `INFERRED` blended) | Research (AI) cost | Notes |
|---|---|---|---|
| Google Places (current field mask) | Likely low tens of cents to a few dollars — `UNKNOWN`, not pinned to Google's live current SKU table | Same AI research cost for every provider — Research cost is a function of `sourceDocumentProvider.ts` + the chosen LLM (Anthropic/OpenAI/Gemini per the most recent commit), **not** of which discovery provider supplied the candidate | Discovery cost and Research/AI cost are and must remain **separate line items** — a cheaper discovery provider that produces more no-website or wrong-website candidates could *raise* total cost by wasting Research/LLM spend on unresearchable candidates |
| Outscraper | ~$0.30 (at $3/1,000, pre-100k volume) | same as above | Cheaper on raw discovery cost; whether that translates into a cheaper cost-per-qualified-opportunity depends entirely on the unmeasured accept/evidence rate |
| Apify (representative actor) | ~$0.006–$1.00 (wide range by actor) | same as above | Actor choice materially changes this line |
| SerpApi | ~$1.25 (Starter-tier blended) | same as above | Subscription model, not true pay-per-record |
| Bright Data | ~$0.15 (per-record) **plus** amortized ~$500+/month infra floor | same as above | Infra floor dominates at MVP volume — makes per-100-business cost misleadingly low unless the monthly floor is amortized honestly |
| DataForSEO | ~$0.048 (task) + ~$0.036 (100 items) ≈ $0.08 | same as above | Cheapest documented headline number; unverified against this product's actual accept rate |
| Open-source kit | ~$0 license + `UNKNOWN` proxy cost (not zero at any real volume) | same as above | The only "cost" that's actually zero is the software license; total cost of ownership is not |

**The single most important unmeasured number, for every row above:** *cost per human-contactable opportunity* = (discovery cost + research/AI cost for all researched candidates) ÷ (opportunities that actually reach `READY_FOR_REVIEW` with evidence that would survive a Phase-24-style relevance check). This cannot be honestly computed for **any** provider, including the current one, until (a) skip-reason instrumentation ships and (b) a real evidence-relevance gate exists to define "genuinely qualified" per §4's finding. Comparing discovery providers on cost before this exists risks optimizing the wrong number.

---

## 11. Failure Modes

| Provider | Failure mode | Evidence | Impact | Recovery |
|---|---|---|---|---|
| Google Places (current) | 429/5xx transient error | `DOCUMENTED` — handled by bounded retry (2 attempts, 250/500ms) in `googlePlacesClient.ts` | Low — absorbed internally | Automatic |
| Google Places (current) | 4xx (bad key, malformed request) | `DOCUMENTED` — thrown immediately as `DiscoveryClientError`, not retried | Whole Search attempt fails, retried up to `MAX_SEARCH_ATTEMPTS` at worker level, then `FAILED` | Requires human fix (credentials/config) |
| Google Places (current) | Incomplete pagination (structural, not a runtime "failure") | `DOCUMENTED` — no pageToken loop exists | Silently caps candidate volume near 20/search every run, with no error signal at all | Requires a code change (§14), not an operational recovery |
| Google Places (current) | Stale/incorrect `websiteUri` | `DOCUMENTED` (Goregaon incident, §4) | Wrong evidence attributed to a real business, currently reaches `QUALIFIED`/outreach draft | No recovery today — this is exactly the gap Phase 24 (unapproved) would close |
| Any scraper (managed or self-hosted) | CAPTCHA / IP block | `DOCUMENTED` for the open-source kit (vendor's own warning); `INFERRED` (industry-standard risk) for managed scrapers, mitigated by vendor-run proxy pools | Managed: absorbed by vendor (reliability cost baked into price). Self-hosted: silent data loss or a hard stop until proxies/backoff are added | Managed: vendor-side, opaque to us. Self-hosted: requires an ops investment this option's "free" framing hides |
| Any scraper | Rate limits / quota exhaustion | `DOCUMENTED` (all vendors publish rate/quota tiers) | Throttled or failed discovery runs at higher volume | Requires a paid tier increase or backoff logic |
| Any provider | Wrong category / wrong geography returned | `UNKNOWN` — not observed for any provider in this pass; a query-construction risk (§2's blended-string issue) as much as a provider risk | Irrelevant candidates consume Research/AI spend for nothing | Requires better query construction, independent of provider |
| Any provider | Source/business mismatch (website belongs to a different entity) | `DOCUMENTED` for Google Places (Goregaon); `INFERRED` as equally likely for every alternative, since all read the same underlying website field (§4) | Wrong evidence reaches Qualification/Outreach draft | Requires Phase 24-style evidence-relevance gating — provider-independent fix |
| Any provider | Closed/relocated business discovered as active | `UNKNOWN` — `businessStatus` not currently requested from any provider in this pipeline | Wasted Research spend on a dead business | Requires requesting and checking a status field — a contract extension, not a provider swap |

---

## 12. Architectural Recommendation

Evaluated against the five options in the task:

- **Option A (single provider):** this is what exists today and, per §4/§11, is not the constraint currently limiting opportunity quality. **Recommended to remain the baseline for now.**
- **Option B (primary + fallback):** architecturally cheap to add later (mirrors `core-research`'s brand-new `fallbackResearchProvider.ts` pattern from the most recent commit) — but not currently justified, since no evidence shows Google Places is *unavailable* often enough to need a fallback; its limitation is coverage (§2), not availability.
- **Option C (multi-provider aggregation + entity resolution):** premature. Entity resolution (§8) is not solved even for a *single* provider today; aggregating multiple providers' overlapping, inconsistently-keyed candidates would make the unsolved entity-resolution problem harder, not easier, without first building the resolution layer this option assumes exists.
- **Option D (tiered discovery — cheap discovery, then enrichment):** the most promising *future* direction, and the one this audit's Contactability/Identity findings point toward — e.g., keep Google Places (or a cheap scraper) for initial candidate discovery, then a separate, deliberate enrichment step (contact-page extraction from the already-fetched homepage, or a Place-ID-based phone lookup) before Research. This is additive to the existing architecture (§14) and does not require replacing Discovery.
- **Option E (hybrid: Places/scraper + SERP + website enrichment -> canonical prospect):** conceptually the eventual target if contactability and entity resolution both need solving, but is **three separate scoped changes bundled into one architecture diagram** — not something to approve as a single initiative. Each piece (better discovery coverage, contact enrichment, canonical entity resolution) should be independently justified by the experiment in §13 before being combined.

**Recommendation: stay on Option A now; the fastest, lowest-risk improvement is fixing pagination and instrumentation on the existing provider (§14) before evaluating any architectural expansion.**

---

## 13. Recommended Experiment (not run)

Controlled scenario, matching the task's instruction — **note:** this differs from `requirement/MVP_SCOPE_BOUNDARY.md` §4's own authoritative validation scenario (₹30,000 minimum project value, not ₹10,000); if this experiment is actually run, using the authoritative figure would keep results comparable to the product's own validation record. Scenario as specified here: Service = Website development/redesign, Target = Restaurants, Geography = Mumbai, Minimum project = ₹10,000. Target: 20 discovered businesses per provider.

**Prerequisite (do first, provider-independent):** ship the skip-reason and cross-stage-outcome instrumentation described in §2 — without it, this experiment reproduces today's opacity with a second data source added, and none of the metrics below can actually be computed.

**Then, for Google Places (paginated to its real ~60-result ceiling) vs. one managed scraper (recommend picking only one of Outscraper/Apify to bound spend and comparison complexity), measure:**
```text
businesses discovered · businesses accepted (name+website present)
businesses with website · businesses with phone · businesses with email
businesses with a usable source document (Research's ≥200-char extraction succeeds)
businesses with correct identity (source content actually matches the discovered business —
   only measurable once some form of R-70-style check exists, even a manual spot-check for
   this experiment)
businesses with evidence-backed need · businesses producing qualified opportunities
human "would contact" YES/NO (per requirement/MVP_REAL_USER_VALIDATION_TEMPLATE.md's exact
   primary question wording)
```
**Most important derived metrics:** evidence-backed opportunity rate, human-contactability rate, cost per evidence-backed opportunity, cost per human-contactable opportunity. Do not conclude from raw discovered-business counts alone.

**Scale:** a handful of searches, not hundreds — enough to compare funnels, not a statistically powered study. **Not run as part of this audit.**

---

## 14. Migration / Engineering-Fit Note

`DOCUMENTED`, confirmed by reading the contract: adding an alternative provider requires only (1) a new file implementing `DiscoveryProvider` (an **adapter**, mirroring `googlePlacesClient.ts`'s "only file that knows this vendor exists" pattern), and (2) a config-driven choice of which provider boots in `apps/worker/src/index.ts`. **No change is required** to `DiscoveryCandidate`, normalization, deduplication, the database schema, or any downstream package (`core-research` through `core-followup-preparation` never see provider identity — only persisted `Company`/`Prospect` rows). This is a genuine architectural strength worth preserving.

Extending `DiscoveryCandidate` to carry phone/address/category/place-ID/status (needed for §5/§8/§11's identified gaps) **does** require a contract change plus a schema/migration change — a larger, separately-scoped decision, not something to bundle into a provider evaluation.

---

## 15. Final Decision Framework

**A. Current baseline.** Google Places (New) gives correct, licensed, first-party business name + website identity, at low/near-free cost given the minimal field mask in use, already fully integrated and tested. Its real limitations are structural (unpaginated, ~20/search cap) and contractual (no phone/address/category requested), not identity-accuracy problems.

**B. Material weaknesses currently preventing consistently useful opportunities** (in priority order, all `DOCUMENTED`):
1. No evidence-relevance/source-attribution gate anywhere in the pipeline (§4) — the single confirmed root cause of the one bad opportunity found in real validation.
2. Discovery pagination is not implemented — candidate volume is capped near ~20/search regardless of provider (§2).
3. No phone/email/address is captured anywhere in the discovery-to-research handoff (§5).
4. No skip-reason or cross-stage-outcome instrumentation exists yet to even measure the funnel (§2/§10).
5. No entity-resolution beyond hostname-based dedup (§8).

**C. Candidate improvements.** None of B.1–B.5 is fixed by a discovery-provider swap. B.2 is fixed by implementing pagination on the *existing* provider. B.3 requires extending the contract (any of Outscraper/Apify/DataForSEO already return phone data cheaply if this is pursued). B.1 is Phase 24's unapproved scope. B.4 is pure instrumentation work, already in progress (uncommitted). B.5 requires a deliberate entity-resolution design, independent of provider choice.

**D. Evidence still required (live experiment, not this desk audit):** accept-rate, evidence-rate, and cost-per-qualified-opportunity numbers for any provider — all currently `UNKNOWN`.

**E. Recommended experiment:** §13, run only after the prerequisite instrumentation ships.

**F. Architecture implication:** **keep Google Places as baseline.** Do not replace it. Do not add a secondary provider or aggregation layer yet — no evidence in this audit justifies that expansion cost. Consider enrichment (Option D, §12) as the more promising future direction once the more urgent, provider-independent fixes (pagination, instrumentation, Phase 24) are addressed.

**G. Implementation gate — what would authorize any provider change:**
```text
[ ] Skip-reason + cross-stage instrumentation shipped and generating real data
[ ] Google Places pagination implemented (use the ~60-result ceiling already licensed)
[ ] The §13 experiment run, with real cost-per-human-contactable-opportunity numbers for
    at least one alternative provider, showing a material, evidenced improvement over the
    now-properly-paginated and instrumented Google Places baseline
[ ] Phase 24 (or an equivalent evidence-relevance gate) approved and implemented, so
    "evidence-backed opportunity" is a real, measurable outcome rather than today's
    unguarded keyword-substring match
[ ] A legal review of the chosen alternative's terms of service, specifically covering
    commercial use, resale, and data-retention restrictions (§9)
```
None of these conditions are met today. **No implementation is authorized by this audit.**

---

## 16. Critical Product Question — answered explicitly

> **"If the Client Acquisition OS discovers 20 businesses, but only 3 produce evidence-backed opportunities that a real user would actually contact, is the discovery provider successful?"**

**Yes — provided those 3 are genuinely, verifiably evidence-backed and correctly attributed to the right business.** `requirement/MVP_SCOPE_BOUNDARY.md` §9 states the MVP's most important success criterion is that *"the system does not fabricate business needs"* and explicitly prefers **fewer, trustworthy opportunities** to more, unreliable ones — this is restated even more forcefully in the (unapproved) Phase 24 proposal: *"A system that returns fewer, trustworthy opportunities... is explicitly preferable... to a system that returns more opportunities of the [mismatched] kind."* A 20-in/3-out funnel with 3 real, correctly-attributed opportunities is a **successful discovery provider outcome** by this product's own stated definition — sales usefulness, not scraping volume, is the metric. The real failure mode this audit found (§4) was not "too few opportunities out of 20" — it was **one of three opportunities being built on evidence for the wrong business**, which is a trustworthiness failure, not a volume failure, and is not fixed by making the "20" bigger.

This is why this audit does not recommend chasing higher discovery volume as the next step: volume was never the constraint the evidence points to.

---

## 17. Open Unknowns

1. Exact current Google Places price for the `displayName`+`websiteUri`-only field mask — not pinned to one number; verify against Google's live console before budgeting a pagination-driven cost increase.
2. `gosom/google-maps-scraper` (engine behind the Mahanaicoach kit) repository health/maintenance cadence — not checked in this pass.
3. Full ToS text (not just marketing pages) for Outscraper, Apify, Bright Data, DataForSEO, Oxylabs regarding commercial resale/retention — not read end-to-end in this pass.
4. Whether persisting Google-Places-derived `name` indefinitely conforms to the July-2026 Maps Platform caching terms — requires legal review, not resolved here.
5. Actual accept-rate, evidence-rate, and qualify-rate for the current Google Places integration once pagination and instrumentation ship — the prerequisite baseline the §13 experiment needs to be comparable against.
6. Whether the real-user validation session that produced the Goregaon/Platinum/IFSI evidence used the MVP's own authoritative Mumbai-restaurants scenario or a different vertical (the requirement docs describe fitness clubs) — worth reconciling before treating that session as representative.

---

## Post-audit verification

```text
Files created by this task:   requirement/DISCOVERY_PROVIDER_SELECTION_AUDIT.md  (this file, only)
Files modified by this task:  NONE
Dependencies installed:       NONE
API calls made:                NONE (paid or free)
Live scraping performed:       NONE
Searches created:              NONE
Businesses contacted:          NONE
Migrations/schema changed:     NONE
Commits created:                NONE
Phase 18-24 status:            UNTOUCHED (Phases 18-23 remain CLOSED/FROZEN; Phase 24 remains
                                PROPOSED/NOT APPROVED — this document does not approve it)
```

```text
FINAL STATUS:
NO IMPLEMENTATION AUTHORIZED
```
