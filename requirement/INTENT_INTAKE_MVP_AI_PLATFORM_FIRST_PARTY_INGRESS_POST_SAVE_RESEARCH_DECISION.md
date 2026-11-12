# Intent Intake MVP

## AI-Platform FIRST_PARTY — OD-13 Ingress (Alternative I) — Post-Save Research Behavior — Product Owner Decision

**Decision ID:** INTENT-INTAKE-OD13-POSTSAVE-DEC-001
**Date:** 2026-09-30
**Type:** Product Owner decision (behavior only; no execution authority)
**Decides:** INTENT-INTAKE-OD13-POSTSAVE-PREP-001
(`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_INGRESS_POST_SAVE_RESEARCH_DECISION_PREPARATION.md`,
sha256 `7f857d0e9a1dcd94bae768b8b958ea15a15757e75ea6562aeb57483e89c650d4`), PS-1 to PS-8
**Decision maker:** Product Owner (delegated authority, as for OD-1..OD-13 and INTENT-INTAKE-OD13-INGRESS-DEC-001)
**Convention:** separate decision file; the preparation record is left unchanged. Facts F1–F17 and the unranked
options remain in the preparation record; §3 below holds the decisions only. Option letters are exactly those of the
preparation record.

```text
Decision status: DECIDED
PS-1 .. PS-8: DECIDED
Earlier decisions reopened: NONE
Implementation authorization: NONE
Provider-call authorization: NONE
Runtime-wiring authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Deployment authority: NONE
OD-13 runtime gate: IN FORCE
```

---

## 1. Baseline re-verified before deciding

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = PREP §1 |
| Staged files | 0 | = PREP §1 |
| Working-tree entries | 239 | 238 + PREP |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` | = PREP §1 |
| PREP (INTENT-INTAKE-OD13-POSTSAVE-PREP-001) | `7f857d0e9a1dcd94bae768b8b958ea15a15757e75ea6562aeb57483e89c650d4` | unchanged since creation |
| Alternative I decision (DEC-001) | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` | = PREP §1.1 |
| Alternative I implementation record | `8a89e582533180fdd93d18799658ed2fa150cf3717e561cbb0c434f278c7f6c0` | = PREP §1.1 |
| Evidence contract design rev. 2 (OD-1..OD-12) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` | = PREP §1.1 |
| Intent Intake PO decision (D1..D5) | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` | = PREP §1.1 |
| OD-13 mechanism prep + decision | `9b50e6cfd9ced1b007ae899c3b1dc53271c2009035f868d6a9e19941dcb15b8d` | = DEC-001 §1.1 |

## 2. Governing decisions applied (not reopened)

- **IG-2:** P3 is `recordIntentIntakeForOwner`, executed unchanged in the `apps/web` process.
- **IG-3:** synchronous, unchanged — the push runs P3 including its inline Research step and
  `runPostResearchPipelineForOwner`; no deferral, queue, hand-off record or background mechanism; no automatic retry
  by this system; any Research provider call needs its own provider-call authorization.
- **IG-4:** `200` "Saved (P3 completed)"; `401` authenticity; `400` validation / ownership (nothing saved);
  `500` unexpected error; bodies carry no detail.
- **OD-8 items 1–2:** one transaction for all signal + source rows of an event; Company / Prospect and the downstream
  Research / post-research pipeline stay outside; "a failure there leaves the committed signals, as today."
- **OD-11:** redacted `@acos/observability` Logger; no rejection table.
- **OD-12 items 1–3:** no automatic retry; retry is a new operator-initiated submission re-validated in full; no
  deduplication; duplicates accepted as a known limitation.
- **D4 (Option A):** intake Prospects run the existing Research path, then the existing post-research sequence.
- **OD-13 §13.6 / Q9 / DEC-005:** separate authorizations for naming + key registration, runtime wiring, provider
  calls, validation, deployment; no persistence of payloads or verification outcomes.

## 3. Product Owner decisions

### PS-1 — Successful acceptance of the push — **DECIDED: Option B**

Acceptance is the **return of `recordIntentIntakeForOwner`**: OD-8 signal commit **and** the Research step (run or
skipped per D4) **and** `runPostResearchPipelineForOwner`. "Saved (P3 completed)" in IG-4 is read with *P3 completed*
governing, P3 being `recordIntentIntakeForOwner` (IG-2). This is the current behavior (F10).

- **Scope:** the acceptance event only; it does not change what is persisted (PS-3).
- **Reopens:** nothing.

### PS-2 — HTTP outcome when signals committed and Research then fails — **DECIDED: Option A**

`500 {"error":"Internal error"}`, the IG-4 "unexpected error" row (current behavior, F9). The body carries no
detail; the log carries no evidence values (OD-11; IG-4).

- **Scope:** HTTP response behavior only.
- **Reopens:** nothing.

### PS-3 — Validity of committed signals when Research fails afterwards — **DECIDED: Option A**

The committed signal and source rows **remain as committed** (OD-8 item 2). They are not removed, not rolled back and
not marked.

- **Scope:** signal persistence only.
- **Database/state:** no marker, status, delete path or transaction-boundary change is introduced. Options B and C
  are not selected; either would require separate database / schema / implementation authorization and (B) reopening
  OD-8 item 2.
- **Reopens:** nothing.

### PS-4 — Automatic retry of Research — **DECIDED: Option A**

**No automatic retry** by this system (IG-3; OD-12 item 1 read-across). A re-push by the integration is a new
submission, re-verified and re-validated in full (OD-12 item 2; IG-4).

- **Scope:** later / retry research within this system only.
- **Reopens:** nothing. No retry record is introduced.

### PS-5 — Synchronous vs deferred Research — **DECIDED: Option A**

**Synchronous, as IG-3 decided.** Research runs inline in the push request whenever the Prospect has no current
CATEGORY_PLAUSIBLE determination (D4). Option C (skip Research) is not selected; D4 stands.

- **Scope:** Research execution timing only.
- **Reopens:** nothing.

### PS-6 — Deferral mechanism — **DECIDED: Option A**

**None — deferral is not allowed** (follows PS-5 A). No queue, outbox, hand-off record or background mechanism is
introduced. The observed re-entry of Research on a later push (F16) is **not** adopted as a designed deferral
mechanism (Option B not selected); it remains only a consequence of PS-4 A and OD-12 item 2.

- **Reopens:** nothing (R-34, OD-13 Q9 and DEC-005 unaffected).

### PS-7 — Reopening of earlier rules — **DECIDED**

Per the PREP §5 PS-7 map, the combination PS-1 B, PS-2 A, PS-3 A, PS-4 A, PS-5 A, PS-6 A touches **no** earlier
record. IG-3, IG-4, OD-8, OD-11, OD-12, D4, OD-13 Q1..Q12, X1, C-1, IA-1 and DEC-005 are **unchanged**.

### PS-8 — Failures after the Research step — **DECIDED: Option A**

**Any failure after the OD-8 signal commit** — in the Research step or in `runPostResearchPipelineForOwner` (F11) — is
treated the same way: signals remain committed (PS-3 A), no retry (PS-4 A), `500 {"error":"Internal error"}`
(PS-2 A), acceptance not reached (PS-1 B).

- **Scope:** failures after the signal commit only. Failures before the commit keep their IG-4 mapping (`400` for
  validation / ownership, `500` otherwise), with nothing saved (OD-8 item 1).
- **Reopens:** nothing.

## 4. Consequences accepted (recorded, not reopening anything)

1. **While provider-call authority is NONE**, the ingress wires the not-configured Research provider (F5–F7).
   Every push whose Prospect has no current CATEGORY_PLAUSIBLE determination therefore commits its signals and
   returns `500` (F8). This is accepted as the decided behavior, not as a defect to be fixed under this decision.
2. A re-push after such a `500` commits the signals again as a new submission; the duplicates are the accepted
   OD-12 item 3 limitation.
3. A successful post-save path for such Prospects requires an actual Research provider on this path.

## 5. Dependencies (separate authorizations; none granted)

| Area | What remains required |
|---|---|
| Provider calls | A **separate provider-call authorization** is required before the ingress Research step may reach any actual research provider (IG-3; OD-13 §13.6 item 4). This decision authorizes none and does not select a provider. |
| Implementation | The current code already conforms to PS-1..PS-8 (F9, F10, OD-8 transaction). This decision specifies **no** code change. Any future change (e.g. provider wiring on this path, or a test pinning the post-commit `500`) needs its own implementation authorization. |
| Database / schema | None required by the selected options. Marking signals, changing persistence state, adding a status, retry record, queue / outbox, or changing transaction boundaries would each need separate database / schema / implementation authorization. |
| Runtime | Runtime wiring (OD-13 §13.6 item 3), integration naming, public-key and owner/search registration (item 2), the outstanding DB-backed run (audit item 12), validation and deployment remain separately required. |

## 6. What this decision does not do

It decides PS-1..PS-8 only. It does **not** authorize: implementation; provider calls (including Research); external
HTTP; database connections or writes; schema or migration changes; configuration changes; runtime wiring or ingress
activation; integration naming; public-key or owner/search registration; validation; deployment; commits. It does not
modify the preparation record, DEC-001 or the implementation record.

## 7. Final state

```text
Decision status: DECIDED
PS-1 B · PS-2 A · PS-3 A · PS-4 A · PS-5 A · PS-6 A · PS-7 (no reopening) · PS-8 A
Earlier decisions reopened: NONE
Implementation authorization: NONE
Provider-call authorization: NONE
Runtime-wiring authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Deployment authority: NONE
OD-13 runtime gate: IN FORCE
```

## 8. Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0 (preparation record unchanged)
Production files changed: 0
Test files changed: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring: 0
Integration naming: 0
Key registration: 0
Validation: 0
Deployment: 0
Commits: 0
```

**INTENT-INTAKE-OD13-POSTSAVE-DEC-001 — DECIDED — NO REOPENING — NO EXECUTION AUTHORITY — OD-13 RUNTIME WIRING: NOT AUTHORIZED / GATE IN FORCE**
