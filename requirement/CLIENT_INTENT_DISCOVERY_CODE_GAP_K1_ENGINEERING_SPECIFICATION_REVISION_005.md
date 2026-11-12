# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION (rev. 5)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-005
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
| ED-DEC-003 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-003 (`…_K1_ENGINEERING_DECISION_AMENDMENT_003.md`) | `681707ac9e41230da36b2550d3c3e0e1f7bd1599af86707e75902638a0b59fc8` |
| rev. 4 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-004 (`…_K1_ENGINEERING_SPECIFICATION_REVISION_004.md`) | `d9b1f918c4c85c72121affffb8b3a1a150330fb9bff0cca1760622dd37a5c4f4` |
| AUDIT-R4 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-004-CONFORMANCE-AUDIT-001 | `1fa6f241aa5176a14d84f775146a3f17e5ece1dfbb0c623c770abc8d27a289c2` |
| ED-DEC-004 | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-004 (`…_K1_ENGINEERING_DECISION_AMENDMENT_004.md`) | created this round |
| **rev. 5** | **this record** | — |

This record is **self-contained**. Every detector rule, list, processing step, lifecycle rule and test expectation is
stated here in full; an implementer or auditor needs no earlier revision or decision record to understand the final
rules. Where it differs from any earlier record, this record is the current engineering specification.

> **PD-1: PENDING. Implementation authorized: NO. Validation authorized: NO.**

| Layer | Section | Authority |
|---|---|---|
| **POLICY** | §2 | Product Owner decisions; condensed; not changed |
| **ENGINEERING SPECIFICATION** | §3–§10 | ED-DEC-001 as amended by ED-DEC-002, ED-DEC-003 and ED-DEC-004; deterministic |
| **IMPLEMENTATION AUTHORIZATION** | §11 | NONE — PD-1 PENDING |

**Contents map (required elements):**

| # | Element | Section |
|---|---|---|
| 1 | Domain canonicalization | §4.2 |
| 2 | Business-domain classification | §4.2 |
| 3 | Email detection | §4.4 |
| 4 | Phone detection | §4.6, §4.7 |
| 5 | Obfuscated identifier detection | §4.4.1, §4.4.5, §4.5, §4.6.2 |
| 6 | Fragment handling | §4.4.4 (E-3, E-5), §4.6.6, §4.6.9, §4.9 |
| 7 | Uncertain-string handling | §4.4.4 (E-5), §4.7 |
| 8 | Exclusion rules | §4.4.4 (E-2, E-4), §4.8 |
| 9 | `context.*` rules | §5, §6 |
| 10 | Provider-result lifecycle | §6 |
| 11 | Non-provider intake lifecycle | §7 |
| 12 | Processing order | §4.4 (Steps 0–5), §6, §7 |
| 13 | Rejection propagation | §8 |
| 14 | Rejection reason / message | §8 |
| 15 | Detector return categories | §4.1, §4.10 |
| 16 | Provider / intake equivalence | §9 |
| 17 | Transient-field treatment | §5 |
| 18 | Full lifecycle test matrix | §10 |

---

## §1 Baseline

Verified in ED-DEC-004 §1 in the same round: branch `feature/client-intent-discovery-complete`, HEAD
`2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`, 0 staged, code fingerprint (excl. `requirement/`)
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, all 21 governing-record hashes matching. The
pre-existing modification of `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` is untouched. No code, test, schema, migration,
API, UI, configuration or dependency is changed by this record.

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
| K1-I4 | Plausibly an identifier and not established otherwise → personal → `REJECTED`. No new outcome. Established non-identifiers ("evidently a date, price, amount or labelled reference number") cause no rejection. "Plausibly" / "established" are engineering. |
| K1-I5 | Evidence statements always screened; other free text if persisted, displayed or passed on; transient text not screened; structured fields keep existing screens only. |
| K1-I6 | Rejection unit = the whole provider result; nothing broader. |
| PG-1 | Phone = the source supplied all digits of a callable number; local and national numbers are phones; country / area code absence and formatting (incl. `+`, separators, parentheses, labels, `tel:`) never decide. Number with extension → judged by base; extension alone → fragment. Masked / withheld / truncated → fragment. Bare runs → K1-I4; absence of formatting or of a country / area code never establishes non-phone. The PO accepts the envelope's volume effect within these constraints. |
| PG-2 | `context.targetCustomer`, `context.geography`, `context.service` are free text → K1-B applies; a hit rejects the whole provider result; the existing CONTRACT-REC §3 screen is retained, not weakened. **Net effect: no email address (business or personal) and no phone number may appear in a `context.*` value.** |
| PG-3 | `title`, `snippet`, `body`, `authorization.basis` carried only inside the transient pushed-result proof are not screened, provided they are never persisted, displayed, logged, passed onward or used otherwise; same scope at the X1 re-check. If any condition stops holding for a field, K1-I5 rule 2 applies to it. |
| PG-4 | K1-B applies to non-provider intake; a hit rejects the whole intake event; `quote` screened, other intake fields structured; provider-result rejection (K1-I6) is a separate boundary and unchanged. |

Not changed and not touched: PD-1..PD-12, K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4, OQ-3, OQ-7, OQ-11, DEC-003.

---

## §3 Common constraints

- **C-1 Read-only.** Detection runs on a derived copy. Screened values are stored, compared and displayed as supplied
  (after the existing trim, §7); nothing is stripped, masked or rewritten.
- **C-2 No value output.** No detected email, phone, domain, substring, offset or quote is returned, stored, logged or
  placed in a message.
- **C-3 One detector.** Every path and field uses `detectContactIdentifiers`; fields differ only in trigger set (§4.1).
- **C-4 No dependency.** ECMAScript regex (incl. Unicode property escapes), `String.prototype.normalize`, existing
  `normalizeDomain`.
- **C-5 Existing screens unchanged.** `isPersonalContactIdentifier`, `checkIdentifier`, `screenProviderKeys`
  (CONTRACT-REC §3) and all existing validation keep their behaviour and position.
- **C-6 One reading suffices (ED3-P).** Where a string admits several readings and **any** admissible reading yields a
  plausible identifier not established as something else, the identifier is reported. "Established" requires content
  (§4.8, §4.4.4 guards, established masks inside a mask unit §4.6); separators, punctuation, whitespace quantity and
  formatting never establish anything by themselves.
- **C-7 Structure may only withhold establishment (ED4-P).** A rule may use gaps, punctuation, line breaks or digit
  counts to *withhold* "established" status from a mask, guard or label (moving an outcome toward detection), never to
  confer it. A recognizer never suppresses a reading that is already a complete, valid address; a colon or a generic
  word never suppresses a number.

---

## §4 Detector

### 4.1 Module, contract and return categories

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

| Kind | Meaning | Evidence / `quote` trigger | `context.*` trigger |
|---|---|---|---|
| `BUSINESS_EMAIL` | complete address whose domain is `W` or a subdomain of `W` | no (K1-R1) | yes (PG-2) |
| `PERSONAL_EMAIL` | any other complete address | yes | yes |
| `UNCERTAIN_EMAIL` | address-shaped, completeness / domain undetermined (K1-I3 r3 → K1-I4) | yes | yes |
| `PHONE` | plausible phone number not established otherwise (K1-I3 r1, PG-1, K1-I4) | yes | yes |
| `FRAGMENT` | local-only / domain-only email, masked number, extension alone (K1-I3 r2, PG-1 band 3) | no | no |
| (no entry) | ordinary text or established non-identifier | — | — |

Entry order is not significant; tests compare multisets.

### 4.2 Domain canonicalization and business-domain classification

- **Canonicalization** is the existing `normalizeDomain` (OQ-7 identity normalization): trim; add a scheme if absent;
  `new URL(…).hostname` (IDN → A-label); lower-case; strip a trailing `.` and a leading `www.`; `null` if empty or
  unparsable. Consequence: website `https://www.example.com` gives `W = example.com`.
- `W = website === null ? null : normalizeDomain(website)`. For a valid email domain `d` (§4.4.3):
  `D = normalizeDomain(d)`.
- `D === null` → `UNCERTAIN_EMAIL`; `W !== null && (D === W || D.endsWith('.' + W))` → `BUSINESS_EMAIL`; otherwise
  `PERSONAL_EMAIL` (incl. every email when `W === null`).
- **Related domains:** no public-suffix reduction, related-domain list, alias, ccTLD mapping, DNS or lookup. Parent,
  sibling, affiliate, look-alike (`notexample.com`, `example.com.evil.io`) and ccTLD variants (`example.co.in`) are
  personal. A claimed relationship in text is not an input. Every phone is personal.

### 4.3 Detection copy `C`

1. `s.normalize('NFKC')`; 2. remove every `\p{Cf}`; 3. map each `\p{Nd}` outside `0–9` to an ASCII digit (value = number
of consecutive `\p{Nd}` code points immediately preceding it in code-point order, mod 10); 4. `toLowerCase()`. No other
transliteration. Positions in `C` are never mapped back to `s`. `C′` = `C` after Step 3 (§4.5).

### 4.4 Processing order and email detection

**Processing order (per screened string; deterministic):**

| Step | Action | On | Consumes |
|---|---|---|---|
| 0 | Build `C` (§4.3) | `s` | — |
| 1 | URIs: `mailto:` (→ §4.4.2–4.4.4); `tel:` / `sms:` (→ §4.9) | `C` | URI span |
| 2 | Emails: every at-signal, precedence E-1 … E-5 (§4.4.4) | `C` | span of every candidate yielding a kind |
| 3 | Number words → digits, producing `C′` (§4.5) | `C` | — |
| 4 | Exclusion recognizers (§4.8) | `C′` | exclusion spans |
| 5 | Phone stretches, emphasis pairing, masks, mask units, remainders, extensions, plausibility (§4.6, §4.7) | `C′` | — |

Consumed spans are boundaries for all later steps. Candidates that yield nothing (guards, numeric hosts) consume
nothing. Step 2's content guards *call* the §4.8 patterns on the candidate text (E-4); Step 4 is not moved. Step 4 uses
only **raw stretches** and `JOIN_NEAR` (§4.6.1), both computable from `C′` before Step 5.

#### 4.4.1 At-signals and dot-forms

| Form | At-signal | Glue |
|---|---|---|
| A1 contiguous | `@` | local glued before, label glued after |
| A2 spaced literal | `@` | ≤ 3 whitespace on one or both sides (not A1) |
| A3 bracketed | `[at]` `(at)` `{at}` `<at>` `[@]` `(@)` `{@}` `<@>` | glued or ≤ 3 whitespace each side |
| A4 word | `at`, `at the rate`, `at the rate of`, `at-the-rate`, `at-the-rate-of` | whitespace-delimited (whole words) |

`@` includes NFKC-folded `＠` / `﹫`. **⟨DOT⟩** between two labels: literal `.` glued on both sides; literal `.` with
whitespace on both sides or before only; `[.]` `(.)` `{.}` `<.>`; the word `dot`; `[dot]` `(dot)` `{dot}` `<dot>`;
bracketed and word dot-forms may be glued or have ≤ 3 whitespace on each side. A literal `.` glued to the preceding
label and followed by whitespace or end of text is sentence punctuation and **ends** the domain side.

#### 4.4.2 Extraction (E-1)

- **Local** = maximal run of `[\p{L}\p{N}._%+'-]` ending immediately before the at-signal (A1) or before the whitespace
  preceding it (A2–A4), with leading / trailing `.` removed. Glued punctuation such as `:`, `*`, `—`, `(`, `"` is outside
  the run.
- **Domain side** = maximal sequence, after the at-signal and its permitted whitespace, of labels `[\p{L}\p{N}-]+` joined
  by ⟨DOT⟩. Two consecutive dots cannot join labels, so `gmail..com` yields the single label `gmail`.
- **`mailto:`** address ends at `?`, `#`, whitespace or end; a `,`-separated list yields one candidate per address; each
  is processed as A1.

#### 4.4.3 Validation — `EMAIL_DOMAIN`

≥ 2 labels; each label 1–63 characters of `[\p{L}\p{N}-]`, not starting or ending with `-`; final label ≥ 2 characters
and only `\p{L}`, or `xn--[a-z0-9-]+`; total ≤ 253. Non-final labels may be all-numeric (`163.com` is valid); a domain
whose final label is numeric or a single character is never valid. Checked before `normalizeDomain`. The **valid
prefix** is the longest prefix of the domain side ending at a label boundary that satisfies `EMAIL_DOMAIN`.

#### 4.4.4 Precedence, guards, classification and uncertainty (E-1 … E-5)

Applied to each at-signal candidate in this order; the first step that yields a result decides.

| Step | Rule | Result |
|---|---|---|
| **E-1** | Extract local and domain side (§4.4.2) | — |
| **E-2** | **Structural guards.** URL guard (A2, A3, A4): first domain label is `www`; or the domain side is immediately followed by `/` or by `:` + digit; or `://` occurs in or immediately before the local token. Prose guard (A2, A4): local token in the prose list below | nothing |
| **E-3** | **Complete address.** A valid prefix exists: local non-empty → kind by §4.2 (`BUSINESS_EMAIL` / `PERSONAL_EMAIL` / `UNCERTAIN_EMAIL`); local empty → `FRAGMENT` | kind — **stop** |
| **E-4** | **Content guards (only when no valid prefix exists).** CG-1: the text after the at-signal and its permitted whitespace begins (after ≤ 1 whitespace) with a currency symbol of §4.8 item 2, or with a currency code / word of §4.8 item 2 followed by a non-letter or end. CG-2: a §4.8 item 1 (date / time / year range), item 2 (price / amount / thousands / short decimal), item 3 (unit quantity) or item 4 (version / IPv4) pattern matches a span of `C` beginning at the first character of the domain side (the `JOIN_NEAR` conditions of item 2 short decimals and item 3 are not applied here). CG-3: the domain side is non-empty and every label is all digits. CG-4 (A2, A4 only): the first domain-side label begins with a digit. Handle guard (A2): whitespace before `@`, a label glued after `@`, and no ⟨DOT⟩ in the domain side | nothing |
| **E-5** | **Uncertainty / fragments** (no valid prefix, no guard): see table below | per table |

E-5 table:

| Local | Domain side | A1 / A2 / A3 | A4 |
|---|---|---|---|
| non-empty | single label containing a letter (`jane@gmail`; `jane@gmail..com` → single label `gmail`) | `UNCERTAIN_EMAIL` | nothing |
| non-empty | ≥ 2 labels, a letter present (`gmail.c`, `-gmail.com`, over-long label) | `UNCERTAIN_EMAIL` | `UNCERTAIN_EMAIL` if the **final** label contains a letter; otherwise nothing |
| non-empty | empty | `FRAGMENT` | `FRAGMENT` |
| empty | single label (`@acme`) or empty | nothing | nothing |

**Prose list** (local tokens that establish a sentence, A2 / A4): `available`, `availability`, `visit`, `visiting`,
`visited`, `apply`, `applied`, `us`, `online`, `found`, `find`, `published`, `posted`, `listed`, `hosted`, `live`,
`located`, `based`, `held`, `login`, `register`, `registered`, `submit`, `submitted`, `upload`, `uploaded`, `download`,
`downloaded`, `accessible`, `access`, `here`, `there`, `website`, `site`, `portal`, `page`, `link`, `details`,
`information`, `more`, `now`, `today`. Mailbox-like words (`info`, `contact`, `sales`, `support`, `admin`, `office`, `hr`,
`careers`, `enquiry`, `orders`, `shop`) are deliberately not listed. A1 and `mailto:` have no structural guards.

**Precedence consequences (normative):** a complete valid address is never hidden by a price, time, digit or currency
guard (`jane @ 163.com` → personal); a clear time, price, amount or unit after the word `at` is never an email
(`meeting at 11.30am`, `supply at Rs.500` → nothing); numeric or numeric-final domains are never valid
(`163`, `163.456`, `12.50`, `1.2.3.4` → no email kind); A1 / A2 / A3 uncertainty is unchanged (K1-I4 fail-closed).

#### 4.4.5 Rendering classification (K1-I3)

| Rendering | Example | Class | Kind |
|---|---|---|---|
| Contiguous | `jane@gmail.com`, `JANE@GMAIL.COM`, `info@example.com`, `jane@163.com` | complete | §4.2 |
| Glued punctuation | `Email:jane@gmail.com`, `**jane@gmail.com**`, `jane@gmail.com—urgent` | complete | §4.2 |
| `mailto:` (incl. query) | `mailto:jane@gmail.com?subject=RFP` | complete | §4.2 |
| Spaced `@` | `jane @ gmail.com`, `jane@ gmail.com`, `jane @ 163.com`, `info @ 1und1.de` | complete | §4.2 |
| Bracketed at / dot | `jane [at] gmail [dot] com`, `jane(at)gmail(dot)com`, `jane[at]gmail[.]com` | complete | §4.2 |
| Word at + word / bracketed / literal dot | `jane at gmail dot com`, `jane at gmail.com`, `jane at 163.com` | complete | §4.2 |
| Spaced literal dots | `jane @ gmail . com` | complete | §4.2 |
| "At the rate" | `jane at the rate gmail dot com` | complete | §4.2 |
| Local only / domain only | `jane@`, `@gmail.com`, `jane [at]` | fragment | `FRAGMENT` |
| Single label after `@` / bracketed at | `jane@gmail`, `jane @ gmail`, `jane [at] gmail` | uncertain | `UNCERTAIN_EMAIL` |
| Malformed domain | `jane@gmail..com`, `jane@gmail.c`, `jane at gmail.c` | uncertain | `UNCERTAIN_EMAIL` |
| Word at + single word / numeric-final | `jane at gmail`, `meet at noon`, `met at Infosys. Then`, `office at No.12` | ordinary text | nothing |
| Prose / URL guards | `available at eprocure.gov.in`, `visit us at www.example.com` | ordinary text | nothing |
| Content guards | `meeting at 11.30am`, `supply at Rs.500`, `rate @ 12.50`, `rate @ rs 500`, `price @ 12.5k`, `jane@11.30am`, `follow @acme` | established non-email | nothing |
| Numeric host | `qty@12.50`, `admin@192.168.1.1`, `jane @ 163` | established non-email | nothing |

Non-English at / dot words are outside the recognized vocabulary (open item R3-M5, §4.11).

### 4.5 Number words (Step 3)

`zero`, `one` … `nine`, and `oh` / `o` between two digit words or digits, become digits; `double ⟨d⟩` → `dd`,
`triple ⟨d⟩` → `ddd`; word boundaries required. The result `C′` contains digits in place of those words; whitespace or
`-` between converted words remains as stretch characters.

### 4.6 Phone stretches, masks, mask units and extensions (Step 5)

#### 4.6.1 Definitions

- **x-token:** a maximal run of `\p{L}` characters in `C′` consisting only of `x`. **Length 1:** an ordinary stretch
  character — never a letter, never a mask; between two digits it is an inserted character (§4.6.2). **Length ≥ 2:**
  mask-capable; always an established mask M-x (§4.6.4). Every other `\p{L}` character is a **letter**.
- **Raw stretch:** a maximal substring of `C′` containing no letter and no consumed span from Steps 1–2.
- **Phone stretch:** a raw stretch with the exclusion spans of Step 4 removed and split at them; pieces containing no
  digit are discarded. **All of §4.6.3–§4.6.9 is computed on phone stretches.**
- **No character other than a letter ends a stretch, and no amount of whitespace does.** `/`, `,`, `;`, `:`, `#`, `*`,
  `•`, `·`, `_`, `.`, dashes, parentheses, line breaks and any whitespace run are stretch characters.
- **Group:** maximal ASCII-digit sequence. **Leading `+`** immediately before a group belongs to the stretch, uncounted.
- **`JOIN_NEAR(a, b)`:** groups `a`, `b` separated by ≤ 3 characters containing no letter and no digit (x-tokens count
  as non-letters), a whitespace run counting as one character. Used only to restrict exclusions (§4.8); it never ends
  a stretch.

#### 4.6.2 Inserted characters

Every single non-letter character between two digits, and every length-1 x-token between two digits, is an inserted
character: a stretch character that adds no digit. The inserted-character reading is always admissible; extension and
mask readings never override a plausible inserted-character reading (C-6). Single `*`, `•`, `x` are never masks.

#### 4.6.3 Emphasis pairing of `*` runs

- A **`*`-run** is a maximal run of `*` characters that is not adjacent to a `•` (a mixed `*` / `•` run is never an
  emphasis delimiter).
- **Opener:** the character before the run is start of text, whitespace, or a character that is neither `\p{L}` nor
  `\p{N}`; **and** the character after it is neither whitespace nor end of text.
- **Closer:** the character before the run is neither whitespace nor start of text; **and** the character after it is
  end of text, whitespace, or a character that is neither `\p{L}` nor `\p{N}`.
- **Matching:** scan `C′` left to right keeping a list of unmatched openers. For each run: if it is a closer and an
  unmatched opener of the **same length** lies earlier with no line terminator between them, match it with the
  **nearest** such opener (both become emphasis delimiters; unmatched openers between them stay unmatched); otherwise,
  if it is an opener, append it to the list. Each run is matched at most once.
- **Emphasis delimiters are typography** (ordinary stretch characters); they are never masks and never mask-capable.

Examples: `**9876543210**`, `Call **9876543210** 24x7`, `**98765 43210**, **98765 43211**`, `**98765** **43210**` —
all pairs matched. `98765**43210` — neither opener (digit before) nor closer (digit after) → unmatched.

#### 4.6.4 Established masks

- **Mask-capable element:** an x-token of length ≥ 2, or a run of ≥ 2 characters each `*` or `•` that is not an
  emphasis delimiter.
- **M-x:** every x-token of length ≥ 2 in the phone stretch (fused to digits or not).
- **M-s:** a mask-capable `*` / `•` run such that
  (a) it is **fused** (no character between) to a digit on at least one side; and
  (b) on **each** side it is either fused to a digit, or followed / preceded — directly or across a tight gap
  (§4.6.5) — by another mask-capable element.
  Mask-capable status is lexical, so (b) is evaluated once, without iteration.
- Every other `*` / `•` (single characters, emphasis delimiters, runs failing (a) or (b)) is **typography**: an
  ordinary stretch character that is not part of any gap class except "loose" (§4.6.5).

Examples: `98•••43210`, `98765**43210`, `98** **10`, `98••• ••210` → M-s. `98765 43***`, `98765 43•••` (nothing on the
right), `9876543210** 2026` (a digit group, not a mask, across the gap), `98765 ** 43210` (fused to nothing),
`******3210` (start of text on the left) → typography.

#### 4.6.5 Gaps, mask units, remainders

**Elements** of a phone stretch, in order: groups and established masks. The **gap** between two consecutive elements
is the characters strictly between them. Gap classes:

| Class | Definition | Joins? |
|---|---|---|
| fused | empty gap | yes |
| inserted | exactly one character between two **groups** (any non-letter character, incl. a line break, or a length-1 x-token) | yes |
| tight | 1–3 characters, a maximal whitespace run counting as one, every character drawn from: whitespace that is not a line terminator, `-`, `–`, `—`, `−`, `.`, `(`, `)` | yes |
| loose | any other gap (e.g. containing `,`, `/`, `;`, `:`, `|`, `#`, `_`, `·`, `+`, typography `*` / `•`, a line terminator between a group and a mask, or more than 3 characters) | **no** |

- **Mask unit:** a maximal sequence of consecutive elements, every consecutive pair joined, that contains ≥ 1
  established mask. Its **span** runs from the first character of its first element to the last character of its last
  element. A mask never belongs to, binds or affects anything outside its unit.
- **Remainder pieces:** the maximal substrings of the phone stretch outside every unit span; pieces without a digit are
  discarded. A phone stretch with no established mask is a single remainder piece.
- Within a unit: a **cluster** is a maximal sequence of consecutive masks (no group between); `length(K)` = total mask
  characters (gaps not counted). A **segment** is a maximal sequence of consecutive groups (no mask between); segments
  are never empty. Cluster `K` is **fused to** segment `S` if they are adjacent and the gap between them is fused.
- **Core** of segment `S`: `S` without its first group if a cluster is fused to `S` on the left, and without its last
  group if a cluster is fused to `S` on the right (a single-group segment with a fused cluster has an empty core).
- **Positions** `P(unit)` = digits in the unit + Σ `length(K)`.
- **Constant `L_cvn = 10`** (complete visible number length; ED-DEC-004 §4.1 item 5).

#### 4.6.6 Mask-unit outcome (first applicable rule decides)

| Rule | Condition | Outcome |
|---|---|---|
| U1 | unit contains no digit (fully masked) | nothing |
| U2 (CVN) | some segment's core contains a contiguous window of whole groups whose digit count is in `[L_cvn, L_max]` = `[10, 15]` | `PHONE` |
| U3 | `P(unit) ≤ 15` | `FRAGMENT` (one masked number) |
| U4 | `P(unit) > 15` — binding below | `PHONE` if any free segment is plausible under §4.7; else `FRAGMENT` |

**U4 binding.** Cluster `K` *may bind* adjacent segment `S` iff `digits(S) + length(K) ≤ 15`. If `K` is fused to `S` and
may bind `S`, `K` binds `S`. Every cluster with ≥ 1 admissible binding binds ≥ 1 adjacent segment; a cluster with none
binds nothing. Segment `S` is **free** iff (i) no cluster fused to `S` may bind `S`, and (ii) every cluster adjacent to
`S` that may bind `S` may also bind its other adjacent segment. A free segment is evaluated on all its digits.

#### 4.6.7 Remainder outcome

Each remainder piece is evaluated by §4.7 on all its digits → `PHONE` or nothing. Punctuation never splits a remainder
piece; the §4.7 window rule evaluates multi-number text.

#### 4.6.8 Entries per phone stretch

One entry per mask unit (`PHONE` / `FRAGMENT`; U1 → none) plus one entry per remainder piece (`PHONE` only).
Candidates in one sentence are therefore separated by: letters (stretches), consumed spans (URIs, emails), exclusion
spans (phone stretches), and — for masks only — loose gaps (units).

#### 4.6.9 Extensions and `#`

1. **Word markers** `ext`, `extn`, `extension` (whole word; optional `.` / `:`) are letters and end a stretch.
2. **Extension digits:** after a marker (optional `.` / `:`, ≤ 1 whitespace), a group of 1–6 digits not followed by a
   digit, where a **base** phone stretch ends ≤ 3 characters (whitespace, `,`, `-`, `(`) before the marker → extension
   digits of that base: no separate entry; they are removed from their stretch, and the base is judged alone
   (§4.6.5–§4.6.8).
3. **No base:** the phone stretch beginning at the first digit after the marker: if it has no established mask and
   `< 6` digits → `FRAGMENT` (extension alone); otherwise it is evaluated as an ordinary phone stretch (§4.6.5–§4.6.8).
4. **Glued `x` / `#`:** inserted characters (§4.6.2); the joined reading contains every base digit and §4.7's window
   rule covers a base of whole groups.
5. **`#` roles, in order:** (i) designator inside a specific reference-label construction (§4.8 item 5); (ii) otherwise
   an ordinary stretch character (inserted between digits; loose as a gap otherwise). Never a mask or generic label.

#### 4.6.10 Worked determinations (normative)

| Input | Elements / gaps | Unit(s) | Remainder | Kinds |
|---|---|---|---|---|
| `98765 43XXX` | `98765` ·tight· `43` ·fused· `xxx` | one; segment `98765 43`, core `98765` (5); `P = 10` → U3 | — | `FRAGMENT` |
| `98765 43210 XXXXX` | `98765` ·tight· `43210` ·tight· `xxxxx` | one; core `98765 43210` (10) → U2 | — | `PHONE` |
| `9876543210 XXX XXX` | `9876543210` ·tight· `xxx` ·tight· `xxx` | one; cluster length 6; core 10 → U2 | — | `PHONE` |
| `98765 43210 / 98XXX XXXXX` | `43210` ·loose (` / `)· `98` ·fused· `xxx` ·tight· `xxxxx` | `98xxx xxxxx`; core empty; `P = 10` → U3 | `98765 43210 / ` → 10 | `PHONE`, `FRAGMENT` |
| `555-0100, 555-01XX` | `0100` ·loose (`, `)· `555` ·tight· `01` ·fused· `xx` | `555-01xx`; core `555` (3); `P = 7` → U3 | `555-0100, ` → 7 | `PHONE`, `FRAGMENT` |
| `Call **9876543210** 24x7` | `**` pair matched (typography); `x` inserted | none | 13 digits | `PHONE` |
| `**98765 43210**, **98765 43211**` | both pairs matched | none | 20 digits; window `98765 43210` | `PHONE` |
| `+91 98765 XXXXX` | `91` ·tight· `98765` ·tight· `xxxxx` | one; core `91 98765` (7); `P = 12` → U3 | — | `FRAGMENT` |
| `98765 XXXXX 1234567` | all tight | one; cores 5, 7; `P = 17` → U4; `1234567` free | — | `PHONE` |

### 4.7 Plausibility

`n` = digits of the evaluated remainder piece, free segment or base (extension digits excluded);
**`L_min = 6`, `L_max = 15`**:
- `6 ≤ n ≤ 15` → `PHONE`;
- `n > 15` → `PHONE` if any contiguous window of whole groups has a digit count in `[6, 15]`; else nothing;
- `n < 6` → nothing.

Formatting, `+`, separators, whitespace quantity, labels, contact words and country / area code presence are not
inputs. The `core-payments` 8–15 validator is not used. `L_cvn` is used only by U2.

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
5. **Specific reference-label constructions.** A number is excluded as a labelled reference **only** by a complete
   construction:

   ```text
   CONSTRUCTION := LABEL [ GAP_L DESIGNATOR ] GAP_T TOKEN        (whole words; case-insensitive on C′)
   GAP_L        := 0–1 whitespace                                  (between LABEL and DESIGNATOR)
   DESIGNATOR   := no | no. | number | num. | # | id | ref | ref.  (lexical designators only)
   GAP_T        := 0–3 characters from { whitespace (a run = 1), '.', ':', '-', '#', '/' }
   TOKEN        := one whitespace-free run of [0-9a-z/._-] containing ≥ 1 digit
   ```

   | Class | Labels | Designator | Token |
   |---|---|---|---|
   | R (reference-only abbreviations / terms) | `ref`, `rfp`, `rfq`, `rfi`, `eoi`, `nit`, `invoice`, `inv`, `po`, `sku`, `s/n`, `doi`, `reg` | optional | any |
   | S (shape) | `pin`, `pincode`, `pin code`, `postal code` | optional | 6 digits or `ddd ddd` |
   | S | `zip`, `zip code` | optional | `d{5}` or `d{5}-d{4}` |
   | S | `isbn` | optional | 10 or 13 digits with optional `-` / space; last may be `x` |
   | S | `issn` | optional | `dddd-ddd[d\|x]` |
   | S | `gst`, `gstin` | optional | `dd` + 5 letters + 4 digits + letter + alnum + `z` + alnum |
   | S | `pan` / `tan` / `cin` | optional | 5L+4D+1L / 4L+5D+1L / `[lu]`+5D+2L+4D+3L+6D |
   | O (ordinary words with prose meaning) | `tender`, `bid`, `order`, `case`, `ticket`, `part`, `model`, `serial`, `lot`, `batch`, `contract`, `agreement`, `file`, `application`, `registration`, `account`, `a/c`, `reference` | **required** | any |

   - **`:` is never a designator.** It is only a `GAP_T` connector: after a designator (`Order No: 1234567`), or after a
     Class R / S label (`Ref: 2026/IT/0457`, `PIN: 411001`). An ordinary word followed by `:` (`To order:`,
     `Business account:`, `Order:`) is not a construction and excludes nothing.
   - **Generic designators alone** (`No.`, `No:`, `#`, `ID`, `ID:`, `number`, `Number:`) never exclude.
   - **Number boundary (token completeness):** the exclusion applies only if no further digit follows `TOKEN` within the
     same raw stretch (before the next letter or consumed span).
   - **Difference from prose:** a Class R label has no ordinary-prose use before a number; a Class O word does, so it
     counts only with a lexical designator; a Class S label counts only if the token has the stated shape. Contact
     words (`call`, `mobile`, `whatsapp`, `fax`, …) are not inputs and never exclude.

### 4.9 `tel:` / `sms:` URIs (Step 1)

The dial string is the raw stretch immediately after the scheme. 0 digits → `FRAGMENT`; otherwise §4.6–§4.7 apply
**without** §4.8 exclusions.

### 4.10 Multiple identifiers

Every email candidate yields at most one entry; every mask unit and every remainder piece yields at most one entry
(§4.6.8); all entries are returned. A text is a trigger if any entry is in the field's trigger set (§4.1).

### 4.11 Residuals

**(a) Fail-closed over-capture** (plausible within `[6, 15]` or address-shaped and not established otherwise; PG-1
volume effect accepted; K1-I4): `Pune 411001`, `context.geography = "Mumbai 400001"`; `150000 users`; `50000-100000`;
digit runs in URLs; `120000 m²` (NFKC `m2`); adjacent unrelated numbers joined across any punctuation or line break
(`by 2026 150 schools`, `In 2024, 150 clients`, `Sizes 10, 20, 50, 100 units`); uncurrencied decimal lists
(`12.50, 13.75`); dimensions (`1920x1080`); alphanumeric codes (`ORD2026100212345`); number-word joins
(`two 500000 litre tanks`); edge `*` / `•` sequences (`98765 43•••`, R4-M1); a `*` / `•` mask spaced from digits on one
side (`98•• 43210`); a genuine masked number split by a line break (`+91 98765` ⏎ `XXXXX`); a genuine masked number with
≥ 10 visible digits and a detached mask (`+86 1380 0138 XXX`); `Order: 12345678` (no designator); `jane @ 163.456`
(6 digits → `PHONE`; no email kind). Email: word-at forms with a non-prose local token (`Tenders at eprocure.gov.in`),
glued-dot abbreviations after `at` (`workshop at St.Xavier's`, `clinic at Dr.Rao`), dotted handles
(`follow @acme.design`) → `PERSONAL_EMAIL`.

**(b) Ambiguity resolved toward the masked reading** (not a false negative under §4.6; same reading PG-1 band 3 requires
for `+91 98765 XXXXX`): a complete 6–9-digit number joined by a fused / inserted / tight gap to a mask in a unit with
`P ≤ 15` (`555-0100 XXXX`, `1234567 XX`) → `FRAGMENT`. A loose gap or a ≥ 10-digit core releases the number.

**(c) Open false negatives** (recorded open; **not** accepted permanently; disposition deferred to a later engineering
record; no Product Owner acceptance sought or implied): a single letter other than `x` / `o` inserted between digits
(`98765a43210` → letters end the stretch); a quoted local part (`"jane.doe"@gmail.com` → `FRAGMENT`); a comma-grouped
phone (`987,654,3210` → the thousands recognizer takes `987,654`); two numbers concatenated into one group of > 15 digits
(`98765432109876543211`); compound or non-English number words and non-English at / dot words (R3-M5). The REV-004
statement "No residual is a false negative on a complete identifier" is withdrawn.

---

## §5 Field screening and transient-field treatment

| Field | Provider path | Non-provider intake |
|---|---|---|
| Evidence statement (`intentEvidence.evidence`, `evidence[i].statement`, `intentEvidence[i].evidence`) | **screened**, `containsPersonalContactIdentifier` | — |
| `quote` (`signals[i].quote` / `quote`) | screened again at the intake boundary (§7; never fires for a provider-derived event, §9) | **screened**, `containsPersonalContactIdentifier` |
| `context.targetCustomer`, `context.geography`, `context.service` (strings) | existing CONTRACT-REC §3 screen (unchanged, runs first) **and** `containsAnyContactIdentifier` | not carried |
| `title`, `snippet`, `body`, `authorization.basis`, transient `sourceText` | **not screened** while transient (PG-3 pushed; K1-I5 r3 pulled) | — |
| Names, websites, URLs, labels, IDs, enums, dates, authorization fields, `publication.publisher` | structured — existing screens only (R3-M7 open) | structured — existing validation only |

**Persisted / displayed free text in scope** = evidence statements (persisted as `source_quote` / signal) and
`context.*` (carried on the normalized event).

**Transient fields (PG-3, K1-I5 r3).** `title`, `snippet` and `body` only build the local `sourceText` used by
`checkVerbatim`; `authorization.basis` is only checked by `requireText`. None enters `raw`, `notes`, the outcome, the
event, intake or a saved row. On the pushed path these bytes travel only inside the opaque in-memory proof (private
`ISSUED` WeakMap: body bytes, signature, registry) for the life of the request and are re-read only by the X1
re-derivation, which re-runs `normalizeWith` with the identical K1 scope. Ingress logs only `externalId`, `field`,
`reason`. Conditions: never persisted, displayed, logged, passed onward or used otherwise; if any condition stops
holding for a field, K1-I5 rule 2 applies to it and it must be screened.

## §6 Provider-result lifecycle

- Private helper in `intentSourceProviderContract.ts`, called once in each of `preparePublicWeb`, `prepareAiPlatform`,
  `preparePublicIntent`, immediately after the `UNATTRIBUTED` skip, before `raw` is built
  (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`).
- `website = result.business.website`. Texts in order: evidence statements (array order) with
  `containsPersonalContactIdentifier`; then `context.targetCustomer`, `context.geography`, `context.service` (strings
  only) with `containsAnyContactIdentifier`.
- First hit → `reject(path, 'not-allowed', message)` → `ProviderResultOutcome { status: 'REJECTED', field: path,
  reason: 'not-allowed' }` for that result only.
- **Order:** `screenProviderKeys` → identity binding → common / type / URL / transient text / `observedAt` →
  `NO_INTENT_EVIDENCE` → verbatim / per-item / authorization → `UNATTRIBUTED` → **K1** → mapping
  (`normalizeIntentEvent`, which calls `toIntentIntakeInput`, incl. the intake-boundary check) → batch dedupe → P3 (X1
  for pushed results) → persistence.
- On the pulled path a result carrying any `SUPPLIED_TO_US` item is rejected `authenticity` / `required` before
  `checkCommon` and before K1 (existing behaviour); FIRST_PARTY items reach K1 only on the verified (pushed) path.
- Earlier existing rejections keep their `field` / message (a contiguous email in `context.*` is rejected by the
  existing screen first). Other batch results are unaffected (K1-I6). Pushed results and the X1 re-derivation use
  `normalizeWith`, hence the same scope; the proof mechanism is unchanged.

## §7 Non-provider intake lifecycle

- Inline at the end of `toIntentSignalInput`, after authorization evidence, before `return`
  (`SPECIFICATION — NOT CURRENT IMPLEMENTATION`):
  `if (containsPersonalContactIdentifier(quote, website)) throw new IntentSignalValidationError('quote', 'not-allowed', 'quote contains a personal contact identifier — evidence must be business-level');`
- `quote` and `website` are the values after the existing `requiredString` trim; the persisted `signal` /
  `sourceQuote` is that trimmed `quote`.
- Non-normalizable website → the check runs with `W = null`; the existing `website invalid` rejection is unchanged and
  later (`normalizeCandidate`).
- `toIntentIntakeInput` re-prefixes `signals[i].quote`; the single-signal form reports `quote`. The **whole event** is
  rejected before X1, `searches.getById`, `normalizeCandidate`, `findOrCreateByDomain` and any write (PG-4). Intake
  carries no `context.*`.

## §8 Rejection propagation, reason and message

| Path | Unit | Representation | `field` | `reason` | Message (fixed; no value echoed) |
|---|---|---|---|---|---|
| Provider, evidence | one `IntentProviderResult` | `ProviderResultOutcome` `REJECTED` | offending evidence path | `not-allowed` | `` `${path} contains a personal contact identifier — evidence must be business-level` `` |
| Provider, `context.*` | one `IntentProviderResult` | `ProviderResultOutcome` `REJECTED` | `context.<name>` | `not-allowed` | `` `${path} contains a contact identifier — context values must not contain email addresses or phone numbers` `` |
| Intake | one intake event | thrown `IntentSignalValidationError` | `signals[i].quote` / `quote` | `not-allowed` | `quote contains a personal contact identifier — evidence must be business-level` |

The first trigger in scan order sets `field`. No new enum member or outcome; no partial acceptance; no stripping; no
change to persisted rows. Ingress (pushed path) maps a P2 rejection to the existing generic 400 and logs only
`externalId`, `field`, `reason`. Other batch results and other intake events are unaffected.

## §9 Provider / intake equivalence

- **Same inputs.** Intake `quote` = the provider evidence statement (via the adapter's `evidence`), trimmed; intake
  `website` = `business.website`, trimmed; `normalizeDomain` trims anyway.
- **Same detector, same trigger set** (`containsPersonalContactIdentifier`) on both paths.
- **Trimming never changes a §4 result.** Leading / trailing whitespace is never part of a local token, domain side,
  digit, mask or gap between elements; the emphasis opener / closer conditions treat "start / end of text" and
  "whitespace" identically; an M-s side test finds neither a digit nor a mask-capable element in either case; A2 vs A1
  at a trimmed edge yields the same kind (` @gmail.com` / `@gmail.com` → `FRAGMENT`).
- **Superset.** The provider path screens the evidence statement (and `context.*`) before mapping, so a provider result
  that would trip the intake check is already `REJECTED`; a provider-derived intake event never trips it. A
  non-provider intake event with the same `quote` and `website` gets the same decision (PG-4: "rejects exactly the same
  results and nothing else").
- **Permitted differences:** (1) `context.*` exists only on the provider path (PG-4 item 4); (2) representation
  (`ProviderResultOutcome` vs thrown error, PG-4 consequence 3); (3) unit (provider result vs intake event; they
  coincide for a provider-derived event, PG-4 item 3).
- **Every row of §10.1–§10.5a states both outcomes; they agree in every row.** No input behaves differently between the
  two paths except through the permitted differences above.

---

## §10 Test matrix (specification only — no test written)

Suites: `contactIdentifiers.test.ts` (kinds), provider-contract tests (`normalizeProviderResult`, every family for CX
rows, representative family otherwise), intent-signal / worker intake tests. Fixture `W = example.com` (website
`https://www.example.com`; provider fixtures override `business.website`). "E" = text placed in an evidence statement
(provider) and in `quote` (intake). Columns: **Kinds** (detector result); **Provider** = result status; **Intake** =
outcome of a non-provider intake event with the same text and website. **"Δ rev. 4"** marks an expectation changed from
REV-004; "Δ rev. 4 (precision)" marks a row restated more precisely with the same policy outcome. REV-004's
"Δ rev. 3" markers are not repeated. Every REV-004 row is retained with its ID.

### 10.1 Masking and formatting

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| MK1 | `98765 43XXX` (partially masked, fused x) | `FRAGMENT` | NORMALIZED | accepted |
| MK2 | `+91 98765 XXXXX` (spaced x group; core 7) | `FRAGMENT` | NORMALIZED | accepted |
| MK3 | `XXX-XX-0100` | `FRAGMENT` | NORMALIZED | accepted |
| MK4 | `XXXXX-XXXXX` (fully masked, no digits) | `[]` | NORMALIZED | accepted |
| MK5 | `98XXX XX210`; `98•••43210` (interior masks) | `FRAGMENT` | NORMALIZED | accepted |
| MK6 | `98765 43XXX ext 204` (extension on masked base) | `FRAGMENT` | NORMALIZED | accepted |
| MK7 | `98765 43***`; `98765 43•••` (edge `*` / `•`; typography) | `PHONE` | REJECTED | rejected |
| MK8 | `**9876543210**` (emphasis pair) | `PHONE` | REJECTED | rejected |
| MK9 | `Call 98765 43210 **`; `Call 9876543210*` | `PHONE` | REJECTED | rejected |
| MK10 | `*** 98765 43210 ***` | `PHONE` | REJECTED | rejected |
| MK11 | `98765 XXXXX 98765 43210` (one unit; core `98765 43210` → U2) | `PHONE` | REJECTED | rejected |
| MK12 | `98765 43XXX 98765 43210` (one unit; core 10 → U2) | `PHONE` | REJECTED | rejected |
| MK13 | `98765-XXXXX` (tight `-`) | `FRAGMENT` | NORMALIZED | accepted |
| MK14 | `98765 XXXXX` (tight space) | `FRAGMENT` | NORMALIZED | accepted |
| MK15 | `98765 43210 XXXXX` (core 10 → U2) — **Δ rev. 4** (was `FRAGMENT` / NORMALIZED / accepted) | `PHONE` | REJECTED | rejected |
| MK16 | `9876543210 XXXXXX`; `9876543210 - XXXXXX` (core 10 → U2) | `PHONE` | REJECTED | rejected |
| MK17 | `98XXX XX210 or 98765 43210` (separate stretches) | `FRAGMENT`, `PHONE` | REJECTED | rejected |
| MK18 | `98765 ** 43210` (spaced both sides → typography) | `PHONE` | REJECTED | rejected |
| MK19 | `Call **9876543210** 24x7` (pair matched; `x` inserted; 13 digits) | `PHONE` | REJECTED | rejected |
| MK20 | `**98765 43210**, **98765 43211**` (pairs matched; window) | `PHONE` | REJECTED | rejected |
| MK21 | `98765 43210 / 98XXX XXXXX` (loose ` / `) | `PHONE`, `FRAGMENT` | REJECTED | rejected |
| MK22 | `555-0100, 555-01XX` (loose `, `) | `PHONE`, `FRAGMENT` | REJECTED | rejected |
| MK23 | `9876543210 XXX XXX` (cluster 6; core 10 → U2) | `PHONE` | REJECTED | rejected |
| MK24 | `**9876543210** 10:30` (time excluded); `**9876543210** 2026` (14 digits) | `PHONE` | REJECTED | rejected |
| MK25 | `Plot XX, 9876543210` (digitless unit → none; remainder 10) | `PHONE` | REJECTED | rejected |
| MK26 | `9876543210** 2026` (unpaired `**` faces a digit group across a gap → typography) | `PHONE` | REJECTED | rejected |
| MK27 | `**98765** **43210**` (two pairs) | `PHONE` | REJECTED | rejected |
| MK28 | `+91 98765 432XX`; `+44 7911 123 XXX`; `(555) XXX-0199` (genuine masks; cores 7 / 9 / ≤ 4) | `FRAGMENT` | NORMALIZED | accepted |
| MK29 | `555-0100 XXXX` (tight detached mask, core 7, `P = 11` → U3; §4.11 (b)) | `FRAGMENT` | NORMALIZED | accepted |
| MK30 | `98765 XXXXX 1234567` (`P = 17` → U4; `1234567` free) | `PHONE` | REJECTED | rejected |
| MK31 | `98765 XXXXX, 1234567` (loose `, `) | `FRAGMENT`, `PHONE` | REJECTED | rejected |
| MK32 | `98** **10`; `98••• ••210` (chained M-s) | `FRAGMENT` | NORMALIZED | accepted |
| MK33 | `98765 43210` ⏎ `XXXXX` (line break between group and mask is loose); `+91 98765` ⏎ `XXXXX` (§4.11 (a)) | `PHONE` | REJECTED | rejected |
| MK34 | `98765*43210 XXXXX` (inserted `*`; core 10 → U2) | `PHONE` | REJECTED | rejected |

### 10.2 Inserted characters, extensions, `#`

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| IC1 | `98765*43210` | `PHONE` | REJECTED | rejected |
| IC2 | `98765x43210` | `PHONE` | REJECTED | rejected |
| IC3 | `98765#43210` | `PHONE` | REJECTED | rejected |
| IC4 | `98x76543210` | `PHONE` | REJECTED | rejected |
| IC5 | `98765 x 43210` | `PHONE` | REJECTED | rejected |
| IC6 | `98765 4x210`; `98765•43210` | `PHONE` | REJECTED | rejected |
| IC7 | `5550100x204` | `PHONE` | REJECTED | rejected |
| IC8 | `98765**43210` (unmatched, fused both sides → M-s; cores empty; `P = 12`) | `FRAGMENT` | NORMALIZED | accepted |
| IC9 | `x9876543210` (edge single `x` = ordinary character) | `PHONE` | REJECTED | rejected |
| IC10 | `98765a43210` (letter ends stretch: 5 + 5; §4.11 (c)) | `[]` | NORMALIZED | accepted |
| EX1 | `5550100 ext 204`; `5550100 extension 204` | `PHONE` | REJECTED | rejected |
| EX2 | `5550100 x204` | `PHONE` | REJECTED | rejected |
| EX3 | `+91 22 1234 5678 ext. 204` | `PHONE` | REJECTED | rejected |
| EX4 | `ext 204`; `extension 567` (no base) | `FRAGMENT` | NORMALIZED | accepted |
| EX5 | `extension 5550100` (≥ 6 digits, no base) | `PHONE` | REJECTED | rejected |
| EX6 | `next 9876543210` | `PHONE` | REJECTED | rejected |
| HS1 | `Order #12345678` (Class O + `#`) | `[]` | NORMALIZED | accepted |
| HS2 | `5550100#204` (`#` inserted) | `PHONE` | REJECTED | rejected |
| HS3 | `Call 98765 # 43210`; `5550100 #update` | `PHONE` | REJECTED | rejected |
| HS4 | `#12345678`; `#9876543210` (generic `#`) | `PHONE` | REJECTED | rejected |

### 10.3 Reference labels and prose

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| RL1 | `Tender No. 2026/IT/0457`; `RFP No. 2026/IT/0457`; `Ref 2026/IT/0457` | `[]` | NORMALIZED | accepted |
| RL2 | `Tender ID 12345678`; `Order No. 4567890`; `Case number 12345678` — **Δ rev. 4** (input `Order: 12345678` moved to RL2b) | `[]` | NORMALIZED | accepted |
| RL2b | `Order: 12345678` (`:` is not a designator) — **Δ rev. 4** (was `[]` / NORMALIZED / accepted) | `PHONE` | REJECTED | rejected |
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
| RL13 | `Mobile No. 9876543210`; `Call 9876543210`; `WhatsApp 9876543210`; `Fax: 22 1234 5678` | `PHONE` | REJECTED | rejected |
| RL14 | `Call 9876543210 in office hours`; `9876543210 hr`; `9876543210 Ms. Rao` | `PHONE` | REJECTED | rejected |
| RL15 | `We serve 1200 students across 3 campuses`; `1200 students`; `12000 users` | `[]` | NORMALIZED | accepted |
| RL16 | `by 2026 150 schools`; `Pune 411001` (§4.11 (a)) | `PHONE` | REJECTED | rejected |
| RL17 | `To order: 9876543210` | `PHONE` | REJECTED | rejected |
| RL18 | `Business account: 9876543210`; `WhatsApp Business account: 9876543210`; `Bulk order: 9876543210` | `PHONE` | REJECTED | rejected |
| RL19 | `No: 9876543210`; `ID: 9876543210`; `# 9876543210`; `Number: 9876543210` (generic designators with `:`) | `PHONE` | REJECTED | rejected |
| RL20 | `Tender No. 9876543210`; `Order No: 12345678`; `Account No. 12345678`; `Ticket #9876543210`; `Tender ID: 12345678`; `Reference No. 12345678` (Class O + lexical designator) | `[]` | NORMALIZED | accepted |
| RL21 | `Ref: 2026/IT/0457`; `Invoice: 12345678`; `PIN: 411001`; `RFQ #12345678` (Class R / S; `:` / `#` as connector or designator) | `[]` | NORMALIZED | accepted |
| RL22 | `For reference 9876543210`; `reference 98765 43210` (`reference` is Class O; no designator) | `PHONE` | REJECTED | rejected |
| RL23 | `To order, no. 9876543210` (`,` is not `GAP_L`; `no.` generic) | `PHONE` | REJECTED | rejected |
| RL24 | `Order ID: 9876543210 / 9876543211` (token completeness fails) | `PHONE` | REJECTED | rejected |
| RL25 | `Tender No.: 2026/IT/0457 dated 02/10/2026` (complete construction; date excluded) | `[]` | NORMALIZED | accepted |
| UN1 | `98765 43210 kg` (unit token `JOIN_NEAR` another group) | `PHONE` | REJECTED | rejected |
| UN2 | `120000 sq ft`; `250000 kg`; `1500000 litres`; `50k`; `5000 kg`; `250 GB` | `[]` | NORMALIZED | accepted |
| UN3 | `2026-10-02 10:30`; `2 Oct 2026`; `FY 2025-26`; `2025–2026`; `02/10/2026`; `10:30 am` | `[]` | NORMALIZED | accepted |
| UN4 | `Rs 1250000`; `₹50,00,000`; `$1,200`; `3.5 crore`; `25%`; `Rs 50000-100000` | `[]` | NORMALIZED | accepted |
| UN5 | `v2.10.3`; `version 10.2.1`; `192.168.10.1` | `[]` | NORMALIZED | accepted |

### 10.4 Separators

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| SP1 | `9876543210` | `PHONE` | REJECTED | rejected |
| SP2 | `98765 43210`; `98765 - 43210` | `PHONE` | REJECTED | rejected |
| SP3 | `98765    43210` (multiple spaces) | `PHONE` | REJECTED | rejected |
| SP4 | `98765.43210`; `555.010.0199` | `PHONE` | REJECTED | rejected |
| SP5 | `98765-43210`; `555-0100` | `PHONE` | REJECTED | rejected |
| SP6 | `98765–43210` (U+2013); `98765—43210` (U+2014); `98765−43210` (U+2212) | `PHONE` | REJECTED | rejected |
| SP7 | `98765/43210` | `PHONE` | REJECTED | rejected |
| SP8 | `98765,43210` | `PHONE` | REJECTED | rejected |
| SP9 | `(98765) 43210`; `(022) 2345 6789`; `+1 (555) 010-0199` | `PHONE` | REJECTED | rejected |
| SP10 | `98765·43210` | `PHONE` | REJECTED | rejected |
| SP11 | `98765_43210` | `PHONE` | REJECTED | rejected |
| SP12 | `98765` + line break + `43210` | `PHONE` | REJECTED | rejected |
| SP13 | `9876543210 9876543211`; `+91 98765 43210 98765 43211` (window rule) | `PHONE` | REJECTED | rejected |
| SP14 | `12345`; `1234567890123456` (single 16-digit group; §4.11 (c) for concatenations) | `[]` | NORMALIZED | accepted |
| SP15 | `234567`; `23 4567`; `+123456789012345`; `20261002` | `PHONE` | REJECTED | rejected |
| SP16 | `9,876,543`; `12.50` alone | `[]` | NORMALIZED | accepted |
| SP17 | `12.50, 13.75`; `1920x1080` (§4.11 (a)) | `PHONE` | REJECTED | rejected |

### 10.5 Email

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| ER1 | `john@gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER2 | `JOHN@GMAIL.COM` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER3 | `john@example.com`; `INFO@EXAMPLE.COM.`; `jane+rfp@example.com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER4 | `info@mail.example.com` (subdomain) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER5 | `john @ gmail.com`; `john@ gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER6 | `john @ example.com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER7 | `jane at gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER8 | `jane at gmail dot com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER9 | `jane [at] gmail.com`; `jane [at] gmail [dot] com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER10 | `jane (at) gmail (dot) com`; `jane(at)gmail(dot)com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER11 | `jane[at]gmail[.]com`; `jane (at) gmail (.) com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER12 | `jane @ gmail . com`; `jane @ gmail .com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER13 | `jane at the rate gmail dot com`; `jane at-the-rate gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER14 | `info (at) example (dot) com`; `info at example dot com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER15 | `mailto:jane@gmail.com` mid-text | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER16 | `mailto:jane@gmail.com?subject=RFP` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER17 | `mailto:info@example.com?subject=RFP` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER18 | `Email:jane@gmail.com`; `email—jane@gmail.com`; `jane@gmail.com—urgent`; `**jane@gmail.com**`; `_jane@gmail.com_`; `(jane@gmail.com)` | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER19 | `Email:info@example.com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| ER20 | `jane@gmail..com` (single label `gmail`); `jane@gmail.c`; `jane@-gmail.com` (≥ 2 labels, invalid) | `UNCERTAIN_EMAIL` | REJECTED | rejected |
| ER21 | `jane@gmail` | `UNCERTAIN_EMAIL` | REJECTED | rejected |
| ER22 | `jane @ gmail`; `jane [at] gmail` | `UNCERTAIN_EMAIL` | REJECTED | rejected |
| ER23 | `jane@`; `@gmail.com`; `jane [at]` | `FRAGMENT` | NORMALIZED | accepted |
| ER24 | `jane at gmail`; `meet at noon`; `met at Infosys. Then` | `[]` | NORMALIZED | accepted |
| ER25 | `available at eprocure.gov.in`; `published at eprocure.gov.in/tenders` | `[]` | NORMALIZED | accepted |
| ER26 | `visit us at www.example.com`; `Book now @ www.example.in` | `[]` | NORMALIZED | accepted |
| ER27 | `rate @ 12.50`; `units @ 12.50 each`; `rate @ rs 500`; `qty@12.50`; `admin@192.168.1.1` (E-4) | `[]` | NORMALIZED | accepted |
| ER28 | `@acme`; `follow @acme` | `[]` | NORMALIZED | accepted |
| ER29 | `Tenders at eprocure.gov.in` (§4.11 (a)) | `PERSONAL_EMAIL` | REJECTED | rejected |
| ER30 | full-width `ｊａｎｅ＠ｇｍａｉｌ．ｃｏｍ`; `jane` + U+200B + `@gmail.com` | `PERSONAL_EMAIL` | REJECTED | rejected |
| D1 | website `https://www.example.com` (`W = example.com`): text (a) `x@example.com`, text (b) `x@mail.example.com`, each a separate input — **Δ rev. 4 (precision)** | `BUSINESS_EMAIL` (each) | NORMALIZED | accepted |
| D2 | website `shop.example.com`, `x@example.com` (parent) | `PERSONAL_EMAIL` | REJECTED | rejected |
| D3 | website `shop.example.com`, `x@mail.example.com` (sibling) | `PERSONAL_EMAIL` | REJECTED | rejected |
| D4 | `x@example-group.com`; `x@example.co.in` | `PERSONAL_EMAIL` | REJECTED | rejected |
| D5 | `x@notexample.com`; `x@example.com.evil.io` | `PERSONAL_EMAIL` | REJECTED | rejected |
| D6 | (kinds only) website `not a url`, `info@example.com` | `PERSONAL_EMAIL` | — | — |
| D7 | (kinds only) website `null`, `info@example.com` | `PERSONAL_EMAIL` | — | — |
| MI1 | `info@example.com` and `jane@gmail.com` | `BUSINESS_EMAIL`, `PERSONAL_EMAIL` | REJECTED | rejected |
| MI2 | `info@example.com`, `sales@example.com` | `BUSINESS_EMAIL`, `BUSINESS_EMAIL` | NORMALIZED | accepted |
| MI3 | `info@example.com` and `98765 43210` | `BUSINESS_EMAIL`, `PHONE` | REJECTED | rejected |
| NM1 | `Contact Ms. Priya Rao` | `[]` | NORMALIZED | accepted |
| NM2 | `Contact Priya Rao at info@example.com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |

### 10.5a Email precedence (R4-F2, R4-F3)

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| EP1 | `Pre-bid meeting at 11.30am` (E-4 CG-2 time, CG-4) | `[]` | NORMALIZED | accepted |
| EP2 | `supply at Rs.500`; `supply at Rs.500 per unit`; `rate at ₹500` (E-4 CG-1) | `[]` | NORMALIZED | accepted |
| EP3 | `office at No.12` (A4, numeric final label); `Pre-bid meeting at 9.30a.m.`; `report at 10.30hrs` (CG-4) | `[]` | NORMALIZED | accepted |
| EP4 | `jane at gmail.com`; `jane at gmail dot com` (genuine word-at) | `PERSONAL_EMAIL` | REJECTED | rejected |
| EP5 | `jane @ example.com`; `sales @ example.com`; `info @ mail.example.com` (spaced business) | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| EP6 | `jane @ gmail.com`; `jane @ gmail . com`; `jane [at] gmail [dot] com`; `jane (at) gmail (dot) com` (spaced personal, K1-I3 forms) | `PERSONAL_EMAIL` | REJECTED | rejected |
| EP7 | `jane @ 163.com`; `jane @ 126.com`; `info @ 1und1.de`; `jane at 163.com` (valid prefix precedes guards) | `PERSONAL_EMAIL` | REJECTED | rejected |
| EP8 | website `https://www.163.com` (`W = 163.com`): `info @ 163.com` | `BUSINESS_EMAIL` | NORMALIZED | accepted |
| EP9 | `rate @ 12.50`; `units @ 12.50 each`; `rate @ rs 500`; `rate @ Rs.500`; `price @ 12.5k` (representative prices) | `[]` | NORMALIZED | accepted |
| EP10 | `jane @ 163`; `jane@163`; `jane @ 16.45`; `jane@1.2.3.4`; `jane @ 12.50` (invalid numeric domains) | `[]` | NORMALIZED | accepted |
| EP10a | `jane @ 163.456` (invalid numeric domain → no email kind; `163.456` = 6 digits → phone stretch, §4.11 (a)) | `PHONE` | REJECTED | rejected |
| EP11 | `jane@11.30am` (A1, no valid prefix, CG-2 time) | `[]` | NORMALIZED | accepted |
| EP12 | `jane@11.30am.com` (valid prefix; guards never reached) | `PERSONAL_EMAIL` | REJECTED | rejected |
| EP13 | `jane@gmail.c`; `jane @ gmail`; `jane at gmail.c` (fail-closed uncertainty retained) | `UNCERTAIN_EMAIL` | REJECTED | rejected |

### 10.6 `context.*` (each row run for each of `targetCustomer`, `geography`, `service`, in each provider family)

| # | Value | Expected |
|---|---|---|
| CX1 | `jane@gmail.com` (personal) | REJECTED by the existing CONTRACT-REC §3 screen; existing field / message |
| CX2 | `info@example.com` (business) | REJECTED by the existing screen; existing field / message |
| CX3 | `contact info [at] example [dot] com` (obfuscated business) | REJECTED by K1 (`containsAnyContactIdentifier`); `field = context.<name>`; context message |
| CX4 | `jane [at] gmail [dot] com` (obfuscated personal) | REJECTED by K1; `field = context.<name>` |
| CX5 | `call 98765 43210` (phone) | REJECTED by K1; `field = context.<name>` |
| CX6 | `mid-size manufacturers`; `Pune, India`; `mobile app development` | NORMALIZED |
| CX7 | `jane@`; `98765 XXXXX` (fragments) | NORMALIZED |
| CX8 | any REJECTED row: message does not echo the value; evidence statements are screened before `context.*` | holds |
| CX9 | `98765*43210`; `nine eight seven six five four three two one zero` (obfuscated phone) | REJECTED by K1; `field = context.<name>` |
| CX10 | `9876543210` (bare run, uncertain phone) | REJECTED by K1 |
| CX11 | `jane@gmail` (uncertain email; existing regex needs a dot → no match) | REJECTED by K1 |
| CX12 | `Call **9876543210** 24x7` | REJECTED by K1 |
| CX13 | `98765 43210 / 98XXX XXXXX` | REJECTED by K1 |
| CX14 | `info @ 163.com` (spaced; existing regex no match; `PERSONAL_EMAIL`) | REJECTED by K1 |
| CX15 | `Mumbai 400001` (§4.11 (a)) | REJECTED by K1 |
| CX16 | `meetings at 11.30am`; `supply at Rs.500` | NORMALIZED |

Intake column not applicable (intake carries no `context.*`).

### 10.7 Normalization

| # | Text in E | Kinds | Provider | Intake |
|---|---|---|---|---|
| N1 | Devanagari `९८७६५ ४३२१०` | `PHONE` | REJECTED | rejected |
| N2 | full-width `９８７６５４３２１０` | `PHONE` | REJECTED | rejected |
| N3 | NBSP / U+202F between groups `98765 43210` | `PHONE` | REJECTED | rejected |
| N4 | `nine eight seven six five four three two one zero`; `nine eight seven six five oh three two one zero` (`oh` between digit words → `0`) — **Δ rev. 4 (precision)** | `PHONE` | REJECTED | rejected |
| N5 | `tel:+15550100` mid-text | `PHONE` | REJECTED | rejected |
| N6 | `tel:` empty / `tel:123` | `FRAGMENT` / `[]` | NORMALIZED | accepted |
| N7 | for every row: the stored statement / `quote` equals the input after the existing trim, byte-for-byte otherwise — **Δ rev. 4 (precision)** | holds | holds | holds |

### 10.8 Lifecycle

| # | Case | Expected |
|---|---|---|
| L1 | **Provider rejection:** notice with 3 entries, 1 offending | REJECTED; `field = intentEvidence[i].evidence`; no event |
| L2 | AI platform on the **verified (pushed) path** (`normalizeVerifiedProviderResult`, valid proof): FIRST_PARTY clean item + PUBLISHED item with an offending statement — **Δ rev. 4 (precision)** | REJECTED whole result; `field = evidence[1].statement`; `reason = not-allowed` (on the pulled path the FIRST_PARTY item is rejected `authenticity` before K1) |
| L3 | batch [clean, offending, clean] | [NORMALIZED, REJECTED, NORMALIZED] |
| L4 | unattributed result with personal email in E | UNATTRIBUTED (K1 runs after the skip; nothing persisted) |
| L5 | **Intake:** clean event (one and several signals) | accepted; rows written |
| L6 | personal email in `signals[1].quote` of 3 | rejected; `field = signals[1].quote`; no lookup; no rows |
| L7 | phone / `jane@gmail` / obfuscated personal email in `quote` | rejected |
| L8 | single-signal form, personal email in `quote` | rejected; `field = quote` |
| L9 | business email at `website` domain in `quote` | accepted |
| L10 | email / phone-like `companyName`; digit runs in `website` / `sourceUrl` / `sourceLabel` | not rejected by K1 |
| L11 | prior rows for the same company after a rejected event | unchanged |
| L12 | non-normalizable `website`, personal email in `quote` / clean `quote` | rejected `signals[i].quote` (K1 first) / rejected `website` `invalid` (existing) |
| L13 | **Ingress (pushed result):** identifier in an evidence statement — **Δ rev. 4 (precision)** | rejected at P2 (provider path, provider `field`); existing generic 400; logs `externalId` / `field` / `reason` only; P3 intake not reached |
| L14 | **Transient pushed proof:** identifier only in `title`, `snippet` or `body` of a pushed notice / web result | NORMALIZED at P2; saved at P3 |
| L15 | identifier only in `authorization.basis` of a pushed FIRST_PARTY result | NORMALIZED; X1 re-derivation passes; saved |
| L16 | identifier only in `title` / `snippet` / `body` / `basis` of a **pulled** result | NORMALIZED (K1-I5 r3) |
| L17 | identifier in an evidence statement of a pushed result — **Δ rev. 4 (precision)** | REJECTED at P2; no event, so X1 is not reached (same-scope re-derivation is covered by L15) |
| L18 | transient values absent from outcomes, messages, logs, events, intake and saved rows | holds |
| L19 | **Persisted / displayed fields:** evidence statements (→ `source_quote`) and `context.*` (→ normalized event) are the only free-text fields screened; stored values equal the input after the existing trim — **Δ rev. 4 (precision)** | holds |
| L20 | **Equivalence** — **Δ rev. 4 (precision)**: (a) over every provider row in §10.1–§10.5a, a REJECTED `field` is a provider path (never `signals[i].quote`); (b) for every such row, a **non-provider** intake event with the same text as `quote` and the same `website` yields the Intake column; (c) Provider and Intake columns agree in every row | holds |
| L21 | test `intentSourceProviderContract.test.ts:578` — **Δ rev. 4 (precision)** | retained; retitled to state `body` is transient under K1-I5 r3 (pulled path; PG-3 is the pushed-path counterpart, L14); expectation NORMALIZED unchanged |
| L22 | privacy-key tests `intentSourceProviderContract.test.ts:536–576` | unchanged |
| L23 | existing suites (`intentSignal`, `intentSource`, provider contract, `providerAuthenticity`, worker intent intake, ingress) | pass unchanged except L21 title |

### 10.9 Coverage of ED-DEC-004 and AUDIT-R4

| Item | Rows |
|---|---|
| ED4-F1 masks must not hide a complete phone (R4-F1) | MK15, MK19–MK34; CX12, CX13; unchanged regressions MK1–MK14, MK16–MK18, IC8 |
| ED4-F2 email precedence vs time / price (R4-F2) | EP1–EP3, EP11, EP13; CX16; unchanged ER20–ER22, ER24–ER28 |
| ED4-F3 price guard vs complete spaced email (R4-F3) | EP4–EP10a, EP12; CX14; unchanged ER5, ER6, ER12, ER27 |
| ED4-F4 ordinary label words (R4-F4) | RL2, RL2b, RL17–RL25; unchanged RL1, RL3–RL16, HS1, HS4 |
| ED4-F5 mask binding (R4-F5) | MK1 (`98765 43XXX`), MK15 (`98765 43210 XXXXX`), MK21 (`98765 43210 / 98XXX XXXXX`), MK23 (`9876543210 XXX XXX`), MK29–MK31, MK33; §4.6.10 |
| R4-M3 precision | L2, L13, L17, L19, L20, L21, N4, N7, D1 |
| R4-M4 `context.*` classes | CX9–CX16 |
| R3-F1 … R3-F7 (carried regression) | MK1–MK18, IC1–IC10, EX1–EX6, HS1–HS4, ER1–ER30, RL1–RL16, SP1–SP17, UN1, CX1–CX8 |
| PG-1..PG-4 consequences | MK*, IC*, EX*, SP*, RL* (PG-1); CX* (PG-2); L14–L18 (PG-3); L5–L13, L20 (PG-4) |
| K1-R1..R3, K1-I1..I6 | ER*, EP*, D1–D7, MI1–MI3, NM1–NM2, L1–L4 |

---

## §11 IMPLEMENTATION AUTHORIZATION

**NONE.** This record is an engineering specification. It does not authorize implementation, test changes,
validation, provider / API calls, external research or deployment. Implementation requires the Product Owner to decide
PD-1 and a separate authorization. The next governance step is a fresh independent / read-only conformance audit of
this revision.

**Product Owner dependencies:** NONE (ED-DEC-004 §9).

**Open items carried forward (not corrected here; none needs a Product Owner decision while recorded open):** R4-M1
(edge `•••`), R3-M3 (`tel:` scheme word boundary, e.g. `Hotel:2026-10-02`), R3-M5 (English-only number / at / dot
words), R3-M6 (over-capture listed in §4.11 (a); open for EG-1 volume review), R3-M7 (`publication.publisher`
classification), R3-M9 (AUDIT-001 ED1-F1, ED1-F2, ED2-F4, ED3-F2, ED4-F4, ED6-F2, ED6-F3, ED7-F5 reconciliation; ED7-F2
and ED7-F4 addressed in substance by L20 / L21), §4.11 (c) open false negatives.

```text
Record type: ENGINEERING SPECIFICATION (rev. 5)

POLICY layer: K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4 — preserved, not changed
ENGINEERING layer: ED-DEC-001 as amended by ED-DEC-002, ED-DEC-003 and ED-DEC-004 (ED4-F1..F5)
AUDIT-R4 findings R4-F1..R4-F5: resolved in engineering
Product Owner dependencies: NONE

PD-1: PENDING
Implementation authorized: NO
Validation authorized: NO
Implementation performed: NO
Tests modified: NO
Dependencies changed: NO
Migrations / schemas changed: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO

Files created this round: 2 (ED-DEC-004, this record)
Existing records modified: 0
```
