# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: Q5-SPECIFIC PO DECISION PREPARATION AUDIT

**Status: READ-ONLY INVESTIGATION. NO PO DECISION MADE. NO CODE/SCHEMA/DB CHANGED.**

---

## 1. Executive Summary

`companySummary` and `businessModel` are, as actually produced today, **LLM-generated text — never a direct copy of source material — produced under the exact same prompt, schema, and classification rules as the four fields OQ-6 already classified private** (`websiteIssues`, `contentOpportunities`, `aiOpportunities`, `growthOpportunities`). The repository draws no distinction between them beyond the English property name used in the JSON schema sent to the model. Both fields may legally (under the schema's own rules) be entirely `INFERRED` — meaning no verbatim source quote exists at all for that value, only the model's self-described reasoning. The one source of genuine reassurance is the *input*: the sole source material is the business's own public homepage, fetched by a frozen, homepage-only, no-crawl extractor — never another freelancer's private data, never a competitor's confidential information. But a safe *input* does not make a model-synthesized, potentially-`INFERRED` *output* automatically safe to treat as verified public fact. **Conclusion: the current producer/read path is not yet proven compliant with the assumptions an eventual cross-freelancer reuse of OQ-6's "public-eligible" classification would need.** This finding does not change OQ-6's classification decision; it determines whether the *currently generated values* under that classification are ready to be exposed, which remains an open question for the Product Owner.

## 2. Exact Q5 Question

> Can `companySummary` and `businessModel`, **as they are actually produced and stored today**, safely be exposed/reused across freelancers?

This is explicitly narrower than, and must not be conflated with, OQ-6's already-closed policy classification (see §9 for the distinction, restated).

## 3. Authoritative Decisions (not reopened)

D1–D23, OQ-1 through OQ-4 and OQ-6 through OQ-9, C-1 through C-7, Phase 7B, Phase 8, K1, Service+Geography-only search decisions, zero-AI architecture, and the ₹1,499 commercial model are all treated as authoritative and are not touched by this document. OQ-5 (LinkedIn/profile evidence) remains separately, intentionally open and is not addressed here. OQ-6's classification — `companySummary`/`businessModel` public-eligible, the four named fields private — is restated below for reference but **not reopened**; this document investigates only whether the *current producer* for the two public-eligible fields is ready for that classification to take effect in an actual cross-freelancer read path.

## 4. Repository Evidence

All citations verified directly in this pass (file:line).

| Fact | Citation |
|---|---|
| `leadResearchSchema` defines `companySummary`, `businessModel`, `targetCustomers` as `observationSchema` and `visibleProblems`, `growthOpportunities`, `aiOpportunities`, `websiteIssues`, `contentOpportunities`, `automationOpportunities` as `observationList` (an array of the same `observationSchema`) | `packages/core-research/src/schema.ts:287-304` |
| `observationSchema` is **one single definition**, reused, not one bespoke schema per field | `schema.ts:66-161` |
| The Anthropic tool-call schema explicitly deduplicates `observationSchema` because it "recurs 9 times inside `leadResearchSchema` (companySummary/businessModel/targetCustomers plus each of the 6 observation-list items)" | `packages/core-research/src/anthropicModel.ts:83-88` |
| The system prompt (`SYSTEM_PROMPT`) contains **no field-specific instruction** for any of the 9 fields — one generic OBSERVED/INFERRED/UNKNOWN methodology applies uniformly | `packages/core-research/src/prompt.ts:13-31` |
| `value` (the stored text) is **never required to be a verbatim copy** — only `evidence[].quote` must be verbatim; `value` is free text up to 1200 characters, authored by the model | `schema.ts:75` (value), `:32-41` (quote) |
| `INFERRED` is a legal classification for **any** field, including `companySummary`/`businessModel`: requires `basis`, forbids `evidence`, caps `confidence` at 80 | `schema.ts:107-136` |
| Persistence is unfiltered and field-name-agnostic: `toNewResearchSignals()` maps every `Observation` (regardless of which of the 9 fields it came from) identically into a `NewResearchSignalInput` | `packages/core-research/src/mapping.ts:16-27` |
| Stored provenance per signal is `source_url`, `source_quote`, `source_label` — **only present when the claim is `OBSERVED`**; an `INFERRED` claim stores no quote/URL at all, only free-text `basis` | `packages/core-research/src/pgRepository.ts:104` (INSERT into `research_signal_sources`), `schema.ts:88,107-136` |
| No column on `research_signals` records which model/provider/prompt-version produced a row | confirmed absent in `packages/db/prisma/migrations/0016_research_signals/migration.sql:56-95` and all later widenings (0029/0030/0049) |
| The sole source material is the business's **own public homepage only** — one document, no crawl, no secondary pages, extracted via Readability/jsdom | `packages/core-research/src/sourceDocumentProvider.ts:1-21` |
| A stronger provenance mechanism (full captured document text + SHA-256 hash) **exists in the codebase** but is wired only to `categoryPlausibility`/`targetCustomerMatch` persistence, **not** to the general research-signal (`companySummary`/`businessModel`) pipeline | `packages/core-research/src/service.ts:179-266` (`capture.supplied` used at lines 229/242/266, never passed into `toNewResearchSignals` at line 194) |
| Current read path is scoped to the owning freelancer only, via token + `prospectId` | `apps/web/app/(client-finder)/opportunities/[id]/page.tsx:100,143-144` (`listResearchSignals(repos, token, opportunity.prospectId)`) |
| The UI renders every field (`companySummary`/`businessModel` included) **identically and generically** — field name, classification, confidence, value text, basis, sources — no field-specific "verified public fact" vs. "AI interpretation" visual distinction exists today | `apps/web/app/(client-finder)/opportunities/[id]/page.tsx:248-256` |
| No code anywhere in the repository exposes one freelancer's `research_signals` row to another freelancer (repo-wide search, re-confirmed this pass) | consistent with the two prior audits' findings; no contradicting evidence found |

## 5. Complete Data Flow

```
Discovery (Google Places)
  packages/core-discovery/src/service.ts — runDiscoveryForOwner()
  Candidate.website persisted as companies.normalized_domain
        │
        ▼
Research input assembly
  packages/core-research/src/service.ts:180-192 — runResearchForOwner()
  builds { prospectId, companyId, companyName, normalizedDomain, targetSegments }
        │
        ▼
Source document acquisition  [INPUT IS PUBLIC]
  packages/core-research/src/sourceDocumentProvider.ts
  createHttpSourceDocumentProvider().fetchSourceDocuments({ companyName, normalizedDomain })
  → fetches ONLY the business's own public homepage (HTTPS), extracts text via
    Readability/jsdom. Frozen to homepage-only, one document per prospect
    (comment: "no secondary-page crawling, no ranking, no generalized crawler").
  → on fetch failure: resolves to [] (never fabricated text); on transport error: thrown.
        │
        ▼
Prompt construction
  packages/core-research/src/prompt.ts
  SYSTEM_PROMPT (generic, field-name-agnostic) + buildUserMessage(input)
  (company name, website, industry/location as unverified "supplied facts",
   target segments if any, the fetched homepage text as "SOURCE DOCUMENTS")
        │
        ▼
LLM call  [OUTPUT IS MODEL-SYNTHESIZED]
  packages/core-research/src/anthropicModel.ts
  Anthropic claude-opus-5, structured output against leadResearchSchema,
  with observationSchema deduplicated via $ref — companySummary/businessModel
  are schema-identical to websiteIssues/contentOpportunities/aiOpportunities/
  growthOpportunities at the wire level.
        │
        ▼
Parsing + provenance verification + repair loop
  packages/core-research/src/researcher.ts, provenance.ts, repair.ts
  Zod validation (schema.ts's .superRefine rules); verifyProvenance() checks
  every OBSERVED quote appears verbatim in the fetched homepage text; a
  failure triggers a targeted repair request, not silent acceptance.
        │
        ▼
Mapping to signals  [UNFILTERED, FIELD-NAME-AGNOSTIC]
  packages/core-research/src/mapping.ts — toNewResearchSignals()
  Every Observation (all 9 fields, all 3 classifications) becomes exactly
  one NewResearchSignalInput, unfiltered.
        │
        ▼
Persistence
  packages/core-research/src/pgRepository.ts — saveSignals()
  INSERT INTO research_signals (append-only)
  INSERT INTO research_signal_sources (ONLY for evidence present — i.e. only
    for OBSERVED claims; an INFERRED companySummary/businessModel has ZERO
    rows here)
        │
        ▼
Cache (same-user reuse only — not a public/global path)
  packages/core-research/src/signalCache.ts / research_signal_cache_index
  WEBSITE kind (companySummary/businessModel's kind) reused only within
  (user_id, normalized_domain, signal_kind) — never cross-user.
        │
        ▼
Read path (UI, current state)
  apps/web/app/(client-finder)/opportunities/[id]/page.tsx
  listResearchSignals(repos, token, opportunity.prospectId) — scoped
  strictly to the owning freelancer via token + prospectId. Renders field
  name, classification, confidence, value, basis, sources — identically
  for every field, no per-field trust-level distinction in the UI today.
        │
        ▼
Any future/global read path
  DOES NOT EXIST TODAY. No Entity table, no public-evidence table, no
  cross-freelancer query of any kind was found anywhere in the repository
  (confirmed in two prior audits and reconfirmed in this pass).
```

## 6. Exact Research Prompt Analysis

The full, verbatim `SYSTEM_PROMPT` was read (`prompt.ts:13-31`). Findings, directly from the text:

- **All fields are generated under the same instructions.** There is exactly one system prompt for the entire `leadResearchSchema` response; it never names `companySummary`, `businessModel`, or any of the other seven fields individually, and never gives field-specific guidance.
- **The model is told to use only observed facts when claiming OBSERVED** ("You work ONLY from the source documents provided... If a document does not say something, you do not know it") — but this is a constraint on the *OBSERVED* classification, not a constraint that forces every field to be OBSERVED.
- **The model is explicitly told to distinguish fact from inference**: "OBSERVED... must quote... INFERRED — you reasoned this from observed facts... UNKNOWN — the documents do not tell you."
- **The model is explicitly allowed to infer**: INFERRED is a first-class, legal classification, applicable to any field, capped at confidence 80, requiring only a `basis` string, no evidence.
- **The model is not instructed, anywhere in this prompt, to "generate sales angles" in those words** — but neither is it instructed *not to*. The prompt's framing is itself commercially oriented from its very first sentence: "You research companies **for a freelancer deciding who to approach and what to offer**." Every field, `companySummary` included, is generated inside that framing, not inside a neutral, third-party-encyclopedia framing.
- **The model is asked to identify opportunities** via the `recommendedService`/`growthOpportunities`/`aiOpportunities`/`automationOpportunities` fields' names in the schema, but — critically — the prompt text itself never explains to the model what distinguishes a "summary" field from an "opportunity" field; that distinction exists only in the English property names of the JSON object the model is asked to fill in, which the model infers meaning from on its own.
- **The model is asked to synthesize information from the single supplied homepage document** — not multiple sources (frozen to one document per prospect, §5 above) — so "synthesis," here, means composing the `value` text from one page's content, not combining multiple sources.

## 7. `companySummary` Analysis

**What it actually is, from the producer, not the field name:**

`companySummary` is an `observationSchema` instance, identical in shape and rules to every one of the other 8 fields. Its `value` (the actual stored text) is model-composed prose, up to 1200 characters, which the model is free to write as it sees fit as long as the classification rules are satisfied. It is **not** required to be a verbatim excerpt (only `evidence.quote`, a separate field, must be verbatim) and it **may legally be entirely `INFERRED`** (e.g., a confidence-80-or-lower characterization reasoned from the homepage's overall tone/content, with no quote at all).

**Classification against the taxonomy requested:**
- **A (direct source text)** — No. Nothing in the schema or prompt requires or even permits `value` to be a direct copy.
- **B (deterministic transformation)** — No. There is no non-AI code path that produces this field; the only producer is the Anthropic model call.
- **C (LLM-generated factual summary)** — Possible, when classified OBSERVED with a supporting quote — but "factual" here means "backed by a verbatim quote from the homepage," not "verified true" or "independently checked."
- **D (LLM-generated inference)** — Also possible, and explicitly schema-legal, when classified INFERRED — in which case there is no quote at all.
- **E (mixture of fact and inference)** — Most accurate overall characterization: the *field* can be either, on a per-research-run basis, and the repository provides no mechanism forcing it toward one or the other. Nothing in the schema restricts `companySummary` to OBSERVED-only.
- **F (unknown)** — Not applicable; the production mechanism itself is fully traceable (§5/§6 above); what is *not* knowable from the repository is which classification any *specific, already-stored* `companySummary` row carries without querying that row's own `classification` column — this document has not queried live data (no database read was performed; this is schema/code-level analysis only, consistent with the read-only instruction's own scope).

**Would a reasonable user understand it as a public fact or an AI interpretation?** Based on the evidence: closer to "an AI-generated interpretation of publicly available information" than to "something publicly observed." Even in its best case (OBSERVED, quote present), the *stored* `value` text is still the model's own composed summary sentence, not the source's own words — the verbatim guarantee attaches only to the separate `evidence` array, which a consumer would have to cross-reference explicitly to recover the actual source wording.

## 8. `businessModel` Analysis

Same production mechanism as `companySummary` — identical `observationSchema`, identical prompt, identical persistence path. The taxonomy classification is identical: **E (mixture of fact and inference)**, with the same caveat that any individual row's actual classification is a runtime fact this document has not queried.

**Specific risk, as requested — can the model infer revenue model, customer model, target market, strategy, commercial structure, or positioning?**

The schema and prompt impose no restriction preventing this. The field's very name ("business model") invites exactly this kind of synthesis, and the prompt's INFERRED pathway explicitly permits the model to reason about such things from indirect evidence (e.g., pricing page structure, language patterns, service descriptions) without a verbatim quote, so long as it states its `basis` and caps confidence at 80.

**PUBLIC SOURCE FACT vs. MODEL-DERIVED INTERPRETATION, made explicit:**
- A **PUBLIC SOURCE FACT** would be: the homepage literally states "We offer monthly subscription plans starting at $49" — if quoted verbatim and classified OBSERVED, this is about as close to a verifiable public fact as this pipeline produces.
- A **MODEL-DERIVED INTERPRETATION** would be: the model concludes "This appears to be a B2B SaaS company targeting mid-market retailers" from the homepage's overall design, terminology, and client logos, classified INFERRED, confidence ≤80, with only a `basis` sentence and no quote at all. **Nothing in the repository prevents this from being exactly what a stored `businessModel` row contains.**

## 9. Comparison With Private Fields

| Field | Producer | Source material | LLM-generated? | Fact/inference | Sales interpretation possible? | Freelancer-specific framing possible? | Current scope |
|---|---|---|---|---|---|---|---|
| `companySummary` | Same Anthropic call, `observationSchema` | Business's own public homepage (1 doc) | Yes, always | Either OBSERVED or INFERRED, model's choice | Not explicitly prohibited by prompt/schema | Not explicitly prohibited | Freelancer-private today (§4) |
| `businessModel` | Same Anthropic call, `observationSchema` | Same | Yes, always | Either | Not explicitly prohibited | Not explicitly prohibited | Freelancer-private today |
| `websiteIssues` | Same Anthropic call, `observationList` (same `observationSchema`) | Same | Yes, always | Either | Explicitly the field's own evident purpose (identifying issues to pitch fixing) | Yes, by field intent | Freelancer-private today |
| `contentOpportunities` | Same | Same | Yes, always | Either | Same as above | Yes | Freelancer-private today |
| `aiOpportunities` | Same | Same | Yes, always | Either | Same as above | Yes | Freelancer-private today |
| `growthOpportunities` | Same | Same | Yes, always | Either | Same as above | Yes | Freelancer-private today |

**The schema-level and prompt-level treatment of all six rows above is identical.** The only columns in this table that differ between the "public-eligible" pair and the "private" four are the two shaded in judgment, not mechanism: "Sales interpretation possible?" and "Freelancer-specific framing possible?" — and even those are rated "not explicitly prohibited" rather than "impossible" for `companySummary`/`businessModel`, because nothing in the producer code enforces a difference. OQ-6's classification rests on the *field names* read as evidence of *intended* content, not on any verified difference in how the content is actually generated.

## 10. Provenance Analysis

| Provenance item | Retained? | Detail |
|---|---|---|
| Source URL | **Only if OBSERVED** | `research_signal_sources.source_url`, present only for evidence rows; an INFERRED claim has none |
| Source provider | Implicit only | Always "the fetched homepage" — not stored as an explicit label distinct from the URL itself |
| `observedAt` | Yes | `research_signals.observed_at` |
| Source quote | **Only if OBSERVED** | `research_signal_sources.source_quote`, verbatim-verified by `provenance.ts` at generation time |
| Source document (full text) | **Not for this field** | A full-document-plus-hash capture mechanism exists (`categoryPlausibilityRepository.ts`/`targetCustomerMatchRepository.ts`, SHA-256 hashed) but is wired only to category-plausibility/target-customer-match persistence — confirmed **not** connected to `companySummary`/`businessModel`'s own save path (`mapping.ts`/`pgRepository.ts`) |
| Evidence ID | Yes, implicitly | `research_signal_sources.id`, FK'd to `signal_id` |
| Confidence | Yes | `research_signals.confidence` |
| Model/provider | **No** | No column anywhere records which model, which provider, or which prompt version produced a row |
| Prompt version | **No** | Same — absent |
| Relationship to source observation | Partial | A quote + URL links an OBSERVED claim to its source; an INFERRED claim's `basis` is free text describing *what* was reasoned from, not a structured link to any specific evidence row |

**Could another freelancer independently verify the value from stored provenance?** For an **OBSERVED** `companySummary`/`businessModel`: partially — they could follow `source_url` and compare `source_quote` against the live page (assuming the page hasn't changed), but the stored `value` itself (the actual displayed summary) is still the model's own paraphrase, not the quote — so "verification" would show the *quote* is real, not that the *summary sentence* is an accurate characterization of it. For an **INFERRED** `companySummary`/`businessModel`: **no meaningful independent verification is possible** — there is no quote, no URL, nothing but the model's own `basis` text, which is itself unverifiable prose.

**This directly answers the instruction's warning**: a value should not be treated as globally reusable merely because it originally came from public information if the final stored value has lost the evidence needed to distinguish fact from model inference — confirmed, this is exactly the current state for any `companySummary`/`businessModel` row classified INFERRED, and even partially true for rows classified OBSERVED.

## 11. Current Privacy Boundary

- **User ownership:** `research_signals` has no `user_id` column; ownership is inherited via `prospect_id → prospects.user_id` (DEC-008 pattern, confirmed unchanged).
- **Prospect ownership:** `prospects.user_id`, direct FK.
- **Search ownership:** `prospects.search_id → searches`, itself user-owned.
- **Opportunity ownership:** `opportunities.user_id`, direct (not inherited through Prospect).
- **Cache ownership:** `research_signal_cache_index` keyed `(user_id, normalized_domain, signal_kind)` — strictly per-user; `WEBSITE` kind (which both target fields use) has no cross-user path.
- **Any global/public lookup path:** **none found**, repo-wide, for the third time across three audit passes now (this one plus the two prior documents).
- **Does any existing code already expose one freelancer's research to another?** **No.** The UI read path (`listResearchSignals`, §4 above) is gated by `token` + `prospectId`, and every repository method for `research_signals` filters by the requesting user's ownership of the Prospect. The absence of a global Entity table does not, by itself, guarantee this — it was independently verified by tracing every read/write call site, not inferred from the table's absence.

## 12. Cross-Freelancer Reuse Analysis

Scenario: Freelancer A researches Business X; the system stores `companySummary`/`businessModel`; Freelancer B later discovers Business X; a future Entity architecture reuses the same evidence for B.

- **What would B see?** Exactly the `value` text A's research run produced — a model-composed paragraph, not source text, not A's own words, not necessarily even a true-to-the-page characterization if it was INFERRED.
- **Could A's research angle leak?** Not directly through these two fields' stated *intent* (a "summary"/"business model" is not framed as an outreach angle the way `websiteIssues`/`growthOpportunities` are) — but since the producer imposes no hard boundary, a `companySummary` that happens to contain forward-looking, outreach-flavored language (the prompt's own framing is explicitly "for a freelancer deciding who to approach and what to offer") cannot be ruled out from the code alone.
- **Could A's search intent leak?** No evidence of this specific leak — `companySummary`/`businessModel` do not reference the search, target segments, or A's own queries; they are about the researched business itself.
- **Could A's ranking/recommendation leak?** No — ranking/recommendation (`recommendedService`, `offer*` fields) are separate, not part of these two fields, and are not implicated by this question.
- **Could A's AI-generated interpretation leak?** **Yes, by definition** — the entire value IS an AI-generated interpretation (§7/§8); "leaking" it to B means B receives A's run's interpretation as if it were a settled fact about the business, with no indication (in the current UI, §4) that it might be partially or wholly INFERRED.
- **Could provenance reveal A's private activity?** Minimally — `research_signal_sources` stores only the homepage quote/URL (public data), not A's identity, search parameters, or outreach intent. The acute risk here is not identity leakage but **interpretation leakage** (Risk B/C below), not a privacy-of-A problem so much as a quality/competitive-fairness problem for B (and indirectly, fairness to A, whose research effort would be freely reused without this having been the product's original design intent for the ₹1,499 subscription).

**PUBLIC BUSINESS FACT vs. FREELANCER-SPECIFIC INTELLIGENCE, restated precisely for this scenario:** the homepage itself is a PUBLIC BUSINESS FACT source. The stored `companySummary`/`businessModel` *value* is, at minimum, A's-research-run-specific **synthesis**, and in the INFERRED case, is indistinguishable in kind from the clearly-private `websiteIssues`/`growthOpportunities` fields — both are "freelancer-run-specific intelligence," generated by the same model, from the same prompt, on the same input.

## 13. Risk Analysis

**Risk A — Factual accuracy.** Yes, concretely possible: an OBSERVED claim's quote is verbatim-verified against the source, but the surrounding `value` paraphrase is not independently checked for accuracy against the quote; an INFERRED claim has no verification mechanism at all beyond the model's own `basis` narrative and a confidence cap.

**Risk B — Inference leakage.** Confirmed structurally possible: INFERRED is a legal classification for both fields, meaning a conclusion "not directly public" (reasoned from indirect signals) can be stored and, if ever exposed, presented without a clear, UI-level marker distinguishing it from an OBSERVED, quote-backed claim (today's UI does show the classification label, §4 — but a future cross-freelancer surface is not guaranteed to preserve that distinction unless explicitly designed to).

**Risk C — Competitive intelligence.** The most significant risk this audit surfaces: because the producer draws no boundary between "summary" and "opportunity" fields beyond naming, a `companySummary`/`businessModel` row cannot be guaranteed free of the same kind of research-angle content OQ-6 deliberately kept private in the other four fields. One freelancer's paid research effort could be redistributed to another without an engineered safeguard.

**Risk D — Provenance loss.** Confirmed, directly (§10): an INFERRED row has zero recoverable source evidence; even an OBSERVED row's final `value` text is not itself the verified unit (the quote is).

**Risk E — Temporal staleness.** A business's homepage changes over time; a `companySummary` generated from a homepage that has since changed could become inaccurate. The field carries no distinct staleness/freshness marker beyond `observed_at` and the generic `WEBSITE` 30-day cache-freshness window (same window used for cache reuse, not specifically for public-reuse staleness).

**Risk F — Model behavior variance.** The same prompt, applied to different businesses (or the same business at different times, given `thinking: { type: 'adaptive' }` in `anthropicModel.ts:78` — the model's own reasoning depth is self-determined per call), can and likely does produce `companySummary`/`businessModel` text of varying style, length, and fact/inference balance from one research run to another — there is no enforced consistency of output character across businesses.

**Risk G — Source licensing/usage.** **Flagged, not concluded.** The source material is each business's own public homepage, fetched by an automated extractor. Whether summarizing and redistributing that content (even for internal, platform-mediated reuse rather than public republication) raises any terms-of-service or copyright consideration is a question this document explicitly does not have authority or evidence to answer — it is a legal question, not a repository fact, and is flagged here rather than concluded.

## 14. Possible Safeguards

| Option | Privacy | Accuracy | Implementation complexity | AI cost | Latency | Scalability | Historical compatibility | Competitive-intel leak risk |
|---|---|---|---|---|---|---|---|---|
| **A — Allow direct global reuse, no gate** | Lowest protection — inherits every risk in §13 unmitigated | No improvement over today | None — reuses current data as-is | None | None | High (simplest to scale) | Compatible — no change to existing rows | Highest |
| **B — Reuse only fields generated under a fact-only prompt** | Improves privacy, but requires a NEW producer | Improves accuracy (forces OBSERVED-only, in effect) | High — new prompt variant, new schema branch, reprocessing or dual-track generation | Adds a second LLM call-path, or re-architects the existing one — nontrivial cost increase | Adds latency if run as a second pass | Medium | **Incompatible with existing stored rows** — a new prompt/producer means historical `companySummary`/`businessModel` values do not qualify without regeneration | Low, if implemented correctly |
| **C — Require provenance/source evidence before reuse** (i.e., only reuse rows classified OBSERVED with evidence present) | Improves privacy (excludes INFERRED rows, the highest-risk case) | High — only verifiable claims reused | Low-to-medium — a filter on existing data (`classification = 'OBSERVED' AND evidence present`), not a new producer | None (no new AI calls) | None | High | **Fully compatible** — applies to existing rows via a filter, no regeneration needed | Medium — an OBSERVED companySummary could still contain outreach-flavored paraphrasing even with a verified quote behind it |
| **D — Automated factuality/public-evidence check before reuse** | Improves privacy, depth depends on check quality | Depends entirely on the check's own accuracy | High — building and maintaining a secondary classifier/heuristic | Adds a second model call or a maintained heuristic — ongoing cost | Adds latency per row checked | Medium | Compatible with existing rows (can be run retroactively, batch) | Low-to-medium, depends on check quality |
| **E — Human review before first global publication** | High privacy protection | High (human judgment) | Medium — requires a review workflow/UI, not existing today | None (no AI cost) | High latency (human-in-the-loop, not real-time) | **Low** — does not scale to platform-wide automatic reuse; works for a slow, curated rollout only | Compatible, but slow | Lowest |
| **F — Keep private despite OQ-6's public-eligible classification** | Highest protection | N/A (not reused) | None | None | None | High | Fully compatible | None |
| **G — Separate deterministic/public-fact layer from LLM-generated research** | Highest long-term protection, but a bigger build | Highest, if the deterministic layer is itself accurate | Highest — an entirely new, non-AI producer for whatever subset of "company facts" is wanted (akin to the existing `GOOGLE_PLACES_STATUS`/`PUBLIC_INTENT` pattern, which are the only non-AI research-adjacent producers today) | Zero marginal AI cost for this layer (it is non-AI by design) | Low, once built | High | Fully compatible — existing LLM-generated rows stay exactly as they are, private, untouched | Lowest, by construction |

No option above was invented without grounding: B/C/D/E/F/G each map directly to either an existing repository pattern (G mirrors `detectPlacesEntityReality()`'s deterministic-signal precedent; C is a pure filter on data that already exists) or a named option in the original instruction, refined with the evidence gathered in §7-§13.

## 15. PO Decision Options

Presented as realistic, PO-decidable options, derived from the analysis above rather than assumed in advance:

**Option A — Allow the currently-generated values to become globally reusable as-is.** Accepts all risks in §13 unmitigated; fastest to ship; no engineering change beyond building the read path itself (already identified as the one blocked component in the prior engineering specification).

**Option B — Keep current values private until the producer is changed to separate fact-only, source-backed content from the rest.** The most protective "fix the root cause" option; also the most expensive (new prompt/schema design, regeneration or dual-track processing, no backward compatibility with existing rows without reprocessing).

**Option C — Allow reuse only of rows classified `OBSERVED` with verified evidence present (filter existing data, no new producer).** A middle path: meaningfully reduces exposure (excludes every `INFERRED` row, the highest-risk case) without requiring any change to the AI pipeline itself — compatible with existing stored data via a simple filter.

**Option D — Keep these fields private permanently, unless a future PO decision revisits this** (functionally overriding OQ-6's public-eligible label for these two fields specifically, pending the producer question being resolved properly). Equivalent in outcome to Option F in §14, stated as a standing decision rather than a temporary hold.

## 16. Analyst Recommendation

**Recommended: Option C**, as the engineering-grounded middle path — not chosen on the PO's behalf, offered as the option best supported by the evidence gathered:

- It is the only option that directly addresses the single most concrete, repository-confirmed risk in this audit (§10/§13 Risk D: an `INFERRED` row has zero recoverable provenance) without requiring a new AI producer, a new prompt, or any reprocessing of historical data (minimal-change principle).
- It does not touch OQ-6's classification (`companySummary`/`businessModel` remain labeled public-eligible); it adds a **readiness filter** on top of that classification — consistent with OQ-6's own text anticipating exactly this kind of implementation-level gating before "immediate cross-freelancer sharing" is authorized.
- It respects historical safety (§18) — no existing row needs to change; the filter is applied at read time.
- It does not fully eliminate Risk C (competitive-intelligence leakage can still occur in an OBSERVED-and-verified row, since the model's paraphrase is still its own composition) — this residual risk is the honest limit of what engineering evidence alone can resolve, and is exactly why this remains a PO decision, not an engineering-resolved one.

This recommendation is kept explicitly separate from, and does not substitute for, the Product Owner's actual decision in §19.

## 17. Implementation Impact Per Option

| | Option A | Option B | Option C | Option D |
|---|---|---|---|---|
| **Schema changes** | None (beyond the already-planned public/private classification table) | Possibly a new column distinguishing "fact-only producer" rows from legacy rows | None — a read-time filter (`classification = 'OBSERVED' AND evidence present`), no schema change | None |
| **Prompt changes** | None | Yes — a new, fact-only prompt variant or a restructured single prompt with per-field constraints | None | None |
| **Producer changes** | None | Yes — likely a second LLM call-path or schema restructuring | None | None |
| **Provenance changes** | None | Possibly new fields (model/provider/prompt-version, identified as absent in §4/§10) if B is pursued thoroughly | None required, though adding the §10-identified full-document-capture wiring would strengthen C further (optional, not required) | None |
| **Cache changes** | None | Possibly — cache key may need a producer-version dimension | None | None |
| **Read-path changes** | Build the cross-freelancer read path with no filter | Build it, reading only from the new fact-only producer's output | Build it with the `OBSERVED`+evidence filter applied | Do not build it for these two fields |
| **UI changes** | None required, but recommended: a "may contain AI interpretation" disclosure | A new UI distinguishing fact-only vs. legacy content, if both coexist during a transition | Likely none — OBSERVED rows already show their evidence in today's UI pattern (§4), extendable to a public-facing surface | None |
| **Migration/backfill implications** | None | Backfill question: do existing rows get regenerated, or does B apply only going forward? **This document does not recommend a backfill without explicit PO authorization (§18).** | None — filter applies to existing and future rows identically, no backfill needed | None |
| **Testing implications** | Minimal (only the read path itself) | Extensive — new prompt, new schema paths, regression tests for both producers if they coexist | Moderate — test that INFERRED rows are correctly excluded, that OBSERVED-without-evidence (should not occur per schema, but defensively tested) is also excluded | None (no new path built) |

## 18. Historical Data Impact

Under **every** option, the following holds unless and until a separate, explicit PO authorization says otherwise:

- Existing `research_signals` rows for `companySummary`/`businessModel` (OBSERVED or INFERRED) are **not** modified, deleted, or reclassified by this document.
- Existing `research_signal_cache_index` entries are **not** altered.
- Existing `opportunities` are **not** altered (these fields do not write to `opportunities` directly).
- No Entity-level evidence exists yet (the Entity layer itself is not yet built, per the prior implementation-readiness audit), so there is nothing to retroactively populate at the Entity level regardless of which option is chosen.
- **Option A** would, going forward, make newly-generated and already-existing rows alike eligible for the (not-yet-built) cross-freelancer read path — the prior audit's caveat about "no backfill, no retroactive inference" (§14 of that document) would apply to the Entity-mapping side, but Option A as stated here does treat existing rows as eligible the moment the read path is built, which is itself the central risk this document flags.
- **Option B** raises an explicit backfill question (do pre-existing rows get regenerated under the new fact-only producer, or do they remain permanently legacy/private?) — **this document does not recommend an answer**; it is flagged as a decision the PO would need to make specifically if B is chosen.
- **Option C** requires no backfill — it is a pure read-time filter, equally applicable to historical and future rows.
- **Option D** requires no data change at all.

**No retroactive global publication or backfill of any kind is recommended by this document under any option.**

## 19. Clean Product Owner Questionnaire

| Option | Treatment of CURRENT `companySummary`/`businessModel` values | Additional requirement | Impact |
|---|---|---|---|
| A | Become globally reusable as-is, no filter | None | Fastest to ship; inherits every risk in §13 unmitigated, including Risk D (provenance loss) and Risk C (competitive-intelligence leakage) at full severity |
| B | Remain private until a new, fact-only producer replaces or supplements the current one | New prompt + possibly new schema/provenance fields; backfill question unresolved | Highest engineering cost; strongest long-term risk reduction; breaks compatibility with existing rows until/unless regenerated |
| C | Reused only when classified `OBSERVED` with verified evidence present; `INFERRED` rows excluded | A read-time filter on existing data; no new producer | Moderate protection for moderate cost; directly closes the provenance-loss risk (Risk D); does not fully close the competitive-intelligence risk (Risk C) |
| D | Remain private permanently for these two fields, overriding OQ-6's practical effect for them specifically, pending a future PO revisit | None beyond not building the read path for them | Safest; defers the entire question; leaves OQ-6's classification formally intact but practically inert for these two fields until revisited |

### Product Owner Decision

Selected option: ______

---

## 20. Final Status

**READ-ONLY AUDIT ONLY.**
**NO CODE CHANGED. NO SCHEMA CHANGED. NO DATABASE CHANGED. NO MIGRATION CREATED. NO COMMIT. NO PUSH. NO PO DECISION MADE.**

OQ-6's existing classification is unmodified. OQ-5 remains separately, intentionally deferred. No other governance record was reopened, reinterpreted, or altered in the preparation of this document.
