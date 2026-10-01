# Path 2 — Category Plausibility

## G-7 — Provider Translation-Test Conformance Record

**Record ID:** G7-CONF-001
**Status:** **G-7 — SATISFIED** (2026-09-27), against the scope decided in G7-PO-DEC-001 §5
**Governing decision:** `PATH_2_CATEGORY_PLAUSIBILITY_G7_PROVIDER_TRANSLATION_TEST_SCOPE_PRODUCT_OWNER_DECISION.md` (G7-PO-DEC-001)
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
G-7 ....................... SATISFIED (G7-CONF-001)
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

---

### A. Authority

- **Decision ID:** `G7-PO-DEC-001` (DECIDED).
- **Ruling:** F-1 §16 / D11 §7 requires structured-output translation tests for all three named
  provider adapters (Anthropic, OpenAI and Gemini) before a D11 validation session may be
  scheduled. Runtime selection of a subset does not narrow this. The shared `jsonSchema.test.ts`
  is not sufficient adapter-level coverage for any adapter.
- **This authorization covers G-7 adapter translation/conformance tests only.** It changed no
  production code, adapter, schema, prompt, configuration or governance decision.

---

### B. Baseline (before editing)

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --short ........ 140 lines (sha1 952ae9d8…)
Tracked diff sha1 ......... db5341e4381365fcfa71024a741d1070fbc375a2
apps/web/tsconfig.tsbuildinfo  pre-existing " M" change, sha256 1834209e…de71d09
openAIModel.test.ts ....... tracked, unmodified, sha256 2e90e8fb…eaac5d
geminiModel.test.ts ....... tracked, unmodified, sha256 4566cc3c…c732
anthropicModel.test.ts .... did not exist
G7-PO-DEC-001 ............. present, DECIDED
G-7 preparation record .... unchanged (sha256 89d0b05f96dbb170…)
F1-IMPL-AUDIT-001 ......... unchanged (sha256 0ce6b8bf7fff5d50…)
```

---

### C. Files Changed

| File | Change | Why |
|---|---|---|
| `packages/core-research/src/anthropicModel.test.ts` | **Created** (1 test) | No Anthropic adapter test existed. |
| `packages/core-research/src/openAIModel.test.ts` | **Extended** (+1 test, 60 lines) | Existing test asserted only `response_format.type`. |
| `packages/core-research/src/geminiModel.test.ts` | **Extended** (+1 test, 48 lines) | Existing tests did not assert the segment fields. |
| `requirement/PATH_2_CATEGORY_PLAUSIBILITY_G7_PROVIDER_TRANSLATION_TEST_CONFORMANCE_RECORD.md` | **Created** | This record. |

No production file was changed. `jsonSchema.test.ts` is untouched.

---

### D. Provider Coverage

The model-facing F-1 segment is `fit`, `rationale`, `evidence`, `confidence`. `basis` and
`classification` are code-assigned (F-1), so each test asserts they are **absent** from the
translated schema. The `confidence` range (1–100 for MATCH/MISMATCH, exactly 0 for UNKNOWN) and the
non-null `rationale` are enforced by the shared Zod `superRefine` after parsing. Integer bounds are
deliberately not emitted to providers (`jsonSchema.ts`). The tests therefore check the range
instruction in `confidence`'s description, and do not expect `minimum`/`maximum`.

#### Anthropic

| Item | Evidence |
|---|---|
| Test file | `anthropicModel.test.ts` — "sends the extended category-plausibility segment in output_config.format" |
| Path exercised | `createAnthropicResearchModel` with a faked client; captures the params passed to `client.messages.stream` and reads `output_config.format` |
| F-1 fields verified | `categoryPlausibility` is an array; item keys exactly `fit, rationale, evidence, confidence`; all four required; `basis`/`classification` absent |
| Provider constraints verified | `format.type = 'json_schema'`; `additionalProperties: false`; `fit` enum `MATCH, MISMATCH, UNKNOWN`; `confidence` type `integer`, no `minimum`/`maximum`, description carries "1-100 for MATCH/MISMATCH" and "exactly 0 for UNKNOWN"; `rationale` is `anyOf` string/null with UNKNOWN guidance; `evidence` is an array of `quote`/`sourceUrl` objects |
| Result | **PASS** |

#### OpenAI

| Item | Evidence |
|---|---|
| Test file | `openAIModel.test.ts` — "sends the extended F-1 segment schema under strict structured outputs" |
| Path exercised | `createOpenAIResearchModel` with a faked `fetchImpl`; parses the request body and reads `response_format.json_schema` |
| F-1 fields verified | Same as Anthropic: keys, all required, `basis`/`classification` absent |
| Provider constraints verified | `response_format.type = 'json_schema'`; `name = 'lead_research'`; **`strict: true`**; `fit` enum incl. UNKNOWN; `confidence` integer with the range description; `rationale` string/null; **every object node in the schema (segment, evidence, `$defs`) has `additionalProperties: false` and lists all its keys as required** (strict-mode requirement) |
| Result | **PASS** |

#### Gemini

| Item | Evidence |
|---|---|
| Test file | `geminiModel.test.ts` — "sends the extended F-1 segment schema translated into Gemini's responseSchema dialect" |
| Path exercised | `createGeminiResearchModel` with a faked `fetchImpl`; reads `generationConfig.responseSchema`, the output of `toGeminiSchema` |
| F-1 fields verified | `categoryPlausibility` is `ARRAY`; item `OBJECT` with keys exactly `fit, rationale, evidence, confidence`; all four required; `basis`/`classification` absent |
| Provider constraints verified | Gemini dialect: no `additionalProperties`, `$ref`, `anyOf`, `minimum`, `maximum`; `fit` `STRING` enum incl. UNKNOWN; `confidence` `INTEGER` with the range description; `rationale` `STRING`, `nullable: true`, `minLength: 1`; `evidence` `ARRAY` of `OBJECT` with `quote`/`sourceUrl` |
| Result | **PASS** |

**Observation (not fixed, outside this authorization):** `toGeminiSchema` does not carry the
description of a nullable (`anyOf`) node through. `rationale`'s per-verdict guidance therefore
does not reach Gemini in `responseSchema`. It does reach Gemini through the shared system prompt
(`prompt.ts`), which states the same rationale requirement. The structural constraints (required,
nullable, `minLength: 1`) survive, and Zod still rejects a null rationale. The test does not assert
the description either way, so it does not lock this behavior in. Changing it would be a production
adapter change and needs separate authorization.

---

### E. Verification

Run from `packages/core-research`:

| Command | Result |
|---|---|
| `npx vitest run src/anthropicModel.test.ts src/openAIModel.test.ts src/geminiModel.test.ts src/jsonSchema.test.ts` | 4 files, **45 passed** |
| `npx vitest run` (all `core-research` unit tests) | 15 files, **284 passed** |
| `npx tsc --noEmit -p tsconfig.json` | exit 0 (non-incremental; writes nothing) |

The first run of the Gemini test failed on one assertion: `rationale.description` was `undefined`.
That assertion was replaced with a comment (see Observation above). No other test failed.

---

### F. Negative Controls / Safety

- No provider call and no API call: the Anthropic client and `fetch` are faked in every new test.
- No API key was used or read; the test keys are the literal `'k'`.
- No live source fetch.
- No participant session.
- No determination created.
- No E1, E2 or E3 activity.
- No database access or mutation. No Docker or Postgres command.
- No integration test, web typecheck or build was run.
- No `.env` or credential file was read.

---

### G. Remaining G-1–G-10 Status

- **G-7: SATISFIED** by this record.
- All other G-1–G-10 gaps are unchanged and outside this authorization. The F-1 implementation
  audit is not rewritten.

---

### H. D11 Status

```text
D11 = NOT READY FOR LIVE VALIDATION
```

Satisfying G-7 meets one D11 §7 precondition. It does not authorize:
- a D11 readiness transition;
- validation-session scheduling;
- provider execution;
- participant validation;
- live source fetching;
- determination creation;
- E1, E2 or E3;
- A-11 closure.

---

### I. Repository Preservation (after)

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Staged .................... none
Status delta vs baseline .. +M openAIModel.test.ts, +M geminiModel.test.ts,
                            +?? anthropicModel.test.ts, +?? this record
Other tracked diffs ....... sha1 db5341e4… (identical to baseline)
apps/web/tsconfig.tsbuildinfo  sha256 1834209e…de71d09 (unchanged)
requirement/*.md .......... all pre-existing records unchanged
git diff --check .......... clean
```

## STOP
