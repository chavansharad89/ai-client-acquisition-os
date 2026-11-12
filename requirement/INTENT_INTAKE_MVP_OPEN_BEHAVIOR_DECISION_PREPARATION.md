# INTENT INTAKE MVP

## Open Intake Behaviors — Product Owner Decision Preparation

**Decision ID (reserved):** INTENT-INTAKE-PO-DEC-002
**Status:** **PENDING PRODUCT OWNER DECISION**
**Raised by:** INTENT-INTAKE-IMPL-REVIEW-001 §5 (items A and C). They were carried into the "Intent Intake MVP —
Implementation Authorization" (2026-09-30), which does not resolve them. Under its §1 and §14 the implementation is
stopped.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Implementation fingerprint** (`git diff HEAD --binary`, excl. `requirement/`):
`bbcfc90feeab4d23f91139ce0148414d9f7c4572b265fc43fcdf0dcd9d0f836b`
**Records referenced, unchanged:**

| Record | sha256 |
|---|---|
| INTENT-INTAKE-PO-DEC-001 | `52ee6164…7407` |
| Preparation record | `90d924c3…15f1` |
| Implementation record | `f1ab2804…d4a9` |
| Review record | `27c534d5…f89a` |

**Relation to other tracks:** Separate from Path 2 / P8 / D11. The §9.8 stop remains in force.

```text
INTENT-INTAKE-PO-DEC-002 .. PENDING — 2 DECISIONS (E1, E2), OPTIONS UNRANKED
IMPLEMENTATION ............ STOPPED — NO CODE CHANGED UNDER THE 2026-09-30 AUTHORIZATION
```

---

## 1. Why these need a decision

D1–D5 are implemented and pass review (INTENT-INTAKE-IMPL-REVIEW-001 §2). The two behaviors below exist in the
current code, but no decision covers them. The implementation authorization forbids choosing product behavior by
inference (§1, §14: "a required product behavior not covered by D1–D5").

## 2. E1 — Intake for a Prospect that already has an Opportunity

**Current behavior (fact):**
- `runPostResearchPipelineForOwner` (`apps/worker/src/searchWorker/worker.ts`) keeps the pre-existing find-or-create:
  if an Opportunity exists, it is reused and not re-created.
- `needDetected` and the offer are computed only at creation (`createOpportunityForOwner` → `suggestOffers`).
- An intake signal on such a Prospect is persisted, scored and qualified, but it can never change `needDetected` or
  the offer, even when the ServiceProfile has opted in (D3).

**Insufficient decisions:**
- D3 restricts contribution ("may contribute … only when") but does not guarantee it.
- D4 covers only Prospects without a CATEGORY_PLAUSIBLE determination.

**Options (unranked):**
- **A — Accept the current behavior.** Intake on an existing Opportunity affects scoring and qualification only.
- **B — Re-evaluate the offer on intake.** Recompute `needDetected` and the offer with the unchanged `suggestOffers()`
  when an intake signal is added to a Prospect that already has an Opportunity. This changes when an existing
  Opportunity's offer fields can change.
- **C — Reject intake for such a Prospect.** Intake is allowed only when the Prospect has no Opportunity yet.
- **Other** — the Product Owner's exact rule.

## 3. E2 — Search status accepted by intake

**Current behavior (fact):** `recordIntentSignalForOwner` (`apps/worker/src/searchWorker/intentIntake.ts`) requires only
an existing, caller-owned Search. It accepts any status: PENDING, RUNNING, COMPLETE, FAILED or CANCELLED. No decision
authorized this; it was an implementation choice.

**Insufficient decisions:** G2 / D4 require only "an existing Search".

**Options (unranked):**
- **A — Accept any status** (the current behavior).
- **B — Restrict to named statuses.** The Product Owner supplies the exact allowed set; any other status is rejected.
- **Other** — the Product Owner's exact rule.

## 4. Technical gap noted (no product decision needed)

The authorization's §9 asks the intake interface to accept "one or more supported intent signals" per intake event.
The current `recordIntentSignalForOwner` accepts exactly one signal per call. Multiple calls are supported and
deduplicate to one Prospect and one Opportunity.

Accepting a list of signals in one call is an interface change inside the existing authorization. It was **not** made,
because the implementation stopped on E1 and E2 before any change.

## 5. Execution counters (this preparation)

```text
Anthropic API calls: 0
Google API calls: 0
Gemini API calls: 0
Claude consumer calls: 0
Live-source fetches: 0
Participant contacts: 0
Validation sessions: 0
Searches submitted: 0
Manual retries: 0
Database writes against validation environment: 0
Migrations executed against validation environment: 0
Production code changes: 0
Schema changes: 0
```

Files created: this record only. Files modified: none.
