# AI CLIENT ACQUISITION OS

## Product Requirements Document — Version 2.1

| | |
|---|---|
| **Version** | 2.1 |
| **Date** | 2026-09-16 |
| **Supersedes** | V2.0 (retained, unmodified, at `requirement/AI Client Acquisition OS — Product Requirements Document V2.0.md`) |
| **Release scope authority** | `requirement/MVP_SCOPE_BOUNDARY.md` — binding, not superseded by this document |
| **Status** | Primary product requirements document for implementation planning |

---

# DOCUMENT PURPOSE

V2.1 preserves the product vision, user journey and long-term direction of V2.0, and adds what V2.0
could not have: **verified knowledge of what the repository actually contains.**

Between V2.0 and V2.1, five investigations were completed — a readiness audit, a database authority
investigation, an identity investigation, a foundation design and a final schema review. Their
verified findings are incorporated here. Their *recommendations* are recorded as decisions only
where an investigation explicitly recorded them as such.

This document does three things V2.0 did not:

1. It separates **what the product is** from **what is being built now** from **what exists in the
   repository** from **what is proven by tests**.
2. It records design corrections discovered by reading the consuming code rather than the
   requirements.
3. It states its own uncertainty. Unresolved questions are listed as unresolved rather than
   answered by assumption.

> **V2.1 does not expand MVP scope.** Where this document describes future functionality, that
> description is not authorisation to build it.

---

# AUTHORITATIVE SOURCE HIERARCHY

When two sources disagree, the higher level wins for its own question — and the disagreement is
recorded in the Conflict Register rather than silently resolved.

| Level | Source | Answers |
|---|---|---|
| 1 | **This PRD** | What is the product, and what must it eventually do? |
| 2 | **`MVP_SCOPE_BOUNDARY.md`** | What may be built in the current release? |
| 3 | **Investigation artifacts** | What is architecturally true, and what was decided? |
| 4 | **Repository** | What exists today? |
| 5 | **Tests** | What is actually proven? |

For **scope** questions, Level 2 governs and this document does not override it.
For **requirement detail**, this document governs.
For **what exists**, Levels 4 and 5 are evidence; this document is a claim.

---

# THE FUNDAMENTAL SEPARATION

```text
PRODUCT VISION          "What are we building?"
        ↓
MVP SCOPE BOUNDARY      "What are we building NOW?"
        ↓
ARCHITECTURE            "How must approved scope be represented?"
        ↓
REPOSITORY              "What exists today?"
        ↓
TESTS                   "What is actually proven?"
```

These layers must not be blurred. In particular:

```text
IMPLEMENTED  ≠  INTEGRATED  ≠  TESTED  ≠  PRODUCTION READY
```

A domain module that exists in isolation contributes nothing to a user outcome. A passing unit test
proves arithmetic, not a journey. This distinction is used throughout and is never collapsed.

---
---

# LAYER 1

# BUSINESS / PRODUCT VISION

---

## 1. THE PROBLEM

A person who wants to earn money with AI faces four separate problems, and most products solve only
the first:

1. **They do not know what to sell.** The space of "AI services" is large, unfamiliar, and full of
   advice that does not survive contact with a paying customer.
2. **They do not know how to make it sellable.** A skill is not an offer. An offer needs a target
   customer, a scope, a price and proof.
3. **They cannot find customers.** This is where most attempts end. Finding businesses that have a
   real, current need — not a theoretical one — is slow, repetitive research work.
4. **They cannot tell a real opportunity from a plausible one.** Without evidence, every business
   looks like a prospect, and time is spent on the ones that were never going to buy.

The fourth problem is the one this product is ultimately differentiated on.

---

## 2. PRODUCT VISION

### MAKE MONEY WITH AI

```text
DISCOVER  →  BUILD  →  ACQUIRE  →  EARN
```

The product moves a user from:

> "I want to make money with AI."

to:

```text
"I found an opportunity"
  → "I know what to offer"
    → "I found potential customers"
      → "I contacted them"
        → "I got a client"
          → "I earned money"
```

This is an **AI-powered income and client-acquisition operating system**, not a lead list and not a
Client Finder. Client Finder is where implementation starts; it is not what the product is.

---

## 3. TARGET USERS

The ICP is deliberately broad at the vision level. The current engineering release starts later in
the journey than some of these users do; that is a sequencing decision, not a narrowing of the
product.

| User | Enters at | Primary need |
|---|---|---|
| **Complete beginner** | DISCOVER | Does not know what AI service to sell |
| **AI learner** | DISCOVER / BUILD | Has skills forming, no offer |
| **Existing professional** | BUILD | Has a skill; wants to turn it into an AI-assisted service |
| **Freelancer** | ACQUIRE | Has a service; needs clients |
| **Small agency** | ACQUIRE / EARN | Has clients; needs repeatable acquisition |
| **Side-income seeker** | DISCOVER / ACQUIRE | Wants a second income without a career change |

> The beginner journey is **not** removed, deferred out of the vision, or reduced to marketing copy.
> It remains a first-class part of the product and appears in the roadmap with an explicit status.

---

## 4. PRODUCT PROMISE

**Long term:**

> From "I want to make money with AI" to "I have a paying customer" — with the uncertainty,
> research and repetitive preparation progressively removed.

**Current release (Client Finder MVP):**

> A user can define what they sell, and the system can find approximately 20 businesses that appear
> to have a genuine need for that service, explain why with evidence, rank the opportunities, and
> allow the user to provide feedback.

The second promise is a strict subset of the first, and is the only one the current release is
accountable for.

---

## 5. WHAT THE PRODUCT IS NOT

- Not a scraped lead list.
- Not a mass-emailing tool.
- Not a CRM.
- Not an autonomous sales agent.
- Not a course or a curriculum, though DISCOVER has educational aspects.
- Not a system that fabricates a business need in order to produce a result.

The last item is a hard product constraint, not a quality goal. An invented need costs the user
their credibility with a real business and teaches them to distrust the ranking.

---

## 6. COMMERCIAL PRODUCT LADDER

Preserved from V2.0. These remain part of the business vision.

| Tier | Product | Purpose | Status |
|---|---|---|---|
| ₹99 | AI Income Starter Kit | DISCOVER | Catalogue exists; funnel implemented |
| ₹499 | AI Freelancing Launch Kit | BUILD | Catalogue exists; funnel implemented |
| ₹1,499 | AI Client Acquisition System | ACQUIRE | Catalogue exists; engine foundation partial |
| SaaS | Recurring | REPEAT / SCALE | FUTURE |

> **Open question (OQ-3):** whether Client Finder access is gated behind the ₹1,499 purchase is
> **not decided**. Nothing in the repository answers it, and the architecture deliberately does not
> assume it. See DEC-002 and the Open Questions section.

---

## 7. PRODUCT PRINCIPLES

1. **Evidence before assertion.** A claim the system makes must be traceable to a source, or
   labelled as inference, or labelled as unknown.
2. **The AI is untrusted input.** Model output is validated, not believed. Provenance is verified
   against supplied sources.
3. **Determinism where it matters.** Scoring and ranking must be reproducible. The same evidence
   and the same scorer version must produce the same order.
4. **The human decides.** The system recommends and prepares; commercial action requires human
   approval.
5. **Explainability is a feature, not documentation.** A user who cannot see why an opportunity
   ranked highly cannot act on it with confidence.
6. **Say "unknown".** A system that cannot express insufficient evidence will invent sufficiency.
7. **Scope is a decision, not a consequence.** Code existing in the repository does not make it
   part of the release.

---

## 8. NORTH-STAR OUTCOME

> **A real user finds an opportunity credible enough to act on, contacts the business, and a
> genuine sales conversation begins.**

The engineering release can complete without this being observed. The product cannot be called
validated without it. These are different gates and are kept separate throughout Layer 5.

---

## 9. STRATEGIC DIFFERENTIATION

The long-term moat is the loop, not any single stage:

```text
DISCOVERY → NEED DETECTION → QUALIFICATION → PERSONALISATION
    → OUTREACH → OUTCOME FEEDBACK → BETTER DISCOVERY
```

Each completed loop should make the next discovery better. The current release builds the first
half and the feedback capture that will eventually close it.

---
---

# LAYER 2

# COMPLETE USER JOURNEY

Every stage below carries an MVP/Future classification. Classification is governed by
`MVP_SCOPE_BOUNDARY.md`; where this document and the Scope Boundary could be read differently, the
Scope Boundary governs.

---

## STAGE A — DISCOVER

| | |
|---|---|
| **User goal** | "I want to make money with AI but do not know what to sell." |
| **System responsibility** | Present viable AI income paths; help the user choose a direction |
| **AI responsibility** | Explain options in the user's context |
| **Human responsibility** | Choose a direction |
| **Inputs** | User's background, available time, interests |
| **Outputs** | A chosen service direction |
| **State transitions** | none → direction chosen |
| **Evidence requirements** | none |
| **Classification** | **FUTURE** — not in current release |

---

## STAGE B — BUILD

| | |
|---|---|
| **User goal** | Turn a direction into something sellable |
| **System responsibility** | Guide definition of service, target customer, offer, positioning, deliverables, pricing, proof |
| **AI responsibility** | Draft and critique the offer |
| **Human responsibility** | Decide the offer and its price |
| **Inputs** | Chosen direction, user's skills |
| **Outputs** | A sellable service definition |
| **Dependencies** | Stage A |
| **Classification** | **FUTURE**, except the minimal Service Profile the MVP requires (Stage E) |

---

## STAGE C — CREATE PROOF

| | |
|---|---|
| **User goal** | Have something credible to show |
| **System responsibility** | Portfolio/proof assembly |
| **Classification** | **FUTURE** |

---

## STAGE D — DEFINE SERVICE PROFILE

| | |
|---|---|
| **User goal** | Tell the system what I sell, to whom, where, and my minimum project value |
| **System responsibility** | Persist the definition; derive the rule inputs the Offer Engine needs |
| **AI responsibility** | None required for MVP (see OQ-4 on rule derivation) |
| **Human responsibility** | Provide the four user-authored inputs |
| **Inputs** | service, target customer, geography, minimum project value |
| **Outputs** | A persisted, user-owned Service Profile |
| **State transitions** | none → defined → (editable) |
| **Evidence requirements** | none |
| **Classification** | **MVP** |

---

## STAGE E — FIND / DISCOVER BUSINESSES

| | |
|---|---|
| **User goal** | Get candidate businesses matching my service definition |
| **System responsibility** | Execute discovery asynchronously via a provider abstraction |
| **AI responsibility** | None at this stage |
| **Human responsibility** | Start the search |
| **Inputs** | Frozen Search parameter snapshot |
| **Outputs** | Raw candidate businesses |
| **State transitions** | Search: PENDING → RUNNING |
| **Classification** | **MVP** |

---

## STAGE F — NORMALIZE

| | |
|---|---|
| **System responsibility** | Convert provider-shaped candidates into one internal representation |
| **Outputs** | Normalised Company records, including a deterministic `normalized_domain` |
| **Classification** | **MVP** |

---

## STAGE G — DEDUPLICATE

| | |
|---|---|
| **System responsibility** | Ensure one real business appears once within a Search |
| **Constraint** | `UNIQUE(search_id, company_id)` — see DEC-005 and correction PFR-11 |
| **Classification** | **MVP** |

---

## STAGE H — RESEARCH

| | |
|---|---|
| **User goal** | Understand each business without reading its website myself |
| **System responsibility** | Gather sources; produce structured, schema-valid output |
| **AI responsibility** | Produce observations with evidence; never assert without a source |
| **Human responsibility** | None during execution |
| **Inputs** | Company, source documents |
| **Outputs** | Research signals with classification, confidence, provenance |
| **State transitions** | Prospect: DISCOVERED → RESEARCHED |
| **Evidence requirements** | OBSERVED claims must quote verbatim from the cited source |
| **Classification** | **MVP** |

---

## STAGE I — EVIDENCE

| | |
|---|---|
| **System responsibility** | Persist classification, raw confidence, source, observed time |
| **Classification vocabulary** | `OBSERVED` · `INFERRED` · `UNKNOWN` |
| **Constraint** | UNKNOWN must survive persistence (PFR-05). Raw confidence must be stored unadjusted (PFR-04). |
| **Classification** | **MVP** |

---

## STAGE J — SIGNAL FRESHNESS

| | |
|---|---|
| **System responsibility** | Decay a signal's contribution with age; mark superseded signals |
| **Inputs** | `observed_at`, `superseded_at` |
| **Constraint** | Old evidence must never be presented as current |
| **Classification** | **MVP** |

---

## STAGE K — NEED DETECTION

| | |
|---|---|
| **User goal** | Know which businesses actually need what I sell |
| **System responsibility** | Decide whether evidence indicates a genuine need |
| **Constraint** | "This business exists and could theoretically buy" is not a need |
| **Classification** | **MVP** |

---

## STAGE L — OFFER RECOMMENDATION

| | |
|---|---|
| **System responsibility** | Map detected need to what the user sells; produce a rationale |
| **Constraint** | Must be able to return **NO SUITABLE OFFER** when evidence is insufficient |
| **Constraint** | The recommendation is distinct from the user's chosen service — not every prospect automatically receives it |
| **Classification** | **MVP** |

---

## STAGE M — OPPORTUNITY CREATION

| | |
|---|---|
| **System responsibility** | Persist prospect + detected need + recommended offer as a durable, reviewable record with a state |
| **Outputs** | Opportunity |
| **State transitions** | Opportunity: → NEW |
| **Classification** | **MVP** |

---

## STAGE N — SEVEN-FACTOR SCORING

| | |
|---|---|
| **System responsibility** | Score across seven weighted factors, applying inference discount and freshness |
| **Constraint** | Inference discounted exactly once (PFR-06) |
| **Constraint** | Each factor independently explainable |
| **Classification** | **MVP** |

---

## STAGE O — RANKING

| | |
|---|---|
| **System responsibility** | Order opportunities deterministically |
| **Constraint** | Identical inputs and scorer version ⇒ identical order |
| **Classification** | **MVP** |

---

## STAGE P — DISPLAY ~20 OPPORTUNITIES

| | |
|---|---|
| **User goal** | See a workable shortlist, not a database dump |
| **Constraint** | ~20 is a usability decision, not a technical limit |
| **Classification** | **MVP** |

---

## STAGE Q — USER REVIEW

| | |
|---|---|
| **User goal** | Understand why this business, and decide whether to act |
| **System responsibility** | Show business, evidence with classification, score breakdown, recommended offer, next action |
| **Classification** | **MVP** |

---

## STAGE R — FEEDBACK

| | |
|---|---|
| **User goal** | Tell the system this was useful or not, and why |
| **System responsibility** | Persist the verdict against the opportunity |
| **Constraint** | Unpersisted feedback is a UI gesture, not feedback |
| **Classification** | **MVP** |

---

## STAGE S — OPPORTUNITY STALENESS

| | |
|---|---|
| **System responsibility** | Represent an opportunity whose evidence has aged |
| **State vocabulary** | FRESH · STALE · SUPERSEDED (or approved equivalent) |
| **Constraint** | Stale opportunities are marked, never silently deleted |
| **Classification** | **MVP** |

---

## STAGE T — NEXT ACTION

| | |
|---|---|
| **System responsibility** | Answer "what should the user do next?" — review evidence, investigate, refresh stale research, consider the offer, prepare outreach, or hold |
| **Constraint** | Recommendation only. This is not autonomous outreach. |
| **Classification** | **MVP** |

---

## STAGE U — OUTREACH PREPARATION

| | |
|---|---|
| **System responsibility** | Draft a personalised message grounded in the evidence |
| **Human responsibility** | Approve before anything is sent |
| **Classification** | **FUTURE** — Phase 2 |

---

## STAGE V — HUMAN APPROVAL

```text
REMINDER → RECOMMENDATION → APPROVAL → EXECUTION
```

| | |
|---|---|
| **Constraint** | Human approval is required before any external commercial action |
| **Classification** | **FUTURE** — Phase 2. The domain logic exists; the enforcement gate does not (see Conflict C-5). |

---

## STAGE W — CONTACT / FOLLOW-UP / PROPOSE / CLOSE

| | |
|---|---|
| **Classification** | **FUTURE** — Phases 2–3 |
| **Constraint** | Autonomous email, Instagram, WhatsApp, follow-up, negotiation and closing remain deferred under `MVP_SCOPE_BOUNDARY.md` §6.2 |

---

## STAGE X — TRACK / EARN / LEARN

```text
CLIENT → PROJECT → REVENUE → OUTCOME → FEEDBACK → IMPROVEMENT
```

| | |
|---|---|
| **Classification** | **FUTURE** — Phase 3+ |
| **Note** | The current MVP does **not** complete this journey and must not be described as doing so |

---
---

# LAYER 3

# FUNCTIONAL REQUIREMENTS

Every requirement carries a status. A requirement appearing here is **not** an authorisation to
build it in the current release — `MVP_SCOPE_BOUNDARY.md` decides that.

---

## R-01 — USER IDENTITY

**Requirement.** The system must establish a server-derived user identity and use it as the basis
of all ownership.

- Canonical identifier is an opaque `users.id`, never an email address.
- Identity must never be supplied by the caller.
- Identity is distinct from entitlement and from payment (DEC-002).

**MVP:** Yes — minimum viable identity only.
**Status:** NOT IMPLEMENTED.
**Evidence:** No middleware, no session, no auth provider, no auth secret, no ownership predicate,
no authorization test exists. `apps/web/src/server/access.ts` returns a hardcoded anonymous
resolution and never reads the cookie.

---

## R-02 — AUTHENTICATION

**Requirement.** An authenticated request must carry a user identity that the server derived.

- `requireUser()` resolves the session cookie to a `userId` or rejects.
- A token whose `user_id IS NULL` **must be rejected** as a session (DEC-002, PFR-13).
- For MVP validation, users may be provisioned out of band. Self-service signup is FUTURE.

**MVP:** Yes.
**Status:** NOT IMPLEMENTED.
**Note:** The authentication *mechanism* (magic-link vs out-of-band provisioning) is an
implementation decision. This document does not invent an authentication provider. See OQ-2.

---

## R-03 — USER ONBOARDING

**Requirement.** A new user reaches a usable state — identity established, service profile defined.

**MVP:** Minimal only (provisioning + profile creation).
**Status:** NOT IMPLEMENTED.
**Future:** Guided onboarding, DISCOVER-stage assistance.

---

## R-04 — SERVICE PROFILE

**Requirement.** A user-owned record of what they sell.

**MVP user-authored fields (4):** service · target customer · geography · minimum project value.

**MVP system-derived rule fields (3):** signal triggers · keywords · offer rationale.
These are configuration, not user profile data — they are enum lists and templates that no user
should be asked to author. They are nonetheless **persisted**, so that a completed Search's
explanations remain true after the derivation logic changes.

**Deferred (FUTURE), no MVP consumer:** description · capabilities · positioning · deliverables ·
pricing.

**MVP:** Yes.
**Status:** NOT IMPLEMENTED.
**Resolves:** Conflict C-1 (PRD V2.0 §40 thirteen fields vs Scope Boundary §5.1 four fields).

---

## R-05 — SEARCH

**Requirement.** An asynchronous, owned, resumable unit of work.

- Statuses: `PENDING` · `RUNNING` · `COMPLETE` · `FAILED` · `CANCELLED`
- Must carry job state: attempts, last error, lease owner, lease expiry, idempotency key
- Must carry an **immutable snapshot** of the parameters used (DEC-007)
- Must retain `service_profile_id` for lineage

**MVP:** Yes.
**Status:** NOT IMPLEMENTED.

---

## R-06 — BUSINESS DISCOVERY

**Requirement.** Obtain candidate businesses from an external source behind a provider abstraction,
so the source can change without changing the engine.

**MVP:** Yes — one controlled provider.
**Status:** NOT IMPLEMENTED.

---

## R-07 — CANDIDATE NORMALIZATION

**Requirement.** Convert provider-shaped results into one internal representation. Provider quirks
stop here. A deterministic `normalized_domain` is computed and persisted.

**MVP:** Yes.
**Status:** NOT IMPLEMENTED.

---

## R-08 — DEDUPLICATION

**Requirement.** One real business appears once within a Search.

- Constraint is `UNIQUE(search_id, company_id)` — **not** `(user_id, company_id)` (DEC-005).
- A later Search may legitimately rediscover the same business with fresh research.

**MVP:** Yes.
**Status:** NOT IMPLEMENTED.

---

## R-09 — RESEARCH

**Requirement.** Produce structured, schema-valid research per prospect, with repair on validation
failure and bounded retries.

**MVP:** Yes.
**Status:** **IMPLEMENTED LOGIC** — not integrated, not persisted.
**Evidence:** `packages/core-research/` — 11 source files, tested in
`packages/core-research/src/research.test.ts`. `ResearchRepository` has **zero implementations**;
its target table does not exist.

---

## R-10 — EVIDENCE

**Requirement.** Every claim carries a classification, a raw confidence, provenance and an observed
time.

- Classification: `OBSERVED` · `INFERRED` · `UNKNOWN`
- OBSERVED claims must quote verbatim from the cited source document
- Multiple sources per claim must remain representable (PFR-07)
- UNKNOWN must survive persistence (PFR-05)
- Confidence is persisted **raw**, unadjusted (PFR-04)

**MVP:** Yes.
**Status:** **PARTIAL** — verification is implemented and strong; persistence is not.
**Evidence:** `packages/core-research/src/provenance.ts` enforces verbatim matching, is
case-sensitive, and rejects quotes below a minimum length. Seven bypass attempts were made during
the readiness audit and all were rejected. Six equivalent cases are covered in
`packages/core-research/src/research.test.ts`.

---

## R-11 — NEED DETECTION

**Requirement.** Decide whether evidence indicates a genuine need for the user's service.

**MVP:** Yes.
**Status:** **PARTIAL** — the mechanism exists inside the Offer Engine, but is driven by a
hardcoded default rule set rather than a user's Service Profile.

---

## R-12 — OFFER RECOMMENDATION

**Requirement.** Map detected need to the user's service, with a rationale, and return
**NO SUITABLE OFFER** when evidence is insufficient.

**MVP:** Yes.
**Status:** **PARTIAL**.
**Evidence:** `packages/core-acquisition/src/offer.ts` — `suggestOffers(signals, rules)` with
`DEFAULT_SERVICE_RULES` as the fallback. The `rules` parameter is the seam a Service Profile will
supply. The `ServiceRule` interface requires five fields, three of which the Scope Boundary's
original four-field profile could not provide — this is the verified dependency that R-04 resolves.

---

## R-13 — OPPORTUNITY CREATION

**Requirement.** Persist prospect + detected need + evidence linkage + recommended offer as a
durable record with a state.

- `service_offer` nullable — this is how NO SUITABLE OFFER is expressed
- No CRM relations (DEC-009 scope rule)

**MVP:** Yes.
**Status:** NOT IMPLEMENTED — nothing constructs an Opportunity from research.

---

## R-14 — SEVEN-FACTOR SCORING

**Requirement.** Score across seven weighted factors.

| Factor | Weight |
|---|---:|
| icpFit | 20 |
| visibleProblem | 20 |
| abilityToPay | 15 |
| urgency | 15 |
| serviceFit | 15 |
| evidenceQuality | 10 |
| contactability | 5 |

Weights sum to exactly 100, asserted by an existing test.

**MVP:** Yes.
**Status:** **IMPLEMENTED LOGIC** — not integrated.
**Evidence:** `packages/core-acquisition/src/prospectScore.ts`, tested in
`packages/core-acquisition/src/prospectScore.test.ts`.

---

## R-15 — RANKING

**Requirement.** Deterministic ordering. Identical evidence and scorer version ⇒ identical order.

**MVP:** Yes.
**Status:** **IMPLEMENTED LOGIC** — `rankProspects` exists; nothing calls it with real data.

---

## R-16 — CONFIDENCE

**Requirement.** Every observation carries a confidence, persisted raw. Score explanations must
show the confidence basis.

**MVP:** Yes.
**Status:** PARTIAL — computed, not persisted.

---

## R-17 — INFERENCE DISCOUNT

**Requirement.** An inferred factor contributes less than an observed one. The discount is applied
**exactly once**.

Canonical flow:

```text
Observation → classification → raw confidence → freshness
    → one inference discount → seven-factor scoring
```

**MVP:** Yes.
**Status:** **PARTIAL / AT RISK.**
**Evidence:** `INFERENCE_DISCOUNT = 0.5` in `prospectScore.ts` discounts by `basis`.
`effectiveConfidence()` in `core-research/src/persist.ts` **also** halves INFERRED confidence. If
both apply to the same value, inference is discounted twice. See PFR-06 and Conflict C-6.

---

## R-18 — SIGNAL FRESHNESS / DECAY

**Requirement.** A signal's contribution decays with age. Superseded signals stop counting.

**MVP:** Yes.
**Status:** **IMPLEMENTED LOGIC**.
**Evidence:** `packages/core-acquisition/src/scoring.ts` — `decayFactor`, `SIGNAL_FRESH_DAYS`,
`SIGNAL_MAX_AGE_DAYS`, `SOURCE_WEIGHT`.

---

## R-19 — OPPORTUNITY STALENESS

**Requirement.** Represent an opportunity whose evidence has aged. States: FRESH · STALE ·
SUPERSEDED, or approved equivalent. Stale opportunities are never silently deleted.

**MVP:** Yes.
**Status:** **IMPLEMENTED LOGIC** — `STALE_AFTER_DAYS` in
`packages/core-acquisition/src/nextAction.ts`.

---

## R-20 — NEXT ACTION ENGINE

**Requirement.** Recommend what the user should do next. Recommendation only; never autonomous
action.

**MVP:** Yes.
**Status:** **IMPLEMENTED LOGIC** — `nextActionFor`, `buildQueue`.

---

## R-21 — FEEDBACK

**Requirement.** Capture useful / not useful plus a reason, persisted against the opportunity.

**MVP:** Yes.
**Status:** NOT IMPLEMENTED.

---

## R-22 — OUTREACH PREPARATION

**Requirement.** Draft a personalised, evidence-grounded message. Verification for spam phrasing
and unsupported claims.

**MVP:** **No — FUTURE, Phase 2.**
**Status:** **IMPLEMENTED LOGIC, NOT INTEGRATED.**
**Evidence:** `packages/core-outreach/` — generation, verification, spam-phrase detection, all
tested in `packages/core-outreach/src/outreach.test.ts`. No runtime consumer exists other than
`core-acquisition/src/followUp.ts`.

> Existing implementation does **not** promote this into MVP.

---

## R-23 — HUMAN APPROVAL

**Requirement.** No external commercial action without a named human approver.

**MVP:** No — FUTURE.
**Status:** **PARTIAL** — application-level logic exists
(`packages/core-acquisition/src/audit.ts`, `assertHumanActor`); the database-level send gate is in a
quarantined migration and cannot apply. See Conflict C-5.

---

## R-24 — FOLLOW-UP ARCHITECTURE

**Requirement.** Spaced, business-day-aware follow-up with cancel-on-reply and a maximum count.

**MVP:** No — FUTURE, Phase 2.
**Status:** **IMPLEMENTED LOGIC, NOT INTEGRATED** —
`packages/core-acquisition/src/cadence.ts`, `followUp.ts`, tested in `followUp.test.ts`.

---

## R-25 — PROPOSAL ARCHITECTURE

**Requirement.** Versioned proposals with authoritative pricing and auditability.

**MVP:** No — FUTURE, Phase 3.
**Status:** **IMPLEMENTED LOGIC, NOT INTEGRATED** — `packages/core-proposal/`, tested in
`packages/core-proposal/src/proposal.test.ts`. **Zero runtime consumers** anywhere in the
repository.

---

## R-26 — PRICING ARCHITECTURE

**Requirement.** One authoritative pricing concept per release.

- **MVP:** `minProjectValuePaise` is the only economic threshold.
- `typicalValuePaise` is **not** a persisted MVP concept (PFR-01).
- `estimatedValuePaise` is **not** an MVP Opportunity field (PFR-02).
- **FUTURE** may distinguish minimum acceptable value, recommended price, package price, proposal
  price and negotiated price — but only when a product requirement explicitly introduces them.

**MVP:** Minimal.
**Status:** NOT IMPLEMENTED.

---

## R-27 — TRACKING

**Requirement.** Record what happened: opportunities created, reviewed, actioned.

**MVP:** Basic outcome tracking only, per Scope Boundary §5.5.
**Status:** **PARTIAL** — `packages/core-acquisition/src/metrics.ts` computes funnel summaries and
angle performance from inputs nothing supplies.

---

## R-28 — IMPROVEMENT LOOP

**Requirement.** Outcome feeds back into better discovery and scoring.

**MVP:** No — FUTURE.
**Status:** NOT IMPLEMENTED. The `feedback` model is shaped so this becomes additive rather than a
redesign.

---

## R-29 — AI COST / METERING

**Requirement.** AI execution cost must eventually be measurable per run and per user.

- **MVP:** minimum instrumentation to understand execution cost.
- **FUTURE:** usage metering, quotas, usage-based pricing, optimisation, subscription billing.

**Status:** NOT IMPLEMENTED. The Anthropic adapter sets `max_tokens` and never reads the response's
`usage` block; no cost record exists anywhere.

---

## R-30 — SUBSCRIPTION / USAGE

**Requirement.** Recurring commercial model.

**MVP:** **No — FUTURE.** Explicitly excluded by `MVP_SCOPE_BOUNDARY.md` §6.5.
**Status:** NOT IMPLEMENTED.

---

## R-31 — SAFETY CONTROLS

| Control | MVP | Status |
|---|---|---|
| Reply stop | Future | IMPLEMENTED LOGIC (`shouldCancelOnReply`) |
| Unsubscribe stop | Future | PARTIAL — `unsubscribed` is a hard stop in the scorer; nothing sets it |
| Paused stop | Future | IMPLEMENTED LOGIC (`pause`, `resume`, `RESUMABLE_STAGES`) |
| Outreach verification | Future | IMPLEMENTED LOGIC (`core-outreach/verify.ts`) |
| Human approval | Future | PARTIAL — see R-23 |

> None of these is currently operational. Deferred safety functionality must not be described as
> active.

---

## R-32 — ANALYTICS

**Requirement.** TRACK (what happened) and IMPROVE (what it taught us).

**MVP:** TRACK only, minimally.
**FUTURE:** cohort analytics, attribution, predictive conversion, revenue optimisation — excluded by
Scope Boundary §6.7.
**Status:** PARTIAL.

---

## R-33 — USER ISOLATION

**Requirement.** No user may read another user's data by any path.

- Every owned model filters on `user_id`
- Child entities inherit ownership through their authoritative parent (DEC-008)
- No caller-supplied `userId` is authoritative anywhere

**MVP:** Yes — an exit criterion.
**Status:** NOT IMPLEMENTED. No ownership predicate exists anywhere in the repository today, and
no authorization test exists.

---

## R-34 — WORKER EXECUTION

**Requirement.** Long-running work executes outside the HTTP request, with lease-based claiming,
fencing, bounded retries and graceful shutdown.

**MVP:** Yes.
**Status:** **PARTIAL.**
**Evidence:** The Meta-events worker implements claiming with `FOR UPDATE SKIP LOCKED`, leases,
fencing, full-jitter retry, dead-lettering and ambiguous-send recording — verified against real
PostgreSQL in `tests/integration/meta-event-worker.concurrency.test.ts` and
`tests/integration/meta-event-ambiguous-send.integration.test.ts`. **No poll loop invokes any of
it**; `apps/worker/src/index.ts` throws on boot.

---
---

# LAYER 4

# ARCHITECTURE & IMPLEMENTATION TRUTH

---

# Implementation Truth & Architecture Decisions

This section separates five categories that are routinely conflated. An item in one category does
not migrate to another without an explicit decision.

---

## VERIFIED FACT

Established directly from repository, database or test evidence during the V2.0 → V2.1
investigations.

| # | Fact |
|---|---|
| F-01 | `packages/db/prisma/schema.prisma` generated the current Prisma client — proven by model count and by the `linux-musl` engines only that schema declares via `binaryTargets`. |
| F-02 | The root `schema.prisma` conflicts with the live database on three columns: it omits `Order.idempotencyKey`, declares `Order.customerName` required where the database has it nullable, and omits `WebhookEvent.payloadRedactedAt`. |
| F-03 | Prisma resolves its schema by working directory. Both schemas validate independently. `./migrations/` does not exist, so a root-CWD `migrate dev` would create a second migration history. |
| F-04 | Nine migrations are applied (`0001`–`0004`, `0007`–`0011`), none rolled back. Gaps at `0005`/`0006` are permanent. |
| F-05 | `0005` and `0006` are quarantined; they `ALTER` `acq_*` tables that no migration creates. |
| F-06 | No `acq_*` table exists in the live database. It holds eleven tables, none of which is an identity table. |
| F-07 | No middleware, auth provider, session library, auth secret, ownership predicate or authorization test exists. |
| F-08 | `apps/web/src/server/access.ts` — `currentAccess()` returns a hardcoded constant and never reads the cookie. `readAccessToken()` has zero callers. The access cookie is never set anywhere. |
| F-09 | `evaluateAccessToken` consults only the token row and returns an identity without reading entitlements. `resolveAccess` returns `granted: true` with an empty `purchased` array. |
| F-10 | `entitlements.order_id` is `TEXT NOT NULL` with a foreign key to `orders`. |
| F-11 | `access_tokens` is keyed on `customer_email` and has no `user_id`. |
| F-12 | `ServiceRule` requires `service`, `triggers`, `keywords`, `typicalValuePaise`, `rationale`. |
| F-13 | `toResearchRows()` filters out UNKNOWN observations, folds classification into confidence via `effectiveConfidence()`, and retains only the first of up to five evidence sources. |
| F-14 | `effectiveConfidence()` halves INFERRED confidence; `INFERENCE_DISCOUNT = 0.5` in the scorer also halves by basis. |
| F-15 | `ProspectScore` returns `score`, `band`, `factors[]`, `reasons[]`, `observedShare`, `cap?`. Seven factors; weights sum to 100, asserted by a test. |
| F-16 | Prisma is used at three call sites; raw `pg` at fifteen. No package imports Prisma-generated types. No test imports `PrismaClient`. |
| F-17 | Integration tests build their schema by executing migration SQL read from disk — the **migration chain is the test contract**, not the Prisma schema. |
| F-18 | No integration suite imports `core-acquisition`, `core-research`, `core-outreach` or `core-proposal`. |
| F-19 | `core-proposal` has zero runtime consumers. `core-outreach` has one (`core-acquisition/src/followUp.ts`). |
| F-20 | `apps/worker/src/index.ts` throws `'apps/worker: poll loop not implemented (Phase 2)'`. |
| F-21 | Every `@acos/*` package sets `"main": "src/index.ts"`, so a compiled worker requiring one fails with `SyntaxError: Unexpected token 'export'`. |
| F-22 | No email transport exists anywhere in the repository. |
| F-23 | `apps/web/app/page.tsx` and `apps/web/app/(dashboard)/page.tsx` both resolve to `/`; `next build` fails at prerender. |

---

## ARCHITECTURE DECISION

Chosen designs derived from the facts above. Recorded in full in the Decision Register.

---

## PRODUCT REQUIREMENT

What the system must do — Layer 3. A requirement's existence is not a claim of implementation.

---

## FUTURE

Intentionally deferred. Listed in the Roadmap and in `MVP_SCOPE_BOUNDARY.md` §6.

---

## OPEN QUESTION

Not yet decided. Listed in the Open Questions section. **An open question must not be converted
into an implementation requirement by assumption.**

---

# DATABASE AUTHORITY

**`packages/db/prisma/schema.prisma` is the authoritative Prisma schema.**

Supported by three independent lines of evidence:

1. **It generated the client.** The generated client contains exactly its six models and carries
   the `linux-musl` query engines that only this schema declares (F-01).
2. **It matches the live database.** On all three disputed columns; the root schema does not (F-02).
3. **It owns the applied migration history.** Nine migrations resolve to its directory; the root
   schema has no migrations directory at all (F-03, F-04).

The root-level `schema.prisma` **must not be treated as an independent migration authority.** It is
not a competing candidate: it contradicts the database on shared models, represents no coherent
point in the migration history (post-`0006` for one enum, pre-`0005` for outreach columns), omits
four models the MVP requires, and includes six the Scope Boundary defers.

> This document does not modify or delete any schema. Removal is an implementation action, sequenced
> in the Decision Register under DEC-001.

---

# MIGRATION POLICY

| Rule | Reason |
|---|---|
| Applied history reaches **0011** | Verified against `_prisma_migrations` (F-04) |
| New MVP migration must be **0012 or later** | A migration sorting before nine applied ones would apply out of order; Prisma records names, not positions |
| **0005 / 0006 gaps must not be backfilled** | Those names are permanently absent from every database that ran the chain |
| **No renumbering** of historical migrations | Applied rows reference them by name |
| MVP migration must be **additive** | New tables plus one nullable column; no `ALTER` of an existing column, no `DROP`, no data transformation |
| **No deferred CRM structures** | Client, Conversation, Activity, OutreachMessage, FollowUp, Proposal — as tables *or* relations |

> This is a release constraint recorded for implementation planning. It is not permission to create
> or modify migrations during this documentation task.

---

# IDENTITY ≠ ENTITLEMENT ≠ PAYMENT

```text
IDENTITY      "Who is this user?"          users · access_tokens.user_id
ENTITLEMENT   "What access do they have?"  entitlements
PAYMENT       "What transaction paid?"     orders → payments
```

**Payment status must not be the fundamental application identity.**

This separation is not merely preferred — it is **forced by the existing schema**. `entitlements.order_id`
is `NOT NULL` with a foreign key to `orders` (F-10), so there is no way to express "this user may use
Client Finder" in that table without fabricating an order or weakening a payment invariant.

It is also **already the code's structure**: `evaluateAccessToken` returns an identity without
reading entitlements, and `resolveAccess` grants identity with an empty purchase list (F-09).

---

# AUTHENTICATION — VERIFIED CURRENT STATE

> **Authentication is NOT IMPLEMENTED.**

`currentAccess()` must not be described as functional authentication. It returns a hardcoded
anonymous result and never reads the cookie (F-08). This is the safe failure direction, and it means
the access-control path has never executed.

The MVP architecture requires:

- Server-derived user identity
- An authenticated request context
- **No caller-supplied authoritative `userId`** anywhere
- Ownership enforcement in every repository method
- User isolation proven by test
- Worker ownership inherited from persisted records, never from a job payload

**This document does not invent an authentication provider.** Magic-link and email-based
authentication remain an implementation decision (OQ-2), constrained by the verified absence of any
email transport (F-22).

---

# ACCESS TOKEN RULE

The existing access-token system is an **entitlement-oriented primitive**, not an identity system.

```text
access_tokens.user_id IS NULL      →  entitlement credential (legacy, unchanged behaviour)
access_tokens.user_id IS NOT NULL  →  authenticated Client Finder session
```

> **`requireUser()` must reject tokens where `user_id IS NULL`.**

Without that check, an entitlement token emailed to a customer would authenticate as a Client Finder
session and the separation above would collapse at the first route.

Legacy rows are unaffected: `resolveAccess()` never consults `user_id`, so a NULL is invisible to it.
No backfill — existing tokens have no user, and inventing one would fabricate identity.

---

# USER / TENANCY MODEL

```text
User
 ↓
ServiceProfile
 ↓
Search
 ↓
Prospect  ──  Company
 ↓
ResearchSignal
 ↓
Opportunity
 ↓
OpportunityScore
 ↓
Feedback
```

Ownership is enforced **server-side**, on every read and every write.

**Organisation, team, workspace and enterprise tenancy are NOT introduced.** PRD V2.0 §39 places
workspace/tenant and subscription ownership behind production SaaS usage; nothing in the current
release requires them.

---

# OWNERSHIP INHERITANCE

Two models deliberately carry **no** `user_id`:

| Model | Ownership via | Reason |
|---|---|---|
| `research_signals` | `prospect_id` → `prospects.user_id` | A denormalised owner is a second source of truth that can disagree with the first |
| `opportunity_scores` | `opportunity_id` → `opportunities.user_id` | Same |

Repository reads for these join to the owning parent and filter there. Denormalisation should be
introduced only if a measured query plan demands it, and then with a constraint keeping the two in
step.

---

# EVIDENCE MODEL

Evidence is a **first-class product concept**, not a logging detail.

Persisted per signal:

| Field | Purpose |
|---|---|
| `classification` | `OBSERVED` · `INFERRED` · `UNKNOWN` — must survive persistence |
| `confidence` | **Raw**, unadjusted |
| `source_url` | Provenance |
| `source_quote` | The verbatim span provenance verification already checks |
| `observed_at` | Freshness input |
| `superseded_at` | Supersession; never a delete |
| `kind` | Source kind, feeding source weighting |

**UNKNOWN must survive.** UNKNOWN means *available evidence was insufficient to establish the
condition*. It may contribute zero to scoring, but it must remain representable and auditable so the
UI can say "we could not establish ability to pay" rather than silently omitting a factor.

**Multiple sources must remain representable.** Reducing an observation to its first source
(F-13) would defeat evidence inspection, attribution, explanation and re-research.

---

# INFERENCE DISCOUNT — CANONICAL FLOW

```text
Observation
    ↓ classification          (OBSERVED | INFERRED | UNKNOWN)
    ↓ raw confidence          (persisted unadjusted)
    ↓ freshness / decay
    ↓ ONE inference discount  (applied at scoring time, by basis)
    ↓ seven-factor scoring
```

Confidence must **not** be pre-discounted during research persistence and then discounted again
during scoring. See F-14 and Conflict C-6.

---

# SEARCH REPRODUCIBILITY

A Search must preserve the inputs used when it was created:

- service · target customer · geography · minimum project value
- the rule/configuration fields in effect at creation
- `service_profile_id` retained for lineage

**A later ServiceProfile change must not rewrite the meaning of a completed Search.** Without the
snapshot, editing a profile retroactively changes what a past search searched for, and every stored
rationale becomes a description of criteria that were never used.

---

# COMPANY / PROSPECT

**Company remains user-owned for MVP.**

The reason is not simplicity. The MVP is itself **validating discovery and deduplication** — whether
a domain is a reliable identity key is one of the things the experiment answers. Committing to a
global identity namespace before that answer exists bakes in a guess, and a wrong dedup rule in a
shared namespace corrupts every user's data at once rather than one user's.

A deterministic `normalized_domain` is persisted to support future evolution toward global company
identity. Global company sharing is **not** implemented in MVP.

**Deduplication constraint:** `UNIQUE(search_id, company_id)`, not `(user_id, company_id)` — a user
searching again months later should see the same business re-surfaced with fresh research.

---

# OPPORTUNITY

Opportunity is the bridge between research and acquisition. Within MVP scope it supports:

prospect · detected need · supporting evidence (by reference) · recommended offer · confidence ·
inference basis · freshness · staleness · score · ranking · next action · state · feedback.

**It must not import CRM functionality.** No messages, follow-ups, conversations, proposals,
activities or client relation — as columns, foreign keys *or* relations. The reusable shape in the
root schema declares all six; carrying it over wholesale would pull the deferred CRM surface in
through the back door.

> **A relation is a scope decision.**

---

# CANONICAL OPPORTUNITY STATE MACHINE

```text
NEW → RESEARCHED → CONTACTED → REPLIED → QUALIFIED → PROPOSAL_SENT → WON
                                                                   → LOST
  (any active stage) → PAUSED → (resume to prior stage)
```

Every transition must be explicit, deterministic, explainable and validated. UI state labels must
never become the sole source of truth.

**Conflict noted, not silently resolved:** the repository's `stages.ts` implements this nine-value
machine. Quarantined migration `0006` migrates *from* a different set containing `SOURCED`,
`PERSONALIZED`, `FOLLOWING_UP` and `PROPOSED`. Those four values exist in no current schema. See
Conflict C-7.

Stages beyond `RESEARCHED` are reachable only in Phase 2+; the MVP exercises `NEW` and
`RESEARCHED`.

---

# SEVEN-FACTOR SCORING — AUTHORITATIVE MODEL

The repository's seven-factor model is authoritative. **No replacement scoring framework is
introduced.**

Opportunity scoring **reuses the existing `ProspectScore` shape** rather than creating a competing
model. Persisted per scoring run:

`total` · `band` · `factors[]` (factor, weight, raw, points, basis, reason) · `reasons[]` ·
`observedShare` · `cap?` · `scorerVersion` · `scoredAt`

`scorerVersion` is what allows a ranking to be reproduced after weights change.

---

# WORKER OWNERSHIP

```text
HTTP    requireUser() → userId          (server-derived)
        INSERT searches (user_id, parameters snapshot, status='PENDING')

WORKER  claim a row: FOR UPDATE SKIP LOCKED
        userId := row.user_id           (read from persisted state)
        every write carries that user_id
        settle: fenced on lease_owner
```

**The worker must never trust a `userId` supplied by a job payload.** It is handed nothing; it
claims a row and reads ownership out of it. Because that row could only have been written by a
request that passed `requireUser()`, ownership is transitively bound to a real session without the
worker knowing sessions exist.

This is the pattern the Meta-events worker already uses and is the only worker component verified
against real PostgreSQL.

---
---

# REPOSITORY STATUS TABLE

Status vocabulary is used strictly. `—` means the gate is not reached, not that it failed.

| Capability | Product Requirement | MVP Scope | Repository Status | Integration Status | Test Status | Production Status | Source |
|---|---|---|---|---|---|---|---|
| User identity | R-01 | MVP | NOT IMPLEMENTED | — | — | — | — |
| Authentication | R-02 | MVP | NOT IMPLEMENTED | — | — | — | `apps/web/src/server/access.ts` |
| Service Profile | R-04 | MVP | NOT IMPLEMENTED | — | — | — | — |
| Search | R-05 | MVP | NOT IMPLEMENTED | — | — | — | — |
| Business discovery | R-06 | MVP | NOT IMPLEMENTED | — | — | — | — |
| Normalization | R-07 | MVP | NOT IMPLEMENTED | — | — | — | — |
| Deduplication | R-08 | MVP | NOT IMPLEMENTED | — | — | — | — |
| Research | R-09 | MVP | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-research/` |
| Evidence / provenance | R-10 | MVP | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-research/src/provenance.ts` |
| Need detection | R-11 | MVP | PARTIAL | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/offer.ts` |
| Offer recommendation | R-12 | MVP | PARTIAL | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/offer.ts` |
| Opportunity creation | R-13 | MVP | NOT IMPLEMENTED | — | — | — | — |
| Seven-factor scoring | R-14 | MVP | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/prospectScore.ts` |
| Ranking | R-15 | MVP | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/prospectScore.ts` |
| Inference discount | R-17 | MVP | PARTIAL | NOT INTEGRATED | TESTED (unit) | — | `prospectScore.ts` + `core-research/src/persist.ts` |
| Signal freshness | R-18 | MVP | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/scoring.ts` |
| Opportunity staleness | R-19 | MVP | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/nextAction.ts` |
| Next action | R-20 | MVP | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/nextAction.ts` |
| Feedback | R-21 | MVP | NOT IMPLEMENTED | — | — | — | — |
| User isolation | R-33 | MVP | NOT IMPLEMENTED | — | NO VERIFIED TEST | — | — |
| Worker execution | R-34 | MVP | PARTIAL | NOT INTEGRATED | TESTED (integration) | — | `apps/worker/src/metaEvents/` |
| Outreach generation | R-22 | FUTURE | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-outreach/` |
| Human approval | R-23 | FUTURE | PARTIAL | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/audit.ts` |
| Follow-up | R-24 | FUTURE | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-acquisition/src/cadence.ts` |
| Proposals | R-25 | FUTURE | IMPLEMENTED LOGIC | NOT INTEGRATED | TESTED (unit) | — | `packages/core-proposal/` |
| AI cost metering | R-29 | MVP (minimal) | NOT IMPLEMENTED | — | — | — | — |
| Subscriptions | R-30 | FUTURE | NOT IMPLEMENTED | — | — | — | — |
| Payments / orders | — | Out of MVP | IMPLEMENTED LOGIC | INTEGRATED | TESTED (integration) | NOT PRODUCTION READY | `packages/core-payments/` |
| Entitlements | — | Out of MVP | IMPLEMENTED LOGIC | PARTIAL | TESTED (integration) | NOT PRODUCTION READY | `packages/core-entitlements/` |

> **No capability in this table is marked PRODUCTION READY.** Production readiness requires
> operational, security and reliability verification that has not been performed.

---

# REQUIREMENT-TO-REPOSITORY TRACEABILITY

Rules applied: no fabricated paths, no fabricated tests, no claimed coverage without evidence.
`NO VERIFIED TEST` means no test was found. `REQUIRES VERIFICATION` means the evidence was
ambiguous.

| Req ID | Requirement | MVP/Future | Architecture Component | Repository Path | Database Model | Test | Acceptance Criterion | Status |
|---|---|---|---|---|---|---|---|---|
| R-01 | User identity | MVP | Identity | — | `users` (proposed) | NO VERIFIED TEST | AC-01 | NOT IMPLEMENTED |
| R-02 | Authentication | MVP | Session | — | `access_tokens.user_id` (proposed) | NO VERIFIED TEST | AC-02 | NOT IMPLEMENTED |
| R-04 | Service Profile | MVP | Profile | — | `service_profiles` (proposed) | NO VERIFIED TEST | AC-04 | NOT IMPLEMENTED |
| R-05 | Search | MVP | Job | — | `searches` (proposed) | NO VERIFIED TEST | AC-05, AC-06 | NOT IMPLEMENTED |
| R-06 | Discovery | MVP | Provider | — | `companies` (proposed) | NO VERIFIED TEST | AC-07 | NOT IMPLEMENTED |
| R-07 | Normalization | MVP | Provider | — | `companies` (proposed) | NO VERIFIED TEST | AC-08 | NOT IMPLEMENTED |
| R-08 | Deduplication | MVP | Provider | — | `prospects` (proposed) | NO VERIFIED TEST | AC-09 | NOT IMPLEMENTED |
| R-09 | Research | MVP | AI engine | `packages/core-research/src/researcher.ts` | `research_signals` (proposed) | `packages/core-research/src/research.test.ts` | AC-10 | IMPLEMENTED LOGIC |
| R-10 | Evidence / provenance | MVP | AI engine | `packages/core-research/src/provenance.ts` | `research_signals` (proposed) | `packages/core-research/src/research.test.ts` | AC-11, AC-12 | IMPLEMENTED LOGIC |
| R-11 | Need detection | MVP | Offer engine | `packages/core-acquisition/src/offer.ts` | — | `packages/core-acquisition/src/engine.test.ts` | AC-13 | PARTIAL |
| R-12 | Offer recommendation | MVP | Offer engine | `packages/core-acquisition/src/offer.ts` | `opportunities` (proposed) | `packages/core-acquisition/src/engine.test.ts` | AC-14 | PARTIAL |
| R-13 | Opportunity creation | MVP | Domain | — | `opportunities` (proposed) | NO VERIFIED TEST | AC-15 | NOT IMPLEMENTED |
| R-14 | Seven-factor scoring | MVP | Scorer | `packages/core-acquisition/src/prospectScore.ts` | `opportunity_scores` (proposed) | `packages/core-acquisition/src/prospectScore.test.ts` | AC-16 | IMPLEMENTED LOGIC |
| R-15 | Ranking | MVP | Scorer | `packages/core-acquisition/src/prospectScore.ts` | — | `packages/core-acquisition/src/prospectScore.test.ts` | AC-17 | IMPLEMENTED LOGIC |
| R-17 | Inference discount | MVP | Scorer | `packages/core-acquisition/src/prospectScore.ts` | `research_signals` (proposed) | `packages/core-acquisition/src/prospectScore.test.ts` | AC-18 | PARTIAL — see C-6 |
| R-18 | Signal freshness | MVP | Scorer | `packages/core-acquisition/src/scoring.ts` | `research_signals` (proposed) | `packages/core-acquisition/src/engine.test.ts` | AC-19 | IMPLEMENTED LOGIC |
| R-19 | Staleness | MVP | Domain | `packages/core-acquisition/src/nextAction.ts` | `opportunities` (proposed) | `packages/core-acquisition/src/engine.test.ts` | AC-20 | IMPLEMENTED LOGIC |
| R-20 | Next action | MVP | Domain | `packages/core-acquisition/src/nextAction.ts` | `opportunities` (proposed) | `packages/core-acquisition/src/engine.test.ts` | AC-21 | IMPLEMENTED LOGIC |
| R-21 | Feedback | MVP | Domain | — | `feedback` (proposed) | NO VERIFIED TEST | AC-22 | NOT IMPLEMENTED |
| R-33 | User isolation | MVP | Security | — | all MVP models | NO VERIFIED TEST | AC-03 | NOT IMPLEMENTED |
| R-34 | Worker execution | MVP | Worker | `apps/worker/src/metaEvents/worker.ts` | `searches` (proposed) | `tests/integration/meta-event-worker.concurrency.test.ts` | AC-23 | PARTIAL |
| R-22 | Outreach generation | FUTURE | Outreach | `packages/core-outreach/src/generator.ts` | — | `packages/core-outreach/src/outreach.test.ts` | — | IMPLEMENTED LOGIC |
| R-23 | Human approval | FUTURE | Safety | `packages/core-acquisition/src/audit.ts` | — | `packages/core-acquisition/src/engine.test.ts` | — | PARTIAL |
| R-24 | Follow-up | FUTURE | Outreach | `packages/core-acquisition/src/cadence.ts` | — | `packages/core-acquisition/src/followUp.test.ts` | — | IMPLEMENTED LOGIC |
| R-25 | Proposals | FUTURE | Proposal | `packages/core-proposal/src/generator.ts` | — | `packages/core-proposal/src/proposal.test.ts` | — | IMPLEMENTED LOGIC |
| R-29 | AI cost metering | MVP (min) | Observability | — | — | NO VERIFIED TEST | AC-24 | NOT IMPLEMENTED |
| R-30 | Subscriptions | FUTURE | Commerce | — | — | NO VERIFIED TEST | — | NOT IMPLEMENTED |

---

# ARCHITECTURE & PRODUCT DECISION REGISTER

---

## DEC-001 — Authoritative Prisma schema

| | |
|---|---|
| **Decision** | `packages/db/prisma/schema.prisma` is the single authoritative Prisma schema. The root `schema.prisma` must not become a second migration authority. |
| **Status** | DECIDED |
| **Evidence** | F-01, F-02, F-03, F-04 |
| **Impact** | All MVP models are added to the authoritative schema. The root schema is removed, and the schema path is pinned so resolution cannot drift by working directory. |
| **Scope implication** | None — this is a correction, not an expansion. Removing the root schema also removes an unreviewed CRM data model from reach. |
| **Version** | V2.1 |

---

## DEC-002 — Identity ≠ entitlement ≠ payment

| | |
|---|---|
| **Decision** | Identity, product entitlement and payment are three separate concepts with three separate mechanisms. Payment status is never the application identity. |
| **Status** | DECIDED |
| **Evidence** | F-09 (already the code's structure), F-10 (schema forces it) |
| **Impact** | `users` + `access_tokens.user_id` for identity; `entitlements` unchanged for product access; `orders`/`payments` unchanged. Client Finder feature access is a separate concept from either. |
| **Scope implication** | No subscription or billing infrastructure enters MVP. |
| **Version** | V2.1 |

---

## DEC-003 — Server-bound user identity

| | |
|---|---|
| **Decision** | `userId` is always server-derived from an authenticated session. No route, service or repository accepts a caller-supplied authoritative `userId`. |
| **Status** | DECIDED |
| **Evidence** | F-07, F-08 — no existing pattern; the MVP establishes the first one |
| **Impact** | `requireUser()` per route; `userId` as first positional argument through services and repositories; `requireUser()` rejects tokens with `user_id IS NULL`. |
| **Scope implication** | Minimal authentication only — no OAuth, MFA, roles or workspaces. |
| **Version** | V2.1 |

---

## DEC-004 — MVP ServiceProfile minimum

| | |
|---|---|
| **Decision** | Seven fields: four user-authored (service, target customer, geography, minimum project value) plus three system-derived rule fields (triggers, keywords, rationale). The remaining PRD V2.0 §40 fields are deferred. |
| **Status** | DECIDED |
| **Evidence** | F-12 — `ServiceRule` requires five fields; the Scope Boundary's four cannot drive the Offer Engine |
| **Impact** | Resolves Conflict C-1. Admitted under the Scope Boundary's own verified-dependency exception, not by following the PRD. |
| **Scope implication** | Three fields added beyond §5.1; five PRD fields explicitly deferred. Net effect is scope *reduction* against V2.0. |
| **Version** | V2.1 |

---

## DEC-005 — User-owned Company for MVP

| | |
|---|---|
| **Decision** | Company is user-owned. A deterministic `normalized_domain` is persisted to preserve a future path to global company identity. Deduplication is `UNIQUE(search_id, company_id)`. |
| **Status** | DECIDED |
| **Evidence** | The MVP is validating deduplication itself; a global identity key cannot be committed to before that validation |
| **Impact** | Strict isolation; simple erasure; per-user dedup. Research may be repeated across users — an accepted cost at MVP scale. |
| **Scope implication** | Global company sharing is FUTURE. |
| **Version** | V2.1 |

---

## DEC-006 — Migration begins at 0012+

| | |
|---|---|
| **Decision** | The MVP migration is numbered 0012 or higher, is additive only, does not backfill the 0005/0006 gap, and does not renumber history. |
| **Status** | DECIDED |
| **Evidence** | F-04, F-05 |
| **Impact** | One additive migration creating the MVP tables plus one nullable column on `access_tokens`. |
| **Scope implication** | No CRM tables or relations. |
| **Version** | V2.1 |

---

## DEC-007 — Search input snapshot

| | |
|---|---|
| **Decision** | A Search freezes the parameters used at creation. `service_profile_id` is retained for lineage. |
| **Status** | DECIDED |
| **Evidence** | Required by the reproducibility requirement; a live read would let a profile edit rewrite a completed search's meaning |
| **Impact** | Historical reproducibility; stored rationales remain true. |
| **Scope implication** | None. |
| **Version** | V2.1 |

---

## DEC-008 — User isolation and ownership inheritance

| | |
|---|---|
| **Decision** | Every top-level MVP model carries `user_id`. `research_signals` and `opportunity_scores` inherit ownership through their authoritative parent rather than duplicating it. |
| **Status** | DECIDED |
| **Evidence** | A denormalised owner is a second source of truth that can disagree with the first |
| **Impact** | Repository reads for child models join to the owning parent. Cross-user tests required per owned model. |
| **Scope implication** | None. |
| **Version** | V2.1 |

---

## DEC-009 — Implemented ≠ integrated ≠ tested ≠ production-ready

| | |
|---|---|
| **Decision** | These four readiness gates are tracked separately for every capability and never collapsed. Existing repository code does not enter MVP scope by virtue of existing. |
| **Status** | DECIDED |
| **Evidence** | F-18, F-19, F-20 — substantial domain logic exists with zero integration and zero integration tests |
| **Impact** | The Repository Status Table and Traceability Matrix carry all four gates. No capability is currently PRODUCTION READY. |
| **Scope implication** | This is the rule that keeps outreach, proposals and follow-up out of the MVP despite being written and tested. |
| **Version** | V2.1 |

---

# POST-FOUNDATION REVIEW CORRECTIONS

These record **design corrections** discovered by inspecting consuming code. They resolve
ambiguity; they **do not independently expand MVP scope**.

| # | Correction | Rationale |
|---|---|---|
| PFR-01 | `typicalValuePaise` is adapter-only, not a persisted MVP pricing concept | It exists only to populate an offer value that the MVP never displays. The adapter may derive it from `minProjectValuePaise` for interface compatibility. |
| PFR-02 | `estimatedValuePaise` is excluded from MVP Opportunity | Estimated value is not in Scope Boundary §5.4. Avoids a second economic concept. |
| PFR-03 | Evidence classification must survive persistence | `toResearchRows()` folds OBSERVED/INFERRED into a confidence number (F-13), making the classification undisplayable. |
| PFR-04 | Raw confidence must be persisted | A stored value must mean what the source asserted, not "the value after a halving someone has to remember". |
| PFR-05 | UNKNOWN evidence must survive persistence | `toResearchRows()` discards UNKNOWN rows (F-13), so the system cannot express insufficient evidence. |
| PFR-06 | The inference discount is applied exactly once | `effectiveConfidence()` and `INFERENCE_DISCOUNT` can both halve the same value (F-14). |
| PFR-07 | Multiple evidence sources must remain representable | Only the first of up to five sources is retained today (F-13). |
| PFR-08 | Search inputs are snapshotted | See DEC-007. |
| PFR-09 | Company remains user-owned for MVP | See DEC-005. |
| PFR-10 | `normalized_domain` is persisted to support future global identity | A future merge needs a deterministic join key computed identically for every row. |
| PFR-11 | Deduplication is `(search_id, company_id)` | A later Search should legitimately rediscover a business with fresh research. |
| PFR-12 | Child entities should not duplicate user ownership | See DEC-008. |
| PFR-13 | `requireUser()` must reject tokens without `user_id` | Otherwise an entitlement token authenticates as a Client Finder session. |
| PFR-14 | Opportunity scoring reuses `ProspectScore` | No competing scoring model is introduced (F-15). |
| PFR-15 | Session TTL remains an unresolved design question | `ACCESS_TOKEN_TTL_MS` is 30 days, chosen for a purchased-product credential. See OQ-1. |

> **Implementation note carried forward:** `toResearchRows()` as written cannot populate the
> evidence model these corrections require. The adapter must map observations directly, or that
> function must be extended. This is implementation work, not a schema change — but it must not be
> discovered mid-build.

---

# CONFLICT REGISTER

Unresolved conflicts are recorded, not hidden.

---

### C-1 — ServiceProfile field count

| | |
|---|---|
| **Conflict** | PRD V2.0 §40 specifies 13 fields; `MVP_SCOPE_BOUNDARY.md` §5.1 requires 4 |
| **Verified facts** | F-12 — `ServiceRule` requires 5 fields; 3 are absent from both lists as user inputs |
| **Impact** | The four-field profile cannot drive the Offer Engine; every user would receive identical offer suggestions |
| **Decision** | Seven fields (DEC-004): 4 user-authored + 3 system-derived. Five PRD fields deferred. |
| **Status** | **RESOLVED** in V2.1 |

---

### C-2 — Duplicate Prisma schema

| | |
|---|---|
| **Conflict** | Two Prisma schemas exist and disagree; neither contains the complete MVP model |
| **Verified facts** | F-01, F-02, F-03, F-04, F-06 |
| **Impact** | A root-CWD `prisma migrate dev` would start a second migration history with unreviewed CRM models |
| **Decision** | DEC-001 — `packages/db/prisma/schema.prisma` is authoritative; the root schema is removed and the path pinned |
| **Status** | **RESOLVED** in V2.1 (decision recorded; implementation pending) |

---

### C-3 — Authentication documentation vs implementation

| | |
|---|---|
| **Conflict** | `README.md` states every variable is validated at process boot and fails fast |
| **Verified facts** | `loadEnv()` is called lazily inside route handlers; no `instrumentation.ts` exists |
| **Impact** | A security control is documented rather than enforced. A deployment missing a secret starts, passes its health check, and fails on the first real payment. |
| **Decision** | Fix the code or the claim. Not resolved by this PRD, which does not modify README. |
| **Status** | **OPEN** — implementation item |

---

### C-4 — Database documentation vs migration state

| | |
|---|---|
| **Conflict** | `docs/DATABASE.md` describes seventeen models; `docs/MIGRATIONS.md` describes six migrations |
| **Verified facts** | The deployed schema has six models / eleven tables; the chain has nine applied migrations with two quarantined (F-04, F-06) |
| **Impact** | Documentation describes a schema that is not deployed |
| **Decision** | Documentation correction required. Not performed here — this task does not modify architecture documentation. |
| **Status** | **OPEN** — documentation item |

---

### C-5 — Outreach migration quarantine

| | |
|---|---|
| **Conflict** | PRD V2.0 §53 requires outreach provenance and an approval gate; the database-level send gate is in quarantined migration `0005` |
| **Verified facts** | F-05 — `0005` and `0006` `ALTER` tables no migration creates |
| **Impact** | The outreach safety layer is tested at the application level but unenforceable at the database level |
| **Decision** | Outreach must not be wired in any phase until the send gate is restorable. Out of MVP scope regardless. |
| **Status** | **OPEN** — Phase 2 prerequisite, recorded so Phase 2 does not begin without it |

---

### C-6 — Double inference discount

| | |
|---|---|
| **Conflict** | `effectiveConfidence()` halves INFERRED confidence at persistence; `INFERENCE_DISCOUNT` halves by basis at scoring |
| **Verified facts** | F-14 |
| **Impact** | Inference may be discounted twice, systematically under-ranking inferred opportunities |
| **Decision** | PFR-04 and PFR-06 — persist raw confidence and classification; discount once, at scoring time |
| **Status** | **RESOLVED** in design; implementation pending |

---

### C-7 — Opportunity stage vocabulary

| | |
|---|---|
| **Conflict** | `stages.ts` implements a nine-value machine; quarantined migration `0006` migrates *from* a set containing `SOURCED`, `PERSONALIZED`, `FOLLOWING_UP`, `PROPOSED` |
| **Verified facts** | Those four values exist in no current schema or migration |
| **Impact** | `0006` cannot be restored as written even once outreach is in scope |
| **Decision** | The `stages.ts` nine-value machine is canonical. `0006` requires rewriting, not restoring. |
| **Status** | **RESOLVED** for MVP; `0006` remains an open Phase 2 item |

---

### C-8 — Session TTL

| | |
|---|---|
| **Conflict** | `ACCESS_TOKEN_TTL_MS` is 30 days, selected for a purchased-product credential, and would be inherited by sessions |
| **Verified facts** | F-11 — one token table serves both purposes |
| **Impact** | A 30-day working session may be inappropriate |
| **Decision** | Not decided |
| **Status** | **OPEN** — OQ-1 |

---

# OPEN QUESTIONS

Only questions that materially affect architecture, implementation or release.

### OQ-1 — Session lifetime

`ACCESS_TOKEN_TTL_MS` is 30 days, chosen for a purchased-product credential. A working session
likely wants less, which means a second constant. **Not decided.**

### OQ-2 — Authentication mechanism

Magic-link requires email transport, which does not exist (F-22). Out-of-band provisioning of a
small number of validation users avoids that dependency and uses the same session mechanism, so
magic-link can be added later without redesigning ownership. **Not decided.** This PRD does not
invent an authentication provider.

### OQ-3 — Client Finder entitlement gating

Whether Client Finder access is gated behind the ₹1,499 purchase is **not answered anywhere in the
repository**. If gated, identity and entitlement converge operationally; if not, they remain
separate. The architecture deliberately does not assume either. **Not decided.**

### OQ-4 — Derivation of ServiceProfile rule fields

`triggers`, `keywords` and `rationale` are system-derived, but *how* — a curated catalogue matched
on the service string, or an AI pass over the profile text — is **not decided**. Affects the
profile-creation path, not the schema.

### OQ-5 — Feedback reason format

Free text or a closed set. Free text captures unanticipated reasons; a closed set is analysable.
**Not decided.** Affects the column type.

### OQ-6 — Deployment environments

Whether staging or production databases exist, and at what migration state, **could not be
verified** — only a local test database was observable. Must be confirmed before any deploy.

---
---

# LAYER 5

# ACCEPTANCE CRITERIA & RELEASE GATES

---

# ACCEPTANCE CRITERIA

Behaviour-oriented. "The table exists" is not an acceptance criterion. Only capabilities permitted
by `MVP_SCOPE_BOUNDARY.md` appear as current-release gates.

| ID | Criterion |
|---|---|
| AC-01 | An authenticated user is identified by a server-derived `userId` that no request field can influence. |
| AC-02 | A request bearing an entitlement-only token (`user_id IS NULL`) is rejected as unauthenticated. |
| AC-03 | User B requesting user A's Search, Prospect, Opportunity or Feedback by primary key receives an empty result — not the row, not a 500. |
| AC-04 | An authenticated user can create a Service Profile with service, target customer, geography and minimum project value, and it is retrievable only by them. |
| AC-05 | A user can create a Search from a Service Profile and observe its status transition through PENDING → RUNNING → COMPLETE. |
| AC-06 | Editing a Service Profile after a Search has completed does not change that Search's stored parameters or the rationale of its opportunities. |
| AC-07 | A completed Search yields discovered businesses obtained through the provider abstraction, not a hardcoded fixture. |
| AC-08 | Discovered businesses are normalised into a consistent internal representation with a deterministic `normalized_domain`. |
| AC-09 | The same business does not appear twice within one Search. The same business may appear in a later Search. |
| AC-10 | Research executes per prospect and produces schema-valid output; a validation failure is repaired or the run fails visibly. |
| AC-11 | Every OBSERVED claim quotes verbatim from the document whose URL it cites. A fabricated quote or invented URL is rejected. |
| AC-12 | After persistence, the UI can distinguish OBSERVED, INFERRED and UNKNOWN, and can show more than one source for a claim. |
| AC-13 | A prospect with insufficient evidence produces no detected need rather than a speculative one. |
| AC-14 | An opportunity with insufficient evidence records **NO SUITABLE OFFER** rather than defaulting to the user's service. |
| AC-15 | Opportunities are persisted with their prospect, detected need, recommended offer and state. |
| AC-16 | A seven-factor score is produced from persisted evidence, with each factor's weight, raw value, points, basis and reason retrievable. |
| AC-17 | Re-ranking the same opportunities with the same scorer version produces an identical order. |
| AC-18 | An inferred factor is discounted exactly once. The persisted confidence is the raw value. |
| AC-19 | An aged signal contributes less than a fresh one; a superseded signal contributes nothing. |
| AC-20 | An opportunity whose evidence has aged is marked stale rather than deleted. |
| AC-21 | Each opportunity carries a next action the user can act on. |
| AC-22 | A user can record useful/not-useful with a reason, and it survives a page reload and a server restart. |
| AC-23 | A Search claimed by a worker records results under the owner persisted on the Search row, never under an identity supplied to the worker. |
| AC-24 | AI execution cost for a Search is measurable after the run. |
| AC-25 | A discovery-provider failure, a research failure and a worker crash each leave the Search in a defined state with a recorded error, and corrupt no Opportunity. |

---

# RELEASE GATES — CLIENT FINDER MVP

The MVP must **not** be considered complete because the build succeeds, unit tests pass, APIs
respond, the UI renders, the migration applies, or prospects appear on screen. Those are necessary
and prove nothing about the product.

The integrated journey must work:

```text
Authenticated User → Service Profile → Search → Discovery → Deduplication
    → Research → Evidence → Need Detection → Offer Recommendation
    → Opportunity → Seven-Factor Score → Ranking → User Review → Feedback
```

| Gate | Requirement |
|---|---|
| **G-01 Functional integrity** | The journey above completes end to end for an authenticated user. |
| **G-02 Data integrity** | Ownership, uniqueness and relationships are correct: every owned row has an owner; `UNIQUE(search_id, company_id)` holds; no orphaned child rows. |
| **G-03 Evidence integrity** | Classification, raw confidence, provenance and UNKNOWN states all survive persistence and are retrievable. |
| **G-04 Scoring integrity** | The seven-factor score is deterministic; inference is discounted exactly once; each factor is independently explainable. |
| **G-05 Reproducibility** | A completed Search's meaning is preserved through its immutable input snapshot, regardless of later profile edits. |
| **G-06 Security** | No caller-supplied identity can bypass ownership. Verified by a cross-user test per owned model, not by inspection. |
| **G-07 Worker correctness** | Workers operate on authoritative persisted ownership; a stale worker cannot overwrite a live one. |
| **G-08 Failure handling** | Expected failures (provider error, research failure, worker crash, lease expiry) leave Search and Opportunity state defined and uncorrupted. |
| **G-09 Integration testing** | Critical journey paths have meaningful integration coverage against real PostgreSQL — not unit tests over in-memory inputs. |
| **G-10 Scope compliance** | No deferred CRM, outreach, follow-up, proposal or subscription capability has entered the MVP, as tables, columns, relations or routes. |
| **G-11 Production readiness** | Marked only after operational, security and reliability requirements are **actually verified** — not inferred from a passing test suite. |

> **G-11 is not currently satisfiable.** No capability in this repository is production-ready today.

---

# MVP SUCCESS MEASUREMENT

**Engineering release completion** and **product validation** are different gates and must not be
conflated.

### Engineering release completion

All acceptance criteria and release gates above, subject to `MVP_SCOPE_BOUNDARY.md`.

### Product validation

Primary question:

> **"Would you actually contact this business?"**

Then, in sequence:

```text
1. Is the opportunity credible?
2. Would the user contact it?
3. Did the user contact it?
4. Did the prospect respond?
5. Did a sales conversation occur?
6. Did the user win revenue?
```

Questions 3–6 are **outcome validation**. They may extend well beyond the first MVP implementation
and are **not** required to declare the engineering release complete, unless the Scope Boundary
explicitly requires them. Building machinery to measure them automatically is out of current scope.

> The system must never fabricate a business need in order to produce a result. This is the failure
> mode that destroys product validation regardless of engineering quality.

---
---

# FUTURE ROADMAP

Future capability descriptions are **not** current implementation requirements.

```text
PHASE 1   Client Finder MVP                       ← current release
   ↓
PHASE 2   Acquisition workflow
          OUTREACH PREPARATION → APPROVAL → CONTACT → FOLLOW-UP
   ↓
PHASE 3   Proposal · CRM · outcome tracking
   ↓
PHASE 4   AI Acquisition OS
   ↓
PHASE 5   Recurring SaaS
   ↓
PHASE 6   Autonomous acquisition
```

Preserved across all phases:

```text
DISCOVER → BUILD → ACQUIRE → EARN
```

The DISCOVER and BUILD stages remain part of the product vision and are **not** cancelled by the
current focus on ACQUIRE. They are scheduled after Client Finder validation because acquisition is
the stage where users currently fail hardest, not because the earlier stages matter less.

**Phase 2 prerequisite:** the outreach send gate (Conflict C-5) must be restorable before any
outreach capability is wired.

---

# V2.1 CHANGE LOG

Material changes from V2.0. Not a line-by-line diff.

### Product vision
Preserved without narrowing. The beginner "Make Money With AI" journey, the DISCOVER → BUILD →
ACQUIRE → EARN arc, and the full ICP remain intact. Client Finder is identified as the current
implementation focus, explicitly **not** as the product.

### User journey
Expanded to 24 stages, each with user goal, system/AI/human responsibility, inputs, outputs, state
transitions, evidence requirements and an explicit MVP/FUTURE classification.

### MVP clarification
`MVP_SCOPE_BOUNDARY.md` is named as the binding release-scope authority and is referenced rather
than duplicated. A standing rule is added: existing repository code does not enter MVP scope by
virtue of existing.

### Architecture
New Layer 4 recording database authority, migration policy, identity separation, access-token rules,
tenancy, ownership inheritance, evidence model, inference-discount flow, search reproducibility,
company/prospect ownership, the opportunity state machine, the scoring model and worker ownership.

### Identity / authentication
Authentication is recorded as **NOT IMPLEMENTED**, with the verified evidence. `currentAccess()` is
explicitly not described as functional authentication. The identity ≠ entitlement ≠ payment
separation is established and shown to be both already present in the code and forced by the schema.

### Data model
Nine MVP models defined with ownership, relationships and constraints. Six CRM models explicitly
excluded as tables *and* relations.

### Evidence model
Promoted to a first-class product concept. Classification, raw confidence, multiple sources and
UNKNOWN survival are now requirements.

### Scoring
The repository's seven-factor model is confirmed authoritative; `ProspectScore` is reused rather
than replaced. The double-discount risk is recorded as Conflict C-6 with a resolution.

### Search reproducibility
Input snapshotting introduced as DEC-007, with the failure mode it prevents stated.

### Scope separation
Five-layer structure added. `IMPLEMENTED ≠ INTEGRATED ≠ TESTED ≠ PRODUCTION READY` applied
throughout rather than asserted once.

### Readiness classification
New Repository Status Table carrying all four readiness gates per capability. No capability is
marked production-ready.

### Traceability
New requirement-to-repository matrix with real paths and real test files. Absences are recorded as
`NOT IMPLEMENTED`, `NO VERIFIED TEST` or `REQUIRES VERIFICATION` rather than left blank.

### Decision register
Nine decisions (DEC-001 … DEC-009) with decision, status, evidence, impact, scope implication and
version.

### Conflict register
Eight conflicts recorded; four resolved in V2.1, four left explicitly open.

### Post-Foundation corrections
Fifteen corrections incorporated, with a note that they resolve ambiguity and do not expand scope.

### Open questions
Six recorded as unresolved rather than answered by assumption.

---

# DOCUMENT CONTROL

| | |
|---|---|
| **This document** | Product requirements. Describes what the product must eventually do. |
| **`MVP_SCOPE_BOUNDARY.md`** | Binding release-scope authority. Decides what may be built now. |
| **Repository** | Current implementation reality. |
| **Tests** | Executable evidence. |

A requirement in this document is not a work order. A capability in the repository is not in scope.
A passing unit test is not integration. An integration test is not production readiness.

Where this document and the Scope Boundary can be read differently, **the Scope Boundary governs**,
and the difference is recorded in the Conflict Register rather than resolved in code.
