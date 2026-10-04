# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION REV. 4 — CONFORMANCE AUDIT

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-004-CONFORMANCE-AUDIT-001
**Date:** 2026-10-02
**Type:** Read-only conformance audit. Not a Product Owner decision, not an engineering decision, not a specification
revision, **not an implementation authorization**.
**Audit target:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-004 ("REV-004",
`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_004.md`).

> **PD-1: PENDING. Implementation authorized: NO.**
> Findings below are observations. None is fixed, decided or resolved by this record.

**Abbreviations:** as in AUDIT-R3 and ED-DEC-003 — PO-DEC (K1-B), K1-DEC (K1-R1..R3), K1I-DEC (K1-I1..I6), PG-DEC
(PG-1..PG-4), ED-DEC-001/002/003, AUDIT-001, AUDIT-R3 (rev. 3 audit), REV-003, OQ-DEC, READINESS-001, CONTRACT-REC,
ADAPTER-REC, DEC-003. `C` / `C′` = detection copies (REV-004 §4.3, §4.5). `W` = normalized business website domain.
"E" = text placed in an evidence statement (provider) and in `quote` (intake). `P` = positions (REV-004 §4.6.3).
"Trace" = hand evaluation of REV-004 §4 as written; no detector code exists and none was written or run.

---

## §1 Baseline

Recorded before any audit work.

| Check | Expected | Observed | Result |
|---|---|---|---|
| Branch | `feature/client-intent-discovery-complete` | same | PASS |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | same | PASS |
| Staged files | 0 | 0 | PASS |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`; untracked records under `requirement/` only | same: 1 modified + 32 untracked, all under `requirement/` (33 status lines) | PASS |
| Code fingerprint (`git diff HEAD --binary -- . ':(exclude)requirement/'`, sha256) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty diff) | same | PASS |
| REV-004 sha256 | `d9b1f918c4c85c72121affffb8b3a1a150330fb9bff0cca1760622dd37a5c4f4` | same | PASS |
| ED-DEC-003 sha256 | `681707ac9e41230da36b2550d3c3e0e1f7bd1599af86707e75902638a0b59fc8` | same | PASS |
| AUDIT-R3 sha256 (recorded in ED-DEC-003 §1 row 8 and REV-004 lineage) | `a6b5e3da5c565002af8bcfd776bc01e9de1fb582bde2f170c6b91cfeadd92a0b` | same | PASS |
| PD-1 | PENDING | READINESS-001 row PD-1 ("Whether to authorize implementation of any part of the provider-neutral core"); no PD-1 decision record exists under `requirement/` | PASS — PENDING |
| This record | must not exist | did not exist | PASS |

Governing-record hashes (sha256, files under `requirement/`; all verified this round):

| # | Record | File | sha256 | Match |
|---|---|---|---|---|
| 1 | PO-DEC (K1-B) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_PRODUCT_OWNER_DECISION.md` | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| 2 | K1-DEC (K1-R1..R3) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_RESIDUAL_PRODUCT_OWNER_DECISION.md` | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| 3 | K1I-DEC (K1-I1..I6) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_SEMANTICS_PRODUCT_OWNER_DECISION.md` | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes |
| 4 | PG-DEC (PG-1..PG-4) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POLICY_GAPS_PRODUCT_OWNER_DECISION.md` | `448370f18b9d093e62fbb9c3463dd79631a0a352eb399dc97a1151ceee3bac5d` | Yes |
| 5 | ED-DEC-001 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION.md` | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` | Yes |
| 6 | ED-DEC-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION_AMENDMENT.md` | `b9c7aaa8af5e99b2c6e2cd74054eaa0f163944b8acb33a47edb3fdc805abefde` | Yes |
| 7 | REV-003 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_003.md` | `c3f42694d2b3a76d34fd9cd1118711103e0fe61bed4780e68c5f05c259e374bf` | Yes |
| 8 | AUDIT-R3 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_003_CONFORMANCE_AUDIT.md` | `a6b5e3da5c565002af8bcfd776bc01e9de1fb582bde2f170c6b91cfeadd92a0b` | Yes |
| 9 | ED-DEC-003 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION_AMENDMENT_003.md` | `681707ac9e41230da36b2550d3c3e0e1f7bd1599af86707e75902638a0b59fc8` | Yes |
| 10 | REV-004 (target) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_004.md` | `d9b1f918c4c85c72121affffb8b3a1a150330fb9bff0cca1760622dd37a5c4f4` | Yes |
| 11 | AUDIT-001 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_CONFORMANCE_AUDIT.md` | `53c79c39a73fa522217a5805ddd73ec39a977741eedd4151ee7fe237f66d8b97` | Yes |
| 12 | REV-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION.md` | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` | Yes |
| 13 | REV-PREP (rev. 1) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md` | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` | Yes |
| 14 | K1-ESPEC (rev. 0) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_PREPARATION.md` | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` | Yes |
| 15 | DEC-003 | `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| 16 | OQ-DEC (OQ-3, OQ-7, OQ-11) | `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| 17 | CONTRACT-REC | `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| 18 | ADAPTER-REC | `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| 19 | READINESS-001 (PD-1) | `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |
| 20 | REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |

**Baseline: PASS.** No governing hash differed; the audit proceeded.

---

## §2 Scope

This is a **read-only audit of REV-004**. In scope: REV-004 §2–§10 in full; its conformance with the governing PO policy
and engineering decisions; the current code it relies on; every row of its §9 test matrix; the seven AUDIT-R3 major /
blocking findings (R3-F1..R3-F7); the five carried-forward minor findings; implementation readiness.

Out of scope: correcting any finding; deciding any policy or engineering question; PD-1..PD-12; provider selection; any
code, test, schema, migration, API, UI, configuration or dependency change. No ED-DEC-004 and no rev. 5 is created.

## §3 Governing records checked

Policy: PO-DEC (K1-B); K1-DEC (K1-R1..R3); K1I-DEC (K1-I1..I6, read in full); PG-DEC (PG-1..PG-4, read in full);
OQ-DEC (OQ-3, OQ-7, OQ-11, by hash and as cited in K1I-DEC / PG-DEC); DEC-003 §6 (as cited); READINESS-001 (PD-1 row).
Engineering: ED-DEC-001, ED-DEC-002 (by hash; their content as carried into REV-004 §2–§9 and ED-DEC-003), ED-DEC-003
(read in full). Specification lineage: REV-002, REV-003 (by hash), REV-004 (read in full). Audits: AUDIT-001 (carried
items ED1-F1, ED1-F2, ED2-F4, ED4-F4, ED7-F1, ED7-F2, ED7-F4, ED7-F5 read), AUDIT-R3 (read in full).
Implementation records: CONTRACT-REC, ADAPTER-REC (by hash; their code facts re-verified directly in code, §3.1).

### 3.1 Code facts verified this round (read-only)

| ID | Fact | Location |
|---|---|---|
| CF-1 | `normalizeDomain`: trim; add `https://` if no scheme; `new URL().hostname`; lower-case; strip trailing `.` and leading `www.`; `null` if empty / unparsable | `packages/core-discovery/src/normalize.ts:15–35` |
| CF-2 | `isPersonalContactIdentifier` = `/[^\s@/]+@[^\s@/]+\.[^\s@/]+/` (unanchored) or `^\s*(mailto\|tel\|sms):`; applied by `screenProviderKeys` (recursive, runs first in `prepare`) to every string whose key is not in `FREE_TEXT_KEYS = title, snippet, body, statement, evidence, basis` — so `context.targetCustomer/geography/service` are screened for contiguous emails and leading schemes; phones are not | `intentSignal.ts:91–96`; `intentSourceProviderContract.ts:272–303`, `:580–595` |
| CF-3 | `prepare*` order: common / type / URL / transient text / `observedAt` → `NO_INTENT_EVIDENCE` → verbatim / per-item / authorization → `UNATTRIBUTED` (`hasIdentity`: non-empty `name` and `website`) → `raw` (evidence + `context` verbatim). `title` / `snippet` / `body` only build the local `sourceText` for `checkVerbatim`; `authorization.basis` only `requireText`; none enters `raw`, `notes` or the outcome | `intentSourceProviderContract.ts:387–564` |
| CF-4 | `normalizeIntentEvent` builds intake (`quote: signal.evidence`, `website: business.website`) and **calls `toIntentIntakeInput`** during mapping; `context` is carried on the event (trimmed by `optionalText`), not on intake | `intentSource.ts:310–388`; adapters `intentSourceAdapters.ts:23–29, 52–149` |
| CF-5 | `toIntentSignalInput`: `requiredString` trims `website` and `quote`; persisted `signal` / `sourceQuote` = trimmed `quote`; authorization evidence validated last before `return`. `toIntentIntakeInput` re-prefixes entry errors as `signals[i].<field>` except `searchId` / `companyName` / `website` | `intentSignal.ts:236–330`, `:387–431` |
| CF-6 | `recordIntentIntakeForOwner`: `toIntentIntakeInput` → X1 (`requireExactProviderResultForIntake`) → `searches.getById` → `normalizeCandidate` (`website invalid`) → `findOrCreateByDomain` → writes; single-signal form calls `toIntentSignalInput` first (un-prefixed fields) | `apps/worker/src/searchWorker/intentIntake.ts:93–171` |
| CF-7 | `normalizeWith` maps `IntentSignalValidationError` → `REJECTED {field, reason, message}`; X1 re-derives via `normalizeWith` + `toIntentIntakeInput` on the verifier's private bytes; a re-derivation failure surfaces as `result-mismatch` (`signals[i]`), not as `REJECTED` | `intentSourceProviderContract.ts:688–787` |
| CF-8 | Proof state (`ISSUED` WeakMap: body bytes, signature, registry) is in memory only; the event carries the opaque `VerifiedProviderResult` | `providerAuthenticity.ts:167–178`, `:362–381`; `intentSourceProviderContract.ts:621–638` |
| CF-9 | Ingress logs only `{externalId, field, reason}` at P1 / P2 / P3 and returns a generic 400 / 401; P2 runs `normalizeVerifiedProviderResult` before P3 intake | `apps/web/src/server/intentIngress.ts:100–154` |
| CF-10 | `SUPPLIED_TO_US` → `FIRST_PARTY`; on the pulled path (`authenticated === null`) a result carrying any `SUPPLIED_TO_US` item is rejected `authenticity` / `required` **before** `checkCommon` and before K1's position | `intentSource.ts:73–76`; `intentSourceProviderContract.ts:454–459` |
| CF-11 | Test `intentSourceProviderContract.test.ts:578` = "a free-text evidence field may quote a business contact …" (pulled path, `body` contact → NORMALIZED); privacy-key tests at `:536–576` | test file |
| CF-12 | Existing fixtures / suite quotes spot-checked (`intentSourceFixtures.ts`, `intentSourceProviderFixtures.ts`, `intentSignal.test.ts`, `intentSource.test.ts`, provider-contract test, `intentIngress.test.ts`, `worker.test.ts` intake quotes): none contains a string REV-004 would classify as a trigger (e.g. `budget 3 lakh`, `Budget approved for Q2`, `Need an app, 3 lakh` → ≤ 1 digit per stretch) | test files |

## §4 Method

1. **Policy first.** For every REV-004 rule, the governing PO text was located (K1I-DEC §3–§8, PG-DEC §3–§6) and the
   expected outcome derived from it before reading REV-004's own expectation.
2. **Code second.** Every REV-004 statement about placement, order, field paths, trimming, logging, persistence and
   the proof mechanism was checked against the code (CF-1..CF-12), not against earlier records.
3. **Hand trace.** Every §9 row was traced through REV-004 §4.3 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 as written
   (not as REV-004 describes the row). Derived kinds were compared with the row's Kinds column; the provider / intake
   outcome was then derived from §5–§8 and CF-2..CF-10.
4. **Adversarial inputs.** For each special audit area, additional inputs not in §9 were constructed to probe the
   boundaries of each rule (mask binding, `P` boundary, guards, designators, separators, at-forms, context fields).
5. **No downgrade by label.** A REV-004 statement that a behaviour is intentional, accepted or "one number's extent"
   was not treated as establishing policy conformance; conformance was decided against K1-I3, K1-I4, PG-1..PG-4 and
   REV-004's own C-6.

Severity scale (this record): **BLOCKER** — a complete identifier bypasses K1 on realistic input, or a rule conflicts
with PO policy on realistic input; blocks readiness. **MAJOR** — policy non-conformance on narrower input, or a rule
whose outcome is undefined such that a reasonable implementation violates policy; must be dispositioned before
readiness. **MINOR** — precision, documentation, coverage or fail-closed over-capture with no privacy effect; does not
block alone. **OBSERVATION** — conforming, noted for the record.

---

## §5 Lifecycle matrix (every REV-004 §9 row)

Legend. **Derived** = kinds by independent trace. **=** ✔ if Derived equals REV-004 Kinds. **Prov** R = `REJECTED`
(`field` = offending evidence / context path, `reason = not-allowed`, fixed message), N = `NORMALIZED`. **Int**
r = rejected (`signals[i].quote` / `quote`, `not-allowed`), a = accepted. **Persist / display**: "none" = nothing
persisted, displayed or passed on (rejection outcome carries field / reason / fixed message only); "SQ" = statement
persisted verbatim (trimmed, CF-5) as `source_quote` / signal and carried on the event. **Pol** ✔ = consistent with
policy; otherwise the finding ID. **Eq** = provider and intake agree. **Test** ✔ = deterministic and testable as
written; otherwise the finding ID.

### 5.1 Masking (§9.1)

| Row | Trace (key step) | Derived | = | Prov | Int | Persist / display | Pol | Eq | Test |
|---|---|---|---|---|---|---|---|---|---|
| MK1 | fused M-x `xxx`; P = 7+3 = 10 ≤ 15 | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK2 | spaced M-x `xxxxx`; P = 7+5 = 12 | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK3 | M-x 3 + 2; P = 4+5 = 9 | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK4 | no digit → no phone stretch | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK5 | M-x 3, 2 / interior fused M-s `•••`; P = 10 / 13 | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK6 | `ext` ends stretch; base masked P = 10; `204` = extension digits | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK7 | edge `***` / `•••` → typography; 7 digits | PHONE | ✔ | R | r | none | R4-M1 | ✔ | ✔ |
| MK8 | both `**` edge → typography; 10 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MK9 | edge `**` / single `*` → typography | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MK10 | both `***` edge | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MK11 | P = 20; spaced mask may bind S1 (10) or S2 (15) → S2 free, 10 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MK12 | P = 20; fused mask binds S1 (10); S2 (13 admissible) free → 10 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MK13 | P = 10 | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK14 | P = 10 | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MK15 | P = 15 → "one masked number"; complete visible `98765 43210` absorbed | FRAGMENT | ✔ | N | a | **SQ — complete phone persisted** | **R4-F1** | ✔ | expectation enshrines R4-F1 |
| MK16 | P = 16; binding 10+6 inadmissible → S1 free | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MK17 | `or` splits: masked stretch + complete stretch | FRAGMENT, PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MK18 | interior `**` spaced both sides → typography | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |

### 5.2 Inserted characters, extensions, `#` (§9.2)

| Row | Trace | Derived | = | Prov | Int | Persist / display | Pol | Eq | Test |
|---|---|---|---|---|---|---|---|---|---|
| IC1 | single `*` inserted | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC2 | length-1 x-token between digits inserted | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC3 | `#` ordinary stretch character (no label) | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC4 | single `x` inserted | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC5 | spaced single `x`, digits both sides → kept | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC6 | 9 digits / single `•` | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC7 | 10 digits (base 7 also plausible) | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC8 | interior fused M-s `**`; P = 12 | FRAGMENT | ✔ | N | a | SQ | O-2 | ✔ | ✔ |
| IC9 | edge single `x` dropped | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| IC10 | letter `a` ends stretch → 5 + 5 | [] | ✔ | N | a | SQ | R4-M2 | ✔ | ✔ |
| EX1 | marker ends stretch; base 7 → PHONE; `204` extension digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| EX2 | spaced single `x` with digits both sides → inserted; 10 | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| EX3 | base 12 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| EX4 | no base; < 6 → extension alone | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| EX5 | no base; 7 ≥ 6 → ordinary | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| EX6 | `next` is not a whole-word marker | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| HS1 | Class O `order` + `#` designator → excluded | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| HS2 | `#` ordinary → 10 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| HS3 | `#` ordinary; `update` letters end stretch, 7 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| HS4 | generic `#` never excludes | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |

### 5.3 Reference labels and prose (§9.3)

| Row | Trace | Derived | = | Prov | Int | Persist / display | Pol | Eq | Test |
|---|---|---|---|---|---|---|---|---|---|
| RL1 | Class O + `no.` / Class R; letters `it` split anyway | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| RL2 | Class O + designator (`id`, `no.`, `number`, `:`) | [] | ✔ | N | a | SQ | ✔ (see R4-F4 for `:`) | ✔ | ✔ |
| RL3 | Class R | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| RL4 | Class S shape matches | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| RL5 | Class S shape fails | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL6 | Class O without designator → no exclusion | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL7 | same | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL8 | same | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL9 | token completeness fails (further digits in raw stretch) | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL10 | generic `No.` alone | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL11 | generic `ID` alone | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL12 | generic `number` alone | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL13 | contact words not inputs | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL14 | `hr` not a unit; adjacent prose letters | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| RL15 | letters split; ≤ 5 digits per stretch | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| RL16 | 7 / 6 digits, nothing established | PHONE | ✔ | R | r | none | ✔ (accepted over-capture, PG-1) | ✔ | ✔ |
| UN1 | unit token JOIN_NEAR another group → not excluded | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| UN2 | single quantity token + listed unit | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| UN3 | date / month / FY / year range / DD/MM/YYYY / time recognizers | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| UN4 | currency / thousands / `crore` / `%` / currency range | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| UN5 | version / IPv4 | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |

### 5.4 Separators (§9.4)

| Row | Trace | Derived | = | Prov | Int | Persist / display | Pol | Eq | Test |
|---|---|---|---|---|---|---|---|---|---|
| SP1 | 10 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP2 | space / spaced `-` are stretch characters | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP3 | whitespace quantity never ends a stretch | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP4 | not short decimal (5 after `.`), not IPv4 | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP5 | 10 / 7 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP6 | Unicode dashes non-letters | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP7 | `/`; no DD/MM/YYYY match | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP8 | `,`; thousands regex fails on word boundary | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP9 | parentheses non-letters; 10 / 11 / 11 | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP10 | `·` non-letter | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP11 | `_` non-letter | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP12 | line break non-letter | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP13 | n > 15; whole-group window of 10 | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP14 | 5 digits / single 16-digit group, no window | [] | ✔ | N | a | SQ | ✔ (see R4-M2) | ✔ | ✔ |
| SP15 | 6 / 6 / 15 / 8 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| SP16 | thousands-grouped / lone short decimal | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| SP17 | short decimals JOIN_NEAR → no exclusion; `x` inserted | PHONE | ✔ | R | r | none | ✔ (accepted, §10) | ✔ | ✔ |

### 5.5 Email (§9.5)

| Row | Trace | Derived | = | Prov | Int | Persist / display | Pol | Eq | Test |
|---|---|---|---|---|---|---|---|---|---|
| ER1 | A1; `gmail.com` ≠ W | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER2 | lower-cased copy | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER3 | A1; D = W; trailing `.` + end = sentence punctuation | BUSINESS_EMAIL | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER4 | subdomain of W | BUSINESS_EMAIL | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER5 | A2, no guard | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER6 | A2, D = W | BUSINESS_EMAIL | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER7 | A4 + literal ⟨DOT⟩; `jane` not prose | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER8 | A4 + word dot | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER9 | A3 + literal / bracketed dot | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER10 | A3 glued / spaced | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER11 | `[.]` / `(.)` dot-forms | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER12 | spaced literal dots | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER13 | A4 `at the rate` / `at-the-rate` | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER14 | A3 / A4, D = W, `info` not prose | BUSINESS_EMAIL | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER15 | Step 1 `mailto:` | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER16 | address ends at `?` | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER17 | same, D = W | BUSINESS_EMAIL | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER18 | glued punctuation outside local class / domain labels (`_` is a local character; harmless) | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER19 | same, D = W | BUSINESS_EMAIL | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER20 | `gmail..com` extracts single label `gmail` (empty label cannot join) → single-label branch; `gmail.c`, `-gmail.com` → ≥ 2-label invalid branch | UNCERTAIN_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ (R4-M3: §4.4.4 cites `gmail..com` under the wrong branch) |
| ER21 | A1 single label | UNCERTAIN_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER22 | A2 not handle (whitespace after `@`) / A3 single label | UNCERTAIN_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| ER23 | empty domain / empty local + valid domain / A3 empty domain | FRAGMENT | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER24 | A4 single label; `infosys.` + space ends domain | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER25 | prose guard (`available`, `published`); URL guard | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER26 | prose `us` / `now`; URL `www` | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER27 | price guard (A2) / all-numeric host (A1) | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER28 | empty local single label / handle guard | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| ER29 | A4, `tenders` not prose, valid domain | PERSONAL_EMAIL | ✔ | R | r | none | ✔ (accepted, §10) | ✔ | ✔ |
| ER30 | NFKC folds full-width; `\p{Cf}` removed | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| D1 | W = `example.com` (CF-1 `www.` strip); host and subdomain | BUSINESS_EMAIL (×2 if one text) | ✔ if two inputs | N | a | SQ | ✔ | ✔ | R4-M3 (multiset count ambiguous) |
| D2 | W = `shop.example.com`; parent | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| D3 | sibling | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| D4 | related / ccTLD | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| D5 | look-alikes; `'.' + W` boundary | PERSONAL_EMAIL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| D6 | W = null (unparsable) | PERSONAL_EMAIL | ✔ | — | — | — | ✔ | — | ✔ (kinds only) |
| D7 | W = null | PERSONAL_EMAIL | ✔ | — | — | — | ✔ | — | ✔ (kinds only) |
| MI1 | two A1 candidates | BUSINESS, PERSONAL | ✔ | R | r | none | ✔ | ✔ | ✔ |
| MI2 | two A1, both D = W | BUSINESS ×2 | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| MI3 | A1 + 10-digit stretch | BUSINESS, PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| NM1 | no at-signal, no digit | [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| NM2 | A4 `at` → single label `info` → nothing (consumes nothing); A1 → business | BUSINESS_EMAIL | ✔ | N | a | SQ | ✔ | ✔ | ✔ |

### 5.6 `context.*` (§9.6; each row × 3 fields × 3 families)

| Row | Trace | Expected (REV-004) | Derived | Pol | Test |
|---|---|---|---|---|---|
| CX1 | CF-2 regex matches; `screenProviderKeys` runs first | REJECTED, existing field / message | same | ✔ | ✔ |
| CX2 | same | REJECTED, existing | same | ✔ | ✔ |
| CX3 | CF-2 no match; K1 A3 → BUSINESS_EMAIL → `containsAnyContactIdentifier` | REJECTED by K1, `context.<name>` | same | ✔ (O-1 mechanism) | ✔ |
| CX4 | K1 A3 → PERSONAL_EMAIL | REJECTED by K1 | same | ✔ | ✔ |
| CX5 | K1 PHONE | REJECTED by K1 | same | ✔ | ✔ |
| CX6 | no at-signal, no digit | NORMALIZED | same | ✔ | ✔ |
| CX7 | FRAGMENT not a trigger | NORMALIZED | same | ✔ | ✔ |
| CX8 | fixed messages; evidence screened before `context.*` | holds | same | ✔ | ✔ |

Intake column not applicable (intake carries no `context.*`, CF-4).

### 5.7 Normalization (§9.7)

| Row | Trace | Derived | = | Prov | Int | Persist / display | Pol | Eq | Test |
|---|---|---|---|---|---|---|---|---|---|
| N1 | `\p{Nd}` mapping (preceding consecutive Nd count mod 10) correct | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| N2 | NFKC | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| N3 | NFKC maps NBSP / U+202F to space | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| N4 | words → digits; 2nd example: final `oh` is not between digits, not converted, ends stretch → 9 digits | PHONE | ✔ | R | r | none | ✔ | ✔ | R4-M3 (2nd example does not exercise `oh`) |
| N5 | Step 1 `tel:`; 8 digits, no exclusions | PHONE | ✔ | R | r | none | ✔ | ✔ | ✔ |
| N6 | 0 digits → FRAGMENT / 3 digits → nothing | FRAGMENT / [] | ✔ | N | a | SQ | ✔ | ✔ | ✔ |
| N7 | C-1 read-only; but intake trims (CF-5) | holds for listed rows | ✔ | — | — | — | ✔ | ✔ | R4-M3 (byte-for-byte is "after trim") |

### 5.8 Lifecycle (§9.8)

| Row | Code path | Derived | Pol | Test |
|---|---|---|---|---|
| L1 | `preparePublicIntent` → K1 → `reject('intentEvidence[i].evidence')` → `normalizeWith` REJECTED; no event | as expected | ✔ (K1-I6) | ✔ |
| L2 | pulled AI-platform result with a `SUPPLIED_TO_US` item is rejected `authenticity` before K1 (CF-10) | REJECTED, but possibly not by K1 | ✔ | **R4-M3**: must use the verified path and assert `field = evidence[i].statement` |
| L3 | `normalizeProviderBatch` per-result | as expected | ✔ (K1-I6) | ✔ |
| L4 | `UNATTRIBUTED` skip precedes K1 (CF-3) | as expected | ✔ | ✔ |
| L5 | clean event written | as expected | ✔ | ✔ |
| L6 | `toIntentIntakeInput` re-prefix (CF-5) before X1 / lookup (CF-6) | as expected | ✔ (PG-4) | ✔ |
| L7 | same detector / trigger set | as expected | ✔ | ✔ |
| L8 | single-signal form un-prefixed (CF-6) | as expected | ✔ | ✔ |
| L9 | BUSINESS not in evidence trigger set | as expected | ✔ (K1-R1) | ✔ |
| L10 | K1 reads only `quote`; provider `business.name` is screened by the existing screen, not K1 | as expected | ✔ | ✔ |
| L11 | rejection before any write | as expected | ✔ | ✔ |
| L12 | K1 in `toIntentSignalInput` precedes `normalizeCandidate` (CF-6) | as expected | ✔ | ✔ |
| L13 | at ingress, a K1 hit is caught at **P2** (provider path, provider field) before P3 intake (CF-9); a K1 *intake* rejection is not reachable through ingress | 400 + meta log, but at P2 | ✔ | **R4-M3** (row not reachable as phrased) |
| L14 | `title` / `snippet` / `body` → local `sourceText` only (CF-3); PUBLIC_INTENT → no X1 (CF-7) | as expected | ✔ (PG-3) | ✔ |
| L15 | `basis` → `requireText` only; X1 re-derivation same scope | as expected | ✔ (PG-3) | ✔ |
| L16 | pulled path, same scope | as expected | ✔ (K1-I5 r3) | ✔ |
| L17 | P2 REJECTED; at X1 a re-derivation failure is `result-mismatch` at `signals[i]` (CF-7), not "REJECTED" | P2 ✔; X1 wording imprecise | ✔ | **R4-M3** |
| L18 | CF-3, CF-8, CF-9 | holds | ✔ | ✔ |
| L19 | stored values equal input after trim (CF-5) | holds after trim | ✔ | R4-M3 (wording) |
| L20 | provider K1 screens a superset earlier (§7 below); (b) is tautological (AUDIT-001 ED7-F2) | holds | ✔ | R3-M9 / ED7-F2 |
| L21 | `:578` exists (CF-11); it is the **pulled** path, so the basis is K1-I5 r3, not PG-3 (AUDIT-001 ED7-F4 persists) | holds | ✔ | R3-M9 / ED7-F4 |
| L22 | `:536–576` unaffected (key screens) | holds | ✔ | ✔ |
| L23 | CF-12 spot-check: no existing quote / statement / context contains a trigger | holds (spot-checked) | ✔ | ✔ |

**Matrix totals:** 156 rows (MK 18, IC 10, EX 6, HS 4, RL 16, UN 5, SP 17, ER 30, D 7, MI 3, NM 2, CX 8, N 7, L 23).
Derived kinds equal REV-004 kinds in **every** row — REV-004's matrix is internally consistent with its §4. Policy
non-conformance enshrined by a row: **MK15** (R4-F1). Policy-tension rows: MK7 (R4-M1), IC10 (R4-M2), IC8 (O-2).
Test-precision rows: L2, L13, L17, L19, L20, L21, D1, N4, N7, ER20 (R4-M3). Provider / intake columns agree in every
row that has both.

---

## §6 R3-F1 … R3-F7

### 6.1 R3-F1 — masking

**Verdict: PARTIALLY RESOLVED. The audited AUDIT-R3 inputs are fixed; a residual form of mask contagion remains
(R4-F1, BLOCKER) and the binding rule is under-specified (R4-F5, MAJOR).**

Required cases:

| Input | REV-004 trace | Result | Assessment |
|---|---|---|---|
| `**9876543210**` | edge `**` both sides → typography | PHONE | ✔ fixed |
| `98765 XXXXX 98765 43210` | P = 20; S2 free | PHONE | ✔ fixed |
| `98765 43XXX` | P = 10 | FRAGMENT | ✔ masked |
| `98765 43***` / `98765 43•••` | edge → typography | PHONE | fail-closed; R4-M1 for `•••` |
| `98765 43XX` | P = 9 | FRAGMENT | ✔ |
| `98765 43**` | edge `**` → typography; 7 digits | PHONE | fail-closed (as MK7) |
| `XXX-XX-0100` | P = 9 | FRAGMENT | ✔ |
| `98765**43210` | interior fused M-s; P = 12 | FRAGMENT | O-2 (genuine ambiguity) |
| mask at beginning `XXXXX 43210` | P = 10 | FRAGMENT | ✔ |
| mask at end `98765 43210 XXXXX` (MK15) | P = 15 → one number | FRAGMENT | **✘ complete phone escapes (R4-F1)** |
| masks between digits `98XXX XX210` | P = 10 | FRAGMENT | ✔ |
| multiple sequences `98765 43XXX 98765 43210` | S2 free | PHONE | ✔ |
| separated by whitespace / punctuation | MK13 / MK14 | FRAGMENT | ✔ |
| complete phone adjacent to a mask, P ≤ 15 | step 2 | FRAGMENT | **✘ R4-F1** |
| multiple numbers adjacent to masks | see below | FRAGMENT | **✘ R4-F1** |

**15-position boundary, verified independently.**
- REV-004 claim "≤ 15 positions → masked candidate can become `FRAGMENT`": **true** (§4.6.4 step 2) — and it applies
  even when the stretch contains a complete, fully visible number (MK15).
- Claim "complete phone next to a mask can still be detected": **true only when `P > 15` and the mask's binding to the
  complete number's segment is inadmissible or optional** (MK11, MK12, MK16). At `P ≤ 15`, or when a **fused** mask
  can admissibly bind the segment containing the complete number, the complete number is not detected.

**Escapes found (R4-F1):**

| Input | Trace | Result |
|---|---|---|
| `98765 43210 XXXXX` (MK15) | P = 15 | FRAGMENT |
| `Call **9876543210** 24x7` | leading `**` edge; trailing `**` interior (digits `24`, `7` follow) and fused → M-s; single `x` inserted; P = 13 + 2 = 15 | FRAGMENT |
| `**98765 43210**, **98765 43211**` | inner `**` sequences interior + fused → M-s; P = 24; each fused mask binds its segment (10 + 2 ≤ 15) → no free segment | FRAGMENT — **two complete numbers escape** |
| `**9876543210** 2026` | P = 16; fused M-s binds S1 (12 ≤ 15); S2 = 4 digits | FRAGMENT |
| `98765 43210 / 98XXX XXXXX` | P = 20; S1 = `98765 43210 / 98` (12 digits); fused `xxx` binds S1 (15 ≤ 15) | FRAGMENT |
| `555-0100, 555-01XX` | P = 12 + 2 = 14 | FRAGMENT (complete PG-1 (a) local number) |
| `Plot XX, 9876543210` (Roman numeral / placeholder) | M-x needs no adjacency; P = 12 | FRAGMENT |

In each, a reading in which the mask belongs to another item is admissible and yields a complete, plausible number —
REV-004's own C-6 requires reporting it. The rule "a mask laid out within one number's extent" is applied to the
**stretch**, and the stretch merges separate items because (correctly, per R3-F5) separators do not end it. The two
changes interact: separators no longer split items, and the mask-extent rule still treats the whole stretch as one
number.

**Critical distinction (genuine mask vs formatting / typography / bold / punctuation / complete phone near a mask):**
REV-004 distinguishes x-masks (always established), edge `*` / `•` (typography) and interior fused `*` / `•`
(established). It does **not** distinguish markdown bold *pairs* that wrap a number followed by more digits, nor a
mask belonging to a *different* item in the same stretch. That is the residual defect.

### 6.2 R3-F2 — inserted characters / extensions

**Verdict: RESOLVED for non-letter characters and `x`; precedence deterministic. Residual: single letters other than
`x` / `o` (R4-M2).**

| Input | Result | Note |
|---|---|---|
| `98765*43210`, `98765x43210`, `98765#43210` | PHONE | single inserted character |
| `5550100x204`, `5550100 x 204` | PHONE | joined 10 digits (base 7 also plausible) |
| `extension 5550100` | PHONE | no base, ≥ 6 |
| `extension 204` | FRAGMENT | extension alone (PG-1 (c)) |
| `#9876543210` | PHONE | generic `#` |
| `Tender #12345` | [] | Class O + `#` (and 5 digits < 6) |
| `#` as punctuation / extension / reference designator | ordinary / ordinary / designator only after a qualifying label | deterministic (§4.6.5 r5) |
| `x` as extension (glued) / as mask (length ≥ 2) / single `x` | inserted / M-x / inserted or dropped at edge | deterministic |
| `xx`, `xxx` | always M-x (any position) | deterministic; see R4-F1 (`Plot XX`) |

**"A plausible phone cannot be made non-phone by inserting one character":** holds for every non-letter character and
for `x`; **fails for any other single letter** (`98765a43210` → [] , IC10), and two characters `**` / `••` / `xx`
inserted between digits turn a 10-digit number into a FRAGMENT (IC8, O-2). ED-DEC-003 §3.2 item 5 states the letter
rule as the engineering definition of "plausibly"; it is within the K1I-DEC §6 delegation but is not listed as a
residual false negative, contrary to REV-004 §4.11's last sentence (R4-M2).

### 6.3 R3-F3 — email detect → extract → validate → classify

**Verdict: RESOLVED for the AUDIT-R3 inputs. New defects: price guard suppresses complete spaced emails (R4-F3);
A4 + dotted non-domain tokens over-capture (R4-F2).**

| Case | Result | Assessment |
|---|---|---|
| normal / uppercase / business / personal | PERSONAL / BUSINESS per §4.2 | ✔ K1-R1, K1-I1/I2 |
| `mailto:` / `mailto:…?subject=` / query | classified; address ends at `?` | ✔ |
| `mailto:?subject=` (empty address) | no at-signal → nothing; URI span consumed | ✔ (outcome not stated, harmless) |
| malformed local part `.jane.@gmail.com` | dots trimmed → PERSONAL | ✔ |
| quoted local part `"jane.doe"@gmail.com` | local run empty (`"` outside class) → FRAGMENT | ✘ rare false negative (R4-M2) |
| malformed domain `gmail..com`, `gmail.c`, `-gmail.com` | UNCERTAIN | ✔ K1-I4 |
| numeric-looking domain `qty@12.50`, `admin@192.168.1.1` | nothing | ✔ established |
| `12.50` | short decimal | ✔ |
| `rate @ 12.50` | price guard | ✔ |
| `Email:jane@gmail.com` | PERSONAL | ✔ |
| `jane@gmail` | UNCERTAIN | ✔ K1-I3 r3 example |
| `jane@` / `@gmail.com` | FRAGMENT | ✔ K1-I3 r2 examples |
| spaced `@` / `john @ example.com` | PERSONAL / BUSINESS | ✔ |
| **`jane @ 163.com`** (digit-leading domain, spaced `@`) | **price guard → nothing** | **✘ R4-F3** (A1 `jane@163.com` is detected) |
| `jane at gmail.com` / `jane at gmail dot com` | PERSONAL | ✔ |
| `[at]`, `(at)`, `[dot]`, `(dot)`, spaced dots | PERSONAL | ✔ |
| URL-like `https://medium.com/@jane.doe` | empty local → FRAGMENT | ✔ not a trigger |
| social handles `@acme`, `follow @acme` | nothing | ✔ |
| dotted handles `follow @acme.design` | handle guard needs no ⟨DOT⟩ → PERSONAL | fail-closed over-capture (R4-M5) |
| **`Pre-bid meeting at 11.30am`**, **`supply at Rs.500 per unit`**, `office at No.12` | A4; labels `11`+`30am` / `rs`+`500` / `no`+`12`: ≥ 2 labels, a letter, no valid prefix → UNCERTAIN | **✘ R4-F2** (Rev 4's own time / price recognizers establish these) |

### 6.4 R3-F4 — reference-label exclusions

**Verdict: RESOLVED for bare ordinary words; residual with the `:` designator (R4-F4).**

| Input | Result | Assessment |
|---|---|---|
| `Tender No. 9876543210`, `Tender #9876543210`, `Tender ID: 9876543210` | [] | Class O + designator — labelled reference (K1I-DEC §6) ✔ |
| `PIN 123456` | [] | Class S shape ✔ |
| `ISBN …` (10 / 13 digits) | [] | Class S ✔ (any 10-digit run after `ISBN` is excluded; label-specific, acceptable) |
| `GSTIN …` | letters split the token into short groups anyway | ✔ |
| `No. 9876543210`, `ID 9876543210`, `number 9876543210` | PHONE | generic labels never exclude ✔ |
| `Mobile No. 9876543210`, `Call 9876543210` | PHONE | ✔ |
| `to order 98765 43210`, `in case 9876543210` | PHONE | ✔ |
| ordinary prose with numbers (`1200 students`) | [] (< 6 per stretch) | ✔ |
| numbers followed by further digits (`Order No. 98765 43210`) | PHONE (token completeness) | ✔ |
| **`To order: 9876543210`**, **`WhatsApp Business account: 9876543210`**, `Bulk order: 9876543210` | Class O + `:` designator → excluded | **✘ R4-F4** — a generic word + colon suppresses a complete phone |

### 6.5 R3-F5 — separators

**Verdict: RESOLVED. Boundaries are deterministic and rest on letters / consumed spans only.**

| Separator | Effect | Result |
|---|---|---|
| none / one space / multiple spaces / line break | formatting | joins |
| `.` | formatting, except a lone short decimal (content) | `98765.43210` PHONE; `12.50` [] |
| `-`, `–`, `—`, `−` | formatting; `-` / `–` / `—` inside `RANGE` only next to currency / unit | PHONE |
| `/` | formatting, except DD/MM/YYYY etc. (content) | `98765/43210` PHONE; `02/10/2026` [] |
| `,` | formatting, except thousands grouping (content) | `98765,43210` PHONE; `9,876,543` [] |
| `(`, `)` | formatting | PHONE |
| `·`, `_` | formatting | PHONE |

- Unit / decimal exclusions do not decide phone status for a multi-group number: both require a single quantity
  token not `JOIN_NEAR` another group (UN1, SP17). ✔
- `by 2026 150 schools` (the AUDIT-001 ED2-F4 / AUDIT-R3 UN9 case) → 7 digits → PHONE, listed as accepted over-capture
  (§4.11, RL16). It is a permitted fail-closed consequence of PG-1 ("formatting never decides"; volume accepted).
- **Adjacent unrelated numbers are merged** by design; Rev 4 widened this materially relative to REV-003 (`,`, `/`,
  ≥ 4 spaces and line breaks no longer split): `In 2024, 150 clients` → PHONE; `Sizes 10, 20, 50, 100 units` → PHONE.
  Policy-permitted (PG-1 volume acceptance) but under-documented (R4-M5).
- Rare false negative: comma-grouped phone `987,654,3210` → thousands exclusion takes `987,654` (R4-M2).

### 6.6 R3-F6 — email renderings

**Verdict: RESOLVED for every rendering named by AUDIT-R3. The only rendering false negatives found are R4-F3
(price guard) and the rare quoted local part (R4-M2); over-capture R4-F2 is new.**

| Rendering | Class | REV-004 kind | K1-I3 / I4 |
|---|---|---|---|
| `jane at gmail.com` | complete | PERSONAL | ✔ r1 |
| `jane at gmail dot com` | complete | PERSONAL | ✔ r1 |
| `jane [at] gmail [dot] com` | complete | PERSONAL | ✔ r1 (PO example) |
| `jane (at) gmail (dot) com` | complete | PERSONAL | ✔ r1 |
| `[.]`, `(.)` | complete | PERSONAL | ✔ |
| spaced dots | complete | PERSONAL | ✔ |
| `at the rate` | complete | PERSONAL | ✔ |
| ordinary prose `meet at noon`, `met at Infosys. Then` | ordinary | [] | ✔ |
| prose with abbreviation `workshop at St.Xavier's` | treated as complete | PERSONAL | fail-closed over-capture (R4-M5) |
| prose with time / price `meeting at 11.30am`, `at Rs.500` | treated as uncertain | UNCERTAIN | **✘ R4-F2** (established content) |
| URLs containing `at` (`/at/`) | not whitespace-delimited | [] | ✔ |
| social handles | ordinary | [] | ✔ (dotted handles over-captured, R4-M5) |
| `jane at gmail` | ordinary | [] | O-5 (plausibility delegated) |
| `jane [at] gmail`, `jane @ gmail` | uncertain | UNCERTAIN | ✔ r3 |
| `jane [at]`, `jane@`, `@gmail.com` | fragment | FRAGMENT | ✔ r2 |

No complete email rendering is retained as a "known limitation" for at / dot forms in English. Non-English at / dot
words remain carried (R3-M5).

### 6.7 R3-F7 — context fields

**Verdict: RESOLVED for the AUDIT-R3 input. PG-2 net effect holds for every class tested here except where R4-F1 /
R4-F3 already defeat the detector.**

Each of `context.targetCustomer`, `context.geography`, `context.service` (identical treatment; same code path):

| # | Class | Example | Existing screen (CF-2) | K1 (`containsAnyContactIdentifier`) | Outcome |
|---|---|---|---|---|---|
| 1 | personal email | `jane@gmail.com` | match → REJECTED first | — | REJECTED ✔ |
| 2 | business email | `info@example.com` | match → REJECTED first | — | REJECTED ✔ |
| 3 | obfuscated personal | `jane [at] gmail [dot] com` | no | PERSONAL | REJECTED ✔ |
| 4 | obfuscated business | `info (at) example (dot) com` | no | BUSINESS | REJECTED ✔ |
| 5 | normal phone | `98765 43210` | no (unless leading `tel:`) | PHONE | REJECTED ✔ |
| 6 | obfuscated phone | `nine eight seven six five four three two one zero`; `98765*43210` | no | PHONE | REJECTED ✔ (no §9.6 row) |
| 7 | uncertain phone / email | `9876543210`; `jane@gmail` | no | PHONE / UNCERTAIN | REJECTED ✔ (no §9.6 row) |
| 8 | ordinary text | `mid-size manufacturers` | no | [] | NORMALIZED ✔ |
| — | masked-contagion phone | `Call **9876543210** 24x7` | no | FRAGMENT | **NORMALIZED ✘ (R4-F1)** |
| — | spaced email, digit domain | `info @ 163.com` | no | nothing | **NORMALIZED ✘ (R4-F3)** |
| — | geography with postal code | `Pune 411001` | no | PHONE | REJECTED (over-capture, permitted; R4-M5) |

Consistency: provider path, shared detector and existing screen are consistent — the existing screen runs first and
keeps its field / message (CX1, CX2); K1 catches everything else the detector classifies. Intake carries no
`context.*`, so no provider / intake inconsistency arises. Mechanism note O-1.

---

## §7 Provider / intake equivalence

**Traced paths.**

```text
Provider: result → prepare(): screenProviderKeys → identity binding → common / type / URL / transient text /
          observedAt → NO_INTENT_EVIDENCE → verbatim / per-item / authorization → UNATTRIBUTED
          → K1 (evidence: containsPersonal…, website = business.website; context.*: containsAny…)
          → raw → normalizeIntentEvent → toIntentIntakeInput → toIntentSignalInput (+ intake K1 on trimmed quote)
          → NORMALIZED event (context trimmed) → [pushed: P3 X1 re-derives the same] → intake writes
Intake:   input → toIntentIntakeInput → toIntentSignalInput: shape / kind / field / trims / URL / observedAt /
          authorization → K1 (quote, website) → return → X1 → searches.getById → normalizeCandidate → writes
```

**Identity of inputs.** Intake `quote` = the provider evidence statement (via adapter `evidence`), trimmed; intake
`website` = `business.website`, trimmed; `normalizeDomain` trims anyway (CF-1, CF-4, CF-5). Same detector, same
trigger set (`containsPersonalContactIdentifier`) on both. Trimming: leading / trailing whitespace is never part of a
local token, domain side, digit or mask; edge-ness is defined by digits, not whitespace; A2 vs A1 at a trimmed edge
yields the same kind (` @gmail.com` / `@gmail.com` → FRAGMENT; ` @acme` / `@acme` → nothing; `jane @ ` / `jane @` →
FRAGMENT). **No case found where trimming changes a result.**

| Class | Provider | Intake (provider-derived) | Intake (non-provider) | Equivalent |
|---|---|---|---|---|
| business email | N | a | a | ✔ |
| personal email | R (evidence path) | not reached (provider rejected first) | r (`signals[i].quote`) | ✔ |
| obfuscated business | N | a | a | ✔ |
| obfuscated personal | R | — | r | ✔ |
| phone | R | — | r | ✔ |
| uncertain phone / email | R | — | r | ✔ |
| fragments | N | a | a | ✔ |
| ordinary text | N | a | a | ✔ |
| R4-F1 / R4-F3 inputs | N (escape) | a (escape) | a (escape) | ✔ (equivalent, but both wrong) |
| R4-F2 inputs | R | — | r | ✔ (equivalent over-capture) |

**Intentional differences, all permitted:** (1) `context.*` screened only on the provider path — PG-4 item 4 (intake
free text = `quote` only; intake has no `context`). (2) Rejection representation (`ProviderResultOutcome` vs thrown
error) — PG-4 consequence 3 (existing mechanisms). (3) Provider screens before mapping, so a provider-derived intake
K1 never fires — PG-4 consequence 2 ("rejects exactly the same results and nothing else") satisfied because the
provider check is a superset on identical text.

**Result: EQUIVALENT.** Equivalence does not cure the detector defects; it propagates them identically to both paths.

---

## §8 PG-3 transient lifecycle

| Field | Remains transient | Not persisted | Not displayed | Not logged | Not passed onward | Use limited to verification | Evidence |
|---|---|---|---|---|---|---|---|
| `title` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (`sourceText` for `checkVerbatim`; `requireText` validation) | CF-3 |
| `snippet` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | CF-3 |
| `body` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | CF-3 |
| `authorization.basis` | ✔ | ✔ (not in `AuthorizationEvidence`) | ✔ | ✔ | ✔ | ✔ (`requireText` only) | CF-3, `intentSignal.ts:78–89` |
| pushed-result proof | ✔ (WeakMap, request life) | ✔ | ✔ | ✔ (ingress logs `externalId` / `field` / `reason` only) | opaque object on `event.intake` only, consumed by P3 | ✔ (re-verify + X1) | CF-8, CF-9 |
| save-time re-check (X1) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (re-runs `normalizeWith`; K1 scope identical, PG-3 consequence 1) | CF-7 |

Failure messages are fixed text (no value echoed) on every reachable path. **No code behaviour contradicts PG-3.**
REV-004 §5 / §6 / L14–L18 state the scope correctly. Note: X1 surfaces re-derivation failures as `result-mismatch`
(L17 wording, R4-M3). `publication.publisher` is passed onward in `notes` and remains unclassified (R3-M7).

---

## §9 Five carried-forward minor findings

REV-004 §10 carries exactly five: R3-M3, R3-M5, R3-M6, R3-M7, R3-M9.

| ID | Original finding (reproduced) | REV-004 disposition | Fixed / carried / worsened | Policy consistency | Affects readiness | Severity now |
|---|---|---|---|---|---|---|
| R3-M3 | `tel:` scheme boundary: `Hotel:2026-10-02` → dial string → exclusions skipped → PHONE. Reproduced under REV-004 §4.9 / Step 1 (no word boundary stated). | carried | **carried; marginally worsened** — stretches no longer stop at `,` / `/`, so `Hotel: 2026-10-02, 150 rooms` captures 13 digits | fail-closed over-capture; conflicts narrowly with K1-I4 "established … date" | No | MINOR |
| R3-M5 | number words / at-dot words English-only; compound (`ninety-eight …`) and non-English forms not recognized | carried, now documented (§4.4.5, §10) | carried | **tension with K1-I3 r1** ("phone number written in words"): a documented false negative on a complete rendering. By AUDIT-R3's own R3-F6 principle, retaining it permanently requires either extension or PO acceptance | No, while realistic frequency is low; becomes a PO matter only if retained permanently | MINOR |
| R3-M6 | fail-closed over-capture not listed | §4.11 now lists categories; "recorded open" | **partially fixed**; REV-004 introduced further unlisted over-capture classes (R4-F2, R4-M5) | permitted under PG-1 (phones) / K1-I4 (emails), except R4-F2 | No (R4-F2 is separate) | MINOR |
| R3-M7 | `publication.publisher` (string, passed onward in `notes`) not classified in §5 | carried | carried, unchanged; §5 still has no row; K1-I5 requires a field-by-field mapping | presumably structured (a name); existing email screen applies; phones not screened | No | MINOR |
| R3-M9 | AUDIT-001 carried items not reconciled | carried; list now omits ED7-F1 | **partially fixed**: ED7-F1 (coverage) is in substance addressed by L14–L16 and §9.6 but its removal is not stated; ED4-F4 is in substance addressed by §4.8 "word boundaries" (e.g. `2025-261234` no longer matches) but still listed; ED7-F5 is addressed by §9 "provider fixtures override `business.website`" but still listed; **ED7-F2 (L20 tautology) and ED7-F4 (L21 cites PG-3 for a pulled-path test) remain live in REV-004** | documentation only | No | MINOR |

Addressed-by-restatement items R3-M1 (§4.2 + D1), R3-M2 (§9 written out), R3-M4 (§4.4 order), R3-M8 (§4.4.1) were
verified: all four are resolved in substance (O-6).

---

## §10 False-positive / fail-closed analysis

| Case | Trace | Classification | Reason |
|---|---|---|---|
| `12.50, 13.75` | short decimals `JOIN_NEAR` each other → exclusion withheld → 8 digits | **Permitted fail-closed consequence** | No currency / unit content; PG-1 consequence 3 forbids treating separator patterns as establishing non-phone; PG-1 accepts the envelope's volume effect. |
| `1920x1080` | single `x` inserted → 8 digits | **Permitted fail-closed consequence** | Identical shape to `5550100x204`; K1-I3 r1 names inserted characters; nothing establishes a dimension without a unit. |
| `Tenders at eprocure.gov.in` | A4; `tenders` not a prose word; valid domain | **Permitted fail-closed consequence** | `tenders@eprocure.gov.in` is a plausible mailbox; K1-I4 delegates "plausibly"; the prose list is a content guard. Volume risk on tender citations noted (R4-M5). |

New over-matching introduced or widened by REV-004:

| Case | Cause | Classification |
|---|---|---|
| `Pre-bid meeting at 11.30am`, `supply at Rs.500`, `at 9.30a.m.`, `office at No.12` | A4 literal ⟨DOT⟩ (new in REV-004) + "≥ 2 labels, letter, no valid prefix → UNCERTAIN" (new in ED-DEC-003) applied to A4; REV-004's own §4.8 time / price recognizers run later (Step 4) and cannot rescue | **Policy conflict** (K1-I4: "evidently a date, price, amount … causes no rejection") → **R4-F2 (MAJOR)** |
| `workshop at St.Xavier's`, `clinic at Dr.Rao` | A4 + glued-dot abbreviation forms a valid `EMAIL_DOMAIN` | permitted fail-closed (plausible syntax); unlisted → R4-M5 |
| `In 2024, 150 clients`; `10, 20, 50, 100 units` | `,` no longer ends a stretch | permitted (PG-1 volume); unlisted beyond one example → R4-M5 |
| `follow @acme.design` | handle guard requires no ⟨DOT⟩ | permitted fail-closed; unlisted → R4-M5 |
| `context.geography = "Mumbai 400001"` | PG-2 applies PG-1 to `context.*`; postal code unlabelled | permitted; high-frequency in geography; EG-1 → R4-M5 |

None of the three required cases is an engineering defect or a policy conflict. R4-F2 is a policy conflict and is
not among REV-004's accepted cases.

---

## §11 Test completeness

**Deterministic expectations:** every row has a deterministic expected result under REV-004 as written, except where
R4-F5 ambiguities would apply (no §9 row exercises them — which is itself the gap).

**Undefined terms used by rows:** none in the rows; the rules behind them have the R4-F5 ambiguities.

**Contradictions between rows:** none found. **Provider / intake columns:** agree in every row.

**Fixtures / domains:** `W = example.com` from `https://www.example.com` stated; provider fixtures must override
`business.website` (stated in §9 preamble; existing fixtures use other hosts — AUDIT-001 ED7-F5 resolved). Business /
personal classification explicit in every email row. D1 multiset count ambiguous (R4-M3).

**Changed rows ("Δ rev. 3"):** MK7, IC1–IC5, SP3, SP7, SP8, ER7, ER22, ER26 marked; consistent with ED-DEC-003 §3.1–§3.6.
Cross-record inconsistency: ED-DEC-003 §3.2 item 7 cites "EX1–EX10" (REV-004 has EX1–EX6) and §3.3 item 7 cites
"rows EA1–EA12" (no EA rows exist in REV-004; email rows are ER*) (R4-M4).

**Incorrect / imprecise rows:** L2, L13, L17, L19, L20, L21, N4 (2nd example), N7, D1, ER20 branch citation — R4-M3.

**Regression coverage of R3-F1..R3-F7:** each AUDIT-R3 example has at least one row (§9.9) — ✔.

**Missing coverage (separate from behavioural failures):**
- R4-F1 inputs (`Call **9876543210** 24x7`, `**98765 43210**, **98765 43211**`, `98765 43210 / 98XXX XXXXX`,
  `555-0100, 555-01XX`, `Plot XX, 9876543210`) — none; MK15 enshrines the defect.
- R4-F2 inputs (`meeting at 11.30am`, `at Rs.500`) — none.
- R4-F3 (`jane @ 163.com`) — none.
- R4-F4 (`To order: 9876543210`) — none (RL6 covers only the no-colon forms).
- R4-F5 (`9876543210 XXX XXX`; `**9876543210** 10:30`) — none.
- `context.*`: obfuscated phone, uncertain phone, uncertain email (classes 6–7 of §6.7) — no CX row (R4-M4).
- R3-M3 (`Hotel:`), R3-M5 (compound number words) — no row documenting the carried behaviour.

---

## §12 Findings

### R4-F1 — Residual mask contagion: complete, fully visible phone numbers become FRAGMENT — **BLOCKER**

1. **REV-004 rule:** §4.6.3 (M-x any length-≥ 2 x-token "fused to digits or not"; M-s interior + fused on one side),
   §4.6.4 step 2 ("Established mask and `P ≤ 15`: one masked number → FRAGMENT. Visible digits are never re-evaluated
   alone") and step 3 ("A mask fused to a segment binds it whenever admissible"); test MK15.
2. **Governing policy:** K1-I3 r1 (complete phone in any rendering → in scope), r2 (fragment = "no complete … phone
   number can be read"); K1-I4; PG-1 principle and consequence 1 (local / national numbers "must be recognized … in any
   rendering"); REV-004's own C-6 / ED3-P (any admissible reading yielding a plausible identifier → report).
3. **Code evidence:** none (detector not implemented); provider and intake would both NORMALIZE and persist the
   statement verbatim as `source_quote` (CF-4, CF-5, CF-6).
4. **Derivation:** §6.1 escapes table. `Call **9876543210** 24x7` → P = 15 → FRAGMENT. `**98765 43210**, **98765
   43211**` → both inner `**` are interior fused M-s and bind their segments → FRAGMENT. `98765 43210 / 98XXX XXXXX` →
   fused `xxx` binds the 12-digit segment that contains the complete number → FRAGMENT. `555-0100, 555-01XX` → P = 14 →
   FRAGMENT.
5. **Why non-conforming:** a stretch, which by design (R3-F5) now spans separate items, is treated as one number's
   extent; the complete number's digits can all be read, and no content establishes that the mask belongs to it. This
   is the R3-F1 defect class (markdown `**` around a phone, common in AI-platform / markdown statements; redacted
   lists), narrowed but not closed.
6. **Requires:** engineering correction (e.g. a mask binds only digits it is fused to or that lie within the same
   group run without an intervening separator-and-complete-number; a segment / sub-run whose own digits form a
   plausible number with no fused mask is evaluated; markdown pairs treated as typography). No PO decision needed.

### R4-F2 — A4 word-at + dotted non-domain token → UNCERTAIN_EMAIL on established times / prices — **MAJOR**

1. **REV-004 rule:** §4.4.1 A4 with literal ⟨DOT⟩; §4.4.4 classification row "≥ 2 labels, a letter present, no valid
   prefix → UNCERTAIN_EMAIL" (no form restriction); A4 guards = URL, Prose only; processing order Step 2 before Step 4.
2. **Governing policy:** K1-I4 ("A string the system establishes is not a contact identifier (for example, because it
   is evidently a date, price, amount …) is not uncertain and causes no rejection").
3. **Derivation:** `Pre-bid meeting at 11.30am` → labels `11`, `30am` → UNCERTAIN → REJECTED; `supply at Rs.500 per unit`
   → `rs`, `500` → UNCERTAIN → REJECTED. REV-004 §4.8 items 1–2 recognize `11.30am` as a time and `rs.500` as a price,
   but they run after Step 2.
4. **Why non-conforming:** content the specification itself establishes as a time / price causes rejection. Realistic
   in tender-notice evidence. Not listed in §4.11; new in REV-004 (REV-003 A4 had no literal dot).
5. **Requires:** engineering correction (e.g. A4 requires a valid `EMAIL_DOMAIN` prefix or yields nothing; or apply
   time / price recognizers as A4 guards). No PO decision.

### R4-F3 — A2 price guard suppresses complete spaced emails whose domain starts with a digit — **MAJOR**

1. **REV-004 rule:** §4.4.4 Price guard (A2: "`@` followed (≤ 1 whitespace) by a digit …").
2. **Governing policy:** K1-I3 r1 (any rendering conveying a complete address); K1-R1 r1 ("in any form").
3. **Derivation:** `jane @ 163.com`, `jane @ 126.com`, `info @ 1und1.de` → guard → nothing → NORMALIZED (and in
   `context.*`, CF-2 does not match the spaced form → NORMALIZED, contrary to PG-2 net effect). `jane@163.com` (A1) is
   detected, so the guard alone decides.
4. **Why non-conforming:** a digit after `@` does not establish a price when a valid `EMAIL_DOMAIN` with an alphabetic
   final label follows. Narrow input; complete-identifier false negative.
5. **Requires:** engineering correction (e.g. price guard applies only when the domain side has no valid prefix). No PO
   decision.

### R4-F4 — Class O ordinary word + `:` designator suppresses an unspaced complete phone — **MAJOR**

1. **REV-004 rule:** §4.8 item 5, Class O labels with designator set incl. `:`; token = one whitespace-free run.
2. **Governing policy:** K1I-DEC §6 ("evidently … a labelled reference number"); PG-DEC §3 (labels neither make nor
   unmake a phone); REV-004 C-6.
3. **Derivation:** `To order: 9876543210`, `Bulk order: 9876543210`, `WhatsApp Business account: 9876543210` → excluded
   → NORMALIZED. The spaced forms are saved by token completeness (RL9); the unspaced form is not.
4. **Why non-conforming:** a verb / prose noun followed by a colon is not content establishing a reference number; the
   R3-F4 defect class persists through the `:` designator. Whether `:` is a designator for Class O is the engineering
   choice at issue.
5. **Requires:** engineering correction (e.g. Class O requires a lexical designator — `no`, `no.`, `number`, `num.`,
   `#`, `id`, `ref` — not `:` alone; or Class O tokens that are themselves plausible phones are not excluded). No PO
   decision.

### R4-F5 — Mask-binding and stretch-scope rules are under-specified; outcomes diverge — **MAJOR**

1. **REV-004 rule:** §4.6.4 step 3 ("masks split the stretch into segments"; binding to "an adjacent segment");
   §4.6.3 "interior (a digit occurs on both sides within the stretch)"; §4.6.1 "A length-1 x-token with no digit on one
   of its sides within the stretch is dropped".
2. **Undefined points and divergent results:**
   - Whether a digitless piece (between two masks, or at a stretch end) is a *segment* a mask may bind.
     `9876543210 XXX XXX` (P = 16): counted → first mask may bind the empty middle segment → S1 free → **PHONE**; not
     counted → first mask's only binding is S1 (13 ≤ 15) → **FRAGMENT** (complete phone escapes).
   - Whether "within the stretch" means the raw stretch or the phone stretch after exclusion splitting.
     `**9876543210** 10:30`: raw → trailing `**` interior + fused → M-s → P = 12 → **FRAGMENT**; phone stretch (split
     at the excluded time) → edge → **PHONE**.
   - "Dropped" length-1 x-token: removed character vs stretch boundary; "no digit on one of its sides" adjacent vs
     anywhere on that side (outcomes coincide in the rows tested, not generally).
3. **Governing policy:** determinism of "plausibly" / "established" (K1I-DEC §6, PG-1 consequence 3: "must be stated
   explicitly … and covered by tests").
4. **Why it matters:** a reasonable implementation can choose the reading under which a complete phone escapes; no §9
   row disambiguates (MK11, MK12, MK16 pass under every reading).
5. **Requires:** engineering clarification + rows. No PO decision.

### Minor findings

| ID | REV-004 | Governing | Observation / example | Requires |
|---|---|---|---|---|
| R4-M1 | MK7; §4.6.3 edge `*` / `•` = typography | PG-1 consequence 2 (masked renderings must not by themselves trigger) | `98765 43•••` (canonical bullet mask, fused) → PHONE → REJECTED; justified as "undetermined" for `*` (footnote / emphasis), weaker for `•••`. Fail-closed; no privacy effect. | Engineering: reconsider edge `•` / ≥ 3 fused, or record rationale per glyph |
| R4-M2 | §4.11 last sentence "No residual is a false negative on a complete identifier" | K1-I3 r1 | Inaccurate: false negatives exist — R4-F1, R4-F3, R3-M5, and rare forms: single letter inserted (`98765a43210`, IC10), quoted local part (`"jane.doe"@gmail.com` → FRAGMENT), comma-grouped phone (`987,654,3210` → thousands exclusion), concatenated single group > 15 digits. | Engineering: correct the claim; list or close each (PO acceptance only if any is retained permanently) |
| R4-M3 | §9.8 / §9.5 / §9.7 rows | — (test precision) | L2 needs the verified path and a `field` assertion (CF-10 rejects first otherwise); L13 unreachable as "intake rejection" via ingress (P2 rejects first); L17 X1 yields `result-mismatch`, not REJECTED; L19 / N7 "byte-for-byte" is after trim (CF-5); L20(b) tautological (ED7-F2); L21 basis is K1-I5 r3, not PG-3 (ED7-F4); N4 2nd example never converts `oh`; D1 multiset count; §4.4.4 cites `gmail..com` under the ≥ 2-label branch though extraction yields a single label (same kind). | Engineering |
| R4-M4 | §9.6, §9.9; ED-DEC-003 §3.2 / §3.3 | PG-2; PG-1 consequence 3 | No CX rows for obfuscated phone, uncertain phone, uncertain email; no rows for R4-F1..F5 inputs; ED-DEC-003 cites non-existent rows EX7–EX10 and EA1–EA12. | Engineering |
| R4-M5 | §4.11 | PG-1 (volume accepted); K1-I4; EG-1 | Unlisted over-capture classes widened by REV-004: comma / line-break joins (`In 2024, 150 clients`), A4 abbreviations (`at St.Xavier's`, `at Dr.Rao`), dotted handles (`follow @acme.design`), `context.geography` postal codes (`Mumbai 400001`). Policy-permitted; volume unknown. | Engineering: document |
| R3-M3, R3-M5, R3-M6, R3-M7, R3-M9 | carried | §9 | see §9 | as §9 |

### Observations

| ID | Observation |
|---|---|
| O-1 | PG-2 mechanism. PG-DEC §7 says a business email in `context.*` is rejected "by the retained existing screen and not by K1-B"; REV-004 rejects obfuscated business emails through a new K1-placed predicate (`containsAnyContactIdentifier`) with a K1 message. Outcome matches PG-2's operative net-effect sentence and only adds screening (ED-DEC-003 §3.7 reasoning accepted). Not a conflict. |
| O-2 | IC8 `98765**43210`: two characters inside a digit run are genuinely either a 2-position mask or two inserted characters; REV-004's FRAGMENT is within the "established" delegation. Distinct from R4-F1 (mask outside the complete number). |
| O-3 | A phone used as the local part of a business email (`9876543210@example.com`) is consumed as BUSINESS_EMAIL and not separately reported. Policy does not address digits inside an email address. |
| O-4 | The three accepted false positives (§10) are permitted fail-closed consequences. |
| O-5 | `jane at gmail` → nothing (A4 single label) while `jane [at] gmail` → UNCERTAIN: plausibility choice within K1-I4 delegation, stated in ED-DEC-003 §3.6. |
| O-6 | R3-M1 (`www.` strip stated, D1), R3-M2 (§9 self-contained), R3-M4 (Step 4 uses only raw stretches / `JOIN_NEAR`), R3-M8 (glue stated per form) are resolved. Domain classification (§4.2) conforms to K1-R1, K1-I1, K1-I2 (D1–D7). Unicode digit mapping, NFKC, `\p{Cf}` removal are correct. Placement / order in §6–§7 match the code. |

**Counts:** BLOCKER 1 (R4-F1); MAJOR 4 (R4-F2, R4-F3, R4-F4, R4-F5); MINOR 10 (R4-M1..R4-M5, R3-M3, R3-M5, R3-M6,
R3-M7, R3-M9); OBSERVATION 6 (O-1..O-6).

---

## §13 Implementation readiness

```text
REV-004 implementation readiness: NOT READY
```

**Why (against the stated criteria):**
- *A critical detector case can bypass K1:* yes — R4-F1 (complete phone numbers in markdown bold followed by other
  digits, in redacted lists, or next to a short mask become FRAGMENT and are persisted verbatim).
- *A rule conflicts with PO policy:* yes — R4-F1 (K1-I3 r1 / PG-1 consequence 1), R4-F2 (K1-I4 established clause),
  R4-F3 (K1-I3 r1), R4-F4 (K1I-DEC §6 / PG-DEC §3).
- *A lifecycle result is undefined:* yes — R4-F5.
- *A test expectation contradicts policy:* MK15.
- *Provider / intake behaviour violates a governing requirement:* no — equivalence holds (§7).
- *PG-3:* holds in code (§8).
- *Carried-forward minors block:* no (§9).

**Resolved since AUDIT-R3:** R3-F2, R3-F5, R3-F6, R3-F7 substantially; R3-F3 and R3-F4 for the audited inputs;
R3-F1 for the audited inputs (residual = R4-F1).

**Remaining blockers to an implementation-authority decision:**
1. R4-F1 (engineering correction; MK15 expectation to be revised);
2. disposition of R4-F2, R4-F3, R4-F4, R4-F5 (engineering);
3. PD-1 (PENDING) and a separate implementation authorization, independent of this audit.

**Product Owner decision required: NO.** Every finding is engineering-correctable within K1-I3, K1-I4 and PG-1..PG-2.
Conditional only: if engineering elects to retain any complete-identifier false negative permanently (R3-M5 number /
at-dot words, R4-M2 forms) as an accepted limitation, a PO acceptance would be needed (the AUDIT-R3 R3-F6 conditional
path); this audit does not choose that path.

---

## §14 Governance

```text
Record type: READ-ONLY CONFORMANCE AUDIT (REV-004)

PO decisions changed:            NO
PD-1 changed:                    NO (PENDING)
Implementation authorized:       NO
Implementation performed:        NO
Tests modified:                  NO
Dependencies changed:            NO
Migrations / schemas changed:    NO
Provider calls:                  NO
External research:               NO
Validation:                      NO
Participant contact:             NO
Commit:                          NO
Push:                            NO

Findings fixed:                  NO
ED-DEC-004 created:              NO
Specification rev. 5 created:    NO
REV-004 modified:                NO
Existing records modified:       0
Files created this round:        1 (this record)
```

## §15 Independence limitation

REV-004 and ED-DEC-003 name their author only by role ("Engineering specification owner, K1 workstream"). AUDIT-R3
states it was produced by the same assistant family that authored REV-003, ED-DEC-002 and AUDIT-001, and PG-DEC /
K1I-DEC record that Claude Code acted as delegated Product Owner. The repository record indicates that REV-004 and
ED-DEC-003 were produced in the same Claude Code workflow. **This audit was produced by Claude Code (model Claude
Opus 5.5), the same assistant family.** It is not a human-independent review. To compensate, no conclusion of REV-004,
ED-DEC-003 or AUDIT-R3 was accepted as authoritative: governing PO text and current code were read first, every §9 row
was re-traced by hand from REV-004 §4, and adversarial inputs were constructed for every special audit area. No code
was executed against a detector (none exists); hand traces may contain errors that an implementation-level test would
expose.
