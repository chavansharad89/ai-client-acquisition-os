# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION REVISION PREPARATION (rev. 1)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-PREP-001
**Date:** 2026-10-02
**Type:** Engineering specification **revision preparation** (read-only analysis). Not a Product Owner decision, not
an audit, not an implementation authorization.
**Author role:** Engineering Specification / Governance Analyst.
**Revises (without editing):** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_PREPARATION.md`, "K1-ESPEC"; sha256
`60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e`). K1-ESPEC is unchanged and remains the historical
rev. 0. Where this record and K1-ESPEC differ, this record is the current engineering preparation.

> **PD-1 remains PENDING. This record does not authorize implementation.**
> It makes no Product Owner decision and creates no Product Owner question. Items it cannot settle are marked
> `ENGINEERING DECISION REQUIRED`. Each is an implementation-level choice inside the decided policy.

**Abbreviations:** PG-DEC = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POLICY-GAPS-PO-DEC-001 (PG-1..PG-4); PG-PREP / PG-Q =
its preparation record and questionnaire; K1I-DEC / K1I-AUDIT = K1-I1..I6 decision / audit; K1-DEC / K1-AUDIT = K1-R1..R3
decision / audit; PO-DEC = K1-B; OQ-DEC, DEC-003, CONTRACT-REC, ADAPTER-REC, REQ-001 as in prior records. Section
numbers E-1..E-13 follow K1-ESPEC's own numbering (K1-ESPEC "Numbering note").

**Labels:** **POLICY** (quoted decided rule) · **SPEC** (engineering specification, determined by policy + code) ·
**ENGINEERING PROPOSAL** (an engineering choice offered for confirmation; not policy) ·
`ENGINEERING DECISION REQUIRED` (implementation-level choice still open).

---

## §1 Purpose

This record:
- incorporates PG-1..PG-4 (PG-DEC) into the K1 engineering specification;
- closes K1-ESPEC §9 PG-1..PG-4;
- re-states every area E-1..E-13 in its current form;
- lists the remaining engineering-only decisions (§9).

No code, test, schema, migration, API or UI is changed.

## §2 Baseline (verified before writing)

| Item | Value | Matches PG-DEC §2 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); untracked records under `requirement/` only | Yes (plus PG-DEC) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |
| Target file / record ID pre-existence | Neither existed | — |

| Record | sha256 (verified) | Matches recorded value |
|---|---|---|
| PG-DEC (latest K1 PO decision) | `448370f18b9d093e62fbb9c3463dd79631a0a352eb399dc97a1151ceee3bac5d` | n/a (latest record; no prior recorded value) |
| PG-PREP | `9ae7fca776c6dd50edb6ca90fc41e6de89e4a9d7ec70b57a50e5662ca9ff8d5d` | Yes |
| PG-Q | `ea6d8121bba3f926ec3d11f2677d48f9ede37873bdaf7d3ef45dc8cf140d8a52` | Yes |
| K1-ESPEC (existing engineering spec, rev. 0) | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` | Yes |
| K1I-DEC (K1-I1..I6 decision) | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes |
| K1I-AUDIT (K1-I1..I6 audit) | `bb33d7a72b03f6674ed8019951c4b2393d5c31e96c107ebef1616de9b2f3ef92` | Yes |
| K1I-Q | `5660c18e0347e94de7320940ded55025ef9db92e256a2878b129a220a59324e4` | Yes |
| K1I-PREP | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` | Yes |
| K1-DEC (K1-R1..R3 decision) | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| K1-AUDIT (K1-R1..R3 audit) | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` | Yes |
| K1-Q / K1-PREP (residual) | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` / `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` | Yes |
| PO-DEC (K1-B) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| REQ-001 (canonical requirement) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |

**Baseline: PASS.**

## §3 Governing policy (preserved exactly; nothing added)

| Policy | Content (condensed from the decision text) |
|---|---|
| K1-B | An evidence item whose free-text quote contains a personal contact identifier is rejected. |
| K1-R1 | Emails and phones "in any form" (incl. `mailto:` / `tel:` / `sms:`); email at the attributed organization's normalized website domain = business; every other email and **every phone number** = personal. |
| K1-R2 / K1-R3 | Names alone not a ground; quotes verbatim, never masked / K1-B is part of the OQ-3 item 4 privacy screen → `REJECTED`. |
| K1-I1 / K1-I2 | Website host or any subdomain = business; parent, sibling, other, related, claimed = personal; no registrable-domain equivalence. |
| K1-I3 / K1-I4 | Complete identifiers in any rendering in scope; fragments not a ground; undetermined → K1-I4; plausible and not established otherwise → personal → `REJECTED`. |
| K1-I5 | Evidence statements always; other free text if persisted / displayed / passed on; transient not screened; structured fields unchanged. |
| K1-I6 | Whole provider result `REJECTED`; nothing broader. |
| **PG-1** | A phone number = the source supplied all digits used to write a callable number. Local (a) and national (b) numbers are phones. Formatting never decides. A number with an extension is judged by its base number. An extension alone is a fragment. Bare digit runs (d) → K1-I4, with the "plausibly" / "established" envelope delegated to engineering, under four constraints (PG-DEC §3). No Product Owner digit threshold. |
| **PG-2** | `context.targetCustomer` / `geography` / `service` are free text → K1-B applies; a hit rejects the whole provider result; the existing CONTRACT-REC §3 screen on them is retained (business emails not exempt; no phones). |
| **PG-3** | `title` / `snippet` / `body` / `basis` carried in the pushed-result proof solely for re-verification are transient → not screened, while they stay in memory and are not saved, displayed, logged or used otherwise. If that changes, K1-I5 rule 2 applies without a further PO record. |
| **PG-4** | K1-B applies to non-provider intake. Rejection unit = whole intake event. Provider path unchanged (K1-I6 unit). `quote` screened; `companyName`, `website`, `sourceUrl`, `sourceLabel` and other fields structured; existing validation of them unchanged. |

## §4 Implementation facts added since K1-ESPEC (verified read-only)

| # | Fact | Location |
|---|---|---|
| F-R1 | Intake validation runs per entry in `toIntentSignalInput`, called for every entry by `toIntentIntakeInput`. Any `IntentSignalValidationError` aborts the whole call; per-entry errors are re-thrown as `signals[i].<field>`. | `packages/core-research/src/intentSignal.ts:257`, `:387` |
| F-R2 | `recordIntentIntakeForOwner` calls `toIntentIntakeInput` first (`:99`), then X1 (`:101`), then the first lookup (`searches.getById`, `:104`), then writes. `recordIntentSignalForOwner` calls `toIntentSignalInput` then `recordIntentIntakeForOwner`. | `apps/worker/src/searchWorker/intentIntake.ts:93–145`, `:151–173` |
| F-R3 | The provider path also passes through `toIntentIntakeInput`: inside `normalizeIntentEvent` (`intentSource.ts:333`), inside X1 re-derivation, and again at P3 via `recordIntentIntakeForOwner`. | as cited |
| F-R4 | `RecordIntentIntakeInput` carries **no origin marker**. A pulled provider event (`normalizeProviderResult`) carries no proof, so at the intake boundary a provider-derived event cannot be told apart from non-provider input. | `intentSignal.ts` (`RecordIntentIntakeInput`); `intentSourceProviderContract.ts:607–612` |
| F-R5 | The intake path has no CONTRACT-REC §3-style value screen on `companyName` / `website` / `sourceUrl` / `sourceLabel` (only required / length / URL checks). | `intentSignal.ts:257–345` |
| F-R6 | Intake rejection representation exists: `IntentSignalValidationError(field, reason, message)` with `reason` in `IntentSignalValidationReason`, including `'not-allowed'`. The ingress maps a P3 validation error to a generic 400 and logs `externalId`, `field`, `reason`. | `intentSignal.ts:67–86`; `apps/web/src/server/intentIngress.ts:133–141` |

---

## §5 Engineering specification (current)

Common constraint (unchanged): detection runs on a read-only copy. Stored text is never altered, masked, stripped or
rewritten (K1-R2; CONTRACT-REC §3). No detected value is stored, logged or returned (K1-I5 rule 3; OD-11 pattern).

### E-1 — Domain canonicalization (unchanged from K1-ESPEC E-1)

**SPEC.**
- `W = normalizeDomain(website)` and `D = normalizeDomain(trimmed email domain)`, reusing
  `packages/core-discovery/src/normalize.ts` (already a dependency of `core-research`). This gives lower case, a
  stripped trailing dot, IDN → A-label and a stripped leading `www.`.
- Business ⇔ `D === W` or `D.endsWith('.' + W)`. Everything else is personal.
- `D` null (unclassifiable) → K1-I3 rule 3 → K1-I4 → personal.
- `W` null → no business domain exists → every email personal.
- No registrable-domain / public-suffix reduction, no DNS, no redirects, no lookups.

### E-2 — Related domains (unchanged)

**SPEC.** The comparison set is `{W}` plus its subdomains only. Alias, country-code variant, parent-company, sister,
affiliate and evidence-claimed domains fall to "everything else" → personal. No related-domain data, list, table,
field or discovery is introduced.

### E-3 — Email detection (unchanged)

**SPEC.**
- All-match detection reusing the source of the existing `PERSONAL_EMAIL_PATTERN` (`intentSignal.ts:91`). The boolean
  `isPersonalContactIdentifier` for structured fields stays as is.
- Punctuation trimming at match edges (domain end: `. , ; : ! ? ) ] } > " '` and closing quotes; local start:
  `( [ { < " '` and opening quotes).
- Detection on a Unicode-normalized copy (§9 ED-3); the stored quote is unchanged.
- Classification by domain only (E-1). Local part, plus addressing and case have no classification effect.
- `mailto:` anywhere → its address is classified by domain. Messaging handles (`@name` with no adjacent local part) are
  not email candidates (K1-R1 non-decision).

### E-4 — Phone detection (revised: PG-1 incorporated)

**POLICY (PG-1).**
- A phone number is a string in which the source supplied all digits used to write a callable number. Local and
  national numbers are phones. Formatting never decides.
- A number with an extension is judged by its base number. An extension alone is a fragment.
- Bare digit runs go to K1-I4.
- Every phone is personal (K1-R1).

**SPEC — recognition pipeline** (on the normalized copy, §9 ED-3):

1. **URI forms.** `tel:` / `sms:` anywhere followed by a number → phone. With no number → fragment (E-6).
2. **Number words.** Single-digit words (`zero`, `oh` / `o` between digit words, `one` … `nine`) and `double` /
   `triple` + digit become digits before step 3 (E-5).
3. **Candidate digit run.** Maximal sequence: optional leading `+`, digits, and between consecutive digits at most a
   bounded number of separator characters from { space, `-`, `.`, `(`, `)`, `/`, `·`, `•`, `_` }.
   - Letters end a run.
   - An extension marker (`ext`, `extn`, `extension`, `x`, `#`), with optional `.` / `:`, followed by digits attaches
     an **extension** to the immediately preceding run.
4. **Masking.** A run containing mask characters (`X`, `x`, `*`, `•`, `#`) in digit positions → fragment (E-6;
   K1-I3 rule 2; PG-1 band 3).
5. **Extension handling (PG-1 (c)).**
   - Run with base digits + extension → classify the **base digits only**. The extension digits are never counted and
     never decide.
   - Extension marker + digits with **no** preceding base run → fragment. No rejection.
6. **Established non-phone exclusions** (E-7 step 6) → not a phone.
7. **Plausibility classifier** (below) on the base digits → phone (personal) or no ground.

**SPEC — plausibility classifier (PG-1 band 2 envelope).** A base digit run (formatted **or** unformatted — the same
test) is **plausibly a phone** when:
- its base digit count `n` satisfies `L_min ≤ n ≤ L_max`; and
- no exclusion in E-7 step 6 establishes it as something else.

Formatting, `+`, separators and labels are **not** inputs to plausibility (PG-1: formatting never decides; PG-DEC §3
constraint 3).

| Parameter | Status | Constraint / basis |
|---|---|---|
| `L_min` | `ENGINEERING DECISION REQUIRED` (§9 ED-1) | **Derived upper limit: `L_min ≤ 7`.** PG-1 decides `555-0100` (7 base digits) is a phone, and formatting never decides, so the unformatted `5550100` must also be plausible. Any `L_min > 7` would contradict PG-1. A lower `L_min` (5 or 6) would cover shorter local numbering and reject more short numeric strings. The choice affects volume (EG-1) and is engineering under K1I-DEC §6 / PG-DEC §3. |
| `L_max` | **ENGINEERING PROPOSAL**: 15 base digits | The international numbering format caps a full number at 15 digits, so a longer run cannot be a single callable number. This is a technical ceiling for "plausibly", **not** a Product Owner definition of a phone (PG-1 adopts no standard). Runs longer than `L_max` → no ground, unless a sub-run is separately delimited. |
| Country / area code presence | Not an input | PG-1 (a), (b); PG-DEC §3 constraint 3 |
| Formatting presence | Not an input | PG-1; PG-DEC §3 constraint 3 |

**Explicitly not used:** the `core-payments` validator (`/^\+?[1-9]\d{7,14}$/`, 8–15 digits). It is an input validator
for another purpose (PG-PREP §4; PG-DEC §3). Its lower bound of 8 would exclude 7-digit local numbers and contradict
PG-1 (a).

**Recognition outcomes:**

| PG-1 category | Example | Classifier path | Result |
|---|---|---|---|
| Formatted local | `555-0100` | run, `n = 7` | phone → `REJECTED` (for any `L_min ≤ 7`) |
| National, no country code | `98765 43210` | run, `n = 10` | phone → `REJECTED` |
| International | `+91 98765 43210` | run, `n = 12` | phone → `REJECTED` |
| Number + extension | `+91 22 1234 5678 ext. 204` | base `n = 12`, ext ignored | phone → `REJECTED` |
| Extension alone | `ext. 204` | no base run | fragment → no ground |
| Unformatted | `9876543210` | run, `n = 10` | phone → `REJECTED` unless excluded (E-7 step 6) |
| Bare 7-digit | `5550100` | run, `n = 7` | phone → `REJECTED` unless excluded |
| Short bare run below `L_min` | e.g. `1200` | `n < L_min` | no ground |

### E-5 — Obfuscated identifiers (unchanged)

**SPEC.**
- **Email at-tokens:** `@`; `[at]`, `(at)`, `{at}`, `<at>`; the word `at` only where the remainder forms
  `label (dot-token label)+`; ` @ ` spaced.
- **Email dot-tokens:** `.`; `[dot]`, `(dot)`, `{dot}`, `<dot>`; the word `dot` between labels.
- The address is rebuilt for classification only.
- **Phone:** single-digit number words and `double` / `triple` (E-4 step 2).

**Documented limitations** (policy unchanged; such renderings remain in scope but may be missed):
- compound number words (`forty-three`);
- keypad / vanity letters;
- letters inserted between digits;
- images;
- homoglyphs not unified by normalization;
- non-English number or at / dot words;
- novel schemes.

### E-6 — Incomplete identifiers (unchanged + PG-1 extension case)

| Form | Status |
|---|---|
| `jane@` (empty domain) | fragment — no ground |
| `@gmail.com` (no adjacent local part) | fragment — no ground |
| empty `tel:` / `sms:` / `mailto:` | fragment — no ground |
| masked / withheld / truncated digits | fragment — no ground (K1-I3 rule 2; PG-1 band 3) |
| extension alone (`ext. 204`) | fragment — no ground (PG-1 (c)) |
| `jane@gmail` (local + domain, no dot-token) | undetermined → K1-I4 → `REJECTED` |

### E-7 — Uncertain strings (revised: PG-1 incorporated)

**SPEC — deterministic order per screened string:**

1. Detect ordinary emails (E-3) → classify by domain (E-1).
2. Detect ordinary phones: `tel:` / `sms:`, delimited runs (E-4 steps 1, 3, 5, 7).
3. Detect obfuscated identifiers (E-5) → feed steps 1–2.
4. Set aside fragments (E-6) → no ground.
5. Remaining **email-shaped** residues (`local@label` with no dot-token; spaced ` @ ` forms with no dot-token) →
   plausible email, not established otherwise → personal → `REJECTED`.
6. **Exclusions** — a digit run is established as **not** a phone when a recognizer matches:
   - **date / time:** with date separators or month names (`2026-10-02`, `02/10/2026`, `2 Oct 2026`); `hh:mm`.
     Unseparated 8-digit runs (`20261002`) are **not** excluded as dates — absence of formatting cannot establish
     non-phone (PG-1);
   - **price / amount:** a currency symbol or code immediately before the number (`₹`, `$`, `€`, `£`, `Rs`, `INR`,
     `USD`, …) or an amount unit immediately after it (`lakh`, `crore`, `k`, `m`, `bn`, `%`); comma-grouped numbers
     (Western or Indian grouping); decimals;
   - **labelled reference number:** immediately preceded by an enumerated label (`No.`, `Ref`, `Reference`, `ID`,
     `RFP`, `Tender`, `Bid`, `Invoice`, `Order`, `Case`, `Ticket`, `GST`, `CIN`, … — §9 ED-4);
   - **version / structural:** `v1.2.3` versions; IPv4 dotted quads.
7. **Plausibility classifier** (E-4) on remaining runs. Plausible → personal → `REJECTED`; otherwise → no ground.

**Bounds of the engineering rule.** Exclusions may use only content that **establishes** a non-phone meaning
(separators characteristic of dates, currency, units, labels). They must not use the **absence** of phone formatting.
This keeps the envelope within PG-1.

### E-8 — Screened text (revised: PG-2, PG-3, PG-4 incorporated)

| Field | Provider path | Non-provider intake | Rule |
|---|---|---|---|
| evidence statement (`intentEvidence.evidence`, `intentEvidence[].evidence`, `evidence[].statement`) / intake `quote` | **screened** (K1-B full) | **screened** (`signals[i].quote` / `quote`) | K1-I5 rule 1; PG-4 |
| `title` | transient — not screened | N/A (no such field) | K1-I5 rule 3; PG-3 |
| `snippet` | transient — not screened | N/A | K1-I5 rule 3; PG-3 |
| `body` (notice / RFP body) | transient — not screened | N/A | K1-I5 rule 3; PG-3 |
| `authorization.basis` | transient — not screened | N/A | K1-I5 rule 3; PG-3 |
| temporary verification text (`sourceText`) | transient — not screened, never output | N/A | K1-I5 rule 3 |
| `context.targetCustomer` | **screened** (K1-B full) **+ existing CONTRACT-REC §3 screen retained** | N/A (no such field) | PG-2 |
| `context.geography` | **screened + existing screen retained** | N/A | PG-2 |
| `context.service` | **screened + existing screen retained** | N/A | PG-2 |
| company name (`business.name` / `companyName`) | structured — existing CONTRACT-REC §3 screen (unchanged) | structured — existing intake validation only (F-R5); no K1 | K1-I5 rule 4; PG-4 |
| website (`business.website` / `website`) | structured — existing screen; also the `W` anchor | structured — existing intake validation; also the `W` anchor | K1-I5 rule 4; PG-4 |
| source URL (`url` / `sourceReference` / `referenceUrl` / `sourceUrl`) | structured — existing screen + tracking check | structured — existing URL validation | K1-I5 rule 4; PG-4 |
| source label | system-assigned (not provider-supplied) | structured — existing validation | K1-I5 rule 4; PG-4 |
| `externalId`, `publication.*`, `provenance.*`, authorization IDs, enums, dates | structured — existing screen | `kind`, `field`, `observedAt`, `authorizationEvidence` structured — existing validation | K1-I5 rule 4 |

**Pushed-result proof text (PG-3).** `title`, `snippet`, `body` and `basis` are not screened while they remain
transient verification-only data, and are not saved, displayed, logged or otherwise used. Specifically:
- the X1 re-derivation (`requireExactProviderResultForIntake` → `normalizeWith`) applies **exactly** the P2 scope;
- no K1 detector reads the proof's bytes for any other purpose;
- any future change that saves, displays, logs or otherwise uses these fields puts them under K1-I5 rule 2 (PG-DEC §5)
  — the implementing change must then add them to the screened set.

### E-9 — Rejection propagation (revised: PG-4 incorporated; two distinct paths)

**Provider path (K1-I6; unchanged).**
- On any K1 trigger in `prepare`, throw `IntentSignalValidationError(field, 'not-allowed', <fixed message>)`. The
  existing `normalizeWith` catch returns `ProviderResultOutcome { status: 'REJECTED' }` for that one
  `IntentProviderResult`.
- No event, intake, signal, Company, Prospect or Opportunity results from it.
- Other results in `normalizeProviderBatch` are unaffected; a rejected result is not added to the dedupe set.
- Previously persisted rows are never read, changed or deleted.

**Non-provider intake path (PG-4; separate unit).**
- On any K1 trigger in any entry's `quote`, `toIntentSignalInput` throws `IntentSignalValidationError`.
  `toIntentIntakeInput` aborts the whole call (F-R1), so the **whole intake event** is rejected before X1, before any
  lookup and before any write (F-R2).
- The rejection object is the `RecordIntentIntakeInput` (or the single-signal input) as supplied. It is **not** a
  `ProviderResultOutcome`, and the provider-result definition is not reused.
- No Company, Prospect, signal or Opportunity is created or updated; previously persisted rows are never touched.
- The caller receives the thrown error. The ingress (if involved) maps it to the existing generic 400.

**Unit separation and provider-path equivalence.**
- Because of F-R4, the intake-boundary check necessarily also sees provider-derived intake events (F-R3). This is the
  "shared check at the intake boundary" PG-DEC §6 consequence 2 permits.
- It rejects **exactly the same results and nothing else** on the provider path:
  1. the intake check screens only `quote`, which is a subset of the provider check (evidence statements +
     `context.*`);
  2. it uses the identical detector and classification, with the same `W` (same `business.website`, same
     `normalizeDomain`);
  3. it runs only after the provider check has already passed (`normalizeIntentEvent` runs only for `map`
     preparations).
- So every provider result it could reject is already `REJECTED` at the provider check, and the provider-path
  outcome, field and reason are unchanged.
- The two units are **not merged**:
  - provider path → `ProviderResultOutcome` per `IntentProviderResult`;
  - non-provider path → thrown error per intake event.

### E-10 — Processing order (revised)

**Provider path (preserved):**

```text
screenProviderKeys (existing S1 incl. CONTRACT-REC §3 value screen on context.*)
→ [bindVerifiedIdentity]
→ checkCommon / type / URL / transient sourceText / observedAt
→ NO_INTENT_EVIDENCE skip
→ per-entry requirement + verbatim (web, notice) | per-item + authorization checks (AI platform)
→ UNATTRIBUTED skip                                          (1. attribution)
→ K1 screen: evidence statements + context.*                 (2. verbatim already done; 3. K1)
→ mapping → normalizeIntentEvent (incl. intake-boundary K1, equivalent)   (4. mapping)
→ normalizeProviderBatch dedupe                              (5. dedupe)
→ ingress P3 → persistence                                   (6. persistence)
→ Opportunity → display                                      (7. display)
```

Attribution precedes K1 (K1-R1 operational: no classification without an attributed organization). Verbatim precedes
K1 (label ordering only).

**Non-provider intake:**

```text
toIntentIntakeInput → per entry toIntentSignalInput:
  system-assigned keys → kind → field → required / length (searchId, companyName, website, quote, sourceLabel, sourceUrl)
  → sourceUrl URL check → observedAt → authorizationEvidence rules
  → K1 screen of quote (W = normalizeDomain(website))        ◄── SPEC location
→ (whole event validated) → X1 (no-op without FIRST_PARTY) → searches.getById → normalizeCandidate
→ findOrCreateByDomain → prospect → signal transaction (writes) → Research → Opportunity
```

**SPEC.** The K1 intake check sits at the end of `toIntentSignalInput`.
- Rationale: it is the single validation point every intake entry passes, on every path, before any lookup or write
  (F-R1, F-R2). It is the only point where non-provider input can be screened, given F-R4.
- Exact function boundary within `intentSignal.ts`, and whether to run it only when `W` is non-null: §9 ED-5.

### E-11 — Multiple identifiers (revised: PG-2 exception stated)

| Situation | Result |
|---|---|
| any personal email in a screened field | reject |
| any phone (recognized or plausible) in a screened field | reject |
| any uncertain contact-like string (E-7 step 5 / 7) | reject |
| several emails all at `W` or a subdomain, in evidence / `quote` | accepted |
| business email + personal email | reject |
| **business email in `context.*`** | **reject** — PG-2 retains the existing CONTRACT-REC §3 screen, which rejects any email there |
| one offending entry among several | whole provider result (provider path) / whole intake event (intake path) rejected |

No partial acceptance, no stripping. The first trigger in scan order (entries in order, fields in order, left to right)
sets `field`.

### E-12 — Rejection reason (revised)

| Path | Representation |
|---|---|
| Provider | Existing `ProviderResultOutcome` `REJECTED`; `reason = 'not-allowed'`; `field` = offending path (e.g. `intentEvidence[1].evidence`, `evidence[0].statement`, `context.service`). Existing S1 rejections keep their current `field` / message. |
| Non-provider intake | Existing `IntentSignalValidationError`; `reason = 'not-allowed'`; `field` = `quote` (single-signal) or `signals[i].quote` (re-prefixed by `toIntentIntakeInput`, F-R1). |
| Both | Fixed message (e.g. "`<field>` contains a personal contact identifier — evidence must be business-level"). Never echoes the detected email, phone, string, domain or quote. Ingress logs stay `externalId` / `field` / `reason` only. |

An existing rejection representation is available on both paths (F-R6). **No new enum member is required or
created.**

### E-13 — Test matrix (revised; specification only — no test written)

Base fixtures: existing `webFixtures`, `noticeFixtures`, `aiPlatformSignal()`; intake input as in existing
`intentSignal` / worker tests. `W = example.com` unless stated. "E" = in an evidence statement / `quote`.

**Phones** (expected results hold for any `L_min ≤ 7`; rows marked ‡ depend on ED-1):

| # | Case | Expected |
|---|---|---|
| P1 | local `555-0100` in E | REJECTED |
| P2 | national `98765 43210` in E | REJECTED |
| P3 | `+91 22 1234 5678 ext. 204` in E | REJECTED (base number) |
| P4 | `ext. 204` alone in E | NORMALIZED (fragment) |
| P5 | formatted `+1 (555) 010-0199` in E | REJECTED |
| P6 | unformatted `9876543210` in E | REJECTED |
| P7 | bare `5550100` in E | REJECTED |
| P8 | dates `2026-10-02`, `2 Oct 2026` | NORMALIZED |
| P9 | prices / amounts `₹50,00,000`, `$1,200`, `25%`, `3.5 crore` | NORMALIZED |
| P10 | labelled reference `RFP No. 2026/IT/0457`, `Tender ID 12345678` | NORMALIZED |
| P11 | unseparated date-like `20261002` (no label) | REJECTED (formatting absence cannot exclude) |
| P12 ‡ | ambiguous bare 5- / 6-digit runs | per ED-1 |
| P13 | short number `1200 students` (`n < 5`) | NORMALIZED |
| P14 | 16+ digit undelimited run | NORMALIZED (exceeds `L_max`) |
| P15 | words `nine eight seven six five four three two one zero` | REJECTED |
| P16 | masked `98XXX XX210` | NORMALIZED |
| P17 | `tel:+15550100` mid-text | REJECTED |

**Email:**

| # | Case | Expected |
|---|---|---|
| M1 | `info@example.com`, website `https://www.example.com` | NORMALIZED |
| M2 | `jane.doe@gmail.com` | REJECTED |
| M3 | `x@mail.example.com` (subdomain) | NORMALIZED |
| M4 | website `shop.example.com`, `x@example.com` (parent) | REJECTED |
| M5 | website `shop.example.com`, `x@mail.example.com` (sibling) | REJECTED |
| M6 | `x@example-group.com` (affiliate), `x@example.co.in` (ccTLD variant) | REJECTED |
| M7 | `jane [at] gmail [dot] com` | REJECTED |
| M8 | `info (at) example (dot) com` | NORMALIZED |
| M9 | `jane@`, `@gmail.com` | NORMALIZED (fragments) |
| M10 | `jane@gmail` | REJECTED (K1-I4) |
| M11 | `x@notexample.com`, `x@example.com.evil.io` | REJECTED |
| M12 | business + personal email together | REJECTED |
| M13 | `jane+rfp@example.com`, `INFO@EXAMPLE.COM.` | NORMALIZED |

**`context.*`** — for each of `targetCustomer`, `geography`, `service`, in each provider family:

| # | Case | Expected |
|---|---|---|
| C1 | business email `info@example.com` | REJECTED (existing screen retained, PG-2) |
| C2 | personal email | REJECTED |
| C3 | phone `98765 43210` (mid-text, not at start) | REJECTED (K1-B, PG-2) |
| C4 | ordinary text (`mid-size manufacturers`, `Pune, India`, `mobile app development`) | NORMALIZED |
| C5 | `field` reported as `context.<name>`; message does not echo value | holds |

**Pushed proof (PG-3)** — via `normalizeVerifiedProviderResult` and `recordIntentIntakeForOwner` with a valid proof:

| # | Case | Expected |
|---|---|---|
| X1 | personal email / phone only in `body` or `title` of a pushed notice / web result | NORMALIZED at P2; saved at P3 |
| X2 | personal email / phone only in `authorization.basis` of a pushed FIRST_PARTY result | NORMALIZED at P2; X1 re-derivation passes; saved |
| X3 | same identifier in an evidence statement of a pushed result | REJECTED at P2 (never reaches P3) |
| X4 | the transient values never appear in outcomes, messages, logs, events or intake (value search) | holds |

**Non-provider intake (PG-4)** — `recordIntentIntakeForOwner` / `recordIntentSignalForOwner` with in-memory deps:

| # | Case | Expected |
|---|---|---|
| I1 | clean intake event (one and several signals) | accepted; rows written |
| I2 | personal email in one `quote` of a 3-signal event | whole event rejected; `field = signals[1].quote`; **no** rows written; no lookup performed |
| I3 | phone in `quote` | whole event rejected |
| I4 | uncertain `jane@gmail` in `quote` | whole event rejected |
| I5 | business email at `website` domain in `quote` | accepted |
| I6 | `companyName` containing an email-like / phone-like string | not rejected by K1 (structured; existing validation only) |
| I7 | `website` / `sourceUrl` / `sourceLabel` with digit runs | not rejected by K1 |
| I8 | single-signal form with personal email in `quote` | rejected; `field = quote` |
| I9 | previously persisted signals for the same company | unchanged after a rejected event |

**Provider-path equivalence and rejection (regression):**

| # | Case | Expected |
|---|---|---|
| R1 | notice with 3 entries, 1 offending | REJECTED; no event |
| R2 | AI-platform FIRST_PARTY clean + PUBLISHED offending | REJECTED whole result |
| R3 | batch [clean, offending, clean] | [NORMALIZED, REJECTED, NORMALIZED] |
| R4 | outcome / field / reason for every provider fixture identical with and without the intake-boundary check | holds (E-9 equivalence) |
| R5 | unattributed result with personal email | UNATTRIBUTED |
| R6 | existing test `intentSourceProviderContract.test.ts:578` (business email in body) | NORMALIZED; retitle only |
| R7 | existing privacy-key tests (`:536–576`) | unchanged |

---

## §6 Fully specified (determined by K1-R1..R3, K1-I1..I6, PG-1..PG-4)

| Area | Status |
|---|---|
| E-1 domain canonicalization | Fully specified |
| E-2 related domains | Fully specified |
| E-3 email detection | Fully specified, except normalization detail ED-3 |
| E-4 phone detection | Specified, except `L_min` (ED-1, bounded `≤ 7`), separator-gap bound (ED-2) and normalization detail (ED-3) |
| E-5 obfuscation | Fully specified (limitations documented) |
| E-6 fragments | Fully specified |
| E-7 uncertain strings | Specified, except label list content (ED-4) and ED-1 |
| E-8 screened text | Fully specified |
| E-9 rejection propagation | Fully specified (both paths, unit separation, equivalence) |
| E-10 processing order | Specified; intake check location set (end of `toIntentSignalInput`); detail ED-5 |
| E-11 multiple identifiers | Fully specified |
| E-12 rejection reason | Fully specified (no new enum) |
| E-13 tests | Specified; ‡ rows depend on ED-1; fixtures ED-7 |

K1-ESPEC §9 PG-1..PG-4 are **closed** by PG-DEC. **No Product Owner gap remains.**

## §7 Changes from K1-ESPEC (rev. 0 → rev. 1)

| K1-ESPEC item | Change |
|---|---|
| E-4 / E-7 step 6 "POLICY GAP — DO NOT IMPLEMENT" | Replaced by PG-1 categories + plausibility classifier; only `L_min` (bounded) remains, as engineering |
| E-6 | Extension-alone added as fragment |
| E-8 / §6 `context.*` "Undetermined: PG-2" | Screened + existing screen retained |
| §6 title / snippet / body / basis "(PG-3)" | Transient on every path, with PG-3 conditions |
| E-9 / §7 "PG-4" | Non-provider path, separate unit, equivalence argument added |
| E-10 | Intake-path order and check location added |
| E-11 | `context.*` business-email exception stated |
| E-12 | Intake-path representation added |
| §8 † rows | Expected values filled; new C, X, I, R4 rows |

## §8 Engineering observations (no decision)

- **F-R5.** Non-provider intake still applies no identifier screen to structured fields. That is existing behavior,
  kept unchanged by PG-4, and recorded in PG-DEC §6 as an observation only.
- **K1I-AUDIT I6-F6.** One plausible digit run in one entry rejects a whole result or event. Tests R2 and I2 make this
  visible.
- **Volume.** The effect of PG-1 (a), (b), (d) and of the `L_min` choice is unknown (EG-1, EG-CR-4).
- **Double screening.** Provider-derived events are screened at the provider check and again at the intake boundary
  (and at P3). This is redundant by construction (E-9 equivalence) and is bounded by text length.

## §9 Engineering decisions required (implementation-level only)

| ID | Decision | Constraint from policy |
|---|---|---|
| **ED-1** | `L_min` for the plausibility classifier: 5, 6 or 7 base digits | Must be `≤ 7` (PG-1 (a) with "formatting never decides"). No Product Owner threshold exists; volume-weighted (EG-1). |
| **ED-2** | Maximum separator characters between consecutive digits in a run (e.g. 1–3), and whether a lone space between two long groups joins them | Must cover ordinary local / national / international groupings and inserted-character renderings (K1-I3) |
| **ED-3** | Exact Unicode normalization for the detection copy: NFKC vs NFKC + case fold; mapping non-ASCII decimal digits (`\p{Nd}`, e.g. Devanagari `०–९`) to ASCII | Detection copy only; stored text unchanged (K1-R2) |
| **ED-4** | Enumerated content of the reference-label, currency and unit lists | Exclusions must establish a non-phone meaning; must not rely on absence of formatting (PG-1) |
| **ED-5** | Precise function boundary for the intake check inside `intentSignal.ts` (inline at the end of `toIntentSignalInput` vs a helper it calls), and behavior when `normalizeDomain(website)` is null (screen with no business domain vs defer to P3's existing `website invalid`) | Must run before any lookup or write; whole-event unit; provider-path equivalence (E-9) |
| **ED-6** | Module placement of the detector (e.g. a new `contactIdentifiers.ts` in `core-research`) and its export surface | No public API change required; `isPersonalContactIdentifier` behavior for structured fields unchanged |
| **ED-7** | Test fixture construction (new fixtures vs extending existing ones) and retitling of test `:578` | Matrix §5 E-13 |
| **ED-8** | Parser / library choice | No new dependency is required by this spec. Adding one needs PD-1 scope. |

None of ED-1..ED-8 changes which categories are rejected beyond what the decided policy determines. ED-1 is bounded by
PG-1. **No new Product Owner question is created.**

## §10 Implementation authorization

**PD-1 remains PENDING.**

This document is an engineering specification / preparation artifact only. **It does not authorize implementation.**

```text
Record type: ENGINEERING SPECIFICATION REVISION PREPARATION (rev. 1; read-only)

Product Owner decisions PG-1..PG-4: RECORDED (PG-DEC) and INCORPORATED here
K1-B, K1-R1..R3, K1-I1..I6: preserved, not reopened
Engineering specification: UPDATED / PREPARED (rev. 1; K1-ESPEC rev. 0 unchanged)
Product Owner gaps remaining: NONE
Engineering decisions required: ED-1 .. ED-8
New Product Owner questions: NONE

PD-1: PENDING
Implementation authorized: NO
Implementation performed: NO
Validation authorized: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO

Files created: 1 (this record)
Existing records modified: 0
Production / test / schema / migration / API / UI changes: 0
```
