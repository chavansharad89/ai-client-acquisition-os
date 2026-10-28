# CLIENT INTENT DISCOVERY — CODE-TO-REQUIREMENT GAP AUDIT (GATE 1 / G-X1)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-AUDIT-001
**Date:** 2026-10-01
**Type:** READ-ONLY AUDIT / EVIDENCE RECORD. Not a decision record, not an implementation plan, not an implementation
authorization.
**Performs:** READINESS-001 §8 Gate 1 ("code-to-requirement gap analysis", G-X1) only.
**Governing baseline:** CLIENT-INTENT-DISCOVERY-PROVIDER-NEUTRAL-MVP-READINESS-001 (sha256 `a2aec7c6…`) and
CLIENT-INTENT-DISCOVERY-REQ-001 post-Amendment-2 (sha256 `ccf88646…`).

> **This record reports what the repository code does. It makes no Product Owner decision, resolves none of PD-1 to
> PD-12, selects / recommends / authorizes / rejects no provider, recommends no implementation approach, and does not
> declare the MVP ready. No test was run (validation authority: NONE).**

Status labels (code evidence only): `ESTABLISHED` (behavior is present in the code paths traced); `PARTIALLY
ESTABLISHED` (some but not all of the requirement is present); `NOT ESTABLISHED` (not present in the code traced);
`NOT APPLICABLE`.

---

## §1 Baseline and repository state (verified before inspection)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`; untracked: OQ-1-2-8 decision, provider finalization decision, READINESS-001, RECON-002 (all under `requirement/`) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty: code at HEAD) |
| Canonical requirement sha256 | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` (matches) |
| READINESS-001 sha256 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` (matches) |
| Other governance records | OQ-PO-DEC-001 `152a9ec9…`, OQ-1-2-8-PO-DEC-001 `21c81585…`, PROVIDER-EVIDENCE-001 `2387838f…`, PROVIDER-FINALIZATION-DEC-001 `adcb7f53…`, RECON-001 `a5973f4f…`, RECON-002 `3579a046…`, GA-REQ `928f157d…` — unchanged |

All code citations below refer to HEAD `2c2543b` (no working-tree code changes).

## §2 Files inspected

Read (full, or the cited ranges):

| File | Lines | Read |
|---|---|---|
| `packages/core-research/src/intentSignal.ts` | 437 | Full |
| `packages/core-research/src/intentSource.ts` | 388 | Full |
| `packages/core-research/src/intentSourceAdapters.ts` | 149 | Full |
| `packages/core-research/src/intentSourceProviderContract.ts` | 894 | Full |
| `apps/worker/src/searchWorker/intentIntake.ts` | 173 | Full |
| `packages/core-research/src/pgRepository.ts` | 22–110, 120–136, 180–205 | Ranges |
| `packages/core-acquisition/src/scoring.ts` | 40–100 | Range |
| `packages/core-acquisition/src/offer.ts` | 17–53, 76–87 | Ranges |
| `packages/core-opportunity/src/adapters.ts` | 1–80 | Range |
| `packages/core-opportunity/src/service.ts` | 115–150 | Range |
| `apps/worker/src/searchWorker/worker.ts` | 436–470 | Range |
| `apps/web/src/server/intentIngress.ts` | 1–60 | Range |
| `packages/core-outreach/src/approval.ts` | 1–60 | Range |

Located by targeted search only (callers / references): `apps/web/src/server/intentIngressIntake.ts:15–58`,
`apps/web/src/server/intentIntegrationRegistry.ts:8–62`, `apps/worker/src/searchWorker/index.ts:9`,
`packages/core-research/src/index.ts:246–248`, `packages/core-acquisition/src/prospectScore.ts:179`,
`packages/core-acquisition/src/staleness.ts:39`, `packages/core-outreach/src/schema.ts:41`.
Test files exist (`intentSignal.test.ts`, `intentSource.test.ts`, `intentSourceProviderContract.test.ts`,
`intentIngress*.test.ts`, `tests/integration/intent-intake.integration.test.ts`) — **not read, not run**.

## §3 Requirement sections inspected

REQ-001 §3 (R-3.1–R-3.3), §3A (R-3A.1–R-3A.3), §4 (R-4.1–R-4.3), §5, §6 (R-6.1–R-6.2), §7, §8, §13 (R-13.1–R-13.30);
OQ-PO-DEC-001 OQ-3..OQ-7, OQ-9..OQ-12; OQ-1-2-8-PO-DEC-001; READINESS-001 §4–§11 (gaps G-S1, G-S3, G-E1, G-E2, G-O1,
G-Q1, G-Q2, G-P1, G-A1, G-A2, G-X1; caveats A1, A2).

## §4 Code-to-requirement evidence matrix

| # | Requirement | Governing ref | Code status | Evidence (§5 ref) |
|---|---|---|---|---|
| 1 | Provider-neutral signal representation (kind, field, verbatim quote, source URL, label, observed time) | R-3.1, R-13.10 | ESTABLISHED | E1, E2 |
| 2 | Kind limited to `PUBLIC_INTENT` / `FIRST_PARTY` | OQ-12 item 3 | ESTABLISHED | E1 |
| 3 | Kind derived centrally from disclosure (PUBLISHED → PUBLIC_INTENT; SUPPLIED_TO_US → FIRST_PARTY) | OQ-12 item 3 | ESTABLISHED | E3 |
| 4 | Confidence fixed by kind (70 / 90); classification OBSERVED; caller / provider kind, confidence, classification rejected | OQ-4, D5, R-3.3 | ESTABLISHED | E2, E4, E9 |
| 5 | Verbatim evidence (statement must appear in the source text) | OQ-3 item 1 | ESTABLISHED for PUBLIC_WEB_SEARCH and PUBLIC_INTENT_NOTICE; PARTIALLY ESTABLISHED for AI_PLATFORM_ACQUISITION (business-stated statement + `STATED_BY_BUSINESS` derivation, no text-containment check) | E10, E11 |
| 6 | No intent → `NO_INTENT_EVIDENCE`; no business identity → `UNATTRIBUTED`; identity never inferred from URL | OQ-3, OQ-7 | ESTABLISHED (provider-contract path) | E11 |
| 7 | Traceability: source reference + observed time required | OQ-3 item 3, R-6.1 | ESTABLISHED | E2, E5 |
| 8 | Extracted intent distinguishable from evidence (R-3.2) | R-3.2 | PARTIALLY ESTABLISHED — the stored claim **is** the quote (`signal` = `sourceQuote`); no separate extracted-intent value exists | E2 |
| 9 | Expressed time vs observed time (G-S1) | R-3.1 | NOT ESTABLISHED — one `observedAt`; contract text treats it as "published / observed" | E2, E12 |
| 10 | Source / provider identity persisted (G-S3) | R-3.1, R-6.1 | PARTIALLY ESTABLISHED — family + type persisted as `source_label`; `externalId`, `capturedAt`, provider provenance (`integration`, `retrieval`), `publication` not persisted | E5, E6, E12 |
| 11 | Evidence classes: search intent / published intent / inferred business need kept distinct (G-E1, G-E2) | R-3A.1, R-13.4 | PARTIALLY ESTABLISHED — published intent represented; no representation of search intent or inferred business need (both are excluded, not represented) | E1, E7, E10 |
| 12 | Privacy screen: individual-level keys rejected (search history, queries, prompts, conversations, cookies, device / ad / click IDs, personal names, email, phone) | DEC-003 §6, R-3A.3, R-13.17, R-13.21 | ESTABLISHED (key-based, rejected not stripped) | E7, E9 |
| 13 | Click / tracking identifiers in URLs rejected | R-3A.3 | ESTABLISHED | E7 |
| 14 | Personal data inside free-text verbatim quotes (G-P1) | DEC-003 §6, R-3A.3 | NOT ESTABLISHED — free-text fields are explicitly exempt from the personal-identifier check | E9 |
| 15 | `individualIdentityRequired = false` / no private-individual clients | OQ-11 | ESTABLISHED | E7, E13 |
| 16 | Organization identity = normalized business website domain; no usable website → rejected; no merging across Searches | OQ-7 | ESTABLISHED | E13 |
| 17 | Intake → Research (D4) → post-research pipeline; Opportunity found not recreated (E1) | OQ-9, E1, D4 | ESTABLISHED | E13, E15 |
| 18 | Adapters / providers never persist or create Prospects / Opportunities / offers / outreach | OQ-9 item 3 | ESTABLISHED (adapters are pure mappers; contract has no I/O) | E8, E10 |
| 19 | Caller-owned existing Search required (G2); any status accepted (E2) | OQ-9 | ESTABLISHED | E13 |
| 20 | Pull-source binding of signals to a Search (G-O1) | OQ-9 limitation | NOT ESTABLISHED — `searchId` is a caller-supplied option; no runtime caller of the pull path exists | E14 |
| 21 | Push-source binding (FIRST_PARTY, OD-13 Alternative I) | IG-5, R-8.2 | ESTABLISHED in code; no integration registered | E14 |
| 22 | Freshness: age from `observedAt`; single decay rule (30 / 180 days) | OQ-6 | ESTABLISHED | E16 |
| 23 | Intake weights zero in lead score | D1 | ESTABLISHED | E16 |
| 24 | Evidence never deleted / append-only; Research supersession skips intent kinds | OQ-5, OQ-6 | ESTABLISHED | E6, E13 |
| 25 | In-batch dedup (`DUPLICATE_IN_BATCH`) | OQ-5 | ESTABLISHED (provider-batch function only) | E17 |
| 26 | Client-level consolidation (Company by domain, Prospect per Search+Company, Opportunity found) | OQ-5, OQ-7, E1 | ESTABLISHED | E13, E15 |
| 27 | Replay / persistence / cross-batch dedup | OQ-5, OD-12 | NOT ESTABLISHED (stated in code as a known open design question) | E17 |
| 28 | Service relevance (D3): ServiceProfile triggers by kind + keyword match | D3, R-1.3 | ESTABLISHED (kind + keyword rule) | E18 |
| 29 | Service categories (G-Q2) | R-3A.2, R-13.3 | PARTIALLY ESTABLISHED — closed six-value `field` vocabulary (`statedRequirement`, `requestedWebsite`, `requestedMobileApp`, `requestedRedesign`, `requestedDevelopment`, `requestedFeature`) supplied by the source; no central categorization | E1, E10 |
| 30 | Service matching beyond D3 (G-Q1) | OQ-3 limitation | NOT ESTABLISHED (no field-to-offering matching beyond kind triggers + keywords) | E18 |
| 31 | Source families (G-A1): three families; professional / social family | OQ-12 item 2 | PARTIALLY ESTABLISHED — three families present; no professional / social family; RFP / project-request / procurement / project-posting **types** already exist inside existing families | E3 |
| 32 | Provider-neutral adapter contract (G-A2) | R-4.2, R-13.11, READINESS-001 §6 | PARTIALLY ESTABLISHED — contract present and provider-neutral; lacks expressed time (row 9), evidence-class representation (row 11), and persistence of source identity beyond label (row 10) | E8, E10 |
| 33 | No provider call / SDK / credential / HTTP client in intent code | R-5, R-9 | ESTABLISHED | E10, E19 |
| 34 | Operational contract (≤1 call per event, no automatic retries, failure handling) | — (code-defined; no governing requirement cited in REQ-001) | ESTABLISHED in code; NOT APPLICABLE to REQ-001 requirements | E19 |
| 35 | Human approval: per-message gate; SENT only from APPROVED; approver identity required | OQ-10 | PARTIALLY ESTABLISHED — state-machine gate exists; "owning user" binding of approver and C-5 gate not established from code traced | E20 |
| 36 | Outreach sending | OQ-10 item 3 | NOT ESTABLISHED (no send path found in traced packages) | E20 |
| 37 | LinkedIn own-form responses as SUPPLIED_TO_US (A1) | — | NOT ESTABLISHED — no LinkedIn intent family, type or adapter exists in intent code | E3 |
| 38 | Amendment 2 provider-neutral core / separation of core and provider access | R-13.9–R-13.12 | ESTABLISHED in structure (adapter → normalize → intake path, no provider dependency) | E3, E8, E10, E13 |

## §5 Exact implementation evidence

- **E1** `packages/core-research/src/intentSignal.ts:21–28` — `INTENT_SIGNAL_KINDS = ['PUBLIC_INTENT', 'FIRST_PARTY']`;
  `INTENT_SIGNAL_CONFIDENCE` 70 / 90. `:36–43` — six `INTENT_SIGNAL_FIELDS`. `:5–15` — intent signals stored as
  ordinary ResearchSignal rows; "proves only that the quote was observed at `observedAt`".
- **E2** `intentSignal.ts:190–204` — `RecordIntentSignalInput` (searchId, companyName, website, kind, field, quote,
  sourceUrl, sourceLabel, observedAt, authorizationEvidence). `:307–317` — `observedAt` required, not in the future.
  `:335–350` — built signal: `classification: 'OBSERVED'`, `signal: quote`, `confidence: INTENT_SIGNAL_CONFIDENCE[kind]`,
  `basis: null`, `sources: [{ sourceUrl, sourceQuote: quote, sourceLabel }]`.
- **E3** `packages/core-research/src/intentSource.ts:40–60` — families `PUBLIC_WEB_SEARCH` (SEARCH_RESULT, PUBLIC_PAGE,
  PROCUREMENT_NOTICE, PROJECT_POSTING, HIRING_SIGNAL, TECHNOLOGY_MIGRATION), `AI_PLATFORM_ACQUISITION` (AI_PLATFORM_AD,
  AI_REFERRAL, SPONSORED_PLACEMENT), `PUBLIC_INTENT_NOTICE` (RFP_NOTICE, PROJECT_REQUEST, COMPANY_ANNOUNCEMENT,
  HIRING_SIGNAL, TECHNOLOGY_MIGRATION). `:71–82` — `DISCLOSURE_KIND` and per-family allowed disclosures
  (SUPPLIED_TO_US only for AI_PLATFORM_ACQUISITION). No LinkedIn / professional-social family.
- **E4** `intentSignal.ts:262–270` and `:392–400` — `confidence` / `classification` supplied by caller → rejected
  `not-allowed`.
- **E5** `intentSource.ts:29–33` — provenance persisted via `source_quote`, `source_url`, `source_label`; "externalId,
  capturedAt and context live on the normalized event only — no schema change". `:311` — `sourceLabel =
  "<family label> · <type>"`. `:232–247` — source reference must be an absolute URL without tracking parameters.
- **E6** `packages/core-research/src/pgRepository.ts:22–24` — append-only; `:52–60` — `supersedePrevious` excludes
  `INTENT_SIGNAL_KINDS`; `:77–79` — signal INSERT columns (… `observed_at`, `business_id`, `auth_status`, `auth_scope`,
  `auth_timestamp`, `integration_id`); `:103` — source INSERT (`source_url`, `source_quote`, `source_label`).
- **E7** `intentSource.ts:130–136` — privacy flags (`personalDataUsed: false`, `individualIdentityRequired: false`);
  `:167–199` — `PROHIBITED_PERSONAL_DATA_KEYS` (search history / query / cookie / device / advertising / account /
  email / phone / IP / session / conversation / transcript / prompt / gclid / fbclid / msclkid); `:204–221` — recursive
  key screen, reject not strip; `:201`, `:242–246` — tracking URL params rejected.
- **E8** `intentSource.ts:13–27`, `:123–128` — `AcquisitionSourceAdapter` (`identifySource`, `normalize`), pure
  mappers; adapters "never persist, never create Prospects / Opportunities / determinations / offers / outreach, and
  never choose kind, confidence or classification". `intentSourceAdapters.ts:10–14` — no I/O, no credentials.
  `intentSource.ts:257–388` — `normalizeIntentEvent`, the single normalization path.
- **E9** `packages/core-research/src/intentSourceProviderContract.ts:221–267` — `PROVIDER_PROHIBITED_KEYS` superset
  (incl. `searchterm(s)`, `userprompt`, `prompttext`, `aiconversation`, `chathistory`, `personname`, `fullname`,
  `firstname`, `lastname`, `homeaddress`, `inferreduserintent`, click IDs); `:270` — system-assigned keys rejected;
  `:271–272` — **`FREE_TEXT_KEYS = ['title', 'snippet', 'body', 'statement', 'evidence', 'basis']` — "Free-text fields
  may quote a business contact"**; `:278–295` — identifier check skipped for free-text keys; `:297–303` — personal
  email / phone rejected in identifier fields only (`intentSignal.ts:91–96`).
- **E10** `intentSourceProviderContract.ts:38–61` — provider-neutral contract; "No provider is called here. No SDK,
  credential, HTTP client or browser is imported; results are supplied by the caller (fixtures today)". `:91–94` —
  `ProviderIntentEvidence.requirement: IntentSignalField` supplied by the provider result. `:145–154` — AI-platform
  `derivation: 'STATED_BY_BUSINESS'` only (`:470–472` rejects other derivations). `:348–354` — `checkVerbatim`
  (evidence must be contained in title + snippet / body).
- **E11** `intentSourceProviderContract.ts:395–416`, `:532–547`, `:487–492` — `NO_INTENT_EVIDENCE` /
  `UNATTRIBUTED` outcomes; "identity is never inferred"; `:366–373` — identity requires both name and website.
- **E12** `intentSourceProviderContract.ts:85–88` — `ProviderPublication { publisher, publishedAt }` (carried only in
  `ProviderContractNotes`, `:193–200`); `:106–109` — `observedAt` "When the evidence was published / observed at the
  source", `capturedAt` "When the integration captured the result"; `:424` — `publishedAt: observedAt`.
  `intentSourceAdapters.ts:62`, `:146` — adapter `observedAt` = `publishedAt` / `postedAt`.
- **E13** `apps/worker/src/searchWorker/intentIntake.ts:19–59` (header); `:99–101` — validate + OD-13 P3 / X1 before
  any write; `:103–105` — caller-owned Search, any status; `:107–114` — `normalizeCandidate`, unusable website →
  rejected; `:116–121` — `findOrCreateByDomain`, `findOrCreate(searchId, companyId)`; `:125–132` — one transaction,
  `saveSignals(prospect.id, [signal], observedAt)`; `:134–140` — Research when no CATEGORY_PLAUSIBLE determination;
  `:142` — `runPostResearchPipelineForOwner`; `:157–163` — single-signal form rejects FIRST_PARTY.
- **E14** Callers (targeted search): `normalizeProviderBatch` / `normalizeProviderResult` — exported
  (`packages/core-research/src/index.ts:246–248`), **no runtime caller**. `normalizeVerifiedProviderResult` →
  `apps/web/src/server/intentIngress.ts:121`; `recordIntentIntakeForOwner` →
  `apps/web/src/server/intentIngressIntake.ts:58`. `intentIngress.ts:13–31` — owner / search from the registration of
  the verified integration (IG-5). `intentIngressIntake.ts:27` — "none is registered".
- **E15** `apps/worker/src/searchWorker/worker.ts:436–455` — `findByProspectId` → existing Opportunity reused, else
  `createOpportunityForOwner`. `packages/core-opportunity/src/service.ts:129–141` — `needDetected = top !== undefined`
  from `suggestOffers(toOfferSignals(signals), [toServiceRule(search.parameters)])`.
- **E16** `packages/core-acquisition/src/scoring.ts:45–59` — `SOURCE_WEIGHT` with `PUBLIC_INTENT: 0`, `FIRST_PARTY: 0`
  (D1); `:61–64` — 180 / 30 days; `:81–86` — `decayFactor`; `:97–99` — age from `observedAt`. Also used by
  `prospectScore.ts:179`, `staleness.ts:39`.
- **E17** `intentSourceProviderContract.ts:57–60`, `:783–803` — in-batch `DUPLICATE_IN_BATCH` by `eventId`; "Nothing
  here deduplicates across batches or at persistence (KNOWN OPEN DESIGN QUESTION)". `intentSource.ts:362–372` —
  deterministic `eventId`, not persisted (E5).
- **E18** `packages/core-opportunity/src/adapters.ts:41–49` — `toServiceRule` (service, triggers filtered to
  `ResearchSourceKind`, keywords). `packages/core-acquisition/src/offer.ts:76–87` — a rule matches a signal only when
  `rule.triggers` includes the signal's kind **and** a keyword occurs in the text.
- **E19** `intentSourceProviderContract.ts:805–894` — operational contract and call budget (max 1 call per event; 0
  automatic retries; failure kinds; halt rules); defines limits, implements no call.
- **E20** `packages/core-outreach/src/approval.ts:3–8`, `:15–20` — transitions (DRAFT → APPROVED / REJECTED; SENT only
  from APPROVED); `:47–50` — `isSendable` = APPROVED; `:52–57` — `approve` requires approver identity.
  `packages/core-outreach/src/schema.ts:41` — `APPROVAL_STATES`. Targeted search found no email / SMTP / message-send
  implementation in `packages/*/src` or `apps/*/src`; `core-outreach-preparation` and `core-followup-preparation` state
  "no HTTP/SMTP" (`index.ts:15–16`).

## §6 Existing implementation that can be reused (as observed; not a recommendation)

The following provider-neutral behavior already exists in code and corresponds to decided requirements: signal
representation and validation (E1, E2, E4); central kind / confidence (E3, E4); privacy key-screen and tracking-URL
screen (E7, E9); provider-neutral adapter contract and three family adapters (E8, E10); NO_INTENT_EVIDENCE /
UNATTRIBUTED handling (E11); organization identity and client-level consolidation (E13); intake → Research →
post-research → Opportunity (E13, E15); append-only persistence and supersession exclusion (E6); decay and D1 weights
(E16); in-batch dedup (E17); D3 trigger / keyword offer rule (E18); approval state machine (E20); FIRST_PARTY push
ingress with OD-13 verification (E14).

## §7 Partial implementations

| Item | What exists | What is absent |
|---|---|---|
| Evidence-class representation (G-E1 / G-E2) | Published intent (PUBLIC_INTENT); FIRST_PARTY | Any representation of search intent or inferred business need |
| Source / provider identity (G-S3) | family + type in `source_label` | Persisted `externalId`, provider provenance, `capturedAt`, `publication` |
| Extracted intent vs evidence (R-3.2) | Verbatim quote stored | A separate extracted-intent value |
| Service categories (G-Q2) | Closed six-value `field`, source-supplied | Central categorization; mapping to R-3A.2 / R-13.3 examples |
| Source families (G-A1) | 3 families incl. RFP / project-request / procurement / project-posting types | Professional / social family |
| Adapter contract coverage (G-A2) | Provider-neutral contract | Rows 9–11 of §4 |
| Verbatim check | Text-containment for web / notice families | Containment check for AI-platform statements (business-stated by design) |
| Human approval | Message state machine, approver required | Owning-user binding and C-5 gate not established from traced code |

## §8 Missing implementation

| Item | Requirement | Status |
|---|---|---|
| Expressed time distinct from observed time (G-S1) | R-3.1 | NOT ESTABLISHED |
| Pull-source Search binding / runtime caller (G-O1) | OQ-9 limitation | NOT ESTABLISHED |
| Replay / persistence / cross-batch dedup | OQ-5 / OD-12 | NOT ESTABLISHED (accepted limitation) |
| Personal-data screening of free-text quotes (G-P1) | DEC-003 §6 | NOT ESTABLISHED |
| Service matching beyond kind triggers + keywords (G-Q1) | OQ-3 limitation | NOT ESTABLISHED |
| Outreach sending | OQ-10 | NOT ESTABLISHED (and not authorized) |
| Any live provider adapter / retrieval | R-9.1 | NOT ESTABLISHED (and not authorized) |

## §9 Conflicts between code and governance (reported, not resolved)

| # | Observation | Code | Governance | Note |
|---|---|---|---|---|
| K-1 | Free-text quotes are exempt from personal-identifier screening and are persisted verbatim as `source_quote` | E9, E6 | DEC-003 §6 / R-3A.3 prohibit personal email / phone harvesting; R-13.21 | Whether persisting a public quote that contains a personal identifier is "harvesting" is not established by any record (G-P1). |
| K-2 | The service-category `field` (`requirement`) is supplied by the provider result / adapter | E10, E1 | R-3.3 / OQ-4 reject source-assigned "kind / confidence / classification" | Code's "classification" means OBSERVED / INFERRED; governance does not state whether a source-assigned requirement field falls under "classification". Ambiguity only. |
| K-3 | One timestamp serves as both "published" and "observed" | E12 | R-3.1 distinguishes "when expressed" and "when observed" | Already recorded as OQ-6 limitation; code confirms it. |
| K-4 | HIRING_SIGNAL / TECHNOLOGY_MIGRATION / COMPANY_ANNOUNCEMENT types produce `PUBLIC_INTENT` signals when a verbatim statement exists | E3, E10 | R-3A.1 / R-13.4 separate published client intent from inferred business need | The code distinguishes only by the verbatim-evidence requirement; whether these types carry client intent or inferred need depends on the statement, not the type. No record classifies them (PD-2 related). |
| K-5 | RFP / project-request / procurement / project-posting types already exist within existing families | E3 | READINESS-001 PD-8 / §7 frames marketplace / RFP sources as possibly needing a new family | Not a governance conflict (OQ-12 item 2 maps per provider); READINESS-001's framing is narrower than the code facts. |
| K-6 | A1: LinkedIn own-form responses as SUPPLIED_TO_US | No LinkedIn intent code (E3) | No decision | Remains an analyst interpretation; code neither supports nor contradicts it. |
| K-7 | `capturedAt` is validated but not persisted; persisted capture time is the database `created_at` | E5, E13 header | CONTRACT-REC §3–§4 (persisted provenance incl. "system capture time") | Consistent only if "system capture time" means DB insertion time; not stated. |

## §10 Open questions that genuinely require Product Owner decisions

Confirmed against code (none answered here; numbering from READINESS-001 §9):

- **PD-1** — implementation scope / authorization (unchanged).
- **PD-2** — evidence-class representation: code has no representation for inferred need or search intent (§4 row 11;
  K-4).
- **PD-5** — pull-source Search binding: no pull runtime caller exists (§4 row 20).
- **PD-6** — expressed vs observed time: code has one timestamp (§4 row 9; K-3).
- **PD-7** — search intent contribution: no representation exists (§4 row 11).
- **PD-3** — service-category vocabulary / matching beyond D3: code has a six-value source-supplied field and a
  kind + keyword rule (§4 rows 28–30; K-2).
- **PD-12** — replay / persistence dedup: confirmed absent (§4 row 27).
- **Newly surfaced by code (not previously listed in READINESS-001):** (a) treatment of personal data inside public
  verbatim quotes (K-1, G-P1); (b) whether a source-assigned requirement field is "classification" under R-3.3 / OQ-4
  (K-2); (c) whether "system capture time" in CONTRACT-REC means DB insertion time or integration capture time (K-7).

READINESS-001 PD-8 (new source family) is narrowed by K-5: RFP / project-request types exist; a professional / social
family does not.

## §11 Readiness distinction

| Area | Code status | Observation |
|---|---|---|
| **Provider-neutral core** | PARTIALLY ESTABLISHED | The decided path (validation, central kind / confidence, privacy key-screen, identity, intake → Research → Opportunity, decay, append-only, in-batch dedup, D3 rule) is ESTABLISHED in code. Not established: expressed time, evidence-class representation, extracted-intent separation, source-identity persistence beyond label, free-text personal-data screening, pull-source binding, persistence dedup. |
| **Provider adapter** | PARTIALLY ESTABLISHED (contract) / NOT ESTABLISHED (live) | Provider-neutral contract and three fixture-fed family adapters exist; no live provider adapter, retrieval, credential or registration exists; no professional / social family; push ingress exists with no registered integration. |
| **Outreach** | PARTIALLY ESTABLISHED (approval gate) / NOT ESTABLISHED (sending) | Message approval state machine exists; no send path found; C-5 gate and owning-user binding not established from traced code; no outreach authority. |

No conclusion above declares the MVP ready or recommends an implementation approach.

## §12 Final authority block

```text
Audit type: READ-ONLY

Production files changed: 0
Test files changed: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP: 0
Runtime wiring: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
Pushes: 0

Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authorization: NONE
Key-registration authorization: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Scraping/browser automation authority: NONE
Credential-sharing authority: NONE
```
