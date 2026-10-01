# Path 2 — Category Plausibility

## G-7 — Provider Translation-Test Scope — Product Owner Decision Preparation

**Decision ID:** G7-PO-DEC-001
**Status:** **PREPARED — PENDING PRODUCT OWNER RULING**
**Option selected:** NONE
**Authority granted by this record:** NONE
**Source finding:** `PATH_2_CATEGORY_PLAUSIBILITY_F1_OPEN_GAP_D11_READINESS_ASSESSMENT.md` (F1-GAP-D11-ASSESS-001) §2, §4
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
G-7 ....................... UNRESOLVED — PRODUCT OWNER RULING REQUIRED
G-6 ....................... DECIDED (G6-PO-DEC-001)
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

This record prepares one question for a Product Owner ruling. It decides nothing. It changes no
code, test, schema, prompt, provider adapter, configuration, determination, or existing governance
record. No `.env` file, credential or secret was read for this record.

---

### 1. Decision Question

> Does the F-1 §16 / D11 §7 structured-output translation-test requirement apply to:
>
> **A.** all three named provider adapters (OpenAI, Gemini, Anthropic), regardless of which
> providers are currently configured; or
>
> **B.** only the provider adapters that are currently configured or enabled for the system?

---

### 2. Sources Reviewed

| Record | Role | Sections used |
|---|---|---|
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` (F-1) | Product decision | §3, §16 |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` (D11) | Product decision | §1, §3 "Provider-neutrality validation", §7 |
| `PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md` (D9) | Product decision | Costs list; "Not claimed" |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_IMPLEMENTATION_CONFORMANCE_AUDIT.md` (F1-IMPL-AUDIT-001) | Audit | §16 row, G-7 row, §12 |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_OPEN_GAP_D11_READINESS_ASSESSMENT.md` (F1-GAP-D11-ASSESS-001) | Assessment | §2 G-7 row, §4 |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_LIVE_VALIDATION_GATE_AUDIT.md` (Gate Audit) | Read-only audit | §3 D11-F row, §8, §11 |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_VALIDATION_READINESS_AUDIT.md` (Readiness Audit) | Audit | D11-F notes, status table |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md` (D11-H) | Facilitator record | Searched; no D11-F or "configured" provision |
| `PATH_2_CATEGORY_PLAUSIBILITY_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md` (VS-PO-DEC-001) | Product Owner decision | Lists A-14 as independently open; no scope definition |
| `PATH_2_CATEGORY_PLAUSIBILITY_A12_SECTION_6_3_COMPANION_RECORD.md` (Companion) | Facilitator record | Searched; no D11-F or "configured" provision |

Code inspected, for coverage facts only: `packages/core-research/src/{anthropicModel,openAIModel,geminiModel,researchModelFactory,jsonSchema}.ts`,
their tests, `research.test.ts`, `packages/config/src/env.ts`, `apps/worker/src/index.ts`, and the
non-secret `.env.example`.

---

### 3. Contract Language (A)

#### 3.1 F-1 §16 — exact text

> "Every provider (Anthropic, OpenAI, Gemini, and any fallback) must receive the same segment input
> and produce the same **logical** structured contract defined in §13–§14, from the single shared
> Zod definition and prompt."

> "**D11-F precondition re-applies.** The shared output schema changes, so structured-output
> translation tests for every configured provider must pass for the extended segment schema before
> any D11 session is scheduled (D11 §7, unchanged)."

#### 3.2 Precision finding: where "all three configured provider adapters" appears

- The phrase **"all three configured provider adapters" does not appear in F-1 §16.** It appears in **D11 §7** (§4.1 below).
- F-1 §16 uses two different phrases in two different bullets:
  - "**Every provider** (Anthropic, OpenAI, Gemini, and any fallback)" — the provider-neutrality contract (same input, same logical output);
  - "**every configured provider**" — the translation-test precondition. This bullet names no provider.
- F-1 §16 does not define "configured". It defers to D11 §7 "unchanged".
- F-1 §3: F-1 "does not amend any D0–D11 text" and "does not silently reinterpret D10 or D11".
- F1-GAP-D11-ASSESS-001 §4 quotes F-1 §16 as "every configured provider (Anthropic, OpenAI, Gemini, and any fallback)". That joins the parenthetical from the first bullet to the phrase from the fourth. This record notes the difference and does not edit the assessment.

#### 3.3 What the wording can mean

| Reading | Basis in text |
|---|---|
| 1 — the three named adapters are the product's configured adapters, so all three require tests | D11 §7 "all three configured provider adapters": "three" fixes a count that matches the named adapters. D9 Costs: "Validation and regression testing must cover all supported providers **and** fallback combinations". F-1 §16's first bullet names all three. |
| 2 — only adapters currently configured/enabled require tests | F-1 §16's test bullet says "every configured provider", not "every provider". The word "configured" would add nothing if it meant all named adapters. The runtime selects a provider through `RESEARCH_PROVIDER` / `RESEARCH_FALLBACK_PROVIDER`. |

The text supports both readings. This record does not choose between them.

---

### 4. D11 Language (B)

#### 4.1 D11 §7 — exact text

> "**Decision on per-provider structured-output capability** (e.g., Gemini's
> `responseSchema`/`toGeminiSchema()` translation actually producing a contract-compliant shape for
> this new field): this is an **IMPLEMENTATION REQUIREMENT**, to be satisfied by unit/integration
> tests exercising the new field's schema translation across all three configured provider adapters
> **before** any live D11 validation session is scheduled — not a VALIDATION REQUIREMENT that D11
> itself re-proves with a live run per provider."

Also in D11 §7: D11 "does **not** require deliberately exercising more than one configured
provider" live. That sentence governs live sessions, not translation tests.

#### 4.2 Findings

| Question | Finding |
|---|---|
| Does D11 independently narrow F-1 §16? | **No.** D11 predates F-1. F-1 §16 adopts D11 §7 "unchanged". |
| Does F-1 adopt D11 §7 literally? | **Yes, by reference.** F-1 re-applies the precondition to the extended segment schema. Its own wording ("every configured provider") differs from D11 §7's ("all three configured provider adapters"). |
| Does D11 define "configured"? | **No.** No D11 section defines it. |
| Does D11 identify the three adapters? | **Partly.** §7 names Gemini as an example and says "all three". It does not list the three by name. D9, which D11 §7 relies on, names Anthropic, OpenAI and Gemini. |
| Is the term ambiguous? | **Yes.** "all three" points to the named set. "configured" may point to a runtime subset. D11 does not reconcile them. |

What D11 §7 requires before a session can be **scheduled**: passing unit/integration tests that
exercise the new field's schema translation for the adapters within scope. The scope is the open
question. Live per-provider runs are not required.

D11-H, the Companion Record and VS-PO-DEC-001 add no definition of "configured". VS-PO-DEC-001
lists A-14 (these translation tests) as independently open.

---

### 5. Current Implementation and Test Coverage (C)

Facts from source inspection. No tests were run for this record.

#### 5.1 How each adapter builds its schema

| Adapter | Schema sent | Source |
|---|---|---|
| Anthropic | `zodToJsonSchema(leadResearchSchema, { defs: { Observation } })` as `format: { type: 'json_schema' }` | `anthropicModel.ts:88` |
| OpenAI | Same call, inside `response_format: { type: 'json_schema', json_schema: { strict: true, … } }` | `openAIModel.ts:106–116` |
| Gemini | `toGeminiSchema(zodToJsonSchema(leadResearchSchema))`, no `defs` option, as `responseSchema` | `geminiModel.ts:150, 170` |

#### 5.2 Coverage for the new F-1 segment fields

| Level | Coverage of the extended segment schema |
|---|---|
| **Shared schema** (`jsonSchema.test.ts:198–209`) | **Covered.** It asserts `categoryPlausibility.items` has keys `fit`, `rationale`, `evidence`, `confidence`; `confidence` is a required integer; `basis` and `classification` are absent. It uses the same `{ defs: { Observation } }` option as the Anthropic and OpenAI adapters. |
| **OpenAI adapter** (`openAIModel.test.ts:31–54`) | **Not covered.** It asserts only `response_format` matches `{ type: 'json_schema' }`. No assertion on the sent schema, `strict` mode, or segment fields. |
| **Gemini adapter** (`geminiModel.test.ts:29–44`) | **Not covered for segment fields.** It translates the full `leadResearchSchema`, which includes `categoryPlausibility`. It asserts top-level `OBJECT`, no `$defs`, `$ref` or `anyOf`, and the types of `companySummary` and `visibleProblems`. No assertion on `categoryPlausibility` or `confidence`. |
| **Anthropic adapter** | **Not covered.** There is no `anthropicModel.test.ts`. `research.test.ts` tests Anthropic construction and response extraction. No test asserts the schema sent in `format`. |

#### 5.3 Is the shared-schema test equivalent to an adapter translation test?

- **Anthropic / OpenAI:** the shared test checks the same function output, with the same options, that both adapters send. It does not check the request the adapter builds. For OpenAI it does not cover `strict: true`, which changes how the provider treats the schema.
- **Gemini:** **not equivalent.** Gemini sends the output of a separate translation (`toGeminiSchema`), without the `defs` option. The shared test does not exercise that translation.
- **Authority:** no authoritative record states that a shared-schema test satisfies an adapter-specific requirement. D11 §7 speaks of "schema translation across … provider adapters". F1-IMPL-AUDIT-001 states "Shared-schema coverage is not provider-adapter coverage". Only the Gate Audit accepted shared coverage, for Anthropic (§6 below). This record does not treat shared coverage as satisfying the adapter requirement.

#### 5.4 Configuration facts (non-secret sources only)

| Source | Fact |
|---|---|
| `packages/config/src/env.ts:72` | `RESEARCH_PROVIDER: z.enum(['anthropic','openai','gemini']).default('anthropic')` |
| `packages/config/src/env.ts:76` | `RESEARCH_FALLBACK_PROVIDER` is optional; no default |
| `researchModelFactory.ts:19` | `RESEARCH_PROVIDER_NAMES = ['anthropic', 'openai', 'gemini']` — all three are selectable |
| `apps/worker/src/index.ts:94–102` | The worker builds the primary from `env.RESEARCH_PROVIDER` and a fallback only if `env.RESEARCH_FALLBACK_PROVIDER` is set |
| `.env.example` | Template: `RESEARCH_PROVIDER=anthropic`; `RESEARCH_FALLBACK_PROVIDER=` (blank). "An Anthropic-only deployment can leave both blank." |

- These sources establish the **default** (Anthropic primary, no fallback) and the **selectable set** (all three).
- They do **not** establish the **actual** configuration of any environment. That lives in `.env` or the runtime environment, which this record did not read.
- The Readiness Audit states that `.env` did not set either variable at its time. That is a prior record's observation; this record did not re-verify it.

---

### 6. Existing Governance Interpretation (D)

| Source | Type | Interpretation of scope | Accepts shared-schema coverage? |
|---|---|---|---|
| **F-1 §16** | Product decision | "every configured provider"; defers to D11 §7 unchanged. Does not define "configured". | Not stated |
| **D11 §7** | Product decision | "all three configured provider adapters". Does not define "configured". | Not stated; speaks of adapter translation |
| **D9** | Product decision | "Every supported provider must satisfy the shared contract … a requirement to verify per provider"; testing "must cover all supported providers **and** fallback combinations" | Not stated |
| **F1-IMPL-AUDIT-001** | Audit | Treats OpenAI, Gemini **and** Anthropic adapter tests as needed (§12 follow-up) | **No**: "Shared-schema coverage is not provider-adapter coverage. The D11 §7 precondition stays unmet on the test evidence." |
| **Gate Audit** | Read-only audit | "configured" = runtime-selected. "Gemini and OpenAI are not configured, so their precondition does not currently apply." | **Yes, for Anthropic**: `jsonSchema.test.ts` "satisfies the precondition for the one configured provider" |
| **Readiness Audit** | Audit | "ANTHROPIC ONLY CONFIGURED; GEMINI IMPLICITLY TESTED"; the precondition "only becomes relevant if they are [configured]" | Treats Gemini full-schema translation as implicit coverage |
| **F1-GAP-D11-ASSESS-001** | Assessment | Records both readings; chooses neither | Not decided |

**Disagreement.**
- F1-IMPL-AUDIT-001 reads the requirement as covering all three adapters and rejects shared coverage.
- The Gate Audit and the Readiness Audit read "configured" as runtime-selected and accept shared coverage for Anthropic.
- Also: the Gate Audit's acceptance predates the F-1 segment fields. The `jsonSchema.test.ts` segment assertion it cites was later updated for F-1.

**Decision authority.**
- Only **F-1** and **D11** (with D9) are product decisions. Neither defines "configured".
- F1-IMPL-AUDIT-001, the Gate Audit, the Readiness Audit and the assessment are audit records. They have no authority to define the term.
- The Gate Audit reading is an audit precedent, not a ruling. The conflict can be settled only by the Product Owner.

---

### 7. Alternatives (E)

The alternatives are presented without recommendation, ranking or selection.

#### OPTION 1 — All three named adapters require translation tests

- F-1 §16 / D11 §7 are read as requiring explicit translation tests for OpenAI, Gemini and Anthropic before a validation session can be scheduled.
- **Tests missing under this option:**
  - **OpenAI:** an adapter test asserting the schema sent in `response_format.json_schema.schema` (with `strict: true`) carries the extended segment (`confidence` required integer; no `basis`/`classification`).
  - **Gemini:** a `toGeminiSchema` / adapter test asserting the translated `categoryPlausibility` item carries `confidence` in Gemini's dialect and is required.
  - **Anthropic:** an adapter test asserting the schema sent in `format` carries the extended segment. No `anthropicModel.test.ts` exists.
- Whether `jsonSchema.test.ts` may stand in for any adapter would need to be ruled (question 3).
- Adding these tests requires **separate implementation authorization**. None is added by this record.
- D11 cannot move toward READY FOR LIVE VALIDATION until they pass.

#### OPTION 2 — Only currently configured adapters require translation tests

- "configured provider adapters" is read as the adapters selected by `RESEARCH_PROVIDER` and, if set, `RESEARCH_FALLBACK_PROVIDER`.
- **Authoritative non-secret basis needed:** a recorded statement of the provider configuration for the environment where D11 sessions will run, confirmed at readiness time. It must not come from API keys or `.env` values read by an agent. For example: a Product Owner or operator attestation, or a committed non-secret deployment configuration. No such record exists today. `env.ts` and `.env.example` give only defaults.
- **If the configuration is Anthropic primary, no fallback** (the code default):
  - The Anthropic adapter would be in scope.
  - Its only segment coverage is the shared `jsonSchema.test.ts`. Whether that suffices is question 3. F1-IMPL-AUDIT-001 says it does not; the Gate Audit said it did.
- **If OpenAI or Gemini is primary or fallback:** that adapter's missing test (Option 1 list) becomes required.
- Until the configuration is established from an authoritative non-secret source, the outcome under this option stays **conditional**.
- A change of configuration after readiness would reopen the precondition.

#### OPTION 3 — Governance interpretation remains unresolved

- G-7 stays open until the Product Owner defines "configured" as one of:
  - product-supported / named adapters;
  - runtime-enabled adapters;
  - deployment-configured adapters (for the D11 session environment);
  - another explicitly defined scope.
- Until then, the D11 §7 precondition is treated as **not met**, and D11 cannot move toward READY FOR LIVE VALIDATION on account of G-7.
- No implementation change is authorized.

---

### 8. Product Owner Questions (F)

The ruling must answer:

1. **Does F-1 §16 require translation tests for all three named adapters, or only currently configured adapters?**
2. **What exactly does "configured" mean for this requirement?** (product-supported/named, runtime-enabled, deployment-configured, or another scope). If it is environment-dependent: who confirms the configuration, from what non-secret source, and when?
3. **Is the existing shared-schema test (`jsonSchema.test.ts`) sufficient for any adapter, or must each applicable adapter have its own translation test?** (It is not exercised by Gemini's `toGeminiSchema` path. It does not cover OpenAI's `strict` request.)
4. **What test coverage must exist before D11 can transition toward READY FOR LIVE VALIDATION?**
5. **Does the ruling authorize any test implementation?** **NO**, unless the Product Owner separately and explicitly grants that authority.

---

### 9. Authority Boundary

This record grants **NO** authority for:
- provider adapter changes;
- provider translation-test changes;
- F-1 implementation changes;
- D11 readiness transition;
- validation-session authorization;
- provider calls;
- live source fetching;
- participant validation;
- determination creation;
- E1, E2 or E3 execution;
- A-11 closure;
- changes to D11-H;
- changes to the Companion Record;
- changes to the A-11 evidence matrix;
- modification of F-1, D11, D9, G6-PO-DEC-001, P4-PO-DEC-001, the G-7 assessment, or any other existing governance record.

---

### 10. Status Preserved

```text
G-7 ....................... UNRESOLVED — PRODUCT OWNER RULING REQUIRED
G-6 ....................... DECIDED
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

---

### 11. Repository Safety

**Before writing:**

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --porcelain .... 138 lines (sha256 58c856fd…fc66b2611)
Tracked diff sha256 ....... 99bb951f…2585991
G-7 assessment ............ sha256 d877ea44…193f209
G-6 decision .............. sha256 8713e6a3…28514e4
P4 decision ............... sha256 6d7f958b…4c569b5
Governance records ........ all PATH_2_CATEGORY_PLAUSIBILITY_*.md hashed, stored outside the repository
```

No `.env` or credential file was read. No test, typecheck, build, Docker, Postgres, browser, or
provider command was run. The after-state is verified at creation and reported with this record.

## STOP
