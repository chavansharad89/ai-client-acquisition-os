# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION (rev. 3)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-003
**Date:** 2026-10-02
**Type:** Engineering specification revision. Not a Product Owner decision, not an audit, **not an implementation
authorization**.
**Author role:** Engineering Decision Authority (K1 implementation semantics).

**Lineage (none of these is edited):**

| Rev. / record | Record ID (file under `requirement/`) | sha256 |
|---|---|---|
| rev. 0 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001 (`…_K1_ENGINEERING_SPECIFICATION_PREPARATION.md`) | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` |
| rev. 1 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-PREP-001 (`…_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md`) | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` |
| ED-DEC-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001 (`…_K1_ENGINEERING_DECISION.md`) | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` |
| rev. 2 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-002 (`…_K1_ENGINEERING_SPECIFICATION_REVISION.md`) | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` |
| AUDIT-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-CONFORMANCE-AUDIT-001 (`…_K1_ENGINEERING_SPECIFICATION_CONFORMANCE_AUDIT.md`) | `53c79c39a73fa522217a5805ddd73ec39a977741eedd4151ee7fe237f66d8b97` |
| ED-DEC-002 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-002 (`…_K1_ENGINEERING_DECISION_AMENDMENT.md`) | `b9c7aaa8af5e99b2c6e2cd74054eaa0f163944b8acb33a47edb3fdc805abefde` |
| **rev. 3** | **this record** | — |

This record is **self-contained**: every detector list and rule is stated here in full. Where it differs from rev. 2,
ED-DEC-001 or earlier records, this record is the current engineering specification. ED-DEC-001 ED-1..ED-8 are retained
except where ED-DEC-002 amends them.

> **PD-1: PENDING. Implementation authorized: NO.**

| Layer | Section | Authority |
|---|---|---|
| **POLICY** | §2 | Product Owner decisions; quoted / condensed; not changed |
| **ENGINEERING SPECIFICATION** | §3–§9 | ED-DEC-001 (ED-1..ED-8) as amended by ED-DEC-002 (A–E); deterministic |
| **IMPLEMENTATION AUTHORIZATION** | §10 | NONE — PD-1 PENDING |

---

## §1 Baseline

Verified in ED-DEC-002 §1 in the same round: HEAD `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`, 0 staged, code
fingerprint `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, all governing-record hashes matching.
No code, test, schema, migration, API, UI or dependency is changed by this record.

---

## §2 POLICY (Product Owner; preserved exactly, nothing added)

| Policy | Content |
|---|---|
| K1-B | An evidence item whose free-text quote contains a personal contact identifier is rejected. |
| K1-R1 | Emails and phones in any form (incl. `mailto:` / `tel:` / `sms:`). Email at the attributed organization's normalized website domain = business; every other email and every phone number = personal. |
| K1-R2 / K1-R3 | Names alone not a ground. Quotes verbatim, never masked. K1-B is part of the OQ-3 item 4 privacy screen → `REJECTED`. |
| K1-I1 / K1-I2 | Website host or any subdomain = business; parent, sibling, other, related, claimed = personal; no registrable-domain equivalence. |
| K1-I3 | (1) Complete identifier in any rendering → in scope (e.g. `jane [at] gmail [dot] com`; phone in words or with inserted characters). (2) Fragment with no complete identifier (e.g. `jane@`, `@gmail.com`, digits masked by the source) → no ground. (3) Undetermined (e.g. `jane@gmail`) → K1-I4. Detection method is engineering. |
| K1-I4 | Plausible and not established otherwise → personal → `REJECTED`. Strings established as not identifiers ("evidently a date, price, amount or labelled reference number") cause no rejection. "Plausibly" / "established" are engineering. Applies only to plausible identifiers. |
| K1-I5 | Evidence statements always screened; other free text if persisted / displayed / passed on; transient text not screened; structured fields unchanged. |
| K1-I6 | Whole provider result `REJECTED`; nothing broader. |
| PG-1 | Phone = the source supplied all digits used to write a callable number. Local and national numbers are phones. Formatting (incl. `+`, separators, parentheses, labels, `tel:`) never decides. Number with extension → judged by base number; extension alone → fragment. Masked / withheld / truncated → fragment. Bare runs → K1-I4; the envelope must not treat absence of formatting, or of a country / area code, as establishing non-phone. |
| PG-2 | `context.targetCustomer` / `geography` / `service` are free text → K1-B applies; a hit rejects the whole provider result; existing CONTRACT-REC §3 screen retained (net effect: no email and no phone in `context.*`). |
| PG-3 | `title` / `snippet` / `body` / `authorization.basis` carried in the pushed-result proof for re-verification are transient → not screened, while in memory only and not saved, displayed, logged or otherwise used. |
| PG-4 | K1-B applies to non-provider intake; rejection unit = whole intake event; provider path unchanged; `quote` screened; other intake fields structured. |

Not changed and not touched: PD-1, PD-2, PD-3, PD-6, PD-8, PD-9, PG-1..PG-4, K1-B, K1-R1..R3, K1-I1..I6.

---

## §3 ENGINEERING SPECIFICATION — common constraints

- **C-1 Read-only.** Detection runs on a derived copy. The screened value is stored, compared and displayed
  byte-for-byte as supplied. Nothing is stripped, masked or rewritten.
- **C-2 No value output.** No detected email, phone, domain, substring, offset or quote is returned, stored, logged or
  placed in an error message.
- **C-3 One detector.** Provider and intake paths call the same predicate (§4.1).
- **C-4 No dependency.** ECMAScript regex (incl. Unicode property escapes), `String.prototype.normalize`, existing
  `normalizeDomain` (ED-8).
- **C-5 Unchanged existing screens.** `isPersonalContactIdentifier`, `checkIdentifier`, `screenProviderKeys` and all
  existing validation keep their current behavior and position.

---

## §4 Detector (exact behavior)

### 4.1 Module and contract (ED-6, unchanged)

File `packages/core-research/src/contactIdentifiers.ts` (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`); not exported
from the package `index.ts`.

```ts
export type ContactIdentifierKind =
  | 'BUSINESS_EMAIL' | 'PERSONAL_EMAIL' | 'UNCERTAIN_EMAIL' | 'PHONE' | 'FRAGMENT';

/** Mechanics. One entry per detected item; [] = no identifier. Kinds only — never values. */
export function detectContactIdentifiers(text: string, website: string | null): readonly ContactIdentifierKind[];

/** K1-B predicate: any PERSONAL_EMAIL, UNCERTAIN_EMAIL or PHONE. */
export function containsPersonalContactIdentifier(text: string, website: string | null): boolean;
```

Entry order is not significant; tests compare kinds as multisets.

### 4.2 Business domain (E-1, E-2; unchanged)

- `W = website === null ? null : normalizeDomain(website)`.
- For a **valid** email domain `d` (§4.4.2): `D = normalizeDomain(d)`.
- `D === null` → `UNCERTAIN_EMAIL`; `W !== null && (D === W || D.endsWith('.' + W))` → `BUSINESS_EMAIL`; otherwise →
  `PERSONAL_EMAIL` (incl. every email when `W === null`).
- No public-suffix reduction, related-domain list, DNS or lookup.

### 4.3 Detection copy (ED-3; unchanged)

1. `s.normalize('NFKC')`; 2. remove every `\p{Cf}`; 3. map each `\p{Nd}` outside `0–9` to ASCII (value = number of
consecutive `\p{Nd}` code points immediately preceding it **in code-point order**, mod 10); 4. `toLowerCase()`.
No other transliteration. Positions in `C` are never mapped back to `s`.

### 4.4 Scan pipeline (deterministic order, per screened string)

Each step removes the spans it consumes from later steps; consumed spans act as boundaries.

**Step 1 — URIs.**
- `mailto:` + address → validated and classified by §4.4.2 (E-a); no valid address → `FRAGMENT`.
- `tel:` / `sms:` + dial string (optional `+`, digits, mask characters, `SEP`): 0 digits → `FRAGMENT`; otherwise
  evaluated by §4.5–§4.7 **without** §4.8 exclusions. Masked → `FRAGMENT`; plausible → `PHONE`; else nothing.

**Step 2 — Emails (ED-DEC-002-E).**

*4.4.1 Local part:* `[\p{L}\p{N}._%+'-]+`, not starting or ending with `.`. (For E-a, the existing pattern source
`[^\s@/]+@[^\s@/]+\.[^\s@/]+` locates candidates; edge trimming: domain end `. , ; : ! ? ) ] } > " '` and closing quotes;
local start `( [ { < " '` and opening quotes; then the local part and domain are validated.)

*4.4.2 `EMAIL_DOMAIN`:* ≥ 2 labels separated by `.`; each label 1–63 characters of `[\p{L}\p{N}-]`, not starting or
ending with `-`; final label ≥ 2 characters and only letters (`\p{L}`), or `xn--[a-z0-9-]+`; total ≤ 253. Checked
**before** `normalizeDomain`. A numeric final label is invalid (so `12.50`, `192.168.1.1` are never email domains).

*4.4.3 At-signals (exactly one per candidate):*

| Form | Pattern | Domain dots allowed |
|---|---|---|
| E-a contiguous | `local@domain` | `.` |
| E-b literal `@`, inserted whitespace | `local\s{1,3}@\s{0,3}domain` or `local\s{0,3}@\s{1,3}domain` | `.` |
| E-c bracketed at | `local\s*[\[({<]at[\])}>]\s*domain` | `.` or `⟨DOTW⟩` |
| E-d word at | `local\s+at\s+label(\s*⟨DOTW⟩\s*label)+` | **only** `⟨DOTW⟩` — no literal `.` anywhere |

`⟨DOTW⟩` = the word `dot` (whitespace-delimited) or `[dot]`, `(dot)`, `{dot}`, `<dot>`. The domain is reconstructed with
`.` and must satisfy `EMAIL_DOMAIN`; then classified (§4.2).

*4.4.4 Residues (contiguous forms only):*
- `local@label` (single alphabetic label, no dot) → `UNCERTAIN_EMAIL` (K1-I3 rule 3 example);
- `local@` (nothing after) → `FRAGMENT`;
- `@label.label…` (nothing before) → `FRAGMENT`;
- `@label` (handle) → nothing;
- contiguous `local@X`, `X` neither valid domain nor single alphabetic label (e.g. `qty@12.50`) → nothing;
- spaced forms that are not E-b / E-c / E-d candidates (`jane @ gmail`, `rate @ rs`, `rate @ 12.50`) → nothing.

**Step 3 — Number words (E-5).** `zero`, `one` … `nine`, and `oh` / `o` between two digit words or digits, become
digits; `double ⟨d⟩` → `dd`, `triple ⟨d⟩` → `ddd`; word boundaries required; whitespace or `-` between converted words
is a separator.

**Step 4 — Exclusion spans** (§4.8). Matched spans become run boundaries.

**Step 5 — Runs, masks, extensions, plausibility** (§4.5–§4.7) → `PHONE` / `FRAGMENT` / nothing.

### 4.5 Runs and masks (ED-1, ED-2 as amended by ED-DEC-002-A)

- **`SEP`:** any `\s`; `-`, U+2010–U+2015, U+2212; `.`; `(`; `)`; `·` (U+00B7); `_`. Every other character (incl. `/`,
  `,`, `;`, `:`, letters, `#`) ends a run unless it is a qualifying mask symbol.
- **Mask characters:** `x` (only when its maximal letter token is all `x`), `*`, `•`. A **mask sequence** is a maximal
  sequence of mask characters.
- **Qualifying mask sequence** (a run symbol):
  - length ≥ 2, within ≤ 3 `SEP` characters of a digit of the run or of another qualifying mask sequence of the run
    (chained); or
  - length 1, `*` or `•`, glued (no `SEP`) to digits on both sides.
  - A single `x` glued to digits on both sides → §4.6 rule 6. Any other single mask character is not a run symbol.
- **Run:** `'+'? S (SEP{0,3} S)*`, `S` = digit or qualifying mask sequence; at least one digit. Leading `+` belongs to
  the run, uncounted. Leading / trailing separators are not part of the run. Letters adjacent to a run end it but do
  not disqualify it. Four or more consecutive `SEP` end the run.
- **Group:** maximal digit sequence inside a run without separators.
- **Masked run:** contains ≥ 1 qualifying mask sequence → **`FRAGMENT`**. Mask characters are never stripped; visible
  digits are never re-evaluated alone, as a sub-run or by the window rule; an attached extension does not change the
  result.

### 4.6 Extensions and `#` (ED-DEC-002-B)

1. **Markers:** whole-word `ext`, `extn`, `extension` (optional `.` / `:`); single-letter token `x`; `#`.
2. **Extension context** = (a) a base run ends immediately before the marker, separated by nothing or by ≤ 3 characters
   from { whitespace, `,`, `-`, `(` }; and (b) after the marker (optional `.` / `:`, ≤ 1 whitespace) comes a contiguous
   group of 1–6 digits not followed by a digit. Then: extension digits excluded; base run judged alone; later groups are
   separate runs.
3. **Word marker without base:** take the run beginning at the first digit after the marker: masked → `FRAGMENT`;
   digit count `< 6` → `FRAGMENT` (extension alone); digit count `≥ 6` → marker has no effect, run evaluated normally.
4. `ext. 2XX` (masked group, no base) → `FRAGMENT`.
5. **`#`, one role per parse state, in order:** (i) inside a specific-label phrase (§4.8 item 5) → part of that
   exclusion; (ii) else in extension context → extension marker; (iii) else → ordinary punctuation (ends a run, no
   other effect). Never a generic label, mask or separator.
6. **Single `x` glued between digits:** ambiguous between extension and one-character mask; per K1-I3 rule 3 / K1-I4:
   in extension context → extension reading (base judged; plausible → `PHONE`); otherwise → mask → `FRAGMENT`.
7. **Single `x` with whitespace on either side** (`5550100 x204`): extension marker when rule 2 holds; never a mask.

### 4.7 Plausibility (ED-1; unchanged)

`n` = base digit count (extension excluded); **`L_min = 6`, `L_max = 15`**:
- `6 ≤ n ≤ 15` → `PHONE`;
- `n > 15` → `PHONE` if any contiguous window of whole groups has a digit count in `[6, 15]` (unmasked runs only);
  else nothing;
- `n < 6` → nothing.

Formatting, `+`, separators, labels, contact words and country / area code presence are not inputs. Not used: the
`core-payments` 8–15 validator.

### 4.8 Exclusion recognizers (ED-4 as amended by ED-DEC-002-C, -D)

Case-insensitive on `C`; word boundaries; not applied inside `tel:` / `sms:` dial strings. `NUM` = `\d+(?:[.,]\d+)*`;
`RANGE` = `NUM(?:\s?(?:-|–|—|to)\s?NUM)?`.

1. **Dates / times / years.**
   - `YYYY<s>MM<s>DD`, `DD<s>MM<s>YYYY`, `MM<s>DD<s>YYYY`, `DD<s>MM<s>YY`; `<s>` ∈ { `-`, `.`, `/` }, identical twice;
     month 1–12, day 1–31, 4-digit year 1900–2099; invalid values not excluded.
   - Month names (`jan` / `january` … `dec` / `december`, `sep`, `sept`, optional `.`) adjacent (≤ 2 characters of
     space, `,`, `.`, `-`) to a 1–2 digit day and / or a 4-digit year 1900–2099.
   - Year ranges `(?:fy\s?)?(19|20)\d{2}\s?[-–/]\s?(\d{2}|(19|20)\d{2})`.
   - Times `\d{1,2}:\d{2}(:\d{2})?` (optional `am` / `pm`); `\d{1,2}(\.\d{2})?\s?(am|pm)`.
   - Not excluded: unseparated runs (`20261002`).
2. **Prices / amounts (before the number; unchanged).** `RANGE` immediately preceded (≤ 1 space; optional `.` after a
   code) by `₹ $ € £ ¥ ₩ ₽ ¢ ₺ ₫ ₦ ₱ ₪ ฿` or `rs`, `inr`, `usd`, `eur`, `gbp`, `aed`, `sgd`, `aud`, `cad`, `jpy`, `cny`,
   `rupees`, `rupee`, `dollars`, `euros`; or immediately followed by one of those codes or by `/-`. Comma-grouped
   (`\d{1,3}(,\d{3})+`; `\d{1,3},(\d{2},)*\d{3}`; optional decimal). Short decimal `\d+\.\d{1,2}` not immediately
   preceded or followed by a digit, and not preceded or followed (across ≤ 3 `SEP`) by a further digit.
3. **Units and amount units after the number (ED-DEC-002-D).** Excluded only when all hold:
   - unit token in **spaced-or-glued list** (≤ 1 whitespace): `mm`, `cm`, `km`, `inch`, `inches`, `ft`, `feet`,
     `sq ft`, `sq. ft.`, `sqft`, `sq m`, `sqm`, `acre`, `acres`, `hectare`, `hectares`, `mg`, `kg`, `ton`, `tons`,
     `tonne`, `tonnes`, `lb`, `lbs`, `ml`, `ltr`, `litre`, `litres`, `liter`, `liters`, `kl`, `kb`, `mb`, `gb`, `tb`,
     `kw`, `mw`, `kwh`, `mwh`, `kmph`, `km/h`, `mph`, `pcs`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`,
     `years`, `lakh`, `lakhs`, `lac`, `lacs`, `crore`, `crores`, `million`, `billion`, `thousand`, `%`; or in
     **glued-only list** (no whitespace): `m`, `l`, `g`, `t`, `w`, `k`, `mn`, `bn`, `cr`;
   - followed by a non-letter or end of text;
   - the excluded digits are exactly **one quantity token** (`NUM` / `RANGE`, no internal whitespace or other `SEP`
     except decimal point, grouping commas, range connector), and the ED-2 run containing them has no other group.
4. **Versions / structural.** Dotted `\d+(\.\d+){1,3}` immediately preceded by `v` or `version`, `ver`, `ver.`,
   `release`, `build` (≤ 1 space). IPv4: exactly four dot groups, each 0–255, not adjacent to further digits or dots.
5. **Labelled reference numbers (specific labels only).** Phrase:
   `⟨label⟩ (\s|[.:\-#/]){0,3} (no\.?|number|#|id)? (\s|[.:\-#/]){0,3} ⟨token⟩`, `⟨token⟩` = one run of digits, letters,
   `/`, `-`, `.`, `_` (no whitespace). Labels: `ref`, `reference`, `rfp`, `rfq`, `rfi`, `eoi`, `tender`, `bid`, `nit`,
   `invoice`, `inv`, `order`, `po`, `case`, `ticket`, `gst`, `gstin`, `cin`, `pan`, `tan`, `sku`, `part`, `model`,
   `serial`, `s/n`, `lot`, `batch`, `contract`, `agreement`, `file`, `application`, `registration`, `reg`, `account`,
   `a/c`, `isbn`, `issn`, `doi`, `pin`, `pincode`, `pin code`, `postal code`, `zip`, `zip code`.
   **Generic labels (`no`, `no.`, `number`, `#`, `id`) never establish an exclusion by themselves.** Contact words are
   not inputs to any exclusion.

**Residuals (documented; K1-I4 outcome accepted by PG-1).** Unlabelled numbers without establishing content remain
plausible within `[6, 15]`: e.g. `Pune 411001`, `150000 users`, `50000-100000`, digit runs in URLs, `120000 m²`
(NFKC `m2`), adjacent unrelated numbers (`by 2026 150 schools`; AUDIT-001 ED2-F4, open). Email: `jane at gmail.com`
not detected (word `at` + dotted domain; recognition limitation, ED-DEC-002 §7); `Book now @ www.example.in` is an
E-b candidate.

---

## §5 Screened text (unchanged)

| Field | Provider path | Non-provider intake |
|---|---|---|
| Evidence statement (`intentEvidence.evidence`, `evidence[i].statement`, `intentEvidence[i].evidence`) | **screened** | — |
| `quote` (`signals[i].quote` / `quote`) | screened again at the intake boundary (equivalent, §7) | **screened** |
| `context.targetCustomer`, `context.geography`, `context.service` (strings) | **screened** + existing CONTRACT-REC §3 screen retained | — |
| `title`, `snippet`, `body`, `authorization.basis`, transient `sourceText` | **not screened** (transient; K1-I5 rule 3, PG-3) | — |
| Names, websites, URLs, labels, IDs, enums, dates, authorization fields | structured — existing screens only | structured — existing validation only |

## §6 Provider path (unchanged)

- Private helper in `intentSourceProviderContract.ts`, called once in each of `preparePublicWeb`, `prepareAiPlatform`,
  `preparePublicIntent`, immediately after the `UNATTRIBUTED` skip, before `raw` is built
  (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`).
- `website = result.business.website`; texts in order: evidence statements (array order), then `context.targetCustomer`,
  `context.geography`, `context.service` (strings only).
- First text with `containsPersonalContactIdentifier(text, website) === true` →
  `reject(path, 'not-allowed', \`${path} contains a personal contact identifier — evidence must be business-level\`)`
  → `ProviderResultOutcome { status: 'REJECTED', field: path, reason: 'not-allowed' }` for that result only.
- Order: `screenProviderKeys` → identity binding → common / type / URL / transient text / `observedAt` →
  `NO_INTENT_EVIDENCE` → verbatim / per-item / authorization → `UNATTRIBUTED` → **K1** → mapping
  (`normalizeIntentEvent`, incl. intake-boundary check) → batch dedupe → P3 → persistence.
- Earlier existing rejections keep their `field` / message. Other batch results unaffected. Pushed results and X1
  re-derivation use `normalizeWith`, hence the same scope; the proof mechanism is unchanged.

## §7 Intake path (unchanged)

- Inline at the end of `toIntentSignalInput`, after authorization evidence, before `return`
  (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`):
  `if (containsPersonalContactIdentifier(quote, website)) throw new IntentSignalValidationError('quote', 'not-allowed', 'quote contains a personal contact identifier — evidence must be business-level');`
- Non-normalizable website → check runs with `W = null`; existing `website invalid` rejection unchanged.
- `toIntentIntakeInput` re-prefixes `signals[i].quote`; whole event rejected before X1, lookup and writes.
- **Equivalence:** intake `quote` = trimmed evidence statement and intake `website` = `business.website`
  (`intentSource.ts` intake construction; `intentSourceAdapters.ts`); same predicate; superset screened earlier on the
  provider path → no provider result is treated differently (AUDIT-001 C.5).

## §8 Rejection propagation and reporting (unchanged)

| Path | Unit | Representation | `field` |
|---|---|---|---|
| Provider | one `IntentProviderResult` | `ProviderResultOutcome` `REJECTED`, `reason = 'not-allowed'` | offending path |
| Intake | one intake event | thrown `IntentSignalValidationError`, `reason = 'not-allowed'` | `signals[i].quote` / `quote` |

Fixed messages; no value echoed; no new enum member; first trigger in scan order sets `field`; no partial acceptance,
no stripping, no change to persisted rows.

---

## §9 Test matrix (specification only — no test written)

Suites and fixtures per ED-DEC-001 ED-7. `W = example.com` (provider fixtures need a `business.website` override,
AUDIT-001 ED7-F5). "E" = text placed in an evidence statement (provider) and in `quote` (intake). Columns:
**Kinds** = `detectContactIdentifiers` result; **Provider** = `normalizeProviderResult` status; **Intake** =
`toIntentIntakeInput` / `recordIntentIntakeForOwner` outcome. `—` = not applicable.

### 9.1 Masking (ED-DEC-002-A) — new

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| MK1 | `98765 43XXX` | `FRAGMENT` | NORMALIZED | accepted |
| MK2 | `98765 43***`; `98765 43•••`; `98765*43210` | `FRAGMENT` each | NORMALIZED | accepted |
| MK3 | `+91 98765 XXXXX`; `XXX-XX-0100` | `FRAGMENT` each | NORMALIZED | accepted |
| MK4 | `98765 43XXX ext 204` (extension on masked candidate) | `FRAGMENT` | NORMALIZED | accepted |
| MK5 | `XXXXX-XXXXX` (no digits); `ext. 2XX` (masked, no base) | `[]`; `FRAGMENT` | NORMALIZED | accepted |
| MK6 | `98x76543210` (single `x`, > 6 digits after) | `FRAGMENT` | NORMALIZED | accepted |
| MK7 | `Call 9876543210*` (footnote) | `PHONE` | REJECTED | rejected |
| MK8 | `98765 4x210` (single glued `x`, extension context; K1-I3 rule 3 / K1-I4) | `PHONE` | REJECTED | rejected |

### 9.2 Extensions and `#` (ED-DEC-002-B) — new / updated

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| EX1 | `5550100 ext 204` | `PHONE` | REJECTED | rejected |
| EX2 | `5550100 extension 204` | `PHONE` | REJECTED | rejected |
| EX3 | `5550100 x204` | `PHONE` | REJECTED | rejected |
| EX4 | `5550100#204` | `PHONE` | REJECTED | rejected |
| EX5 | `5550100x204` (K1-I3 rule 3 / K1-I4 tie-break) | `PHONE` | REJECTED | rejected |
| EX6 | `extension 5550100` (≥ 6 digits, no base) | `PHONE` | REJECTED | rejected |
| EX7 | `ext 204`; `extension 567` (no base) | `FRAGMENT` | NORMALIZED | accepted |
| EX8 | `5550100 #update` (unrelated `#` text) | `PHONE` | REJECTED | rejected |
| EX9 | `+91 22 1234 5678 ext. 204` | `PHONE` | REJECTED | rejected |
| EX10 | `next 9876543210` (no whole-word marker) | `PHONE` | REJECTED | rejected |

### 9.3 Generic labels (ED-DEC-002-C) — new / updated

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| GL1 | `No. 9876543210` | `PHONE` | REJECTED | rejected |
| GL2 | `ID 9876543210` | `PHONE` | REJECTED | rejected |
| GL3 | `#9876543210` | `PHONE` | REJECTED | rejected |
| GL4 | `number 9876543210` | `PHONE` | REJECTED | rejected |
| GL5 | `Mobile No. 9876543210` | `PHONE` | REJECTED | rejected |
| GL6 | `Call 9876543210` | `PHONE` | REJECTED | rejected |
| GL7 | `#12345678` alone | `PHONE` | REJECTED | rejected |
| GL8 | `Tender No. 2026/IT/0457`; `Tender ID 12345678`; `Order #12345678`; `PIN 411001` | `[]` | NORMALIZED | accepted |

### 9.4 Units and prose (ED-DEC-002-D) — new

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| UN1 | `Call 9876543210 in office hours` | `PHONE` | REJECTED | rejected |
| UN2 | `9876543210 hr` | `PHONE` | REJECTED | rejected |
| UN3 | `9876543210 Ms. Rao` | `PHONE` | REJECTED | rejected |
| UN4 | `98765 43210 kg` (run has two groups) | `PHONE` | REJECTED | rejected |
| UN5 | `120000 sq ft`; `250000 kg`; `1500000 litres`; `50k` | `[]` | NORMALIZED | accepted |
| UN6 | `2026-10-02 10:30`; `2 Oct 2026`; `FY 2025-26` | `[]` | NORMALIZED | accepted |
| UN7 | `Rs 1250000`; `₹50,00,000`; `$1,200`; `3.5 crore`; `25%` | `[]` | NORMALIZED | accepted |
| UN8 | `We serve 1200 students across 3 campuses` | `[]` | NORMALIZED | accepted |
| UN9 | `by 2026 150 schools` (open finding ED2-F4; recorded, not corrected) | `PHONE` | REJECTED | rejected |

### 9.5 Email (ED-DEC-002-E; plus retained rev. 2 rows)

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| EM1 | `available at eprocure.gov.in` | `[]` | NORMALIZED | accepted |
| EM2 | `rate @ 12.50`; `units @ 12.50 each`; `qty@12.50`; `admin@192.168.1.1` | `[]` | NORMALIZED | accepted |
| EM3 | `john@example.com` (business) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| EM4 | `john @ example.com` (E-b) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| EM5 | `john [at] example [dot] com` (E-c) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| EM6 | `info@mail.example.com` (subdomain, business) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| EM7 | `john@gmail.com` (personal) | `PERSONAL_EMAIL` | REJECTED | rejected |
| EM8 | `john @ gmail.com`; `john at gmail dot com`; `jane [at] gmail.com` | `PERSONAL_EMAIL` each | REJECTED | rejected |
| EM9 | `jane@gmail` (K1-I3 rule 3) | `UNCERTAIN_EMAIL` | REJECTED | rejected |
| EM10 | `jane @ gmail`; `rate @ rs 500` (spaced residues) | `[]` | NORMALIZED | accepted |
| EM11 | `jane at gmail.com` (documented limitation) | `[]` | NORMALIZED | accepted |
| EM12 | `Book now @ www.example.in` (documented residual) | `PERSONAL_EMAIL` | REJECTED | rejected |
| M4 | website `shop.example.com`, `x@example.com` (parent) | `PERSONAL_EMAIL` | REJECTED | rejected |
| M5 | website `shop.example.com`, `x@mail.example.com` (sibling) | `PERSONAL_EMAIL` | REJECTED | rejected |
| M6 | `x@example-group.com`; `x@example.co.in` | `PERSONAL_EMAIL` | REJECTED | rejected |
| M8 | `info (at) example (dot) com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| M9 | `jane@`; `@gmail.com` | `FRAGMENT` | NORMALIZED | accepted |
| M11 | `x@notexample.com`; `x@example.com.evil.io` | `PERSONAL_EMAIL` | REJECTED | rejected |
| M12 | business + personal email | `BUSINESS_EMAIL`, `PERSONAL_EMAIL` | REJECTED | rejected |
| M13 | `jane+rfp@example.com`; `INFO@EXAMPLE.COM.` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| M14 | `mailto:jane@gmail.com` mid-text | `PERSONAL_EMAIL` | REJECTED | rejected |
| M15 | `@acme` | `[]` | NORMALIZED | accepted |
| M16 | (D-) website `not a url`, `info@example.com` | `PERSONAL_EMAIL` | — | — |
| M17 | (D-) website `null`, `info@example.com` | `PERSONAL_EMAIL` | — | — |

### 9.6 Phones retained from rev. 2 (results unchanged unless marked)

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| P1 | `555-0100` | `PHONE` | REJECTED | rejected |
| P2 | `98765 43210` | `PHONE` | REJECTED | rejected |
| P4 | **updated:** see EX6 / EX7 | | | |
| P5 | `+1 (555) 010-0199` | `PHONE` | REJECTED | rejected |
| P6 / P7 | `9876543210`; `5550100` | `PHONE` | REJECTED | rejected |
| P8 | `2026-10-02`; `02/10/2026`; `10:30 am` | `[]` | NORMALIZED | accepted |
| P10 | `RFP No. 2026/IT/0457` | `[]` | NORMALIZED | accepted |
| P11 | `20261002` | `PHONE` | REJECTED | rejected |
| P12a / P12b | `12345` / `234567`, `23 4567` | `[]` / `PHONE` | NORMALIZED / REJECTED | accepted / rejected |
| P13 | `1200 students`; `12000 users` | `[]` | NORMALIZED | accepted |
| P14 | `1234567890123456` | `[]` | NORMALIZED | accepted |
| P15 | `nine eight seven six five four three two one zero` | `PHONE` | REJECTED | rejected |
| P16 | **updated:** see MK1–MK3 (`FRAGMENT` now reachable) | | | |
| P17 | `tel:+15550100` | `PHONE` | REJECTED | rejected |
| P18 | `tel:` empty / `tel:123` | `FRAGMENT` / `[]` | NORMALIZED | accepted |
| P19 | `+123456789012345` | `PHONE` | REJECTED | rejected |
| P20 / P21 / P22 | `98765 - 43210` / `98765    43210` / `98765/43210` | `PHONE` / `[]` / `[]` | REJECTED / NORMALIZED / NORMALIZED | rejected / accepted / accepted |
| P23 | `9876543210 9876543211`; `+91 98765 43210 98765 43211` | `PHONE` | REJECTED | rejected |
| P24 | `x9876543210` | `PHONE` | REJECTED | rejected |
| P26 | `555.010.0199`; `98765.43210` | `PHONE` | REJECTED | rejected |
| P27 | `v2.10.3`; `version 10.2.1`; `192.168.10.1` | `[]` | NORMALIZED | accepted |
| P29 | `Pune 411001` | `PHONE` | REJECTED | rejected |
| P31 | `(022) 2345 6789` | `PHONE` | REJECTED | rejected |
| P32 | **updated:** `Order #12345678` → GL8; `#12345678` → GL7 (now REJECTED) | | | |
| P33 | `Call #9876543210` | `PHONE` | REJECTED | rejected |

### 9.7 Normalization (unchanged)

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| N1 | Devanagari `९८७६५ ४३२१०` | `PHONE` | REJECTED | rejected |
| N2 | full-width `９８７６５４３２１０` | `PHONE` | REJECTED | rejected |
| N3 | `jane` + U+200B + `@gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| N4 | full-width `ｊａｎｅ＠ｇｍａｉｌ．ｃｏｍ` | `PERSONAL_EMAIL` | REJECTED | rejected |
| N5 | NBSP / U+202F between groups `98765 43210` | `PHONE` | REJECTED | rejected |
| N6 | stored statement / `quote` equals input byte-for-byte in every case | holds | holds | holds |

### 9.8 `context.*`, pushed proof, intake, provider regression (unchanged from rev. 2)

| # | Case | Expected |
|---|---|---|
| C1–C5 | per rev. 2 §9.4 (each field × each family): business email → REJECTED (existing screen); personal email → REJECTED; `98765 43210` mid-text → REJECTED by K1 with `field = context.<name>`; ordinary text → NORMALIZED; no value echo | as stated |
| X1–X4 | per rev. 2 §9.5: identifiers only in `title` / `body` / `basis` of pushed results → NORMALIZED and saved; in an evidence statement → REJECTED at P2; transient values never appear in outputs | as stated |
| I1–I12 | per rev. 2 §9.6 (whole-event rejection, `signals[i].quote`, no lookup / rows, structured fields not screened, `W = null` order, ingress 400) | as stated |
| R1–R8 | per rev. 2 §9.7 (R6: line-578 test retained, retitled; expectation NORMALIZED unchanged) | as stated |

### 9.9 Coverage of the five corrections

| Correction | Rows |
|---|---|
| ED-DEC-002-A masks | MK1–MK8 |
| ED-DEC-002-B extensions / `#` | EX1–EX10, GL3, GL7, P33 |
| ED-DEC-002-C generic labels | GL1–GL8 |
| ED-DEC-002-D units / prose | UN1–UN9 |
| ED-DEC-002-E email | EM1–EM12 |

---

## §10 IMPLEMENTATION AUTHORIZATION

**NONE.** This record is an engineering specification. It does not authorize implementation, validation, provider
calls or deployment. Implementation requires the Product Owner to decide PD-1 and a separate authorization. No
conclusion about readiness is drawn from the absence of open critical findings; a re-audit of this revision is the next
governance step.

**Open items carried forward (not corrected here; none needs a Product Owner decision):** AUDIT-001 ED1-F1, ED1-F2,
ED2-F4, ED3-F2, ED4-F4, ED4-F5, ED6-F2, ED6-F3, ED7-F1 (rows other than §9.1–§9.5), ED7-F2, ED7-F4, ED7-F5; ED-DEC-002
§8 new observation (obfuscated business email in `context.*` vs PG-2 net effect). ED3-F1 wording is clarified in §4.3
("in code-point order").

```text
Record type: ENGINEERING SPECIFICATION (rev. 3)

POLICY layer: PG-1..PG-4, K1-B, K1-R1..R3, K1-I1..I6 — preserved, not changed
ENGINEERING layer: ED-DEC-001 ED-1..ED-8 retained; ED-DEC-002 A–E incorporated
Critical AUDIT-001 findings: 5 of 5 corrected
Open Product Owner gaps: NONE

PD-1: PENDING
Implementation authorized: NO
Implementation performed: NO
Validation performed: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO

Files created this round: 2 (ED-DEC-002, this record)
Existing records modified: 0
Production / test / schema / migration / API / UI / dependency changes: 0
```
