# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — PO DECISION PREPARATION
## READ-ONLY GOVERNANCE PREPARATION — NO DECISION RECORDED YET

**Decision ID (placeholder):** CF-DISCOVERY-ARCH-002 — to be confirmed only when the PO records an actual decision from this questionnaire.
**Decision title:** Deterministic Opportunity Signals for the Filtering Stage of CF-DISCOVERY-ARCH-001
**Status:** Questionnaire only. No option has been selected. No implementation authorized.

---

## 1. Context

[CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md) authorized the following target shape only:

```
DISCOVERY → DETERMINISTIC OPPORTUNITY FILTERING → SELECTIVE AI RESEARCH/QUALIFICATION
```

That decision explicitly left open: *"Which deterministic opportunity/website signals to build and their exact scope"* and *"The rule(s) determining which candidates pass the deterministic stage vs. require AI research."* This document prepares the PO questions needed to answer those two open items. It records no decision.

---

## 2. Existing authorized facts (repository, as observed — not proposals)

These are facts about what the repository does **today**, cited by file:line. They are not recommendations.

- **Website presence is already a hard gate, in the wrong direction for this purpose.** [`normalize.ts:43-51`](packages/core-discovery/src/normalize.ts:43) (`normalizeCandidate`): a discovery candidate with **no website is dropped before persistence** (`if (!candidate.website) return null`). Today, "no website" does not surface as an opportunity signal — it causes the candidate to never become a Prospect at all. Any PO decision to use "no website" as a *positive* signal requires reconciling this existing gate, since it currently has the opposite effect.
- **Fetch-level signals exist but are positioned downstream of the current AI-invocation point, not before it.** [`sourceDocumentProvider.ts:92-135`](packages/core-research/src/sourceDocumentProvider.ts:92) (`fetchHomepage`) already distinguishes, deterministically, per fetch of `https://{normalizedDomain}`:
  - Network failure, timeout, or 5xx → `SourceFetchTransportError`, retried once, then thrown ([lines 110-121](packages/core-research/src/sourceDocumentProvider.ts:110)).
  - 4xx status, or non-`text/html` content-type, or over the 2MB byte cap → resolves to `{ kind: 'unusable' }` ([lines 119-134](packages/core-research/src/sourceDocumentProvider.ts:119)).
  - Successful fetch but extracted article text under 200 characters → treated as no usable document ([line 154](packages/core-research/src/sourceDocumentProvider.ts:154), `MIN_EXTRACTED_CHARS`).
  - This code always requests `https://` specifically (never tries plain `http://` as a fallback) — a TLS/certificate failure on a candidate currently surfaces as a generic transport error, not a labeled "no HTTPS" or "certificate problem" signal.
  - This logic runs today only as part of fetching material *for* AI research — it is not currently invoked as a pre-AI filter.
- **Contact-value extraction already exists, deterministically, but inside the research pipeline, not as a standalone pre-filter.** [`contactValueExtraction.ts`](packages/core-research/src/contactValueExtraction.ts) does regex-based detection of email/phone candidates (`EMAIL_CANDIDATE_RE`, `PHONE_CANDIDATE_RE`) from already-fetched page text, re-classified via `detectContactIdentifiers`. Deliberately not exported from the package's public index per its own header comment.
- **No other signal in this questionnaire has any implementation today.** Confirmed absent from `packages/` and `apps/`: HTTPS/certificate labeling as a distinct signal, mobile/viewport detection, performance/page-weight measurement, technology-age/deprecated-tech detection, HTML-structure quality scoring, SEO-metadata/structured-data detection, CTA/business-information-completeness detection, and all "business activity" signals (new launch, expansion, hiring, advertising, public request for web help).
- **Public-intent signal *shapes* exist as design scaffolding only, with no live data source.** [`intentSourceAdapters.ts`](packages/core-research/src/intentSourceAdapters.ts) defines `publicWebSearchAdapter`, `publicIntentNoticeAdapter`, and `aiPlatformAcquisitionAdapter` as mapping/normalization functions over an already-obtained record. Header comment: *"Each maps an already-obtained raw record (fixture today; an authorized integration's payload later)... None performs I/O, holds credentials."* These are not integrations; they are typed shapes for integrations that do not exist yet.
- **No social-platform scraping exists or is authorized anywhere in this repository.** No prior instruction in this questionnaire assumes otherwise, and no code assumes otherwise either.

---

## 3. Candidate deterministic signals — audit table

Legend: **Existing** (shipped, used for this purpose today) / **Partial** (related logic exists but not wired for this purpose, or positioned wrong in the pipeline) / **Proposed** (no code; a design option) / **Unknown** (feasibility not established without further spike/measurement).

| # | Signal | Observable evidence (deterministic test) | Deterministic? | Reliability | False-positive risk | Cost | Policy/legal concern | Existing support | Proposed strength |
|---|---|---|---|---|---|---|---|---|---|
| 1 | No website found | Discovery provider returns no website field for the candidate | Yes | High (source is Google Places' own field) | Low | None (already fetched) | None | **Partial** — currently causes candidate to be *dropped* ([normalize.ts:47](packages/core-discovery/src/normalize.ts:47)), not flagged | Strong signal, but requires reversing an existing gate |
| 2 | Website exists | Opposite of #1 | Yes | High | Low | None | None | Partial (same gate) | Baseline, not itself an opportunity signal |
| 3 | Website unreachable | Fetch raises `SourceFetchTransportError` (network/timeout/5xx) after retry | Yes | Medium — a transient outage looks identical to a dead site from one fetch | Medium (must distinguish transient from persistent, see §5) | One extra HTTP fetch per candidate | Low (fetching a business's own public homepage) | **Partial** — logic exists ([sourceDocumentProvider.ts:110-121](packages/core-research/src/sourceDocumentProvider.ts:110)) but positioned downstream of AI invocation today | Needs a repeat-fetch or retry-window policy to avoid false positives |
| 4 | Domain appears inactive | DNS resolution failure, or NXDOMAIN, distinct from a reachable-but-erroring host | Yes | High if DNS-level check is added | Low | One DNS lookup | Low | Unknown (no DNS-layer check exists; current code only does HTTP fetch) | Candidate signal, needs new code |
| 5 | Broken/invalid website | HTTP 4xx, non-HTML content-type, or extraction yields <200 chars | Yes | Medium (a very short *legitimate* single-page site would also trigger this) | Medium | None (already fetched) | None | **Partial** — exists as `{kind:'unusable'}` ([sourceDocumentProvider.ts:119-134](packages/core-research/src/sourceDocumentProvider.ts:119)) | Reasonable but needs a minimum-content threshold the PO accepts |
| 6 | No HTTPS | Plain HTTP connection succeeds where HTTPS fails, or HTTPS fetch fails with a connection-level (not cert) error | Yes, if implemented as a distinct check | Medium (confounds with #3/#7 today — not separated) | Medium | One extra fetch attempt over `http://` | Low | **Partial** — current code never tries `http://` as a fallback, so it can't currently distinguish "no HTTPS" from "no website at all" | Needs new code: an explicit HTTP-fallback probe |
| 7 | Certificate problem | HTTPS fetch fails specifically on a TLS/certificate error (as opposed to DNS or connection-refused) | Yes, if the error is classified by cause | Medium | Medium (requires distinguishing TLS errors from other `fetch` failures by error code) | None extra | Low | **Partial** — currently all such failures collapse into one generic `SourceFetchTransportError` ([sourceDocumentProvider.ts:114](packages/core-research/src/sourceDocumentProvider.ts:114)) with no cause-based classification exposed to callers | Needs new error-classification code |
| 8 | Missing viewport configuration | Absence of `<meta name="viewport">` in fetched HTML | Yes | High (unambiguous HTML parse check) | Low (a few sites intentionally omit it yet render fine, e.g. some fixed-width legacy sites — rare) | None (HTML already available if fetched) | None | **Proposed** — no code inspects `<head>` meta tags today; Readability extraction discards this entirely | Strong, cheap, clearly relevant to "needs a redesign" |
| 9 | Obvious mobile rendering problems | Would require rendering the page (e.g. headless browser) and measuring layout, not just HTML inspection | Partially — rendering-based checks are non-trivial to make fully deterministic | Low-Medium | Medium-High | High (headless rendering per candidate) | Low | Unknown | Not recommended as a cheap signal; conflicts with "inexpensive deterministic filtering" intent of CF-DISCOVERY-ARCH-001 |
| 10 | Major usability problems detectable automatically | Vague unless operationalized as specific sub-checks (e.g. #8, #11, #18) | No, as stated | N/A | N/A | N/A | N/A | None | **Not a signal on its own** — must be decomposed into specific, evidenced sub-checks per the "avoid subjective signals" instruction |
| 11 | Very poor page performance | Measured load time / Core Web Vitals via synthetic test (e.g. a timed fetch, or a real performance-testing API) | Yes, if a fixed measurement method and threshold are fixed in advance | Medium (network conditions at measurement time affect result) | Medium | Low-Medium (one timed fetch) to High (full Lighthouse-style run) | Low | **Proposed** — no timing/performance measurement exists; only a byte-size cap exists today for unrelated memory-safety reasons ([sourceDocumentProvider.ts:64](packages/core-research/src/sourceDocumentProvider.ts:64)) | Feasible as a cheap proxy (fetch latency, payload size) short of full Lighthouse |
| 12 | Very large page/resource footprint | Total response byte size against a fixed threshold | Yes | High | Low-Medium (a media-heavy but well-optimized site could still trip it) | None extra — size is already measured during fetch ([sourceDocumentProvider.ts:64](packages/core-research/src/sourceDocumentProvider.ts:64)) for the cap, just not reported as a signal | None | **Partial** — the number exists in the current fetch path, just discarded | Cheap to surface; reuses existing measurement |
| 13 | Other deterministic performance problems | Unspecified unless named | No, as stated | N/A | N/A | N/A | N/A | None | Not actionable without specifics |
| 14 | Obviously outdated technology | Detect known old-generation markers (e.g. table-based layout, Flash/`<applet>` remnants, very old jQuery versions in script tags) | Yes, as a signature match against a maintained list | Medium (signature list needs upkeep; false negatives as sites update) | Medium | Low (string/signature match on already-fetched HTML) | Low | Proposed | Plausible but requires maintaining a signature library — an ongoing cost, not one-time |
| 15 | Deprecated web technology | Same mechanism as #14 (e.g. Flash, deprecated APIs referenced in markup) | Yes, same caveats | Medium | Medium | Low | Low | Proposed | Overlaps substantially with #14 — PO may want to merge these |
| 16 | Broken scripts/resources | HTTP checks on linked `<script>`/`<link>` resources to see if they 404 | Yes | Medium-High | Low-Medium | Medium (N additional fetches per candidate, proportional to resource count) | Low | Proposed | Cost scales with page complexity; may conflict with "inexpensive" filtering intent for heavy pages |
| 17 | Poor HTML/technical structure | Vague unless specific parse checks are named (e.g. missing `<title>`, no heading hierarchy, invalid nesting) | Only the named sub-checks are deterministic | N/A as stated | N/A | N/A | N/A | None | Needs decomposition into specific checks, same as #10 |
| 18 | Missing basic SEO metadata | Absence of `<title>`, meta description, or `<h1>` in fetched HTML | Yes | High | Low (a few single-page apps legitimately render these client-side only — would appear as missing in a simple HTML fetch) | None (HTML already available) | None | Proposed | Cheap, deterministic, directly relevant |
| 19 | Missing structured data where relevant | Absence of JSON-LD / schema.org markup for local-business types | Yes | Medium (most small-business sites never had this; near-universal "missing," so weak discriminator) | Low | None | None | Proposed | Low discriminating power — most candidates will fail this regardless of real opportunity size |
| 20 | Missing contact mechanism | Absence of any email/phone pattern and no contact-form marker in fetched text/HTML | Yes, reusing existing regex detection | Medium-High | Medium (a contact mechanism reachable only via an image, a separate "Contact Us" page the homepage-only fetch never sees, or a chat widget would be missed) | None (reuses existing extraction) | None | **Partial** — `contactValueExtraction.ts` already implements the detection logic, just not as a pre-AI pass/fail gate | Reuses existing code; main risk is the homepage-only fetch scope (O-18-03) missing contact info on other pages |
| 21 | Missing clear CTA | Requires defining "CTA" in machine-observable terms (e.g. presence of a `<button>`/`<a>` with action-like text, or a form) | Yes, if narrowly defined | Low-Medium (CTA phrasing varies enormously; false negatives likely) | Medium-High | Low | Low | Proposed | Weakest of the HTML-structure signals; high false-positive/negative risk without heavy tuning |
| 22 | Missing important business information | Vague unless "important" is enumerated (address, hours, service list) | Partially, per enumerated item | N/A as stated | N/A | N/A | N/A | None | Needs decomposition; risks becoming subjective if left general |
| 23 | Poor conversion-oriented structure | Not independently observable beyond #20/#21/#22 combined | No, as stated | N/A | N/A | N/A | N/A | None | Should be treated as a *combination outcome* of other signals, not its own check |
| 24 | Newly launched business | Would require a dated, authoritative public source (e.g. business registration date, or domain registration/WHOIS date as a proxy) | Partially — WHOIS/RDAP domain-age lookup is technically deterministic but is a proxy, not a direct measure of *business* age | Low-Medium (domain age ≠ business age) | Medium-High | Low-Medium (one WHOIS/RDAP call) | Medium (third-party WHOIS/RDAP data use terms vary; not yet audited) | Unknown | Needs a dedicated feasibility/policy spike before use |
| 25 | New location | No current data source | No current source identified | N/A | N/A | N/A | Unknown | Unknown | Not evaluable without naming a specific data source |
| 26 | Business expansion | No current data source | No current source identified | N/A | N/A | N/A | Unknown | Unknown | Not evaluable without naming a specific data source |
| 27 | New product/service | No current data source | No current source identified | N/A | N/A | N/A | Unknown | Unknown | Not evaluable without naming a specific data source |
| 28 | Hiring activity | Would require a job-board integration; none exists | No current source identified | N/A | N/A | N/A | Medium-High (most job boards restrict scraping/bulk access in ToS) | None | Needs its own policy review before any technical feasibility work |
| 29 | Advertising activity | Would require visibility into a business's ad spend/placements (e.g. via an ad-transparency API where one exists) | Partially, only where an official ad-transparency API exists and covers India/local SMBs | Unknown | Unknown | Unknown | Medium (platform-specific ToS) | None | Needs a named platform + its transparency-API terms before evaluation |
| 30 | Public request for website/web-development help | A public (non-gated) post explicitly asking for a website/developer, found via a general-purpose web/search API — not platform scraping | Yes, if sourced via a compliant search API rather than scraping a specific platform | Low-Medium (volume is likely low for the ₹10k+ local-SMB segment; relevance filtering still needed) | Medium (same words used for unrelated requests) | Low-Medium (search-API call volume) | Low, if sourced via the platform's own sanctioned API/search index rather than scraping | **Proposed**, with scaffolding — `publicWebSearchAdapter` ([intentSourceAdapters.ts](packages/core-research/src/intentSourceAdapters.ts)) defines the mapping shape for exactly this, but has no live data source wired in | Closest of the "intent" signals to being architecture-ready, but still needs a real, authorized data source |

### Additional signals (Claude proposals — not recommended automatically)

| # | Signal | Observable evidence | Deterministic? | Reliability | False-positive risk | Cost | Policy concern | Existing support | Note |
|---|---|---|---|---|---|---|---|---|---|
| 31 | Stale copyright year in footer | Regex match of a `©`/`copyright` string followed by a year, compared to current year | Yes | Low-Medium (many sites never update this even when actively maintained) | High | None (reuses fetched text) | None | Proposed | Cheap but weak; easy to add, easy to misfire |
| 32 | No analytics/tracking tag present | Absence of common analytics script markers (e.g. a known GA/GTM snippet pattern) in fetched HTML | Yes | Low-Medium (proxy for "digital maturity," not directly for "needs a website") | Medium-High | None | None | Proposed | Indirect; weak standalone signal |
| 33 | Placeholder/"coming soon" site | Extracted text present but trivially short/templated, reusing the existing 200-char minimum ([sourceDocumentProvider.ts:154](packages/core-research/src/sourceDocumentProvider.ts:154)) | Yes | Medium | Medium (a legitimately minimal one-page site looks the same) | None (reuses existing extraction) | None | **Partial** — the threshold already exists for a different purpose | Reuses an existing number rather than adding new fetch cost |
| 34 | Domain-registration age (WHOIS/RDAP) | Same mechanism as #24; listed separately because it could stand alone as "young domain," independent of any "new business" claim | Partially (WHOIS/RDAP lookup is deterministic; "business age" inference is not) | Low-Medium | Medium | Low-Medium | Medium (third-party data-use terms not yet audited) | Proposed | Needs the same feasibility/policy spike as #24 |
| 35 | Default template/builder fingerprint | HTML signature matching against known unmodified starter templates (e.g. a stock Wix/WordPress theme never customized) | Yes, as a signature match | Low-Medium (signature list needs upkeep) | Medium | Low | Low | Proposed | Directly relevant ("never invested in their site") but maintenance-heavy |

---

## 4. Signal-specific PO questions

These require PO answers; none are decided here.

- **Q1. ANSWERED.** See [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md): YES, "no website" is a positive opportunity signal, subject to boundaries recorded there (no code change yet; the engineering definition of "confirmed no website" vs. temporary failure vs. ambiguous must still be produced separately).
- **Q2. ANSWERED.** See [CF-DISCOVERY-ARCH-002-Q2](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q2_REACHABILITY_PERSISTENCE_PO_DECISION.md): repeated checks/persistence required, not a single fetch. Five-state taxonomy (reachable / temporarily unreachable / persistently unreachable / no website confirmed / unknown-ambiguous) is now required vocabulary; exact check count/time window deferred to a future engineering decision.
- **Q3. ANSWERED.** See [CF-DISCOVERY-ARCH-002-Q3](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q3_SCOPE_PO_DECISION.md): scoped to website-observable signals only; #24–#29 (business-activity) DEFERRED, not rejected, pending a future separate PO decision on data source/freshness/policy/cost/reliability.
- **Q4. ANSWERED.** See [CF-DISCOVERY-ARCH-002-Q4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q4_PUBLIC_INTENT_SOURCE_INVESTIGATION_PO_DECISION.md): investigation of a compliant data source for signal #30 is authorized — investigation only, no source selected, no implementation/scraping/automated collection authorized.
- **Q5. ANSWERED.** See [CF-DISCOVERY-ARCH-002-Q5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q5_DECOMPOSE_VAGUE_SIGNALS_PO_DECISION.md): #9, #10, #17, #21, #22, #23 dropped as standalone signals; may only resurface as specific, objectively testable sub-checks via a future engineering proposal + governance review — not pre-approved as #8/#16/#18/#20.
- **Q6. ANSWERED.** See [CF-DISCOVERY-ARCH-002-Q6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q6_WHOIS_RDAP_EXCLUSION_PO_DECISION.md): excluded for now (scope exclusion, not a permanent ban); reconsideration possible after a dedicated future investigation.

**Q1–Q6 are now all answered.** The only items remaining open in this questionnaire are the signal-combination rule (§5) and the AI-escalation boundary (§6).

---

## 5. Signal-combination options (PO to choose — not chosen here)

- **A.** Any single strong signal can trigger AI research.
- **B.** Multiple weak signals must combine before AI research.
- **C.** A deterministic score threshold (weighted sum of signals) triggers AI research.
- **D.** Different signal categories have different thresholds (e.g. "no website" alone is sufficient; "missing SEO metadata" alone is not).
- **E.** Other.

**ANSWERED.** See [CF-DISCOVERY-ARCH-002-S5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S5_COMBINATION_RULE_PO_DECISION.md): Option D selected — different signal categories have different thresholds (no numeric scores/weights/thresholds defined; engineering proposal + governance review required before implementation).

---

## 6. AI-escalation boundary options (PO to choose — not chosen here)

What is the deterministic stage actually allowed to do with its output?

- **A.** Only eliminate obviously unsuitable candidates (pure filter — AI research still runs on everything else, unranked).
- **B.** Rank candidates and send only the strongest N (or top percentile) to AI research.
- **C.** Both eliminate and rank.
- **D.** Other.

**ANSWERED.** See [CF-DISCOVERY-ARCH-002-S6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S6_AI_ESCALATION_BOUNDARY_PO_DECISION.md): Option C selected — the deterministic stage may both eliminate unsuitable candidates and rank the remainder for AI escalation (no scoring formula/weights/thresholds/algorithm defined; engineering proposal + governance review required before implementation).

---

## 6a. Consolidated status — §4–§6 all answered

Every question this questionnaire raised is now answered. The distinction between three kinds of content in this decision thread must be preserved going forward and must not be collapsed:

**PO-authorized principles (decided, binding on future engineering work):**
- [Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md) — "no website" is a positive signal, subject to a confirmed/temporary/ambiguous taxonomy still to be engineered.
- [Q2](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q2_REACHABILITY_PERSISTENCE_PO_DECISION.md) — persistence (repeated checks) required before unreachability counts; five-state taxonomy mandated.
- [Q3](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q3_SCOPE_PO_DECISION.md) — scope is website-observable signals only; business-activity signals #24–#29 deferred, not rejected.
- [Q4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q4_PUBLIC_INTENT_SOURCE_INVESTIGATION_PO_DECISION.md) — investigation (only) of a public-intent data source for signal #30 is authorized, under a 14-point scope and a technically-possible / policy-permitted / product-authorized distinction.
- [Q5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q5_DECOMPOSE_VAGUE_SIGNALS_PO_DECISION.md) — #9, #10, #17, #21, #22, #23 dropped as standalone signals; only return via specific, objectively testable sub-checks.
- [Q6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q6_WHOIS_RDAP_EXCLUSION_PO_DECISION.md) — WHOIS/RDAP-derived signals excluded for now (not a permanent ban).
- [§5 combination rule](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S5_COMBINATION_RULE_PO_DECISION.md) — Option D: different signal categories carry different thresholds.
- [§6 escalation boundary](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S6_AI_ESCALATION_BOUNDARY_PO_DECISION.md) — Option C: the deterministic stage may both eliminate and rank.

**Future engineering proposals (not yet made, each requiring its own governance review before becoming a requirement):**
- The "confirmed no website" vs. temporary-failure vs. ambiguous taxonomy (Q1).
- The persistence algorithm — check count and time window (Q2).
- Specific sub-check definitions for the dropped vague signal categories (Q5).
- The concrete scoring/weighting/threshold model implementing the §5 per-category-threshold principle.
- The concrete ranking/escalation mechanism implementing the §6 eliminate-and-rank principle.

**Implementation authorization (status, unaffected by any of the above):**

**NOT AUTHORIZED.** None of the eight decisions recorded under this questionnaire (Q1–Q6, §5, §6) authorizes any code, configuration, `.env`, or data change. A separate, future implementation-authorization decision is required before any of this is built — and that decision can only be made once the future engineering proposals above exist and have passed their own governance review.

---

## 7. Product principle (restated, not a new decision)

Per the originating instructions: the deterministic stage may discover evidence, detect observable problems, score/filter candidates, and decide whether deeper research is worthwhile. It must **not** invent customer intent, business requirements, willingness to buy, budget, project timeline, or contact information unsupported by evidence. Every signal in §3 above was designed to be machine-observable evidence, not an inference about the business's intent — rows that failed this test (#9, #10, #17, #21–#23 as originally stated) are flagged as needing decomposition for exactly that reason.

---

## 8. Explicit non-decisions

This document does **not** decide:

- Which signals (if any) are approved for implementation.
- Any signal's exact threshold, weight, or scoring formula.
- The signal-combination rule (§5) or the AI-escalation boundary (§6).
- Whether the existing "no website → drop candidate" gate ([normalize.ts:47](packages/core-discovery/src/normalize.ts:47)) should change.
- Any data source, vendor, or API for the business-activity signals (#24–#30).
- Any provider/model, cost ceiling, caching, or batching question (reserved by CF-DISCOVERY-ARCH-001).
- Whether WHOIS/RDAP or any other third-party data source is policy-cleared for use.

## 9. What this document is for

To let the PO answer §4's questions and select options in §5 and §6, producing a follow-on decision record (tentatively CF-DISCOVERY-ARCH-002) that will state, explicitly, which signals are approved, how they combine, and what the deterministic stage is authorized to do with its output.

## 10. Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed in producing this document. No signal has been implemented. No decision has been recorded.
