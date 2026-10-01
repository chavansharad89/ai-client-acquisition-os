# PATH 2 — CATEGORY PLAUSIBILITY

## Validation-Session Readiness Blockers — Product Owner Decision Preparation

**Decision ID (reserved):** VS-READY-PO-DEC-001 (sub-decisions R-1 … R-11)
**Status:** **PENDING PRODUCT OWNER DECISION**
**Parent records:** `PATH_2_CATEGORY_PLAUSIBILITY_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md`
(VS-PO-DEC-001) §9.3(b), §9.4–§9.7; `PATH_2_CATEGORY_PLAUSIBILITY_P8_PARTICIPANT_BLINDING_PRODUCT_OWNER_DECISION.md`
(P8-PO-DEC-001) §3.3–§3.6; `PATH_2_CATEGORY_PLAUSIBILITY_SESSION_ID_PRODUCT_OWNER_DECISION.md`
(SESSION-ID-PO-DEC-001)
**Basis:** the read-only final pre-session readiness audit (working session, 2026-09-28; not
recorded as a file)
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
VALIDATION SESSION ........ NOT READY — REQUIRES PO DECISION
                            (authorized within VS-PO-DEC-001 §9 limits; not performed)
THIS RECORD ............... PREPARATION ONLY — NO DECISION, NO EXECUTION AUTHORITY
```

This record prepares decisions. It makes no decision, ranks no option and recommends nothing.
It does not modify VS-PO-DEC-001, P8-PO-DEC-001, SESSION-ID-PO-DEC-001, D11, D11-H, the Companion
Record, the A-12 decision, A11-PO-DEC-003, the Gate Audit or the participant template. No earlier
preparation record covers these eleven blockers.

---

## 1. Current state

- The validation session remains **NOT READY**. VS-PO-DEC-001 §9.3(b) prerequisites 3 (roles
  named) and 5 (P8 design agreed and recorded) are not met, and P8-PO-DEC-001 left the questions in
  §3.3, §3.5 and §3.6 open.
- This record grants **no** execution authority of any kind (see §12).
- Correction carried from the final audit: an Opportunity is created for **every** discovered
  prospect, whatever its category-plausibility result (`apps/worker/src/searchWorker/worker.ts:387-415`;
  `createOpportunityForOwner` has no Qualification gate; D10-A). The ranked-list score/band does not
  read the determination. MISMATCH and UNKNOWN determinations therefore reach the Opportunity detail
  page, and list membership reveals nothing about the result. No blocker arises from this.

Items already settled and **not** reopened here: P1–P4, P9, P10 (VS §9.3(a)); participant surface
= procedure only (P8-PO-DEC-001 §3.1–§3.2); Session ID = facilitator-assigned at session time
(SESSION-ID-PO-DEC-001); direct human database queries NOT AUTHORIZED (VS §9.4; P8 §5).

Session-time items that are **not** decisions and are not prepared here: operator runtime
confirmation (web app, worker, Postgres, migrations applied, Places quota; VS §9.3(b)1), participant
arrangement by the named facilitator (VS §9.6), Session ID and date, determinations, ID recording,
M-2 rows and Q-1 retrieval (VS §9.3(c)).

---

## 2. Decision inventory

Each entry: question · source · constraint · why unsettled · unranked options · consequences ·
implementation impact · additional authorization.

### R-1 — Facilitator/analyst identity

| | |
|---|---|
| **Question** | Who is the facilitator/analyst for this session? |
| **Source** | VS §9.3(b)3, §9.6, §9.7; SESSION-ID-PO-DEC-001 §2; D11-H §1; Companion §1 |
| **Constraint** | "The Product Owner names the facilitator/analyst … before execution." The role arranges the participant, records the Session ID/date and all Companion §2 entries, and records P8 design before the session. |
| **Why unsettled** | No record names anyone. D11-H §1 "Facilitator" and Companion §1 are blank. |
| **Options** | **A.** The PO names a person (recorded anonymized or by role label, as the PO directs). **B.** The PO names themself as facilitator/analyst. |
| **Consequences** | Either option satisfies VS §9.3(b)3 for this role. Under B, the PO both decides and records; no record forbids this, and no record addresses it. |
| **Implementation** | None. |
| **Additional authorization** | None beyond the naming itself. |

This record does not infer a person from git metadata, usernames, environment variables or
repository history.

### R-2 — Technical reviewer identity

| | |
|---|---|
| **Question** | Who is the technical reviewer? |
| **Source** | VS §9.3(b)3, §9.5, §9.7; Companion §1 "Technical reviewer (if different)"; A11-PO-DEC-003 §6 |
| **Constraint** | Named by the PO before execution; performs the D11 §6.4 spot-check independently against M-2 text retrieved through Q-1, applying normalization manually. Q-1 is owner-scoped, so retrieval must run as the account that owns the session's determinations (VS P13). |
| **Why unsettled** | No record names anyone. The Companion field says "(if different)", so whether the reviewer may be the same person as the facilitator is left open. |
| **Options** | **A.** A person different from the facilitator. **B.** The same person as the facilitator (Companion wording permits it). |
| **Consequences** | A: two people record; independence of the §6.4 check from the facilitator is structural. B: one person records everything; the §6.4 check is independent of the *provenance implementation* (A11-PO-DEC-003 §6) but not of the facilitator. Under either, the reviewer needs access to the owning account for Q-1. |
| **Implementation** | None. |
| **Additional authorization** | None, unless the reviewer needs Q-1 access other than through the owning account (not provided by any record; would need its own decision). |

### R-3 — Concrete Search 1 / Search 2 design and service definition

| | |
|---|---|
| **Question** | What exact inputs (service, `targetCustomer`, geography, minimum project value) are used for Search 1 and Search 2? |
| **Source** | Gate Audit §11.4; D11 §4 items 4 and 7; D11 §3 items 2 and 7; VS §9.3(b)5, §9.4; P8-PO-DEC-001 §3.3 |
| **Constraint** | At most 2 Searches. At least one Search with a genuine compound (≥2-segment) `targetCustomer`. Two Searches with **different** `targetCustomer` values covering the same business. Inputs agreed and recorded by the facilitator/analyst before the session. |
| **Why unsettled** | P8 §3.3 states the design is "already defined by the governing P8 planning records"; those records define requirements only. No record contains concrete values. |

**Required / supported / to be chosen**

| Aspect | Required by records | Already technically supported | Must be chosen for this session |
|---|---|---|---|
| Search count | ≤ 2 (VS §9.4) | Yes | — |
| Compound `targetCustomer` | ≥ 1 Search with ≥ 2 segments (D11 §4.4) | `;`-delimited parsing (`categoryPlausibility.ts:36`), up to 5 D11-H rows | The segment strings |
| Different `targetCustomer` per Search | Yes (D11 §3.7, §4.7) | Per (Search, Prospect) determinations (Gate §5 row 5) | Both values |
| Service / geography / minimum value | Search form fields | `searches/new` form | All values |
| Reuse of on-record example | Permitted: "Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators" (D11 §4.4) | Yes | Whether to use it |

**Options (unranked)**

- **A. PO specifies all inputs now** for both Searches (service, both `targetCustomer` values,
  geography, minimum value).
- **B. PO specifies constraints; the named facilitator fixes the values** and records them before
  the session (VS §9.3(b)5 already places the recording with the facilitator).
- **C. PO specifies one Search (for example, the on-record three-segment example) and delegates the
  other** to the facilitator under stated constraints.

| Option | Consequences |
|---|---|
| A | Inputs fixed at PO level; facilitator records them verbatim. |
| B | Inputs are fixed by the facilitator; P8 §3.3's "already defined" premise is then met by the facilitator's record, not by a PO record. |
| C | Mixed: one Search fixed by PO, one by facilitator. |

Under every option, whether the segments actually yield MATCH/MISMATCH/UNKNOWN coverage (D11 §4.1–4.3)
is only observable at session time; VS §9.4 forbids a third Search if coverage is not reached.

**Implementation:** none. **Additional authorization:** none; values must not be tested with a
Search, Places call or provider call before the session.

### R-4 — Shared business across the two Searches

| | |
|---|---|
| **Question** | How is "the same real business in two Searches" to be achieved and identified? |
| **Source** | D11 §3 item 7, §4 item 7; Gate Audit §5 row 5, §11.4 |
| **Constraint** | Discovery (Google Places) must return the same business for both Searches. Company is deduplicated by domain per user; each Search gets its own Prospect. No exploratory or test Places call is permitted (VS §9.4). |
| **Why unsettled** | No business, location or overlap strategy is recorded. |
| **Options** | **A.** PO pre-names a specific real business and chooses inputs expected to return it (knowledge from outside the system; no Places lookup). **B.** Same geography and service in both Searches, differing only in `targetCustomer`, without pre-naming a business; the overlap is identified at session time. **C.** No pre-planning of overlap; record the outcome as observed. |
| **Consequences** | A: overlap still not guaranteed (Places ranking is outside the system's control); naming a real business in a record requires the anonymization rules the PO applies. B: overlap likely but not guaranteed; the shared business is identified only after both Searches. C: D11 §4 item 7 / §3 item 7 may not be met; VS §9.4 then requires the result to be recorded as observed, and a third Search needs new authorization. Under every option, whether overlap occurs is observable only at session time. |
| **Implementation** | None. |
| **Additional authorization** | None for A–C. Any pre-session Places lookup to confirm overlap would need its own authorization (VS §9.4). |

### R-5 — Trace-evidence definition (D11 §3.1)

| | |
|---|---|
| **Question** | What counts as sufficient evidence that the Search-scoped `targetCustomer` "demonstrably reaches Research … confirmed by trace/log, not inferred from code alone" (D11 §3 item 1)? |
| **Source** | D11 §3 item 1; Gate Audit §5 row 6, §11.5; VS §9.3(b)5 |
| **Constraint** | No prompt/request log exists (Gate §5 row 6). Gate §11.5: agree before the session whether persisted `target_segments`, matching `segment_results` counts and `ai_usage_events` together form the trace; "otherwise, arrange a separate authorized capture". No direct database queries (VS §9.4). |
| **Why unsettled** | Gate §11.5 frames the choice and assigns it to pre-session agreement; no record makes it. |

**Evidence already exposed by the application** (Opportunity detail page,
`apps/web/app/(client-finder)/opportunities/[id]/page.tsx`; offline tests in `page.test.ts`, 6/6
PASS in the final audit):

| Class | Fields shown | Where |
|---|---|---|
| Determination data | aggregate result, `observedAt` timestamp, target customer "as of this Search" | l.174–178 |
| IDs | Determination ID, Search ID, Prospect ID (Opportunity ID in the URL) | l.181–190 |
| `target_segments` | ordered list with count | l.193–197 |
| `segment_results` | per segment: fit, classification, confidence, basis, rationale, evidence | l.200–212 |
| `ai_usage_events` | per event: timestamp, provider, model, request_kind | l.236–239 |
| Fallback indication | derived from `request_kind === 'fallback'` | l.86–91, l.232 |

**Options (unranked)**

- **A.** The trace is the Gate §11.5 triple as shown on the detail page: persisted `target_customer`
  / `target_segments` + `segment_results` count equal to the segment count + at least one
  `ai_usage_events` row for the prospect.
- **B.** The trace is `target_segments` + matching `segment_results` count only; usage events are
  recorded for D11 §7 but are not part of the §3.1 trace.
- **C.** The UI-exposed evidence is declared insufficient for §3.1, and a separate authorized
  capture is required (Gate §11.5 "otherwise").

| Option | Consequences |
|---|---|
| A | §3.1 is assessable from the existing UI; the inference "count match implies the model received the segments" is the one Gate §5 row 6 describes. |
| B | Same, without tying the trace to a metered invocation. |
| C | §3.1 cannot be satisfied in this session without a new mechanism. |

**Implementation:** A, B none. C requires a new capture mechanism (code, possibly schema).
**Additional authorization:** C requires separate implementation authorization; VS §9.10 withholds
code changes. No option authorizes database queries.

### R-6 — Coverage-9 judgment ("supporting-only → UNKNOWN")

| | |
|---|---|
| **Question** | How is the D11 §6.2 "only supporting-tier evidence → UNKNOWN" case to be recognized, given the homepage-only pipeline? |
| **Source** | D11 §6 item 2 ("if only supporting-tier evidence exists for a candidate, the result must be UNKNOWN, and validation should confirm at least one such case behaved this way"); Gate Audit §5 row 9, §11.7; VS §9.3(b)5 |
| **Constraint** | The pipeline supplies no secondary documents (homepage only; D11-H §13). Gate §5 row 9 classes the case "NOT NATURALLY PRODUCIBLE AS SPECIFIED". A failed homepage fetch persists no determination and is not this case. |
| **Numbering note** | "Coverage-9" refers to Gate Audit §5 row 9, **not** D11 §4 item 9 (human participant). |
| **Why unsettled** | Gate §5 row 9: "a facilitator/Product Owner judgment, not something this audit settles." |

**Options (unranked)**

- **A.** The case is satisfied by an UNKNOWN where the homepage is uninformative but other,
  non-citable context (for example, the company name) suggests the category (the "nearest case" in
  Gate §5 row 9).
- **B.** The case is satisfied by any UNKNOWN whose recorded basis is model-reported insufficient
  evidence with no first-party support, as judged by facilitator review of the M-2 source.
- **C.** The case is recorded as **not producible** in this pipeline and is not observed in this
  session.
- **D.** The case requires genuine secondary-source evidence, which the pipeline does not fetch.

| Option | Consequences |
|---|---|
| A | Recognizable at session time only if such a business occurs; the facilitator records the judgment in D11-H §9/§13. |
| B | Broader; may overlap with D11 §4 items 3 and 6 (UNKNOWN / genuine insufficiency). |
| C | D11 §6.2's "validation should confirm at least one such case" is recorded as unmet or not applicable; effect on D11 sign-off is for the PO to state. |
| D | Cannot be observed in this session. |

**Implementation:** A–C none. D requires fetching secondary sources (code change; outside P9's
homepage-only fetch). **Additional authorization:** D requires implementation authorization and a
P9 scope change; VS §9.10 withholds both.

### R-7 — P8 §3.6 participant-procedure questions

The blinding rule is preserved under every option below: the participant must not see the
system's determination (or any item in P8 §3.2) before answering. The UI is not modified.

| # | Question | Source | Options (unranked) | Consequences |
|---|---|---|---|---|
| R-7a | Is the label-free ranked list sufficient information for the participant? | P8 §3.1, §3.6 | **A.** List only (rank, name, score/band, recommended offer). **B.** List plus facilitator-presented information (see R-7b). | A: participant judges from name and offer text only. B: depends on R-7b content. |
| R-7b | What may the facilitator present before the answer? | P8 §3.1, §3.2, §3.6 | **A.** Nothing beyond the list. **B.** The business's own public homepage URL/name only. **C.** A PO-defined list of permitted non-determination items. | Every option must exclude all P8 §3.2 items. B/C: showing the homepage is not "determination-derived", but the participant's view then overlaps with what the model saw. |
| R-7c | Does "after the response is captured" mean after each Opportunity or after all Opportunities? | P8 §3.1 step 4, §3.6 | **A.** After each Opportunity. **B.** After all Opportunities. | A: the detail page for Opportunity *n* is opened before the participant answers Opportunity *n+1*; the facilitator must keep it out of the participant's view. B: all answers are captured before any detail page is opened. |
| R-7d | When is the in-app feedback form used? | P8 §3.6; detail page l.289 | **A.** Not used in this session. **B.** Filled by the participant after all answers, on the post-response detail page. **C.** Filled by the facilitator from the participant's words. | B exposes the detail page (with the determination) to the participant, so it must follow all answers. C creates application rows authored by the facilitator. B and C both write feedback rows through the application; whether VS §9.4 "No manual writes, seeding or edits" reaches in-app feedback is not stated in any record. |
| R-7e | Does the participant see the system result after answering? | P8 §3.6; D11-H §20 (reaction/disagreement fields); D11 §9 | **A.** No. **B.** Yes, after all answers are captured, with reactions recorded in D11-H §20. | A: D11-H §20 reaction/disagreement fields stay blank. B: reactions are recorded; D11 §9 leaves any label-reaction *template* question to a separate decision, so reactions go only in D11-H. |
| R-7f | How are answers mapped when the same business appears twice? | P8 §3.6, §4; template "Search reviewed" (one Search ID field) and per-opportunity block (Opportunity ID); list page shows no Search ID | **A.** Participant answers once per business; the facilitator records the answer against both Opportunity IDs. **B.** Participant answers per list row; facilitator records each row's Opportunity ID (from the Review link) and its Search ID in the Companion. **C.** Participant reviews one Search's Opportunities at a time, using one template copy per Search. | A: one answer serves two determinations. B: two answers for the same business are possible. C: the template's single Search ID field is used as designed; D11 §4.9 "one copy = one participant, one session" convention needs a PO reading. In all options the Opportunity ID ↔ Determination ID join stays in D11-H §19 / Companion §2. |

**Implementation:** none for any option (no UI change). **Additional authorization:** none; any
UI change (for example a Search filter on the list) would require separate authorization.

### R-8 — Template "Service definition … as entered by the participant, not assumed"

| | |
|---|---|
| **Question** | How is the template block headed "Service definition used (§3 stage 1 — as entered by the participant, not assumed)" completed when Search inputs are facilitator-preplanned? |
| **Source** | `MVP_REAL_USER_VALIDATION_TEMPLATE.md` l.23; P8-PO-DEC-001 §3.3; D11 §9 (template not modified); `MVP_SCOPE_BOUNDARY.md` §9 |
| **Constraint** | The template may not be modified. |
| **Why unsettled** | P8 §3.3 records the tension and expressly does not decide it, nor whether this session's template copy counts toward the general `MVP_SCOPE_BOUNDARY.md` §9 real-user gate. |
| **Options** | **A.** The participant enters the planned inputs themselves in the Search form, so the block is literally "as entered by the participant". **B.** The facilitator records the planned inputs in the block, with a facilitator note that they were preplanned; the copy is not counted toward `MVP_SCOPE_BOUNDARY.md` §9. **C.** The block is left blank for this session, with the inputs recorded only in D11-H §3 / Companion. |
| **Consequences** | A: the participant is exposed to the Search form (no determination is shown there). B: the heading is not literally met; the gate-counting question is answered "no". C: the block is empty; gate counting is likewise affected. Under every option, the separate question of counting toward §9 must be stated by the PO. |
| **Implementation** | None. |
| **Additional authorization** | None. |

### R-9 — Gate §11.8 wording vs the ban on direct database queries

**Evidence availability (settled facts):** provider, model, request_kind, event timestamp and the
fallback indication for the prospect's `ai_usage_events` are shown on the Opportunity detail page
and covered by the offline render and ownership tests (`page.test.ts`). They have not been
live-observed.

**Authorization/mechanism wording (open):**

| | |
|---|---|
| **Question** | How is Gate §11.8 "plan to query `ai_usage_events` (provider, model, request_kind) per prospect" to be read, given VS §9.4 prohibits direct human database queries? |
| **Source** | Gate Audit §11.8; VS §9.4; P8-PO-DEC-001 §3.5 |
| **Constraint** | P8 §3.5 rules that the existing application UI / authorized session mechanism is the evidence-capture mechanism, and states that "Gate §11.8 wording requires separate governance clarification". Gate §11.8 is not amended by P8. |
| **Why unsettled** | P8 §3.5 expressly leaves the wording open. |
| **Options** | **A.** A governance ruling that "query" in §11.8 is satisfied by reading the values from the authorized application UI; Gate §11.8 text left unchanged. **B.** A governance ruling that amends or annotates Gate §11.8 to name the UI mechanism. **C.** A ruling that §11.8 requires a database query, and a separate PO decision authorizing a bounded read. |
| **Consequences** | A: no record edit; the reading lives in the decision record. B: Gate Audit edited (its own authorization). C: reverses the VS §9.4 posture for this item; scope, role and read-only limits would have to be defined. |
| **Implementation** | None for any option. |
| **Additional authorization** | B: authorization to edit the Gate Audit. C: a separate database-access decision. |

### R-10 — Failed provider attempts that produce no `ai_usage_events` row

**Facts (static inspection):**

| Evidence class | What exists | Where observable |
|---|---|---|
| Successful provider invocations | One `ai_usage_events` row per model invocation that returned usage (`researcher.ts:243`); `request_kind` = `initial`, `repair` or `fallback` | Opportunity detail page |
| Failed provider attempts | A thrown provider error (for example an HTTP error) returns no usage, so **no row** is written. Research retries up to `maxAttempts: 3` (`researcher.ts:143`); failed tries inside a call that later succeeds leave no trace. No per-attempt log exists in `researcher.ts` or `fallbackResearchProvider.ts`. | Not observable per attempt |
| Job-level attempts | Search `attempts` and, on FAILED, `lastError` | Search page (`searches/[id]/page.tsx` l.77, l.88–89) |

| | |
|---|---|
| **Question** | Is the existing evidence sufficient for D11-H §14 "Provider attempts" and D11 §7, or is another authorized mechanism required? |
| **Source** | D11-H §14; D11 §7 (primary provider, whether fallback was invoked, actual provider); Gate §6 row §14 |
| **Constraint** | D11 §7 requires primary provider, fallback invoked, and actual provider. It does not itself list failed-attempt counts; D11-H §14 has a "Provider attempts" field. No direct database queries. |
| **Why unsettled** | No record addresses failed attempts that produce no row. |
| **Options** | **A.** Existing evidence is sufficient: D11-H §14 records successful invocations from usage events plus job-level attempts/`lastError`, with a note that failed attempts inside a successful call are not individually observable. **B.** Existing evidence is sufficient for D11 §7, and D11-H §14 "Provider attempts" is recorded as "not observable". **C.** Another mechanism is required (for example, operator-visible worker logging of failed attempts). |
| **Consequences** | A/B: no change; the limitation is recorded. C: failed attempts become observable only after a code change. |
| **Implementation** | A, B none. C: code change. |
| **Additional authorization** | C requires separate implementation authorization (VS §9.10). |

### R-11 — Recording the uncommitted implementation baseline

**Facts:**

- HEAD is `5992b82b9adff492c480442d68a954f2a03bfb28`. The Path 2 implementation (including M-2,
  Q-1, the P8 evidence surface and its test) and migrations `0027_category_plausibility_determinations`
  and `0028_category_plausibility_source_documents` exist only as uncommitted working-tree changes
  (VS §2 item 7). At drafting: `git status --short` 154 lines; nothing staged.
- D11-H §2 is prefilled: "HEAD `5992b82…`" and "Path 2 category-plausibility implementation present
  in working tree". No content hash of the working tree is recorded anywhere.

| | |
|---|---|
| **Question** | How is the implementation baseline under test to be fixed and recorded for the session? |
| **Source** | D11-H §2; VS §2 item 7, §9.10; Gate Audit §2 (used working-tree digests for integrity) |
| **Constraint** | VS §9.10 withholds any code, test, schema, migration or configuration change. Whether committing existing changes is a "change" is not stated in any record. |
| **Why unsettled** | VS §2 item 7 records the fact without ruling on it. HEAD alone does not identify the code that will run. |
| **Options** | **A.** Commit the existing working tree before the session (no content change) and record the new commit in D11-H §2 / Companion. **B.** Keep it uncommitted; record HEAD plus a digest of `git diff` and of the untracked implementation files at session start. **C.** Keep D11-H §2 as prefilled (HEAD plus "present in working tree") with no further identifier. |
| **Consequences** | A: reproducible baseline; a git operation outside this record's scope. B: baseline identifiable but not reproducible from git alone. C: the code under test is not uniquely identified. Under every option, whether migrations 0027/0028 are *applied* remains an operator check at session start. |
| **Implementation** | None (no content change under any option). |
| **Additional authorization** | A requires explicit authorization to commit. B/C none. |

---

## 3. Facilitator and technical reviewer

Prepared as two separate decisions: **R-1** and **R-2**. The Product Owner must explicitly name each
role. Nothing in this record infers or proposes a person.

## 4. P8 Search design

Prepared as **R-3** (Search 1, Search 2, service/category definition, compound structure) and
**R-4** (shared business). No Search, Places call or provider call was made to inform them.

## 5. Trace-evidence definition

Prepared as **R-5**. No database query and no new capture mechanism is proposed; option C records
the Gate §11.5 "separate authorized capture" alternative only because the Gate names it.

## 6. Coverage-9 judgment

Prepared as **R-6**. The judgment is not made here.

## 7. P8 participant procedure

Prepared as **R-7a–R-7f** and **R-8**. The blinding rule is unchanged. No UI change is proposed.

## 8. Gate §11.8 governance issue

Prepared as **R-9**, with evidence availability separated from the wording question. Gate §11.8 is
not modified.

## 9. Failed-attempt evidence gap

Prepared as **R-10**. Nothing is implemented.

## 10. Implementation baseline

Prepared as **R-11**. Nothing is committed and the working tree is not altered.

---

## 11. Library / agent reuse check

| Blocker | Existing capability | Already used? | New dependency or AI agent needed? |
|---|---|---|---|
| R-1, R-2 | Human naming | — | No |
| R-3, R-4 | Existing Search form (`searches/new`), Discovery, `parseTargetSegments` | Yes | No |
| R-5 | Detail page + `getCategoryPlausibilityDetermination`, `listAiUsageEvents` (`@acos/core-ai-usage`) | Yes | No (option C would need new code, not a library) |
| R-6 | Existing M-2 source text via Q-1 for facilitator review | Yes | No (option D would need new fetching code) |
| R-7, R-8 | Procedure; existing list/detail pages; `FeedbackForm` | Yes | No |
| R-9 | Detail-page usage section | Yes | No |
| R-10 | `@acos/observability` package exists (a worker dependency); `core-research` does not depend on it, and the Research retry loop has no attempt logging | No | No new dependency; option C would reuse existing packages |
| R-11 | git | — | No |

No new dependency is needed. An AI agent would add no capability to any of these decisions and
would introduce provider calls outside VS §9.4.

---

## 12. Authorization boundary

This preparation record authorizes **nothing**. Specifically, it authorizes:

- no provider calls;
- no retries;
- no Google Places calls;
- no Google Search calls;
- no live fetching;
- no database access;
- no participant contact;
- no validation session;
- no determination creation;
- no code changes;
- no schema changes;
- no migration execution;
- no configuration changes;
- no dependency installation;
- no AI-agent introduction.

---

## 13. Final decision table

| ID | Decision | PO choice required | Implementation required? | Separate authorization? | Current status |
|---|---|---|---|---|---|
| R-1 | Facilitator/analyst identity | Name the person | No | No | PENDING |
| R-2 | Technical reviewer identity | Name the person; same/different from R-1 | No | Only if Q-1 access other than the owning account is needed | PENDING |
| R-3 | Search 1 / Search 2 inputs and service definition | A / B / C | No | No | PENDING |
| R-4 | Shared business across Searches | A / B / C | No | Only for any pre-session Places lookup | PENDING |
| R-5 | §3.1 trace-evidence definition | A / B / C | Only if C | Only if C | PENDING |
| R-6 | Coverage-9 judgment | A / B / C / D | Only if D | Only if D | PENDING |
| R-7a | Sufficiency of label-free list | A / B | No | No | PENDING |
| R-7b | Facilitator-presented information | A / B / C | No | No | PENDING |
| R-7c | "After response": each vs all | A / B | No | No | PENDING |
| R-7d | Feedback form use | A / B / C | No | No | PENDING |
| R-7e | Result shown after answering | A / B | No | No | PENDING |
| R-7f | Answer mapping for duplicate business | A / B / C | No | No | PENDING |
| R-8 | Template service-definition tension and §9 gate counting | A / B / C | No | No | PENDING |
| R-9 | Gate §11.8 wording | A / B / C | No | B: Gate edit; C: database-access decision | PENDING |
| R-10 | Failed-attempt evidence gap | A / B / C | Only if C | Only if C | PENDING |
| R-11 | Implementation baseline recording | A / B / C | No | A: commit authorization | PENDING |

## STOP
