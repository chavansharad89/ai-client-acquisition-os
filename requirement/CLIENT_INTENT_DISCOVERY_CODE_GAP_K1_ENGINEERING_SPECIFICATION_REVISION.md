# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION (rev. 2)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-002
**Date:** 2026-10-02
**Type:** Engineering specification revision. Not a Product Owner decision, not an audit, **not an implementation
authorization**.
**Author role:** Engineering Decision Authority (K1 implementation semantics).

**Lineage (none of these is edited):**

| Rev. | Record | sha256 |
|---|---|---|
| 0 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001 (`…_K1_ENGINEERING_SPECIFICATION_PREPARATION.md`) | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` |
| 1 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-PREP-001 (`…_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md`, "REV-PREP") | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` |
| — | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001 (`…_K1_ENGINEERING_DECISION.md`, "ED-DEC") | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` |
| **2** | **this record** | — |

Where this record and rev. 0 / rev. 1 differ, this record is the current engineering specification. Exclusion lists
are defined in ED-DEC §3 ED-4 and incorporated here by that hash-pinned reference.

> **PD-1: PENDING. Implementation authorized: NO.**

The record is organized in three strictly separated layers:

| Layer | Section | Authority |
|---|---|---|
| **POLICY** | §2 | Product Owner decisions, quoted / condensed; not changed here |
| **ENGINEERING SPECIFICATION** | §3–§9 | REV-PREP SPEC + ED-DEC ED-1..ED-8; deterministic |
| **IMPLEMENTATION AUTHORIZATION** | §10 | NONE — PD-1 PENDING |

---

## §1 Baseline

Verified in ED-DEC §1 in the same round (HEAD `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`, 0 staged, code fingerprint
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, all governing-record hashes matching). No code,
test, schema, migration, API, UI or dependency is changed by this record.

---

## §2 POLICY (Product Owner; preserved exactly, nothing added)

| Policy | Content |
|---|---|
| K1-B | An evidence item whose free-text quote contains a personal contact identifier is rejected. |
| K1-R1 | Emails and phones in any form (incl. `mailto:` / `tel:` / `sms:`). Email at the attributed organization's normalized website domain = business; every other email and every phone number = personal. |
| K1-R2 / K1-R3 | Names alone not a ground. Quotes verbatim, never masked. K1-B is part of the OQ-3 item 4 privacy screen → `REJECTED`. |
| K1-I1 / K1-I2 | Website host or any subdomain = business; parent, sibling, other, related, claimed = personal; no registrable-domain equivalence. |
| K1-I3 / K1-I4 | Complete identifiers in any rendering in scope; fragments not a ground; undetermined → K1-I4: plausible and not established otherwise → personal → `REJECTED`. |
| K1-I5 | Evidence statements always screened; other free text if persisted / displayed / passed on; transient text not screened; structured fields unchanged. |
| K1-I6 | Whole provider result `REJECTED`; nothing broader. |
| PG-1 | Phone = the source supplied all digits used to write a callable number. Local and national numbers are phones. Formatting never decides. Number with extension judged by base number; extension alone is a fragment. Bare runs → K1-I4 with an engineering envelope that must not treat absence of formatting, or of a country / area code, as establishing non-phone. |
| PG-2 | `context.targetCustomer` / `geography` / `service` are free text → K1-B applies; a hit rejects the whole provider result; existing CONTRACT-REC §3 screen retained. |
| PG-3 | `title` / `snippet` / `body` / `authorization.basis` carried in the pushed-result proof for re-verification are transient → not screened, while kept in memory only and not saved, displayed, logged or otherwise used. |
| PG-4 | K1-B applies to non-provider intake; rejection unit = whole intake event; provider path unchanged; `quote` screened; other intake fields structured. |

Not changed and not touched: PD-1, PD-2, PD-3, PD-6, PD-8, PD-9, PG-1..PG-4, K1-B, K1-R1..R3, K1-I1..I6.

---

## §3 ENGINEERING SPECIFICATION — common constraints

- **C-1 Read-only.** Detection runs on a derived copy. The screened value is stored, compared and displayed
  byte-for-byte as supplied. Nothing is stripped, masked or rewritten.
- **C-2 No value output.** No detected email, phone, domain, substring, offset or quote is returned, stored, logged or
  placed in an error message.
- **C-3 One detector.** Provider and intake paths call the same predicate (§4.1). No second implementation.
- **C-4 No dependency.** Implemented in-repository with ECMAScript regex (incl. Unicode property escapes),
  `String.prototype.normalize`, and the existing `normalizeDomain` (ED-8).
- **C-5 Unchanged existing screens.** `isPersonalContactIdentifier`, `checkIdentifier`, `screenProviderKeys` and all
  existing validation keep their current behavior and position.

---

## §4 Detector (exact behavior)

### 4.1 Module and contract (ED-6)

File `packages/core-research/src/contactIdentifiers.ts`; not exported from the package `index.ts`.

```ts
export type ContactIdentifierKind =
  | 'BUSINESS_EMAIL' | 'PERSONAL_EMAIL' | 'UNCERTAIN_EMAIL' | 'PHONE' | 'FRAGMENT';

/** Mechanics. One entry per detected item; [] = no identifier. Kinds only — never values. */
export function detectContactIdentifiers(text: string, website: string | null): readonly ContactIdentifierKind[];

/** K1-B predicate: any PERSONAL_EMAIL, UNCERTAIN_EMAIL or PHONE. */
export function containsPersonalContactIdentifier(text: string, website: string | null): boolean;
```

Order of entries in the returned array is not significant; tests compare kinds as multisets.

### 4.2 Business domain (E-1, E-2)

- `W = website === null ? null : normalizeDomain(website)`.
- For an email domain part `d`: `D = normalizeDomain(d.trim())`.
- `classifyEmailDomain(D, W)` (internal):
  - `D === null` → `UNCERTAIN_EMAIL` (K1-I3 rule 3 → K1-I4);
  - `W !== null && (D === W || D.endsWith('.' + W))` → `BUSINESS_EMAIL`;
  - otherwise → `PERSONAL_EMAIL` (incl. every email when `W === null`).
- No public-suffix reduction, related-domain list, DNS or lookup.

### 4.3 Detection copy (ED-3)

`C` is built from the screened string `s` in this order:
1. `s.normalize('NFKC')`;
2. remove every `\p{Cf}` character;
3. map each `\p{Nd}` character outside `0–9` to ASCII: value = (count of consecutive `\p{Nd}` code points immediately
   before it) mod 10;
4. `toLowerCase()` (locale-independent).

No other transliteration. Positions in `C` are never mapped back to `s`.

### 4.4 Scan pipeline (deterministic order, per screened string)

Each step removes the spans it consumes from further steps (consumed spans act as boundaries: they neither join runs
nor form email parts).

1. **URIs.**
   - `mailto:` followed by an address → the address goes to step 3 classification. With no address → `FRAGMENT`.
   - `tel:` / `sms:` followed by a dial string (optional `+`, digits, `SEP` characters per 4.5): 0 digits →
     `FRAGMENT`; otherwise the dial string is evaluated by 4.5 (runs, extensions, masks, window, `L_min` / `L_max`)
     **without** ED-4 exclusions. Plausible → `PHONE`; otherwise nothing.
2. **Obfuscated emails (E-5).** Match `LOCAL ⟨AT⟩ LABEL (⟨DOT⟩ LABEL)+` where
   - `LOCAL` = `[\p{L}\p{N}._%+-]+`, `LABEL` = `[\p{L}\p{N}-]+`;
   - `⟨AT⟩` ∈ { `@` with optional surrounding whitespace, `[at]`, `(at)`, `{at}`, `<at>` (each with optional
     surrounding whitespace), the word `at` surrounded by whitespace };
   - `⟨DOT⟩` ∈ { `.`, `[dot]`, `(dot)`, `{dot}`, `<dot>` (optional surrounding whitespace), the word `dot` surrounded by
     whitespace };
   - the word form `at` is accepted only when at least one `⟨DOT⟩` follows (the remainder forms
     `label (dot-token label)+`).
   The address `LOCAL@LABEL.LABEL…` is rebuilt for classification only (4.2).
3. **Ordinary emails (E-3).** All matches of `[^\s@/]+@[^\s@/]+\.[^\s@/]+` (the existing pattern source, global).
   Trim edge punctuation: domain end `. , ; : ! ? ) ] } > " '` and closing quotes; local start `( [ { < " '` and
   opening quotes. Classify the domain (4.2). Local part, `+` addressing and case have no effect.
4. **Email residues and fragments (E-6, E-7 step 5).** For each remaining `@` (after removing whitespace around a
   spaced ` @ `):
   - local characters before and a label after, with no dot-token → `UNCERTAIN_EMAIL` (e.g. `jane@gmail`);
   - local characters before and nothing (whitespace / end) after → `FRAGMENT` (`jane@`);
   - nothing before and `label.label…` after → `FRAGMENT` (`@gmail.com`);
   - nothing before and a single label after (`@name`) → not an email candidate (messaging handle; K1-R1
     non-decision) → nothing.
5. **Number words (E-5).** On the remaining copy, words `zero`, `one` … `nine`, and `oh` / `o` when between two digit
   words or digits, become digits; `double ⟨d⟩` → `dd`, `triple ⟨d⟩` → `ddd`. Word boundaries required; whitespace or
   `-` between converted words is a separator.
6. **Exclusion spans (ED-4).** Apply every recognizer in ED-DEC §3 ED-4 (dates / times / year ranges; prices and
   amounts incl. comma-grouped and short decimals; measurement units; versions; IPv4; labelled reference numbers with
   the contact-word rule). Matched spans are excluded and become run boundaries.
7. **Phone runs (4.5)** on what remains → `PHONE` / `FRAGMENT` / nothing.

### 4.5 Phone runs (PG-1; ED-1, ED-2)

- **Separators `SEP`:** any `\s`; `-`, U+2010–U+2015, U+2212; `.`; `(`; `)`; `·` (U+00B7); `_`. Every other character
  (incl. `/`, `,`, `;`, `:`, letters, `#`, `•`) ends a run.
- **Run:** optional `+` immediately before the first digit, then a digit, then any sequence of (≤ 3 `SEP` characters,
  digit). Four or more consecutive `SEP` characters end the run. Leading / trailing separators are not part of the run.
  Letters adjacent to a run end it but do not disqualify it.
- **Group:** maximal digit sequence inside a run without separators.
- **Extension:** marker `ext` | `extn` | `extension` | `x` (each with optional `.` and / or `:`) | `#`, located after a
  run with ≤ 3 characters of {whitespace, `,`, `-`, `(`} between, followed after ≤ 3 whitespace characters by 1–6
  digits → those digits are the extension; they are excluded from the count. A word marker with digits and no
  attachable run → `FRAGMENT` (extension alone); its digits never form a base run. `x` / `#` with no attachable run
  are not markers.
- **Mask:** mask characters `X`, `x`, `*`, `•` (`X` / `x` only when their maximal letter token is all `X` / `x`). A run
  is masked when it contains a mask sequence touching a digit or in-run separator that has length ≥ 2 or has digits on
  both sides → `FRAGMENT`.
- **Plausibility** with `n` = base digit count (extension excluded), **`L_min = 6`, `L_max = 15`**:
  - `6 ≤ n ≤ 15` → `PHONE`;
  - `n > 15` → `PHONE` if any contiguous window of whole groups has a digit count in `[6, 15]`; else nothing;
  - `n < 6` → nothing.
- Formatting, `+`, separators, labels and country / area code presence are **not** inputs to plausibility.
- Not used: the `core-payments` 8–15 validator.

---

## §5 Screened text (exact)

| Field | Provider path | Non-provider intake |
|---|---|---|
| Evidence statement: `intentEvidence.evidence` (web), `evidence[i].statement` (AI platform), `intentEvidence[i].evidence` (notice) | **screened** | — |
| `quote` (`signals[i].quote` / single-signal `quote`) | (screened again at the intake boundary for provider-derived events; equivalent, §7) | **screened** |
| `context.targetCustomer`, `context.geography`, `context.service` (when a string) | **screened** + existing CONTRACT-REC §3 screen retained | — |
| `title`, `snippet`, `body`, `authorization.basis`, transient `sourceText` | **not screened** (transient, PG-3) | — |
| `business.name` / `companyName`, `business.website` / `website`, URLs, source label, IDs, enums, dates, authorization fields | structured — existing screens only | structured — existing validation only |

`website` is the `W` anchor only; it is never screened by K1.

---

## §6 Provider path (exact)

- **Location.** A private helper in `intentSourceProviderContract.ts`, called once in each of `preparePublicWeb`,
  `prepareAiPlatform`, `preparePublicIntent`, **immediately after the `UNATTRIBUTED` skip and before `raw` is built**.
- **Inputs.** `website = result.business.website`; texts in this fixed order:
  1. evidence statements in array order (web: the single `intentEvidence.evidence`);
  2. `context.targetCustomer`, then `context.geography`, then `context.service` (skipped when not a string).
- **Rule.** The first text for which `containsPersonalContactIdentifier(text, website)` is true →
  `reject(path, 'not-allowed', \`${path} contains a personal contact identifier — evidence must be business-level\`)`.
- **Outcome.** `normalizeWith` returns `ProviderResultOutcome { status: 'REJECTED', externalId, field: path, reason:
  'not-allowed', message }` for that one result. No event, intake, signal, Company, Prospect or Opportunity results.
- **Order preserved.** `screenProviderKeys` (incl. the CONTRACT-REC §3 screen on `context.*`) → identity binding →
  common / type / URL / transient text / `observedAt` → `NO_INTENT_EVIDENCE` skip → verbatim / per-item / authorization
  checks → `UNATTRIBUTED` skip → **K1** → mapping (`normalizeIntentEvent`, incl. the intake-boundary check) → batch
  dedupe → P3 → persistence.
- An existing earlier rejection (e.g. an email in `context.*` caught by CONTRACT-REC §3) keeps its current `field` and
  message.
- **Batch.** Other results in `normalizeProviderBatch` are unaffected; a rejected result is not added to the dedupe set.
- **Pushed results (PG-3).** `normalizeVerifiedProviderResult` and the X1 re-derivation call `normalizeWith`, so they
  apply exactly this scope; no code reads the proof's `title` / `snippet` / `body` / `basis` for K1. The proof
  mechanism is unchanged.

## §7 Intake path (exact)

- **Location (ED-5).** Inline at the end of `toIntentSignalInput`, after the authorization-evidence block, immediately
  before `return`:
  `if (containsPersonalContactIdentifier(quote, website)) throw new IntentSignalValidationError('quote', 'not-allowed', 'quote contains a personal contact identifier — evidence must be business-level');`
- **Inputs.** The validated `quote` (the exact stored value) and the validated `website`.
- **Website not normalizable.** The check runs with `W = null`: every email personal; phones / uncertain / fragments
  unaffected. A clean quote passes; the existing `website` `invalid` rejection in `recordIntentIntakeForOwner` still
  applies after it, unchanged.
- **Propagation.** `toIntentIntakeInput` re-prefixes the error as `signals[i].quote` and aborts the whole event before
  X1, `searches.getById` and any write. `recordIntentSignalForOwner` reaches the same check. The caller receives the
  thrown error; the ingress maps it to its existing generic 400 and logs `externalId` / `field` / `reason` only.
- **Unit.** The whole intake event (`RecordIntentIntakeInput` or the single-signal input). Not a
  `ProviderResultOutcome`.
- **No other change** to `toIntentIntakeInput`, `recordIntentIntakeForOwner`, `recordIntentSignalForOwner`, the worker or
  the ingress.

### Provider / intake equivalence

For a provider-derived intake event: the intake check screens only `quote` (a subset of the provider-screened texts),
with the same predicate and the same `website`, and runs only after the provider check has passed. It therefore
rejects nothing the provider check accepted. Provider outcomes, fields and reasons are unchanged. The two units stay
separate.

## §8 Rejection propagation and reporting (summary)

| Path | Unit | Representation | `field` |
|---|---|---|---|
| Provider | one `IntentProviderResult` | `ProviderResultOutcome` `REJECTED`, `reason = 'not-allowed'` | offending path, e.g. `intentEvidence[1].evidence`, `evidence[0].statement`, `context.service` |
| Intake | one intake event | thrown `IntentSignalValidationError`, `reason = 'not-allowed'` | `signals[i].quote` or `quote` |

Messages are fixed and never echo the identifier. No new enum member. First trigger in scan order (entries in order,
fields in order) sets `field`. No partial acceptance, no stripping, no change to previously persisted rows.

**Multiple identifiers:** any personal email, phone or uncertain string → reject; several business emails only (in an
evidence statement / `quote`) → accept; business + personal → reject; business email in `context.*` → reject (existing
CONTRACT-REC §3 screen, PG-2).

## §9 Test matrix (specification only — no test written)

Suites and fixtures per ED-DEC ED-7. `W = example.com` (website `https://www.example.com`) unless stated. "E" = in an
evidence statement / `quote`. Detector rows (prefix D-) run in `contactIdentifiers.test.ts` and assert kinds; rows with
NORMALIZED / REJECTED run through `normalizeProviderResult` (one representative family per row, every family for C-
rows) and, where marked †, also through the intake path.

### 9.1 Email and domain

| # | Case | Expected |
|---|---|---|
| M1 | `info@example.com` in E | NORMALIZED † |
| M2 | `jane.doe@gmail.com` in E | REJECTED † |
| M3 | `x@mail.example.com` | NORMALIZED |
| M4 | website `shop.example.com`, `x@example.com` | REJECTED |
| M5 | website `shop.example.com`, `x@mail.example.com` | REJECTED |
| M6 | `x@example-group.com`, `x@example.co.in` | REJECTED |
| M7 | `jane [at] gmail [dot] com` | REJECTED |
| M8 | `info (at) example (dot) com` | NORMALIZED |
| M9 | `jane@`, `@gmail.com` | NORMALIZED (D-: `FRAGMENT`) |
| M10 | `jane@gmail` | REJECTED (D-: `UNCERTAIN_EMAIL`) |
| M11 | `x@notexample.com`, `x@example.com.evil.io` | REJECTED |
| M12 | business + personal email | REJECTED |
| M13 | `jane+rfp@example.com`, `INFO@EXAMPLE.COM.` | NORMALIZED |
| M14 | `mailto:jane@gmail.com` mid-text | REJECTED |
| M15 | `@acme` handle | NORMALIZED (D-: `[]`) |
| M16 | website not normalizable (D- with `website = 'not a url'`), `info@example.com` | D-: `PERSONAL_EMAIL` |
| M17 | `website = null`, `info@example.com` | D-: `PERSONAL_EMAIL` |

### 9.2 Phones (PG-1; ED-1, ED-2)

| # | Case | Expected |
|---|---|---|
| P1 | `555-0100` | REJECTED † |
| P2 | `98765 43210` | REJECTED |
| P3 | `+91 22 1234 5678 ext. 204` | REJECTED (base) |
| P4 | `ext. 204`, `extension 5550100` alone | NORMALIZED (D-: `FRAGMENT`) |
| P5 | `+1 (555) 010-0199` | REJECTED |
| P6 | `9876543210` | REJECTED |
| P7 | `5550100` | REJECTED |
| P8 | `2026-10-02`, `02/10/2026`, `2 Oct 2026`, `10:30 am` | NORMALIZED |
| P9 | `₹50,00,000`, `$1,200`, `25%`, `3.5 crore`, `Rs 50000-100000` | NORMALIZED |
| P10 | `RFP No. 2026/IT/0457`, `Tender ID 12345678`, `PIN 411001` | NORMALIZED |
| P11 | `20261002` | REJECTED |
| P12a | 5-digit bare `12345` | NORMALIZED |
| P12b | 6-digit bare `234567`, formatted `23 4567` | REJECTED |
| P13 | `1200 students`, `12000 users` | NORMALIZED |
| P14 | 16-digit single group `1234567890123456` | NORMALIZED |
| P15 | `nine eight seven six five four three two one zero` | REJECTED |
| P16 | `98XXX XX210`, `98765*43210`, `98•••43210` | NORMALIZED (D-: `FRAGMENT`) |
| P17 | `tel:+15550100` mid-text | REJECTED |
| P18 | `tel:` empty / `tel:123` | NORMALIZED (D-: `FRAGMENT` / `[]`) |
| P19 | 15-digit `+123456789012345` | REJECTED |
| P20 | `98765 - 43210` (3-char gap) | REJECTED |
| P21 | `98765    43210` (4 spaces) | NORMALIZED (two 5-digit runs) |
| P22 | `98765/43210` | NORMALIZED (slash ends run) |
| P23 | `9876543210 9876543211`; `+91 98765 43210 98765 43211` | REJECTED (window rule) |
| P24 | `x9876543210` | REJECTED (single `x` is not a mask) |
| P25 | `Mobile No. 9876543210`, `Fax: 22 1234 5678` | REJECTED (contact word blocks generic label) |
| P26 | `555.010.0199`, `98765.43210` | REJECTED (not decimal / not version) |
| P27 | `v2.10.3`, `version 10.2.1`, `192.168.10.1` | NORMALIZED |
| P28 | `FY 2025-26`, `2025–2026` | NORMALIZED |
| P29 | `Pune 411001` (unlabelled) | REJECTED (documented residual) |
| P30 | `5000 kg`, `120000 sq ft`, `250 GB` | NORMALIZED |
| P31 | `(022) 2345 6789` | REJECTED |
| P32 | `Order #12345678`; `#12345678` alone (generic label `#`, no contact word) | NORMALIZED; NORMALIZED |
| P33 | `Call #9876543210` (contact word before generic label) | REJECTED |

### 9.3 Normalization (ED-3)

| # | Case | Expected |
|---|---|---|
| N1 | Devanagari `९८७६५ ४३२१०` | REJECTED |
| N2 | full-width `９８７６５４３２１０` | REJECTED |
| N3 | `jane` + U+200B + `@gmail.com` | REJECTED |
| N4 | full-width `ｊａｎｅ＠ｇｍａｉｌ．ｃｏｍ` | REJECTED |
| N5 | NBSP / U+202F between digit groups `98765 43210` | REJECTED |
| N6 | For every REJECTED / NORMALIZED case, the stored `quote` / statement equals the input byte-for-byte | holds |

### 9.4 `context.*` (each of `targetCustomer`, `geography`, `service`, in each provider family)

| # | Case | Expected |
|---|---|---|
| C1 | `info@example.com` | REJECTED (existing CONTRACT-REC §3 screen; existing field / message) |
| C2 | personal email | REJECTED (existing screen) |
| C3 | `98765 43210` mid-text | REJECTED by K1; `field = context.<name>` |
| C4 | `mid-size manufacturers`, `Pune, India`, `mobile app development` | NORMALIZED |
| C5 | message does not echo the value | holds |

### 9.5 Pushed proof (PG-3)

| # | Case | Expected |
|---|---|---|
| X1 | identifier only in `body` / `title` of a pushed notice / web result | NORMALIZED at P2; saved at P3 |
| X2 | identifier only in `authorization.basis` of a pushed FIRST_PARTY result | NORMALIZED; X1 passes; saved |
| X3 | identifier in an evidence statement of a pushed result | REJECTED at P2 |
| X4 | transient values absent from outcomes, messages, logs, events, intake and saved rows | holds |

### 9.6 Non-provider intake (PG-4)

| # | Case | Expected |
|---|---|---|
| I1 | clean event (one and several signals) | accepted; rows written |
| I2 | personal email in `signals[1].quote` of 3 | rejected; `field = signals[1].quote`; no lookup; no rows |
| I3 | phone in `quote` | rejected |
| I4 | `jane@gmail` in `quote` | rejected |
| I5 | business email at `website` domain | accepted |
| I6 | email / phone-like `companyName` | not rejected by K1 |
| I7 | digit runs in `website` / `sourceUrl` / `sourceLabel` | not rejected by K1 |
| I8 | single-signal form, personal email in `quote` | rejected; `field = quote` |
| I9 | prior rows for the same company after a rejected event | unchanged |
| I10 | non-normalizable `website`, personal email in `quote` | rejected `signals[i].quote` (K1 first) |
| I11 | non-normalizable `website`, clean `quote` | rejected `website` `invalid` (existing, unchanged) |
| I12 | ingress: K1 intake rejection | existing generic 400; logs `externalId` / `field` / `reason` only |

### 9.7 Provider rejection, equivalence, regression

| # | Case | Expected |
|---|---|---|
| R1 | notice with 3 entries, 1 offending | REJECTED; `field = intentEvidence[i].evidence`; no event |
| R2 | AI platform: FIRST_PARTY clean + PUBLISHED offending | REJECTED whole result |
| R3 | batch [clean, offending, clean] | [NORMALIZED, REJECTED, NORMALIZED] |
| R4 | over every K1 provider case: REJECTED `field` is a provider path (never `signals[i].quote`); every NORMALIZED event's intake passes `toIntentIntakeInput` | holds |
| R5 | unattributed result with personal email in E | UNATTRIBUTED |
| R6 | test `intentSourceProviderContract.test.ts:578` | retained; retitled to state `body` is transient under PG-3; expectation NORMALIZED unchanged |
| R7 | privacy-key tests `:536–576` | unchanged |
| R8 | existing suites (`intentSignal`, `intentSource`, provider contract, `providerAuthenticity`, worker intent intake, ingress) | pass unchanged except R6 title |

---

## §10 IMPLEMENTATION AUTHORIZATION

**NONE.** This record is an engineering specification. It does not authorize implementation, validation, provider
calls or deployment. Implementation requires PD-1 to be decided by the Product Owner and a separate authorization.

```text
Record type: ENGINEERING SPECIFICATION (rev. 2)

POLICY layer: PG-1..PG-4, K1-B, K1-R1..R3, K1-I1..I6 — preserved, not changed
ENGINEERING layer: REV-PREP E-1..E-13 + ED-DEC ED-1..ED-8 — incorporated; deterministic
Open engineering decisions: NONE
Open Product Owner gaps for K1 semantics: NONE

PD-1: PENDING
Implementation authorized: NO
Implementation performed: NO
Validation performed: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO

Files created this round: 2 (ED-DEC, this record)
Existing records modified: 0
Production / test / schema / migration / API / UI / dependency changes: 0
```
