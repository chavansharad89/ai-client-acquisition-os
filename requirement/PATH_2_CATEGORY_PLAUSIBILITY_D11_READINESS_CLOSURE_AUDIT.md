# Path 2 — Category Plausibility

## D11 Readiness Closure Audit (Read-Only)

**Audit ID:** D11-RC-AUDIT-001
**Date:** 2026-09-28
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Authority granted by this record:** NONE

```text
D11 ....................... NOT READY FOR LIVE VALIDATION
Unmet READY blockers ...... 1 (D11-I — funded, working provider account)
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

---

### 1. Purpose and Scope

This audit establishes the complete set of prerequisites that remain before D11 can move from
**NOT READY FOR LIVE VALIDATION** to **READY FOR LIVE VALIDATION**. It is read-only. It changes no
code, test, configuration or governance record. It resolves no blocker, reopens no decided item,
and grants no authority.

**Timing classes used in this record:**

| Code | Meaning |
|---|---|
| **R** | Required before D11 can be classified READY (Gate Audit §13 blocking set, or a D11 text precondition to scheduling) |
| **S** | Required before a session is scheduled or held, alongside or after READY (Gate Audit §11, VS-PO-DEC-001 §4) |
| **IN** | Required during the D11 session (observed or recorded live) |
| **SO** | Required for full D11 sign-off only |
| **A11** | Required only for A-11 / E1 / E2 / E3 closure |
| **FU** | Follow-up / non-blocking |
| **MET** | Satisfied on current evidence |

**Blocker types:** 1 governance decision; 2 implementation authorization; 3 test/conformance
work; 4 environment/provider readiness; 5 live-session authorization; 6 evidence collection.

**Authority rule applied:** a Product Owner decision or a governing specification (F-1, F1-D, D9,
D11) outranks an audit. Where only audits speak (for example, Gate Audit §11), the item is marked
**audit-derived**. Audit-derived items are not upgraded to authoritative, and they are not dropped.
P4-PO-DEC-001, G6-PO-DEC-001 and G7-PO-DEC-001 are applied as decided and not reopened.

---

### 2. Baseline Repository State

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --short ........ 145 lines
Tracked diff sha1 ......... aeb3338ea2887bb826211d1e73ae82ac4066ff31
apps/web/tsconfig.tsbuildinfo  pre-existing " M", sha256 1834209e…de71d09
requirement/*.md .......... 96 files, all hashed, stored outside the repository
This record ............... absent before writing
```

The F-1, M-2 and Q-1 implementations, migrations 0027/0028 and the G-7 adapter tests exist only as
uncommitted working-tree changes on top of HEAD.

No `.env` or credential file was read. No test, typecheck, build, browser, provider, Docker or
Postgres command was run. Test results below are taken from existing records.

---

### 3. Authoritative Sources Reviewed

| Record | Type | Sections used |
|---|---|---|
| `…_D11_PRODUCT_DECISION.md` (D11) | Product decision | §1, §2 (D11-A–I), §3, §4, §6, §7, §8, §9, §10, §11 |
| `…_F1_EVIDENCE_PRODUCT_DECISION.md` (F-1) | Product decision | §10, §11 item 5, §13, §14, §15, §16, §19 |
| `…_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` (F1-D) | Product Owner decision | §8, §11.3, §12 |
| `…_D9_PRODUCT_DECISION.md` (D9) | Product decision | §6 costs, §9 fields (via D11 §7) |
| `…_P4_DETERMINATION_ELIGIBILITY_PRODUCT_OWNER_DECISION.md` (P4-PO-DEC-001) | PO decision, DECIDED | §8.1–§8.3 |
| `…_G6_ZERO_SEGMENT_VALIDITY_PRODUCT_OWNER_DECISION.md` (G6-PO-DEC-001) | PO decision, DECIDED | §2, §4 |
| `…_G7_PROVIDER_TRANSLATION_TEST_SCOPE_PRODUCT_OWNER_DECISION.md` (G7-PO-DEC-001) | PO decision, DECIDED | §3, §5 |
| `…_A11_PRODUCT_OWNER_DECISION_D1_D4_Q1_Q2_NORMALIZATION.md` (A11-PO-DEC-003) | PO decision, DECIDED | M-2 capture point; retention/access |
| `…_A12_CLOSURE_DECISION.md` | Decision | A-14 and D11-I stated as independently OPEN |
| `…_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md` (VS-PO-DEC-001) | PO decision record, **PENDING** | §4 P1–P13, §6 options |
| `…_G7_PROVIDER_TRANSLATION_TEST_CONFORMANCE_RECORD.md` (G7-CONF-001) | Conformance record | G-7 SATISFIED |
| `…_G4_REPAIR_VERIFIER_D11_READINESS_ASSESSMENT.md` (G4-D11-ASSESS-001) | Assessment | G-4 FOLLOW-UP / NON-BLOCKING |
| `…_F1_IMPLEMENTATION_CONFORMANCE_AUDIT.md` (F1-IMPL-AUDIT-001) | Audit | Status, G-1–G-10, test results |
| `…_F1_IMPLEMENTATION_CONFORMANCE_RECORD.md` | Implementation record | Authority F1-PO-AUTH-001; test results |
| `…_F1_OPEN_GAP_D11_READINESS_ASSESSMENT.md` (F1-GAP-D11-ASSESS-001) | Assessment | G-9 analysis; zero-segment analysis |
| `…_D11_LIVE_VALIDATION_GATE_AUDIT.md` (Gate Audit) | Audit | §3, §6, §7, §8, §10, §11, §13 |
| `…_D11_VALIDATION_READINESS_AUDIT.md` (Readiness Audit) | Audit | Status (read through the Gate Audit and VS-PO-DEC-001) |
| `…_D11_FACILITATOR_OBSERVATION_RECORD.md` (D11-H) | Facilitator record | Field readiness via Gate Audit §6; lines 200, 453 |
| `…_A12_SECTION_6_3_COMPANION_RECORD.md` (Companion) | Facilitator record | §1, §2, §6, §7 |

All referenced records exist. None was missing.

**Read-only code and file-time checks (no execution):**
- No file under `packages/core-opportunity/src` or `packages/core-discovery/src` is newer than
  the Gate Audit (2026-09-26 15:09). The Gate Audit's green results for those suites therefore
  still describe the current code.

---

### 4. D11 Prerequisite Matrix

Legend for the Y/N columns: **Blk** = blocks READY; **Impl** = needs implementation; **PO** = needs
a Product Owner ruling; **Live** = needs a live session.

#### 4.1 D11 preconditions and implementation requirements

| ID | Requirement | Source | Current evidence | Status | Class | Blk | Impl | PO | Live | Next action | Authority available? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **D11-I** | A funded, working provider account able to make at least one real Research call. "MANDATORY precondition to scheduling any D11 validation session." | D11 §10.1, D11-I; Gate Audit §7, §13.1; VS P2 | Credential present (Gate Audit §7). Funding **unverified**; the last evidence is an `HTTP 400` insufficient-credit failure. No successful live call is recorded. | **OPEN** | R | **Y** | N | Y (to authorize a proof call) | Y (one real call) | Operator confirms funding; the PO authorizes one bounded proof-of-environment Research call; the result is recorded | **Not available.** No provider-call authority exists (VS §5). Type 4, plus type 5 for the proof call. |
| **D11-F / A-14 / G-7** | Structured-output translation tests for the extended segment schema, for Anthropic, OpenAI and Gemini, before any session is scheduled | D11 §7; F-1 §16; G7-PO-DEC-001 | Three adapter tests added and passing; `core-research` 284/284; `tsc` clean (G7-CONF-001) | **MET** | R | N | — | — | — | None. A-14 is the same item; the A-12 closure record's "OPEN" predates G7-CONF-001. | — |
| **F-1 disposition** (Gate §13.2, VS P3) | D11 §6.3 (confidence and basis populated and consistent with classification) must be satisfiable | D11 §6.3; F-1 §13–§14; F1-D §8; Gate Audit §10 F-1, §13.2 | F-1 decided; implemented under F1-PO-AUTH-001; F1-IMPL-AUDIT-001: implemented, with G-1/G-2/G-8/G-10 PASS. The remaining gaps are dispositioned: G-4 FU, G-6 DECIDED, G-7 MET, G-9 in-session. | **MET on evidence.** Not yet formally accepted by any readiness decision. | R | N | N | Y (formal acceptance within the D11 readiness decision) | N | Record acceptance in the D11 readiness decision | Needs that decision (type 1). |
| **D11-G** | Existing `core-opportunity`, `core-qualification` and `core-discovery` suites green | D11 §8 | `core-qualification` 30/30 after F-1 (F1-IMPL-AUDIT-001). `core-opportunity` 95/95 and `core-discovery` 25/25 (Gate Audit §8); neither package changed since. | **MET** (recorded evidence; not re-run here) | R | N | — | — | — | Optionally re-run before the readiness decision | Running unit suites needs no new authority. |
| **D11 §11 / F-1 §19** | Implementation authorization for the mechanisms D11 validates | D11 §11; F-1 §19 | D1–D10 built under earlier authorizations; F-1 built under F1-PO-AUTH-001 | **MET** | R | N | — | — | — | None | — |
| **D11 readiness decision** (VS P1) | An explicit decision reclassifying D11 once its blockers are resolved | Gate Audit §13; VS P1; P4-PO-DEC-001 §8.3 item 2 | None exists | **OPEN**. It is the terminal step and cannot be taken while D11-I is open. | R (terminal) | — | N | **Y** | N | PO decision after D11-I closes | Not available (type 1) |

#### 4.2 Eligibility and determination rules (decided)

| ID | Requirement | Source | Status | Class | Blk | Notes |
|---|---|---|---|---|---|---|
| **P4** | F-1 implementation precedes any A-11 validation-set determination; only `VALID` (post-F-1, complete fields) determinations count | P4-PO-DEC-001 | **DECIDED.** F-1 is now implemented, so the ordering condition can be met by any later session. | A11 / IN | N | No action |
| **G-6** | A zero-segment determination cannot be `VALID` and cannot count as D11 or A-11 evidence | G6-PO-DEC-001 | **DECIDED.** Applied by the facilitator. Code enforcement is not required. | IN | N | The Companion §2 label for such rows is undecided (FU) |
| **F-1 §11 item 5 reference point** | "Created after the F-1 implementation" | F-1 §11.5; G6-PO-DEC-001 §4 (left undecided) | **Undecided, but not blocking.** A post-F-1 segment carries `basis`, `confidence` and `classification`, which is positive evidence that it was written after F-1. Zero-segment rows, the only rows without that evidence, are already ineligible under G-6. | FU | N | Optional PO clarification or a commit/cutoff record |
| **Post-F-1 determination creation** | Determinations for the D11/A-11 set are created only inside an authorized session | VS P11; P4 §8.3 item 4 | None exist. Creation is not authorized. | IN (after S) | N | Occurs only inside an authorized session (type 5) |

#### 4.3 Session preparation (Gate Audit §11 / VS-PO-DEC-001 §4)

These are **audit-derived**. No Product Owner decision contradicts them, and VS-PO-DEC-001, which
is pending, lists them. Gate Audit §13 states that live validation "cannot begin until items 1 and
2 are resolved **and** the §11 prerequisites are arranged". They gate holding a session, not the
READY classification.

| ID | Requirement | Source | Status | Class | PO | Type | Next action |
|---|---|---|---|---|---|---|---|
| **P5 Runtime** | Web and worker running; Postgres reachable with migrations 0027 and 0028 applied; Google Places key and quota working | Gate §11.3; VS P5 | **NOT VERIFIED** | S | N | 4 | Operator verification (non-provider checks) |
| **Provider configuration** | The session environment's primary and fallback selection recorded, non-secret | D11 §7 (D9 §9 fields); Gate §7, §11.8 | Recorded default: Anthropic, no fallback (Gate §7, 2026-09-26). Not re-verified. Under G7-PO-DEC-001 it no longer affects test scope. | S | N | 4 | Record at session time |
| **Cross-Search design** | Same real business in two Searches; a compound target customer with at least 2 segments | Gate §11.4; D11 §4.4, §4.7; VS P8 | NOT ARRANGED | S | N | 6 (preparation) | Facilitator plan |
| **Trace-evidence definition** | Agree whether persisted `target_segments`, matching `segment_results` counts and `ai_usage_events` count as the §3.1 trace | Gate §6, §11.5; D11 §3.1; VS P8 | NOT AGREED | S | Facilitator (the Gate says "the facilitator must decide") | 1 | Record the agreement before the session |
| **Coverage-9 judgment** | How the "supporting-only → UNKNOWN" case (D11 §6.2) is recognized with a homepage-only pipeline | Gate §11.7; VS P8 | NOT AGREED | S | Facilitator | 1 | Record the agreement before the session |
| **Provider-field capture plan** | Query `ai_usage_events` for the D9 §9 fields | Gate §11.8; D11 §7 | NOT ARRANGED | S | N | 6 (preparation) | Facilitator plan |
| **Spot-check source / M-2** | The source the model actually saw is available for the D11 §6.4 spot-check | Gate §11.6; A11-PO-DEC-003; VS P10 | M-2 mechanism ready (T6 PASS); A11-PO-DEC-003 allows M-2 text as §6.3/§6.4 evidence. VS P10: whether M-2 **replaces** the facilitator snapshot "must be confirmed by the Product Owner". | S | **Y** | 1 | PO confirmation (can go in VS-PO-DEC-001) |
| **Source retrieval / Q-1** | Owner-scoped, read-only retrieval of M-2 documents | A11-PO-DEC-003; VS P13 | Mechanism ready (Q1-T1–T8 PASS). Q-1 closure is a separate PO determination. | A11 | (Q-1 closure) | — | Needed for E1, not for READY |
| **Participant** | A real anonymized participant; template unmodified and unprimed; D11-H blank and ready | D11 §4.9, §5, D11-C/H; Gate §11.9; VS P7 | NOT ARRANGED | S | N | 6 (preparation) | Facilitator arrangement |
| **Provider-call and live-fetch authority** | Explicit authorization for the session's Research calls and fetches | D11 §11; VS P9 | NOT GRANTED | S | **Y** | 5 | VS-PO-DEC-001 Option C |
| **VS-PO-DEC-001** | Session authorization, with boundaries | VS-PO-DEC-001 §6 | **PENDING** | S | **Y** | 1 / 5 | Option B now (preparatory) or Option C after READY |

#### 4.4 Within-session, sign-off and closure requirements

| ID | Requirement | Source | Class | Notes |
|---|---|---|---|---|
| D11 §3.1–§3.7 | Live trace, parsing, per-segment results, aggregate, UNKNOWN reasoning, provenance, cross-Search attribution | D11 §3 | IN | Observed only in a live session |
| D11 §3.8 | D7 separation | D11 §3 (STRUCTURAL) | MET | Code review (Gate Audit §4, §10) |
| D11 §4.1–§4.9 | Coverage: MATCH, MISMATCH, UNKNOWN, multi-segment, first-party, insufficiency, attribution, participant | D11 §4 | IN | No numeric threshold |
| D11 §6.1–§6.4 | Evidence URLs and quotes, first-party basis, confidence/basis consistency, one manual spot-check | D11 §6 | IN | §6.3 is now structurally possible (F-1) |
| D11 §7 fields | D9 §9 provider fields recorded every session | D11 §7 | IN | From `ai_usage_events` |
| D11 §10.2 | A schema-valid Research result within the session | D11 §10.2 | IN | G-4 residual risk: extra repair rounds |
| D11-H | All live fields (§1, §3–§22) | D11-H; Gate §6 | IN | Record fit for use; blank |
| Companion §1–§7 | Session link, register, §6.3 checks, results, sign-off | Companion | IN | Blank; facilitator and technical reviewer to be named |
| **G-9** UI render | The D10 section renders on a real Opportunity detail page | D11 §3 E2E (D11-B) | **SO** | "ADDITIONALLY MANDATORY for full D11 sign-off". Not a scheduling item. Needs a real post-F-1 determination, which only an authorized session can create. |
| E1 / E2 / E3 | A-11 evidence steps | A-11 matrix; P4 §8.2 | A11 | Each needs its own authorization after a session |

#### 4.5 Follow-ups

| Item | Source | Why non-blocking |
|---|---|---|
| G-4 repair/verifier wording | G4-D11-ASSESS-001 | Contract enforced; no record gates on the wording |
| Gemini `toGeminiSchema` drops nullable-field descriptions | G7-CONF-001 observation | Structural constraints preserved; the shared prompt carries the guidance |
| G-6 mechanical enforcement | G6-PO-DEC-001 §4 | Not required |
| Companion §2 label for zero-segment rows | G6-PO-DEC-001 §2 | Row is ineligible regardless of label |
| 14 pre-existing integration failures | Gate §9.1; F1-IMPL-AUDIT-001 | Not part of the D11-G regression set; pre-existing |
| `apps/web/tsconfig.tsbuildinfo` working-tree change; uncommitted F-1/M-2/Q-1 work | F1-IMPL-AUDIT-001 §12 | Repository hygiene. No D11 record gates on it. |
| Stale "OPEN" A-14 in the A-12 closure record and VS-PO-DEC-001 P3/P4 text | — | Superseded by later decisions and records. Updating them needs its own authorization. |

---

### 5. Satisfied Prerequisites

- D11-F / A-14 / G-7: adapter translation tests for all three adapters (G7-CONF-001).
- F-1 disposition for D11 §6.3: implemented and conformance-audited, pending formal acceptance.
- D11-G: regression suites green on recorded evidence.
- D11 §3.8: D7 separation (structural).
- D11 §11 / F-1 §19: implementation authorization for the validated mechanisms.
- P4 ordering: F-1 now precedes any future session determination.
- G-6: rule decided; applied by the facilitator.
- M-2 capture and Q-1 retrieval mechanisms: technically ready.
- D11-H and Companion instruments: fit for use (Gate §6; A-12 CLOSED).

---

### 6. Blocking Prerequisites

**For READY classification (authoritative):**

| # | Blocker | Source | Type |
|---|---|---|---|
| **1** | **D11-I: funded, working provider account not demonstrated** | D11 §10.1, D11-I | 4 environment/provider readiness; proving it needs 5 (one authorized live call) |

The READY transition itself also needs the **D11 readiness decision** (type 1). That is the act of
transition, not an independent blocker. It cannot be taken while D11-I is open.

**For holding a session (audit-derived, after or alongside READY):** P5 runtime; cross-Search
design; trace-evidence definition; coverage-9 judgment; provider-field capture plan; spot-check
source (M-2) confirmation; participant arrangement; provider-call and live-fetch authority;
the VS-PO-DEC-001 decision.

---

### 7. Non-Blocking / Follow-Up Items

See §4.5. Additionally, G-9 is **not** a scheduling item: it is required for full D11 sign-off
(D11-B) and belongs inside the session.

---

### 8. Product Owner Decisions Still Required

| # | Decision | Needed for | Record |
|---|---|---|---|
| 1 | Authorize one bounded proof-of-environment Research call for D11-I, if funding is to be proven by a live call | READY (D11-I) | New authorization, or VS-PO-DEC-001 Option B |
| 2 | D11 readiness decision: accept the F-1 disposition (VS P3) and reclassify D11 | READY | New decision |
| 3 | Confirm whether M-2 replaces the facilitator page snapshot for the D11 §6.4 spot-check | Session (S) | VS-PO-DEC-001 (P10) |
| 4 | Validation-session authorization with boundaries (provider calls, fetches, participant, recorder) | Session (S) | VS-PO-DEC-001 Option C |
| — | Optional: reference point for "created after the F-1 implementation" | FU | — |

The trace-evidence definition and the coverage-9 judgment are assigned to the facilitator by the
Gate Audit. The Product Owner may adopt them in VS-PO-DEC-001.

---

### 9. Implementation Work Still Required

**None for READY.** No implementation or test change is required by any authoritative record
before D11 can be classified READY.

Optional follow-ups, each needing separate authorization: G-4 wording and a segment repair-round
test; G-6 mechanical enforcement; the Gemini description preservation; repository hygiene
(commit, `tsbuildinfo`).

---

### 10. Live-Validation-Only Requirements

D11 §3.1–§3.7; §4.1–§4.9; §6.1–§6.4; the D9 §9 fields (§7); §10.2; D11-H and Companion entries;
the Session ID and Determination IDs (VS P6, P12); post-F-1 `VALID` determination creation (VS
P11); the G-9 UI render (full sign-off); E1, E2 and E3 afterwards (A-11).

---

### 11. Exact Dependency Chain to D11 READY

```text
1. Operator confirms the provider account is funded                  (type 4)
2. PO authorizes one bounded proof-of-environment Research call      (type 5)
      └─ the call succeeds and is recorded → D11-I MET
3. PO D11 readiness decision:                                         (type 1)
      accepts the F-1 disposition (VS P3), notes G-7 MET, D11-G MET,
      G-4 FU, G-6 decided → D11 = READY FOR LIVE VALIDATION
---------------------------------------------------------------- READY
4. Session preparation: P5 runtime, cross-Search design, trace and
   coverage-9 agreements, provider-field plan, participant            (types 4, 6, 1)
5. VS-PO-DEC-001 decided, including the P10 M-2 confirmation          (types 1, 5)
6. Authorized session → post-F-1 VALID determinations; D11 §3–§7, §10.2
   observed; G-9 render for full sign-off                             (types 5, 6)
7. Separate E1 / E2 / E3 authorizations → A-11                       (types 5, 6)
```

Step 1 may run in parallel with the step 4 arrangements that need no provider call.

---

### 12. Minimum Next Authorization Required

**A bounded D11-I environment-readiness authorization.** It would permit:
- confirming the provider account's funding status (an operator action with no secret disclosed);
- **one** Research call against the configured provider, solely to prove D11-I;
- recording the outcome (success or failure, provider, model, HTTP status) in a new record.

It would **not** permit a participant session, determination creation for the D11/A-11 set, E1,
E2 or E3, or a D11 readiness transition. VS-PO-DEC-001 §6 Option B already contemplates exactly
this ("proving D11-I with a real Research call would need its own explicit authorization").

If the operator can prove funding without a live call (for example, a billing-console statement),
the D11 readiness decision must say whether that satisfies D11 §10.1's "capable of executing at
least one real Research call". This audit does not decide that.

---

### 13. Explicit Exclusions / Authority Withheld

This record does not:
- make D11 READY, or authorize or schedule a validation session;
- authorize provider calls, live fetches, participant contact or determination creation;
- authorize E1, E2 or E3, or close A-11;
- modify F-1, F1-D, D9, D11, D11-H, the Companion Record, the A-11 matrix, VS-PO-DEC-001,
  P4-PO-DEC-001, G6-PO-DEC-001, G7-PO-DEC-001, G4-D11-ASSESS-001, or any other record;
- authorize any implementation or test change;
- reopen P4, G-6 or G-7.

---

### 14. Final D11 Readiness Conclusion

| Question | Answer |
|---|---|
| **How many true D11 scheduling blockers are there?** | **One** unmet authoritative precondition to READY: **D11-I**. After it, the READY transition needs the D11 readiness decision. Holding a session then also needs the audit-derived arrangements and VS-PO-DEC-001 (§4.3). |
| **What are they?** | D11-I: a funded, working provider account able to complete a real Research call (D11 §10.1). |
| **Which need Product Owner decisions?** | Authorizing the D11-I proof call; the D11 readiness decision (including formal acceptance of the F-1 disposition). For the session itself: VS-PO-DEC-001 and the P10 M-2 confirmation. |
| **Which need implementation/test work?** | **None.** G-7 is met. G-4, G-6 enforcement and the Gemini description finding are optional follow-ups. |
| **Which need provider/environment readiness?** | D11-I (funding plus a proven call). Before a session: P5 runtime and a recorded provider configuration. |
| **Which cannot be resolved until the session itself?** | D11 §3.1–§3.7, §4, §6, the §7 fields, §10.2, D11-H and Companion entries, post-F-1 `VALID` determinations, the G-9 UI render (full sign-off), and E1, E2, E3. |
| **What is the smallest next authorized task that moves D11 toward READY?** | A bounded D11-I environment-readiness authorization: confirm funding and make one proof-of-environment Research call, recorded, with no session, no validation-set determination and no readiness transition (§12). |

```text
D11 = NOT READY FOR LIVE VALIDATION
E1 = BLOCKED
E2 = OPEN
E3 = OPEN
A-11 = OPEN
```

---

### Repository Safety

No `.env` or credential file was read. No test, typecheck, build, browser, provider, Docker or
Postgres command was run. The after-state is verified at creation and reported with this record.

## STOP
