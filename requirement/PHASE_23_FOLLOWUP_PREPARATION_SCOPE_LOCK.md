# Phase 23 — Follow-Up Preparation — Scope Lock

**Status:** PROPOSED — NOT YET APPROVED FOR IMPLEMENTATION
**Source Authority:** `MVP_SCOPE_BOUNDARY.md` §11 — follow-up capability
**Baseline:** `c33cef7` — Phase 22 CLOSED
**Frozen:** Phases 18, 19, 20, 21, and 22
**Primary Boundary:** Prepare follow-up actions/content only. No sending, scheduling, delivery, CRM, or channel execution.

---

## 1. Purpose

Phase 23 proposes the next additive capability after Phase 22's Outreach Preparation stage: **Follow-Up Preparation**.

The phase would consume already-persisted outreach-preparation and pipeline evidence and produce a deterministic, persisted follow-up preparation artifact.

The objective is to make the system capable of determining:

- whether a follow-up preparation is applicable;
- what follow-up context should be used;
- what evidence supports the follow-up;
- what follow-up draft/action should be prepared;
- when human review would be required.

The phase does not execute the follow-up.

---

## 2. Pipeline Position

The proposed pipeline becomes:

```text
Discovery
    ↓
Research
    ↓
Opportunity
    ↓
Qualification
    ↓
Personalization
    ↓
Outreach Preparation
    ↓
Follow-Up Preparation
    ↓
HUMAN REVIEW / STOP
```

Phase 23 must not alter the behavior or contracts of Phases 18–22.

Follow-Up Preparation may execute only when the preceding Outreach Preparation artifact exists and is eligible.

---

## 3. New Requirements

Because the repository currently has no authoritative R-61+ definitions, the following identifiers are **Phase 23 proposal IDs**, not existing PRD requirements.

### R-61 — Follow-Up Preparation Input

The system SHALL accept only already-persisted pipeline artifacts as inputs.

Minimum required upstream context:

- Opportunity
- Qualification
- Personalization
- Outreach Preparation

The follow-up layer SHALL NOT independently rediscover prospects or perform new discovery/research.

### R-62 — Follow-Up Eligibility

The system SHALL deterministically determine whether a follow-up preparation artifact may be created.

Eligibility SHALL require the relevant upstream preparation state to exist.

A missing or ineligible upstream artifact SHALL result in no follow-up preparation being created.

No fallback follow-up may be generated from incomplete upstream state.

### R-63 — Evidence Provenance

Any follow-up preparation SHALL preserve provenance to the evidence already established by the upstream pipeline.

The phase SHALL NOT invent prospect evidence.

Follow-up evidence should reference existing persisted evidence rather than creating a second, independent evidence-selection system.

### R-64 — Follow-Up Draft Generation

The system SHALL generate a deterministic follow-up preparation artifact containing, at minimum:

- follow-up context;
- proposed follow-up content/action;
- supporting evidence references;
- preparation state;
- rationale sufficient for human review.

The initial implementation SHALL NOT require an LLM unless separately authorized.

### R-65 — Persistence

Follow-up preparation SHALL be persisted independently from the existing Outreach Preparation record.

The persistence model SHALL provide:

- one current follow-up preparation per applicable upstream entity;
- deterministic re-evaluation;
- idempotent persistence;
- ownership inherited through the existing Opportunity ownership chain where applicable.

Existing ResearchSignal, Opportunity, Qualification, Personalization, and Outreach Preparation rows SHALL NOT be mutated.

### R-66 — Pipeline Integration

The worker SHALL invoke Follow-Up Preparation only after successful completion/availability of the required Outreach Preparation stage.

The ordering SHALL be structurally enforced:

```text
Outreach Preparation
        ↓
Follow-Up Preparation
```

Follow-Up Preparation must never execute before Outreach Preparation.

### R-67 — Human Review Boundary

Follow-Up Preparation SHALL terminate at a reviewable preparation state.

The system may produce a proposed follow-up, but it SHALL NOT execute it.

### R-68 — No-Send / No-Execution

Phase 23 SHALL NOT contain or invoke:

- email sending;
- messaging;
- WhatsApp/SMS delivery;
- social-channel delivery;
- scheduling;
- queued delivery;
- automatic dispatch;
- channel-provider invocation;
- delivery-status mutation;
- sent-status mutation.

There SHALL be no transition to:

```text
SENT
SCHEDULED
DELIVERED
```

The output must remain a preparation/review state.

### R-69 — Idempotency and Failure Isolation

Repeated processing of the same eligible input SHALL produce one current follow-up preparation artifact rather than uncontrolled duplicates.

A Follow-Up Preparation failure SHALL NOT mutate or invalidate:

- Opportunity;
- Qualification;
- Personalization;
- Outreach Preparation.

The worker SHALL preserve the established upstream pipeline results.

---

## 4. Explicitly In Scope

**Core capability**

- Follow-Up Preparation domain/package
- deterministic eligibility evaluation
- deterministic follow-up preparation
- evidence references
- persistence
- idempotency
- ownership inheritance
- worker integration after Outreach Preparation
- unit tests
- real-Postgres integration tests
- pipeline ordering tests
- failure-isolation tests
- no-send structural tests
- scope-lock and closure documentation

**Data**

A new persistence model may be introduced for Follow-Up Preparation if required by the implementation.

It must follow existing repository conventions for:

- ownership;
- foreign keys;
- uniqueness;
- migrations;
- repositories;
- test fakes;
- Postgres implementations.

---

## 5. Explicitly Out of Scope

The following are not Phase 23:

**Outreach execution**

- sending;
- delivery;
- scheduling;
- channel selection for actual delivery;
- provider integration;
- email APIs;
- WhatsApp APIs;
- SMS APIs;
- social messaging APIs.

**CRM**

- CRM records;
- CRM synchronization;
- contact management;
- pipeline CRM stages;
- external CRM integrations.

**Autonomous follow-up**

- automatic follow-up execution;
- automatic scheduling;
- automatic retrying of messages;
- autonomous channel selection;
- autonomous escalation.

**Other product capabilities**

- proposal generation/execution;
- subscription/billing;
- analytics dashboards unrelated to follow-up preparation;
- new Discovery behavior;
- new Research behavior;
- Opportunity scoring changes;
- Qualification rule changes;
- Personalization rule changes.

---

## 6. Frozen Phase Boundaries

Phase 23 SHALL NOT modify the implementation contracts of:

```text
Phase 18 — Provider Execution
Phase 19 — Provider Robustness / Service Profile Contract
Phase 20 — Qualification
Phase 21 — Personalization
Phase 22 — Outreach Preparation
```

Their scope-locks and closure documents remain authoritative and unchanged.

Any required integration must be additive at the Phase 23 boundary.

---

## 7. Existing Outreach Boundary

Phase 22 established:

```text
Outreach Preparation
        ↓
PREPARED / READY_FOR_REVIEW
        ↓
       STOP
```

Phase 23 must preserve this principle.

If Follow-Up Preparation consumes an Outreach Preparation artifact, it consumes the persisted preparation, not an executable outreach operation.

No Phase 23 code may revive or wire the pre-existing `core-outreach` sending infrastructure.

---

## 8. Dependencies

Phase 23 depends on the existence of:

1. Opportunity
2. Qualification
3. Personalization
4. Outreach Preparation
5. existing worker orchestration
6. existing ownership model
7. existing Postgres migration/repository conventions

The phase must reuse existing contracts rather than duplicate:

- research;
- evidence discovery;
- qualification;
- personalization;
- outreach preparation.

---

## 9. Acceptance Criteria

Phase 23 may be considered implementation-complete only when all applicable criteria below are demonstrated.

- **AC-01 — Input Boundary**: A follow-up preparation can be created only from persisted upstream pipeline state.
- **AC-02 — Eligibility**: Ineligible or missing upstream state produces no follow-up preparation.
- **AC-03 — Evidence**: Every follow-up evidence reference resolves to existing persisted evidence. No fabricated prospect evidence is permitted.
- **AC-04 — Persistence**: A valid follow-up preparation is persisted and can be retrieved by its owning Opportunity.
- **AC-05 — Idempotency**: Repeated evaluation of identical eligible input does not create uncontrolled duplicate current records.
- **AC-06 — Pipeline Ordering**: Worker tests prove `Outreach Preparation → Follow-Up Preparation` and prove Follow-Up Preparation cannot execute before Outreach Preparation.
- **AC-07 — Failure Isolation**: A Follow-Up Preparation failure does not corrupt or remove the upstream Opportunity, Qualification, Personalization, or Outreach Preparation state.
- **AC-08 — No Send**: Tests and code inspection demonstrate that Follow-Up Preparation cannot send; schedule; deliver; invoke a transport; enter a sent/delivered state.
- **AC-09 — Frozen Boundary**: Diff inspection proves there are no modifications to Phase 18–22 domain implementations or their closure documents.
- **AC-10 — Repository Validation**: Before closure — targeted unit tests PASS; worker tests PASS; integration tests PASS; repo-wide typecheck PASS; repo-wide tests PASS; `git diff --check` PASS.

Where real infrastructure is required, validation must be executed against that infrastructure rather than mocked and represented as real evidence.

---

## 10. Validation Evidence

The closure package should contain evidence for:

**Unit level**

- eligibility;
- generation;
- evidence provenance;
- persistence behavior;
- idempotency;
- invalid-input handling;
- no-send behavior.

**Worker level**

- correct ordering;
- eligibility gating;
- failure isolation;
- repeated execution.

**Database level** (against real PostgreSQL)

- migration applies;
- records persist;
- ownership chain works;
- uniqueness/idempotency works;
- invalid states are rejected where applicable.

**Repository level**

```bash
pnpm run typecheck
pnpm run test
```

plus the complete integration suite where infrastructure is available.

---

## 11. No-Send Verification Gate

This is a mandatory Phase 23 gate.

The implementation must demonstrate that:

```text
Follow-Up Preparation
        ↓
Prepared Review Artifact
        ↓
STOP
```

A structural review must confirm:

- no transport dependency;
- no provider/channel invocation;
- no `send()` operation;
- no scheduling operation;
- no delivery operation;
- no `SENT`/`DELIVERED` transition;
- no automatic dispatch path.

A runtime test should poison/disable external transport and prove the complete preparation path performs zero transport calls.

---

## 12. Scope-Lock Approval Gate

This document is a proposal, not authorization to implement.

Implementation may begin only after the Phase 23 scope is explicitly approved.

Approval must preserve:

```text
Phase 18 = CLOSED
Phase 19 = CLOSED
Phase 20 = CLOSED
Phase 21 = CLOSED
Phase 22 = CLOSED
```

and the no-send constraint.

---

## 13. Closure Gate

Phase 23 can be marked `PASS / CLOSED` only when all of the following are true:

1. Every approved R-61–R-69 requirement is either implemented or explicitly recorded as an approved limitation.
2. All acceptance criteria pass.
3. Unit tests pass.
4. Worker tests pass.
5. Real-Postgres integration tests pass where applicable.
6. Repository-wide typecheck passes.
7. Repository-wide tests pass.
8. No-send verification passes.
9. Phase 18–22 boundary audit is clean.
10. `git diff --check` is clean.
11. Only intended Phase 23 files are staged.
12. The Phase 23 implementation is committed.
13. `git rev-parse HEAD` confirms the closure commit.
14. Working-tree verification confirms no unrelated files were staged or modified.
15. A Phase 23 closure document records the actual validation evidence.

Only after these conditions may Phase 23 be considered CLOSED / FROZEN.

---

## 14. Current Decision

```text
PHASE 23: PROPOSED

Authority:
MVP_SCOPE_BOUNDARY.md §11

Capability:
Follow-Up Preparation

Implementation:
NOT AUTHORIZED YET

Send:
PROHIBITED

Scheduling:
PROHIBITED

Delivery:
PROHIBITED

CRM:
OUT OF SCOPE

Phase 18:
CLOSED / FROZEN

Phase 19:
CLOSED / FROZEN

Phase 20:
CLOSED / FROZEN

Phase 21:
CLOSED / FROZEN

Phase 22:
CLOSED / FROZEN
```

Next gate: explicit approval of this Phase 23 proposal before implementation.
