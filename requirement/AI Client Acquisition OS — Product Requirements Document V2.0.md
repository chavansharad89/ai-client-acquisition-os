# AI CLIENT ACQUISITION OS

## Product Requirements Document — Version 2.0

**Product:** AI Client Acquisition OS\
**Core Engine:** AI Client Finder & Acquisition Agent\
**Document:** Master Product Requirements Document\
**Version:** 2.0\
**Status:** Product / Engineering Baseline\
**Current Product Stage:** Stage 6 — Client Finder MVP / Pre-implementation\
**Primary Current Validation:** Evidence-backed client opportunity discovery\
**Initial Controlled Market:** Website developers / small web agencies → Restaurants → Mumbai\
**Initial Target User:** Anyone who wants to turn AI into income, including beginners, aspiring freelancers, existing professionals, freelancers, and small agencies

---

# DOCUMENT PURPOSE

This document defines the complete product requirements for AI Client Acquisition OS.

It is intentionally broader than the current Client Finder MVP.

The document describes:

1. The business and product vision
2. The complete beginner-to-client journey
3. Functional product requirements
4. Repository and architecture mapping
5. Acceptance criteria and release gates

Every major capability is explicitly classified as:

- **IMPLEMENTED LOGIC**
- **PARTIAL**
- **NOT IMPLEMENTED**
- **FUTURE**

The purpose is to create a single source of truth for product, engineering, AI, data, UX, commercial, security, and validation decisions.

---

# EXECUTIVE SUMMARY

AI Client Acquisition OS is an AI-powered system designed to help people turn AI into income.

The consumer-facing entry proposition is:

> **MAKE MONEY WITH AI**

The complete product journey is:

> **DISCOVER → BUILD → ACQUIRE → EARN**

The mature operating system becomes:

> **DISCOVER → BUILD → FIND → RESEARCH → QUALIFY → PERSONALIZE → CONTACT → FOLLOW UP → PROPOSE → CLOSE → LEARN → REPEAT**

The system should help a user answer:

> **What can I sell?**

> **Who needs it?**

> **Why do they need it?**

> **What should I offer?**

> **What should I say?**

> **What should I do next?**

> **Did it work?**

The core product promise is:

> **Find businesses that need what you sell.**

The system must not guarantee that a user will obtain a client.

The current release deliberately focuses on proving the hardest and most economically important part:

> **Can AI reliably identify businesses that genuinely appear to need a service and provide sufficient evidence for the user to act?**

---

# LAYER 1

# BUSINESS / PRODUCT VISION

---

# 1. PRODUCT VISION

The long-term vision is to build an AI-powered income and client acquisition operating system.

The product should help a person move from:

> “I want to make money with AI.”

to:

> “I have a service.”

to:

> “I have prospects.”

to:

> “I have sales conversations.”

to:

> “I have clients.”

to:

> “I have a repeatable acquisition engine.”

---

# 2. TWO-PRODUCT ARCHITECTURE

The product consists conceptually of two connected systems.

## 2.1 System A — Income / Funnel Layer

This layer helps users discover and build an income opportunity.

```text
MAKE MONEY WITH AI
        ↓
DISCOVER
        ↓
CHOOSE PATH
        ↓
BUILD SERVICE
        ↓
CREATE PROOF
```

Commercial funnel:

```text
₹99
AI Income Starter Kit
        ↓
₹499
AI Freelancing Launch Kit
        ↓
₹1,499
AI Client Acquisition System
```

---

## 2.2 System B — Acquisition Engine

This layer helps users acquire customers.

```text
FIND
 ↓
RESEARCH
 ↓
QUALIFY
 ↓
OFFER
 ↓
PERSONALIZE
 ↓
CONTACT
 ↓
FOLLOW UP
 ↓
CONVERSATION
 ↓
PROPOSAL
 ↓
CLOSE
 ↓
REVENUE
 ↓
LEARN
```

The acquisition engine is the strategic core of the long-term SaaS.

---

# 3. PRODUCT POSITIONING

## Consumer-facing positioning

> **MAKE MONEY WITH AI**

Supporting proposition:

> **Turn AI into a service, find people who need it, and start getting clients.**

---

## Product-level positioning

> **Discover qualified prospects, understand their needs, and turn them into sales conversations.**

---

## Long-term positioning

> **Tell us what you sell. We'll help you find businesses that have a reason to buy it.**

---

# 4. WHAT THE PRODUCT IS NOT

The product is not primarily:

- An AI prompt library
- An AI tools directory
- A generic lead database
- A business scraper
- A generic chatbot
- An AI course
- A guaranteed-income program

The product's value comes from:

> **Guided execution + opportunity intelligence + evidence + acquisition assistance + outcome learning.**

---

# 5. TARGET USERS

The system must support users at different levels of maturity.

## 5.1 Beginner

> “I want to make money with AI but don't know what to do.”

Status:

**VISION / NOT IMPLEMENTED**

---

## 5.2 AI learner

> “I know ChatGPT and some AI tools. What service can I sell?”

Status:

**VISION / NOT IMPLEMENTED**

---

## 5.3 Existing professional

> “I'm a designer/developer/marketer. How can AI help me earn more?”

Status:

**VISION / PARTIAL**

---

## 5.4 Freelancer

> “I already sell a service. Help me find customers.”

Status:

**CORE CURRENT TARGET / PARTIAL**

---

## 5.5 Small agency

> “Help me acquire customers consistently.”

Status:

**FUTURE**

---

# 6. COMMERCIAL PRODUCT LADDER

## 6.1 ₹99 — AI Income Starter Kit

Purpose:

> **DISCOVER**

Primary question:

> “What can I do with AI?”

Potential functionality:

- AI income opportunities
- Opportunity scorecard
- Prompts
- 7-day challenge
- Freelancing ideas
- AI tools
- Outreach templates
- Content ideas

Status:

**PARTIAL / DIGITAL PRODUCT FOUNDATION**

---

## 6.2 ₹499 — AI Freelancing Launch Kit

Purpose:

> **BUILD**

Primary question:

> “What exactly should I sell?”

Potential functionality:

- Service selection
- Customer selection
- Pricing
- Packages
- Portfolio
- Proposal
- SOPs
- Outreach
- 30-day execution plan

Status:

**PARTIAL / DIGITAL PRODUCT FOUNDATION**

---

## 6.3 ₹1,499 — AI Client Acquisition System

Purpose:

> **ACQUIRE**

Primary question:

> “Who should I sell to and how do I approach them?”

Core flow:

```text
FIND
 ↓
RESEARCH
 ↓
QUALIFY
 ↓
PERSONALIZE
 ↓
CONTACT
 ↓
FOLLOW UP
 ↓
PROPOSE
 ↓
CLOSE
```

Status:

**PARTIAL / ACQUISITION ENGINE FOUNDATION EXISTS**

---

## 6.4 SaaS

Purpose:

> **REPEAT / SCALE**

Primary question:

> “How do I continuously acquire customers?”

Status:

**FUTURE**

---

# 7. NORTH-STAR OUTCOME

The ultimate outcome is:

> **Help a user move from wanting to make money with AI to obtaining a real customer.**

The product must not guarantee the result.

---

# 8. NORTH-STAR PRODUCT QUESTION

The primary MVP question is:

> **Would the user actually contact these businesses?**

Secondary questions:

1. Did they contact them?
2. Did the prospect reply?
3. Did a qualified conversation occur?
4. Was a proposal sent?
5. Was a client won?
6. How much revenue resulted?

---

# 9. CORE DIFFERENTIATION

The product should optimize for:

> **Who needs my service now?**

rather than:

> **Who exists in my target market?**

The core differentiator is:

**Discovery → Need Detection → Qualification → Personalization → Outreach → Outcome Feedback**

---

# LAYER 2

# COMPLETE USER JOURNEY

---

# 10. MASTER USER JOURNEY

```text
MAKE MONEY WITH AI
        ↓
DISCOVER
        ↓
CHOOSE INCOME PATH
        ↓
CHOOSE SERVICE
        ↓
BUILD CAPABILITY
        ↓
CREATE PROOF
        ↓
DEFINE SERVICE PROFILE
        ↓
FIND PROSPECTS
        ↓
RESEARCH
        ↓
DETECT NEED
        ↓
SCORE
        ↓
GENERATE OPPORTUNITY
        ↓
CHOOSE PROSPECT
        ↓
GENERATE OUTREACH
        ↓
USER APPROVES
        ↓
CONTACT
        ↓
FOLLOW UP
        ↓
REPLY
        ↓
QUALIFY
        ↓
PROPOSAL
        ↓
USER APPROVES
        ↓
CLOSE
        ↓
FIRST CLIENT
        ↓
RECORD REVENUE
        ↓
LEARN
        ↓
FIND MORE
        ↓
REPEAT
```

---

# 11. STAGE A — DISCOVER

User enters:

> “I want to make money with AI.”

System asks about:

- Existing skills
- Experience
- AI knowledge
- Interests
- Time available
- Income objective
- Preferred work type
- Sales comfort
- Desired speed to first income

AI recommends a small number of paths.

For each path:

- What to sell
- Who buys it
- Why it fits
- Skills required
- Learning requirements
- Difficulty
- Potential pricing
- Acquisition difficulty
- Next step

Status:

**NOT IMPLEMENTED**

---

# 12. STAGE B — CHOOSE SERVICE

User chooses one income path.

System converts it into a concrete service.

Example:

> “AI social media content for restaurants.”

System defines:

- Service
- Customer
- Geography
- Deliverables
- Pricing
- Positioning
- Capabilities

Status:

**PARTIAL / SERVICE PROFILE FOUNDATION**

---

# 13. STAGE C — BUILD

System creates an actionable path to service readiness.

Possible:

- Learning plan
- SOP
- Templates
- AI workflows
- Practice tasks
- Quality checklist

Status:

**NOT IMPLEMENTED**

---

# 14. STAGE D — CREATE PROOF

User creates legitimate:

- Sample work
- Spec projects
- Demonstrations
- Before/after examples
- Portfolio

The system must never encourage:

- Fake clients
- Fake testimonials
- Fake case studies
- Fabricated experience

Status:

**NOT IMPLEMENTED**

---

# 15. STAGE E — DEFINE SERVICE PROFILE

The user establishes:

- Service
- Description
- Target industry
- Geography
- Minimum project value
- Capabilities
- Positioning
- Deliverables
- Pricing

Status:

**PARTIAL / DOMAIN FOUNDATION**

---

# 16. STAGE F — FIND PROSPECTS

User says:

> “I build websites for restaurants in Mumbai. Minimum project value ₹30,000.”

System discovers candidate businesses.

Current controlled MVP:

- Website development
- Website redesign
- Restaurants
- Mumbai
- Approximately 20 opportunities

Status:

**PARTIAL / CORE CURRENT IMPLEMENTATION**

---

# 17. STAGE G — RESEARCH

System researches each candidate.

Research includes:

- Website
- Mobile experience
- Social activity
- Observable problems
- Buying signals
- Business context
- Reachability
- Evidence

Status:

**IMPLEMENTED LOGIC / INTEGRATION PARTIAL**

---

# 18. STAGE H — NEED DETECTION

The system determines whether a genuine service opportunity exists.

Example:

```text
Website exists
+
Mobile UX issue
+
Weak booking CTA
+
Active marketing
=
Potential redesign opportunity
```

The system must distinguish:

**Observed**

from:

**Inferred**

from:

**Unknown**

Status:

**IMPLEMENTED LOGIC**

---

# 19. STAGE I — SIGNAL FRESHNESS

Signals must have freshness.

Signals should contain:

- observedAt
- confidence
- supersededAt

Signal contribution should decay over time.

Current repository rule:

- Full contribution during first 30 days
- Linear decay thereafter
- Signals older than 180 days contribute zero

Status:

**IMPLEMENTED LOGIC**

---

# 20. STAGE J — OPPORTUNITY GENERATION

For each qualified prospect:

- Problem
- Evidence
- Business implication
- Recommended solution
- Service fit
- Estimated value
- Confidence
- Recommended action

If no evidence supports an offer, the system must not invent one.

Status:

**IMPLEMENTED LOGIC**

---

# 21. STAGE K — SCORING

The repository-aligned seven-factor model is:

| Factor           |   Weight |
| ---------------- | -------: |
| ICP fit          |      20% |
| Visible problem  |      20% |
| Ability to pay   |      15% |
| Urgency          |      15% |
| Service fit      |      15% |
| Evidence quality |      10% |
| Contactability   |       5% |
| **Total**        | **100%** |

Current score interpretation:

- HIGH ≥ 65
- MEDIUM ≥ 35
- LOW < 35

The score is an estimate, not truth.

Status:

**IMPLEMENTED LOGIC**

---

# 22. STAGE L — INFERENCE DISCOUNT

Inferred evidence must not be treated as equivalent to observed evidence.

Current repository rule:

> **INFERRED claims receive a 50% inference discount.**

Status:

**IMPLEMENTED LOGIC**

---

# 23. STAGE M — NEXT ACTION

Every active opportunity should produce a clear next action.

Canonical mapping:

| Stage          | Next Action              |
| -------------- | ------------------------ |
| NEW            | Find a reason to contact |
| RESEARCHED     | Draft opening message    |
| CONTACTED      | Follow up                |
| REPLIED        | Reply                    |
| QUALIFIED      | Send proposal            |
| PROPOSAL\_SENT | Chase proposal           |
| WON            | None                     |
| LOST           | None                     |
| PAUSED         | None                     |

The system should prioritize one ordered action list instead of overwhelming users with multiple dashboards.

Status:

**IMPLEMENTED LOGIC**

---

# 24. STAGE N — OPPORTUNITY STALENESS

Current repository staleness thresholds:

| Stage          | Threshold |
| -------------- | --------: |
| NEW            |    7 days |
| RESEARCHED     |    3 days |
| CONTACTED      |    4 days |
| REPLIED        |     1 day |
| QUALIFIED      |    3 days |
| PROPOSAL\_SENT |    5 days |

The product must surface stale opportunities.

Status:

**IMPLEMENTED LOGIC**

---

# 25. STAGE O — OUTREACH

AI generates:

- Email
- LinkedIn message
- WhatsApp message
- Instagram DM

based on available evidence and channels.

Status:

**IMPLEMENTED LOGIC / PRODUCTION WIRING PARTIAL**

---

# 26. STAGE P — OUTREACH VERIFICATION

Generated messages must be checked for:

- Unsupported claims
- Fabricated numbers
- Missing company reference
- Generic spam
- Excessive length
- Insufficient content
- Missing subject
- Invalid subject
- Multiple CTAs
- Unresolved placeholders

Every company-specific claim must be evidence-backed.

Status:

**IMPLEMENTED LOGIC**

---

# 27. STAGE Q — HUMAN APPROVAL

Initial architecture:

```text
AI generates
 ↓
Validation
 ↓
DRAFT
 ↓
USER APPROVES
 ↓
SENT
```

Possible rejection:

```text
DRAFT
 ↓
REJECTED
```

No autonomous sending in the first release.

Status:

**IMPLEMENTED LOGIC / PRODUCT INTEGRATION PARTIAL**

---

# 28. STAGE R — FOLLOW-UP

Canonical cadence:

**3 → 5 → 8 → 13 business days**

Maximum:

**4 follow-ups**

Channel escalation may occur:

```text
EMAIL
 ↓
LINKEDIN
 ↓
WHATSAPP
 ↓
INSTAGRAM DM
```

Only channels actually available may be used.

Status:

**IMPLEMENTED LOGIC**

---

# 29. FOLLOW-UP SAFETY STOPS

Follow-up must stop when:

- Prospect replies
- Prospect unsubscribes
- Prospect is paused
- Prospect is closed
- No valid channel exists
- Maximum follow-ups are exhausted

Status:

**IMPLEMENTED LOGIC**

---

# 30. STAGE S — CONVERSATION

When a prospect replies, system assists with:

- Need identification
- Budget
- Timeline
- Scope
- Decision maker
- Existing provider
- Urgency
- Objections

Status:

**PARTIAL**

---

# 31. STAGE T — QUALIFICATION

Canonical stage:

**QUALIFIED**

The system should help determine whether the prospect is commercially viable.

Status:

**PARTIAL / DOMAIN FOUNDATION**

---

# 32. STAGE U — PROPOSAL

Proposal flow:

```text
QUALIFIED
 ↓
PROPOSAL DRAFT
 ↓
VERSION
 ↓
USER APPROVAL
 ↓
SEND
 ↓
ACCEPT / DECLINE
```

Proposal versions must be immutable.

Editing produces a new version.

Status:

**IMPLEMENTED LOGIC / INTEGRATION PARTIAL**

---

# 33. AUTHORITATIVE PRICING

AI must not invent authoritative pricing.

Commercial pricing must come from:

- User input
- Service profile
- Product/catalogue
- Authoritative pricing configuration

AI may describe or structure pricing but cannot override authoritative values.

Status:

**IMPLEMENTED LOGIC**

---

# 34. STAGE V — CLOSE

System assists with:

- Objection handling
- Negotiation preparation
- Proposal revision
- Closing follow-up

The system does not guarantee a sale.

Status:

**PARTIAL / FUTURE EXPANSION**

---

# 35. STAGE W — FIRST CLIENT

When a deal is won, record:

- Prospect
- Service
- Deal value
- Date
- Acquisition source
- Outcome

Status:

**PARTIAL**

---

# 36. STAGE X — OUTCOME FEEDBACK

Track:

- Furthest stage
- Offer
- Outreach angle
- Follow-ups
- Revenue
- Open date
- Closed date
- Win/loss reason

Status:

**PARTIAL / DOMAIN FOUNDATION**

---

# 37. STAGE Y — LEARNING

Historical outcomes should improve:

- Prospect ranking
- Offer recommendations
- Outreach angles
- Follow-up timing
- Opportunity-value estimation
- Targeting

Status:

**PARTIAL / FUTURE EXPANSION**

---

# LAYER 3

# FUNCTIONAL REQUIREMENTS

---

# 38. REQUIREMENT STATUS LEGEND

| Status            | Meaning                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| IMPLEMENTED LOGIC | Domain/business logic exists                                           |
| PARTIAL           | Some implementation exists but integration/functionality is incomplete |
| NOT IMPLEMENTED   | Requirement is defined but implementation is absent                    |
| FUTURE            | Deliberately outside current release                                   |

Important:

> **IMPLEMENTED LOGIC does not mean production-ready.**

---

# 39. USER IDENTITY AND TENANCY

The system must eventually support:

- User identity
- Authentication
- Authorization
- User-level data isolation
- Workspace/tenant
- Subscription ownership
- Usage ownership

Current status:

**NOT IMPLEMENTED / FOUNDATION GAP**

This must be completed before production SaaS usage.

---

# 40. SERVICE PROFILE REQUIREMENTS

A ServiceProfile must contain:

- id
- userId
- serviceName
- description
- targetIndustry
- location
- minimumProjectValue
- capabilities
- positioning
- deliverables
- pricing
- createdAt
- updatedAt

Status:

**PARTIAL**

---

# 41. SEARCH REQUIREMENTS

Search must contain:

- id
- userId
- serviceProfileId
- query
- status
- requestedCount
- createdAt
- completedAt

Statuses:

- PENDING
- RUNNING
- COMPLETE
- FAILED
- CANCELLED

Status:

**PARTIAL**

---

# 42. ASYNCHRONOUS SEARCH

Long-running work must not execute inside HTTP requests.

Required architecture:

```text
POST SEARCH
    ↓
PENDING
    ↓
JOB
    ↓
WORKER
    ↓
DISCOVERY
    ↓
RESEARCH
    ↓
SCORING
    ↓
OPPORTUNITY
    ↓
PERSIST
    ↓
COMPLETE
```

Status:

**PARTIAL**

---

# 43. DISCOVERY PROVIDER

The initial MVP should use one controlled/reliable discovery provider.

Architecture must use a provider abstraction.

Future providers must be addable without rewriting the core pipeline.

Status:

**PARTIAL**

---

# 44. CANDIDATE NORMALIZATION

Candidate data must normalize:

- Business name
- Domain
- Website
- Phone
- Email
- Industry
- Location
- Source
- Source URL

Status:

**PARTIAL**

---

# 45. DEDUPLICATION

Duplicate businesses must be detected using combinations of:

- Normalized business name
- Domain
- Phone
- Address
- Provider identifiers

Source provenance must remain available after deduplication.

Status:

**PARTIAL**

---

# 46. RESEARCH REQUIREMENTS

Research output must include:

- Summary
- Website presence
- Mobile assessment
- Social activity
- Observable problems
- Buying signals
- Confidence
- Evidence

Status:

**IMPLEMENTED LOGIC**

---

# 47. EVIDENCE REQUIREMENTS

Every material claim should contain:

- Claim
- Classification
- Source URL
- Source type
- Confidence

Classifications:

- OBSERVED
- INFERRED
- UNKNOWN

Status:

**IMPLEMENTED LOGIC**

---

# 48. AI STRUCTURED OUTPUT

AI pipeline:

```text
LLM
 ↓
Structured JSON
 ↓
Zod Validation
 ↓
Semantic Validation
 ↓
Database
```

Must support:

- Retry
- Repair
- Validation
- Confidence
- Failure handling

Status:

**IMPLEMENTED LOGIC**

---

# 49. OFFER ENGINE

The offer engine should map research signals to relevant services/offers.

If no matching signal exists:

> **No offer should be generated.**

The system must not manufacture a generic opportunity.

Status:

**IMPLEMENTED LOGIC**

---

# 50. OPPORTUNITY MODEL

Opportunity must contain:

- Problem
- Solution
- Service fit
- Estimated minimum value
- Estimated maximum value
- Confidence

Estimates must be labelled as estimates.

Status:

**IMPLEMENTED LOGIC**

---

# 51. PROSPECT STATE MACHINE

Canonical lifecycle:

```text
NEW
 ↓
RESEARCHED
 ↓
CONTACTED
 ↓
REPLIED
 ↓
QUALIFIED
 ↓
PROPOSAL_SENT
 ↓
WON
```

Alternative terminal/non-progress states:

```text
LOST
PAUSED
```

The state machine must be deterministic.

Status:

**IMPLEMENTED LOGIC**

---

# 52. OUTREACH STATE MACHINE

Canonical states:

```text
DRAFT
 ↓
APPROVED
 ↓
SENT
```

Alternative:

```text
DRAFT → REJECTED
```

Human approval is required before sending.

Status:

**IMPLEMENTED LOGIC**

---

# 53. OUTREACH PROVENANCE

Every generated outreach item should record:

- Model
- Prompt version
- Research version
- Generation timestamp
- Human edits
- Approver
- Approval timestamp

Status:

**IMPLEMENTED LOGIC / INTEGRATION PARTIAL**

---

# 54. FOLLOW-UP REQUIREMENTS

Follow-up must use:

- Cadence
- Channel availability
- Reply state
- Unsubscribe state
- Pause state
- Closed state
- Follow-up limit

Status:

**IMPLEMENTED LOGIC**

---

# 55. PROPOSAL VERSIONING

Proposal versions must be immutable.

Editing creates:

> **New proposal version**

The system must preserve historical versions.

Status:

**IMPLEMENTED LOGIC**

---

# 56. DASHBOARD REQUIREMENTS

The operating dashboard should provide:

- Leads found
- Researched
- Opportunities
- Outreach
- Follow-ups
- Conversations
- Proposals
- Wins
- Revenue

The primary interaction should remain an ordered action queue.

Status:

**PARTIAL**

---

# 57. TRACK VS IMPROVE

Analytics must distinguish:

## TRACK

> Where are opportunities dying?

Metrics:

- Stage conversion
- Stale opportunities
- Response rates
- Proposal rates
- Win rates

## IMPROVE

> Which strategies work?

Metrics:

- Outreach angle performance
- Offer performance
- Service performance
- Prospect-type performance
- Revenue performance

These are analysis layers, not additional lifecycle stages.

Status:

**PARTIAL**

---

# 58. OUTCOME AND REVENUE FEEDBACK

The system should connect:

```text
Prospect
 ↓
Research
 ↓
Offer
 ↓
Outreach
 ↓
Follow-up
 ↓
Conversation
 ↓
Proposal
 ↓
Outcome
 ↓
Revenue
```

This data should eventually improve future recommendations.

Status:

**PARTIAL**

---

# 59. AI COST MANAGEMENT

Every AI operation must be measurable.

At minimum track:

- Model
- Tokens
- Operation type
- Cost estimate
- Retry count
- Repair count

Research is expected to be the highest-volume AI operation.

Model selection should consider economics.

Status:

**PARTIAL / FUTURE METERING**

---

# 60. USAGE METERING

Future SaaS must support:

- AI operation counts
- Prospect counts
- Search counts
- Research counts
- Outreach generation counts
- Proposal generation counts
- Plan quotas
- Credits
- Overage

Status:

**NOT IMPLEMENTED**

---

# 61. SUBSCRIPTION REQUIREMENTS

Future SaaS requires:

- Subscription
- Plan
- Entitlement
- Usage limits
- Billing
- Renewal
- Cancellation
- Grace period
- Upgrade/downgrade
- Access control

Status:

**NOT IMPLEMENTED / FOUNDATION PARTIAL**

---

# 62. PAYMENT REQUIREMENTS

Commercial payment flow must be:

```text
PAYMENT
 ↓
VERIFY
 ↓
ENTITLEMENT
 ↓
ACCESS
 ↓
DELIVERY
```

Duplicate webhook events must be idempotent.

Payment mismatch must fail safely.

Status:

**PARTIAL**

---

# 63. REFUND REQUIREMENTS

Required lifecycle:

```text
REFUND
 ↓
PAYMENT REFUNDED
 ↓
ENTITLEMENT REVOKED
 ↓
ACCESS REMOVED
 ↓
AUDIT / RECONCILIATION
```

Status:

**PARTIAL**

---

# 64. WORKER REQUIREMENTS

Worker must provide:

- Polling
- Leasing
- Retry
- Failure handling
- Idempotency
- Graceful shutdown
- Health
- Observability

Current repository issue:

> Poll loop is not implemented.

Status:

**PARTIAL / CRITICAL GAP**

---

# 65. DATABASE REQUIREMENTS

There must be exactly one authoritative Prisma schema and migration chain.

Current repository issue:

> Acquisition models exist in the root schema representation but are not aligned with the actual `packages/db/prisma/schema.prisma`.

Status:

**PARTIAL / CRITICAL GAP**

---

# 66. SECURITY REQUIREMENTS

Must support:

- Authentication
- Authorization
- Data isolation
- Secure secrets
- Webhook verification
- Rate limiting
- Input validation
- AI output validation
- Audit logging
- PII protection

Status:

**PARTIAL**

---

# 67. PII REQUIREMENTS

The system must define lifecycle policies for:

- Emails
- Phone numbers
- LinkedIn URLs
- Research
- Conversations
- Prospect records

Policies:

- Retention
- Deletion
- User deletion
- Data minimization
- Access control

Status:

**NOT IMPLEMENTED**

---

# 68. RATE LIMITING

Rate limiting must not blindly trust user-controlled forwarded headers.

Production edge behavior must sanitize/standardize forwarded headers.

Status:

**PARTIAL**

---

# 69. CSP

Current CSP is report-only and contains unsafe-inline.

Requirement:

- Move toward enforced CSP
- Reduce unsafe-inline dependency
- Monitor violations
- Harden before production maturity

Status:

**PARTIAL**

---

# 70. PRODUCTION DEPLOYMENT

Required:

- Production web application
- Production worker
- Production database
- Secrets
- Migrations
- Domain
- HTTPS
- Monitoring
- Health checks
- Rollback process

Status:

**NOT IMPLEMENTED / CRITICAL GAP**

---

# 71. LAYER 4

# REPOSITORY / ARCHITECTURE MAPPING

---

# 72. REPOSITORY PRINCIPLE

The repository contains substantial acquisition-domain logic.

However:

> **Domain logic being implemented does not mean the end-to-end product is operational.**

Therefore all repository mapping must distinguish:

1. Domain logic
2. Application integration
3. Infrastructure
4. Production readiness

---

# 73. ARCHITECTURAL LAYERS

Expected architecture:

```text
                    USER
                     ↓
                    WEB
                     ↓
                   API
                     ↓
              APPLICATION LAYER
                     ↓
        ┌────────────┼─────────────┐
        ↓            ↓             ↓
   DISCOVERY      RESEARCH      OUTREACH
        ↓            ↓             ↓
        └────────────┼─────────────┘
                     ↓
                 OPPORTUNITY
                     ↓
                 PROPOSAL
                     ↓
                  OUTCOME
                     ↓
                  REVENUE
                     ↓
                  ANALYTICS
```

Infrastructure:

```text
API
 ↓
JOB QUEUE
 ↓
WORKER
 ↓
DATABASE
```

---

# 74. REPOSITORY STATUS MATRIX

| Capability                  | Status            |
| --------------------------- | ----------------- |
| Product/domain foundation   | IMPLEMENTED LOGIC |
| Acquisition domain models   | PARTIAL           |
| Research logic              | IMPLEMENTED LOGIC |
| Evidence handling           | IMPLEMENTED LOGIC |
| Opportunity scoring         | IMPLEMENTED LOGIC |
| Offer engine                | IMPLEMENTED LOGIC |
| Next-action engine          | IMPLEMENTED LOGIC |
| Staleness logic             | IMPLEMENTED LOGIC |
| Outreach generation         | IMPLEMENTED LOGIC |
| Outreach verification       | IMPLEMENTED LOGIC |
| Human approval              | IMPLEMENTED LOGIC |
| Follow-up logic             | IMPLEMENTED LOGIC |
| Proposal logic              | IMPLEMENTED LOGIC |
| Proposal versioning         | IMPLEMENTED LOGIC |
| Outcome analytics           | PARTIAL           |
| User identity               | NOT IMPLEMENTED   |
| Production worker           | PARTIAL           |
| Authoritative Prisma schema | PARTIAL           |
| Production deployment       | NOT IMPLEMENTED   |
| SaaS metering               | NOT IMPLEMENTED   |
| SaaS subscription           | NOT IMPLEMENTED   |
| PII lifecycle               | NOT IMPLEMENTED   |
| Full beginner journey       | NOT IMPLEMENTED   |
| Autonomous agents           | FUTURE            |

---

# 75. CURRENT REPOSITORY CRITICAL ISSUES

## F-001 — Paid product access

Priority:

**P0/P1**

Problem:

Paid customers cannot reliably access purchased products end-to-end.

Required:

```text
Payment
 ↓
Entitlement
 ↓
Session/token
 ↓
Access
 ↓
Delivery
 ↓
Email
```

Status:

**PARTIAL**

---

## F-002 — Worker poll loop

Priority:

**P1**

Problem:

Worker poll loop is not implemented.

Required:

- Poll
- Lease
- Process
- Retry
- Fail
- Shutdown
- Health

Status:

**NOT IMPLEMENTED / CRITICAL**

---

## F-003 — Prisma schema mismatch

Priority:

**P1**

Problem:

Acquisition schema representations are inconsistent.

Requirement:

> One authoritative schema and migration chain.

Status:

**PARTIAL / CRITICAL**

---

## F-004 — Refund lifecycle

Priority:

**P1**

Problem:

Refund does not fully revoke access.

Status:

**PARTIAL**

---

## F-005 — Production deployment

Priority:

**P1**

Problem:

Production deployment target is incomplete.

Status:

**NOT IMPLEMENTED**

---

## F-006 — Forwarded-header trust

Priority:

**P2**

Status:

**PARTIAL**

---

## F-007 — CSP

Priority:

**P2**

Status:

**PARTIAL**

---

## F-008 — PII lifecycle

Priority:

**P2**

Status:

**NOT IMPLEMENTED**

---

## F-009 — Documentation

Priority:

**P2**

Problem:

Documentation is behind implementation in areas.

Status:

**PARTIAL**

---

## F-010 — Generated/stale artifacts

Priority:

**P3**

Status:

**PARTIAL**

---

# 76. ARCHITECTURAL PRINCIPLE — PROVIDER ABSTRACTION

Discovery, AI models, communication channels, and external systems should be abstracted behind provider interfaces where appropriate.

This allows:

- Provider replacement
- Cost optimization
- Additional discovery sources
- Model changes
- Reliability improvements

without changing core business logic.

Status:

**PARTIAL**

---

# 77. ARCHITECTURAL PRINCIPLE — DETERMINISTIC CORE

AI should not own deterministic business rules.

Deterministic logic should control:

- State transitions
- Scoring
- Thresholds
- Pricing validation
- Follow-up limits
- Entitlement
- Access
- Idempotency
- Safety stops

AI should provide:

- Research
- Interpretation
- Recommendations
- Draft content

Status:

**IMPLEMENTED PRINCIPLE**

---

# 78. ARCHITECTURAL PRINCIPLE — AI AS UNTRUSTED INPUT

AI output must be treated as untrusted input.

Required:

```text
AI
 ↓
Schema validation
 ↓
Semantic validation
 ↓
Evidence validation
 ↓
Business rules
 ↓
Persistence
```

Status:

**IMPLEMENTED LOGIC**

---

# 79. ARCHITECTURAL PRINCIPLE — IDEMPOTENCY

Critical operations must be idempotent.

Examples:

- Payment webhooks
- Search jobs
- Research jobs
- Outreach
- Follow-ups
- Proposal generation
- Entitlement updates

Status:

**PARTIAL**

---

# 80. ARCHITECTURAL PRINCIPLE — AUDITABILITY

Important AI and commercial actions must be traceable.

Audit should answer:

- What happened?
- When?
- Why?
- Which model?
- Which prompt?
- Which evidence?
- Which user approved it?
- Which version was used?

Status:

**PARTIAL**

---

# 81. LAYER 5

# ACCEPTANCE CRITERIA + RELEASE GATES

---

# 82. FUNCTIONAL ACCEPTANCE CRITERIA

A requirement is accepted only when:

1. The user can trigger it.
2. The system processes it.
3. Result is persisted where appropriate.
4. Errors are handled.
5. Invalid AI output cannot corrupt trusted data.
6. The user receives a meaningful result.
7. The behavior is observable/testable.

---

# 83. CLIENT FINDER MVP ACCEPTANCE TEST

Input:

> “I build websites for restaurants in Mumbai. Minimum project value ₹30,000.”

Expected:

1. Service profile created.
2. Search created.
3. Search enters PENDING.
4. Worker processes search.
5. Businesses discovered.
6. Candidates normalized.
7. Duplicates removed.
8. Businesses researched.
9. Evidence extracted.
10. Needs detected.
11. Opportunities generated.
12. Scores calculated.
13. Prospects ranked.
14. Approximately 20 qualified opportunities returned.
15. User can inspect each prospect.
16. Evidence is visible.
17. User can provide feedback.
18. Search becomes COMPLETE.
19. Failures do not silently produce false results.

---

# 84. PROSPECT QUALITY ACCEPTANCE

A prospect must not be considered qualified solely because:

> “It is a restaurant.”

It must have sufficient evidence of:

- Service fit
- Relevant need
- Business fit
- Evidence quality
- Reachability or another legitimate acquisition basis

---

# 85. EVIDENCE ACCEPTANCE

Every material research claim must be:

- Observed
- Inferred
- Unknown

and appropriately sourced.

The system must reject unsupported claims.

---

# 86. SCORING ACCEPTANCE

The scoring system must:

- Use canonical seven factors
- Respect configured weights
- Apply inference discount
- Apply evidence quality
- Produce deterministic results for the same inputs
- Produce explainable factor contributions

---

# 87. OFFER ACCEPTANCE

If evidence does not support an offer:

> No offer.

The system must never manufacture an opportunity simply to increase result count.

---

# 88. OUTREACH ACCEPTANCE

A generated message must:

- Reference the correct company
- Use supported evidence
- Avoid fabricated facts
- Avoid unsupported numbers
- Avoid placeholders
- Have appropriate length
- Have appropriate CTA
- Pass verification
- Require user approval

---

# 89. FOLLOW-UP ACCEPTANCE

Follow-up must:

- Respect cadence
- Stop after reply
- Stop after unsubscribe
- Stop when paused
- Stop when closed
- Stop after maximum follow-ups
- Never send without required authorization

---

# 90. PROPOSAL ACCEPTANCE

Proposal must:

- Use authoritative pricing
- Preserve versions
- Require approval
- Never overwrite historical versions
- Record proposal state
- Support acceptance/decline

---

# 91. PAYMENT ACCEPTANCE

A successful purchase must result in:

```text
Payment verified
 ↓
Order/payment recorded
 ↓
Entitlement granted
 ↓
Access available
 ↓
Delivery available
```

Duplicate webhook events must not duplicate entitlements.

---

# 92. REFUND ACCEPTANCE

Refund must result in:

```text
Payment REFUNDED
 ↓
Entitlement REVOKED
 ↓
Access REMOVED
 ↓
Audit recorded
```

---

# 93. WORKER ACCEPTANCE

Worker must:

- Poll
- Lease jobs
- Process jobs
- Retry transient failures
- Permanently fail after configured attempts
- Avoid duplicate processing
- Shut down gracefully
- Report health

---

# 94. PRODUCTION ACCEPTANCE

Before production:

- Web deployed
- Worker deployed
- Database deployed
- Migrations tested
- Secrets configured
- HTTPS active
- Monitoring active
- Health checks active
- Rollback documented
- Error reporting active
- Backups verified

---

# 95. USER VALIDATION GATE

The MVP must be tested with approximately:

**50 freelancers/agencies**

Target:

Approximately:

**1,000 recommendations**

---

# 96. MVP METRICS

Track:

### Discovery

- Searches
- Search completion rate

### Opportunity quality

- Good prospect rate
- Not-a-prospect rate
- Evidence completeness
- Average score

### Acquisition

- Contact rate
- Reply rate
- Qualified conversation rate
- Proposal rate
- Win rate

### Economics

- Revenue
- Revenue per user
- Revenue attributed to opportunities

### Retention

- Repeat searches
- Weekly activity
- Monthly activity
- Subscription interest

---

# 97. VALIDATION SIGNALS

Encouraging signals:

- \~70%+ prospects judged useful
- \~50% active users contact at least one prospect
- Real reply-rate baseline established
- At least 3 users report meaningful sales conversations
- Ideally at least 1 attributable client win

These are validation targets, not promises.

---

# 98. FAILURE CONDITIONS

The product should not advance simply because:

- AI output looks impressive
- UI is complete
- Search returns many businesses
- Users like the interface
- Demo prospects look realistic

The product should reconsider the acquisition engine if users repeatedly say:

> **“I could find these businesses myself in 10 minutes.”**

This indicates insufficient differentiated value.

---

# 99. SUBSCRIPTION VALIDATION

Before aggressively scaling SaaS, establish:

1. Users return for new opportunities.
2. Users contact prospects.
3. Users obtain conversations.
4. Some users obtain clients.
5. Users value continuous discovery.
6. Users demonstrate willingness to pay.

The subscription should provide:

> **Continuously useful acquisition capability.**

Not simply:

> **Continued access to software.**

---

# 100. SaaS RETENTION LOOP

The intended recurring loop is:

```text
NEW OPPORTUNITY
      ↓
RESEARCH
      ↓
USER CONTACTS
      ↓
REPLY
      ↓
CONVERSATION
      ↓
PROPOSAL
      ↓
WIN / LOSS
      ↓
REVENUE
      ↓
FEEDBACK
      ↓
BETTER RECOMMENDATIONS
      ↓
NEW OPPORTUNITIES
```

---

# 101. RELEASE PHASING

## Phase 1 — Foundation

Priority:

**P0/P1**

- Paid access
- Refund lifecycle
- Worker
- Prisma schema
- Production deployment

---

## Phase 2 — Client Finder

Priority:

**P1**

- Service profile
- Search
- Discovery
- Normalization
- Deduplication
- Research
- Evidence
- Need detection
- Scoring
- Opportunity
- Results
- Feedback

---

## Phase 3 — Acquisition

Priority:

**P2**

- Outreach
- Follow-ups
- Conversation tracking
- Qualification
- Proposals
- Outcome

---

## Phase 4 — Optimization

Priority:

**P2**

- Analytics
- Revenue feedback
- Ranking improvements
- Offer optimization
- Outreach-angle optimization

---

## Phase 5 — SaaS

Priority:

**FUTURE**

- Subscriptions
- Plans
- Credits
- Metering
- CRM
- Workspaces
- Teams
- Campaigns

---

## Phase 6 — Autonomous Acquisition

Priority:

**FUTURE**

- AI agents
- Automated research
- Automated follow-up
- Automated workflows
- Autonomous optimization

Human approval should remain until sufficient evidence supports greater autonomy.

---

# 102. PRODUCT DEVELOPMENT RULE

Do not build the entire SaaS before validating the acquisition engine.

The correct progression is:

```text
₹99
DISCOVER
 ↓
₹499
BUILD
 ↓
₹1,499
ACQUIRE
 ↓
VALIDATE
 ↓
AUTOMATE REPEATED WORK
 ↓
SAAS
 ↓
SCALE
```

---

# 103. REQUIREMENT TRACEABILITY

Every implementation ticket must map to:

```text
Requirement ID
      ↓
User Story
      ↓
Acceptance Criteria
      ↓
Domain Logic
      ↓
API
      ↓
Database
      ↓
UI
      ↓
AI Behavior
      ↓
Tests
      ↓
Production Status
```

No major feature should be considered complete without traceability.

---

# 104. STATUS DEFINITIONS

## IMPLEMENTED LOGIC

The core domain/business logic exists and can be tested.

It does not necessarily mean:

- API connected
- UI connected
- Worker operational
- Production deployed

---

## PARTIAL

Some components exist but the complete user journey does not work.

---

## NOT IMPLEMENTED

The requirement is defined but no meaningful implementation exists.

---

## FUTURE

The requirement is intentionally deferred.

It should not be pulled into the current release unless the product stage changes.

---

# 105. CURRENT STAGE

## STAGE 6 — CLIENT FINDER MVP / PRE-IMPLEMENTATION

Current state:

**Foundation exists.**

**Product MVP is not yet operational end-to-end.**

Current objective:

> Build and validate the Client Finder opportunity engine.

---

# 106. IMMEDIATE NEXT ACTIONS

Priority order:

### P0

1. Paid product access
2. Refund/access revocation

### P1 Foundation

3. Worker poll loop
4. Authoritative Prisma schema
5. Migration chain
6. Production deployment

### P1 Client Finder

7. ServiceProfile
8. Search API
9. Discovery provider
10. Candidate normalization
11. Deduplication
12. Prospect persistence
13. Research
14. Evidence
15. Need detection
16. Offer engine
17. Scoring
18. Opportunity generation
19. Results UI
20. Prospect detail
21. Feedback

---

# 107. WHAT MUST NOT BE BUILT YET

Unless validation requires it:

- Full CRM
- Autonomous outreach
- Large-scale scraping
- Complex campaign management
- Full team management
- Enterprise controls
- Advanced AI agents
- Large-scale infrastructure
- Elaborate analytics
- Full SaaS billing optimization

---

# 108. FINAL PRODUCT DEFINITION

The product should ultimately answer:

> **“I want to make money with AI. What should I sell, who should I sell it to, what should I offer them, what should I say, and what should I do next?”**

The product journey is:

```text
MAKE MONEY WITH AI
        ↓
DISCOVER
        ↓
BUILD
        ↓
FIND
        ↓
RESEARCH
        ↓
QUALIFY
        ↓
PERSONALIZE
        ↓
CONTACT
        ↓
FOLLOW UP
        ↓
CONVERSATION
        ↓
PROPOSAL
        ↓
CLOSE
        ↓
FIRST CLIENT
        ↓
REVENUE
        ↓
LEARN
        ↓
REPEAT
```

---

# 109. FINAL STRATEGIC PRINCIPLE

The product should not optimize for:

> **More features.**

It should optimize for:

> **More users successfully moving from intention → action → conversation → customer.**

The first product proof is:

> **“Would I contact this prospect?”**

The next proof is:

> **“Did they reply?”**

Then:

> **“Did I get a conversation?”**

Then:

> **“Did I win?”**

Ultimately:

> **“Does this system consistently help me acquire customers?”**

That is the foundation of the AI Client Acquisition OS.

---

# 110. MASTER DECISION

The product vision remains broad:

> **MAKE MONEY WITH AI**

The complete user journey remains:

> **DISCOVER → BUILD → ACQUIRE → EARN**

The core acquisition engine remains:

> **FIND → RESEARCH → QUALIFY → PERSONALIZE → CONTACT → FOLLOW UP → PROPOSE → CLOSE → LEARN**

The current engineering focus remains:

> **CLIENT FINDER MVP**

The current validation objective remains:

> **Prove that AI can reliably identify businesses that genuinely need what a user sells.**

Only after this evidence is established should the system expand aggressively into:

> **SaaS → Automation → AI Agents → Scale**

---

# APPENDIX A — MASTER FEATURE STATUS

| Feature                  | Status            | Current Priority |
| ------------------------ | ----------------- | ---------------: |
| Make Money With AI entry | PARTIAL           |               P1 |
| Income discovery         | NOT IMPLEMENTED   |               P1 |
| Service selection        | PARTIAL           |               P1 |
| Guided service build     | NOT IMPLEMENTED   |               P2 |
| Proof/portfolio builder  | NOT IMPLEMENTED   |               P2 |
| ServiceProfile           | PARTIAL           |               P1 |
| Client search            | PARTIAL           |               P1 |
| Discovery provider       | PARTIAL           |               P1 |
| Candidate normalization  | PARTIAL           |               P1 |
| Deduplication            | PARTIAL           |               P1 |
| Research                 | IMPLEMENTED LOGIC |               P1 |
| Evidence                 | IMPLEMENTED LOGIC |               P1 |
| Signal freshness         | IMPLEMENTED LOGIC |               P1 |
| Need detection           | IMPLEMENTED LOGIC |               P1 |
| Offer engine             | IMPLEMENTED LOGIC |               P1 |
| Seven-factor scoring     | IMPLEMENTED LOGIC |               P1 |
| Inference discount       | IMPLEMENTED LOGIC |               P1 |
| Opportunity generation   | IMPLEMENTED LOGIC |               P1 |
| Next-action engine       | IMPLEMENTED LOGIC |               P1 |
| Staleness                | IMPLEMENTED LOGIC |               P1 |
| Prospect state machine   | IMPLEMENTED LOGIC |               P1 |
| Outreach generation      | IMPLEMENTED LOGIC |               P2 |
| Outreach verification    | IMPLEMENTED LOGIC |               P2 |
| Human approval           | IMPLEMENTED LOGIC |               P2 |
| Follow-up cadence        | IMPLEMENTED LOGIC |               P2 |
| Safety stops             | IMPLEMENTED LOGIC |               P2 |
| Conversation management  | PARTIAL           |               P2 |
| Qualification            | PARTIAL           |               P2 |
| Proposal versioning      | IMPLEMENTED LOGIC |               P2 |
| Authoritative pricing    | IMPLEMENTED LOGIC |               P2 |
| Closing                  | PARTIAL           |               P2 |
| Outcome tracking         | PARTIAL           |               P2 |
| Revenue feedback         | PARTIAL           |               P2 |
| Dashboard                | PARTIAL           |               P2 |
| Track analytics          | PARTIAL           |               P2 |
| Improve analytics        | PARTIAL           |               P2 |
| User identity            | NOT IMPLEMENTED   |               P1 |
| Worker                   | PARTIAL           |               P1 |
| Prisma authority         | PARTIAL           |               P1 |
| Production deployment    | NOT IMPLEMENTED   |               P1 |
| Payment entitlement      | PARTIAL           |               P0 |
| Refund revocation        | PARTIAL           |               P0 |
| PII lifecycle            | NOT IMPLEMENTED   |               P2 |
| AI cost metering         | PARTIAL           |               P2 |
| SaaS subscriptions       | NOT IMPLEMENTED   |           FUTURE |
| Usage quotas             | NOT IMPLEMENTED   |           FUTURE |
| CRM                      | FUTURE            |           FUTURE |
| Teams/workspaces         | FUTURE            |           FUTURE |
| Autonomous agents        | FUTURE            |           FUTURE |
| Large-scale acquisition  | FUTURE            |           FUTURE |

---

# APPENDIX B — PRODUCT NORTH STAR

> **From “I want to make money with AI” to “I have a paying customer.”**

The system should progressively reduce the amount of uncertainty, research, preparation, and repetitive work required to reach that outcome.

The long-term moat is:

> **Discovery → Need Detection → Qualification → Personalization → Outreach → Outcome Feedback → Better Discovery**

---

# APPENDIX C — RELEASE PRINCIPLE

**Do not declare the release complete because the software works.**

Declare it successful only when:

> **Real users find the opportunities valuable enough to act on them, and evidence begins to show that those actions can create genuine sales conversations and customers.**
