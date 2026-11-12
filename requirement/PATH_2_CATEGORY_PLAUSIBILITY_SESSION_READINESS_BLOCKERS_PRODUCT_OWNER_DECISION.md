# PATH 2 — CATEGORY PLAUSIBILITY

## Validation-Session Readiness Blockers — Product Owner Decision Record

**Decision ID:** VS-READY-PO-DEC-001 (sub-decisions R-1 … R-10)
**Status:** **DECIDED — GOVERNANCE FOLLOW-UPS CLOSED** (revision 6, 2026-09-29; current status in §10.5. §1 describes the revision 1–3 state)
**Previous status:** VS-READY-PO-DEC-001 — PENDING PRODUCT OWNER DECISION
**Scope of this round:** R-1 through R-10 (R-7a–R-7f and both R-8 questions recorded separately).
R-11 was **not** part of the first round; it and the retry conflict are recorded in revision 4 (§8).
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_SESSION_READINESS_BLOCKERS_PRODUCT_OWNER_DECISION_PREPARATION.md`
(sha256 `d79d270ce7128dee0a050915760b4d1de6f762e17840479b4f1d59af96639667`), kept unchanged for traceability
**Parent records:** VS-PO-DEC-001 §9.3(b), §9.4–§9.7; P8-PO-DEC-001 §3.3–§3.6; SESSION-ID-PO-DEC-001
**Product Owner:** Product Owner, by explicit selections given in the working session on 2026-09-29
(structured decision round, then a value-supply update), recorded here under that authorization
**Authority granted by this record:** recording of the §3 selections only (see §6)
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

**Revision history**

| Revision | Date | Change |
|---|---|---|
| 1 | 2026-09-29 | Decision round R-1 … R-10 recorded; R-3/R-4 values and R-10 selection pending. |
| 2 | 2026-09-29 | Product Owner supplied R-3 Search inputs, R-4 business and anonymization instruction, and R-10 = Option B. R-9 authorization, the template Search-ID question and R-11 remain open. |
| 3 | 2026-09-29 | Governance clarification (read-only inspection). No new Product Owner selection. §4 rewritten to classify each open item against the governing records; template Search-ID question prepared as TPL-SEARCH-ID-PO-DEC-001; runtime prerequisites listed separately (§4.6). |
| 5 | 2026-09-29 | Third decision round. Recorded: R-9 bounded Gate §11.8 edit authorization (edit not performed); Template Search-ID and Service-definition block decided in standalone TPL-SEARCH-ID-PO-DEC-001; R-4 anonymization follow-ups (redaction of earlier revisions authorized, not performed; mapping location; URL/quote rule); retry logging in D11-H §14 = NO; R-11 re-capture at session start = YES. See §9. |
| 4 | 2026-09-29 | Second structured decision round. Recorded: R-9 re-selected B (Gate Audit edit authorization still pending); R-11 = B with decision-time fingerprints; retry conflict = C with repair rounds and Search-job re-runs counted as retries; R-4 anonymization label and scope. Template Search-ID and Service-definition block: B selected without the required literal/text — PENDING, TPL-SEARCH-ID preparation record unchanged. See §8. |
| 6 | 2026-09-29 | Execution of already-authorized governance steps; no new Product Owner selection. Gate Audit §11 item 8 amended as authorized in §9.1; real business name redacted from revision 2 text (4 occurrences) to `Business A` as authorized in §9.3; open follow-ups reconciled to SVC-BLOCK-PO-DEC-001, URL-DOMAIN-PO-DEC-001 and EVID-TRACE-PO-DEC-001. See §10. |

```text
VS-READY-PO-DEC-001 ....... DECIDED — GOVERNANCE FOLLOW-UPS CLOSED (revision 6; §10.5)
CURRENT STATUS ............ see §10.5 (revision 6); earlier status blocks retained for traceability
VALIDATION SESSION ........ NOT READY — NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
IMPLEMENTATION ............ NOT AUTHORIZED BY THIS RECORD
```

This record captures Product Owner selections only. It changes no code, test, schema, migration,
configuration, dependency or existing governance record. The preparation record still reads
"PENDING PRODUCT OWNER DECISION"; its text is not edited, and this record supersedes that status for
the items marked DECIDED below.

---

## 1. Decision status

**PARTIALLY DECIDED.** Explicit Product Owner selections, with all required values, exist for R-1,
R-2, R-3, R-4, R-5, R-6, R-7a–R-7f, R-8 (block), R-8 (gate counting) and R-10. The following remain
open:

| ID | Reason |
|---|---|
| R-9 | Option B selected (amend/annotate Gate §11.8). Implementation/governance authorization for the Gate §11.8 amendment remains pending. |
| Template Search ID | Governance question, not decided by any record or by this round (§4.2; prepared as TPL-SEARCH-ID-PO-DEC-001). |
| R-4 anonymization | Label and scope not specified; no record defines business anonymization (§4.3). |
| Retry-rule conflict | Not resolved by any governing record (§4.5). |
| R-11 | Not part of this round; PENDING in the preparation record (§4.4). |

Option labels below are quoted from the preparation record. The order is the preparation record's
order and implies no ranking.

---

## 2. Decision table

| ID | Product Owner selection | Recorded value / notes | Status | Implementation consequence | Separate authorization? |
|---|---|---|---|---|---|
| R-1 | **B** — The PO names themself as facilitator/analyst | Facilitator/analyst = the Product Owner. No further identifier supplied. | DECIDED | No implementation required | No |
| R-2 | **B** — Technical reviewer is the same person as the facilitator | Technical reviewer = the Product Owner (same person as R-1). No further identifier supplied. | DECIDED | No implementation required | No |
| R-3 | **A** — PO specifies all inputs now for both Searches | Values in §3 R-3 | DECIDED | No implementation required | No |
| R-4 | **A** — PO pre-names a specific real business and chooses inputs expected to return it | Business: `Business A`; Anonymization: `yes` | DECIDED | No implementation required | No (any pre-session Places lookup would need its own authorization) |
| R-5 | **A** — Gate §11.5 triple as shown on the detail page | — | DECIDED | Existing mechanism sufficient | No |
| R-6 | **A** — Nearest case | — | DECIDED | Session-time procedure only | No |
| R-7a | **A** — List only | — | DECIDED | Session-time procedure only | No |
| R-7b | **A** — Nothing beyond the list | — | DECIDED | Session-time procedure only | No |
| R-7c | **B** — After all Opportunities | — | DECIDED | Session-time procedure only | No |
| R-7d | **A** — In-app feedback form not used in this session | — | DECIDED | Session-time procedure only | No |
| R-7e | **A** — Participant does not see the system result | — | DECIDED | Session-time procedure only | No |
| R-7f | **B** — Participant answers per list row | — | DECIDED | Session-time procedure only | No |
| R-8 (block) | **B** — Facilitator records the planned inputs in the block with a preplanned note | — | DECIDED | Session-time procedure only | No |
| R-8 (gate counting) | **Does not count** toward `MVP_SCOPE_BOUNDARY.md` §9 | — | DECIDED | No implementation required | No |
| R-9 | **B** — Gate §11.8 is to be amended or annotated to name the UI mechanism | Gate Audit NOT modified. Implementation/governance authorization for the Gate §11.8 amendment remains pending. | PENDING (authorization) | No implementation required; governance edit required | **Yes** — authorization to edit the Gate Audit |
| R-10 | **B** — Existing evidence is sufficient for D11 §7; D11-H §14 "Provider attempts" recorded as `not observable` | — | DECIDED | No implementation required | No |

---

## 3. Decisions

### R-1 — Facilitator/analyst identity

- **PO decision:** Option **B** — the Product Owner names themself as facilitator/analyst.
- **Recorded value:** facilitator/analyst = the Product Owner. No name or other identifier was
  supplied; none is inferred from git metadata, usernames, environment variables or repository
  history.
- **Existing fact (preparation record R-1):** under B, the PO both decides and records; no record
  forbids this, and no record addresses it.
- **Consequence:** satisfies the facilitator/analyst half of VS §9.3(b)3 once recorded at session time
  in D11-H §1 and Companion §1. D11-H and the Companion are not modified by this record.

### R-2 — Technical reviewer identity

- **PO decision:** Option **B** — the technical reviewer is the same person as the facilitator
  (Companion §1 "(if different)" wording permits it).
- **Recorded value:** technical reviewer = the Product Owner.
- **Existing fact (preparation record R-2):** under B, one person records everything; the D11 §6.4
  check is independent of the provenance implementation (A11-PO-DEC-003 §6) but not of the
  facilitator. The reviewer needs access to the account that owns the session's determinations for
  Q-1 (VS P13). No other Q-1 access route was selected, so no additional authorization arises.
- **Consequence:** satisfies the technical-reviewer half of VS §9.3(b)3 once recorded at session time.

### R-3 — Search 1 / Search 2 inputs

- **PO decision:** Option **A** — the PO specifies all inputs now for both Searches; the facilitator
  records them verbatim.
- **Recorded values (exactly as supplied by the Product Owner):**

**Search 1**

| Field | Value |
|---|---|
| Service | `Custom Website & Mobile App Development` |
| Target customer | `EdTech platforms; private universities; test-prep institutes` |
| Geography | `Mumbai Metropolitan Region (MMR)` |
| Minimum project value | `₹1,00,000` |
| Rationale | `Education providers require scalable learning management systems (LMS), student portals, and seamless mobile learning apps to capture the hybrid education market.` |
| Triggers/keywords | `LMS developer Mumbai`; `custom student portal development`; `hybrid classroom mobile app` |

**Search 2**

| Field | Value |
|---|---|
| Service | `Full-Funnel Digital Marketing & SEO Strategy` |
| Target customer | `Boutique hotels; luxury resorts; travel aggregator platforms` |
| Geography | `Pan-India` |
| Minimum project value | `₹50,000` |
| Rationale | `Hospitality and travel brands need heavy content marketing, local SEO optimization, and hyper-targeted ad campaigns to win direct bookings over major booking platforms.` |
| Triggers/keywords | `resort lead generation India`; `hospitality SEO agency`; `hotel direct booking marketing strategy` |

- **Offline validation (no external service called; no Search executed):**

| Check | Result |
|---|---|
| Search count ≤ 2 (VS §9.4) | 2 — PASS |
| `targetCustomer` values differ (D11 §3 item 7, §4 item 7) | PASS |
| Search 1 segments (split on `;`, trimmed, non-empty) | 3: `EdTech platforms` / `private universities` / `test-prep institutes` — PASS (≥2) |
| Search 2 segments (split on `;`, trimmed, non-empty) | 3: `Boutique hotels` / `luxury resorts` / `travel aggregator platforms` — PASS (≥2) |
| Service ≤ 200 chars (`core-service-profile/src/validation.ts`) | 39 / 44 — PASS |
| Target customer ≤ 200 chars | 60 / 60 — PASS |
| Geography ≤ 200 chars | 32 / 9 — PASS |
| Rationale non-empty, ≤ 1000 chars | 162 / 168 — PASS |
| Keyword items ≤ 25, each ≤ 100 chars | 3 items, max 33 / 3 items, max 39 — PASS |
| Minimum project value non-negative | PASS (both positive) |

- **Existing facts (recorded, not interpreted):**
  - The Search form has two separate list fields: *triggers* (fixed vocabulary: `WEBSITE`,
    `JOB_POST`, `LINKEDIN`, `NEWS`, `FUNDING`, `TECH_STACK`, `REVIEW`, `MANUAL`) and free-text
    *keywords*. None of the supplied "Triggers/keywords" items is in the trigger vocabulary; the
    triggers field is optional.
  - The form's minimum-value field is a numeric rupee input; the supplied values are recorded as
    written (Indian digit grouping).
  - Keywords are appended to the production Places query (`googlePlacesProvider.ts:11–15`).
  - Values must not be tested with a Search, Places call or provider call before the session.

### R-4 — Same business across the two Searches

- **PO decision:** Option **A** — the PO pre-names a specific real business and chooses inputs
  expected to return it, using knowledge from outside the system (no Places lookup).
- **Recorded values (exactly as supplied):**
  - Business: `Business A` (real name as supplied redacted in revision 6, §10.2)
  - Anonymization: `yes`
- **Scope:** a pre-planned cross-Search target only. The business was not looked up, and no Places,
  Google Search, homepage or other external call was made. This record does **not** claim that the
  business appears in either Search's results; any overlap can be established only during the
  separately authorized validation session.
- **Existing facts:** overlap is not guaranteed (Places ranking is outside the system's control). The
  production Places query is `"<service> for <targetCustomer> in <geography>"` plus keywords
  (`packages/core-discovery/src/googlePlacesProvider.ts:11–15`); for the R-3 inputs the two Searches
  differ in service, target customer, geography and keywords, so their query strings differ in every
  component. If overlap is not reached within two Searches, VS §9.4 requires the result to be
  recorded as observed; a third Search needs new authorization.
- **Not specified by the supplied instruction:** the anonymized label to be used, and which records
  the anonymization applies to. No label is invented here (see §4 item 3).

### R-5 — D11 §3.1 trace-evidence definition

- **PO decision:** Option **A** — the §3.1 trace is the Gate §11.5 triple as shown on the Opportunity
  detail page:
  1. persisted `target_customer` / `target_segments`;
  2. a `segment_results` count equal to the segment count;
  3. at least one `ai_usage_events` row for the prospect.
- **Kept distinct:** provider/model/request_kind (R-9, D11 §7) and Determination/Search/Prospect IDs
  (VS §9.7, Companion §2) are recorded under their own requirements and are not added to the §3.1
  trace by this decision.
- **Existing fact:** all three elements are exposed by the existing detail page
  (`apps/web/app/(client-finder)/opportunities/[id]/page.tsx`), covered offline by `page.test.ts`;
  not live-observed. The count-match inference is the one Gate §5 row 6 describes.
- **Consequence:** existing mechanism sufficient; no database query (VS §9.4 unchanged).

### R-6 — Coverage-9 judgment

- **PO decision:** Option **A** — the Gate §5 row 9 / D11 §6.2 "supporting-only → UNKNOWN" case is
  satisfied by an UNKNOWN where the homepage is uninformative but other, non-citable context (for
  example, the company name) suggests the category.
- **Existing fact:** recognizable only at session time and only if such a business occurs; the
  facilitator records the judgment in D11-H §9/§13. A failed homepage fetch persists no determination
  and is not this case.
- **Consequence:** session-time procedure only.

### R-7 — Participant procedure (P8-PO-DEC-001 §3.6)

P8-PO-DEC-001 Option A (procedure only) and its §3.2 blinding list are unchanged. No UI change.

| ID | PO decision | Recorded procedure |
|---|---|---|
| R-7a | **A** — List only | The participant judges from the label-free ranked list only (rank, name, score/band, recommended offer). |
| R-7b | **A** — Nothing beyond the list | The facilitator presents nothing beyond the list before the participant answers. |
| R-7c | **B** — After all Opportunities | All participant answers are captured before any Opportunity detail page is opened. |
| R-7d | **A** — Not used | The in-app feedback form is not used in this session; no feedback rows are written through it. |
| R-7e | **A** — No | The participant is not shown the system result after answering; D11-H §20 reaction/disagreement fields stay blank. |
| R-7f | **B** — Per list row | The participant answers per list row; the facilitator records each row's Opportunity ID (from the Review link) and its Search ID in the Companion. Two answers for the same business are possible. |

The Opportunity ID ↔ Determination ID join stays in D11-H §19 / Companion §2 (P8 §4).

### R-8 — Template service-definition block and MVP §9 gate counting

Recorded as two separate decisions.

- **R-8 (block) — PO decision:** Option **B** — the facilitator records the planned inputs in the
  template block "Service definition used (§3 stage 1 — as entered by the participant, not
  assumed)", with a facilitator note that they were preplanned. The template is not modified
  (D11 §9). Existing fact: the heading is then not literally met.
- **R-8 (gate counting) — PO decision:** this session's template copy **does not count** toward the
  `MVP_SCOPE_BOUNDARY.md` §9 real-user validation gate. `MVP_SCOPE_BOUNDARY.md` is not modified.

### R-9 — Gate §11.8 wording

- **PO decision:** Option **B** — a governance ruling that Gate Audit §11.8 ("plan to query
  `ai_usage_events` (provider, model, request_kind) per prospect") is to be amended or annotated to
  name the application-UI mechanism.
- **Status:** **PENDING (authorization).** Implementation/governance authorization for the Gate §11.8
  amendment remains pending. The Gate Audit is **not** modified by this record, and Gate §11.8 text is
  unchanged.
- **Existing facts:** P8-PO-DEC-001 §3.5 rules the existing application UI / authorized session
  mechanism is the evidence-capture mechanism; direct human database queries remain NOT AUTHORIZED
  (VS §9.4; P8 §5). Provider, model, request_kind, event timestamp and the fallback indication are
  shown on the detail page (offline `page.test.ts`; not live-observed).

### R-10 — Failed provider attempts with no `ai_usage_events` row

- **PO decision:** Option **B** — existing evidence is sufficient for D11 §7; D11-H §14 "Provider
  attempts" is recorded as `not observable`.
- **Consequence:** no new evidence mechanism; provider instrumentation and retry behavior are not
  modified. No implementation required.
- **Existing facts (kept separate):**
  1. *Successful invocations:* one `ai_usage_events` row per model invocation that returned usage
     (`researcher.ts:243`), shown on the detail page.
  2. *Failed attempts:* a call that throws is not metered (`researcher.ts:104–108`, R-29); no row, no
     per-attempt log.
  3. *Job-level attempts:* Research retries up to `maxAttempts: 3` within a call
     (`researcher.ts:143`); a Research error fails the Search job, which retries up to
     `MAX_SEARCH_ATTEMPTS = 3` (`packages/core-search/src/retry.ts:13`); `attempts` and, on FAILED,
     `lastError` are shown on the Search page.
  4. *Configured provider:* the configured primary provider is not persisted (`page.tsx:84–87`); it is
     the recorded non-secret configuration under VS §9.3(b)2. No fallback is configured.

---

## 4. Remaining open questions

Classified in revision 3 by read-only inspection of the governing records. No option is selected
here.

### 4.1 R-9 — Gate §11.8 amendment authorization

- **Records:** no explicit Product Owner authorization to edit the Gate Audit exists in the governing
  records or in the working session.
- **Status:** **PENDING — requires PO authorization.** Implementation/governance authorization for
  the Gate §11.8 amendment remains pending. The Gate Audit is not modified.
- **Decision required:** an explicit authorization to amend or annotate Gate Audit §11.8, stating the
  permitted edit.

### 4.2 Template Search-ID mapping

- **Records:** the per-answer join is specified — Opportunity ID is the template correlation key
  (D11 §9; A-12 facilitator-record decision §7.3), and each Companion §2 row carries its Search ID
  (A-12 §7.3; R-7f B). The content of the template's single "Search reviewed → Search ID" field for
  a list spanning two Searches is **not** specified by any record.
- **Status:** **REQUIRES PO DECISION.** Prepared, unranked, as TPL-SEARCH-ID-PO-DEC-001
  (`PATH_2_CATEGORY_PLAUSIBILITY_TEMPLATE_SEARCH_ID_MAPPING_PRODUCT_OWNER_DECISION_PREPARATION.md`).
  That record also notes a related finding: the template's single "Service definition used" block
  versus the two R-3 service definitions under R-8 (block) = B.

### 4.3 R-4 anonymization label and scope

- **Records:** anonymization rules in the governing records concern the **participant** only
  (template l.19 "anonymized — never a real name/email"; D11 §3, §4 item 9; VS §9.6; Gate §11.9). No
  record defines how a **business** is anonymized.
- **Fields that would carry the business identity at session time:** template per-opportunity
  "Business shown"; D11-H §3 "Company" and §17 "Real-world business"; source URLs and quotes in
  D11-H §12 and the Companion §4 blocks.
- **Status:** **REQUIRES PO DECISION.** Open question: what anonymized label represents
  `Business A` (real name redacted in revision 6, §10.2), and in which records/fields it replaces the name (including
  whether it extends to source URLs/quotes and to this decision record, which records the name as
  supplied). No label is invented.

### 4.4 R-11 — implementation baseline

- **Records:** no Product Owner selection exists. Preparation record R-11 options remain: **A.**
  commit the existing working tree before the session and record the commit (requires explicit
  commit authorization); **B.** keep it uncommitted and record HEAD plus a digest of `git diff` and
  of the untracked implementation files at session start; **C.** keep D11-H §2 as prefilled.
- **Status:** **PENDING — requires PO decision** (A / B / C, and commit authorization if A). The
  working tree is not altered.

### 4.5 Retry-rule conflict

- **Records:** VS §9.4 is the only governing session ruling on retries: "The production retry/repair
  limits apply unchanged". The zero-retry rule was stated as a Product Owner instruction in the
  working session; it is not recorded in any governing record and does not amend VS §9.4.
  D11I-EVID-002 disabled SDK retries (`maxRetries: 0`) for a one-request readiness probe only, by
  injecting a client and bypassing `researchLead`; that is not the production session path VS §9.4
  authorizes. No record reconciles the two.
- **Code facts:** Research `maxAttempts: 3` (`researcher.ts:143`), Search-job
  `MAX_SEARCH_ATTEMPTS = 3` re-running Discovery and Research (`core-search/src/retry.ts:13`), and
  the production SDK client with default retries (`anthropicModel.ts:62`). None is configurable to
  zero without a code change, which VS §9.10 withholds.
- **Status:** **REQUIRES PO DECISION — governance blocker.** Decision required: whether the
  zero-retry rule governs the authorized session (amending VS §9.4 for the session) or VS §9.4
  stands; whether repair rounds and Search-job re-runs count as retries; and, if retries must be
  reduced, a separate implementation authorization. No retry configuration or code is changed.

### 4.6 Session-time / runtime prerequisites (not governance items)

Not performed or checked here; verified by the operator/facilitator only at session time
(VS §9.3(b)):

- web application running; worker running;
- Postgres reachable; migrations 0027 and 0028 applied;
- provider configuration recorded (non-secret; VS §9.3(b)2);
- Google Places key/quota confirmed from account/console information, not a test call;
- participant arranged by the facilitator (VS §9.6);
- D11-H and Companion live-session fields blank and available for recording (VS §9.3(b)6).

---

## 5. Implementation consequences

| ID | Consequence |
|---|---|
| R-1, R-2 | No implementation required |
| R-3, R-4 | No implementation required |
| R-5 | Existing mechanism sufficient (detail page) |
| R-6 | Session-time procedure only |
| R-7a–R-7f | Session-time procedure only |
| R-8 (block) | Session-time procedure only |
| R-8 (gate counting) | No implementation required |
| R-9 | No implementation required; separate authorization required for the Gate Audit edit |
| R-10 | No implementation required (existing evidence; limitation recorded) |

```text
Application implementation required = NO (for all selections recorded)
Schema change required ............. = NO
Migration required ................. = NO
New dependency required ............ = NO
New AI agent required .............. = NO
```

Library / AI-agent reuse check (read-only): the selections rely only on existing mechanisms — the
Opportunity detail page, the Search page, `listAiUsageEvents` (`@acos/core-ai-usage`), the Search
form and the existing list page. New library required: NO. New AI agent required: NO.
Implementation authorization required: NO for the recorded selections.

---

## 6. Session authorization boundary

```text
This decision record does not authorize the validation session.
It does not authorize participant contact.
It does not authorize provider or Places calls.
It does not authorize database access.
It does not authorize live fetching.
It does not authorize implementation unless an existing decision explicitly says implementation is authorized.
```

It also does not authorize: provider retries or retry-policy changes; Google Search; SQL;
migrations; determinations; browser/live validation; generating or assigning a Session ID; E1/E2/E3;
A-11 closure; or any edit to the Gate Audit, D11, D11-H, the Companion Record, VS-PO-DEC-001,
P8-PO-DEC-001, SESSION-ID-PO-DEC-001, the participant template or `MVP_SCOPE_BOUNDARY.md`.

VS-PO-DEC-001 Option C remains the governing session authorization, within its §9 limits. The
session may not start until every VS §9.3(b) prerequisite is met and recorded.

---

## 7. Status

```text
VS-READY-PO-DEC-001 ....... PARTIALLY DECIDED
R-1, R-2 .................. DECIDED (Product Owner = facilitator/analyst = technical reviewer)
R-3 ....................... DECIDED (A; Search 1 and Search 2 inputs recorded)
R-4 ....................... DECIDED (A; Business A; anonymization yes)
R-5, R-6 .................. DECIDED (A, A)
R-7a–R-7f ................. DECIDED (A, A, B, A, A, B)
R-8 ....................... DECIDED (block B; does not count toward MVP §9)
R-9 ....................... PENDING — option B selected; Gate §11.8 amendment authorization pending
R-10 ...................... DECIDED (B; D11-H §14 Provider attempts = not observable)
Template Search-ID ........ OPEN — prepared as TPL-SEARCH-ID-PO-DEC-001 (pending)
R-4 anonymization ......... OPEN — label/scope requires PO decision (§4.3)
Retry-rule conflict ....... OPEN — governance blocker (§4.5)
R-11 ...................... NOT IN THIS ROUND — PENDING
Validation session ........ NOT READY — NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

This is the revision 3 status, retained for traceability. It is superseded in part by revision 4;
the current status is in §8.6.

---

## 8. Revision 4 — Second decision round (2026-09-29)

Product Owner selections given in the working session on 2026-09-29, recorded under that
authorization. Options were presented unranked. Where a required value was supplied only as a
placeholder (for example `[exact literal]`), no value is recorded and the item stays PENDING.

### 8.1 R-9 — Gate §11.8

| Field | Value |
|---|---|
| Decision ID | VS-READY-PO-DEC-001 / R-9 |
| Selected option | **B — Amend/annotate Gate** (re-selected in this round) |
| Exact PO ruling | `R-9: B`. Gate Audit edit: supplied as the placeholder `[exact permitted edit]`; no permitted edit stated. |
| Status | **B SELECTED — GATE AUDIT EDIT AUTHORIZATION PENDING** |
| Evidence mechanism | Unchanged: the authorized application UI (P8-PO-DEC-001 §3.5) |
| Gate Audit editing authorized? | **No.** The Gate Audit is not modified. |
| Database access | Remains NOT AUTHORIZED (VS §9.4; P8 §5). No query is authorized under this option. |
| Implementation impact | None |
| Remaining | An explicit authorization stating the exact permitted Gate Audit §11.8 edit |

### 8.2 R-11 — Implementation baseline

| Field | Value |
|---|---|
| Decision ID | VS-READY-PO-DEC-001 / R-11 |
| Selected option | **B — HEAD + fingerprints** |
| Exact PO ruling | `R-11: B` — record HEAD, the working-tree status/diff fingerprint and the relevant uncommitted implementation baseline; no commit; no code change |
| Status | **DECIDED** |
| Commit authorized? | **No.** Nothing is committed, staged, reverted or cleaned. |
| Implementation impact | None |

**Decision-time baseline (captured read-only, 2026-09-29):**

| Item | Value |
|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Branch | `phase-17-r34-worker-orchestration` |
| Staged | none |
| Tracked modifications | 52 files, +1732 / −65 (`git diff --stat`) |
| sha256 of `git diff` | `3ce19e2b00abd8e06fa70d0f517a15acf5ec3edcfbcfe6324cb04e59efc68a2e` |
| sha256 of `git diff` excluding `apps/web/tsconfig.tsbuildinfo` (build artifact; changes on any build) | `e97de6cc4927c97bb320fc420a57fe90becde32f0cc765720ee81fd20727594c` |
| sha256 of `git diff --name-only` (52 paths) | `5286577a72e21a80a355a9e10dcc034d743303e0e4b86d6a39ef2edaba7c7501` |
| Untracked implementation files (14; excludes `requirement/`, `.claude/`, `CLAUDE.md`) — aggregate | `2a991439e6845b3cf8d16c2a2378d54b6e7ea301619de5e3cb45d47804d0b87d` |

Aggregate method: the untracked file list from `git ls-files -z --others --exclude-standard`, sorted,
each hashed with `shasum -a 256 <path>`; the aggregate is the sha256 of that listing.

| Untracked implementation file | sha256 |
|---|---|
| `apps/web/app/(client-finder)/opportunities/[id]/page.test.ts` | `a86e4f66d118eb32e02079b7341f63c0442bbc47c4a130ec090025cc69731d85` |
| `apps/web/app/api/category-plausibility/determinations/[id]/source-documents/route.ts` (Q-1) | `5c840d239559f329dc1ce69f3cb136e9391d8c25496eee9f81940e29a55966c9` |
| `packages/core-research/src/anthropicModel.test.ts` | `a26fee504ec9e87fd62ce834332192df78314fdedad0a483aa0510fa0a936f6f` |
| `packages/core-research/src/categoryPlausibility.test.ts` | `17a881998569aa6b614f17c8170b89ef61458edeed82c720574390ba694e4ec4` |
| `packages/core-research/src/categoryPlausibility.ts` | `6fcbdb9fa73200ff925e5055bdc088461eb3a3ba7f98168a80ed17fdbba64106` |
| `packages/core-research/src/categoryPlausibilityPgRepository.ts` | `e2e350bc28b97389708f0f4052d3f508ff2e1fb765ea6f41059552e16adebca5` |
| `packages/core-research/src/categoryPlausibilityRepository.ts` | `e4a5ecefd12e118e95c24905125e824ed8518b58804b20b917a5f782d555ad74` |
| `packages/core-research/src/sourceCapture.test.ts` (M-2) | `ad96395dfe69f82337b000d0d89488a6572827a2e8b04caa15767b4523e7c695` |
| `packages/core-research/src/sourceDocumentReview.test.ts` | `53405279c262241b08c2710865e7f9c386c6a9f4762805c4b66bf7d2342f2afc` |
| `packages/core-research/src/sourceDocumentReview.ts` (Q-1) | `caab8bb02c2db1c864b9816d332785792f5d1948dce069dfab737f92e7fe2214` |
| `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql` | `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508` |
| `packages/db/prisma/migrations/0028_category_plausibility_source_documents/migration.sql` | `bd8777158f84bcfefbde4ad0dde33beeb0c47d00bf91db18ff35f09d5ced6986` |
| `tests/integration/category-plausibility-source-capture.integration.test.ts` | `1d94e65c37b387696871aa99facf269621d61949695304b020223fe721caa402` |
| `tests/integration/category-plausibility-source-review.integration.test.ts` | `bf1937eca1f558c1c1fc773d87520d65a2a979d41b997a436a247791222dada6` |

The evidence-page implementation (`opportunities/[id]/page.tsx`) and the modified M-2/Research
sources are tracked files and are covered by the `git diff` fingerprints.

**Recorded, not resolved:** the preparation record's option B text reads "record HEAD plus a digest
… **at session start**". This round's option B wording records them now. Whether a re-capture at
session start is also required is not stated by the Product Owner ruling. Whether migrations 0027
and 0028 are *applied* remains an operator check at session time (VS §9.3(b)1).

### 8.3 Retry conflict

| Field | Value |
|---|---|
| Decision ID | VS-READY-PO-DEC-001 / RETRY |
| Selected option | **C — Split boundary** |
| Exact PO ruling | "Facilitator/reviewer-initiated external-call retries: prohibited. Application-internal retry/repair remains unchanged: 1. Anthropic SDK client retries 2. Research maxAttempts = 3, including provider-error retries and repair rounds 3. Search-job MAX_SEARCH_ATTEMPTS = 3, including Discovery/Places + Research re-runs" |
| Repair rounds count as retries? | **Yes** (PO ruling) |
| Search-job re-runs count as retries? | **Yes** (PO ruling) |
| Status | **DECIDED** |
| Implementation impact | None. No retry configuration or code is changed. |
| Authorization required | None for this option |

**Existing facts:** VS §9.4 already requires that "The production retry/repair limits apply
unchanged" and permits "No manual, ad-hoc or repeated Research invocation outside the worker
pipeline". Repair rounds are observable as `request_kind = 'repair'` usage rows on the detail page;
Search-job re-runs are observable through the Search page `attempts` value.

**Recorded, not resolved:** the ruling classifies repair rounds and Search-job re-runs as retries
while keeping both unchanged and permitted as application-internal behavior. No record states any
further consequence of that classification (for example, whether each such retry must be recorded
in D11-H §14).

### 8.4 R-4 — Business anonymization

| Field | Value |
|---|---|
| Decision ID | VS-READY-PO-DEC-001 / R-4 (anonymization) |
| Anonymized label | `Business A` |
| Participant-facing material | YES — uses the label |
| D11-H / Companion | YES — uses the label |
| Decision/preparation records | YES — uses the label |
| Source URLs, evidence/quotes, internal facilitator/reviewer notes | YES — uses the label |
| Status | **DECIDED** (label and scope) |
| Implementation impact | None |

**Recorded, not resolved (PENDING):**

1. **Application to existing text.** Revision 2 of this record contains the real business name, as
   supplied at that time (§2 R-4 row, §3 R-4, §7). The ruling places decision records in scope for the
   label, but no explicit instruction to redact the existing occurrences was given in this round, so
   they are not edited. New text in revision 4 uses `Business A` only.
2. **Label-to-name key.** With every listed surface using the label, no record is designated to hold
   the `Business A` ↔ real-name correspondence that the facilitator needs to plan R-4 option A.
3. **Source URLs and quotes.** D11 §6 item 1 requires a real `sourceUrl` and verbatim `sourceQuote`;
   VS §7 item 7 lists the source URL as capture metadata for E1; the §6.4 spot-check compares the
   quote against the persisted M-2 source (VS §9.5). The persisted rows and the Q-1 response keep the
   real URL and text. How labelled URLs/quotes in D11-H §12 and the Companion §4 blocks remain
   traceable to that evidence is not stated.

### 8.5 Template Search-ID mapping and Service-definition block

| Item | Selected option | Required value | Status |
|---|---|---|---|
| Template Search-ID (TPL-SEARCH-ID-PO-DEC-001) | B — Combined, neutral literal | Exact literal — supplied only as the placeholder `[exact literal]` | **PENDING** — REQUIRED VALUE = exact Search-ID literal |
| Template Service-definition block | B — One combined text | Exact combined description — supplied only as the placeholder `[exact text]` | **PENDING** — REQUIRED VALUE = exact PO-approved combined service description |

Per the recording instructions for these two items, no standalone decision record is created and
the TPL-SEARCH-ID preparation record is not modified. The template is not modified. R-8 (block) = B
is unchanged.

### 8.6 Status after revision 4

```text
VS-READY-PO-DEC-001 ....... PARTIALLY DECIDED
R-1 … R-8, R-10 ........... DECIDED (as in §2; unchanged)
R-9 ....................... B SELECTED — GATE AUDIT EDIT AUTHORIZATION PENDING
R-11 ...................... DECIDED (B; decision-time fingerprints in §8.2)
Retry conflict ............ DECIDED (C; repair rounds and Search-job re-runs count as retries)
R-4 anonymization ......... DECIDED (label `Business A`, all listed surfaces); application/key/URL items PENDING (§8.4)
Template Search-ID ........ PENDING (B; exact literal missing)
Template Service block .... PENDING (B; exact combined text missing)
Validation session ........ NOT READY — NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

This revision authorizes no validation session, participant contact, provider or Places call,
Google Search, live fetch, database access, SQL, migration, Session ID, determination, commit, code,
schema, configuration or dependency change, and no edit to the Gate Audit, D11, D11-H, the Companion
Record, the template, VS-PO-DEC-001, P8-PO-DEC-001 or SESSION-ID-PO-DEC-001.

---

## 9. Revision 5 — Third decision round (2026-09-29)

Product Owner rulings given in the working session on 2026-09-29, recorded under that authorization.
Values are recorded exactly as supplied. Earlier sections are not rewritten; this section supersedes
the §8 status where stated.

### 9.1 R-9 — Gate §11.8 edit authorization

| Field | Value |
|---|---|
| Selected option | **B — Amend/annotate Gate** |
| Exact PO authorization | "Authorize the bounded UI-reading wording already described." |
| Bounded wording referenced | The bounded edit described by the Product Owner in the second decision round: replace/annotate the phrase "plan to query `ai_usage_events` (provider, model, request_kind) per prospect" so that it permits the authorized application UI to expose and capture the same provider/model/request_kind evidence, while preserving the underlying evidence requirement and without authorizing direct human database access. No other Gate Audit wording may be changed. |
| Scope as recorded | Only that bounded wording: reading provider/model/request_kind from the authorized application UI satisfies Gate §11.8. |
| Database access | Direct human database queries remain **NOT AUTHORIZED** (VS §9.4; P8 §5). No other database access or evidence mechanism is authorized. |
| Gate Audit edit performed? | **No.** Recording this authorization is not the edit. The Gate Audit is unchanged; the authorized edit is a separate governance step. |
| Status | **DECIDED — BOUNDED GATE AUDIT EDIT AUTHORIZED, NOT PERFORMED** |
| Implementation impact | None |

### 9.2 Template Search-ID and Service-definition block

Recorded in the standalone decision record
`PATH_2_CATEGORY_PLAUSIBILITY_TEMPLATE_SEARCH_ID_MAPPING_PRODUCT_OWNER_DECISION.md`
(TPL-SEARCH-ID-PO-DEC-001):

- Search ID field: **B**, literal `MULTI`; authoritative per-answer Search ID = Companion §2.
- Service-definition block, Service field: **B**, the exact PO-approved combined text recorded there.
- Open in that record: how the block's Target customer, Geography and Minimum project value fields
  are completed (TPL-SEARCH-ID-PO-DEC-001 §4.3).

The template is not modified.

### 9.3 R-4 — Anonymization follow-ups

| Field | Exact PO ruling |
|---|---|
| Anonymized label | "Business A" |
| Redact earlier revisions | YES |
| Mapping location | "Local non-versioned workspace environment variables" |
| URL/quote traceability | "Retain source URL domains and hash-masked deep links with sanitized, generic descriptive fragments replacing identifying text strings." |

**Governance ruling vs. future evidence handling.** This section records the ruling only. The URL/quote
rule and the label apply to evidence handling during a separately authorized session; nothing is
applied to evidence here.

**Redaction of earlier revisions — authorized, NOT performed.** The real business name appears in
revision 2 text of this record (§2 R-4 row, §3 R-4, §7). No established record procedure requires
the historical text to be rewritten in this step, so it is not edited now. Performing the authorized
redaction is a separate step. New text from revision 4 onward uses `Business A` only.

**Mapping.** The `Business A` ↔ real-name mapping is not created, populated or recorded by this
record, and is not placed in source control. No secret store, dependency, schema or application
mechanism is introduced. Existing fact: `.env` and `.env.local` are listed in the repository
`.gitignore` (lines 12–13).

**Recorded, not resolved:**

1. Whether a retained source URL **domain** can itself identify the business is not addressed by the
   ruling.
2. D11 §6 item 1 requires a verbatim `sourceQuote`, and the §6.4 spot-check compares the quote against
   the persisted M-2 source (VS §9.5). The persisted rows and the Q-1 response keep the real URL and
   text; the ruling governs what is written into the session records. How a sanitized fragment in
   D11-H §12 / Companion §4 is matched back to the persisted verbatim quote is not stated.

### 9.4 Retry logging

| Field | Value |
|---|---|
| Exact PO ruling | Repair rounds / Search-job re-runs must **NOT** be recorded individually in D11-H §14. |
| Retry boundary (unchanged from §8.3) | Facilitator/reviewer-initiated external-call retries are prohibited for the session. Application-internal retry/repair behavior remains unchanged across: 1. Anthropic SDK client retries; 2. Research `maxAttempts = 3`, including provider-error retries and repair rounds; 3. Search-job `MAX_SEARCH_ATTEMPTS = 3`, including Discovery/Places + Research re-runs. |
| Classification (unchanged from §8.3) | Repair rounds and Search-job re-runs count as retries for the session's retry-rule classification; neither is individually logged in D11-H §14. |
| Relationship to R-10 | Consistent with R-10 = B (D11-H §14 "Provider attempts" = `not observable`). |
| Status | **DECIDED** |
| Implementation impact | None. No retry implementation is changed. |

### 9.5 R-11 — Session-start re-capture

| Field | Value |
|---|---|
| Existing selection | R-11 = **B** — HEAD + fingerprints; no commit; no code change (§8.2) |
| Exact PO ruling | "Re-capture fingerprints at session start: YES." |
| Meaning as recorded | The §8.2 baseline is a decision-time reference, not the final session-start fingerprint. The same baseline/fingerprint procedure (§8.2 method) is repeated at the beginning of the authorized session. |
| Performed now? | **No.** The session-start re-capture is a session-time step. |
| Status | **DECIDED** |

### 9.6 Not decided by this revision

This revision does not decide participant identity beyond R-1/R-2, session execution authorization,
P5 runtime readiness, participant preparation, live-source availability, Session ID assignment,
Gate §11.8 evidence collection, or E1 re-authorization. VS-PO-DEC-001 remains the governing session
authorization, within its §9 limits and §9.3(b) prerequisites; this record grants no session
authority.

### 9.7 Status after revision 5

```text
VS-READY-PO-DEC-001 ....... DECIDED FOR R-1 … R-11 AND RETRY — WITH OPEN FOLLOW-UPS BELOW
R-1 … R-8, R-10 ........... DECIDED (as in §2; unchanged)
R-9 ....................... DECIDED (B) — bounded Gate §11.8 edit AUTHORIZED, NOT PERFORMED
R-11 ...................... DECIDED (B) — session-start re-capture YES
Retry ..................... DECIDED (C) — no individual D11-H §14 logging of repair rounds / job re-runs
R-4 anonymization ......... DECIDED — `Business A`; redaction of earlier revisions AUTHORIZED, NOT PERFORMED
Template Search-ID ........ DECIDED — TPL-SEARCH-ID-PO-DEC-001 (B, `MULTI`)
Service block ............. Service field DECIDED (TPL-SEARCH-ID-PO-DEC-001 §4.2); other fields OPEN (§4.3)
Open follow-ups ........... Gate §11.8 edit (authorized, separate step); redaction of earlier revisions
                            (authorized, separate step); service-block Target customer / Geography /
                            Minimum value; URL-domain identifiability; sanitized-fragment ↔ verbatim
                            quote matching (§9.3)
Validation session ........ NOT READY — NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

This is the revision 5 status, retained for traceability. It is superseded by §10.5.

## 10. Revision 6 — Authorized governance steps and reconciliation (2026-09-29)

This revision carries out two steps already authorized in revision 5 and records where the revision 5
open follow-ups were decided. It makes no new Product Owner selection and does not reinterpret any
decision. No code, test, schema, migration, configuration, dependency, template, D11, D11-H or
Companion change is made.

### 10.1 Gate §11.8 — bounded edit performed

| Field | Value |
|---|---|
| Authorization | §9.1 (R-9 = B): "Authorize the bounded UI-reading wording already described." |
| File | `PATH_2_CATEGORY_PLAUSIBILITY_D11_LIVE_VALIDATION_GATE_AUDIT.md`, §11 item 8 only |
| Edit | The phrase "plan to query `ai_usage_events` (provider, model, request_kind) per prospect" was replaced by reading provider, model and request_kind from the authorized application UI. The item states that the evidence requirement is unchanged and that direct human database queries are not authorized. The previous wording is quoted in an inline annotation citing §9.1. The rest of item 8 ("With no fallback configured …") and all other Gate Audit wording are unchanged. |
| Database access | Remains **NOT AUTHORIZED** (VS §9.4; P8 §5) |
| Status | **PERFORMED** |

### 10.2 Redaction of earlier revisions — performed

| Field | Value |
|---|---|
| Authorization | §9.3: "Redact earlier revisions: YES"; label "Business A" (§8.4) |
| Occurrences replaced | 4 in this record, all revision 2 text: §2 R-4 row; §3 R-4 "Recorded values"; §4.3; §7 R-4 status line |
| Replacement | `Business A`. §3 R-4 and §4.3 carry an inline redaction note. No other wording is changed. |
| Mapping | Not created, recorded or placed in any file. `.env` / `.env.local` not touched. |
| Other files | A repository-wide search found no other file containing the real name. |
| Status | **PERFORMED** |

The historical descriptions in §8.4 item 1 and §9.3 ("Revision 2 of this record contains the real
business name") describe the state before this revision and are retained unedited.

### 10.3 Reconciliation — revision 5 open follow-ups

| Revision 5 follow-up (§9.7) | Decided in | Recorded ruling (see the decision record for exact text) |
|---|---|---|
| Service block — Target customer / Geography / Minimum value | SVC-BLOCK-PO-DEC-001 (`PATH_2_CATEGORY_PLAUSIBILITY_SERVICE_BLOCK_PRODUCT_OWNER_DECISION.md`) | B — combined text: `EdTech platforms; private universities; test-prep institutes; Boutique hotels; luxury resorts; travel aggregator platforms`; `Mumbai Metropolitan Region (MMR); Pan-India`; `₹1,00,000; ₹50,000` |
| URL-domain identifiability | URL-DOMAIN-PO-DEC-001 (`PATH_2_CATEGORY_PLAUSIBILITY_URL_DOMAIN_PRODUCT_OWNER_DECISION.md`) | C — conditional: retain non-identifying domains; identifying domain → `https://business-a.example/<hash-masked-deep-link-fragment>` |
| Sanitized-fragment ↔ verbatim quote matching | EVID-TRACE-PO-DEC-001 (`PATH_2_CATEGORY_PLAUSIBILITY_EVIDENCE_TRACEABILITY_PRODUCT_OWNER_DECISION.md`) | B — `SRC=<M-2 source-document ID>; SHA256=<content hash>; DET=<Determination ID>; SEG=<segment position>; EV=<evidence position>` |
| Gate §11.8 edit | §10.1 | Performed |
| Redaction of earlier revisions | §10.2 | Performed |

These are unchanged: the Search ID field `MULTI` and the combined Service text (TPL-SEARCH-ID-PO-DEC-001
§2, §4.2); retry (§8.3, §9.4); R-10 (§3); R-11 = B with session-start re-capture (§8.2, §9.5).

### 10.4 Records not edited

Earlier records that show these items as open are not edited, and their status lines are historical
as of their dates:
- P8-PO-DEC-001 (Gate §11.8 wording "OPEN");
- TPL-SEARCH-ID-PO-DEC-001 §4.3 / §7 (service block other fields "OPEN");
- the D11 Readiness Closure Audit (provider-field capture plan);
- VS-PO-DEC-001 §9.3(b) item 5 (P8 design including the §11.8 capture plan, a session-time
  facilitator step).

This section is the reconciliation point.

### 10.5 Status after revision 6

```text
VS-READY-PO-DEC-001 ....... DECIDED — GOVERNANCE FOLLOW-UPS CLOSED
R-1 … R-8, R-10 ........... DECIDED (as in §2; unchanged)
R-9 ....................... DECIDED (B) — Gate §11.8 bounded edit PERFORMED (§10.1)
R-11 ...................... DECIDED (B) — session-start re-capture YES (session-time; not performed)
Retry ..................... DECIDED (C) — unchanged (§8.3, §9.4)
R-4 anonymization ......... DECIDED — `Business A`; earlier-revision redaction PERFORMED (§10.2)
Template Search-ID ........ DECIDED — TPL-SEARCH-ID-PO-DEC-001 (B, `MULTI`)
Service block ............. DECIDED — Service: TPL-SEARCH-ID-PO-DEC-001 §4.2; other fields: SVC-BLOCK-PO-DEC-001
URL domain ................ DECIDED — URL-DOMAIN-PO-DEC-001 (C)
Evidence traceability ..... DECIDED — EVID-TRACE-PO-DEC-001 (B)
Session-time only ......... P5 runtime (web app, worker, Postgres, migrations 0027/0028, provider and
                            Places configuration/quota); P7 participant arrangement; Session ID
                            assignment; P8 execution; D11-H / Companion live fields; session-start
                            fingerprint re-capture
Validation session ........ NOT READY — NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
```

## STOP
