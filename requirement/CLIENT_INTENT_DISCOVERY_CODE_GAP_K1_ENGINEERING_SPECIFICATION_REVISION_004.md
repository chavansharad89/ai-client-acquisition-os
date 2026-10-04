# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION (rev. 4)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-004
**Date:** 2026-10-02
**Type:** Engineering specification revision. Not a Product Owner decision, not an audit, **not an implementation
authorization**.
**Author role:** Engineering specification owner, K1 workstream.

**Lineage (none of these is edited):**

| Rev. / record | Record ID (file under `requirement/`) | sha256 |
|---|---|---|
| rev. 0 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001 (`…_K1_ENGINEERING_SPECIFICATION_PREPARATION.md`) | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` |
| rev. 1 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-PREP-001 (`…_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md`) | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` |
| ED-DEC-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001 (`…_K1_ENGINEERING_DECISION.md`) | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` |
| rev. 2 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-002 (`…_K1_ENGINEERING_SPECIFICATION_REVISION.md`) | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` |
| AUDIT-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-CONFORMANCE-AUDIT-001 | `53c79c39a73fa522217a5805ddd73ec39a977741eedd4151ee7fe237f66d8b97` |
| ED-DEC-002 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-002 (`…_K1_ENGINEERING_DECISION_AMENDMENT.md`) | `b9c7aaa8af5e99b2c6e2cd74054eaa0f163944b8acb33a47edb3fdc805abefde` |
| rev. 3 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-003 (`…_K1_ENGINEERING_SPECIFICATION_REVISION_003.md`) | `c3f42694d2b3a76d34fd9cd1118711103e0fe61bed4780e68c5f05c259e374bf` |
| AUDIT-R3 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-003-CONFORMANCE-AUDIT-001 | `a6b5e3da5c565002af8bcfd776bc01e9de1fb582bde2f170c6b91cfeadd92a0b` |
| ED-DEC-003 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-003 (`…_K1_ENGINEERING_DECISION_AMENDMENT_003.md`) | created this round |
| **rev. 4** | **this record** | — |

This record is **self-contained**. Every detector rule, list, processing step and test expectation is stated here in
full; an implementer needs no earlier revision or decision record to understand the detector. Where it differs from any
earlier record, this record is the current engineering specification.

> **PD-1: PENDING. Implementation authorized: NO.**

| Layer | Section | Authority |
|---|---|---|
| **POLICY** | §2 | Product Owner decisions; condensed; not changed |
| **ENGINEERING SPECIFICATION** | §3–§9 | ED-DEC-001 as amended by ED-DEC-002 and ED-DEC-003; deterministic |
| **IMPLEMENTATION AUTHORIZATION** | §10 | NONE — PD-1 PENDING |

---

## §1 Baseline

Verified in ED-DEC-003 §1 in the same round: branch `feature/client-intent-discovery-complete`, HEAD
`2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`, 0 staged, code fingerprint (excl. `requirement/`)
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, all governing-record hashes matching. No code, test,
schema, migration, API, UI or dependency is changed by this record.

---

## §2 POLICY (Product Owner; condensed; nothing added)

| Policy | Content |
|---|---|
| K1-B | An evidence item whose free-text quote contains a personal contact identifier is rejected. |
| K1-R1 | Emails and phones in any form (incl. `mailto:` / `tel:` / `sms:`). Email at the attributed organization's normalized website domain = business; every other email and every phone number = personal. Public availability is not an input. |
| K1-R2 | Names alone are not a ground; quotes are stored verbatim, never masked. No identity inference. |
| K1-R3 | K1-B is part of the OQ-3 item 4 privacy screen → existing `REJECTED` outcome. |
| K1-I1 / K1-I2 | Website host or any subdomain = business; parent, sibling, other, related, affiliate, ccTLD variant or claimed relationship = personal; no registrable-domain equivalence. |
| K1-I3 | (1) Complete identifier in any rendering → in scope (e.g. `jane [at] gmail [dot] com`; phone in words or with inserted characters). (2) Fragment from which no complete identifier can be read (e.g. `jane@`, `@gmail.com`, digits masked by the source) → no ground. (3) Undetermined (e.g. `jane@gmail`) → K1-I4. Detection method is engineering. |
| K1-I4 | Plausibly an identifier and not established otherwise → personal → `REJECTED`. No new outcome (no review / unresolved / held). Established non-identifiers ("evidently a date, price, amount or labelled reference number") cause no rejection. "Plausibly" / "established" are engineering. |
| K1-I5 | Evidence statements always screened; other free text if persisted, displayed or passed on; transient text not screened; structured fields keep existing screens only. |
| K1-I6 | Rejection unit = the whole provider result; nothing broader. |
| PG-1 | Phone = the source supplied all digits of a callable number; local and national numbers are phones; country / area code absence and formatting (incl. `+`, separators, parentheses, labels, `tel:`) never decide. Number with extension → judged by base; extension alone → fragment. Masked / withheld / truncated → fragment. Bare runs → K1-I4; the envelope must not treat absence of formatting or of a country / area code as establishing non-phone. The PO accepts the envelope's volume effect within these constraints. |
| PG-2 | `context.targetCustomer`, `context.geography`, `context.service` are free text → K1-B applies; a hit rejects the whole provider result; the existing CONTRACT-REC §3 screen is retained, not weakened. **Net effect: no email address (business or personal) and no phone number may appear in a `context.*` value.** |
| PG-3 | `title`, `snippet`, `body`, `authorization.basis` carried only inside the transient pushed-result proof are not screened, provided they are never persisted, displayed, logged, passed onward or used otherwise; same scope at re-check. |
| PG-4 | K1-B applies to non-provider intake; a hit rejects the whole intake event; `quote` screened, other intake fields structured; provider-result rejection is a separate boundary and unchanged. |

Not changed and not touched: PD-1..PD-12, K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4, OQ-3, OQ-7, OQ-11, DEC-003.

---

## §3 Common constraints

- **C-1 Read-only.** Detection runs on a derived copy. Screened values are stored, compared and displayed byte-for-byte
  as supplied; nothing is stripped, masked or rewritten.
- **C-2 No value output.** No detected email, phone, domain, substring, offset or quote is returned, stored, logged or
  placed in a message.
- **C-3 One detector.** Every path and field uses `detectContactIdentifiers`; fields differ only in trigger set (§4.1).
- **C-4 No dependency.** ECMAScript regex (incl. Unicode property escapes), `String.prototype.normalize`, existing
  `normalizeDomain`.
- **C-5 Existing screens unchanged.** `isPersonalContactIdentifier`, `checkIdentifier`, `screenProviderKeys`
  (CONTRACT-REC §3) and all existing validation keep their behaviour and position.
- **C-6 One reading suffices (ED3-P).** Where a string admits several readings and **any** admissible reading yields a
  plausible identifier not established as something else, the identifier is reported. "Established" requires content
  (§4.8, §4.4.4 guards, established masks §4.6); separators, punctuation, whitespace quantity and formatting never
  establish anything by themselves.

---

## §4 Detector

### 4.1 Module and contract

File `packages/core-research/src/contactIdentifiers.ts` (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`); not exported
from the package `index.ts`.

```ts
export type ContactIdentifierKind =
  | 'BUSINESS_EMAIL' | 'PERSONAL_EMAIL' | 'UNCERTAIN_EMAIL' | 'PHONE' | 'FRAGMENT';

/** One entry per detected item; [] = none. Kinds only — never values. */
export function detectContactIdentifiers(text: string, website: string | null): readonly ContactIdentifierKind[];

/** Evidence statements and intake `quote` (K1-B): any PERSONAL_EMAIL, UNCERTAIN_EMAIL or PHONE. */
export function containsPersonalContactIdentifier(text: string, website: string | null): boolean;

/** `context.*` (PG-2 net effect): any BUSINESS_EMAIL, PERSONAL_EMAIL, UNCERTAIN_EMAIL or PHONE. */
export function containsAnyContactIdentifier(text: string, website: string | null): boolean;
```

`FRAGMENT` is never a trigger. Entry order is not significant; tests compare multisets.

### 4.2 Domain canonicalization and classification

- **Canonicalization** is the existing `normalizeDomain` (OQ-7 identity normalization): trim; add a scheme if absent;
  `new URL(…).hostname` (IDN → A-label); lower-case; strip a trailing `.` and a leading `www.`; `null` if unparsable.
  Consequence: website `https://www.example.com` gives `W = example.com`.
- `W = website === null ? null : normalizeDomain(website)`. For a valid email domain `d` (§4.4.3): `D = normalizeDomain(d)`.
- `D === null` → `UNCERTAIN_EMAIL`; `W !== null && (D === W || D.endsWith('.' + W))` → `BUSINESS_EMAIL`; otherwise
  `PERSONAL_EMAIL` (incl. every email when `W === null`).
- **Related domains:** no public-suffix reduction, related-domain list, alias, ccTLD mapping, DNS or lookup. Parent,
  sibling, affiliate, look-alike (`notexample.com`, `example.com.evil.io`) and ccTLD variants (`example.co.in`) are
  personal. A claimed relationship in text is not an input. Every phone is personal.

### 4.3 Detection copy `C`

1. `s.normalize('NFKC')`; 2. remove every `\p{Cf}`; 3. map each `\p{Nd}` outside `0–9` to an ASCII digit (value = number
of consecutive `\p{Nd}` code points immediately preceding it in code-point order, mod 10); 4. `toLowerCase()`. No other
transliteration. Positions in `C` are never mapped back to `s`.

### 4.4 Processing order and email detection

**Processing order (per screened string; deterministic):**

| Step | Action | Consumes |
|---|---|---|
| 0 | Build `C` (§4.3) | — |
| 1 | URIs: `mailto:` (→ §4.4.2–4.4.4); `tel:` / `sms:` (→ §4.9) | URI span |
| 2 | Emails: every at-signal (§4.4.1–4.4.4) | span of every candidate yielding a kind |
| 3 | Number words → digits, producing `C′` (§4.5) | — |
| 4 | Exclusion recognizers on `C′` (§4.8) | exclusion spans |
| 5 | Phone stretches, masks, extensions, plausibility (§4.6, §4.7) | — |

Consumed spans are boundaries for all later steps. Step 4 uses only **raw stretches** and `JOIN_NEAR` (§4.6.1), both
computable from `C′` before Step 5. Candidates that yield nothing (guards, numeric hosts) consume nothing.

#### 4.4.1 At-signals and dot-forms

| Form | At-signal | Glue |
|---|---|---|
| A1 contiguous | `@` | local glued before, label glued after |
| A2 spaced literal | `@` | ≤ 3 whitespace on one or both sides (not A1) |
| A3 bracketed | `[at]` `(at)` `{at}` `<at>` `[@]` `(@)` `{@}` `<@>` | glued or ≤ 3 whitespace each side |
| A4 word | `at`, `at the rate`, `at the rate of`, `at-the-rate`, `at-the-rate-of` | whitespace-delimited |

`@` includes NFKC-folded `＠` / `﹫`. **⟨DOT⟩** between two labels: literal `.` glued on both sides; literal `.` with
whitespace on both sides or before only; `[.]` `(.)` `{.}` `<.>`; the word `dot`; `[dot]` `(dot)` `{dot}` `<dot>`;
bracketed and word dot-forms may be glued or have ≤ 3 whitespace on each side. A literal `.` glued to the preceding
label and followed by whitespace or end of text is sentence punctuation and **ends** the domain side.

#### 4.4.2 Extraction (per at-signal)

- **Local** = maximal run of `[\p{L}\p{N}._%+'-]` ending immediately before the at-signal (A1) or before the whitespace
  preceding it (A2–A4), with leading / trailing `.` removed. Glued punctuation such as `:`, `*`, `—`, `(`, `"` is outside
  the run.
- **Domain side** = maximal sequence after the at-signal (and any permitted whitespace) of labels `[\p{L}\p{N}-]+`
  joined by ⟨DOT⟩.
- **`mailto:`** address ends at `?`, `#`, whitespace or end; a `,`-separated list yields one candidate per address; each
  is processed as A1.

#### 4.4.3 Validation — `EMAIL_DOMAIN`

≥ 2 labels; each label 1–63 characters of `[\p{L}\p{N}-]`, not starting or ending with `-`; final label ≥ 2 characters
and only `\p{L}`, or `xn--[a-z0-9-]+`; total ≤ 253. Checked before `normalizeDomain`. The **valid prefix** is the longest
prefix of the domain side ending at a label boundary that satisfies `EMAIL_DOMAIN`.

#### 4.4.4 Guards, classification and uncertainty

**Guards** (content establishing a non-email; candidate yields nothing and consumes nothing):

| Guard | Applies to | Condition |
|---|---|---|
| URL | A2, A3, A4 | first domain label is `www`; or domain side immediately followed by `/` or by `:` + digit; or `://` occurs in or immediately before the local token |
| Price | A2 | `@` followed (≤ 1 whitespace) by a digit or by a currency symbol / code of §4.8 item 2 |
| Handle | A2 | whitespace before `@`, label glued after `@`, and no ⟨DOT⟩ in the domain side |
| Prose | A2, A4 | local token in: `available`, `availability`, `visit`, `visiting`, `visited`, `apply`, `applied`, `us`, `online`, `found`, `find`, `published`, `posted`, `listed`, `hosted`, `live`, `located`, `based`, `held`, `login`, `register`, `registered`, `submit`, `submitted`, `upload`, `uploaded`, `download`, `downloaded`, `accessible`, `access`, `here`, `there`, `website`, `site`, `portal`, `page`, `link`, `details`, `information`, `more`, `now`, `today` |

Mailbox-like words (`info`, `contact`, `sales`, `support`, `admin`, `office`, `hr`, `careers`, `enquiry`, `orders`,
`shop`) are deliberately not in the prose list. A1 and `mailto:` have no guards other than the numeric rule below.

**Classification** (after guards):

| Local | Domain side | Kind |
|---|---|---|
| non-empty | valid prefix exists | §4.2 (`BUSINESS_EMAIL` / `PERSONAL_EMAIL` / `UNCERTAIN_EMAIL`) |
| non-empty | every label numeric (`12.50`, `192.168.1.1`) | nothing (established amount / address) |
| non-empty | single label containing a letter, form A1 / A2 / A3 | `UNCERTAIN_EMAIL` |
| non-empty | single label, form A4 | nothing (word `at` without address syntax is ordinary prose) |
| non-empty | ≥ 2 labels, a letter present, no valid prefix (`gmail..com`, `gmail.c`, `-gmail.com`, over-long label) | `UNCERTAIN_EMAIL` |
| non-empty | empty | `FRAGMENT` |
| empty | valid ≥ 2-label prefix | `FRAGMENT` |
| empty | single label (`@acme`) or empty | nothing |

#### 4.4.5 Rendering classification (K1-I3)

| Rendering | Example | Class | Kind |
|---|---|---|---|
| Contiguous | `jane@gmail.com`, `JANE@GMAIL.COM`, `info@example.com` | complete | §4.2 |
| Glued punctuation | `Email:jane@gmail.com`, `**jane@gmail.com**`, `jane@gmail.com—urgent` | complete | §4.2 |
| `mailto:` (incl. query) | `mailto:jane@gmail.com?subject=RFP` | complete | §4.2 |
| Spaced `@` | `jane @ gmail.com`, `jane@ gmail.com` | complete | §4.2 |
| Bracketed at / dot | `jane [at] gmail [dot] com`, `jane(at)gmail(dot)com`, `jane[at]gmail[.]com`, `jane (at) gmail (.) com` | complete | §4.2 |
| Word at + word / bracketed / literal dot | `jane at gmail dot com`, `jane at gmail.com` | complete | §4.2 |
| Spaced literal dots | `jane @ gmail . com` | complete | §4.2 |
| "At the rate" | `jane at the rate gmail dot com` | complete | §4.2 |
| Local only / domain only | `jane@`, `@gmail.com`, `jane [at]` | fragment | `FRAGMENT` |
| Single label after `@` / bracketed at | `jane@gmail`, `jane @ gmail`, `jane [at] gmail` | uncertain | `UNCERTAIN_EMAIL` |
| Malformed domain | `jane@gmail..com`, `jane@gmail.c` | uncertain | `UNCERTAIN_EMAIL` |
| Word at + single word | `jane at gmail`, `meet at noon`, `met at Infosys. Then` | ordinary text | nothing |
| Prose / URL / price / handle guards | `available at eprocure.gov.in`, `visit us at www.example.com`, `rate @ rs 500`, `follow @acme` | ordinary text | nothing |
| Numeric host | `qty@12.50`, `admin@192.168.1.1` | established non-email | nothing |

No rendering that conveys a complete address is left undetected as a "known limitation". Non-English at / dot words
are outside the recognized vocabulary (carried item R3-M5, §10).

### 4.5 Number words (Step 3)

`zero`, `one` … `nine`, and `oh` / `o` between two digit words or digits, become digits; `double ⟨d⟩` → `dd`,
`triple ⟨d⟩` → `ddd`; word boundaries required. The result `C′` contains digits in place of those words; whitespace or
`-` between converted words remains as stretch characters.

### 4.6 Phone stretches, masks and extensions (Step 5)

#### 4.6.1 Definitions

- **x-token:** a maximal letter token consisting only of `x` (any length). Other letters are **letters**.
- **Raw stretch:** a maximal substring of `C′` containing no letter (x-tokens are not letters here) and no consumed span
  from Steps 1–2. **Phone stretch:** a raw stretch with exclusion spans (Step 4) removed, split at them; it must contain
  ≥ 1 digit. A length-1 x-token with no digit on one of its sides within the stretch is dropped from the stretch.
- **No character other than a letter ends a stretch, and no amount of whitespace does.** `/`, `,`, `;`, `#`, `*`, `•`,
  `·`, `_`, `.`, dashes, parentheses, line breaks and any whitespace run are stretch characters.
- **Group:** maximal ASCII-digit sequence. Any non-digit character separates groups.
- **`JOIN_NEAR(a, b)`:** groups `a`, `b` separated by ≤ 3 characters containing no letter and no digit, a whitespace run
  counting as one character. Used only to restrict exclusions (§4.8); it never ends a stretch.
- **Leading `+`** belongs to the stretch, uncounted.

#### 4.6.2 Inserted characters

Every single non-letter character between digits, and every length-1 x-token between digits, is an inserted character:
a stretch character that adds no digit. The inserted-character reading is always admissible; extension and mask
readings never override a plausible inserted-character reading (C-6). Single `*`, `•`, `x` are never masks.

#### 4.6.3 Established masks

- **M-x:** an x-token of length ≥ 2 within the stretch (fused to digits or not).
- **M-s:** a maximal sequence of ≥ 2 `*` / `•` that is **interior** (a digit occurs on both sides within the stretch)
  **and fused** (no character between it and a digit) on at least one side.
- All other `*` / `•` (edge sequences, sequences spaced from digits on both sides) are typography: ordinary stretch
  characters.
- **Positions** `P` = digits in the stretch + characters of its established masks.

#### 4.6.4 Stretch outcome

1. **No established mask:** apply §4.7 to all digits of the stretch → `PHONE` or nothing.
2. **Established mask and `P ≤ 15`:** one masked number → `FRAGMENT`. Visible digits are never re-evaluated alone.
3. **Established mask and `P > 15`:** masks split the stretch into **segments**. A mask may bind an adjacent segment
   only if `digits(segment) + length(mask) ≤ 15`. A mask fused to a segment binds it whenever admissible; a mask binds
   at least one adjacent segment when any binding is admissible; a mask with no admissible binding binds nothing.
   A segment is **free** if some admissible assignment leaves it unbound. Equivalently, segment `S` is free iff no
   admissibly-binding mask is fused to `S`, and every mask adjacent to `S` that may bind `S` has another admissible
   binding. Any free segment plausible under §4.7 → `PHONE`; otherwise → `FRAGMENT`.
4. One entry per stretch: `PHONE` if any, else `FRAGMENT` if masked, else nothing.

#### 4.6.5 Extensions and `#`

1. **Word markers** `ext`, `extn`, `extension` (whole word; optional `.` / `:`) are letters and end a stretch.
2. **Extension digits:** after a marker (optional `.` / `:`, ≤ 1 whitespace), a group of 1–6 digits not followed by a
   digit, where a **base stretch** ends ≤ 3 characters (whitespace, `,`, `-`, `(`) before the marker → extension digits
   of that base: no separate entry; the base is judged alone (`PHONE`, `FRAGMENT` or nothing).
3. **No base:** the stretch beginning at the first digit after the marker: established mask → `FRAGMENT`; `< 6` digits
   → `FRAGMENT` (extension alone); `≥ 6` → ordinary stretch.
4. **Glued `x` / `#`:** inserted characters (§4.6.2); no separate extension rule is needed because the joined reading
   contains every base digit and §4.7's window rule covers a base of whole groups.
5. **`#` roles, in order:** (i) designator inside a qualifying labelled-reference phrase (§4.8 item 5); (ii) otherwise
   an ordinary stretch character. Never a mask, generic label or separator with special effect.

### 4.7 Plausibility

`n` = digits of the evaluated stretch or segment (extension digits excluded); **`L_min = 6`, `L_max = 15`**:
- `6 ≤ n ≤ 15` → `PHONE`;
- `n > 15` → `PHONE` if any contiguous window of whole groups has a digit count in `[6, 15]`; else nothing;
- `n < 6` → nothing.

Formatting, `+`, separators, whitespace quantity, labels, contact words and country / area code presence are not
inputs. The `core-payments` 8–15 validator is not used.

### 4.8 Exclusion recognizers (Step 4; content only)

Case-insensitive on `C′`; word boundaries; not applied inside `tel:` / `sms:` dial strings.
`NUM` = `\d+(?:[.,]\d+)*`; `RANGE` = `NUM(?:\s?(?:-|–|—|to)\s?NUM)?`.

1. **Dates / times / years.**
   - `YYYY<s>MM<s>DD`, `DD<s>MM<s>YYYY`, `MM<s>DD<s>YYYY`, `DD<s>MM<s>YY`; `<s>` ∈ { `-`, `.`, `/` }, identical twice;
     month 1–12, day 1–31, 4-digit year 1900–2099; invalid values not excluded.
   - Month names (`jan` / `january` … `dec` / `december`, `sep`, `sept`, optional `.`) adjacent (≤ 2 characters of
     space, `,`, `.`, `-`) to a 1–2 digit day and / or a 4-digit year 1900–2099.
   - Year ranges `(?:fy\s?)?(19|20)\d{2}\s?[-–/]\s?(\d{2}|(19|20)\d{2})`.
   - Times `\d{1,2}:\d{2}(:\d{2})?` (optional `am` / `pm`); `\d{1,2}(\.\d{2})?\s?(am|pm)`.
   - Not excluded: unseparated runs (`20261002`).
2. **Prices / amounts.** `RANGE` immediately preceded (≤ 1 space; optional `.` after a code) by `₹ $ € £ ¥ ₩ ₽ ¢ ₺ ₫ ₦
   ₱ ₪ ฿` or `rs`, `inr`, `usd`, `eur`, `gbp`, `aed`, `sgd`, `aud`, `cad`, `jpy`, `cny`, `rupees`, `rupee`, `dollars`,
   `euros`; or immediately followed by one of those codes or by `/-`. Thousands-grouped numbers
   (`\d{1,3}(,\d{3})+`; `\d{1,3},(\d{2},)*\d{3}`; optional decimal). Short decimal: a maximal digit-and-dot token with
   exactly one `.` and 1–2 digits after it, not `JOIN_NEAR` another group.
3. **Units after the number.** Excluded only when all hold:
   - unit token in the **spaced-or-glued list** (≤ 1 whitespace): `mm`, `cm`, `km`, `inch`, `inches`, `ft`, `feet`,
     `sq ft`, `sq. ft.`, `sqft`, `sq m`, `sqm`, `acre`, `acres`, `hectare`, `hectares`, `mg`, `kg`, `ton`, `tons`,
     `tonne`, `tonnes`, `lb`, `lbs`, `ml`, `ltr`, `litre`, `litres`, `liter`, `liters`, `kl`, `kb`, `mb`, `gb`, `tb`,
     `kw`, `mw`, `kwh`, `mwh`, `kmph`, `km/h`, `mph`, `pcs`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`,
     `years`, `lakh`, `lakhs`, `lac`, `lacs`, `crore`, `crores`, `million`, `billion`, `thousand`, `%`; or in the
     **glued-only list**: `m`, `l`, `g`, `t`, `w`, `k`, `mn`, `bn`, `cr`;
   - followed by a non-letter or end of text;
   - the excluded digits are exactly one quantity token (`NUM` / `RANGE`) and that token is not `JOIN_NEAR` any other
     group.
4. **Versions / network.** Dotted `\d+(\.\d+){1,3}` immediately preceded by `v`, `version`, `ver`, `ver.`, `release`,
   `build` (≤ 1 space). IPv4: exactly four dot groups, each 0–255, not adjacent to further digits or dots.
5. **Labelled reference numbers.** Token = one whitespace-free run of digits, letters, `/`, `-`, `.`, `_` containing ≥ 1
   digit (Class S: the stated shape). Designator = `no`, `no.`, `number`, `num.`, `#`, `id`, `ref`, `ref.`, `:`.
   Between label, designator and token: `(\s|[.:\-#/]){0,3}`.

   | Class | Labels | Designator | Token |
   |---|---|---|---|
   | R (reference-only) | `ref`, `reference`, `rfp`, `rfq`, `rfi`, `eoi`, `nit`, `invoice`, `inv`, `po`, `sku`, `s/n`, `doi`, `reg` | optional | any |
   | S (shape) | `pin`, `pincode`, `pin code`, `postal code` | optional | 6 digits or `ddd ddd` |
   | S | `zip`, `zip code` | optional | `d{5}` or `d{5}-d{4}` |
   | S | `isbn` | optional | 10 or 13 digits with optional `-` / space; last may be `x` |
   | S | `issn` | optional | `dddd-ddd[d\|x]` |
   | S | `gst`, `gstin` | optional | `dd` + 5 letters + 4 digits + letter + alnum + `z` + alnum |
   | S | `pan` / `tan` / `cin` | optional | 5L+4D+1L / 4L+5D+1L / `[lu]`+5D+2L+4D+3L+6D |
   | O (ordinary word) | `tender`, `bid`, `order`, `case`, `ticket`, `part`, `model`, `serial`, `lot`, `batch`, `contract`, `agreement`, `file`, `application`, `registration`, `account`, `a/c` | **required**, immediately after the label (≤ 1 whitespace) | any |

   **Token completeness:** the exclusion applies only if no further digit follows the token within the same raw
   stretch. **Generic labels** (`no`, `no.`, `number`, `#`, `id`) alone never exclude. Contact words are not inputs.

### 4.9 `tel:` / `sms:` URIs (Step 1)

The dial string is the raw stretch immediately after the scheme. 0 digits → `FRAGMENT`; otherwise §4.6–§4.7 apply
**without** §4.8 exclusions.

### 4.10 Multiple identifiers

Every email candidate and every phone stretch yields at most one entry; all entries are returned. A text is a trigger
if any entry is in the field's trigger set (§4.1). Masked and complete numbers in separate stretches yield
`FRAGMENT` and `PHONE` respectively.

### 4.11 Residuals (fail-closed over-capture; PG-1 volume effect accepted)

Plausible within `[6, 15]` and not established otherwise, hence `PHONE`: `Pune 411001`; `150000 users`;
`50000-100000`; digit runs in URLs; `120000 m²` (NFKC `m2`); adjacent unrelated numbers (`by 2026 150 schools`);
uncurrencied decimal lists (`12.50, 13.75`); dimensions (`1920x1080`); alphanumeric codes (`ORD2026100212345`);
number-word joins (`two 500000 litre tanks`). Email: word-at forms with a non-prose local token
(`Tenders at eprocure.gov.in` → `PERSONAL_EMAIL`). No residual is a false negative on a complete identifier.

---

## §5 Field screening

| Field | Provider path | Non-provider intake |
|---|---|---|
| Evidence statement (`intentEvidence.evidence`, `evidence[i].statement`, `intentEvidence[i].evidence`) | **screened**, `containsPersonalContactIdentifier` | — |
| `quote` (`signals[i].quote` / `quote`) | screened again at the intake boundary (§7) | **screened**, `containsPersonalContactIdentifier` |
| `context.targetCustomer`, `context.geography`, `context.service` (strings) | existing CONTRACT-REC §3 screen (unchanged, runs first) **and** `containsAnyContactIdentifier` | not carried |
| `title`, `snippet`, `body`, `authorization.basis`, transient `sourceText` | **not screened** while transient (PG-3; K1-I5 r3) | — |
| Names, websites, URLs, labels, IDs, enums, dates, authorization fields | structured — existing screens only | structured — existing validation only |

Persisted / displayed free text in scope = evidence statements (persisted as `source_quote`) and `context.*` (carried
on the normalized event). Transient text in scope of PG-3 is never persisted, displayed, logged, passed on or used
otherwise; if that stops being true, K1-I5 r2 applies.

## §6 Provider path

- Private helper in `intentSourceProviderContract.ts`, called once in each of `preparePublicWeb`, `prepareAiPlatform`,
  `preparePublicIntent`, immediately after the `UNATTRIBUTED` skip, before `raw` is built
  (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`).
- `website = result.business.website`. Texts in order: evidence statements (array order) with
  `containsPersonalContactIdentifier`; then `context.targetCustomer`, `context.geography`, `context.service` (strings
  only) with `containsAnyContactIdentifier`.
- First hit → `reject(path, 'not-allowed', message)` → `ProviderResultOutcome { status: 'REJECTED', field: path,
  reason: 'not-allowed' }` for that result only. Messages (fixed, no value):
  - evidence: `` `${path} contains a personal contact identifier — evidence must be business-level` ``;
  - context: `` `${path} contains a contact identifier — context values must not contain email addresses or phone numbers` ``.
- Order: `screenProviderKeys` → identity binding → common / type / URL / transient text / `observedAt` →
  `NO_INTENT_EVIDENCE` → verbatim / per-item / authorization → `UNATTRIBUTED` → **K1** → mapping
  (`normalizeIntentEvent`, incl. intake-boundary check) → batch dedupe → P3 → persistence.
- Earlier existing rejections keep their `field` / message (a contiguous email in `context.*` is rejected by the
  existing screen first). Other batch results are unaffected. Pushed results and X1 re-derivation use `normalizeWith`,
  hence the same scope; the proof mechanism is unchanged.

## §7 Intake path

- Inline at the end of `toIntentSignalInput`, after authorization evidence, before `return`
  (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`):
  `if (containsPersonalContactIdentifier(quote, website)) throw new IntentSignalValidationError('quote', 'not-allowed', 'quote contains a personal contact identifier — evidence must be business-level');`
- Non-normalizable website → check runs with `W = null`; existing `website invalid` rejection unchanged and later.
- `toIntentIntakeInput` re-prefixes `signals[i].quote`; the whole event is rejected before X1, lookup and writes.
- **Equivalence:** intake `quote` = the provider evidence statement, trimmed; intake `website` = `business.website`;
  same detector and same trigger set. Leading / trailing whitespace never changes a §4 result (it is never part of a
  local token, domain side or digit). The provider path screens a superset earlier, so no provider result is treated
  differently at intake. Intake carries no `context.*`.

## §8 Rejection propagation and reporting

| Path | Unit | Representation | `field` |
|---|---|---|---|
| Provider | one `IntentProviderResult` | `ProviderResultOutcome` `REJECTED`, `reason = 'not-allowed'` | offending path |
| Intake | one intake event | thrown `IntentSignalValidationError`, `reason = 'not-allowed'` | `signals[i].quote` / `quote` |

Fixed messages; no value echoed; no new enum member or outcome; first trigger in scan order sets `field`; no partial
acceptance, no stripping, no change to persisted rows.

---

## §9 Test matrix (specification only — no test written)

Suites: `contactIdentifiers.test.ts` (kinds), provider-contract tests (`normalizeProviderResult`, every family for C-rows,
representative family otherwise), intent-signal / worker intake tests. Fixture `W = example.com` (website
`https://www.example.com`; provider fixtures override `business.website`). "E" = text placed in an evidence statement
(provider) and in `quote` (intake). Columns: **Kinds**; **Provider** = result status; **Intake** = intake outcome.
"Δ rev. 3" marks a changed expectation.

### 9.1 Masking

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| MK1 | `98765 43XXX` (partially masked, fused x) | `FRAGMENT` | NORMALIZED | accepted |
| MK2 | `+91 98765 XXXXX` (spaced x group) | `FRAGMENT` | NORMALIZED | accepted |
| MK3 | `XXX-XX-0100` | `FRAGMENT` | NORMALIZED | accepted |
| MK4 | `XXXXX-XXXXX` (fully masked, no digits) | `[]` | NORMALIZED | accepted |
| MK5 | `98XXX XX210`; `98•••43210` (interior masks) | `FRAGMENT` | NORMALIZED | accepted |
| MK6 | `98765 43XXX ext 204` (extension on masked base) | `FRAGMENT` | NORMALIZED | accepted |
| MK7 | `98765 43***`; `98765 43•••` (edge `*` / `•`; undetermined) — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| MK8 | `**9876543210**` | `PHONE` | REJECTED | rejected |
| MK9 | `Call 98765 43210 **`; `Call 9876543210*` | `PHONE` | REJECTED | rejected |
| MK10 | `*** 98765 43210 ***` | `PHONE` | REJECTED | rejected |
| MK11 | `98765 XXXXX 98765 43210` (mask adjacent to complete number, `P = 20`) | `PHONE` | REJECTED | rejected |
| MK12 | `98765 43XXX 98765 43210` (multiple sequences, one stretch) | `PHONE` | REJECTED | rejected |
| MK13 | `98765-XXXXX` (mask separated by punctuation) | `FRAGMENT` | NORMALIZED | accepted |
| MK14 | `98765 XXXXX` (mask separated by whitespace) | `FRAGMENT` | NORMALIZED | accepted |
| MK15 | `98765 43210 XXXXX` (`P = 15`, one-number extent) | `FRAGMENT` | NORMALIZED | accepted |
| MK16 | `9876543210 XXXXXX`; `9876543210 - XXXXXX` (`P = 16`, binding inadmissible) | `PHONE` | REJECTED | rejected |
| MK17 | `98XXX XX210 or 98765 43210` (masked + complete, separate stretches) | `FRAGMENT`, `PHONE` | REJECTED | rejected |
| MK18 | `98765 ** 43210` (interior, spaced both sides → typography) | `PHONE` | REJECTED | rejected |

### 9.2 Inserted characters, extensions, `#`

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| IC1 | `98765*43210` — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| IC2 | `98765x43210` — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| IC3 | `98765#43210` — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| IC4 | `98x76543210` — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| IC5 | `98765 x 43210` — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| IC6 | `98765 4x210`; `98765•43210` | `PHONE` | REJECTED | rejected |
| IC7 | `5550100x204` | `PHONE` | REJECTED | rejected |
| IC8 | `98765**43210` (interior fused 2-char mask, `P = 12`) | `FRAGMENT` | NORMALIZED | accepted |
| IC9 | `x9876543210` (edge single `x`) | `PHONE` | REJECTED | rejected |
| IC10 | `98765a43210` (letter other than `x` ends stretch: 5 + 5) | `[]` | NORMALIZED | accepted |
| EX1 | `5550100 ext 204`; `5550100 extension 204` | `PHONE` | REJECTED | rejected |
| EX2 | `5550100 x204` | `PHONE` | REJECTED | rejected |
| EX3 | `+91 22 1234 5678 ext. 204` (extension with real base) | `PHONE` | REJECTED | rejected |
| EX4 | `ext 204`; `extension 567` (no base) | `FRAGMENT` | NORMALIZED | accepted |
| EX5 | `extension 5550100` (≥ 6 digits, no base) | `PHONE` | REJECTED | rejected |
| EX6 | `next 9876543210` (no whole-word marker) | `PHONE` | REJECTED | rejected |
| HS1 | `Order #12345678` (`#` as reference designator) | `[]` | NORMALIZED | accepted |
| HS2 | `5550100#204` (`#` as extension) | `PHONE` | REJECTED | rejected |
| HS3 | `Call 98765 # 43210`; `5550100 #update` (`#` as punctuation) | `PHONE` | REJECTED | rejected |
| HS4 | `#12345678`; `#9876543210` (generic `#`) | `PHONE` | REJECTED | rejected |

### 9.3 Reference labels and prose

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| RL1 | `Tender No. 2026/IT/0457`; `RFP No. 2026/IT/0457`; `Ref 2026/IT/0457` | `[]` | NORMALIZED | accepted |
| RL2 | `Tender ID 12345678`; `Order No. 4567890`; `Case number 12345678`; `Order: 12345678` | `[]` | NORMALIZED | accepted |
| RL3 | `Invoice 12345678`; `PO 4500012345` (Class R) | `[]` | NORMALIZED | accepted |
| RL4 | `PIN 411001`; `ISBN 978-81-203-1234-5` (Class S shape) | `[]` | NORMALIZED | accepted |
| RL5 | `PIN 9876543210` (shape fails) | `PHONE` | REJECTED | rejected |
| RL6 | `to order 98765 43210`; `WhatsApp to order 9876543210` | `PHONE` | REJECTED | rejected |
| RL7 | `In case 9876543210 is busy, mail us` | `PHONE` | REJECTED | rejected |
| RL8 | `WhatsApp Business account 9876543210` | `PHONE` | REJECTED | rejected |
| RL9 | `Order No. 98765 43210`; `Ref: 98765 43210` (token completeness) | `PHONE` | REJECTED | rejected |
| RL10 | `No. 9876543210` (generic `No.`) | `PHONE` | REJECTED | rejected |
| RL11 | `ID 9876543210` (generic `ID`) | `PHONE` | REJECTED | rejected |
| RL12 | `number 9876543210` (generic `number`) | `PHONE` | REJECTED | rejected |
| RL13 | `Mobile No. 9876543210`; `Call 9876543210`; `WhatsApp 9876543210`; `Fax: 22 1234 5678` (contact words) | `PHONE` | REJECTED | rejected |
| RL14 | `Call 9876543210 in office hours`; `9876543210 hr`; `9876543210 Ms. Rao` (adjacent prose) | `PHONE` | REJECTED | rejected |
| RL15 | `We serve 1200 students across 3 campuses`; `1200 students`; `12000 users` | `[]` | NORMALIZED | accepted |
| RL16 | `by 2026 150 schools`; `Pune 411001` (residuals §4.11) | `PHONE` | REJECTED | rejected |
| UN1 | `98765 43210 kg` (unit token `JOIN_NEAR` another group) | `PHONE` | REJECTED | rejected |
| UN2 | `120000 sq ft`; `250000 kg`; `1500000 litres`; `50k`; `5000 kg`; `250 GB` | `[]` | NORMALIZED | accepted |
| UN3 | `2026-10-02 10:30`; `2 Oct 2026`; `FY 2025-26`; `2025–2026`; `02/10/2026`; `10:30 am` | `[]` | NORMALIZED | accepted |
| UN4 | `Rs 1250000`; `₹50,00,000`; `$1,200`; `3.5 crore`; `25%`; `Rs 50000-100000` | `[]` | NORMALIZED | accepted |
| UN5 | `v2.10.3`; `version 10.2.1`; `192.168.10.1` | `[]` | NORMALIZED | accepted |

### 9.4 Separators

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| SP1 | `9876543210` (none) | `PHONE` | REJECTED | rejected |
| SP2 | `98765 43210` (one space); `98765 - 43210` | `PHONE` | REJECTED | rejected |
| SP3 | `98765    43210` (multiple spaces) — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| SP4 | `98765.43210`; `555.010.0199` | `PHONE` | REJECTED | rejected |
| SP5 | `98765-43210`; `555-0100` | `PHONE` | REJECTED | rejected |
| SP6 | `98765–43210` (U+2013); `98765—43210` (U+2014); `98765−43210` (U+2212) | `PHONE` | REJECTED | rejected |
| SP7 | `98765/43210` — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| SP8 | `98765,43210` — Δ rev. 3 | `PHONE` | REJECTED | rejected |
| SP9 | `(98765) 43210`; `(022) 2345 6789`; `+1 (555) 010-0199` | `PHONE` | REJECTED | rejected |
| SP10 | `98765·43210` | `PHONE` | REJECTED | rejected |
| SP11 | `98765_43210` | `PHONE` | REJECTED | rejected |
| SP12 | `98765` + line break + `43210` | `PHONE` | REJECTED | rejected |
| SP13 | `9876543210 9876543211`; `+91 98765 43210 98765 43211` (window rule) | `PHONE` | REJECTED | rejected |
| SP14 | `12345`; `1234567890123456` (single 16-digit group) | `[]` | NORMALIZED | accepted |
| SP15 | `234567`; `23 4567`; `+123456789012345`; `20261002` | `PHONE` | REJECTED | rejected |
| SP16 | `9,876,543` (thousands-grouped amount); `12.50` alone | `[]` | NORMALIZED | accepted |
| SP17 | `12.50, 13.75`; `1920x1080` (accepted over-capture §4.11) | `PHONE` | REJECTED | rejected |

### 9.5 Email

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| ER1 | `john@gmail.com` (personal) | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER2 | `JOHN@GMAIL.COM` (uppercase) | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER3 | `john@example.com`; `INFO@EXAMPLE.COM.`; `jane+rfp@example.com` (business) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER4 | `info@mail.example.com` (subdomain) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER5 | `john @ gmail.com`; `john@ gmail.com` (spaced `@`) | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER6 | `john @ example.com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER7 | `jane at gmail.com` — Δ rev. 3 | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER8 | `jane at gmail dot com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER9 | `jane [at] gmail.com`; `jane [at] gmail [dot] com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER10 | `jane (at) gmail (dot) com`; `jane(at)gmail(dot)com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER11 | `jane[at]gmail[.]com`; `jane (at) gmail (.) com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER12 | `jane @ gmail . com`; `jane @ gmail .com` (spaced dots) | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER13 | `jane at the rate gmail dot com`; `jane at-the-rate gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER14 | `info (at) example (dot) com`; `info at example dot com` (obfuscated business) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER15 | `mailto:jane@gmail.com` mid-text | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER16 | `mailto:jane@gmail.com?subject=RFP` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER17 | `mailto:info@example.com?subject=RFP` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER18 | `Email:jane@gmail.com`; `email—jane@gmail.com`; `jane@gmail.com—urgent`; `**jane@gmail.com**`; `_jane@gmail.com_`; `(jane@gmail.com)` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER19 | `Email:info@example.com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER20 | `jane@gmail..com`; `jane@gmail.c`; `jane@-gmail.com` (malformed) | `UNCERTAIN_EMAIL` | REJECTED | rejected |
| ER21 | `jane@gmail` | `UNCERTAIN_EMAIL` | REJECTED | rejected |
| ER22 | `jane @ gmail`; `jane [at] gmail` — Δ rev. 3 (`jane @ gmail`) | `UNCERTAIN_EMAIL` | REJECTED | rejected |
| ER23 | `jane@`; `@gmail.com`; `jane [at]` | `FRAGMENT` | NORMALIZED | accepted |
| ER24 | `jane at gmail`; `meet at noon`; `met at Infosys. Then` (ordinary text) | `[]` | NORMALIZED | accepted |
| ER25 | `available at eprocure.gov.in`; `published at eprocure.gov.in/tenders` | `[]` | NORMALIZED | accepted |
| ER26 | `visit us at www.example.com`; `Book now @ www.example.in` — Δ rev. 3 (`Book now`) | `[]` | NORMALIZED | accepted |
| ER27 | `rate @ 12.50`; `units @ 12.50 each`; `rate @ rs 500`; `qty@12.50`; `admin@192.168.1.1` | `[]` | NORMALIZED | accepted |
| ER28 | `@acme`; `follow @acme` (handles) | `[]` | NORMALIZED | accepted |
| ER29 | `Tenders at eprocure.gov.in` (accepted over-capture §4.11) | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER30 | full-width `ｊａｎｅ＠ｇｍａｉｌ．ｃｏｍ`; `jane` + U+200B + `@gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| D1 | website `https://www.example.com`, `x@example.com` and `x@mail.example.com` (`W = example.com`) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| D2 | website `shop.example.com`, `x@example.com` (parent) | `PERSONAL_EMAIL` | REJECTED | rejected |
| D3 | website `shop.example.com`, `x@mail.example.com` (sibling) | `PERSONAL_EMAIL` | REJECTED | rejected |
| D4 | `x@example-group.com`; `x@example.co.in` (related / ccTLD) | `PERSONAL_EMAIL` | REJECTED | rejected |
| D5 | `x@notexample.com`; `x@example.com.evil.io` (look-alike) | `PERSONAL_EMAIL` | REJECTED | rejected |
| D6 | (kinds only) website `not a url`, `info@example.com` | `PERSONAL_EMAIL` | — | — |
| D7 | (kinds only) website `null`, `info@example.com` | `PERSONAL_EMAIL` | — | — |
| MI1 | `info@example.com` and `jane@gmail.com` | `BUSINESS_EMAIL`, `PERSONAL_EMAIL` | REJECTED | rejected |
| MI2 | `info@example.com`, `sales@example.com` (business only) | `BUSINESS_EMAIL`, `BUSINESS_EMAIL` | NORMALIZED | accepted |
| MI3 | `info@example.com` and `98765 43210` | `BUSINESS_EMAIL`, `PHONE` | REJECTED | rejected |
| NM1 | `Contact Ms. Priya Rao` (name alone) | `[]` | NORMALIZED | accepted |
| NM2 | `Contact Priya Rao at info@example.com` (name + business email) | `BUSINESS_EMAIL` | NORMALIZED | accepted |

### 9.6 `context.*` (each row run for each of `targetCustomer`, `geography`, `service`, in each provider family)

| # | Value | Expected |
|---|---|---|
| CX1 | `jane@gmail.com` (personal) | REJECTED by the existing CONTRACT-REC §3 screen; existing field / message |
| CX2 | `info@example.com` (business) | REJECTED by the existing screen; existing field / message |
| CX3 | `contact info [at] example [dot] com` (obfuscated business) | REJECTED by K1 (`containsAnyContactIdentifier`); `field = context.<name>`; context message |
| CX4 | `jane [at] gmail [dot] com` (obfuscated personal) | REJECTED by K1; `field = context.<name>` |
| CX5 | `call 98765 43210` (phone) | REJECTED by K1; `field = context.<name>` |
| CX6 | `mid-size manufacturers`; `Pune, India`; `mobile app development` (ordinary text) | NORMALIZED |
| CX7 | `jane@`; `98765 XXXXX` (fragments) | NORMALIZED |
| CX8 | any REJECTED row: message does not echo the value; evidence statements are screened before `context.*` | holds |

### 9.7 Normalization

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| N1 | Devanagari `९८७६५ ४३२१०` | `PHONE` | REJECTED | rejected |
| N2 | full-width `９８７６５４３２１０` | `PHONE` | REJECTED | rejected |
| N3 | NBSP / U+202F between groups `98765 43210` | `PHONE` | REJECTED | rejected |
| N4 | `nine eight seven six five four three two one zero`; `nine eight seven six five four three two one oh` | `PHONE` | REJECTED | rejected |
| N5 | `tel:+15550100` mid-text | `PHONE` | REJECTED | rejected |
| N6 | `tel:` empty / `tel:123` | `FRAGMENT` / `[]` | NORMALIZED | accepted |
| N7 | for every row: stored statement / `quote` equals the input byte-for-byte | holds | holds | holds |

### 9.8 Lifecycle

| # | Case | Expected |
|---|---|---|
| L1 | **Provider rejection:** notice with 3 entries, 1 offending | REJECTED; `field = intentEvidence[i].evidence`; no event |
| L2 | AI platform: FIRST_PARTY clean + PUBLISHED offending | REJECTED whole result |
| L3 | batch [clean, offending, clean] | [NORMALIZED, REJECTED, NORMALIZED] |
| L4 | unattributed result with personal email in E | UNATTRIBUTED (K1 runs after the skip; nothing persisted) |
| L5 | **Intake rejection:** clean event (one and several signals) | accepted; rows written |
| L6 | personal email in `signals[1].quote` of 3 | rejected; `field = signals[1].quote`; no lookup; no rows |
| L7 | phone / `jane@gmail` / obfuscated personal email in `quote` | rejected |
| L8 | single-signal form, personal email in `quote` | rejected; `field = quote` |
| L9 | business email at `website` domain in `quote` | accepted |
| L10 | email / phone-like `companyName`; digit runs in `website` / `sourceUrl` / `sourceLabel` | not rejected by K1 |
| L11 | prior rows for the same company after a rejected event | unchanged |
| L12 | non-normalizable `website`, personal email in `quote` / clean `quote` | rejected `signals[i].quote` (K1 first) / rejected `website` `invalid` (existing) |
| L13 | ingress: K1 intake rejection | existing generic 400; logs `externalId` / `field` / `reason` only |
| L14 | **Transient pushed proof:** identifier only in `title`, `snippet` or `body` of a pushed notice / web result | NORMALIZED at P2; saved at P3 |
| L15 | identifier only in `authorization.basis` of a pushed FIRST_PARTY result | NORMALIZED; X1 re-derivation passes; saved |
| L16 | identifier only in `title` / `snippet` / `body` / `basis` of a **pulled** result | NORMALIZED |
| L17 | identifier in an evidence statement of a pushed result | REJECTED at P2 and at X1 re-derivation (same scope) |
| L18 | transient values absent from outcomes, messages, logs, events, intake and saved rows | holds |
| L19 | **Persisted / displayed fields:** evidence statements (→ `source_quote`) and `context.*` (→ normalized event) are the only free-text fields screened; their stored values equal the input byte-for-byte | holds |
| L20 | **Equivalence:** over every provider row in §9.1–§9.5, `REJECTED` `field` is a provider path (never `signals[i].quote`) and every NORMALIZED event's intake passes `toIntentIntakeInput`; every row's Provider and Intake columns agree | holds |
| L21 | test `intentSourceProviderContract.test.ts:578` | retained; retitled to state `body` is transient under PG-3; expectation NORMALIZED unchanged |
| L22 | privacy-key tests `intentSourceProviderContract.test.ts:536–576` | unchanged |
| L23 | existing suites (`intentSignal`, `intentSource`, provider contract, `providerAuthenticity`, worker intent intake, ingress) | pass unchanged except L21 title |

### 9.9 Coverage of ED-DEC-003 and AUDIT-R3

| Item | Rows |
|---|---|
| ED3-F1 masks (R3-F1) | MK1–MK18 |
| ED3-F2 inserted characters / extensions / `#` (R3-F2) | IC1–IC10, EX1–EX6, HS1–HS4 |
| ED3-F3 email sequence (R3-F3) | ER15–ER23, ER27 |
| ED3-F4 reference labels (R3-F4) | RL1–RL16 |
| ED3-F5 separators (R3-F5) | SP1–SP17, UN1 |
| ED3-F6 renderings (R3-F6) | ER1–ER30 |
| ED3-F7 `context.*` (R3-F7) | CX1–CX8 |
| PG-1..PG-4 consequences | MK*, IC*, EX*, SP*, RL* (PG-1); CX* (PG-2); L14–L18 (PG-3); L5–L13, L20 (PG-4) |
| K1-R1..R3, K1-I1..I6 | ER*, D1–D7, MI1–MI3, NM1–NM2, L1–L4 |

---

## §10 IMPLEMENTATION AUTHORIZATION

**NONE.** This record is an engineering specification. It does not authorize implementation, testing changes,
validation, provider calls or deployment. Implementation requires the Product Owner to decide PD-1 and a separate
authorization. The next governance step is a fresh read-only conformance audit of this revision.

**Product Owner dependencies:** NONE (ED-DEC-003 §5).

**Open items carried forward (not corrected here; none needs a Product Owner decision):** AUDIT-R3 R3-M3 (`tel:` scheme
word boundary, e.g. `Hotel:2026-10-02`), R3-M5 (number words and at / dot words limited to English; compound and
non-English forms not recognized), R3-M6 (over-capture now listed in §4.11, recorded open), R3-M7 (`publication.publisher`
classification unstated), R3-M9 (AUDIT-001 ED1-F1, ED1-F2, ED2-F4, ED3-F2, ED4-F4, ED6-F2, ED6-F3, ED7-F2, ED7-F4,
ED7-F5 reconciliation). Addressed by restatement only (no separate decision): R3-M1 (§4.2, D1), R3-M2 (§9 written out),
R3-M4 (§4.4 order), R3-M8 (§4.4.1).

```text
Record type: ENGINEERING SPECIFICATION (rev. 4)

POLICY layer: K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4 — preserved, not changed
ENGINEERING layer: ED-DEC-001 as amended by ED-DEC-002 and ED-DEC-003 (ED3-F1..F7)
AUDIT-R3 findings R3-F1..R3-F7: resolved in engineering
Product Owner dependencies: NONE

PD-1: PENDING
Implementation authorized: NO
Implementation performed: NO
Tests modified: NO
Dependencies changed: NO
Migrations / schemas changed: NO
Provider calls: NO
External research: NO
Validation: NO
Participant contact: NO
Commit / push: NO

Files created this round: 2 (ED-DEC-003, this record)
Existing records modified: 0
```
