# CLIENT INTENT DISCOVERY

## Open Questions OQ-1 to OQ-12 — Product Owner Decision

**Decision ID:** CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001
**Date:** 2026-09-30
**Type:** Product Owner decision (product policy only). Grants no execution authority.
**Decision maker:** Product Owner, under delegated authority supplied in the working session on 2026-09-30 ("Act as
the Product Owner for the Client Intent Discovery requirement"), limited to OQ-1 to OQ-12 as worded in
CLIENT-INTENT-DISCOVERY-REQ-001 §10. No person's name is recorded (same convention as DESIGN-001 §14,
INTENT-INTAKE-OD13-INGRESS-DEC-001).
**Convention:** separate decision record; the requirement, preparation records and decision log are left unchanged.

```text
Decision status: PARTIALLY DECIDED — 9 DECIDED, 3 PENDING (external/provider evidence required)
DECIDED: OQ-3, OQ-4, OQ-5, OQ-6, OQ-7, OQ-9, OQ-10, OQ-11, OQ-12
PENDING: OQ-1, OQ-2, OQ-8
Existing decisions reopened: NONE
Implementation authorization: NONE
```

> **This record decides product policy only. It does not claim that any provider exposes any data or API, selects
> no provider, and authorizes no implementation, provider call, external HTTP, database access, schema change,
> runtime wiring, integration naming, key registration, validation, outreach / contact, deployment, scraping,
> browser automation, credential sharing or bypass of any provider access control.**

Labels used in §2: **Facts** (repository evidence, from the session-preparation artifact); **Existing DECIDED
constraints** (cited by ID, not reopened); **Evidence gaps** (unresolved); **PO decision** (binding product policy
from this record).

---

## §1 Governance

### 1.1 Records

| Role | Path | ID | sha256 |
|---|---|---|---|
| Source requirement | `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | CLIENT-INTENT-DISCOVERY-REQ-001 | `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` |
| OQ preparation | `requirement/CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-PREP-001 | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| OQ decision log | `requirement/CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |
| Session preparation (evidence pack) | `requirement/CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001 | `4506a050d215805e483fbaf07c2f56a57a43655f80b47808472cbe94a62ebe44` |

The decision log (OQ-DEC-001) is not modified by this record and still shows all twelve OQs as PENDING. This record
is the authoritative statement of the outcome; updating the log is a separate step.

### 1.2 Baseline (verified before writing)

| Item | Value |
|---|---|
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 245 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` (= REQ-001 §0 = SESSION-PREP-001 §1) |

### 1.3 Governing-record hashes (all recomputed; all equal to SESSION-PREP-001 §1)

| Record | ID | sha256 |
|---|---|---|
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 (D1–D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION_PREPARATION.md` | DEC-003 preparation | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 (OD-1..OD-13) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (Option B) | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION.md` | INTENT-INTAKE-OD13-INGRESS-DEC-001 (Alternative I) | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_POST_SAVE_RESEARCH_DECISION.md` | INTENT-INTAKE-OD13-POSTSAVE-DEC-001 (PS-1..PS-8) | `6ffd207561c2db580137ddb030df43f072359b2390ad75276ec918fe9b04b16d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_EXACT_RESULT_BINDING_DECISION.md` | INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 (X1) | `c67d09a841187dad0854623d50958543f1d8aaa89454c48addf2c298e2832637` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_LEGACY_AUTHENTICITY_CHECK_DECISION.md` | INTENT-INTAKE-OD13-LEGACY-P3-DEC-001 (C-1) | `55dd133e5b32a6932e4d68e7bc3e3779c9cffc11e100112d54ee7482aa0e1c95` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 (PROPOSED) | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |
| `MVP_SCOPE_BOUNDARY.md` | — | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |
| `PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md` | — | `6b59aa69bb8cd5a9b29a135402d30b682cf2960357f68bc2b05122f88e546294` |
| `PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md` | — | `176eff2b5532067a3dda9dbf9491470a3c30fec5352cb1507f6c6a74c5bec714` |

### 1.4 Authority state

See §4. Every execution authority is NONE.

### 1.5 Decision principles applied

- Only evidence in SESSION-PREP-001 and the records it cites is used. No web search, provider call or external
  evidence was used.
- No existing DECIDED record is reopened. Where a decision below touches the subject of an existing decision, it
  applies that decision unchanged.
- No provider capability, API availability, term of service or retention limit is assumed. Questions whose answer
  depends on such facts are left PENDING.
- Where a choice existed, the option that preserves existing behavior and existing constraints was taken; any
  broader option would require a formal reopening or external evidence that is not in the repository.

---

## §2 OQ Decisions

### OQ-1

```text
Question:
Which providers will be authorized first?
```

- **Status:** `PENDING — external/provider evidence required`
- **Selected answer:** NONE
- **Rationale:** choosing which provider to authorize first depends on which providers can legitimately supply
  business-level intent evidence (OQ-2) and under what access and retention terms (OQ-8). The repository establishes
  neither. Selecting a provider now would rest on an assumed capability, which REQ-001 R-2.1 forbids.
- **Evidence basis (Facts):** `INTENT_INTEGRATION_REGISTRATIONS` is empty (`apps/web/src/server/
  intentIntegrationRegistry.ts:96`); intent-source code imports no provider SDK, HTTP client or credential; ADAPTER-REC
  and CONTRACT-REC record "no live provider"; Google Places is configured only as a business-discovery provider, not
  an intent source (SESSION-PREP-001 §3 OQ-1).
- **Existing DECIDED constraints:** none decides this. R-2.1, R-5.3, R-9.1 item 1 (requirement constraints).
- **Affected existing decisions:** none. GA-REQ GA-Q0 remains PENDING and is not answered.
- **Evidence required for a future session:** for each candidate provider (Google, ChatGPT / AI assistants, LinkedIn,
  others): (1) whether an official, documented access route exists that returns business-level service-need
  statements; (2) whether the product's use is permitted by that provider's terms; (3) access prerequisites
  (account type, approval, cost); (4) the answers to OQ-2 and OQ-8 for that provider.
- **Unresolved limitations:** overlaps GA-Q0 (SESSION-PREP-001 §5 C-5).

### OQ-2

```text
Question:
What provider / API capabilities are actually available?
```

- **Status:** `PENDING — external/provider evidence required`
- **Selected answer:** NONE
- **Rationale:** this is a question of external fact, not of product policy. The repository does not record the
  capabilities of any provider for intent discovery; the Product Owner cannot decide a fact.
- **Evidence basis (Facts):** SESSION-PREP-001 §3 OQ-2 and §5 ("the repository does not establish the API or data
  capabilities of Google, ChatGPT, LinkedIn or any other provider for intent discovery"); GA-REQ §2 A.4 and §3
  ("[NOT ESTABLISHED]").
- **Existing DECIDED constraints:** OD-13 and Option B require, for any FIRST_PARTY push path, a provider-authenticity
  mechanism (Ed25519 signing under Option B). This is a requirement a provider must meet, not evidence that any does.
- **Affected existing decisions:** none.
- **Evidence required for a future session:** per provider, from the provider's official documentation or a
  separately authorized inquiry: (1) the API / product / endpoint; (2) the data fields returned and whether a
  verbatim business-level need statement, business identity (name, website) and source reference are included;
  (3) whether results are published (PUBLIC_INTENT) or supplied to us with upstream authorization (FIRST_PARTY);
  (4) authentication method; (5) quotas, rate limits, cost; (6) whether push delivery with Ed25519 signing is
  supported (Option B); (7) availability of an observed / expressed timestamp. Obtaining this evidence requires its
  own authority; this record grants none.
- **Unresolved limitations:** overlaps GA-Q1, GA-Q3, GA-Q6–GA-Q8, GA-Q13.

### OQ-3

```text
Question:
What constitutes sufficient evidence of buying intent?
```

- **Status:** `DECIDED`
- **Selected answer:** A Client Intent Signal is sufficient evidence of buying intent only when **all** of the
  following hold for the source item itself:
  1. **Verbatim statement** — the item contains a statement, expressed by the potential client, of a current need
     for a service; the statement appears verbatim in the source evidence (no inferred, summarized or model-generated
     need counts as evidence).
  2. **Business-level attribution** — the statement is attributable to an identifiable organization through identity
     supplied by the source (see OQ-7, OQ-11); identity is never inferred from a URL or from personal data.
  3. **Traceability** — the item carries a source reference and an observed time, so that extracted intent remains
     traceable to and distinguishable from the original evidence (R-3.2).
  4. **Privacy compliance** — the item passes the existing privacy screen (DEC-003 §6; CONTRACT-REC §3).

  An item failing any condition is not a Client Intent Signal (existing outcomes `NO_INTENT_EVIDENCE`,
  `UNATTRIBUTED` or `REJECTED` apply). A sufficient signal proves only that the need was observed; it does not by
  itself establish that the need matches the user's offerings or that an opportunity exists — that remains the
  existing Research (D4) and ServiceProfile trigger (D3) path.
- **Rationale:** this is the evidence rule the repository already applies to the three existing source families
  (verbatim business-level statement; attribution; provenance; privacy screen). Applying the same rule to every new
  source class keeps signal meaning provider-neutral (R-4.1, R-4.3) and requires no reopening.
- **Evidence basis (Facts):** `intentSourceProviderContract.ts` header (verbatim-statement, `NO_INTENT_EVIDENCE`,
  `UNATTRIBUTED`); `intentSignal.ts` header (signal proves only observation; D4); `intentIntake.ts` header (D3);
  CONTRACT-REC §3–§4.
- **Existing DECIDED constraints applied unchanged:** D3, D4 (PO-DEC-001); DEC-003 §6.
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** whether a particular provider's data can satisfy conditions 1–3 is evidence-dependent
  (OQ-2). How "requested service" is matched against user-defined offerings (R-1.3) beyond D3 is not decided here.

### OQ-4

```text
Question:
How should intent confidence be determined?
```

- **Status:** `DECIDED`
- **Selected answer:** Intent confidence is determined **centrally by the system, never by a provider or source**,
  using the existing D5 rule unchanged: fixed by signal kind — `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90`, OBSERVED,
  not caller-overridable — for signals from every source class and provider. No provider-specific, source-class-
  specific or model-assigned confidence is introduced. Any provider-supplied confidence, kind or classification is
  rejected, as today.
- **Rationale:** D5 is DECIDED and REQ-001 R-3.3 states it continues to apply; no record permits reopening it. A
  single central rule keeps confidence provider-neutral (R-4.1, R-4.3).
- **Evidence basis (Facts):** `intentSignal.ts` `INTENT_SIGNAL_CONFIDENCE`; ADAPTER-REC (source-assigned values
  rejected); GA-REQ B.1.
- **Existing DECIDED constraints applied unchanged:** D5; D1 (`SOURCE_WEIGHT` 0 for intake kinds).
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** "Confidence / evidence quality" (R-3.1) is therefore expressed only through signal kind
  and the OQ-3 sufficiency rule. Any finer-grained evidence-quality measure would require a formal reopening of D5
  by a separate record.

### OQ-5

```text
Question:
How should duplicate intent across providers be handled?
```

- **Status:** `DECIDED`
- **Selected answer:**
  1. **Evidence is kept, not merged.** Each provider's observation is retained as its own append-only signal with its
     own provenance; no provider's evidence is discarded, overwritten or merged into another's at intake.
  2. **Consolidation is at the client level.** Signals about the same potential client resolve to one Company /
     Prospect by the OQ-7 identity rule, and an existing Opportunity is found, not recreated (E1). Duplicate intent
     across providers therefore never creates a second Opportunity for the same Prospect.
  3. **No new deduplication mechanism is decided.** In-batch `DUPLICATE_IN_BATCH` is unchanged; the persistence-level
     replay-duplicate limitation stands as accepted in OD-12. Any cross-provider or persistence-level deduplication
     mechanism (store, key, schema) requires separate design and authorization.
- **Rationale:** preserves traceability to every source (R-6.1) and existing identity / E1 behavior; D1 sets intake
  weights to 0, so repeated signals do not inflate scores. Requires no reopening of OD-12, IG-7 or Q9.
- **Evidence basis (Facts):** `intentIntake.ts` header (append-only; Company by domain; Prospect per (Search, Company);
  E1); `intentSourceProviderContract.ts` header (in-batch dedup only); OD-12.
- **Existing DECIDED constraints applied unchanged:** OD-12; IG-7; OD13-M Q5 / Q9; E1; D1.
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** replay / persistence duplicates remain a known limitation (ADAPTER-REC "decision
  required"; CONTRACT-REC "known open design question"; SESSION-PREP-001 §5 C-6 — not resolved here). Provider-side
  duplicate identification (GA-Q14 and equivalents) is evidence-dependent.

### OQ-6

```text
Question:
How should stale intent decay?
```

- **Status:** `DECIDED`
- **Selected answer:**
  1. Intent age is measured from the signal's **observed time** (`observedAt`) as supplied with the source evidence.
  2. Intent signals decay under the **single existing platform decay rule** (full weight up to 30 days, linear to zero
     at 180 days; `scoring.ts` `decayFactor`). No second, intent-specific decay curve is introduced.
  3. Decay never deletes, edits or supersedes evidence; stale signals remain as history (append-only).
  4. How a provider establishes the observed / expressed time is provider-specific (R-4.2) and is decided per
     provider.
- **Rationale:** reuses the one existing decay rule, avoiding divergent curves (as `prospectScore.ts` already does).
  Because D1 sets `SOURCE_WEIGHT` to 0 for intake kinds, this decision changes no current score; D1 is not reopened.
- **Evidence basis (Facts):** `packages/core-acquisition/src/scoring.ts:60–85`; `prospectScore.ts` (reuses
  `decayFactor`); `intentIntake.ts` header (each signal keeps its event's `observedAt`).
- **Existing DECIDED constraints applied unchanged:** D1; OD13-M Q5 (envelope freshness at receipt — a separate
  concept, unchanged).
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** the persisted model does not distinguish "when expressed" from "when observed" (R-3.1;
  CONTRACT-REC §4); providing that distinction would need separate design. `scoring.ts` is modified in the working
  tree relative to HEAD (SESSION-PREP-001 §1); the constants cited are as of the recorded fingerprint.

### OQ-7

```text
Question:
How should the same prospective client appearing across Google, ChatGPT, LinkedIn and other providers be unified?
```

- **Status:** `DECIDED`
- **Selected answer:**
  1. A prospective client is unified across providers **only by the existing organization identity anchor**: the
     normalized business website domain supplied by the source (existing `normalizeCandidate` +
     `findOrCreateByDomain`), within the owning user's Search.
  2. **No merging across Searches** (existing behavior).
  3. **No probabilistic or inferred matching**: identity is never inferred from a URL, company-name similarity,
     personal names, email, phone or any personal identifier.
  4. A signal without source-supplied, usable business identity is not unified; existing rejection / `UNATTRIBUTED`
     outcomes apply.
  5. For FIRST_PARTY signals, OD-4 (integration-supplied `business_id`, verbatim) continues to apply unchanged.
- **Rationale:** matches existing identity behavior and the privacy boundary; keeps the downstream model independent
  of any provider's identifiers (R-4.1).
- **Evidence basis (Facts):** `intentIntake.ts` header; `intentSourceProviderContract.ts` header ("identity is never
  inferred from the URL"); CONTRACT-REC §3 (personal-name keys rejected).
- **Existing DECIDED constraints applied unchanged:** DEC-003 §6; OD-4.
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** clients without a usable website cannot be unified or ingested under this rule;
  whether a given provider supplies a business website is evidence-dependent (OQ-2).

### OQ-8

```text
Question:
What provider-specific access and retention constraints apply?
```

- **Status:** `PENDING — external/provider evidence required`
- **Selected answer:** NONE
- **Rationale:** the question asks for provider-specific constraints, which are set by each provider's terms and
  access conditions. None is recorded in the repository.
- **Evidence basis (Facts):** SESSION-PREP-001 §3 OQ-8 and §5 (no provider terms, access conditions or retention
  limits recorded).
- **Existing DECIDED constraints that apply to every provider meanwhile (cited, not decided here):** REQ-001 R-5.1–R-5.3
  (authorized sources only; no scraping, browser automation, credential sharing or access-control circumvention);
  OD-10 (`basis` / `reference` not persisted); OD13-M Q9 (signature, raw signed payload, key identifier and
  verification outcome not persisted); IG-7; DEC-003 answer 6 (FIRST_PARTY authorization-evidence retention);
  CONTRACT-REC §3–§4 (privacy screen; persisted provenance limited to label, URL, quote, observed time, system
  capture time).
- **Affected existing decisions:** none.
- **Evidence required for a future session:** per provider: (1) terms of service / developer policy governing use of
  the data for business prospecting; (2) permitted storage and retention period of retrieved content (including
  verbatim quotes and source URLs); (3) attribution / display requirements; (4) restrictions on combining data with
  other sources; (5) deletion obligations; (6) any personal-data restrictions relevant to DEC-003 §6.
- **Unresolved limitations:** overlaps GA-Q8, GA-Q13, GA-Q15; CONTRACT-REC §6.3 (non-persisted provenance fields)
  remains open.

### OQ-9

```text
Question:
When does an intent signal become a canonical opportunity?
```

- **Status:** `DECIDED`
- **Selected answer:**
  1. An intent signal becomes a canonical opportunity **only through the existing intake and pipeline path**, never
     directly: sufficient evidence (OQ-3) → attributable organization (OQ-7) → Company / Prospect in the owning user's
     existing Search → signals saved → existing Research where required (D4) → the existing post-research pipeline
     (`runPostResearchPipelineForOwner`), which finds or creates the Opportunity exactly as it does today (E1).
  2. **"Intent Qualification"** in REQ-001 §7 is defined as the OQ-3 sufficiency, OQ-7 attribution and privacy checks
     performed at normalization and intake. It is not a new qualification stage and does not replace or precede the
     existing Research / Qualification steps.
  3. Providers, adapters and source integrations never create Prospects, Opportunities, determinations, offers or
     outreach (existing rule).
- **Rationale:** reuses the one canonical pipeline (R-1.2, R-7.1) with no parallel path and no new behavior.
- **Evidence basis (Facts):** `intentIntake.ts` header; `apps/worker/src/searchWorker/worker.ts:436`;
  `intentSource.ts` header ("Adapters never persist, never create Prospects / Opportunities …").
- **Existing DECIDED constraints applied unchanged:** D3, D4, E1, E2; OD-8; PS-1 to PS-8 for the OD-13 push path.
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** requires a caller-owned existing Search (existing G2 behavior); how discovered signals
  are bound to a user's Search for pull-style providers is not decided (cf. GA-Q12; IG-5 covers push ingress only).

### OQ-10

```text
Question:
What human approval is required before outreach?
```

- **Status:** `DECIDED`
- **Selected answer:**
  1. **Explicit human approval by the owning user is required for every individual outreach message or contact**
     arising from a Client Intent Discovery opportunity, before it is sent or made. There is no bulk, implicit,
     default or time-based approval.
  2. **No autonomous outreach or follow-up**: the system may at most prepare drafts whose terminal state is "ready for
     human review" (as in PHASE_22); sending remains a human action.
  3. Approval of a message does not create outreach authority. No outreach may be wired until the approval gate
     required by `MVP_SCOPE_BOUNDARY.md` C-5 is enforceable, and until outreach is separately authorized.
- **Rationale:** consistent with MVP §6.2 (autonomous outreach and follow-ups out of scope), MVP C-5 (approval gate
  required before outreach wiring), PHASE_22's human-review terminal state, and REQ-001 R-7.2 (no outreach authority).
- **Evidence basis (Facts):** `MVP_SCOPE_BOUNDARY.md` §6.2 and line 589 (C-5); PHASE_22 line 37;
  `packages/core-outreach/src/schema.ts:41` (`APPROVAL_STATES` includes `APPROVED`).
- **Existing DECIDED constraints applied unchanged:** none recorded as DECIDED for outreach approval; the MVP scope
  boundary and PHASE_22 / PHASE_23 scope locks are applied as written, not modified.
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** SESSION-PREP-001 §5 C-2 (PHASE_22 header DRAFT; PHASE_23 PROPOSED) and C-4 (C-5 gate
  not currently restorable) are not resolved by this record; the PRD "§53" text cited by C-5 was not located. This
  decision is a product policy; its enforcement mechanism is not designed or authorized.

### OQ-11

```text
Question:
May an individual person (not an organization) be a potential client, and if so, how does that fit the existing privacy boundary?
```

- **Status:** `DECIDED`
- **Selected answer:**
  1. **No — not under the current privacy boundary.** A potential client under Client Intent Discovery must be an
     identifiable **organization or business**, represented only by business-level identity supplied by the source
     (including a sole trader or freelancer acting in a business capacity and identified by a business website, not
     by personal identifiers).
  2. A **private individual acting in a personal capacity** is not a potential client under this requirement.
  3. The second part of the question ("how does that fit the existing privacy boundary") therefore does not arise:
     the existing boundary (DEC-003 §6; CONTRACT-REC §3) applies unchanged. Admitting private individuals would
     require a formal reopening of that boundary by a separate record; none is made here.
- **Rationale:** DEC-003 §6 is DECIDED and prohibits inference about named individuals and personal-identifier
  harvesting; current intake requires a company website and every normalized signal declares
  `individualIdentityRequired = false`. Deciding "yes" would require reopening a DECIDED boundary.
- **Evidence basis (Facts):** SESSION-PREP-001 §3 OQ-11; `intentSource.ts:167`; CONTRACT-REC §3; `intentIntake.ts`
  header.
- **Existing DECIDED constraints applied unchanged:** DEC-003 §6.
- **Affected existing decisions:** none reopened.
- **Unresolved limitations:** resolves SESSION-PREP-001 §5 C-7 at product-policy level: REQ-001 §3's "a person or
  organization" is read, for potential-client eligibility, as an organization (or a person acting as a business).
  REQ-001 itself is not amended.

### OQ-12

```text
Question:
How do the four source classes relate to the existing source families and to INTENT-INTAKE-GOOGLE-ADS-REQ-001?
```

- **Status:** `DECIDED`
- **Selected answer:**
  1. **Source classes are a product-level classification; source families are the intake contract.** The four REQ-001
     source classes do not replace, rename or alter the three existing families (`PUBLIC_WEB_SEARCH`,
     `AI_PLATFORM_ACQUISITION`, `PUBLIC_INTENT_NOTICE`).
  2. **Mapping is per provider.** Each provider integration's own provider-specific requirement and authorization
     states which existing family and source type its results map to. Where no existing family fits (e.g. there is
     currently none for professional / social platforms), a new family requires its own separate decision; none is
     created here.
  3. **Signal kind continues to derive from disclosure**, not from source class: PUBLISHED → PUBLIC_INTENT;
     SUPPLIED_TO_US → FIRST_PARTY, and any FIRST_PARTY path is governed by OD-1 to OD-13, Option B, Alternative I,
     X1 and C-1 unchanged (R-8.2).
  4. **INTENT-INTAKE-GOOGLE-ADS-REQ-001 is a provider-specific requirement under REQ-001** (R-4.2). It remains
     PROPOSED; GA-Q0 to GA-Q15 remain PENDING and are not answered here. Google Ads' family (GA-Q2) is not decided.
  5. **Precedence for overlaps (SESSION-PREP-001 §5 C-5):** these OQ decisions set provider-neutral product policy that
     any GA-Q answer must comply with; GA-Qs decide only Google-Ads-specific facts and choices.
- **Rationale:** keeps provider-neutrality (R-4.1–R-4.3) and the existing intake contract intact; defers every
  provider-specific mapping to the evidence-dependent, provider-specific record where it belongs.
- **Evidence basis (Facts):** `intentSource.ts:40–81`; GA-REQ §2–§3, §14, §15; REQ-001 R-2.2, R-8.2.
- **Existing DECIDED constraints applied unchanged:** OD-1 to OD-13; Option B; IG-1 to IG-7; X1; C-1; DEC-003.
- **Affected existing decisions:** none reopened. GA-REQ (PROPOSED, not a decision) is not modified.
- **Unresolved limitations:** no existing family covers professional / social platforms; LinkedIn has no intent-source
  path (SESSION-PREP-001 §5 C-1).

---

## §3 Decision Summary

| OQ | Status | Selected Answer | Existing Decision Reopened? |
| -- | ------ | --------------- | --------------------------- |
| OQ-1 | PENDING — external/provider evidence required | NONE | No |
| OQ-2 | PENDING — external/provider evidence required | NONE | No |
| OQ-3 | DECIDED | Verbatim, business-attributable, traceable, privacy-compliant statement of need in the source item; matching / opportunity via existing D3 / D4 | No |
| OQ-4 | DECIDED | Central, fixed by kind per D5 (70 / 90); no provider- or class-specific confidence | No |
| OQ-5 | DECIDED | Keep each provider's evidence; consolidate at client level (OQ-7, E1); no new dedup mechanism (OD-12 stands) | No |
| OQ-6 | DECIDED | Age from `observedAt`; single existing decay rule (30 / 180 days); evidence never deleted | No |
| OQ-7 | DECIDED | Existing domain-based organization identity within a Search; no inferred or personal-data matching | No |
| OQ-8 | PENDING — external/provider evidence required | NONE | No |
| OQ-9 | DECIDED | Only via existing intake → Research → post-research pipeline; "Intent Qualification" = OQ-3 / OQ-7 / privacy checks | No |
| OQ-10 | DECIDED | Explicit per-message human approval by owning user; no autonomous outreach; no outreach until C-5 gate and separate authorization | No |
| OQ-11 | DECIDED | No private individuals; organizations / persons acting as a business only; privacy boundary unchanged | No |
| OQ-12 | DECIDED | Classes ≠ families; per-provider mapping in provider-specific records; kind from disclosure; GA-REQ subordinate, GA-Qs pending | No |

**Conflicts from SESSION-PREP-001 §5:** C-5 is addressed by OQ-12 item 5; C-7 by OQ-11. C-1, C-2, C-3, C-4, C-6 and C-8
remain **unresolved** and are not resolved by this record.

## §4 Authority Boundary

```text
Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Scraping/browser automation authority: NONE
```

This decision record grants no execution authority. A decided OQ is product policy only; each implementation,
provider integration, provider call, evidence-gathering activity, schema change, wiring, validation, outreach or
deployment requires its own separate record (REQ-001 R-9.1).

## §5 Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Dependency changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Web searches: 0
Runtime wiring: 0
Integration / key registration: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

```text
CLIENT INTENT DISCOVERY PRODUCT OWNER DECISION SESSION: COMPLETE / PENDING EVIDENCE
ALL EXECUTION AUTHORITIES: NONE
```
