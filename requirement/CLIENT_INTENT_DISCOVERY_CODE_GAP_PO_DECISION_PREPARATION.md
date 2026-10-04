# CLIENT INTENT DISCOVERY — CODE-GAP FINDINGS — PRODUCT OWNER DECISION PREPARATION

## §1 Record identity and purpose

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-PREP-001
**Date:** 2026-10-01
**Type:** Product Owner **decision-preparation** record. Not a decision record, not an implementation plan, not an
implementation authorization.
**Sole baseline:** CLIENT-INTENT-DISCOVERY-CODE-GAP-AUDIT-001 (`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_AUDIT.md`).
**Author role:** governance recorder.

**Purpose.** To present, for a future Product Owner decision, the unresolved provider-neutral core questions K-1, K-2,
K-4, K-5, K-6 / A1 and K-7 identified by CODE-GAP-AUDIT-001 §9, each with: the exact audit finding, established
repository evidence, the unresolved question, the existing governing records, dependencies / conflicts, and unranked
answer alternatives.

```text
Record status: PREPARED — NO PRODUCT OWNER DECISION RECORDED
K-1:    Product Owner decision: PENDING
K-2:    Product Owner decision: PENDING
K-4:    Product Owner decision: PENDING
K-5:    Product Owner decision: PENDING
K-6/A1: Product Owner decision: PENDING
K-7:    Product Owner decision: PENDING
Existing decisions reopened / amended / superseded / reinterpreted: NONE
Answer recommended / ranked / scored / selected: NONE
```

> **This record recommends, ranks, scores and selects nothing, and infers no Product Owner intent. Alternatives are
> listed in presentational order only. Audit interpretations are labelled as interpretations, not facts.**

Labels: **AUDIT FINDING** (quoted verbatim from CODE-GAP-AUDIT-001); **ESTABLISHED FACT** (repository code or record
text, cited); **GOVERNANCE** (quoted from an existing record); **EVIDENCE GAP** (not establishable from the
repository); **ALTERNATIVE** (possible answer, unranked).

## §2 Baseline and source hashes (verified before writing)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty; code = HEAD, identical to the audit baseline) |
| Target file / record ID pre-existence | Neither existed (checked by path and repository-wide search) |

| Record | ID | sha256 (verified) |
|---|---|---|
| `CLIENT_INTENT_DISCOVERY_CODE_GAP_AUDIT.md` | CLIENT-INTENT-DISCOVERY-CODE-GAP-AUDIT-001 (**sole baseline**) | `803e25b83ac460c42cd275ddb285fe44ae010871c83b6e28234822d4188b157b` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | CLIENT-INTENT-DISCOVERY-REQ-001 (canonical, post-Amendment-2) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md` | OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | PROVIDER-EVIDENCE-001 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 (D1–D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 (DEC-003) | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 (ADAPTER-REC) | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 (CONTRACT-REC) | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | GA-REQ | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |

The hashes of DEC-003, ADAPTER-REC, CONTRACT-REC and PO-DEC-001 equal the values recorded in REQ-001 §0; the remaining
hashes equal those recorded in CODE-GAP-AUDIT-001 §1 and READINESS-001 §2.

## §3 Governance status and authority boundary

- No Product Owner decision is made or recorded here. Every question in §4–§9 is `PENDING`.
- OQ-1..OQ-12 decisions/answers, D1–D5, E1/E2, DEC-003, OD-1..OD-13, Option B, Alternative I, X1, C-1, GA-REQ /
  GA-Q0..GA-Q15, Amendment 2 and READINESS-001 PD-1..PD-12 are cited, not reopened, amended, superseded or
  reinterpreted.
- Statements in ADAPTER-REC and CONTRACT-REC are implementation-record statements; this record does not decide whether
  they carry Product Owner decision status (see §11).
- This record grants no execution authority (§12).

---

## §4 K-1 — Personal data inside public quotes / free-text evidence

**AUDIT FINDING (CODE-GAP-AUDIT-001 §9, K-1, verbatim):**
> Free-text quotes are exempt from personal-identifier screening and are persisted verbatim as `source_quote` …
> Whether persisting a public quote that contains a personal identifier is "harvesting" is not established by any
> record (G-P1).

**ESTABLISHED FACTS:**
- `intentSourceProviderContract.ts:271–272`: `FREE_TEXT_KEYS = ['title', 'snippet', 'body', 'statement', 'evidence',
  'basis']`, comment "Free-text fields may quote a business contact; every other string is screened as an identifier."
  `:278–295`: the identifier check is skipped for these keys (audit E9).
- `intentSignal.ts:347` (`sources: [{ sourceUrl, sourceQuote: quote, sourceLabel }]`) and `pgRepository.ts:103`: the
  quote is persisted as `source_quote` (audit E2, E6).
- CONTRACT-REC §3 (verbatim): "any string outside the free-text fields (`title`, `snippet`, `body`, `statement`,
  `evidence`, `basis`) that is an email address or a `mailto:` / `tel:` / `sms:` reference is rejected".
- CONTRACT-REC §6 item 4 (verbatim): "**Privacy screen limits.** Free-text fields are not PII-scanned (a public RFP body
  may quote a business contact email; tested as accepted)."
- CONTRACT-REC §3 (verbatim): "Violations are **rejected, never stripped**."

**UNRESOLVED QUESTION:** How must personal data (e.g. a person's email, phone or name) appearing **inside** a public
verbatim quote or other free-text evidence field be treated under the existing privacy boundary?

**EXISTING GOVERNANCE (verbatim):**
- DEC-003 §6: "no personal email / phone harvesting; no inference that a named individual uses an AI platform; no
  consumer-level behavioural surveillance."
- REQ-001 R-3A.3: Amendment 1 "does not authorize: … personal emails or phone numbers; … or inference about named
  individuals where prohibited by existing governance."
- REQ-001 R-13.21: Amendment 2 does not require "private email addresses; private phone numbers; … or identity
  resolution from prohibited / private data."
- OQ-3 item 1 (verbatim statement requirement) and item 4 ("the item passes the existing privacy screen (DEC-003 §6;
  CONTRACT-REC §3)").

**DEPENDENCIES / CONFLICTS:**
- No record defines whether retaining a verbatim public quote containing a personal identifier is "harvesting".
- Any alternative that removes text from a quote interacts with OQ-3 item 1 (verbatim) and R-3.2 (traceability), and
  with the CONTRACT-REC "rejected, never stripped" statement.
- Touches READINESS-001 G-P1; OQ-11 (organizations only).
- EVIDENCE GAP: the proportion / kinds of personal data actually present in real source quotes is not establishable
  from the repository (no live source exists).

**ALTERNATIVES (unranked; presentational order only):**
- **K1-A** — Free-text quotes containing personal identifiers are accepted as-is (the current code behavior).
- **K1-B** — An evidence item whose free-text quote contains a personal contact identifier is rejected.
- **K1-C** — Personal identifiers are removed / masked from the quote before persistence (interacts with OQ-3 item 1,
  R-3.2 and "rejected, never stripped").
- **K1-D** — Distinguish by identifier type (e.g. business vs personal contact) under a rule the Product Owner defines.
- **K1-E** — Other (Product Owner specifies).

**Product Owner decision: PENDING**

---

## §5 K-2 — Source-assigned service-category field vs prohibited source-assigned classification

**AUDIT FINDING (CODE-GAP-AUDIT-001 §9, K-2, verbatim):**
> The service-category `field` (`requirement`) is supplied by the provider result / adapter … Code's "classification"
> means OBSERVED / INFERRED; governance does not state whether a source-assigned requirement field falls under
> "classification". Ambiguity only.

**ESTABLISHED FACTS:**
- `intentSignal.ts:36–43`: six `INTENT_SIGNAL_FIELDS` — `statedRequirement`, `requestedWebsite`,
  `requestedMobileApp`, `requestedRedesign`, `requestedDevelopment`, `requestedFeature`.
- `intentSourceProviderContract.ts:91–94`: `ProviderIntentEvidence.requirement: IntentSignalField` is part of the
  provider result; `:331–335` rejects values outside the six.
- `intentSignal.ts:262–270`, `intentSource.ts:202`, `intentSourceProviderContract.ts:270`: the keys `kind`,
  `confidence`, `classification` are rejected when source-supplied; `requirement` / `field` is not among them.
- `intentSignal.ts:343`: system-assigned `classification: 'OBSERVED'`.
- `offer.ts:76–87` (audit E18): offer matching uses signal **kind** and keyword text, not `field`.

**UNRESOLVED QUESTION:** Does a source / provider assigning the service-category field constitute the
"source-assigned … classification" that existing governance rejects, or is it permitted source-supplied mapping?

**EXISTING GOVERNANCE (verbatim):**
- REQ-001 R-3.3: "the existing intake rules derive kind and confidence centrally and reject source-assigned kind /
  confidence / classification (INTENT-SOURCE-ADAPTER-IMPL-REC-001; PO-DEC-001 D5)".
- OQ-4: "Intent confidence is determined **centrally by the system, never by a provider or source** … Any
  provider-supplied confidence, kind or classification is rejected, as today."
- PO-DEC-001 D5: "`PUBLIC_INTENT = 70`, `FIRST_PARTY = 90` (OBSERVED; not caller-overridable)".
- OQ-3 "Unresolved limitations": "How "requested service" is matched against user-defined offerings (R-1.3) beyond D3
  is not decided here."

**DEPENDENCIES / CONFLICTS:**
- Tied to READINESS-001 **PD-3** (service-category vocabulary / matching beyond D3) and G-Q1 / G-Q2.
- Neither R-3.3, OQ-4 nor D5 defines the term "classification"; the code uses it for OBSERVED / INFERRED. Choosing an
  interpretation must not be presented as reinterpreting OQ-4 / D5 — any such reading belongs in a Product Owner
  record.
- The six-value vocabulary does not correspond one-to-one with the REQ-001 R-3A.2 / R-13.3 examples (observation, not
  a conflict; the examples are illustrative).

**ALTERNATIVES (unranked):**
- **K2-A** — The service-category field is not "classification" under R-3.3 / OQ-4; sources may continue to supply it
  from the closed vocabulary (current code behavior).
- **K2-B** — The field is treated as classification and must be assigned centrally by the system (depends on PD-3).
- **K2-C** — The source proposes a field and the core validates or overrides it under a central rule (depends on PD-3).
- **K2-D** — Other (Product Owner specifies).

**Product Owner decision: PENDING**

---

## §6 K-4 — Hiring / technology-migration / company-announcement notices: client intent or inferred business need?

**AUDIT FINDING (CODE-GAP-AUDIT-001 §9, K-4, verbatim):**
> HIRING_SIGNAL / TECHNOLOGY_MIGRATION / COMPANY_ANNOUNCEMENT types produce `PUBLIC_INTENT` signals when a verbatim
> statement exists … The code distinguishes only by the verbatim-evidence requirement; whether these types carry client
> intent or inferred need depends on the statement, not the type. No record classifies them (PD-2 related).

The final sentence of the audit finding ("depends on the statement, not the type") is an **audit interpretation**, not
an established fact.

**ESTABLISHED FACTS:**
- `intentSource.ts:40–60`: `HIRING_SIGNAL` and `TECHNOLOGY_MIGRATION` are types in both `PUBLIC_WEB_SEARCH` and
  `PUBLIC_INTENT_NOTICE`; `COMPANY_ANNOUNCEMENT` is a `PUBLIC_INTENT_NOTICE` type.
- `intentSource.ts:78–82`: both families permit only `PUBLISHED` disclosure, which maps to `PUBLIC_INTENT` (`:73–76`).
- `intentSourceProviderContract.ts:348–354`, `:538–541`: each evidence item must appear verbatim in the notice text
  and use one of the six fields.
- No code representation of "inferred business need" exists (audit §4 row 11).

**UNRESOLVED QUESTION:** When a hiring, technology-migration or company-announcement notice is the source, may the
resulting evidence be treated as published / self-declared client intent, or only as inferred business need (or does it
depend on criteria the Product Owner defines)?

**EXISTING GOVERNANCE (verbatim):**
- REQ-001 §3A, Inferred Business Need: "The system infers that an organization may need a service based on observable
  facts." … "System inference; must **not** automatically be treated as explicit client intent."
- REQ-001 R-3A.1: "The product must preserve the distinction between **observed evidence** and **system inference**,
  and must not relabel one concept as another."
- OQ-3 item 1: "the item contains a statement, expressed by the potential client, of a current need for a service; the
  statement appears verbatim in the source evidence (no inferred, summarized or model-generated need counts as
  evidence)."
- REQ-001 R-13.4: the three evidence classes "must **not** be treated as equivalent, merged or relabelled (R-3A.1)".

**DEPENDENCIES / CONFLICTS:**
- Depends on READINESS-001 **PD-2** (representation of inferred business need) — AMD1-DEP-3.
- An alternative that treats these types as inferred need only has no current code representation to land in (PD-2).
- The source types predate Amendment 1 / 2 (they exist at HEAD); no record states the governance basis for including
  them in intent families — EVIDENCE GAP within the repository records read.

**ALTERNATIVES (unranked):**
- **K4-A** — Such notices may yield published client intent whenever all OQ-3 conditions hold (current code behavior).
- **K4-B** — Such notices are inferred business need only and must not yield `PUBLIC_INTENT` (depends on PD-2).
- **K4-C** — Treatment differs by type (e.g. some types client intent, others inferred need), as the Product Owner
  specifies.
- **K4-D** — Additional criteria (beyond OQ-3) must be met for these types to count as client intent, as the Product
  Owner specifies.
- **K4-E** — Other (Product Owner specifies).

**Product Owner decision: PENDING**

---

## §7 K-5 — Existing RFP / project-request / procurement / project-posting types and readiness scope

**AUDIT FINDING (CODE-GAP-AUDIT-001 §9, K-5, verbatim):**
> RFP / project-request / procurement / project-posting types already exist within existing families … Not a
> governance conflict (OQ-12 item 2 maps per provider); READINESS-001's framing is narrower than the code facts.

**ESTABLISHED FACTS:**
- `intentSource.ts:42–49`: `PUBLIC_WEB_SEARCH` includes `PROCUREMENT_NOTICE`, `PROJECT_POSTING`.
- `intentSource.ts:53–59`: `PUBLIC_INTENT_NOTICE` includes `RFP_NOTICE`, `PROJECT_REQUEST`.
- No professional / social family exists (`intentSource.ts:40–60`).
- READINESS-001 §9 PD-8 (verbatim): "Whether a new source family is needed for professional / social or marketplace /
  RFP sources".

**UNRESOLVED QUESTION:** For readiness scope, are marketplace / freelance / RFP / tender / project-request sources to be
regarded as candidates for the existing `PUBLIC_WEB_SEARCH` / `PUBLIC_INTENT_NOTICE` types (subject to per-provider
mapping), or does the Product Owner require a separate family decision for them?

**EXISTING GOVERNANCE (verbatim):**
- OQ-12 item 2: "**Mapping is per provider.** Each provider integration's own provider-specific requirement and
  authorization states which existing family and source type its results map to. Where no existing family fits (e.g.
  there is currently none for professional / social platforms), a new family requires its own separate decision; none
  is created here."
- REQ-001 R-13.6: category "E. Marketplaces / freelance / RFP / project-request sources".
- REQ-001 R-13.19: "No named marketplace, RFP / tender source or other provider is approved, selected or stated to be
  technically available by this section."

**DEPENDENCIES / CONFLICTS:**
- Touches READINESS-001 **PD-8** and **PD-9**; OQ-12 item 2.
- No conflict with OQ-12: per OQ-12 item 2, whether any specific provider "fits" an existing family is decided in that
  provider's own record. A generic answer here cannot decide any provider's mapping.
- EVIDENCE GAP: whether any real marketplace / RFP source's data fits the existing type shapes requires provider
  evidence that the repository does not contain (READINESS-001 §10).

**ALTERNATIVES (unranked):**
- **K5-A** — Treat marketplace / RFP / project-request sources as covered by existing types, leaving each provider's
  mapping to its own record (OQ-12 item 2); PD-8 then concerns professional / social only.
- **K5-B** — Require a separate family decision for marketplace / freelance sources regardless of existing types.
- **K5-C** — Make no generic determination; address each source only in its provider-specific record.
- **K5-D** — Other (Product Owner specifies).

**Product Owner decision: PENDING**

---

## §8 K-6 / A1 — LinkedIn own-form responses as "supplied to us" evidence

**AUDIT FINDING (CODE-GAP-AUDIT-001 §9, K-6, verbatim):**
> A1: LinkedIn own-form responses as SUPPLIED_TO_US … No LinkedIn intent code … Remains an analyst interpretation;
> code neither supports nor contradicts it.

**READINESS-001 caveat A1 origin (verbatim, READINESS-001 §7 LinkedIn row):** "Own-form responses are SUPPLIED_TO_US
(OQ-12) → OD-13 path". This is an **analyst interpretation**, not a decided fact.

**ESTABLISHED FACTS:**
- No LinkedIn intent family, type or adapter exists (`intentSource.ts:40–60`; audit E3). `LINKEDIN` exists only as an
  ordinary research-source kind with lead-score weight 12 (`scoring.ts:50`).
- `intentSource.ts:78–82`: `SUPPLIED_TO_US` is permitted only for `AI_PLATFORM_ACQUISITION`.
- `intentSignal.ts:319–333`: every `FIRST_PARTY` signal, whatever family, requires validated authorization evidence
  (OD-7).
- PROVIDER-EVIDENCE-001 §7 (verbatim): Lead Sync "returns responses to Lead Gen Forms **owned by** the organization or
  sponsored account (`owner`)"; restricted uses: member data "**must not be used for advertising, sales or recruiting
  use cases, including to identify sales or marketing prospects or to create leads**"; "Not established: whether
  lead-form responses fall under S14's member-data storage limits".
- OQ-1-2-8-PO-DEC-001 §3 (verbatim): LinkedIn "NOT ESTABLISHED for third-party intent; partial: own lead-form responses
  only".

**UNRESOLVED QUESTION:** May responses to the product owner's own LinkedIn lead forms be treated as `SUPPLIED_TO_US`
(→ `FIRST_PARTY`) evidence, as `PUBLISHED` evidence, or as neither?

**EXISTING GOVERNANCE (verbatim):**
- OQ-12 item 3: "**Signal kind continues to derive from disclosure** … PUBLISHED → PUBLIC_INTENT; SUPPLIED_TO_US →
  FIRST_PARTY, and any FIRST_PARTY path is governed by OD-1 to OD-13, Option B, Alternative I, X1 and C-1 unchanged
  (R-8.2)."
- OQ-12 item 2 (quoted in §7): mapping is per provider; no professional / social family exists.
- DEC-003 answer 7: "Same rule for all AI-platform sources." Answer 8: "this decision applies only to FIRST_PARTY;
  PUBLIC_INTENT is unaffected."
- OQ-11 item 1: a potential client "must be an identifiable **organization or business**".
- REQ-001 R-8.2: "If a future provider under this requirement would supply FIRST_PARTY signals, the existing OD-1..OD-13
  rules govern that path unchanged."

**DEPENDENCIES / CONFLICTS:**
- DEC-003's authorization-basis answers are stated for AI-platform sources; the code enforces authorization evidence
  for every FIRST_PARTY signal. No record states which authorization basis applies to a non-AI-platform FIRST_PARTY
  source — EVIDENCE GAP (repository governance).
- Touches READINESS-001 **PD-8** (no professional / social family) and **PD-9** (provider authorization); OD-1..OD-13.
- EVIDENCE GAP (external): whether LinkedIn's restricted-use terms and storage limits (PROVIDER-EVIDENCE-001 S14) apply
  to lead-form responses is "NOT ESTABLISHED" and cannot be established from the repository. This record does not
  research it; the policy alternatives below can be prepared without it, but its feasibility consequences cannot be
  assessed.

**ALTERNATIVES (unranked):**
- **K6-A** — Own-form responses are `SUPPLIED_TO_US` (FIRST_PARTY), governed by OD-1..OD-13 (requires a family
  decision, PD-8, and an authorization basis for a non-AI-platform source).
- **K6-B** — Own-form responses are not intent-source evidence for Client Intent Discovery.
- **K6-C** — No classification until LinkedIn-specific evidence (S14 applicability) is recorded.
- **K6-D** — Other (Product Owner specifies).

**Product Owner decision: PENDING**

---

## §9 K-7 — Meaning of "system capture time"

**AUDIT FINDING (CODE-GAP-AUDIT-001 §9, K-7, verbatim):**
> `capturedAt` is validated but not persisted; persisted capture time is the database `created_at` … Consistent only if
> "system capture time" means DB insertion time; not stated.

**ESTABLISHED FACTS:**
- `intentSource.ts:29–33`: "externalId, capturedAt and context live on the normalized event only — no schema change."
- `intentIntake.ts:29–30` (header): "each with its source event's own observedAt (created_at stays the database's
  capture time)".
- **ADAPTER-REC §5 table (verbatim):** "| capturedAt | yes | not stored as supplied; `research_signals.created_at` is the
  system's capture time |".
- **CONTRACT-REC §4 table (verbatim):** "| capture time | yes (`provenance.capturedAt`) | not stored as supplied;
  `research_signals.created_at` is the system's capture time (as REC-001 §5) |"; and "The persisted chain (label, URL,
  quote, observed time, system capture time) is the one REC-001 already accepted."
- CONTRACT-REC §6 item 3 (verbatim): "Provider `capturedAt`, `externalId`, provider provenance, publication and
  authorization metadata live on the normalized event / outcome only. Persisting them needs a schema change and is not
  authorized."

**Discrepancy recorded, not resolved:** the audit's statement "not stated" is inconsistent with ADAPTER-REC §5 and
CONTRACT-REC §4, which state that `research_signals.created_at` is "the system's capture time". This record does not
amend CODE-GAP-AUDIT-001. Both ADAPTER-REC and CONTRACT-REC are **implementation records**; whether their statement
constitutes a binding Product Owner definition is not established by any decision record.

**UNRESOLVED QUESTION:** Does "system capture time" (CONTRACT-REC §3–§4, cited by OQ-8 and OQ-PO-DEC-001) mean database
insertion time, the integration's / source's capture time, or both — and is the implementation-record definition to be
adopted as the governing definition?

**EXISTING GOVERNANCE (verbatim):**
- OQ-PO-DEC-001 OQ-8: "CONTRACT-REC §3–§4 (privacy screen; persisted provenance limited to label, URL, quote, observed
  time, system capture time)".
- OQ-6 item 1: "Intent age is measured from the signal's **observed time** (`observedAt`) as supplied with the source
  evidence." OQ-6 "Unresolved limitations": "the persisted model does not distinguish "when expressed" from "when
  observed" (R-3.1; CONTRACT-REC §4)".
- REQ-001 R-3.1: "Timestamp / freshness — When the need was expressed and when it was observed".
- REQ-001 R-6.2: provenance storage schema is not decided by REQ-001.

**DEPENDENCIES / CONFLICTS:**
- Related to READINESS-001 **PD-6** (expressed vs observed time); distinct from it (capture ≠ observed ≠ expressed).
- Any alternative requiring the integration's `capturedAt` to be persisted needs a schema change (CONTRACT-REC §6.3);
  schema / migration authority is NONE.
- Decay (OQ-6) uses `observedAt`, not capture time; no decay dependency.

**ALTERNATIVES (unranked):**
- **K7-A** — "System capture time" means database insertion time (`research_signals.created_at`), as stated in
  ADAPTER-REC §5 / CONTRACT-REC §4.
- **K7-B** — It means the integration's / source's capture time, which would then need to be persisted (schema
  change; separate authorization).
- **K7-C** — Both are required, each with its own meaning.
- **K7-D** — Other (Product Owner specifies).

**Product Owner decision: PENDING**

---

## §10 Dependency matrix

`●` = directly touches; `○` = related / indirect; blank = no dependency identified. PD numbering from READINESS-001 §9.
No PD question is answered, reopened or altered.

| K-question | PD-1 scope | PD-2 evidence-class repr. | PD-3 service vocab / matching | PD-5 pull binding | PD-6 expressed vs observed | PD-7 search intent | PD-8 source family | PD-9 provider auth. | PD-12 replay dedup | Existing decisions touched (not reopened) |
|---|---|---|---|---|---|---|---|---|---|---|
| K-1 | ○ |  |  |  |  |  |  |  |  | DEC-003 §6; OQ-3 items 1, 4; OQ-11; R-3A.3; R-13.21 |
| K-2 | ○ |  | ● |  |  |  |  |  |  | R-3.3; OQ-4; D5; OQ-3 limitation |
| K-4 | ○ | ● | ○ |  |  | ○ |  |  |  | §3A; R-3A.1; R-13.4; OQ-3 item 1; OQ-12 item 3 |
| K-5 | ○ |  |  |  |  |  | ● | ○ |  | OQ-12 item 2; R-13.6; R-13.19 |
| K-6 / A1 | ○ |  |  | ○ |  |  | ● | ● |  | OQ-12 items 2–3; DEC-003 answers 7–8; OD-1..OD-13; R-8.2; OQ-11; OQ-1-2-8 §3 |
| K-7 | ○ |  |  |  | ○ |  |  |  |  | OQ-8 (OQ-PO-DEC-001); OQ-6; R-3.1; R-6.2 |

PD-1 is marked `○` for every K-question because each affects what an MVP scope would contain; none depends on PD-1 to
be decided. PD-5 is marked for K-6 only because a non-push LinkedIn route would require pull-source binding; PD-12 has
no K-question dependency identified.

## §11 Issues that must not be silently resolved by the analyst

1. Whether retaining a public quote containing a personal identifier is "harvesting" under DEC-003 §6 (K-1).
2. Whether CONTRACT-REC's "rejected, never stripped" is a governing rule or an implementation choice (K-1, K1-C).
3. The meaning of "classification" in R-3.3 / OQ-4 / D5 (K-2).
4. Whether hiring / technology-migration / company-announcement types are client intent or inferred need (K-4); and
   whether the audit's "depends on the statement, not the type" reading is adopted.
5. Whether READINESS-001 PD-8 should be read as narrowed to professional / social (K-5); READINESS-001 is not edited.
6. Whether LinkedIn own-form responses are SUPPLIED_TO_US (K-6 / A1); which authorization basis would apply to a
   non-AI-platform FIRST_PARTY source.
7. Whether ADAPTER-REC §5 / CONTRACT-REC §4 statements on "system capture time" are binding definitions (K-7); and the
   discrepancy between CODE-GAP-AUDIT-001 K-7 ("not stated") and those records — CODE-GAP-AUDIT-001 is not edited.
8. Any external fact (LinkedIn S14 applicability; real-source data shapes; personal-data prevalence in quotes) —
   recorded as EVIDENCE GAP, not researched.
9. Any change to code, tests, schema or configuration that an answer might imply — not authorized.

## §12 Final authority block

```text
Implementation authorization: NONE
Production code changes: NONE
Test changes: NONE
Schema/migration authority: NONE
Database authority: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Credential / API-key authority: NONE
Runtime-wiring authorization: NONE
Integration registration authority: NONE
Key-registration authority: NONE
Scraping/browser automation authority: NONE
Provider-contact authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Commit/push authority: NONE

Product Owner decisions made by this record: NONE
K-1 / K-2 / K-4 / K-5 / K-6 / K-7: PENDING
```

## §13 Execution counters (this record)

```text
Files created: 1 (this record)
Existing files modified: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Credentials used: 0
Runtime wiring changes: 0
Integration / key registrations: 0
Scraping/browser automation: 0
Provider contact: 0
Tests / validation run: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
Pushes: 0
```
