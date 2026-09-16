# MVP SCOPE BOUNDARY

**Authoritative scope-control artifact for the current engineering release.**

| | |
|---|---|
| Document | `requirement/MVP_SCOPE_BOUNDARY.md` |
| Status | Authoritative for the current release |
| Current release | Foundation + Client Finder MVP |
| Current engineering focus | ACQUIRE foundation / Client Finder |
| Companion documents | `requirement/AI Client Acquisition OS — Product Requirements Document V2.0.md`, `docs/ARCHITECTURE.md`, Client Finder Readiness Audit |

> This document does not describe what the product will become. It describes
> what is allowed to be built **now**. Its purpose is to make scope expansion a
> visible, deliberate act rather than an accident.

---

## 1. PRODUCT VISION

### MAKE MONEY WITH AI

```text
DISCOVER  →  BUILD  →  ACQUIRE  →  EARN
```

The ultimate user is a person who wants to earn money using AI. This
explicitly includes **beginners** who do not already hold a technical skill, a
freelance practice, or a client base.

The product should eventually move a user from:

> "I want to make money with AI"

to:

```text
"I found an opportunity"
  → "I know what to offer"
    → "I found potential customers"
      → "I contacted them"
        → "I got a client"
          → "I earned money"
```

**This is the PRODUCT VISION. It is NOT the current MVP scope.**

The vision exists in this document for one reason: so that work can be
recognised as belonging to the vision and *deferred*, rather than being
smuggled into the current release because it is obviously part of the product
one day.

### Where the current release sits in the vision

| Vision stage | Current release |
|---|---|
| DISCOVER (find an income path) | Not in scope |
| BUILD (create a sellable service) | Not in scope |
| **ACQUIRE (find and win customers)** | **Foundation only — Client Finder** |
| EARN (get paid, repeat) | Not in scope |

The current release builds the **foundation of ACQUIRE**, and only the
find-and-qualify half of it.

---

## 2. CURRENT ENGINEERING RELEASE

### Client Finder MVP

The MVP validates the **ACQUIRE foundation**.

**Core MVP promise:**

> A user can define what they sell, and the system can find approximately 20
> businesses that appear to have a genuine need for that service, explain why
> with evidence, rank the opportunities, and allow the user to provide
> feedback.

Everything in this document resolves to that sentence. A capability that does
not serve it is out of scope for this release, regardless of how close to
finished it already is.

**What the MVP is validating** is not the software. It is the premise that a
system can identify businesses with a real, evidenced need — well enough that a
user would actually act on the result.

---

## 3. MVP USER JOURNEY

The authoritative journey for this release:

```text
DEFINE SERVICE
  ↓
DISCOVER BUSINESSES
  ↓
NORMALIZE
  ↓
DEDUPLICATE
  ↓
RESEARCH
  ↓
COLLECT EVIDENCE
  ↓
CLASSIFY EVIDENCE
  ↓
DETECT NEED
  ↓
RECOMMEND OFFER
  ↓
CREATE OPPORTUNITY
  ↓
SEVEN-FACTOR SCORE
  ↓
RANK
  ↓
DISPLAY APPROXIMATELY 20 OPPORTUNITIES
  ↓
USER REVIEWS PROSPECT
  ↓
USER PROVIDES FEEDBACK
```

### Stage definitions

| # | Stage | Meaning |
|---|---|---|
| 1 | **DEFINE SERVICE** | The user states what they sell, to whom, where, and the minimum project value worth their time. This is the input that personalises every downstream stage. Without it the system has no basis for judging fit. |
| 2 | **DISCOVER BUSINESSES** | Given the service definition, obtain a set of candidate businesses from an external source, behind a provider interface so the source can change without changing the engine. |
| 3 | **NORMALIZE** | Convert provider-shaped candidates into one internal representation: consistent name, location, contact fields, and identifiers. Provider quirks stop here. |
| 4 | **DEDUPLICATE** | Collapse candidates that are the same real-world business arriving under different names, URLs, or listings. One business must appear to the user once. |
| 5 | **RESEARCH** | For each surviving candidate, gather source material and produce a structured account of the business: what it does, who it serves, what is visibly wrong or missing. |
| 6 | **COLLECT EVIDENCE** | Retain the specific source text supporting each claim, with its URL and the time it was observed. A claim without retrievable support is not evidence. |
| 7 | **CLASSIFY EVIDENCE** | Label every claim **OBSERVED** (a source states it, quotable verbatim), **INFERRED** (reasoned from sources, with the basis recorded), or **UNKNOWN** (the sources do not say). Confidence is attached per claim. |
| 8 | **DETECT NEED** | Decide whether the evidence indicates a genuine need for the user's service — not merely that the business exists and could theoretically buy. |
| 9 | **RECOMMEND OFFER** | Map the detected need to what the user actually sells. Where evidence is insufficient, the correct recommendation is **NONE**. |
| 10 | **CREATE OPPORTUNITY** | Persist the prospect, its evidence, its detected need and its recommended offer as a durable, reviewable record with a state. |
| 11 | **SEVEN-FACTOR SCORE** | Score the opportunity across the seven defined factors, applying the inference discount and signal-freshness decay. Each factor score must be explainable on its own. |
| 12 | **RANK** | Order opportunities deterministically. Identical inputs must produce an identical order — a ranking a user cannot reproduce is a ranking they cannot trust. |
| 13 | **DISPLAY ~20 OPPORTUNITIES** | Present the ranked set at a size a person can actually work through. Twenty is a usability decision, not a technical limit. |
| 14 | **USER REVIEWS PROSPECT** | The user opens one opportunity and sees the business, the evidence, the classification, the score breakdown, and the recommended next action. |
| 15 | **USER PROVIDES FEEDBACK** | The user records whether the opportunity was useful and why. |
| 16 | **(persistence of feedback)** | Feedback is stored against the opportunity. Unstored feedback is not feedback — it is a UI gesture. |

---

## 4. CONTROLLED MVP SCENARIO

The initial validation scenario:

| Parameter | Value |
|---|---|
| Service | Website development / redesign |
| Target customer | Restaurants |
| Geography | Mumbai |
| Minimum project value | ₹30,000 |

This is a **controlled starting scenario for validation**. It exists so that
the quality of the output can be judged by a human who knows the domain.

**It is not a permanent limitation of the product.** No code may hardcode
restaurants, Mumbai, website work, or ₹30,000 as system constants. These are
values of a user-supplied service definition; the scenario constrains what we
*test with*, not what the system can *express*.

---

## 5. MVP IN-SCOPE

### 5.1 User / service definition

- Service definition
- Target customer
- Geography
- Minimum project value

### 5.2 Discovery

- Business discovery
- Provider abstraction
- Candidate normalization
- Deduplication

### 5.3 Research

- Research execution
- Source collection
- Evidence extraction
- Observed / inferred / unknown classification
- Confidence
- Provenance
- `observedAt`
- Freshness / decay
- Supersession

### 5.4 Opportunity

- Need detection
- Evidence-backed opportunity creation
- Recommended service
- **NONE** when evidence is insufficient
- Opportunity state
- Seven-factor scoring
- Inference discount
- Signal freshness
- Explainable factor scores
- Deterministic ranking
- Opportunity staleness
- Next-action recommendation

### 5.5 User feedback

- Useful / not useful feedback
- Feedback reason
- Persistence
- Basic outcome tracking

### 5.6 Product surface

- Search creation
- Search status
- Results
- Ranked opportunities
- Prospect detail
- Evidence display
- Score explanation
- Next action
- Feedback

### 5.7 Required technical foundation

Infrastructure is in scope **only where the MVP cannot function reliably
without it**. This list is a ceiling, not a wish list.

| Foundation | Why the MVP requires it |
|---|---|
| Authoritative database schema | One schema, one migration chain. Without it there is nowhere to persist prospects, evidence or opportunities. |
| Persistence | The journey spans stages and time; nothing survives without it. |
| Worker execution | Discovery and research are long-running. They cannot complete inside a request. |
| Job lifecycle | A search must have an observable state: queued, running, complete, failed. |
| Retries | External providers and model calls fail transiently. |
| Idempotency | A retried job must not double-create prospects, evidence or opportunities. |
| Authentication | Every MVP row belongs to a user. |
| User data isolation | One user must never see another's prospects. |
| Error handling | A failed stage must fail visibly, not silently produce an empty result set. |
| Logging | A bad opportunity must be diagnosable after the fact. |
| Basic observability | Enough to answer "did the search run, and what did it cost". |
| Integration testing | The journey must be proven end to end against a real database. |

Anything beyond this list is **not** MVP foundation, including: metrics
dashboards, distributed tracing, autoscaling, multi-region, advanced alerting,
and performance optimisation absent a measured problem.

---

## 6. EXPLICITLY OUT OF SCOPE

The following are **NOT required for Client Finder MVP completion**.

### 6.1 Beginner education / product journey

- AI income course
- Curriculum
- Lessons
- Learning management system
- Portfolio builder
- Skill training

### 6.2 Autonomous acquisition

- Autonomous email sending
- Autonomous Instagram / WhatsApp outreach
- Autonomous follow-ups
- Autonomous negotiation
- Autonomous closing

### 6.3 CRM

- Full CRM
- Contact management suite
- Pipeline automation
- Conversation intelligence

### 6.4 Proposal system

- Automated proposal sending
- Proposal negotiation
- Proposal optimization

### 6.5 SaaS

- Recurring subscriptions
- Usage-based billing
- Team workspaces
- Enterprise accounts
- Advanced quotas
- Subscription plans

### 6.6 Advanced intelligence

- Autonomous agents
- Reinforcement learning
- Automatic scoring-model optimization
- Automatic prospect-ranking optimization

### 6.7 Advanced analytics

- Revenue optimization
- Cohort analytics
- Advanced attribution
- Predictive conversion models

---

## 7. EXISTING LOGIC VS MVP INTEGRATION

> **Existing repository code must not automatically be considered MVP scope
> merely because it exists.**

The repository contains substantial acquisition, research, outreach and
proposal domain logic. Most of it is well built. Almost none of it is
connected. The presence of a module is not evidence that the corresponding MVP
capability works.

### 7.1 Two independent classifications

Every feature carries a **status** and a **readiness**. They are not the same
axis and must be stated separately.

**Status** (PRD V2.0 §104 vocabulary):

| Status | Meaning |
|---|---|
| IMPLEMENTED LOGIC | The domain logic exists and can be tested. Says nothing about API, UI, worker or deployment. |
| PARTIAL | Some components exist; the complete journey does not work. |
| NOT IMPLEMENTED | The requirement is defined; no meaningful implementation exists. |
| FUTURE | Intentionally deferred. Must not enter the current release unless the product stage changes. |

**Readiness** — four gates, each of which must be passed separately:

| Gate | Question |
|---|---|
| IMPLEMENTED | Does the logic exist? |
| INTEGRATED | Is it reachable from a real entry point, with persistence? |
| TESTED | Is the behaviour proven against real infrastructure, not only in isolation? |
| PRODUCTION READY | Can it run, be operated, and be recovered in production? |

**A domain module existing in isolation does not mean the corresponding MVP
capability is complete.** A module that is IMPLEMENTED but not INTEGRATED
contributes nothing to the MVP promise.

### 7.2 Current classification

Derived from the Client Finder Readiness Audit. Where this table and PRD V2.0
Appendix A disagree, the disagreement is recorded in §12.4 rather than
silently resolved.

| MVP capability | Status | Impl. | Integ. | Tested | Prod |
|---|---|:--:|:--:|:--:|:--:|
| Service definition | NOT IMPLEMENTED | — | — | — | — |
| Business discovery | NOT IMPLEMENTED | — | — | — | — |
| Candidate normalization | NOT IMPLEMENTED | — | — | — | — |
| Deduplication (candidates) | NOT IMPLEMENTED | — | — | — | — |
| Research execution | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Evidence + provenance | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Evidence classification | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Signal freshness / decay | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Supersession | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Need detection | PARTIAL | ✓ | — | — | — |
| Recommended offer | PARTIAL | ✓ | — | — | — |
| Opportunity creation | NOT IMPLEMENTED | — | — | — | — |
| Seven-factor scoring | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Inference discount | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Deterministic ranking | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Opportunity staleness | IMPLEMENTED LOGIC | ✓ | — | — | — |
| Next-action recommendation | IMPLEMENTED LOGIC | ✓ | — | — | — |
| User feedback | NOT IMPLEMENTED | — | — | — | — |
| Search creation / status | NOT IMPLEMENTED | — | — | — | — |
| Results / prospect detail UI | PARTIAL | ✓ | — | — | — |
| Authoritative schema | PARTIAL | — | — | — | — |
| Acquisition persistence | NOT IMPLEMENTED | — | — | — | — |
| Worker execution | PARTIAL | ✓ | — | ✓ | — |
| Authentication / isolation | NOT IMPLEMENTED | — | — | — | — |
| Logging | PARTIAL | ✓ | — | ✓ | — |
| Integration testing (journey) | NOT IMPLEMENTED | — | — | — | — |

### 7.3 What this table means for planning

- **The scoring engine is finished and unreachable.** Scoring, ranking,
  staleness and next-action are IMPLEMENTED LOGIC with no persistence and no
  API. They need connecting, not building.
- **The first four journey stages do not exist at all.** Service definition,
  discovery, normalization and deduplication are the genuine build.
- **Research is finished and has nowhere to write.** Its persistence interface
  has no implementation and its target table is not created by any migration.
- **No acquisition capability is INTEGRATED.** Zero of the MVP capabilities
  above have passed the second gate.

Reuse is mandatory where logic exists. The MVP must **not** reimplement
scoring, evidence handling, freshness, staleness or next-action.

---

## 8. SCOPE EXPANSION RULE

No new feature may enter the current MVP merely because:

- it already exists in the repository
- it appears in the long-term PRD
- it is technically interesting
- it would make the architecture more complete
- it is useful for a future SaaS product

### The four questions

Any proposed addition must answer all four:

1. **Is it required for the Client Finder MVP?**
2. **Does the MVP fail without it?**
3. **Is it necessary for data integrity, security, or reliability?**
4. **Can it be deferred without invalidating the MVP experiment?**

> If the honest answers are **no, no, no, yes** — **defer it.**

### Applying the rule to what already exists

| Candidate | Q1 | Q2 | Q3 | Q4 | Decision |
|---|:--:|:--:|:--:|:--:|---|
| Outreach generation (`core-outreach`, built) | No | No | No | Yes | **Defer to Phase 2** |
| Proposal system (`core-proposal`, built) | No | No | No | Yes | **Defer to Phase 3** |
| Follow-up cadence (built) | No | No | No | Yes | **Defer to Phase 2** |
| Meta CAPI worker loop (built, unrun) | No | No | No | Yes | **Defer — commerce, not MVP** |
| Authentication | Yes | Yes | Yes | No | **In scope** |
| Acquisition persistence | Yes | Yes | Yes | No | **In scope** |
| Metrics / tracing beyond basic logging | No | No | No | Yes | **Defer** |
| CRM-shaped tables (`acq_clients`, `acq_conversations`, `acq_activities`) | No | No | No | Yes | **Do not migrate in this release** |

The last row matters: a schema decision can expand scope as effectively as a
feature. Migrating the full acquisition data model because it is already
written would import CRM and conversation management into a release that
excludes both.

---

## 9. MVP SUCCESS CRITERIA

The MVP is **not** successful merely because:

- the application builds
- tests pass
- APIs respond
- prospects are displayed

Those are engineering facts. They are necessary and they prove nothing about
the product.

### The MVP must demonstrate

1. Real business discovery
2. Real research
3. Evidence-backed opportunity identification
4. Explainable ranking
5. Approximately 20 useful opportunities
6. The user can understand **why** each opportunity was selected
7. The user can provide feedback
8. Feedback is persisted
9. **The system does not fabricate business needs**

Criterion 9 is the one that can destroy the product. An invented need is worse
than no opportunity: it wastes the user's credibility with a real business and
teaches them not to trust the ranking.

### Primary product-validation question

> **"Would you actually contact this business?"**

### Secondary questions

> "Did you contact them?"
> "Did they reply?"
> "Did a sales conversation occur?"
> "Did you win a client?"

These are **outcome validation** and may extend beyond the first MVP
implementation. They do not gate engineering completion, and building
machinery to measure them automatically is out of scope for this release.

---

## 10. MVP EXIT CRITERIA

The engineering MVP is complete only when **all** of the following hold:

- [ ] An authenticated user can create a service profile
- [ ] A search can be created
- [ ] The search executes through the intended worker path
- [ ] Businesses are discovered
- [ ] Duplicates are removed
- [ ] Research executes
- [ ] Evidence is persisted
- [ ] Observed / inferred / unknown classification works
- [ ] Freshness works
- [ ] Inference discount works
- [ ] Opportunities are persisted
- [ ] Seven-factor scoring works
- [ ] Ranking is deterministic
- [ ] Results are visible
- [ ] Prospect detail works
- [ ] Feedback works
- [ ] User isolation works
- [ ] End-to-end tests prove the path
- [ ] No critical MVP blockers remain

Every line is a behaviour, not a module. "The scoring package exists" does not
satisfy "seven-factor scoring works" — the score must be produced from
persisted evidence for a discovered business and shown to a user.

---

## 11. FUTURE EVOLUTION

```text
PHASE 1   Client Finder MVP
   ↓
PHASE 2   Acquisition workflow
          FIND → RESEARCH → QUALIFY → PERSONALIZE → CONTACT → FOLLOW UP
   ↓
PHASE 3   Proposal / CRM / outcome tracking
   ↓
PHASE 4   AI Acquisition OS
   ↓
PHASE 5   Recurring SaaS
```

> **The existence of future architecture must not expand the current MVP
> automatically.**

Several Phase 2 and Phase 3 capabilities are already implemented as domain
logic. That is an asset for those phases and a **risk** for this one: finished
code invites integration, and integrating it would spend the release on
capabilities no MVP user will reach.

Phase 2 may begin only when the Phase 1 exit criteria in §10 are met and the
validation question in §9 has been answered with real users.

---

## 12. RELATIONSHIP TO PRD V2.0

### 12.1 Document roles

| Document | Role |
|---|---|
| **PRD V2.0** | Product vision and requirements — the holistic product |
| **MVP_SCOPE_BOUNDARY.md** (this) | Current release constraint — what is allowed now |
| **Repository** | Current implementation reality |
| **Tests** | Executable evidence |

### 12.2 Precedence

For **scope questions** in the current release, this document governs. The PRD
describes a larger product and does not authorise building it now.

For **requirement detail** — what a capability must do once it is in scope —
the PRD governs.

Where the repository and the PRD disagree about what exists, **the repository
plus its tests are the evidence**, and the PRD is the claim.

### 12.3 Conflict handling

> If a conflict exists, **flag it rather than silently resolving it.**

A conflict is resolved by updating the losing document, not by quietly
choosing an interpretation in code.

### 12.4 Open conflicts

Recorded here rather than resolved. Each needs an explicit decision.

| # | Conflict | PRD says | Repository shows | Recommended resolution |
|---|---|---|---|---|
| C-1 | MVP stage readiness | Appendix A rates ServiceProfile, client search, discovery provider, candidate normalization and deduplication as **PARTIAL** | No implementation of any of them exists | Update PRD Appendix A to **NOT IMPLEMENTED**. This understates remaining MVP work at the point the schedule is set. |
| C-2 | Authoritative schema | §65 / F-003 require "one authoritative schema and migration chain" | Two Prisma schemas disagree; the one defining the acquisition domain is referenced by no tooling, and no migration creates any `acq_*` table | Decide the authoritative schema before any MVP work begins. This blocks most of §10. |
| C-3 | Boot-time secret validation | `README.md` states every variable is validated at process boot and fails fast | Validation is lazy, on first request; no boot-time call exists | A security control documented rather than enforced. Fix the code or the claim. |
| C-4 | Documented model and migration counts | `docs/DATABASE.md` describes seventeen models; `docs/MIGRATIONS.md` describes six migrations | The deployed schema has six models; the chain has nine migrations with two quarantined | Documentation describes a schema that is not deployed. |
| C-5 | Outreach safety enforcement | §53 requires outreach provenance and an approval gate | The database-level send gate is in a quarantined migration and cannot apply | Outreach must not be wired in any phase until the gate is restorable. Out of scope now; record it so Phase 2 does not start without it. |

None of C-1…C-5 expands MVP scope. C-2 is a prerequisite; the others are
corrections to documentation or to non-MVP subsystems.

---

## 13. FINAL SCOPE TABLE

| Capability | Product Vision | Current MVP | Post-MVP | Future |
| -------------------------- | -------------: | ----------: | -------: | -----: |
| Make money with AI journey |            YES |          NO |      YES |    YES |
| Beginner discovery         |            YES |          NO |      YES |    YES |
| Service definition         |            YES |         YES |      YES |    YES |
| Business discovery         |            YES |         YES |      YES |    YES |
| Research                   |            YES |         YES |      YES |    YES |
| Evidence                   |            YES |         YES |      YES |    YES |
| Opportunity scoring        |            YES |         YES |      YES |    YES |
| User feedback              |            YES |         YES |      YES |    YES |
| Outreach generation        |            YES |          NO |      YES |    YES |
| Outreach sending           |            YES |          NO |      YES |    YES |
| Follow-ups                 |            YES |          NO |      YES |    YES |
| Proposals                  |            YES |          NO |      YES |    YES |
| CRM                        |            YES |          NO |      YES |    YES |
| Revenue feedback           |            YES |     LIMITED |      YES |    YES |
| SaaS subscriptions         |            YES |          NO |       NO |    YES |
| Autonomous acquisition     |            YES |          NO |       NO | FUTURE |

**"LIMITED"** for revenue feedback means: basic outcome tracking against an
opportunity is in scope (§5.5). Revenue attribution, cohort analysis and
predictive conversion modelling are not (§6.7).

---

## Document control

This document is authoritative for the current engineering release. It should
be amended only by a deliberate scope decision recorded in the document itself,
never by implication from a merged change.

Any pull request that adds a capability listed in §6 must either be rejected or
accompanied by an amendment to this document justifying the change against the
four questions in §8.
