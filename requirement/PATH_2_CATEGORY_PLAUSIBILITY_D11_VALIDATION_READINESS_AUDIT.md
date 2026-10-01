# Path 2 — Research-Level Category Plausibility

## D11 Validation-Readiness Audit

```text
DOCUMENT TYPE: READ-ONLY VALIDATION-READINESS AUDIT
STATUS: AUDIT ONLY — NO PRODUCTION CODE, TEST, MIGRATION, SCHEMA, CONFIGURATION,
        PRD, UI, TEMPLATE, OR GOVERNANCE DOCUMENT WAS MODIFIED. NO LIVE
        PROVIDER/API CALL WAS MADE. THIS DOCUMENT IS THE ONLY FILE CREATED.
```

Every claim below was re-checked against the repository at HEAD
`5992b82b9adff492c480442d68a954f2a03bfb28`. Where the draft this audit was
based on was inaccurate or incomplete, the correction is marked
**[VERIFIED CORRECTION]**.

---

### 1. Audit Scope

A read-only D11 validation-readiness audit, run after the Path 2
implementation and after the D8 provider pass-through test gap was closed
(`PATH_2_CATEGORY_PLAUSIBILITY_D8_GAP1_CLOSURE_AUDIT.md`, GAP 1 CLOSED).

It evaluates whether the implementation is ready to enter the D11 validation
process defined by `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md`
(D11-A … D11-I, all DECIDED).

No production behavior, test behavior, migration, configuration, PRD, UI, or
governance decision is changed by this audit. D11 remains a validation gate;
this audit does not replace the required live and human validation session.

---

### 2. Governing D11 Requirements

From the locked D11 decision (re-read in this task):

* **D11-A:** requirements are split into MANDATORY (must be seen in a live run), STRUCTURAL (code review is enough) and OBSERVATIONAL (recorded, but not a gate).
* **D11-B:** technical tier = Discovery → Research → persisted determination → Qualification. Full sign-off also requires the D10 UI.
* **D11-C:** a real participant, unprimed. The facilitator correlates the system result afterward.
* **D11-D:** no numeric threshold. Nine categorical coverage items apply (§4 of D11): MATCH, MISMATCH, UNKNOWN, multi-segment, first-party evidence, genuinely insufficient evidence, two-Search attribution, fallback (observational only), and one real participant.
* **D11-E:** manual spot-check of at least one OBSERVED claim per session.
* **D11-F:** one naturally used provider is enough, provided the D9 §9 fields are recorded. Structured-output capability for each configured provider is an *implementation* precondition, verified by tests before any live session.
* **D11-G:** the existing, unmodified `core-opportunity`, `core-qualification` and `core-discovery` suites passing is sufficient regression evidence.
* **D11-H:** category-plausibility observations go in a separate facilitator/analyst record. The participant template is not extended.
* **D11-I:** a funded, working provider is a MANDATORY environment precondition, separate from the validation criteria themselves.

---

### 3. Current Implementation Readiness

Verified in this task:

* `CATEGORY_PLAUSIBLE` is a distinct Qualification criterion. It is not routed through R-71/`NEED_DETECTED`. `core-opportunity`, `core-acquisition` and `core-discovery` source contain **zero** `categoryPlausib*`/`CATEGORY_PLAUSIBLE` references.
* MATCH, MISMATCH and UNKNOWN are all exercised in `categoryPlausibility.test.ts` and `core-qualification/src/evaluator.test.ts`, with multiple literal occurrences of each state in both files.
* Deterministic multi-segment parsing and ANY-match aggregation are unit-tested (`categoryPlausibility.test.ts`). Segment order through the prompt is tested in `research.test.ts`. Order through both providers is tested in the GAP 1 tests.
* Search + Prospect attribution is persisted through `category_plausibility_determinations` (migration 0027, keyed `(search_id, prospect_id)`). `supersedePrevious` is scoped to both keys.
* Qualification reads the current determination through `getCurrentByProspectId` (`ORDER BY created_at DESC, id DESC`).
* The D10 section on the Opportunity detail page renders only when a determination exists (§9).
* Provider neutrality holds: the three vendor adapters contain no reference to `ResearchProviderInput`, `ResearchInput` or `targetSegments`.
* Test results: `core-research` 249/249; Anthropic provider 7/7; fallback provider 16/16; GAP 1 2/2; `core-research` `tsc --noEmit` clean.

The repository is structurally capable of supporting D11 validation.

---

### 4. MATCH / MISMATCH / UNKNOWN

**Status: TECHNICALLY READY; LIVE VALIDATION OUTSTANDING**

Unit-level evidence exists for MATCH, MISMATCH, UNKNOWN, the empty/no-determination case, and multi-segment aggregation. D11 §3/§4 requires these outcomes to be observed in a real validation run.

**[VERIFIED CORRECTION — missing coverage items]** Beyond the three states, D11 also mandates the following. None has been observed live:

* **D11 §3 item 1:** a trace or log confirming that the Search-scoped `targetCustomer` actually reaches Research in a live run. Code inference is not enough.
* **D11 §3 item 5 / §4 item 6:** at least one UNKNOWN caused by *genuinely* insufficient evidence, with the insufficiency reasoning recorded, and kept distinct from MISMATCH.
* **D11 §4 item 5:** at least one MATCH or MISMATCH resting mainly on first-party website evidence (D3).
* **D11 §6 item 2:** at least one case where only supporting-tier evidence existed and the result was correctly UNKNOWN.

**Requirement:** not yet closed.
**Reason:** no funded, live Research-provider run has produced real category-plausibility determinations. This is outstanding validation work, not an implementation defect.

---

### 5. Multi-Segment Validation

**Status: READY FOR VALIDATION**

* **Code/test readiness:** satisfied. Parsing, aggregation, prompt ordering and provider pass-through ordering are all tested.
* **D11 empirical validation:** outstanding. It requires a real Search with a compound `targetCustomer`. D11 §4 allows reuse of the three-segment example on record.

---

### 6. Search + Prospect Attribution

**Status: MANDATORY VALIDATION STILL OUTSTANDING**

**[VERIFIED CORRECTION — scenario wording]** A Prospect's `searchId` never changes (migration 0015), so a second Search that rediscovers the same business creates a **different `prospect_id`**
(`PATH_2_CATEGORY_PLAUSIBILITY_POST_IMPLEMENTATION_CONFORMANCE_AUDIT.md` §4, D6). "One Prospect across two Searches" therefore cannot literally happen. The D11 §4 item 7 scenario has to be run as **one real-world business**:

1. Pick one real-world business, identified by name/normalized domain.
2. Create Search A with one `targetCustomer`.
3. Create Search B, which rediscovers the same business, with a different `targetCustomer`.
4. Produce a determination under each Search. Each will sit on its own `(search_id, prospect_id)` row.
5. Check that each determination records its own Search's `targetCustomer` and segments.
6. Check that neither row is superseded or overwritten by the other, and that each Opportunity detail page shows its own Search's determination. The UI resolves by `opportunity.prospectId`.

Practical prerequisite: the facilitator must choose `targetCustomer`/location inputs so that Discovery actually returns the same business in both Searches.

**Status:** not yet demonstrated by a live D11 session. Still mandatory. Prior audits recorded that this is structurally guaranteed but not exercised by an integration test.

---

### 7. Evidence Quality and Manual Spot-Check

**Status: READY FOR VALIDATION; MANUAL CHECK OUTSTANDING**

Evidence per segment is rendered with `sourceUrl`, `sourceLabel` and a quoted excerpt. D11-E / §3 item 6 also require that either:

* the provenance mechanism for the D1 entity is directly shown to have run, or
* at least one OBSERVED MATCH/MISMATCH claim is manually spot-checked against its actual fetched source document.

Required record for each spot-check: source URL, evidence label, quoted evidence, classification, rationale, attribution to the correct business and Search, and the facilitator's assessment that the quote genuinely supports the claim.

No live manual spot-check has been done.

---

### 8. Provider Neutrality

**Status: STRUCTURALLY VERIFIED; LIVE PROVIDER VALIDATION OUTSTANDING**

* The provider boundary is neutral. The GAP 1 tests show `targetSegments` passes through the Anthropic provider and the fallback chain unchanged, with byte-identical messages across attempts.
* Adapters stay behind the provider-neutral `ResearchModel` boundary. `researchModelFactory.ts` is the only place that branches on provider.
* D11-F does not require a forced multi-provider or forced-fallback experiment. It does require the D9 §9 fields to be recorded for every session: primary provider, whether fallback fired, the provider that actually produced the result, state, evidence, outcome, attribution, and Qualification result.

**[VERIFIED CORRECTION — Gemini]** D11 §7 treats structured-output capability for each configured provider as an **implementation precondition proven by tests**, not something D11 must prove live. Current state:

* `geminiModel.test.ts` translates the full `leadResearchSchema`, which now includes `categoryPlausibility`. It asserts that no `$ref` or `anyOf` survives, and it passes inside the 249/249 suite. That is implicit coverage of the new field, but there is no assertion specific to that field.
* `.env` does not set `RESEARCH_PROVIDER` (default `anthropic`) or `RESEARCH_FALLBACK_PROVIDER`. Gemini and OpenAI are therefore **not configured**, and this precondition only becomes relevant if they are. Non-blocking.

Live provider evidence has not been collected.

---

### 9. D10 UI Validation

**Status: CODE READY; HUMAN/REAL-DATA REVIEW OUTSTANDING**

Verified in `apps/web/app/(client-finder)/opportunities/[id]/page.tsx`:

* The section heading shows the aggregate result as the literal MATCH/MISMATCH/UNKNOWN value.
* It shows the target-customer context for the Search.
* It shows the determination timestamp (`observedAt`).
* It shows per-segment fit, rationale when present, and evidence (label link plus quote).
* The whole section renders only when a determination exists (`categoryPlausibility ? … : null`).
* The section is a sibling of the Score, Evidence and Qualification sections and does not gate or remove any of them.
* No ranked-list surface uses category plausibility. The list page has zero diff.

The UI has not been reviewed against a real provider-produced determination in a D11 session. Outstanding, but not an implementation blocker.

---

### 10. Human Participant Validation

**Status: OUTSTANDING**

D11-C requires at least one real, anonymized participant session using the unmodified question "Would you actually contact this business?". The participant must not see the MATCH/MISMATCH/UNKNOWN result before answering. The facilitator records the answer and correlates it with the system determination afterward.

**[VERIFIED CORRECTION — facilitator record]** D11-H requires a separate facilitator/analyst record, correlated by Opportunity ID. No such record exists in `requirement/` yet. It must be prepared before the session, without any participant data in it.

No real participant session has been completed.

---

### 11. Validation Template

**Status: CONFORMING**

`requirement/MVP_REAL_USER_VALIDATION_TEMPLATE.md` is untracked, so git cannot prove it is unmodified. Other evidence:

* Its modification time (2026-09-22 14:37) predates the D11 decision (2026-09-25) and all Path 2 work.
* It contains zero `plausib*`/`MISMATCH` references.

This is consistent with D11-H. No synthetic participant result may be entered into it.

---

### 12. Regression Status

**Status: TECHNICALLY GREEN WITH PRE-EXISTING INTEGRATION FAILURES**

The D11-G regression suites were re-run in this task, read-only:

| Suite | Result |
|---|---|
| `core-opportunity` | 95/95 passed |
| `core-qualification` | 30/30 passed |
| `core-discovery` | 25/25 passed |
| `core-research` | 249/249 passed |
| `core-research` `tsc --noEmit` | clean (prior task, no change since) |

`core-opportunity` has zero diff from HEAD. `core-qualification` differs only by the D4-authorized criterion additions. `core-discovery` carries a pre-existing diff that predates this audit chain and is unrelated to Path 2 (Post-Implementation Conformance Audit §14).

**The 14 integration failures are not re-run and remain PRE-EXISTING.** The Post-Implementation Conformance Audit §12 reproduced all 14 and traced them:

* They are in the personalization, outreach-preparation and follow-up-preparation integration files.
* Those files share a `matchingResearch()` fixture with empty `visibleProblems`, which relies on `companySummary` text to trigger an offer.
* `companySummary` is excluded as a need trigger under R-71 (`TOPICAL_FIELDS`, `core-opportunity/src/adapters.ts`, zero diff), so `suggestOffers()` finds no offer and `NEED_DETECTED` fails.
* Qualification then short-circuits to `NOT_QUALIFIED`, and the downstream stages fail in cascade.
* The category-plausibility row in those same fixtures persists as MATCH and satisfies `CATEGORY_PLAUSIBLE`.

Result: 0 Path 2 regressions. These failures must not be attributed to Path 2. They remain a regression-suite hygiene issue outside Path 2.

---

### 13. Environment Readiness

**Status: NOT CONFIRMED READY — BLOCKING FOR LIVE D11 EXECUTION, NOT AN IMPLEMENTATION DEFECT**

**[VERIFIED CORRECTION — credential state]** The draft said `ANTHROPIC_API_KEY` is unavailable/empty. That is not accurate for the repository:

* The project `.env` contains a **non-empty** `ANTHROPIC_API_KEY`. Only presence and length were checked. The value was not read into this document.
* The key is absent from the shell/test process environment. That is why the unit tests run with no key, and they use fake models regardless.

What remains unverified is **funding/credit**. The only recorded live attempt (Search `b81ab156-…`, D11 §10) failed with `HTTP 400` insufficient credit balance, all 3 of 3 attempts exhausted. This audit cannot confirm whether that has been resolved, because live provider calls are out of scope. D11-I therefore stays an unmet precondition until a funded run is shown to work.

Before scheduling the human session, the environment needs:

* a working, funded provider account (Anthropic by default);
* the real Client Finder runtime (web and worker) available to the participant;
* the Postgres environment the flow depends on;
* the D11-H facilitator record prepared (§10).

---

### 14. Outstanding D11 Checklist

| D11 requirement | Status |
|---|---|
| Technical Research flow | READY (code) / LIVE TRACE OUTSTANDING (§3 item 1) |
| Deterministic parsing | TESTED |
| Multi-segment behavior | TESTED / LIVE RUN OUTSTANDING |
| MATCH | UNIT TESTED / LIVE OUTSTANDING |
| MISMATCH | UNIT TESTED / LIVE OUTSTANDING |
| UNKNOWN (genuine insufficiency, reasoning recorded) | UNIT TESTED / LIVE OUTSTANDING |
| First-party evidence as primary basis | STRUCTURALLY READY / LIVE OUTSTANDING |
| Evidence provenance / manual spot-check | STRUCTURALLY READY / MANUAL CHECK OUTSTANDING |
| Search + Prospect attribution (same business, two Searches) | STRUCTURALLY READY / MANDATORY LIVE SCENARIO OUTSTANDING |
| D7 separation (STRUCTURAL) | VERIFIED BY PRIOR CODE REVIEW |
| Provider neutrality | STRUCTURALLY VERIFIED / D9 §9 LIVE RECORDING OUTSTANDING |
| Per-provider structured output (D11-F precondition) | ANTHROPIC ONLY CONFIGURED; GEMINI IMPLICITLY TESTED |
| Fallback path | OBSERVATIONAL — NOT CONFIGURED |
| D10 UI | CODE VERIFIED / REAL-DATA HUMAN REVIEW OUTSTANDING |
| Regression suites (D11-G) | GREEN (95 / 30 / 25 / 249) |
| 14 integration failures | PRE-EXISTING (R-71 fixture interaction), NOT PATH 2 |
| Facilitator record (D11-H) | NOT YET PREPARED |
| Real participant | OUTSTANDING |
| Validation template | CONFORMING / UNMODIFIED |
| Provider environment (D11-I) | NOT CONFIRMED — key present, funding unverified |

---

### 15. Pre-Existing Issues vs. New Findings

#### Pre-existing

1. The 14 integration failures (R-71 `companySummary`/`TOPICAL_FIELDS` fixture interaction).
2. No confirmed funded, usable live Research-provider environment.
3. No prior live category-plausibility validation.
4. No field-specific Gemini schema-translation assertion and no live Gemini verification. Gemini is not configured.
5. Stale status text in `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` (lines 557–573 still list D7–D11 as OPEN). The dedicated D7–D11 Product Decision documents are authoritative. Not modified here.

#### New D11-readiness findings

No new implementation defect was found. Non-blocking notes raised by this audit:

* The credential state was wrong in the draft: the key is present, and funding is the unverified item (§13).
* The attribution scenario has to be run as the same real-world business with two distinct Prospect rows (§6).
* The D11-H facilitator record does not exist yet (§10).
* Mandatory coverage items missing from the draft have been added (§4).

Outstanding validation activities, all expected D11 execution work:

* real MATCH, MISMATCH and UNKNOWN observations;
* first-party-evidence and genuine-insufficiency cases;
* a live trace showing `targetCustomer` reaches Research;
* a real multi-segment Search;
* the cross-Search attribution scenario;
* the manual evidence spot-check;
* recording of the D9 §9 provider fields;
* D10 UI review with real data;
* a real participant session.

---

### 16. Final Classification

**CONFORMING WITH NON-BLOCKING NOTES**

* The implementation is structurally ready for D11 validation and consistent with the locked D11 requirements.
* The D11 gate is **not closed**, because the mandatory empirical activities have not been performed and the D11-I environment precondition is unconfirmed.
* The outstanding live and manual activities are not an implementation defect and do not justify reopening D0–D10.
* The 14 integration failures stay classified as pre-existing R-71 fixture failures and are not attributed to Path 2.
* No product decision is reopened.

---

### 17. Safety / Read-Only Boundary

Recorded at task start and re-verified at task end:

```text
HEAD .................................. 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Staged ................................ none
git diff --stat ....................... 48 files changed, 1260 insertions(+), 59 deletions(-) (unchanged)
git diff --check ...................... clean
git status --short .................... 98 at start → 99 at end (+ this document only)
Commit / push ......................... none / none
Production / test / migration / schema /
  config / UI / PRD / template changes . 0
Existing governance documents modified  0
Live provider/API calls ............... 0 (unit tests use fake models; .env inspected
                                          for key presence/length only)
```

## STOP
