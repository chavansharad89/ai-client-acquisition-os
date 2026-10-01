# CLIENT INTENT DISCOVERY

## Open Questions OQ-1 to OQ-12 — Product Owner Decision-Session Preparation (Evidence Pack)

**Preparation ID:** CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001
**Date:** 2026-09-30
**Type:** read-only evidence preparation for a Product Owner decision session. Not a decision record, not an
implementation authorization.
**Prepares:** CLIENT-INTENT-DISCOVERY-REQ-001 §10, OQ-1 to OQ-12, as logged in CLIENT-INTENT-DISCOVERY-OQ-DEC-001
**Author role:** governance analyst.

```text
OQ-1 through OQ-12: PENDING
Selected answers: NONE
Product Owner decisions: NONE
Implementation authorization: NONE
```

> **This record collects evidence only. It answers no OQ, selects, ranks or recommends no option, and infers no
> Product Owner preference. Every "Decision" and "Recommendation" line below is NONE.**

Labels used:

- **ALREADY DECIDED** — a decision the repository records as DECIDED, cited by ID. Not reopened.
- **PENDING PO DECISION** — OQ-1 to OQ-12, and any other question recorded as pending elsewhere.
- **ANALYST OBSERVATION** — a fact found by repository inspection (file / line). Carries no authority.
- **OPEN IMPLEMENTATION QUESTION** — cannot be resolved until the relevant OQ is decided. Carries no authority.

---

## §1 Baseline (verified before writing)

| Item | Value |
|---|---|
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 244 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` (= REQ-001 §0 = PREP-001 §1) |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (REQ-001) | `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` (PREP-001) | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` (OQ-DEC-001) | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |

**Governing records referenced by PREP-001 §1 (all recomputed; all equal to PREP-001 §1 — no unexpected change):**

| Record | ID | sha256 |
|---|---|---|
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION.md` | INTENT-INTAKE-OD13-INGRESS-DEC-001 | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_POST_SAVE_RESEARCH_DECISION.md` | INTENT-INTAKE-OD13-POSTSAVE-DEC-001 | `6ffd207561c2db580137ddb030df43f072359b2390ad75276ec918fe9b04b16d` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 (PROPOSED) | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |
| `PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md` | — | `6b59aa69bb8cd5a9b29a135402d30b682cf2960357f68bc2b05122f88e546294` |
| `PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md` | — | `176eff2b5532067a3dda9dbf9491470a3c30fec5352cb1507f6c6a74c5bec714` |

**Additional records inspected for §4 (hashed for traceability; cited by REQ-001 §0 or by the records above):**

| Record | ID | sha256 |
|---|---|---|
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION_PREPARATION.md` | DEC-003 preparation | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` (= REQ-001 §0) |
| `MVP_SCOPE_BOUNDARY.md` | — | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` (= REQ-001 §0) |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_EXACT_RESULT_BINDING_DECISION.md` | INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 (X1) | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_LEGACY_AUTHENTICITY_CHECK_DECISION.md` | INTENT-INTAKE-OD13-LEGACY-P3-DEC-001 (C-1) | `55dd133e5b32a6932e4d68e7bc3e3779c9cffc11e100112d54ee7482aa0e1c95` |

Working-tree note (ANALYST OBSERVATION): code cited below is read from the working tree, which contains
uncommitted changes (e.g. `packages/core-acquisition/src/scoring.ts` is modified relative to HEAD). Code facts are
therefore facts about the working tree at the fingerprint above, not about HEAD alone.

## §2 Governance status

```text
OQ-1 through OQ-12: PENDING
Selected answers: NONE
Product Owner decisions: NONE
```

Source of status: CLIENT-INTENT-DISCOVERY-OQ-DEC-001 §4 (all PENDING / NONE / NONE); PREP-001 §7 (all PENDING).

**ALREADY DECIDED (recorded as DECIDED in the repository; cited, not reopened):**

| Decision | Record | Recorded status |
|---|---|---|
| D1–D5 (incl. D1 `SOURCE_WEIGHT` PUBLIC_INTENT = FIRST_PARTY = 0; D3 ServiceProfile opt-in; D4 run existing research; D5 fixed confidence PUBLIC_INTENT = 70, FIRST_PARTY = 90) | INTENT-INTAKE-PO-DEC-001 §2 | DECIDED (rev. 2) |
| DEC-003 Option A — explicit upstream authorization for FIRST_PARTY AI-platform signals; privacy boundary (§6) | INTENT-INTAKE-PO-DEC-003 | DECIDED — Option A |
| OD-1 to OD-13 | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 §14 | DECIDED (rev. 2); implementation not authorized by that record |
| OD13-M Option B (and Q1–Q12, incl. Q9 non-retention) | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 | DECIDED — Option B — design only |
| IG-1 to IG-7 (Alternative I) | INTENT-INTAKE-OD13-INGRESS-DEC-001 | DECIDED |
| PS-1 to PS-8 | INTENT-INTAKE-OD13-POSTSAVE-DEC-001 | DECIDED |
| Q-X1 to Q-X7 (X1 exact-result binding) | INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 | DECIDED — design only |
| C-1 legacy integration-ID check | INTENT-INTAKE-OD13-LEGACY-P3-DEC-001 | DECIDED |

**Not decisions (status as recorded):** INTENT-SOURCE-ADAPTER-IMPL-REC-001 and INTENT-SOURCE-PROVIDER-CONTRACT-REC-001
are **IMPLEMENTED** implementation records (not decision records). INTENT-INTAKE-GOOGLE-ADS-REQ-001 is **PROPOSED —
PENDING PRODUCT OWNER DECISION**. PHASE_22 scope lock header reads **DRAFT — SCOPE LOCK, PRE-IMPLEMENTATION**;
PHASE_23 scope lock header reads **PROPOSED — NOT YET APPROVED FOR IMPLEMENTATION**. `MVP_SCOPE_BOUNDARY.md` is a
scope record.

## §3 Evidence matrix

Abbreviations: REQ-001 = `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`; ADAPTER-REC =
INTENT-SOURCE-ADAPTER-IMPL-REC-001; CONTRACT-REC = INTENT-SOURCE-PROVIDER-CONTRACT-REC-001; GA-REQ =
INTENT-INTAKE-GOOGLE-ADS-REQ-001; DESIGN-001 = INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001.

### OQ-1

```text
Exact question:
Which providers will be authorized first?
```

- **Relevant existing requirements:** REQ-001 §2 (source classes; named examples Google, ChatGPT, LinkedIn), R-2.1,
  R-4.2, R-5.1–R-5.3, R-9.1 item 1 (provider selection), R-9.2; GA-REQ §14 GA-Q0 ("Should Google Ads be used as an
  intent source at all?").
- **Relevant existing decisions:** none establishing a dependency. (DEC-003 prep §4 left "whether ChatGPT, Gemini or
  Claude expose such data" out of scope — a non-decision, cited by REQ-001 §0.)
- **Relevant implementation facts:**
  - `apps/web/src/server/intentIntegrationRegistry.ts:96` — `INTENT_INTEGRATION_REGISTRATIONS` is an empty frozen
    array; the comment at :90 states no integration is named and no public key registered.
  - `packages/core-research/src/intentSourceProviderContract.ts` header — "No provider is called here. No SDK,
    credential, HTTP client or browser is imported; results are supplied by the caller (fixtures today)."
  - ADAPTER-REC and CONTRACT-REC status lines: "IMPLEMENTED (not committed; no migration; no live provider)".
  - The only external provider configured for discovery is Google Places (`packages/core-discovery/src/
    googlePlacesProvider.ts`; `packages/config/src/env.ts:86–91`, `GOOGLE_PLACES_API_KEY`). It is a business
    discovery provider, not an intent source under the intent-source families.
  - `packages/core-research/src/` contains Anthropic, OpenAI and Gemini model adapters (`anthropicModel.ts`,
    `openAIModel.ts`, `geminiModel.ts`) used by the Research step; none is an intent-source adapter.
  - "ChatGPT" appears in code only in `intentSourceProviderContract.test.ts` (privacy-screen test context).
  - No LinkedIn intent-source code exists (see OQ-12 / §5 for LinkedIn references).
- **Known constraints:** R-2.1 (naming ≠ selection or authorization); R-5.3 and R-9.1 (each provider needs its own
  authorization); REQ-001 §0 and R-8.2 (OD-13 runtime gate stays in force).
- **Known unresolved dependencies:** OQ-2 (capability availability); OQ-8 (access / retention constraints);
  GA-Q0 (PENDING, Google Ads only).
- **Options already documented:** none for OQ-1. REQ-001 §2 names examples; R-2.1 states they are not candidates
  selected by the source.
- **Evidence gaps:** the repository contains no record of any provider's terms, API availability, pricing or access
  approval for intent discovery.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-2

```text
Exact question:
What provider / API capabilities are actually available?
```

- **Relevant existing requirements:** REQ-001 R-2.1, R-4.2, R-5.2; GA-REQ §2 A.4 ("[NOT ESTABLISHED]"), §3 provider
  boundary ("[NOT ESTABLISHED]"), §14 GA-Q1, GA-Q3, GA-Q6, GA-Q7, GA-Q8, GA-Q13.
- **Relevant existing decisions:** OD-13 (DESIGN-001 §14) and Option B require, for any FIRST_PARTY push path, a
  provider-authenticity mechanism (Ed25519 per Option B) — a capability requirement on a provider, not a fact about
  one. GA-REQ GA-Q7 records that whether Google can sign per Option B is not established.
- **Relevant implementation facts:** no provider SDK, HTTP client or credential for any intent source exists in the
  intent-source code (see OQ-1). The provider-result contract defines what a provider result must contain
  (`intentSourceProviderContract.ts`; CONTRACT-REC §2), not what any provider offers.
- **Known constraints:** R-2.1 (no claim that any provider exposes the data, API or permission); this preparation
  task is not authorized to test APIs or contact providers.
- **Known unresolved dependencies:** GA-Q1, GA-Q3, GA-Q6–GA-Q8, GA-Q13 (PENDING, Google Ads only).
- **Options already documented:** none.
- **Evidence gaps:** **the repository does not establish the API or data capabilities of Google, ChatGPT, LinkedIn or
  any other provider for intent discovery.** This question concerns external provider facts; per the hard-stop rule,
  no capability is inferred here.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-3

```text
Exact question:
What constitutes sufficient evidence of buying intent?
```

- **Relevant existing requirements:** REQ-001 §3 (definition, examples), R-3.1 ("Original source evidence",
  "Confidence / evidence quality"), R-3.2 (traceability; not presented as the source's own words).
- **Relevant existing decisions:** PO-DEC-001 D4 (existing Research still runs); D3 (offer triggering via
  ServiceProfile opt-in).
- **Relevant implementation facts:**
  - `intentSourceProviderContract.ts` header: a search result becomes an acquisition signal only when it carries a
    business-level intent statement that appears verbatim in the result itself; otherwise `NO_INTENT_EVIDENCE`;
    without business identity, `UNATTRIBUTED`.
  - `packages/core-research/src/intentSignal.ts` header: an intent signal "proves only that the quote was observed at
    `observedAt`, not that a requirement exists"; Research remains responsible for its own determinations (D4).
  - `INTENT_SIGNAL_FIELDS` (`intentSignal.ts`): `statedRequirement`, `requestedWebsite`, `requestedMobileApp`,
    `requestedRedesign`, `requestedDevelopment`, `requestedFeature`.
  - `apps/worker/src/searchWorker/intentIntake.ts` header: a signal reaches `needDetected` only if the Search's
    ServiceProfile lists its kind in `triggers` (D3).
- **Known constraints:** R-3.2; privacy boundary (DEC-003 §6; CONTRACT-REC §3).
- **Known unresolved dependencies:** OQ-4 (confidence), OQ-9 (conversion point), OQ-11 (individual persons).
- **Options already documented:** none for OQ-3. REQ-001 §3 examples are illustrative; REQ-001 does not state them
  as a sufficiency test.
- **Evidence gaps:** no record defines a sufficiency threshold for buying intent. The existing verbatim-statement
  rule is an intake-contract rule for the three existing source families; whether it applies to the new source
  classes is not established.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-4

```text
Exact question:
How should intent confidence be determined?
```

- **Relevant existing requirements:** REQ-001 R-3.1 ("Confidence / evidence quality"), R-3.3.
- **Relevant existing decisions:** PO-DEC-001 D5 (DECIDED rev. 2: fixed by kind, PUBLIC_INTENT = 70,
  FIRST_PARTY = 90, OBSERVED, not caller-overridable); D1 (`SOURCE_WEIGHT` 0 for both intake kinds); ADAPTER-REC
  (source-assigned kind / confidence / classification rejected). REQ-001 R-3.3 labels these "EXISTING DECISION, not
  reopened".
- **Relevant implementation facts:** `intentSignal.ts` `INTENT_SIGNAL_CONFIDENCE` = `{ PUBLIC_INTENT: 70,
  FIRST_PARTY: 90 }`; header: "a caller supplying either is rejected, not silently overridden".
  `packages/core-acquisition/src/scoring.ts` `SOURCE_WEIGHT.PUBLIC_INTENT = 0`, `FIRST_PARTY = 0`.
- **Known constraints:** R-3.3 (central derivation; source-assigned values rejected). GA-REQ B.1 applies the same
  rule to Google Ads.
- **Known unresolved dependencies:** OQ-3; OQ-12 (whether new source classes map to existing kinds).
- **Options already documented:** none for OQ-4. (D5's selected Option A is an existing decision for the existing
  intake kinds, not an option list for OQ-4.)
- **Evidence gaps:** REQ-001 does not state whether an answer to OQ-4 may differ from D5 for signals from the new
  source classes, nor whether D5 may be reopened; no record permits reopening D5.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-5

```text
Exact question:
How should duplicate intent across providers be handled?
```

- **Relevant existing requirements:** REQ-001 R-4.1, R-4.3.
- **Relevant existing decisions:** DESIGN-001 OD-12 (DECIDED): "No persistence-level deduplication is added in this
  design"; in-batch `DUPLICATE_IN_BATCH` unchanged; the cross-batch duplicate question is "accepted as a known
  limitation" — decided within the FIRST_PARTY evidence design scope. IG / Alternative I: no nonce / dedup store
  (INGRESS-DEC IG-7; AUTHENTICITY-DEC Q5/Q9).
- **Relevant implementation facts:** `intentSourceProviderContract.ts` header: "only identical results inside ONE
  batch are skipped (DUPLICATE_IN_BATCH). Persistence does not deduplicate events — that is a KNOWN OPEN DESIGN
  QUESTION". ADAPTER-REC line 196: "Replay is not deduplicated at persistence (decision required)." Intake appends
  signals (`intentIntake.ts` header: "append-only, so signals never supersede one another").
- **Known constraints:** OD-12 as above for FIRST_PARTY; no dedup store permitted without reopening IG-7 / Q9.
- **Known unresolved dependencies:** OQ-7 (entity unification); GA-Q14 (PENDING, Google-side duplicate
  identification).
- **Options already documented:** none for cross-provider duplicates.
- **Evidence gaps:** no record addresses duplicates **across providers**; existing records address in-batch and
  replay duplicates within one source path.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-6

```text
Exact question:
How should stale intent decay?
```

- **Relevant existing requirements:** REQ-001 R-3.1 ("Timestamp / freshness"), R-4.2 (provider-specific freshness
  behavior handled per provider).
- **Relevant existing decisions:** PO-DEC-001 D1 (intake kinds weigh 0 in `SOURCE_WEIGHT`); OD13-M Q5 (5-minute
  freshness of a pushed signed envelope at receipt — envelope freshness, not intent decay).
- **Relevant implementation facts:** `packages/core-acquisition/src/scoring.ts:60–85` — a generic signal decay rule:
  full weight up to `SIGNAL_FRESH_DAYS = 30`, linear to zero at `SIGNAL_MAX_AGE_DAYS = 180`, applied as
  `SOURCE_WEIGHT[kind] × confidence × decayFactor(age)`; `prospectScore.ts` reuses `decayFactor`. Because
  `SOURCE_WEIGHT` is 0 for PUBLIC_INTENT and FIRST_PARTY, this decay produces no points for intake kinds in
  `scoreLead`. Each intake signal stores its source event's `observedAt` (`intentIntake.ts` header).
- **Known constraints:** D1 (unchanged unless reopened; no record permits reopening).
- **Known unresolved dependencies:** OQ-4; GA-Q11 (PENDING, Google freshness).
- **Options already documented:** none.
- **Evidence gaps:** no record defines decay for intent signals specifically, or distinguishes "when expressed" from
  "when observed" in persistence (CONTRACT-REC §4: capture time as supplied is not stored).
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-7

```text
Exact question:
How should the same prospective client appearing across Google, ChatGPT, LinkedIn and other providers be unified?
```

- **Relevant existing requirements:** REQ-001 R-3.1 ("Potential client / entity"), R-4.1, R-4.3.
- **Relevant existing decisions:** OD-4 (DESIGN-001: `business_id` for FIRST_PARTY is integration-supplied verbatim;
  never derived from `companies.id` or domain) — FIRST_PARTY scope only.
- **Relevant implementation facts:** `intentIntake.ts` header: Company via `normalizeCandidate` +
  `findOrCreateByDomain` ("no usable website -> rejected, no invented identity"); Prospect via `findOrCreate` on
  (Search, Company) ("no merging across Searches"). `intentSourceProviderContract.ts` header: "identity is never
  inferred from the URL".
- **Known constraints:** privacy boundary (no inference about named individuals; personal names rejected as keys —
  CONTRACT-REC §3).
- **Known unresolved dependencies:** OQ-5, OQ-11, OQ-12.
- **Options already documented:** none.
- **Evidence gaps:** no cross-provider entity-resolution design or record exists; the existing identity anchor is the
  company website domain within one Search.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-8

```text
Exact question:
What provider-specific access and retention constraints apply?
```

- **Relevant existing requirements:** REQ-001 R-5.1–R-5.3, R-6.1, R-6.2; GA-REQ GA-Q8, GA-Q13, GA-Q15.
- **Relevant existing decisions:** OD-10 (`basis` / `reference` not persisted); OD13-M Q9 ("The signature, raw signed
  payload, key identifier and verification outcome are not persisted"); IG-7 (Q5 / Q9 / DEC-005 not reopened);
  DEC-003 answer 6 (retain authorization evidence: who / what / when / which integration — FIRST_PARTY only).
- **Relevant implementation facts:** CONTRACT-REC §4 — persisted: source label, URL, quote, observed time, system
  capture time; not persisted: `externalId`, provider provenance, publication, authorization notes. CONTRACT-REC §3:
  source references must be http(s); click / tracking parameters rejected.
- **Known constraints:** R-5.2 (no scraping, browser automation, credential sharing or access-control circumvention
  prescribed or implied); non-persistence decisions above "remain in force where they apply" (R-6.2).
- **Known unresolved dependencies:** OQ-1, OQ-2; GA-Q8, GA-Q13, GA-Q15 (PENDING).
- **Options already documented:** none.
- **Evidence gaps:** no provider's terms of service, access conditions or retention limits are recorded in the
  repository. This question depends on external facts the repository does not establish.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-9

```text
Exact question:
When does an intent signal become a canonical opportunity?
```

- **Relevant existing requirements:** REQ-001 R-1.2, §7 flow, R-7.1.
- **Relevant existing decisions:** PO-DEC-001 D3, D4; E1 / E2 (cited in `intentIntake.ts`: existing Opportunity
  found, not recreated; any Search status accepted); PS-1 to PS-8 (post-save research behavior for the OD-13 push
  path).
- **Relevant implementation facts:** `intentIntake.ts` header — validate → caller's existing Search (never created)
  → Company by domain (no usable website → rejected) → Prospect per (Search, Company) → `saveSignals` in one
  transaction (OD-8) → existing Research when no CATEGORY_PLAUSIBLE determination exists (D4) →
  `runPostResearchPipelineForOwner` (`apps/worker/src/searchWorker/worker.ts:436`), "the same Opportunity / Score /
  Qualify / Personalize / Prep code runCanonicalPipeline runs". Adapters "never create Prospects / Opportunities"
  (`intentSource.ts` header).
- **Known constraints:** R-7.1 (flow is conceptual; authorizes no step).
- **Known unresolved dependencies:** OQ-3, OQ-4, OQ-7, OQ-11.
- **Options already documented:** none.
- **Evidence gaps:** REQ-001 §7 places "Intent Qualification" before "Canonical Opportunity"; no record defines
  Intent Qualification or its relation to the existing Research / Qualification steps.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-10

```text
Exact question:
What human approval is required before outreach?
```

- **Relevant existing requirements:** REQ-001 R-7.2; `MVP_SCOPE_BOUNDARY.md` §6.2 (autonomous email / Instagram /
  WhatsApp outreach and autonomous follow-ups out of scope) and C-5 (line 589: "§53 requires outreach provenance and
  an approval gate … Outreach must not be wired in any phase until the gate is restorable"); PHASE_22 scope lock
  (artifact terminal state "ready for a human to review", line 37; no sending); PHASE_23 scope lock (prepare only,
  no sending).
- **Relevant existing decisions:** none recorded as DECIDED for outreach approval. PHASE_22 / PHASE_23 are scope
  locks with the statuses in §2.
- **Relevant implementation facts:** `packages/core-outreach/src/schema.ts:41` — `APPROVAL_STATES = ['DRAFT',
  'APPROVED', 'REJECTED', 'SENT']`; `packages/core-outreach/src/channels.ts:11` — `OUTREACH_CHANNELS = ['EMAIL',
  'INSTAGRAM_DM', 'LINKEDIN', 'WHATSAPP']`. PHASE_22 line 227: no `approved_by` / `approval_state` column in the
  Phase 22 schema.
- **Known constraints:** R-7.2 (no outreach / contact authority); MVP C-5.
- **Known unresolved dependencies:** OQ-11 (individual persons as potential clients).
- **Options already documented:** none.
- **Evidence gaps:** the "§53" approval-gate requirement cited by MVP C-5 was not located in the records inspected
  here (it refers to a PRD section); its content is not reproduced.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-11

```text
Exact question:
May an individual person (not an organization) be a potential client, and if so, how does that fit the existing privacy boundary?
```

- **Relevant existing requirements:** REQ-001 §3 definition ("a person or organization"), R-3.1, R-3.3.
- **Relevant existing decisions:** DEC-003 §6 privacy boundary (DECIDED record; "unchanged and applies in full": no
  individual-level AI conversation access; no ChatGPT / Gemini / Claude prompt capture; no user search history; no
  cookies; no device, account or click identifiers; no personal email / phone harvesting; no inference that a named
  individual uses an AI platform; no consumer-level behavioural surveillance).
- **Relevant implementation facts:** `intentSource.ts:167` `PROHIBITED_PERSONAL_DATA_KEYS` and CONTRACT-REC §3
  `PROVIDER_PROHIBITED_KEYS` (includes personal names, email, phone, DOB, home address) — rejected, never stripped;
  every normalized signal declares `personalDataUsed = false`, `individualIdentityRequired = false`. Intake requires
  a Company with a usable website (`intentIntake.ts` header).
- **Known constraints:** DEC-003 §6; CONTRACT-REC §3; R-3.3 states the privacy prohibitions continue to apply.
- **Known unresolved dependencies:** OQ-7, OQ-9, OQ-10.
- **Options already documented:** none. (Source question is two-part; the second part is conditional on the first.)
- **Evidence gaps:** no record states whether the privacy boundary may be reopened; none permits it.
- **Decision:** NONE
- **Recommendation:** NONE

### OQ-12

```text
Exact question:
How do the four source classes relate to the existing source families and to INTENT-INTAKE-GOOGLE-ADS-REQ-001?
```

- **Relevant existing requirements:** REQ-001 §2, R-2.2, R-8.2; GA-REQ (whole record; PROPOSED).
- **Relevant existing decisions:** OD-1 to OD-13, Option B, Alternative I, X1, C-1 govern any FIRST_PARTY path
  unchanged (R-8.2; GA-REQ B.4, §15).
- **Relevant implementation facts:** `intentSource.ts:40–81` — three families: `PUBLIC_WEB_SEARCH` ("Google Search /
  public web: public business-level pages only"; PUBLISHED only), `AI_PLATFORM_ACQUISITION` (`AI_PLATFORM_AD`,
  `AI_REFERRAL`, `SPONSORED_PLACEMENT`; PUBLISHED or SUPPLIED_TO_US), `PUBLIC_INTENT_NOTICE` (PUBLISHED only).
  Disclosure maps PUBLISHED → PUBLIC_INTENT, SUPPLIED_TO_US → FIRST_PARTY. No family or source type for
  professional / social platforms exists. LinkedIn appears as a research-signal kind (`persist.ts:19`; migration 0029
  CHECK), a Search trigger option (`NewSearchForm.tsx:14`) and an outreach draft channel (`channels.ts:11`) — not as
  an intent source.
- **Known constraints:** R-2.2 (relationship not decided); R-8.2.
- **Known unresolved dependencies:** GA-Q0, GA-Q2 (PENDING).
- **Options already documented:** for Google Ads only, GA-REQ GA-Q2 lists, verbatim: "`AI_PLATFORM_ACQUISITION`, an
  existing public family, or a new family (which would need its own decision)". No option list exists for the four
  source classes generally.
- **Evidence gaps:** none beyond the above; the relationship is undecided by design (R-2.2).
- **Decision:** NONE
- **Recommendation:** NONE

## §4 Cross-decision dependencies

Each cell is exactly one of **DECIDED DEPENDENCY**, **PENDING DEPENDENCY**, **NO ESTABLISHED DEPENDENCY**. A
dependency is listed only where a record or code fact above connects the item to the OQ. "DECIDED DEPENDENCY" means
the OQ is constrained by an existing decision that no record permits reopening.

| Existing item | OQ-1 | OQ-2 | OQ-3 | OQ-4 | OQ-5 | OQ-6 | OQ-7 | OQ-8 | OQ-9 | OQ-10 | OQ-11 | OQ-12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Intent Intake PO-DEC-001 D1–D5, E1/E2 | NO EST. | NO EST. | DECIDED (D3, D4) | DECIDED (D5, D1) | NO EST. | DECIDED (D1) | NO EST. | NO EST. | DECIDED (D3, D4, E1, E2) | NO EST. | NO EST. | NO EST. |
| DEC-003 (Option A; §6 privacy) | NO EST. | NO EST. | DECIDED (§6) | NO EST. | NO EST. | NO EST. | DECIDED (§6) | DECIDED (ans. 6) | NO EST. | NO EST. | DECIDED (§6) | DECIDED (FIRST_PARTY AI-platform scope) |
| OD-1 to OD-13 | NO EST. | DECIDED (OD-13) | NO EST. | NO EST. | DECIDED (OD-12) | NO EST. | DECIDED (OD-4) | DECIDED (OD-10) | NO EST. | NO EST. | NO EST. | DECIDED (R-8.2) |
| Option B (OD13-M, Q1–Q12) | NO EST. | DECIDED | NO EST. | NO EST. | DECIDED (Q5/Q9) | NO EST. | NO EST. | DECIDED (Q9) | NO EST. | NO EST. | NO EST. | DECIDED (R-8.2) |
| X1 exact-result binding | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | DECIDED (R-8.2; GA-REQ §15) |
| C-1 legacy check | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | DECIDED (GA-REQ §15) |
| Alternative I (IG-1..IG-7) | NO EST. | NO EST. | NO EST. | NO EST. | DECIDED (IG-7) | NO EST. | NO EST. | DECIDED (IG-7) | NO EST. | NO EST. | NO EST. | DECIDED (R-8.2) |
| Post-save research (PS-1..PS-8) | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | DECIDED (OD-13 push path only) | NO EST. | NO EST. | NO EST. |
| GA-REQ (GA-Q0..GA-Q15) | PENDING (GA-Q0) | PENDING (GA-Q1, Q3, Q6–Q8, Q13) | NO EST. | NO EST. | PENDING (GA-Q14) | PENDING (GA-Q11) | NO EST. | PENDING (GA-Q8, Q13, Q15) | NO EST. | NO EST. | NO EST. | PENDING (GA-Q0, GA-Q2) |
| Source-adapter / provider-contract records | NO EST. | NO EST. | NO EST. | NO EST. | PENDING (replay dedup "decision required" / "known open design question") | NO EST. | NO EST. | PENDING (CONTRACT-REC §6.3 non-persisted fields open) | NO EST. | NO EST. | NO EST. | NO EST. |
| MVP scope boundary | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | PENDING (C-5 approval gate; see note) | NO EST. | NO EST. |
| Outreach scope (PHASE_22 / PHASE_23) | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | NO EST. | PENDING (see note) | NO EST. | NO EST. |

(NO EST. = NO ESTABLISHED DEPENDENCY.)

**Note on OQ-10 rows.** `MVP_SCOPE_BOUNDARY.md` is a scope record, not a decision record marked DECIDED; its C-5
constraint is classified here as **PENDING DEPENDENCY** for the purpose of the three-value scheme (the approval gate
it requires is not restorable per its own text). PHASE_22 is marked DRAFT and PHASE_23 PROPOSED in their headers,
so both are **PENDING DEPENDENCY**. (Recorded as §5 item C-4.)

**Reopening:** no inspected record explicitly permits reopening any DECIDED item above. REQ-001 R-3.3 and R-8.2 state
that the cited decisions are not reopened. IG-7 and PS-7 record that nothing was reopened.

**Open implementation questions (cannot be resolved until the relevant OQ is decided; no authority):**
provider adapter design per provider (OQ-1, OQ-2, OQ-12); whether new source families or types are needed (OQ-12);
cross-provider identity / dedup mechanism and any schema for it (OQ-5, OQ-7); intent-specific freshness / decay
mechanism (OQ-6); evidence retention per provider (OQ-8); where "Intent Qualification" sits relative to Research /
Qualification (OQ-9); outreach approval enforcement (OQ-10); whether intake's Company / website requirement applies
to individuals (OQ-11).

## §5 Conflicts / evidence gaps

Reported, not resolved. Quotations are minimal.

**Possible inconsistencies between records:**

- **C-1 (REQ-001 §0 vs code).** REQ-001 §0: "LinkedIn appears only as a research-source kind and an outreach channel
  exclusion". Code also lists `'LINKEDIN'` among `OUTREACH_CHANNELS` (`packages/core-outreach/src/channels.ts:11`,
  draft channel) and in `TRIGGER_OPTIONS` (`apps/web/src/components/client-finder/NewSearchForm.tsx:14`). PHASE_22
  excludes LinkedIn API / messaging sending (lines 265–267). The §0 statement is narrower than the code facts.
- **C-2 (REQ-001 R-7.2 / PREP-001 vs PHASE_23 status).** REQ-001 R-7.2: outreach and follow-up "remain under their
  existing governance (e.g. PHASE_22 / PHASE_23 scope locks)". PHASE_23 header: "PROPOSED — NOT YET APPROVED FOR
  IMPLEMENTATION". PHASE_22 header: "DRAFT — SCOPE LOCK, PRE-IMPLEMENTATION", while PHASE_23 line 5 states "Phase 22
  CLOSED".
- **C-3 (REQ-001 R-6.2 citation precision).** REQ-001 R-6.2 cites "OD-13 Q9". Q9 is defined in
  INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (OD13-M Q9), not in DESIGN-001's OD-13 entry. PREP-001 §5 repeats "OD-13
  Q9". The reference is resolvable but not to the record its label suggests.
- **C-4 (OQ-10 dependency classification).** `MVP_SCOPE_BOUNDARY.md` C-5 requires an approval gate but records it
  as not currently restorable; no DECIDED outreach-approval record exists (see §4 note).
- **C-5 (overlapping pending questions).** OQ-12 (REQ-001) and GA-Q2 (GA-REQ) both ask how Google-related sources
  map to the existing families; OQ-1 overlaps GA-Q0; OQ-5 overlaps GA-Q14; OQ-6 overlaps GA-Q11; OQ-8 overlaps GA-Q15.
  Both sets are PENDING in separate records; no record states which governs if answers differ.
- **C-6 (dedup status wording differs by record).** ADAPTER-REC: "decision required"; CONTRACT-REC: "KNOWN OPEN
  DESIGN QUESTION"; DESIGN-001 OD-12 (DECIDED): cross-batch duplicates "accepted as a known limitation" within the
  FIRST_PARTY design. The records differ in scope; none addresses cross-provider duplicates (OQ-5).
- **C-7 (REQ-001 §3 vs intake identity rule).** REQ-001 §3 defines a signal source as "a person or organization";
  current intake rejects an event without a usable company website, and the provider contract sets
  `individualIdentityRequired = false` and rejects personal-name keys. This is the subject of OQ-11 and is recorded,
  not resolved.
- **C-8 (governing-record list scope).** PREP-001 §1 does not list `MVP_SCOPE_BOUNDARY.md` or the DEC-003
  preparation record, both hashed in REQ-001 §0. Both hashes are unchanged (§1). No content conflict.

No contradiction was found between REQ-001 §10 and the OQ wording in PREP-001 or OQ-DEC-001 (all twelve verbatim).

**Evidence gaps (repository does not establish):**

- OQ-2 and OQ-8 depend on external provider facts (APIs, data, terms, retention) that the repository does not
  record. Per the hard-stop rule, nothing is inferred; the Product Owner session would need external evidence that
  this preparation is not authorized to obtain.
- OQ-1: no provider has any recorded access approval.
- OQ-3 / OQ-9: no definition of "sufficient evidence" or of "Intent Qualification".
- OQ-10: the PRD "§53" approval-gate text was not located in the inspected records.

## §6 Decision-session boundaries

The Product Owner is being asked **only** to decide OQ-1, OQ-2, OQ-3, OQ-4, OQ-5, OQ-6, OQ-7, OQ-8, OQ-9, OQ-10,
OQ-11 and OQ-12, as worded in REQ-001 §10, and to record answers in CLIENT-INTENT-DISCOVERY-OQ-DEC-001.

The session does not decide, and an answer to any OQ does not imply: GA-Q0 to GA-Q15; reopening of D1–D5, DEC-003,
OD-1 to OD-13, Option B, Alternative I, PS-1 to PS-8, X1 or C-1; provider selection beyond what the PO states;
provider API access; authentication; credentials or key registration; integration naming; provider configuration;
scraping or other access mechanisms; evidence storage; schema or migrations; deduplication, freshness or
opportunity-creation implementation; runtime architecture or wiring; outreach; validation; deployment. Each of these
needs its own record (REQ-001 R-9.1).

## §7 Authority state

```text
Implementation authorization: NONE
Provider-call authorization: NONE
Runtime-wiring authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
```

## §8 Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```
