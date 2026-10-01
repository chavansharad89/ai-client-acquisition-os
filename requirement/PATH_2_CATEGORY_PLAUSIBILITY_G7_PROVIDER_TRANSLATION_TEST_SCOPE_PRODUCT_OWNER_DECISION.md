# Path 2 — Category Plausibility

## G-7 — Provider Translation-Test Scope — Product Owner Decision Record

**Decision ID:** G7-PO-DEC-001
**Status:** **G7-PO-DEC-001 — DECIDED** (2026-09-27)
**Previous status:** G7-PO-DEC-001 — PREPARED / PENDING PRODUCT OWNER RULING
**Decision (substance):** F-1 §16 / D11 §7 requires structured-output translation tests for all three named provider adapters—Anthropic, OpenAI, and Gemini—before a D11 validation session may be scheduled. Runtime selection of a subset of providers does not narrow this precondition.
**Authority granted by this record:** G-7 governance resolution only (see §7)
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_G7_PROVIDER_TRANSLATION_TEST_SCOPE_PRODUCT_OWNER_DECISION_PREPARATION.md` (sha256 `89d0b05f96dbb170…`), kept unchanged for traceability
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
G-7 ....................... DECIDED (G7-PO-DEC-001) — requirement NOT YET SATISFIED
G-6 ....................... DECIDED (G6-PO-DEC-001) — not altered by this record
P4 ........................ DECIDED (P4-PO-DEC-001) — not altered by this record
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
VS-PO-DEC-001 ............. PENDING PRODUCT OWNER DECISION — not altered by this record
```

This record decides G-7 only. It is a governance decision. It changes no code, test, schema,
prompt, provider adapter, configuration, determination, or existing governance record.

The preparation record still reads "PREPARED — PENDING PRODUCT OWNER RULING". Its text is not
edited. This record supersedes that status.

**Deciding G-7 does not satisfy G-7.** The scope of the requirement is now settled. The
requirement itself is not met by the current implementation (§5).

---

### 1. Pre-Decision Checks

| Check | Result |
|---|---|
| G7-PO-DEC-001 already decided? | **No.** No decision record existed. The preparation record states "Option selected: NONE". |
| Competing Product Owner ruling on G-7? | **None.** G6-PO-DEC-001, P4-PO-DEC-001 and VS-PO-DEC-001 do not rule on translation-test scope. VS-PO-DEC-001 only lists A-14 as independently open. |
| Preparation record unchanged? | **Yes.** sha256 `89d0b05f96dbb170…` before and after this record. |
| "configured provider" defined authoritatively? | **No.** Neither F-1, D11 nor D9 defines it. Audit readings (Gate Audit, Readiness Audit) are not rulings. |

---

### 2. Governing Language

**F-1 §16** (`PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md`, line 287):

> "structured-output translation tests for every configured provider must pass for the extended
> segment schema before any D11 session is scheduled (D11 §7, unchanged)."

F-1 §16 line 284 names the providers: "Every provider (Anthropic, OpenAI, Gemini, and any fallback)".
F-1 §3: F-1 does not amend or reinterpret D11.

**D11 §7** (`PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md`, line 198):

> "unit/integration tests exercising the new field's schema translation across all three
> configured provider adapters **before** any live D11 validation session is scheduled"

D11 §7 cites D9 §6 for this item.

**D9 §6 Costs** (`PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md`, lines 105, 109):

> "Every supported provider must satisfy the shared contract sufficiently — this is a requirement
> to verify per provider"

> "Validation and regression testing must cover all supported providers **and** fallback
> combinations (primary-only, primary-then-fallback), not just a single default configuration."

D9 names the three adapters: Anthropic, OpenAI, Gemini (lines 27, 56, 112).

---

### 3. Ruling

> **F-1 §16 / D11 §7 requires structured-output translation tests for all three named provider
> adapters—Anthropic, OpenAI, and Gemini—before a D11 validation session may be scheduled.
> Runtime selection of a subset of providers does not narrow this precondition.**

Answers to the preparation record's questions (§8):

| # | Question | Ruling |
|---|---|---|
| 1 | All three named adapters, or only currently configured adapters? | **All three named adapters: Anthropic, OpenAI and Gemini.** |
| 2 | What does "configured" mean here? | In this precondition, "configured provider adapters" means the provider adapters the product supports and that can be configured as primary or fallback: Anthropic, OpenAI and Gemini. It does **not** mean the subset selected at runtime by `RESEARCH_PROVIDER` / `RESEARCH_FALLBACK_PROVIDER` in any environment. No environment configuration record is needed to establish scope. |
| 3 | Is the shared-schema test (`jsonSchema.test.ts`) sufficient for any adapter? | **No, not on its own, for any adapter.** Each adapter needs its own test that asserts the extended segment schema in the form that adapter actually sends to its provider. `jsonSchema.test.ts` remains valid supporting evidence for the shared definition. |
| 4 | What coverage must exist before D11 can move toward READY FOR LIVE VALIDATION? | Passing adapter-level translation tests for Anthropic, OpenAI and Gemini, covering the extended F-1 segment schema (§5). This is necessary, not sufficient. All other D11 preconditions (including D11-I) still apply. |
| 5 | Does the ruling authorize test implementation? | **No.** See §7. |

---

### 4. Reasoning

1. **D11 §7 fixes the count.** It says "all three configured provider adapters". The word "three"
   cannot describe a runtime subset: a runtime configuration selects one primary and at most one
   fallback. The only set of three is the named adapter set.
2. **F-1 §16 adopts D11 §7 "unchanged".** F-1 §3 forbids F-1 from reinterpreting D11. F-1's
   shorter phrase "every configured provider" must therefore be read with D11's meaning, not as a
   narrower rule.
3. **D9, which D11 §7 relies on, rejects narrowing to one configuration.** D9 requires per-provider
   verification for "every supported provider" and testing of "all supported providers … not just a
   single default configuration".
4. **D9 treats provider replacement as a configuration change that must not change the product.**
   D9 §H: replacing Anthropic with OpenAI/Gemini "as the configured primary or fallback provider"
   must not require changing the product definition. If only runtime-selected adapters had to be
   tested, a configuration change could bring an untested adapter into a validation session without
   re-triggering the precondition.
5. **D11 §7 uses "configured provider" for the multi-provider set.** Its live-testing sentence says
   D11 does not require "exercising more than one configured provider". That sentence presumes more
   than one configured provider exists at once, which fits the supported-adapter reading.
6. **The precondition is a code-level test gate, not a runtime check.** D11 §7 calls it an
   "IMPLEMENTATION REQUIREMENT" met by "unit/integration tests". Unit tests do not depend on which
   provider an environment selects.

**Why the configured-only interpretation is rejected.**
- It rests on the word "configured" alone, and gives no meaning to D11 §7's "all three".
- It would make F-1 §16 narrower than D11 §7, which F-1 §3 does not permit.
- It conflicts with D9's "not just a single default configuration".
- Its only support is the Gate Audit and the Readiness Audit. These are audit records, not Product
  Owner decisions. No authoritative decision adopted their reading. This ruling overrides it.
- The choice was made on the governance text, not on implementation convenience.

**Why shared-schema coverage is not sufficient.**
- D11 §7 requires tests of "schema translation across … provider adapters". The shared test does
  not exercise any adapter.
- Gemini sends the output of a separate translation (`toGeminiSchema`), without the `defs` option.
  The shared test does not exercise it. D9 §6 names this translation as the verification risk.
- OpenAI wraps the schema in `strict: true` mode. The shared test does not cover the request.
- Anthropic has no adapter test asserting the schema sent in `format`.

---

### 5. Conformance Consequences

| Question | Answer |
|---|---|
| Is G-7 decided? | **Yes — DECIDED (G7-PO-DEC-001).** |
| Exact scope of required tests | For each of **Anthropic, OpenAI and Gemini**: a test that asserts the extended F-1 segment schema in the request form that adapter sends — `categoryPlausibility` items carry `fit`, `rationale`, `evidence` and `confidence`; `confidence` is a required integer; `basis` and `classification` are absent. For Gemini, the assertion applies to the `toGeminiSchema` output in Gemini's dialect. For OpenAI, it applies to `response_format.json_schema.schema` under `strict: true`. For Anthropic, it applies to the schema sent in `format`. |
| Is the shared-schema test sufficient? | **No**, for any adapter. |
| Does the current implementation satisfy the decided requirement? | **No.** Read-only check at this HEAD: `openAIModel.test.ts` and `geminiModel.test.ts` contain no `categoryPlausibility` or `confidence` assertion; no `anthropicModel.test.ts` exists. Only `jsonSchema.test.ts` asserts the segment fields. |
| Is additional test implementation required? | **Yes.** Adapter translation tests for all three adapters (scope above). |
| Does this ruling authorize that implementation? | **No.** A separate, explicit implementation authorization is required. |
| Does G-7 alone decide D11 readiness? | **No.** Passing these tests is one precondition. It does not move D11 to READY. |

Out of scope: any provider adapter added after this record. This ruling covers the three named
adapters only.

---

### 6. Record Status Effects

- The Gate Audit's reading ("Gemini and OpenAI are not configured, so their precondition does not
  currently apply") and its acceptance of shared coverage for Anthropic are **not adopted**. Those
  records are not edited.
- F1-IMPL-AUDIT-001's reading (all three adapters; shared coverage is not adapter coverage) is
  **consistent with** this ruling. That audit is not edited and gains no decision authority.
- F1-GAP-D11-ASSESS-001's G-7 row is resolved in scope by this record. The assessment is not edited.

---

### 7. Authority Boundary

This record grants **NO** authority for:
- adding or changing provider adapter tests or translation tests;
- provider adapter changes;
- F-1 implementation changes;
- D11 readiness transition, or moving D11 to READY FOR LIVE VALIDATION;
- scheduling, authorizing or conducting a validation session;
- provider calls or live source fetching;
- participant validation;
- determination creation;
- E1, E2 or E3 execution;
- A-11 closure;
- changes to VS-PO-DEC-001;
- modification of F-1, D11, D9, the G-7 preparation record, F1-IMPL-AUDIT-001, the G-7
  assessment, G6-PO-DEC-001, P4-PO-DEC-001, or any other existing governance record.

---

### 8. Status After This Record

```text
G-7 ....................... DECIDED (G7-PO-DEC-001) — requirement NOT YET SATISFIED
G-6 ....................... DECIDED (G6-PO-DEC-001)
P4 ........................ DECIDED (P4-PO-DEC-001)
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
VS-PO-DEC-001 ............. PENDING PRODUCT OWNER DECISION
```

This ruling is not authorization to schedule or conduct a validation session.

---

### 9. Repository Safety

**Before writing:**

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --porcelain .... 139 lines
G-7 preparation ........... sha256 89d0b05f96dbb170…
F-1 decision .............. sha256 ba4e6a73ef73fc3e…
D11 decision .............. sha256 f7d26fc5fb4b72e4…
D9 decision ............... sha256 957bf19bf937015f…
F1-IMPL-AUDIT-001 ......... sha256 0ce6b8bf7fff5d50…
G-7 assessment ............ sha256 d877ea44ebfc35f6…
G-6 decision .............. sha256 8713e6a3a7821ee4…
P4 decision ............... sha256 6d7f958b72fbb489…
VS-PO-DEC-001 ............. sha256 430ccc2d60a72c8a…
Governance records ........ all requirement/*.md hashed, stored outside the repository
```

No `.env` or credential file was read. No test, typecheck, build, Docker, Postgres, browser, or
provider command was run. The after-state is verified at creation and reported with this record.

## STOP
