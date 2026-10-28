# CLIENT INTENT DISCOVERY

## Discovery of Prospective Clients from Authorized External Intent Sources — Product Requirement

**Requirement ID:** CLIENT-INTENT-DISCOVERY-REQ-001
**Date:** 2026-09-30
**Type:** product requirement / governance requirement. **Not an implementation authorization**, not a decision
record, not an implementation plan.
**Author role:** repository analyst / governance recorder.

```text
Requirement status: DEFINED / PENDING IMPLEMENTATION DECISIONS
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

**Amendment 1 (2026-10-01) — expanded source taxonomy and intent distinction.** Requirement-only amendment; adds §0.1,
§2A–§2C, §3A, R-5.4–R-5.5, §10A, §11A and §12A. All original text, decisions, open questions and authority boundaries
are preserved unchanged.

```text
Requirement definition: AMENDED
Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Production provider access: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Scraping/browser automation authority: NONE
Credential-sharing authority: NONE
```

**Amendment 2 (2026-10-01) — provider-neutral, multi-source Client Intent Discovery architecture.** Requirement-only,
additive amendment; adds §13 (§13.0–§13.11) at the end of this record. No original or Amendment 1 text, decision, open
question, provider selection or authority boundary is removed or changed. Authority state is unchanged (§13.11).

> **This record states a product need. It does not select, name or authorize any provider, and it does not claim
> that any provider exposes the data or API capability described. It authorizes no implementation, provider call,
> credential, configuration, runtime wiring, database or schema change, scraping, validation, outreach, contact or
> deployment.**

Labels used:

- **REQUIREMENT** — what the product must eventually support. No authority.
- **EXISTING DECISION** — a decision already recorded elsewhere, cited by ID; not reopened or modified.
- **OPEN QUESTION** — unresolved; not answered or ranked here.

---

## §0 Baseline (verified before writing)

| Item | Value |
|---|---|
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 241 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` |

**Related records (sha256):**

| Record | ID | sha256 |
|---|---|---|
| `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | INTENT-INTAKE-PO-DEC-001 (D1–D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION_PREPARATION.md` | DEC-003 preparation | `cc2107b5d976b0a8e78c415ae4a25f54bee396e83fd23307de8ff9e049e57251` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | INTENT-INTAKE-PO-DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_EVIDENCE_CONTRACT_PERSISTENCE_DESIGN.md` | INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2 (OD-1..OD-13) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_PROVIDER_AUTHENTICITY_DECISION_PREPARATION.md` | INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 (Option B) | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_RUNTIME_COMPONENT_DECISION.md` | INTENT-INTAKE-OD13-INGRESS-DEC-001 (Alternative I) | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` |
| `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_POST_SAVE_RESEARCH_DECISION.md` | INTENT-INTAKE-OD13-POSTSAVE-DEC-001 | `6ffd207561c2db580137ddb030df43f072359b2390ad75276ec918fe9b04b16d` |
| `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-ADAPTER-IMPL-REC-001 | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 (PROPOSED) | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |
| `MVP_SCOPE_BOUNDARY.md` | — | `044b406b09832b324bd7d082d1654a1e94730bddff43767865a8955fce2090e3` |
| `PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md` | — | `6b59aa69bb8cd5a9b29a135402d30b682cf2960357f68bc2b05122f88e546294` |

**Existing coverage found:** no record defines Client Intent Discovery across search, AI/assistant and
professional/social providers. The closest records are the intent-source adapter and provider-contract records
(three source families: `PUBLIC_WEB_SEARCH`, `AI_PLATFORM_ACQUISITION`, `PUBLIC_INTENT_NOTICE`), the OD-13 records
(first-party push ingress), and the Google Ads requirement (proposed). DEC-003 preparation §4 left "whether ChatGPT,
Gemini or Claude expose such data" out of scope. LinkedIn appears only as a research-source kind and an outreach
channel exclusion, not as an intent source. This record is therefore new and modifies no existing record.

### §0.1 Amendment 1 baseline (verified before amending)

| Item | Value |
|---|---|
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Code fingerprint (same method as §0) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` (unchanged from §0) |
| This record, pre-amendment sha256 | `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` (matches the value cited in the OQ decision / preparation records) |

Amendment 1 exercises no implementation, provider-call, external-HTTP, database, runtime-wiring, validation,
outreach or deployment authority. It does not update the OQ decision records.

---

## §1 Purpose — REQUIREMENT

**R-1.1** The system must be able to discover potential client opportunities from **authorized** external sources in
which a person or organization expresses a need for a service the user offers — for example web development, website
creation, software development, design, or any other user-defined offering.

**R-1.2** The goal is to transform an externally expressed intent signal into a **canonical opportunity** that can
then enter the existing qualification and acquisition workflow.

**R-1.3** The offerings to match against are user-defined; the requirement is not limited to web development.

## §2 Source classes — REQUIREMENT

| Source class | Named examples | Also covers |
|---|---|---|
| **Search providers** | Google | other authorized search providers |
| **AI / assistant providers** | ChatGPT | other authorized AI / assistant providers |
| **Professional / social platforms** | LinkedIn | other authorized professional / social platforms |
| **Extensible providers** | — | additional intent-source providers introduced later through separate authorization and a provider-specific requirement |

**R-2.1** Naming a provider in this table records a **product need only**. It is **not** a claim that the provider
currently exposes the required data, API or permission, and it is not a selection or authorization of that provider.

**R-2.2** How these source classes relate to the existing source families (`PUBLIC_WEB_SEARCH`,
`AI_PLATFORM_ACQUISITION`, `PUBLIC_INTENT_NOTICE`) is not decided here (OQ-12).

## §2A Expanded source taxonomy — REQUIREMENT (Amendment 1)

**R-2A.1** The Client Intent Discovery source universe comprises the following categories. The taxonomy expands the
§2 source classes; it does not replace them, and it records a **product need only** (R-2.1 applies to every entry).

| Category | Named examples | Also covers | Typical signal (conceptual) |
|---|---|---|---|
| **A. Search** | Google Search | other authorized search providers | Search intent (§3A) |
| **B. AI / Assistant** | ChatGPT / OpenAI, Gemini, Claude | other authorized AI providers | As the provider actually documents and authorizes |
| **C. Professional / Social** | LinkedIn, X, Facebook | other authorized professional / social networks | Publicly published client intent (§3A) |
| **D. Communities** | Reddit, Indie Hackers, public forums | other authorized communities | Publicly published project requests / explicit service needs |
| **E. Marketplaces** | Upwork, Fiverr, Freelancer | other authorized project / freelance marketplaces | Explicit commercial project requirements |
| **F. Other authorized providers** | — | future providers added through the existing governance and authorization process | — |

**R-2A.2 A. Search.** Search activity is **search intent** (§3A); it is not necessarily a publicly published
statement by an identifiable person or organization. Conceptual signals include queries such as "web developer near
me", "website development company" or "need someone to build a website". This requirement does **not** claim, and
the product must not assume, access to any individual user's private search history.

**R-2A.3 B. AI / Assistant.** This category is subject to each provider's **actual documented** capabilities, access
rules, privacy rules and authorization. It must not be assumed that any AI provider exposes individual users' private
conversations or prompts. The existing DEC-003 §6 privacy boundary (R-3.3) continues to apply.

**R-2A.4 C. Professional / Social.** The product may recognize **publicly accessible** posts such as "Looking for a
web developer.", "Need someone to build our company website." or "Looking for someone to redesign our website."
Publicly published intent is explicitly distinct from private communications (direct messages, closed groups,
connection-only content) and from any user activity the provider does not legitimately make available to the product.

**R-2A.5 D. Communities.** Communities may contain publicly published project requests or explicit service needs.
Access is limited to what the provider legitimately makes available to the product.

**R-2A.6 E. Marketplaces.** Marketplaces may contain explicit commercial project requirements, for example website
development, website redesign, Shopify development, e-commerce development or web application development. Nothing
in this requirement implies that the product currently has access to any marketplace.

**R-2A.7 F. Extensibility.** The taxonomy is extensible. A future provider is added only through the existing
governance and authorization process (§9) and a provider-specific requirement; inclusion in a category confers no
availability or authority.

**R-2A.8** No provider in this taxonomy is currently available to the product merely because it is named.

## §2B Per-provider verification — REQUIREMENT (Amendment 1)

**R-2B.1** The provider-neutral architecture (§4) is unchanged. Each provider / source requires **separate
verification** of:

1. whether the relevant signal exists;
2. what information is actually exposed;
3. whether it is public or supplied to the product;
4. the permitted access mechanism;
5. authentication requirements;
6. applicable terms;
7. privacy restrictions;
8. retention / deletion requirements;
9. rate limits / quotas;
10. cost;
11. provenance;
12. timestamp / freshness;
13. whether the provider supports the required delivery mechanism.

**R-2B.2** This verification is evidence-gathering toward OQ-2 and OQ-8; it does not answer them, and it is itself
subject to separate authorization where it would require provider access.

## §2C Google Ads separation — EXISTING DECISION boundary (Amendment 1)

**R-2C.1** Google Ads is **not** part of the §2A taxonomy and is not equivalent to public client-intent discovery. It
remains governed solely by INTENT-INTAKE-GOOGLE-ADS-REQ-001 and its related decisions.

**R-2C.2** The product must keep distinct: discovering explicit / search intent; advertising / targeting; published
client requests; and inferred business need.

## §3 Client Intent Signal — REQUIREMENT

**Definition.** A **Client Intent Signal** is an externally sourced indication that a person or organization may be
seeking a service.

**Examples** (commercially relevant service need):
- "I am looking for a web developer."
- "I want to build a website."
- "Need someone to build our website."
- "Looking for a developer/agency for an ecommerce website."
- similar expressions of a commercially relevant service need.

**R-3.1** The product must distinguish these conceptual elements of a signal (concepts only; no fields, schema or
persistence are defined here):

| Element | Meaning |
|---|---|
| Original source evidence | What the source actually contained, as available to the system under the source's access terms |
| Extracted intent | The service need derived from that evidence |
| Potential client / entity | The person or organization expressing the need |
| Requested service | The service the need maps to, relative to the user's offerings |
| Source / provider identity | Which authorized source and provider the signal came from |
| Timestamp / freshness | When the need was expressed and when it was observed |
| Confidence / evidence quality | How strongly the evidence supports a genuine, current service need |
| Resulting opportunity | The canonical opportunity, if and when one is created |

**R-3.2** Extracted intent must be distinguishable from, and traceable to, the original evidence; it must not be
presented as if it were the source's own words.

**R-3.3 Existing constraints that continue to apply (EXISTING DECISION, not reopened):** the existing intake rules
derive kind and confidence centrally and reject source-assigned kind / confidence / classification
(INTENT-SOURCE-ADAPTER-IMPL-REC-001; PO-DEC-001 D5); the existing privacy boundary (DEC-003 §6 and the
provider-contract privacy screen) prohibits individual-level AI-conversation access, prompt capture, personal email /
phone harvesting, click / advertising / device identifiers and inference about named individuals. Whether and how an
**individual person** (as opposed to an organization) may be a potential client under that boundary is an open
question (OQ-11), not decided here.

## §3A Intent distinction — REQUIREMENT (Amendment 1)

```text
SEARCH INTENT
≠
PUBLISHED CLIENT INTENT
≠
INFERRED BUSINESS NEED
```

| Concept | Definition | Example | Status as evidence |
|---|---|---|---|
| **Search Intent** | A user expresses a need through a search query or other search activity. | "I need a website developer." | Evidence of search intent; does **not** by itself establish an identifiable public client request. |
| **Published Client Intent** | A person or organization publicly publishes a request or statement indicating a service need. | "Looking for a web developer to build our company website." | Explicit published intent signal, **only** where the source legitimately makes the content publicly accessible. |
| **Inferred Business Need** | The system infers that an organization may need a service based on observable facts. | A business appears to have no website. | System inference; must **not** automatically be treated as explicit client intent. |

**R-3A.1** The product must preserve the distinction between **observed evidence** and **system inference**, and
must not relabel one concept as another.

**R-3A.2 Additional examples of explicit website-development intent** (extending the §3 examples):
- "I need a website."
- "I want to build a website."
- "Looking for a web developer."
- "Looking for someone to build our website."
- "Need someone to redesign our website."
- "Looking for an e-commerce website developer."
- "Need a Shopify developer."
- "Looking for someone to build our web application."
- "Who can build a website for my business?"

These are examples only and do not restrict the product to web-development services (R-1.3). The underlying
requirement is unchanged: **the user defines what service they sell; the system discovers relevant expressions of
demand for that service.**

**R-3A.3 Privacy boundary preserved.** Amendment 1 weakens no existing privacy restriction (R-3.3). It does not
authorize: access to private AI conversations; capture of private prompts; private messages; private search
histories; personal emails or phone numbers; advertising IDs; click IDs; unauthorized individual-level tracking; or
inference about named individuals where prohibited by existing governance. Publicly accessible content and
provider-supplied data remain governed separately.

## §4 Provider-neutral architecture — REQUIREMENT

**R-4.1** The requirement is **provider-neutral**. The downstream opportunity model must not depend on the
peculiarities of Google, ChatGPT, LinkedIn or any single provider.

**R-4.2** Provider-specific concerns — adapters, authentication, API limits, search / query mechanisms, terms and
permissions, evidence retrieval, and freshness behavior — must be handled separately, per provider, under
provider-specific requirements and authorizations.

**R-4.3** Adding or removing a provider must not require changing the meaning of a Client Intent Signal or a canonical
opportunity.

## §5 Authorization and legitimacy — REQUIREMENT

**R-5.1** Discovery must use only sources and access mechanisms that are **authorized for the product's use**.

**R-5.2** This record does not prescribe, and does not permit by implication, scraping, browser automation, credential
sharing, circumvention of access controls, or any other access mechanism.

**R-5.3** Provider-specific access and permissions require separate authorization before any implementation or
execution.

**R-5.4 (Amendment 1)** Naming a provider anywhere in this record (§2 or §2A) is a product requirement, **not**
evidence that the provider exposes the required data, offers an API, permits the intended use, permits automated
collection, or permits commercial use.

**R-5.5 (Amendment 1)** Amendment 1 does not authorize scraping, browser automation, bypassing access controls,
credential sharing or unauthorized API use. Any actual provider access requires separate authorization (§9).

## §6 Evidence and provenance — REQUIREMENT

**R-6.1** Every discovered opportunity must be traceable to the source evidence available to the system, subject to
the source's permitted access and retention constraints.

**R-6.2** Provenance is a product requirement. This record does **not** decide: storage schema; retention period;
database tables; evidence-capture implementation; provider-specific storage rules. Existing decisions on
non-persistence of raw provider payloads and provenance (provider-contract record; OD-10; OD-13 Q9) remain in force
where they apply.

## §7 Opportunity flow — REQUIREMENT (conceptual; not implemented or modified)

```text
Authorized Intent Source
        ↓
Intent Discovery
        ↓
Source Evidence / Provenance
        ↓
Intent Extraction
        ↓
Intent Qualification
        ↓
Canonical Opportunity
        ↓
Existing Qualification / Acquisition Workflow
        ↓
Offer / Outreach / Follow-up
```

**R-7.1** The flow is conceptual. It does not modify the existing intake, qualification, opportunity, offer,
outreach or follow-up behavior, and authorizes none of its steps.

**R-7.2** Outreach and follow-up remain under their existing governance (e.g. PHASE_22 / PHASE_23 scope locks). This
record grants no outreach or contact authority; required human approval before outreach is an open question (OQ-10).

## §8 Separation from OD-13 — EXISTING DECISION boundary

**R-8.1** Client Intent Discovery is **separate** from the OD-13 first-party authenticated push-ingress work.

| | OD-13 work | Client Intent Discovery |
|---|---|---|
| Concerns | Authenticated first-party (`SUPPLIED_TO_US`) intent results **pushed** by a named AI-platform integration | **Discovering** intent from authorized external providers / platforms |
| Governing records | OD-1..OD-13, OD13-M (Option B), IG-1..IG-7 (Alternative I), PS-1..PS-8 | this record (requirement only) |

**R-8.2** This record does not reopen, modify, extend or imply authorization for any OD-13 decision, the OD-13
runtime gate (which stays in force), Option B, Alternative I or the post-save decision. If a future provider under
this requirement would supply FIRST_PARTY signals, the existing OD-1..OD-13 rules govern that path unchanged.

## §9 Separate authorization requirement — REQUIREMENT

**R-9.1** Every provider integration requires its **own future authorization**, covering as applicable:

1. provider selection;
2. provider / API access;
3. credentials or keys;
4. provider-specific configuration;
5. implementation;
6. provider calls;
7. runtime wiring;
8. evidence handling;
9. validation;
10. deployment.

**R-9.2** This requirement itself grants **none** of those authorities.

## §10 Open questions (unranked; not answered)

| # | Question |
|---|---|
| OQ-1 | Which providers will be authorized first? |
| OQ-2 | What provider / API capabilities are actually available? |
| OQ-3 | What constitutes sufficient evidence of buying intent? |
| OQ-4 | How should intent confidence be determined? |
| OQ-5 | How should duplicate intent across providers be handled? |
| OQ-6 | How should stale intent decay? |
| OQ-7 | How should the same prospective client appearing across Google, ChatGPT, LinkedIn and other providers be unified? |
| OQ-8 | What provider-specific access and retention constraints apply? |
| OQ-9 | When does an intent signal become a canonical opportunity? |
| OQ-10 | What human approval is required before outreach? |
| OQ-11 | May an individual person (not an organization) be a potential client, and if so, how does that fit the existing privacy boundary? |
| OQ-12 | How do the four source classes relate to the existing source families and to INTENT-INTAKE-GOOGLE-ADS-REQ-001? |

## §10A Open dependencies introduced by Amendment 1 (unranked; not decided)

The existing open questions OQ-1..OQ-12 are unchanged and are not answered, removed, ranked or modified by Amendment 1.
In particular, OQ-1, OQ-2 and OQ-8 remain open, and no provider candidate is converted into an established capability.

| # | Dependency | Related OQ |
|---|---|---|
| AMD1-DEP-1 | How the six §2A taxonomy categories map onto the four §2 source classes and the existing source families. | OQ-12 |
| AMD1-DEP-2 | Whether and when Search Intent, which may lack an identifiable client, can contribute to a canonical opportunity. | OQ-3, OQ-9 |
| AMD1-DEP-3 | How Inferred Business Need is represented relative to explicit intent without being treated as explicit client intent. | OQ-3, OQ-4 |
| AMD1-DEP-4 | Per-provider verification results (R-2B.1) for each §2A provider candidate. | OQ-2, OQ-8 |

## §11 Execution counters (this record)

```text
Files created: 1 (this record)
Existing requirement records modified: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Provider calls: 0
External HTTP requests: 0
Database connections: 0
Database writes: 0
Runtime wiring changes: 0
Scraping: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

### §11A Execution counters (Amendment 1)

```text
Files modified: 1 (this record)
Other requirement / decision records modified: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Provider calls: 0
External HTTP requests: 0
Database connections: 0
Database writes: 0
Runtime wiring changes: 0
Scraping: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

## §12 Final state

```text
Requirement status: DEFINED / PENDING IMPLEMENTATION DECISIONS
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

## §12A Final state after Amendment 1

```text
Requirement definition: AMENDED
Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Production provider access: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Scraping/browser automation authority: NONE
Credential-sharing authority: NONE
```

---

## §13 Amendment 2 — Provider-neutral, multi-source Client Intent Discovery — REQUIREMENT

**Amendment ID:** CLIENT-INTENT-DISCOVERY-REQ-001 Amendment 2
**Date:** 2026-10-01
**Type:** additive requirement amendment. **Not an implementation authorization**, not a decision record, not a
provider selection, not an implementation plan.

> **Amendment 2 formalizes the product direction that Client Intent Discovery is a provider-neutral, multi-source
> capability built on legitimately exposed intent evidence. It names source categories only. It does not select,
> rank or authorize any provider, does not state that any provider exposes the required data, and grants no
> execution authority of any kind.**

### §13.0 Amendment 2 baseline (verified before amending)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Working-tree entries before amending | 2 untracked (`CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md`, `CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md`) |
| This record, pre-Amendment-2 sha256 | `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` (matches the canonical value cited in OQ-1-2-8-PO-DEC-001 and PROVIDER-FINALIZATION-DEC-001) |

**Governing records verified (sha256 at baseline; none modified by Amendment 2):**

| Record | ID | sha256 |
|---|---|---|
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-PREP-001 | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| `CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001 | `4506a050d215805e483fbaf07c2f56a57a43655f80b47808472cbe94a62ebe44` |
| `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-001 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-PREP-001 | `1f7e0af55c526aa491d443be297221860e116f4290a2aead52b29a7d70fb973f` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-FINALIZATION-DEC-001 | `adcb7f5333511cdc673bd4046b86217d1c6e889801521c80c34bd9fae2ab6bab` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION.md` | CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-001 | `a5973f4f644369b910547436ccadd4c31e66ee3787025173ece6c269a12b5765` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |

**Additivity check:** Amendment 2 inserts one header paragraph and appends §13. It deletes or rewrites no existing
sentence, requirement (R-1 … R-9, R-2A–R-2C, R-3A), open question (OQ-1..OQ-12), dependency (AMD1-DEP-1..4) or
authority block. Where §13 restates an existing rule, the existing rule governs and §13 adds no exception to it.

### §13.1 Product direction — REQUIREMENT

**R-13.1** Client Intent Discovery must **not depend on** obtaining private Google Search history, private ChatGPT
conversations, private search logs, private AI prompts or personally identifiable search histories. No product
capability may be defined such that it works only if such data is obtained.

**R-13.2** The product discovers legitimate client-intent signals from sources where the relevant intent is
**intentionally / publicly exposed**, or is otherwise **lawfully made available to the product through an authorized
provider / access route** (§13.5).

**R-13.3** Conceptual target evidence (examples only; they do not restrict the product to these services — R-1.3 and
R-3A.2 continue to apply):

- "Looking for someone to build our company's website."
- "Need a web developer for our new website."
- "Looking for a company to build an e-commerce website."
- "Need a mobile app developer for our MVP."
- "We need a developer to build a SaaS product."
- "Looking for an agency to redesign our website."
- "Need a React/Node developer for a new project."
- "Looking for someone to build an internal business application."
- "Need a development team for a new product."

### §13.2 Intent evidence classes — REQUIREMENT (preserves §3A)

**R-13.4** The three intent concepts defined in §3A remain distinct evidence classes and must **not** be treated as
equivalent, merged or relabelled (R-3A.1):

| Evidence class | Meaning (per §3A) | Amendment 2 note |
|---|---|---|
| **Search intent** | A person entered a search query or other search activity. | Not by itself an identifiable client request (§3A). R-13.1 applies: the product does not depend on access to individuals' private queries. |
| **Published / self-declared client intent** | A person or organization intentionally published or submitted a request or requirement. | The primary conceptual target of §13.1 evidence, subject to §13.5 and §13.7. |
| **Inferred business need** | The system infers a possible need from permitted evidence. | A system inference; never presented as explicit client intent (R-3A.1, AMD1-DEP-3). |

**R-13.5** Whether and when search intent may contribute to a canonical opportunity remains governed by existing
records (AMD1-DEP-2; OQ-3 and OQ-9 as recorded in OQ-PO-DEC-001). Amendment 2 does not decide it.

### §13.3 Source architecture — REQUIREMENT

**R-13.6** Client Intent Discovery is organized around the six existing source categories of §2A. Amendment 2 states
their scope descriptively; it does not replace §2 or §2A and does not change OQ-12.

| Category | Scope (descriptive) | Examples of source kinds (category examples only) |
|---|---|---|
| **A. Search / public web** | Search activity and publicly accessible web content | Search engines; public web pages |
| **B. AI / assistant** | Only what an AI / assistant provider actually documents and authorizes (R-2A.3) | AI / assistant platforms |
| **C. Professional / social** | Publicly accessible professional / social content (R-2A.4) | LinkedIn and similar networks |
| **D. Communities** | Publicly published project requests / service needs (R-2A.5) | Reddit and similar communities; public forums |
| **E. Marketplaces / freelance / RFP / project-request sources** | Explicit commercial project requirements and requests for proposal | Freelance / project marketplaces; RFP, tender and procurement sources; project-request platforms |
| **F. Other authorized intent providers** | Future providers added through governance (R-2A.7) | Other authorized intent feeds / providers |

**R-13.7** Naming a provider or source kind in §13 is a **product / source-category requirement only**. It is **not**
evidence that the provider exposes the desired data, offers an API, permits the intended or commercial use, or permits
automated collection, and it is **not** authorization to access it (R-2.1, R-2A.8, R-5.4 apply unchanged).

**R-13.8** No provider is stated by §13 to currently expose the required data. Provider capability statuses remain
exactly as recorded in PROVIDER-EVIDENCE-001 and adopted in OQ-1-2-8-PO-DEC-001 §3–§4.

### §13.4 Provider-neutral core — REQUIREMENT

**R-13.9** The core Client Intent Discovery engine must be independent of any single provider. Conceptual flow:

```text
Provider / source
        ↓
Source-specific evidence
        ↓
Canonical Intent Signal          (provider-neutral)
        ↓
Intent classification
        ↓
Business identification
        ↓
Qualification
        ↓
Opportunity creation
        ↓
Human approval
        ↓
Outreach workflow
```

**R-13.10** The canonical Intent Signal (§3, R-3.1) is **provider-neutral**: its meaning must not depend on any one
provider's data format, terminology, access mechanism or terms (extends R-4.1–R-4.3).

**R-13.11** Provider-specific adapters / connectors must remain **separate from the core engine**. Provider-specific
concerns stay per-provider (R-4.2, R-2B.1).

**R-13.12** **Core system capability and provider access are separate concerns.**

**R-13.13** The product may be architected so that the core intent-processing capability can be developed without
first obtaining production access to Google, OpenAI / ChatGPT, LinkedIn, Reddit or any other provider. **No provider
integration, provider access, credential, call or implementation is authorized merely by defining this
architecture**; each remains subject to §9 (R-9.1–R-9.2) and to separate authorization for the core itself.

**R-13.14** The conceptual flow does not modify existing behavior (R-7.1). Classification remains central (R-3.3;
PO-DEC-001 D5); opportunity creation, human approval and outreach remain governed by existing records (R-7.2;
OQ-9 and OQ-10 as recorded in OQ-PO-DEC-001; PHASE_22 / PHASE_23).

### §13.5 Public / authorized evidence principle — REQUIREMENT

**R-13.15** Usable intent evidence must come through one of:

1. intentionally published / public information;
2. an officially documented provider capability;
3. an authorized API / feed / export;
4. another explicitly approved access mechanism.

**R-13.16** Meeting R-13.15 does **not** by itself authorize collection: R-5.1–R-5.5 and §9 continue to apply, and
publicly accessible content remains subject to the source's access terms (R-2A.4–R-2A.6).

**R-13.17** The system must **not** rely on:

- private search history;
- private AI conversations;
- private user prompts;
- private platform data not legitimately exposed to the product;
- credential sharing;
- scraping where prohibited or not authorized;
- browser automation used to circumvent access controls;
- bypassing authentication, rate limits, terms or technical restrictions.

### §13.6 High-intent opportunity sources — REQUIREMENT

**R-13.18** The product may **conceptually** support high-intent sources where users explicitly request services,
including:

- freelance / project marketplaces;
- RFP and tender sources;
- public project requests;
- business / community posts;
- professional / social posts where the relevant content is legitimately accessible;
- search / public-web evidence;
- other authorized intent feeds.

**R-13.19** No named marketplace, RFP / tender source or other provider is approved, selected or stated to be
technically available by this section. Each requires per-provider verification (R-2B.1) and separate authorization
(§9).

### §13.7 Privacy boundary — EXISTING DECISION (preserved)

**R-13.20** All existing privacy restrictions remain in force unchanged: R-3.3, R-3A.3, DEC-003 §6 and the
provider-contract privacy screen. Amendment 2 weakens none of them.

**R-13.21** Amendment 2 introduces **no** requirement to identify anonymous searchers or AI users, and does not
require: names of private searchers; private email addresses; private phone numbers; individual AI conversation
content; individual search histories; advertising IDs; click IDs; or identity resolution from prohibited / private
data.

**R-13.22** Where an **organization** can legitimately be identified from permitted evidence, the system may
conceptually create an **organization-level** opportunity, subject to existing requirements and decisions (including
OQ-3, OQ-7 and OQ-9 as recorded in OQ-PO-DEC-001).

**R-13.23** The existing Product Owner decision excluding private individuals (OQ-11 as recorded in OQ-PO-DEC-001) is
unchanged. No existing decision permits changing it, and Amendment 2 does not.

### §13.8 Sustainability — no single-provider dependency — REQUIREMENT

**R-13.24** The architecture must avoid single-provider dependency. Client Intent Discovery must not be defined such
that its core capability requires any one provider.

**R-13.25** The product must support multiple source adapters so that discovery can continue, from other authorized
sources, when:

- one provider becomes unavailable;
- provider terms change;
- APIs change;
- access is revoked;
- pricing changes;
- one source has insufficient coverage.

**R-13.26** The canonical opportunity model must remain independent of such provider-specific changes (R-4.3).

**R-13.27** R-13.24–R-13.26 are product-level requirements only. They define no adapter, interface, schema, storage,
scheduling or implementation plan, and they do not authorize adding any adapter or provider.

### §13.9 Relationship to existing records — EXISTING DECISION boundary

**R-13.28** Not reopened, modified, answered or re-ranked by Amendment 2:

- OQ-1..OQ-12 in §10 (text unchanged) and their answers / statuses in OQ-PO-DEC-001, the OQ decision log and
  OQ-1-2-8-PO-DEC-001 — including the OQ-1 answer (Google Search selected for first consideration, policy level only)
  and the OQ-2 / OQ-8 adopted statuses;
- PROVIDER-EVIDENCE-001, PROVIDER-EVIDENCE-PREP-001 and PROVIDER-FINALIZATION-DEC-001;
- INTENT-INTAKE-GOOGLE-ADS-REQ-001, GA-Q0..GA-Q15 and R-2C.1 (Google Ads separation);
- OD-1..OD-13, OD13-M (Option B), Alternative I, PS-1..PS-8, D1–D5, DEC-003 (incl. §6), X1, C-1 and the §8 OD-13
  separation;
- AMD1-DEP-1..AMD1-DEP-4;
- outreach governance (PHASE_22 / PHASE_23), source / provenance rules (§6; OD-10; OD-13 Q9).

**R-13.29** Provider selection is unchanged. No "possible source" in §13 is converted into an "authorized provider".
`Other authorized providers: NOT AUTHORIZED BY THIS AMENDMENT.`

**R-13.30** Conflict check: no instruction implemented by Amendment 2 required changing an existing decision or
authority state; no conflict is recorded.

### §13.10 Execution counters (Amendment 2)

```text
Files modified: 1 (this record)
Other requirement / decision / evidence records modified: 0
Files created: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Provider calls: 0
External HTTP requests: 0
Database connections: 0
Database writes: 0
Runtime wiring changes: 0
Scraping/browser automation: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

### §13.11 Final state after Amendment 2

```text
Requirement definition: AMENDED (Amendment 2 — additive)
Providers authorized by Amendment 2: NONE
Provider selection: UNCHANGED
OQ-1..OQ-12: UNCHANGED
Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Production provider access: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Scraping/browser automation authority: NONE
Credential-sharing authority: NONE
```
