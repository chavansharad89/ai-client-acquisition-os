# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION REV. 3 — CONFORMANCE AUDIT

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-003-CONFORMANCE-AUDIT-001
**Date:** 2026-10-02
**Type:** Independent, read-only conformance audit. Not a Product Owner decision, not an engineering decision, not a
specification revision, **not an implementation authorization**.
**Audit target:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-003 ("REV-003",
`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_003.md`).

> **PD-1: PENDING. Implementation authorized: NO.**
> Findings below are observations. None is fixed, decided or resolved by this record.

**Independence disclosure.** This audit was produced by the same assistant family that authored REV-003, ED-DEC-002
and AUDIT-001. To compensate, no conclusion of an earlier record was accepted as authoritative: every verification point
was re-derived in the order **governing PO records → current code → REV-003 rules → REV-003 test matrix**, and every
REV-003 rule cited below was traced by hand against concrete inputs. "Trace" in this record means a hand evaluation of
REV-003 §4 as written; no detector code exists and none was written or run.

**Abbreviations:** K1-DEC (K1 residual PO decision), K1I-DEC (implementation-semantics PO decision), PG-DEC (policy-gaps
PO decision), PO-DEC (original code-gap PO decision, K1-B), ED-DEC-001 / ED-DEC-002 (engineering decisions), AUDIT-001
(prior spec conformance audit), REV-002 (spec rev. 2), OQ-DEC (OQ-3..OQ-12 decisions), READINESS-001 (PD-1..PD-12),
CONTRACT-REC, ADAPTER-REC, DEC-003 as in prior records. `C` = detection copy (REV-003 §4.3). `W` = normalized business
website domain. "E" = a text placed in an evidence statement (provider) or `quote` (intake).

---

## §1 Baseline (verified before auditing)

| Check | Expected (REV-003 §1 / ED-DEC-002 §1) | Observed | Result |
|---|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | same | PASS |
| Staged files | 0 | 0 | PASS |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty diff) | same | PASS |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`; all other changes untracked `requirement/` records | same (28 untracked `requirement/` records + 1 modified) | PASS |
| REV-003 sha256 | `c3f42694d2b3a76d34fd9cd1118711103e0fe61bed4780e68c5f05c259e374bf` | same | PASS |
| This record's file / ID | must not exist | did not exist | PASS |

**Baseline: PASS.** No discrepancy; the audit proceeded.

---

## §2 Scope

In scope: REV-003 §2–§10 in full; its consistency with the governing PO policy (§3 below); the code facts REV-003
relies on; the §9 test matrix; implementation readiness.

Out of scope: deciding any PO question; correcting any finding; PD-1..PD-12; provider selection; any code, test, schema,
migration, API, UI, configuration or dependency change.

## §3 Governing records and hashes (all verified this round)

| # | Record | File (`requirement/`) | sha256 | Match |
|---|---|---|---|---|
| 1 | PO-DEC (K1 original, K1-B) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_PRODUCT_OWNER_DECISION.md` | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| 2 | K1-DEC (K1-R1..R3) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_RESIDUAL_PRODUCT_OWNER_DECISION.md` | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| 3 | K1I-DEC (K1-I1..I6) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_SEMANTICS_PRODUCT_OWNER_DECISION.md` | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes |
| 4 | PG-DEC (PG-1..PG-4) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POLICY_GAPS_PRODUCT_OWNER_DECISION.md` | `448370f18b9d093e62fbb9c3463dd79631a0a352eb399dc97a1151ceee3bac5d` | Yes |
| 5 | ED-DEC-001 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION.md` | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` | Yes |
| 6 | ED-DEC-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION_AMENDMENT.md` | `b9c7aaa8af5e99b2c6e2cd74054eaa0f163944b8acb33a47edb3fdc805abefde` | Yes |
| 7 | REV-003 (target) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_003.md` | `c3f42694d2b3a76d34fd9cd1118711103e0fe61bed4780e68c5f05c259e374bf` | Yes |
| 8 | AUDIT-001 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_CONFORMANCE_AUDIT.md` | `53c79c39a73fa522217a5805ddd73ec39a977741eedd4151ee7fe237f66d8b97` | Yes |
| 9 | DEC-003 | `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| 10–12 | OQ-DEC (OQ-3, OQ-7, OQ-11) | `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| 13 | CONTRACT-REC | `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| 14 | ADAPTER-REC | `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| 15 | READINESS-001 (PD-1) | `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |
| 15a | REQ-001 (R-9.2, R-13.13 cited by PD-1) | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| 16 | REV-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION.md` | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` | Yes |
| 16 | REV-PREP (rev. 1) / K1-ESPEC (rev. 0) | `…_SPECIFICATION_REVISION_PREPARATION.md` / `…_SPECIFICATION_PREPARATION.md` | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` / `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` | Yes |
| 16 | PG-PREP / PG-Q | `…_K1_POLICY_GAPS_PO_DECISION_PREPARATION.md` / `…_PO_QUESTIONNAIRE.md` | `9ae7fca776c6dd50edb6ca90fc41e6de89e4a9d7ec70b57a50e5662ca9ff8d5d` / `ea6d8121bba3f926ec3d11f2677d48f9ede37873bdaf7d3ef45dc8cf140d8a52` | Yes |

PD-1 status re-checked in READINESS-001 (row PD-1: "Whether to authorize implementation of any part of the
provider-neutral core"; no decision record exists). **PD-1 remains PENDING.**

### Code facts verified (read-only)

| ID | Fact | Location |
|---|---|---|
| CF-1 | `normalizeDomain`: trim, add scheme, `new URL().hostname` (IDN → A-label), lower-case, strip trailing `.` and leading `www.`; `null` if unparsable | `packages/core-discovery/src/normalize.ts:15–35` |
| CF-2 | OQ-7 identity anchor = `normalizeCandidate` → `normalizeDomain` (so the website `www.` strip is the OQ-7 normalization) | OQ-DEC OQ-7 item 1; `normalize.ts` |
| CF-3 | Existing structured screen `isPersonalContactIdentifier` = `/[^\s@/]+@[^\s@/]+\.[^\s@/]+/` or leading `mailto:`/`tel:`/`sms:`; applied by `screenProviderKeys` to every key **not** in `FREE_TEXT_KEYS = title, snippet, body, statement, evidence, basis` — so `context.targetCustomer/geography/service` and `publication.publisher` are screened by it; phones (other than leading `tel:`/`sms:`) are not | `intentSignal.ts:91–96`; `intentSourceProviderContract.ts:272–303` |
| CF-4 | `prepare*`: `checkVerbatim` / per-item checks, then `UNATTRIBUTED` skip (`hasIdentity` requires non-empty `name` and `website` strings), then `raw` built with evidence + `context`; `title`/`snippet`/`body` used only in local `sourceText`; `authorization.basis` only `requireText`-checked; none of them enters `raw` | `intentSourceProviderContract.ts:387–560` |
| CF-5 | `AuthorizationEvidence` persisted = `businessId, status, scope, authorizedAt, integrationId` (no `basis`) | `intentSignal.ts:78–89` |
| CF-6 | Intake `quote` = adapter `evidence` (= provider evidence statement, unmodified) → `requiredString` trims; intake `website` = `business.website` | `intentSourceAdapters.ts:60,107,144`; `intentSource.ts:315–330`; `intentSignal.ts:236–248` |
| CF-7 | `recordIntentIntakeForOwner`: `toIntentIntakeInput` → X1 (`requireExactProviderResultForIntake`) → `searches.getById` → `normalizeCandidate` (`website invalid`) → `findOrCreateByDomain` → writes | `apps/worker/src/searchWorker/intentIntake.ts:93–130` |
| CF-8 | `toIntentIntakeInput` re-prefixes per-entry errors as `signals[i].<field>` | `intentSignal.ts:387–431` |

---

## §4 Severity scale used

| Severity | Meaning |
|---|---|
| CONFORMING | REV-003 matches the governing record; no action. |
| MINOR FINDING | Precision, documentation or coverage issue with no policy-outcome effect on realistic input; does not block. |
| MAJOR FINDING | Policy non-conformance on narrower inputs, or behaviour left undefined where a reasonable implementation violates policy. Must be dispositioned before implementation authorization. |
| CRITICAL BLOCKER | REV-003 rules **and** test expectations mandate an outcome contrary to PO policy on realistic input, or a rule is contradictory / unimplementable. Blocks implementation authorization. |
| OPEN POLICY QUESTION | Governing records genuinely do not answer the question; only the PO can. |

---

## §5 Verification results (16 points)

### V1 — K1-R1 consistency — **CONFORMING** (one MINOR: R3-M1)

- REV-003 §4.2: `D === W` or `D.endsWith('.' + W)` → business; everything else → personal; every phone → `PHONE` →
  rejected (§4.7). Matches K1-R1 rules 2–3 (business = attributed organization's normalized website domain; every other
  email and every phone = personal).
- Public availability is not an input anywhere in §4 → K1-R1 rule 4 respected.
- `mailto:` / `tel:` / `sms:` in §4.4 Step 1 → K1-R1 rule 1 respected (but see R3-F3 for `mailto:` with query).
- Related / affiliate / ccTLD domains: no list, no registrable-domain reduction (§4.2) → personal (M6, M11).
- No rule silently changes the PO decision. R3-M1 records that the OQ-7 `www.` strip widens "website host" for
  `www.`-hosted websites; this is policy-sanctioned (K1-I1 "normalized as OQ-7 already provides"; K1I-DEC §3 non-decision
  lists `www.` as E-1 engineering) but neither stated nor tested in REV-003.

### V2 — K1-R2 name handling — **CONFORMING** (coverage gap in R3-M2)

- No §4 rule reads names; contact words and names are explicitly "not inputs" (§4.7, §4.8 item 5).
- C-1 (stored byte-for-byte, nothing stripped / masked) and N6 → quotes verbatim.
- Rejection trigger is exclusively `PERSONAL_EMAIL` / `UNCERTAIN_EMAIL` / `PHONE` (§4.1) → identifiers, not names.
- No identity inference: §4.2 classification uses only the source-supplied website (OQ-7 item 3, K1-R2 rule 5).
- UN3 (`9876543210 Ms. Rao`) is name + phone → rejected because of the phone. There is **no** row for a name alone or
  name + business email (R3-M2).

### V3 — K1-R3 privacy-screen relationship — **CONFORMING**

- §6: K1 uses existing `reject(path, 'not-allowed', …)` → `ProviderResultOutcome { status: 'REJECTED' }`; §8 "no new
  enum member". OQ-3 text untouched; no fifth condition. Existing `REJECTED` outcome intact.
- Intake (§7): thrown `IntentSignalValidationError('quote','not-allowed',…)`, the existing validation-failure mechanism
  (PG-4 consequence 3).
- Note (conforming): K1 runs after the `UNATTRIBUTED` skip, so an unattributed result containing a personal identifier
  is `UNATTRIBUTED`, not `REJECTED` (REV-002 R5). This is consistent with K1-R1, which is defined for items "attributed to
  an organization under OQ-7"; nothing of the item is persisted or passed on (CF-4).

### V4 — K1-I1 / K1-I2 domain semantics — **CONFORMING** (R3-M1)

| Case | REV-003 | Policy | Result |
|---|---|---|---|
| Website host | `D === W` → business (EM3) | K1-I1 r1 | ✔ |
| Subdomains (any depth) | `D.endsWith('.'+W)` → business (EM6) | K1-I1 r2 | ✔ |
| Parent | website `shop.example.com`, `x@example.com` → personal (M4) | K1-I1 r3 | ✔ |
| Sibling | `x@mail.example.com` with website `shop.example.com` → personal (M5) | K1-I1 r4 | ✔ |
| Suffix look-alikes | `x@notexample.com`, `x@example.com.evil.io` → personal (M11); the `'.'+W` boundary prevents `notexample.com` | K1-I1 r5 | ✔ |
| ccTLD variants / aliases / parent / sister / affiliate | no list; `example.co.in`, `example-group.com` → personal (M6) | K1-I2 | ✔ |
| Claimed relationship in text | not an input | K1-I2 last row | ✔ |

Canonicalization cannot classify a related domain as business: the only transformations are case, trailing dot, IDN
A-label and a leading `www.` (CF-1). The `www.` strip on `D` is harmless (`www.X` is a subdomain of `X` anyway); the
`www.` strip on the **website** is the R3-M1 observation.

### V5 — K1-I3 renderings and masking — **NON-CONFORMING** (R3-F1, R3-F2, R3-F3, R3-F6)

| Rendering | REV-003 rule | Result |
|---|---|---|
| `[at]`, `(at)`, `{at}`, `<at>` | E-c | ✔ detected (EM5, M8) |
| word `at` + word / bracketed `dot` | E-d | ✔ detected (EM8) |
| word `at` + literal `.` (`jane at gmail.com`) | not detected (documented EM11) | ✘ R3-F6 |
| `[.]` (defanged dot), spaced literal dot (`jane @ gmail . com`), "at the rate" | not detected, **undocumented** | ✘ R3-F6 |
| `[dot]`, `dot` | ⟨DOTW⟩ | ✔ |
| Phone in words | Step 3, English single-digit words only | ✔ for P15; compound / non-English words undocumented (R3-M5) |
| Clearly masked (`98765 43XXX`, `+91 98765 XXXXX`) | §4.5 masked run → `FRAGMENT` | ✔ (MK1–MK4) — the AUDIT-001 ED2-F1 defect is fixed |
| Masked number reduced to visible digits | §4.5 "never re-evaluated alone" | ✔ cannot happen |
| Mask sequence adjacent to a **complete** number | §4.5 chaining makes the whole run masked | ✘ R3-F1 (complete numbers neutralized) |
| Single inserted character between digits | §4.5 / §4.6 rule 6 → `FRAGMENT` or extension split | ✘ R3-F2 (contrary to K1-I3 r1 "with inserted characters") |
| Fragments (`jane@`, `@gmail.com`, `ext 204`) | §4.4.4, §4.6 r3 | ✔ (M9, EX7) |
| Glued punctuation around a complete email (`Email:jane@gmail.com`) | outcome undefined | ✘ R3-F3 |

### V6 — K1-I4 uncertain strings — **NON-CONFORMING in specific places** (R3-F2, R3-F4, R3-F5, R3-F6)

- The fail-closed rule is applied correctly in `UNCERTAIN_EMAIL` (EM9), bare runs 6–15 (P6/P7/P11), MK8/EX5 (`x`
  extension reading), and residuals P29 / UN9.
- Engineering's definition of "plausibly" **narrows** K1-I4 where an acknowledged ambiguity is resolved toward
  "not an identifier": single inserted mask-capable character (R3-F2), ordinary-word "specific labels" (R3-F4),
  separator choice (R3-F5), `word at domain.tld` (R3-F6). In each case the system has not *established* a non-identifier
  meaning (K1I-DEC §6: "evidently a date, price, amount or labelled reference number").
- Broadenings (fail-closed over-capture) exist but are within PG-1's accepted volume effect: ED2-F4 joins (UN9),
  number-word joins, alphanumeric codes, URL digit runs, `hotel:` scheme (R3-M3, R3-M6), `Book now @ www.example.in`
  (EM12). Recorded, non-blocking.

### V7 — K1-I5 text-field lifecycle — **CONFORMING** (R3-F7 for `context.*`; R3-M7)

| Field | REV-003 §5 | Code fact | Result |
|---|---|---|---|
| Evidence statements (3 families) | screened | persisted as `source_quote` (CF-4, CF-6) | ✔ K1-I5 r1 |
| `title`, `snippet`, `body` | not screened | used only in local `sourceText` (CF-4) | ✔ r3 |
| `authorization.basis` | not screened | `requireText` only; not in persisted `AuthorizationEvidence` (CF-5) | ✔ r3 |
| Temporary verification text (`sourceText`) | not screened | local variable | ✔ r3 |
| Pushed-result proof | not screened (PG-3) | carried opaque; X1 re-runs `normalizeWith` (§6) | ✔ PG-3 |
| `context.targetCustomer/geography/service` | screened + CONTRACT-REC §3 | carried on `raw` / event (CF-4) | ✔ r2 / PG-2 (net-effect gap R3-F7) |
| Structured fields | existing screens only | CF-3 | ✔ r4 |
| `publication.publisher` (string, passed on in notes) | not named in §5 | CF-3 structured screen applies | R3-M7 (classification unstated) |

Accidental onward flow: C-2 (no value output), §8 fixed messages, X4 ("transient values absent from outcomes, messages,
logs, events, intake and saved rows") cover it. Conforming.

### V8 — K1-I6 rejection unit — **CONFORMING**

- Provider: first trigger → `reject` → whole result `REJECTED` (§6); later evidence entries not evaluated; no partial
  acceptance; no stripping (§8, C-1). Other batch results unaffected (R3). Persisted rows unaffected (§8; I9).
- Non-provider intake: whole event (§7, §8; I2, I8), thrown before X1 / lookup / write (CF-7). Separately defined unit;
  provider path unchanged.

### V9 — PG-1 phone policy — **NON-CONFORMING in specific places** (R3-F1, R3-F2, R3-F4, R3-F5)

| Sub-point | REV-003 | Result |
|---|---|---|
| Local / national numbers | 6–15 digits → `PHONE` (P1, P2, P31) | ✔ (5-digit local numbers excluded by `L_min = 6`; ED1-F1 carried) |
| Formatting not decisive (`+`, parentheses, labels, `tel:`) | §4.7 "not inputs" | ✔ for those; ✘ for separator choice `/`, `,`, ≥ 4 whitespace (R3-F5) and markdown `**` (R3-F1) |
| Extensions | §4.6 base judged (EX1–EX4, EX9) | ✔ |
| Extension-only | `< 6` digits → `FRAGMENT` (EX7); `≥ 6` → normal (EX6) | ✔ (AUDIT-001 ED2-F2 fixed) |
| Bare digit runs | K1-I4 envelope 6–15 (P6/P7/P11) | ✔ |
| Masked | `FRAGMENT` (MK1–MK5) | ✔ for true masks; over-reach R3-F1 / R3-F2 |
| Unicode digits | §4.3 NFKC + `\p{Nd}` mapping (N1, N2) | ✔ — the "preceding consecutive `\p{Nd}` code points in code-point order, mod 10" rule is correct given Unicode's contiguous 0–9 `Nd` blocks |
| Threshold within PO constraints | `L_min = 6 ≤ 7`, `L_max = 15`; formatting and country / area code not inputs | ✔ |

### V10 — PG-2 context fields — **PARTIALLY CONFORMING** (R3-F7)

- All three fields treated as free text and screened by K1 (§5, §6 order: after evidence statements). ✔
- Business **contiguous** email → rejected by the retained CONTRACT-REC §3 screen (C1); personal email → rejected (C2);
  phone → rejected by K1 (C3). ✔
- **Gap:** obfuscated business email (`info [at] example [dot] com`) in `context.*` → K1 = `BUSINESS_EMAIL` (not a K1
  trigger) and CF-3 regex does not match → NORMALIZED. PG-DEC §4 "Net effect: no email address (business or personal)
  … may appear in a `context.*` value" is not met (R3-F7). REV-003 §10 carries this as an open observation stating no
  PO decision is needed, but does not resolve it.

### V11 — PG-3 pushed-result proof — **CONFORMING**

`title`, `snippet`, `body`, `basis` are outside K1 (§5) and X1 re-derivation uses the same `normalizeWith` scope (§6),
satisfying PG-DEC §5 consequence 1. The PG-3 conditions (in memory only; not saved, displayed, logged; used only for
re-verification) are restated in §2 and tested by X4. Code confirms none of these fields enters `raw` or persisted
evidence (CF-4, CF-5). The conditional nature ("if any condition stops being true, K1-I5 r2 applies") is preserved.

### V12 — PG-4 non-provider intake — **CONFORMING**

- K1 on `quote` at the end of `toIntentSignalInput` (§7); whole event rejected via `toIntentIntakeInput` (CF-8) before
  X1, `getById`, `normalizeCandidate`, `findOrCreateByDomain` and writes (CF-7). ✔
- Existing mechanism: `IntentSignalValidationError`, `not-allowed`; no new outcome. ✔
- Provider-path equivalence: intake `quote` = provider evidence statement trimmed, `website` identical (CF-6); trimming
  cannot change any §4 result (leading / trailing whitespace is never part of a detected span; `\p{Cf}` such as U+FEFF
  is removed anyway). Provider path screens a superset earlier, so no provider result changes outcome (PG-4 consequence
  2). ✔
- Non-normalizable website → `W = null` (all emails personal), existing `website invalid` unchanged (I10, I11). ✔

### V13 — The five AUDIT-001 critical defects — **ALL FIVE CORRECTED AS STATED; two corrections introduce new defects**

| # | AUDIT-001 | REV-003 rule | Test rows | Independent verdict |
|---|---|---|---|---|
| 1 | ED2-F1 masks unreachable | §4.5 qualifying mask sequences are run symbols; masked run → `FRAGMENT`; visible digits never re-evaluated | MK1–MK5 | **Fixed** for the audited inputs. New over-reach: R3-F1 (mask contagion), R3-F2 (single inserted character). |
| 2 | ED2-F2 `extension` + ≥ 6 digits | §4.6 rule 3 (`< 6` fragment, `≥ 6` normal); rule 2 bounded 1–6 digits "not followed by a digit"; whole-word markers | EX6, EX7, EX10 | **Fixed.** But the extension-context rule also lets a glued `x` / `#` split a 10-digit number into 5 + 5 (R3-F2). |
| 3 | ED4-F1 generic labels | §4.8 item 5 "Generic labels … never establish an exclusion by themselves" | GL1–GL8, P33 | **Fixed** for `No.` / `ID` / `#` / `number`. Residual with ordinary-word specific labels: R3-F4. |
| 4 | ED4-F2 ordinary-word units | §4.8 item 3 closed spaced / glued-only lists, followed by non-letter, single-token + single-group condition | UN1–UN8 | **Fixed.** `in`, `ms`, `hr`, `min`, single letters spaced no longer exclude; multi-group runs never excluded (UN4). |
| 5 | ED6-F1 prose emails | §4.4.2 numeric final label invalid; E-d requires ⟨DOTW⟩ only; E-b requires valid `EMAIL_DOMAIN` | EM1, EM2, EM10 | **Fixed** for over-capture. Recall side: R3-F3, R3-F6. |

### V14 — Internal detector correctness — **FINDINGS** (R3-F1, R3-F2, R3-F3, R3-M3, R3-M4, R3-M8)

| Aspect | Verdict |
|---|---|
| Normalization order (NFKC → strip `\p{Cf}` → `\p{Nd}` → lower-case) | Correct and implementable. |
| Unicode digits | Correct (V9). |
| Separator handling | Deterministic; policy issue R3-F5. |
| Extension precedence | Deterministic (rule 2 / 3 / 6 / 7); policy issue R3-F2. |
| Mask precedence | Deterministic; policy issues R3-F1, R3-F2. |
| Email parsing | E-a validation-failure branch undefined (R3-F3); E-c ⟨DOTW⟩ glue / spacing not stated (R3-M8). |
| Domain validation | Correct; `D === null` → `UNCERTAIN_EMAIL` reachable only through IDNA failures (fail-closed). |
| Fragment handling | Consistent; `ext. 2XX` rule 4 is redundant with rule 3 (not contradictory). |
| Uncertainty classification | Inconsistent application of K1-I4 between MK8 / EX5 (→ `PHONE`) and MK2 / MK6 (→ `FRAGMENT`) (R3-F2). |
| Exclusion rules | Step 4 needs Step 5's run structure (item 3 "the ED-2 run … has no other group"; item 2 "not … across ≤ 3 `SEP`") — implementable only if runs are computed first (R3-M4). URI scheme boundary not stated (R3-M3). Word boundaries in §4.8 header largely resolve AUDIT-001 ED4-F4 (digits are word characters), though ED4-F4 is still listed as open. |
| Unreachable branches | None found. `FRAGMENT` is now reachable (MK1–MK5, M9, EX7, P18). |

### V15 — Test-matrix completeness — **FINDINGS** (R3-M2; expectations enshrining R3-F1/F2/F5/F6)

| Required coverage | Rows | Verdict |
|---|---|---|
| Five previously identified defects | §9.9 | Present |
| K1-R1 → R3 | EM3–EM8, M4–M17, R1–R3 | R2 name-alone / name + business email absent (R3-M2) |
| K1-I1 → I6 | M4–M6, M8, M9, M11, EM9, R1–R3 | Present |
| PG-1 → PG-4 | P*, EX*, MK*, C1–C5, X1–X4, I1–I12 | Present (C/X/I/R by reference to REV-002, R3-M2) |
| Provider / intake paths | every row has both columns; I1–I12 | Present |
| Transient fields | X1–X4 | `snippet` and pulled-path `title` / `basis` still absent (ED7-F1 carried) |
| Business vs personal email | EM3–EM8, M4–M6 | Present |
| Uncertain identifiers | EM9, I4 | Present |
| Masked identifiers | MK1–MK8 | Present; MK2 (`98765*43210`) and MK6 encode R3-F2 |
| Multiple identifiers | M12, P23 | Phone + business email, business-only multiple emails, masked + complete phone absent |
| Whole-result rejection | R1–R3, I2 | Present |

Expectations that follow the proposed implementation rather than written policy: MK2 third example and MK6 (R3-F2),
P21 / P22 (R3-F5), EM11 (R3-F6). No row probes R3-F1, R3-F3, R3-F4 or R3-F7.

### V16 — Implementation readiness — **NOT READY**

2 CRITICAL BLOCKERS and 5 MAJOR FINDINGS remain (§6). All are engineering-correctable; none genuinely requires a
Product Owner decision (two have a conditional PO path, §7).

---

## §6 Findings

### R3-F1 — Mask contagion neutralizes complete phone numbers — **CRITICAL BLOCKER**

1. **ID / severity:** R3-F1, CRITICAL BLOCKER.
2. **REV-003:** §4.5 "Qualifying mask sequence: length ≥ 2, within ≤ 3 `SEP` characters of a digit of the run … (chained)";
   "Masked run: contains ≥ 1 qualifying mask sequence → `FRAGMENT` … visible digits are never re-evaluated alone, as a
   sub-run or by the window rule".
3. **Governing:** PG-DEC §3 principle ("Formatting does not decide the question either way"), consequence 1 (local,
   national numbers "must be recognized … in any rendering"); K1-I3 r2 (fragment = "no complete … phone number can be
   read"); PG-1 band 3 ("digits … masked, withheld or truncated by the source").
4. **Code fact:** none (detector not implemented).
5. **Why non-conforming:** `*` and `x` are both mask characters and ordinary typography. Any length-≥ 2 `*`/`•`/`x` sequence
   near a fully visible number turns the whole run into a fragment, although every digit of the number can be read.
6. **Examples (trace of §4.5):**
   - `**9876543210**` (markdown bold, common in AI-platform / markdown statements) → `**` glued, length 2 → qualifying →
     masked run → `FRAGMENT` → NORMALIZED;
   - `Call 98765 43210 **` / `*** 98765 43210 ***` → `FRAGMENT` → NORMALIZED;
   - `98765 XXXXX 98765 43210` (masked + complete number, one space apart) → one chained masked run → `FRAGMENT`; the
     complete second number is never evaluated.
   MK7 covers only the single-`*` footnote case.
7. **Blocks authorization:** yes.
8. **Requires:** engineering correction (e.g. a mask sequence may only stand *in digit positions* of the candidate it
   masks; a run whose digits alone already form a complete, plausible number is not a fragment). No PO decision needed.

### R3-F2 — A single inserted character is resolved toward "not a phone" — **CRITICAL BLOCKER**

1. **ID / severity:** R3-F2, CRITICAL BLOCKER.
2. **REV-003:** §4.5 "length 1, `*` or `•`, glued (no `SEP`) to digits on both sides" → qualifying mask; §4.6 rule 2
   (extension context = base run + marker + 1–6 digits), rule 5 (`#` as extension marker), rule 6 (single glued `x`: extension
   context → extension reading, otherwise → mask → `FRAGMENT`), rule 7; tests MK2 (`98765*43210` → FRAGMENT / NORMALIZED),
   MK6 (`98x76543210` → FRAGMENT / NORMALIZED).
3. **Governing:** K1I-DEC §5 rule 1 ("a phone number written in words or **with inserted characters** (personal)"), rule 3
   (undetermined → K1-I4); K1I-DEC §6 ("Uncertainty resolves toward privacy"); PG-DEC §3 (extension "neither makes nor
   unmakes a phone number"; phone = all digits of a callable number supplied).
4. **Code fact:** none.
5. **Why non-conforming:** REV-003 itself calls the single glued `x` "ambiguous" and invokes K1-I3 r3 / K1-I4, but only
   reaches `PHONE` when ≥ 6 digits precede the character and ≤ 6 follow. In every other split the ambiguity is resolved to
   "fragment" or to two short runs, i.e. away from privacy, although all ten digits are visible and the PO named
   "inserted characters" as in scope.
6. **Examples (trace):**
   - `98765*43210` → single glued `*` → mask → `FRAGMENT` → NORMALIZED (MK2 expects this);
   - `98x76543210` → no extension context (8 digits follow) → mask → `FRAGMENT` → NORMALIZED (MK6 expects this);
   - `98765x43210` → extension context (5 digits follow) → base `98765` (n = 5) → `[]` → NORMALIZED;
   - `98765#43210` and `98765 x 43210` → extension context → base n = 5 → `[]` → NORMALIZED.
   Contrast: `98765 4x210` (MK8) and `5550100x204` (EX5) → `PHONE`. The same uncertainty is resolved in opposite
   directions depending on digit position.
7. **Blocks authorization:** yes.
8. **Requires:** engineering correction (apply K1-I4 uniformly: when a single mask-capable or marker character sits between
   digit groups whose combined count is plausible, the readings include "inserted character" → `PHONE`; correct MK2 / MK6
   expectations). No PO decision needed — K1-I3 r1 / r3 and K1-I4 already answer it.

### R3-F3 — E-a validation failure is undefined; complete emails with glued punctuation escape — **MAJOR**

1. **ID / severity:** R3-F3, MAJOR.
2. **REV-003:** §4.4 Step 2, 4.4.1 (candidate pattern `[^\s@/]+@[^\s@/]+\.[^\s@/]+`; trims only `( [ { < " '` / opening
   quotes at local start and `. , ; : ! ? ) ] } > " '` / closing quotes at domain end; "then the local part and domain are
   validated"); 4.4.4 residues; Step 1 "`mailto:` + address … no valid address → `FRAGMENT`".
3. **Governing:** K1-R1 r1 ("in any form, including `mailto:`"); K1-I3 r1; K1-I4.
4. **Code fact:** CF-3 — the existing structured screen matches all the examples below; K1 would be weaker than the
   screen it supplements.
5. **Why non-conforming:** when a located candidate fails local-part or domain validation, REV-003 gives no outcome (the
   residue table covers only "domain neither valid nor single label"). A reasonable implementation yields nothing, so a
   complete personal email passes K1-B.
6. **Examples:** `Email:jane@gmail.com` (local `email:jane` invalid); `email—jane@gmail.com`; `jane@gmail.com—urgent`
   (domain label contains `—`); `**jane@gmail.com**` (local `**jane`, domain `gmail.com**`); `_jane@gmail.com_`;
   `mailto:jane@gmail.com?subject=RFP` (address with query → "no valid address" → `FRAGMENT`).
7. **Blocks authorization:** yes (behaviour must be defined).
8. **Requires:** engineering correction (e.g. take the maximal valid local suffix / domain prefix around `@`; strip a
   `mailto:` query at `?`; or classify a candidate with a valid domain but invalid local part as `UNCERTAIN_EMAIL`).

### R3-F4 — Ordinary-word "specific labels" exclude phone numbers — **MAJOR**

1. **ID / severity:** R3-F4, MAJOR (AUDIT-001 ED4-F5 recorded this as MINOR; independently re-derived as MAJOR).
2. **REV-003:** §4.8 item 5 (labels incl. `order`, `case`, `part`, `file`, `model`, `account`, `contract`, `application`, `bid`,
   `lot`, `batch`, `pin`; token = one whitespace-free run).
3. **Governing:** K1I-DEC §6 ("evidently … a labelled reference number"); PG-DEC §3 ("labels … neither makes a string a
   phone number nor stops it being one"), consequence 3.
4. **Code fact:** none.
5. **Why non-conforming:** the exclusion fires on the word, not on content showing the word labels a reference number. A
   verb or prose noun before a phone number does not make it "evidently" a reference number. Because the token stops at
   whitespace, a spaced number is partly consumed and the remainder falls below `L_min`.
6. **Examples:** `WhatsApp to order 9876543210` → `order` + token → excluded → NORMALIZED; `to order 98765 43210` → `order 98765`
   excluded, `43210` (n = 5) → NORMALIZED; `In case 9876543210 is busy, mail us` → excluded; `WhatsApp Business account
   9876543210` → excluded.
7. **Blocks authorization:** yes.
8. **Requires:** engineering correction (e.g. require label syntax — label immediately followed by `:` / `No.` / `#` / `ID`,
   or label-specific token shapes — or disallow tokens that are themselves plausible phone runs for ordinary-word labels).

### R3-F5 — Separator choice decides phone-ness — **MAJOR**

1. **ID / severity:** R3-F5, MAJOR.
2. **REV-003:** §4.5 `SEP` (excludes `/`, `,`; "Four or more consecutive `SEP` end the run"); tests P21 (`98765    43210` →
   `[]`), P22 (`98765/43210` → `[]`).
3. **Governing:** PG-DEC §3 ("The presence or absence of `+`, **separators**, parentheses, labels … neither makes a string a
   phone number nor stops it being one"); K1I-DEC §6 (established vs plausible).
4. **Code fact:** none.
5. **Why non-conforming:** `98765-43210` → `PHONE`, but `98765/43210`, `98765,43210` and `98765    43210` → nothing. The only
   difference is the separator, and nothing establishes a non-phone meaning (dates are already handled by §4.8 item 1).
   P21 / P22 expectations follow the run grammar, not the written policy.
6. **Examples:** as above; also table-extracted text with wide spacing.
7. **Blocks authorization:** yes, pending disposition.
8. **Requires:** engineering correction, or an engineering record showing that each boundary rests on content that
   establishes a non-phone meaning. No PO decision needed.

### R3-F6 — Complete emails in recognized renderings are not detected — **MAJOR**

1. **ID / severity:** R3-F6, MAJOR.
2. **REV-003:** §4.4.3 E-d ("only ⟨DOTW⟩ — no literal `.` anywhere"); ⟨DOTW⟩ list (no `[.]`, `(.)`); E-b domain must be a
   contiguous valid `EMAIL_DOMAIN`; §4.8 residuals ("`jane at gmail.com` not detected … recognition limitation"); EM11.
3. **Governing:** K1I-DEC §5 rule 1 ("Any rendering that conveys a complete email address … is a contact identifier");
   rule 3 / K1-I4 (plausible and not established otherwise → personal → `REJECTED`).
4. **Code fact:** none.
5. **Why non-conforming:** `jane at gmail.com` conveys a complete email and is plausible; REV-003 deliberately leaves it
   undetected to avoid over-capturing `available at eprocure.gov.in` (EM1). K1-I4 delegates *what is plausible*, but gives
   no authority to accept a false negative on a string REV-003 itself recognizes as a complete identifier. Further
   renderings are missed without being documented.
6. **Examples:** `jane at gmail.com` (EM11, documented); `jane[at]gmail[.]com`, `jane (at) gmail (.) com`, `jane @ gmail . com`,
   `jane at the rate gmail dot com` (undocumented).
7. **Blocks authorization:** yes, pending disposition.
8. **Requires:** engineering correction (e.g. treat `word at label.tld` as plausible unless the local token is established as
   prose — a closed stop-word list such as `available`, `visit`, `apply`, `us`, or a `www.`-prefixed domain; add `[.]` /
   `(.)` to ⟨DOTW⟩; allow whitespace around literal dots in E-b / E-c). **Conditional PO path:** only if engineering
   proposes to keep any of these as an accepted residual false negative would a PO acceptance be needed; this audit does
   not choose.

### R3-F7 — Obfuscated business email in `context.*` contradicts PG-2 net effect — **MAJOR**

1. **ID / severity:** R3-F7, MAJOR.
2. **REV-003:** §5 (`context.*` screened by K1 + CONTRACT-REC §3); §4.1 predicate excludes `BUSINESS_EMAIL`; §10 carries
   "ED-DEC-002 §8 new observation (obfuscated business email in `context.*` vs PG-2 net effect)" as open, "none needs a
   Product Owner decision".
3. **Governing:** PG-DEC §4 Decision: "Net effect: no email address (business or personal) and no phone number may
   appear in a `context.*` value"; consequence 1 (existing screen "must not be removed or weakened").
4. **Code fact:** CF-3 — the retained screen matches only contiguous `x@y.z` and leading URI schemes.
5. **Why non-conforming:** the PO's stated net effect assumes the existing screen catches "any email address"; it catches
   only contiguous forms. Combined with K1 (business emails allowed), an obfuscated business email in `context.*` is
   NORMALIZED.
6. **Example:** website `example.com`, `context.service = "contact info [at] example [dot] com"` → K1 `BUSINESS_EMAIL`
   (no trigger), CF-3 no match → NORMALIZED.
7. **Blocks authorization:** yes, pending disposition (explicit PO statement unmet).
8. **Requires:** engineering correction (e.g. for `context.*` only, treat any detected email kind as a trigger, which meets
   the stated net effect and only adds screening). **Conditional PO path:** only if engineering reads the net-effect
   sentence as descriptive rather than operative would a PO clarification be needed; this audit does not choose.

### Minor findings (non-blocking; engineering or documentation)

| ID | REV-003 | Governing | Observation / example | Requires |
|---|---|---|---|---|
| R3-M1 | §4.2 `W = normalizeDomain(website)` | K1-I1; OQ-7 item 1; CF-1/CF-2 | Website `https://www.acme.com` → `W = acme.com` → `x@acme.com` and `x@mail.acme.com` are business (under literal host comparison they would be parent / sibling). Policy-sanctioned by "normalized as OQ-7 already provides", but not stated in REV-003 and untested (the §9 fixture uses `W = example.com`). | Engineering: state + add rows |
| R3-M2 | §9.8 "per rev. 2" rows; §1 "self-contained" claim | REV-003 §1; ED7-F1 | C1–C5, X1–X4, I1–I12, R1–R8 are by reference only. Missing rows: name alone / name + business email (K1-R2 r1, r3); phone + business email; business-only multiple emails; masked + complete phone; transient `snippet`; pulled `title` / `basis`; inputs of R3-F1, F3, F4, F7. | Engineering |
| R3-M3 | §4.4 Step 1 | K1-I4 ("applies only to plausible identifiers") | Scheme boundary not stated: `Hotel:2026-10-02` contains `tel:` → dial string → exclusions skipped → `PHONE` (false positive). | Engineering |
| R3-M4 | §4.4 Step 4 vs Step 5 | — (determinism) | §4.8 items 2–3 depend on run structure computed in Step 5; order must say runs are computed first. | Engineering |
| R3-M5 | §4.4 Step 3 | K1-I3 r1 ("written in words") | Only English single-digit words; compound ("ninety-eight") and non-English number words not recognized and not documented as a limitation. | Engineering (document or extend) |
| R3-M6 | §4.5 / §4.4 Step 3 | PG-1 (volume accepted) | Fail-closed over-capture not listed in residuals: alphanumeric codes (`ORD2026100212345` → `PHONE`); number-word joins (`two 500000 litre tanks` → `2 500000` → `PHONE`, unit exclusion lost because the run has two groups). | Engineering (document) |
| R3-M7 | §5 table | K1-I5 r2 / r4 | `publication.publisher` (string, passed on in contract notes, CF-3) is not classified; presumably structured (a name). | Engineering (state) |
| R3-M8 | §4.4.3 E-c | — (determinism) | Whether bracketed ⟨DOTW⟩ may be glued inside E-c (`jane(at)gmail(dot)com`) is stated only for E-d (`\s*`). | Engineering |
| R3-M9 | §10 carried items | AUDIT-001 | ED1-F1, ED1-F2, ED2-F4, ED3-F2, ED4-F4, ED6-F2, ED6-F3, ED7-F1, ED7-F2, ED7-F4, ED7-F5 remain open as REV-003 states. ED4-F4 is largely addressed by §4.8 "word boundaries" but still listed open. | Engineering (reconcile) |

---

## §7 Open policy questions

**None required.** Every finding can be corrected by engineering within existing PO policy (K1-I3, K1-I4, PG-1, PG-2).

Two findings have a **conditional** PO path that arises only if engineering chooses not to correct them:
- R3-F6 — retaining any complete-email rendering as an accepted false negative;
- R3-F7 — reading PG-2's "net effect" as descriptive rather than operative.

This audit does not choose either path and does not frame either as a question to the PO.

---

## §8 Implementation-readiness conclusion

```text
REV-003 implementation readiness: NOT READY

Verification points:   16 assessed
  CONFORMING:          V1, V2, V3, V4, V7, V8, V11, V12
  FINDINGS:            V5, V6, V9, V10, V13 (corrections hold; new defects), V14, V15, V16

CRITICAL BLOCKERS:     2   R3-F1 (mask contagion), R3-F2 (single inserted character)
MAJOR FINDINGS:        5   R3-F3, R3-F4, R3-F5, R3-F6, R3-F7
MINOR FINDINGS:        9   R3-M1 … R3-M9
OPEN POLICY QUESTIONS: 0   (2 conditional: R3-F6, R3-F7)

AUDIT-001 critical defects: 5 of 5 corrected for the audited inputs
```

**Remaining blockers to an implementation-authority decision:**
1. R3-F1 and R3-F2 (engineering correction + corrected MK2 / MK6 expectations);
2. disposition of R3-F3 … R3-F7;
3. PD-1 (PENDING) and a separate implementation authorization, independent of this audit.

The next governance step is not determined by this record.

---

## §9 Governance statement

```text
Record type: READ-ONLY CONFORMANCE AUDIT

Implementation performed:            NO
Implementation authorized:           NO
Product Owner decision made:         NO
Engineering decision made:           NO
Findings fixed:                      NO
Provider / API calls:                NO
Participant / external contact:      NO
External research:                   NO
Existing records modified:           0
Code / test / schema / migration / API / UI / config / dependency changes: 0
Commit / push:                       NO

PD-1: PENDING
Files created this round: 1 (this record)
```
