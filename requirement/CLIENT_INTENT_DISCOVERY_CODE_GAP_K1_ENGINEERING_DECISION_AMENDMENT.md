# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING DECISION AMENDMENT (critical audit findings)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-002
**Date:** 2026-10-02
**Type:** Engineering decision amendment. Not a Product Owner decision, not an audit, **not an implementation
authorization**.
**Author role:** Engineering Decision Authority (K1 implementation semantics).
**Amends (without editing):** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001 ("ED-DEC-001",
`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION.md`).
**Responds to:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-CONFORMANCE-AUDIT-001 ("AUDIT-001",
`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_CONFORMANCE_AUDIT.md`), CRITICAL findings
only: ED2-F1, ED2-F2, ED4-F1, ED4-F2, ED6-F1.

> **PD-1: PENDING. Implementation authorized: NO.**
> Scope is limited to the five CRITICAL findings and the rule interactions they force (`#` roles, `x` precedence). No
> Product Owner decision is made, changed or reopened. Where ED-DEC-001 and this record differ, this record governs;
> every other part of ED-DEC-001 remains in force.

**Abbreviations:** REV-002 = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-002; PG-DEC, K1I-DEC, K1-DEC,
DEC-003, CONTRACT-REC, ADAPTER-REC as in prior records. `C` = detection copy (ED-3). `SEP` = separator set (ED-2).
`W = example.com` in examples unless stated.

---

## §1 Baseline (verified before writing)

| Check | Expected | Observed | Result |
|---|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | same | PASS |
| Staged files | 0 | 0 | PASS |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | same (empty) | PASS |
| Working tree outside untracked `requirement/` records | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` only | same | PASS |
| Target files / record IDs | — | did not exist | PASS |

| Record | sha256 | Matches recorded value |
|---|---|---|
| AUDIT-001 | `53c79c39a73fa522217a5805ddd73ec39a977741eedd4151ee7fe237f66d8b97` | Yes (prefix `53c79c39a73fa522` as reported at creation) |
| REV-002 | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` | Yes |
| ED-DEC-001 | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` | Yes |
| REV-PREP (rev. 1) | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` | Yes |
| K1-ESPEC (rev. 0) | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` | Yes |
| PG-DEC | `448370f18b9d093e62fbb9c3463dd79631a0a352eb399dc97a1151ceee3bac5d` | Yes |
| PG-PREP / PG-Q | `9ae7fca776c6dd50…ca9ff8d5d` / `ea6d8121bba3f926…f140d8a52` | Yes |
| K1I-DEC | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes |
| K1I-AUDIT / K1I-Q / K1I-PREP | `bb33d7a72b03f667…` / `5660c18e0347e94d…` / `73b60186fa621392…` | Yes |
| K1-DEC | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| K1-AUDIT / K1-Q / K1-PREP | `311150305494d152…` / `3984032033a14ff1…` / `4a12683500d6fc2e…` | Yes |
| PO-DEC (K1-B) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| REQ-001 | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |

**Baseline: PASS.**

## §2 Governing policy relied on (quoted; not changed)

| Ref | Text relied on |
|---|---|
| K1-R1 rule 1 | Emails and phones "in any form" are contact identifiers. |
| K1-I3 rule 1 (K1I-DEC §5) | "Any rendering that conveys a complete email address or phone number is a contact identifier … Examples: `jane [at] gmail [dot] com` … a phone number written in words or with inserted characters." |
| K1-I3 rule 2 | "A fragment from which no complete email address or phone number can be read (e.g. `jane@`, `@gmail.com`, a phone number with digits masked by the source) is not, by itself, a ground for K1-B rejection." |
| K1-I3 rule 3 | "Where it cannot be determined whether a rendering conveys a complete identifier (e.g. `jane@gmail`) … K1-I4 applies." |
| K1-I3 non-decision | "How obfuscated forms, fragments or completeness are detected (E-2, E-7)" is engineering. |
| K1-I4 (K1I-DEC §6) | Plausible and not established otherwise → personal → `REJECTED`. "A string the system establishes is not a contact identifier (for example, because it is evidently a date, price, amount or labelled reference number) is not uncertain." "What counts as 'plausibly' and 'established' is an engineering specification matter." "The rule applies only to plausible identifiers, not to every number." |
| PG-1 (PG-DEC §3) | "Formatting does not decide the question either way. The presence or absence of `+`, separators, parentheses, labels or a `tel:` reference neither makes a string a phone number nor stops it being one." Extension with a number → base number decides; extension by itself (e.g. `ext. 204`, `extension 567`, "with no base number in it") → fragment. Masked / withheld / truncated digits → fragment. Consequences 1–3. |

## §3 ED-DEC-002-A — Masked numbers (AUDIT-001 ED2-F1)

**Old (REV-002 §4.5; ED-DEC-001 ED-2 item 8).** A run is `+`? digit (≤ 3 `SEP`, digit)*. Mask characters are neither
digits nor `SEP`, so a run never contains one; the "masked run" rule is unreachable. A masked rendering is split at
the mask and each visible part judged alone: `98765 43XXX` → run `98765 43` (7) → `PHONE` → REJECTED.

**Corrected (REV-003).**
1. **Mask characters** `M = { x, *, • }` in `C` (`x` covers `X` after ED-3 lowercasing). `x` is a mask character only
   when its maximal letter token consists solely of `x` (`43xxx` yes; `xxl`, `box` no).
2. **Mask sequence** = maximal sequence of mask characters with no other character between them.
3. **Run symbols.** A run is built from *symbols* = digits **and qualifying mask sequences**:
   `run = '+'? S (SEP{0,3} S)*`, with at least one digit. A mask sequence **qualifies** as a run symbol when:
   - its length is ≥ 2 and it is within ≤ 3 `SEP` characters of a digit of the run, or of another qualifying mask
     sequence of the run (chained; `98765 43XXX`, `+91 98765 XXXXX`, `XXX-XX-0100`, `98•••43210`); or
   - its length is 1, it is `*` or `•`, and it is glued (no `SEP`) to digits on both sides (`98765*43210`).
   A single `x` glued between digits is governed by ED-DEC-002-B rule 6. A single mask character in any other position
   is not a run symbol (it ends the run): e.g. a footnote `9876543210*` or a bullet `• 9876543210`.
4. **Classification.** A run containing ≥ 1 qualifying mask sequence → **`FRAGMENT`** as a whole:
   - mask characters are **never stripped**; the visible digits are **never** re-evaluated alone, as a sub-run, or by
     the window rule;
   - an extension attached to a masked run does not change this (`98765 43XXX ext 204` → `FRAGMENT`);
   - a sequence of mask characters with no digit is not a run and has no kind (`XXXXX-XXXXX` → `[]`).

**Policy basis.** K1-I3 rule 2 and PG-1 band 3 (masked by the source → fragment, no ground). The correction makes the
existing rule (REV-PREP E-4 step 4: masks "in digit positions" → fragment) reachable. It decides no new category.

**Why engineering, not policy.** It changes only the recognition grammar so that the decided fragment rule is applied
as written. Which strings count as masked was already decided.

**Expected tests.** `98765 43XXX`, `98765 43***`, `98765 43•••`, `+91 98765 XXXXX`, `XXX-XX-0100`, `98765*43210` →
`FRAGMENT`, NORMALIZED / accepted; `98765 43XXX ext 204` → `FRAGMENT`; `XXXXX-XXXXX` → `[]`; `ext. 2XX` → `FRAGMENT`
(ED-DEC-002-B rule 4); `Call 9876543210*` → `PHONE`, REJECTED.

**Affected REV-002 rows.** P16 (kinds now reachable as written: `FRAGMENT`). No other row changes.

## §4 ED-DEC-002-B — Extension markers and `#` (AUDIT-001 ED2-F2; also ED2-F3, ED2-F5)

**Old.** Marker attaches when "followed by 1–6 digits"; a word marker with digits and no base run → `FRAGMENT` with no
digit bound, so `extension 5550100` → `FRAGMENT` (REV-002 P4). `#` was simultaneously an extension marker, "ignored
punctuation" (ED-DEC-001 ED-2 item 7) and a generic reference label (ED-4 item 5). Precedence of `x` as extension vs
mask was undefined (`5550100x204`). Marker word boundaries were unstated.

**Corrected (REV-003).** Evaluated on `C` after exclusion spans (ED-4, as amended) and before plausibility.

1. **Markers:** `ext`, `extn`, `extension` (each a whole word, optionally followed by `.` and / or `:`); `x` (a letter
   token consisting of the single letter `x`); `#`.
2. **Extension context.** A marker is an extension marker **only** when both hold:
   - (a) a **base run** ends immediately before it, separated by ≤ 3 characters from { whitespace, `,`, `-`, `(` } or
     by nothing (glued); and
   - (b) after the marker (and optional `.` / `:`) and ≤ 1 whitespace character, there is a **contiguous digit group
     of 1–6 digits** not immediately followed by another digit.
   The extension digits are removed from the count; the base run is judged alone (PG-1 (c)). Digit groups after the
   extension group are evaluated as separate runs.
3. **Word marker with no base run.** When condition (a) fails for `ext` / `extn` / `extension`:
   - form the run that starts at the first digit after the marker (full ED-2 grammar, incl. separators and masks);
   - if that run is masked → `FRAGMENT` (ED-DEC-002-A);
   - if its digit count is `< L_min` (1–5 digits) → **extension alone → `FRAGMENT`** (`ext 204`, `extension 567`);
   - if its digit count is `≥ L_min` → the marker word is treated as an ordinary label with no effect, and the run is
     evaluated normally (plausibility, exclusions): `extension 5550100` → `PHONE`.
4. **Masked extension alone.** `ext. 2XX` (masked group after a word marker, no base run) → `FRAGMENT`.
5. **`#` — one role per parse state.** In order:
   1. inside a **specific-label phrase** recognized by ED-4 (e.g. `Order #12345678`, `RFP No. 2026/…`): part of that
      phrase only (exclusion; step 6 of the pipeline);
   2. otherwise, if extension context (rule 2) holds: **extension marker** (`5550100#204`, `5550100 #204`);
   3. otherwise: **ordinary punctuation**, which ends a run and has no other effect (`#9876543210` → run `9876543210`;
      `5550100 #update` → base `5550100`).
   `#` is never a generic label (ED-DEC-002-C) and never a mask or separator.
6. **Single `x` glued between digits** (`5550100x204`, `98765 4x210`). This rendering is both a valid extension
   notation and a valid one-character mask; the text cannot establish which. Per **K1-I3 rule 3** ("cannot be
   determined whether a rendering conveys a complete identifier … K1-I4 applies") and **K1-I4** (plausible and not
   established otherwise → personal):
   - if extension context (rule 2) holds, the extension reading is applied: base judged alone; a plausible base →
     `PHONE` → REJECTED (`5550100x204` → base 7 → REJECTED; `98765 4x210` → base 6 → REJECTED);
   - otherwise (e.g. more than 6 digits after the `x`, as in `98x76543210`) the `x` is a mask → `FRAGMENT`.
   Unambiguous masks (`*`, `•`, mask sequences of length ≥ 2) are never read as extensions.
7. **`x` with whitespace** (`5550100 x204`, `5550100 x 204`): extension marker when rule 2 holds (no mask reading:
   a single `x` not glued on both sides is not a mask symbol).

**Policy basis.** PG-1 (c) (extension with number → base decides; extension by itself → fragment, examples "with no
base number in it"); PG-1 "labels … neither makes a string a phone number nor stops it being one"; K1-I3 rule 3 and
K1-I4 for the genuinely ambiguous single-`x` case.

**Why engineering, not policy.** The amendment fixes recognition grammar and parse precedence. It does not change what
an extension, a fragment or a phone is. The single-`x` case is resolved by the already-decided K1-I3 rule 3 / K1-I4
tie-break, not by a new rule. **Transparency note:** the requested goal "a masked candidate must not become a valid
phone merely because the unmasked digits satisfy the threshold" is met for every unambiguous mask; for a single glued
`x` in extension position the decided K1-I4 tie-break, not mask treatment, governs, and such strings are REJECTED.

**Expected tests.** `5550100 ext 204`, `5550100 extension 204`, `5550100 x204`, `5550100#204`, `5550100x204`,
`extension 5550100`, `5550100 #update` → `PHONE`, REJECTED; `ext 204`, `extension 567` → `FRAGMENT`, accepted;
`98x76543210` → `FRAGMENT`, accepted; `98765 4x210` → `PHONE`, REJECTED (K1-I4 tie-break); `next 9876543210` (no
whole-word marker) → `PHONE`, REJECTED.

**Affected REV-002 rows.** P4 (`extension 5550100`: NORMALIZED → **REJECTED**); P32 (`#12345678` alone: NORMALIZED →
**REJECTED**); P3, P33 unchanged.

## §5 ED-DEC-002-C — Generic labels (AUDIT-001 ED4-F1; consequentially ED4-F3, ED3-F3 `№`)

**Old (ED-DEC-001 ED-4 item 5).** Generic labels `no`, `no.`, `number`, `#`, `№`, `id` established a reference unless a
contact word preceded within "≤ 2 words": `No. 9876543210`, `ID 9876543210`, `#9876543210` → excluded → NORMALIZED.

**Corrected (REV-003).**
1. Generic labels **never** establish an exclusion by themselves. The generic-label exclusion and the contact-word
   window rule are **removed**.
2. `no`, `no.`, `number`, `#`, `id` remain only as **connectors inside a specific-label phrase**:
   `⟨specific label⟩ (\s|[.:\-#/]){0,3} (no\.?|number|#|id)? (\s|[.:\-#/]){0,3} ⟨token⟩`
   (e.g. `Tender No. 2026/IT/0457`, `Tender ID 12345678`, `Invoice Number 4471`, `Order #12345678`). The specific
   label establishes the reference (K1-I4 "labelled reference number"); the connector adds nothing.
3. Contact labels (`phone`, `tel`, `mobile`, `call`, `whatsapp`, `fax`, …) are **not inputs** to exclusion or to
   plausibility. They neither create nor block an exclusion; a labelled phone is classified like any other run (PG-1:
   labels never decide). Because no generic-label exclusion remains, `Mobile No. 9876543210` and `Call 9876543210` are
   `PHONE` without any contact-word rule.
4. `№` is dropped from all lists (NFKC maps it to `No`; AUDIT-001 ED3-F3).
5. The specific-label list of ED-DEC-001 ED-4 item 5 is otherwise unchanged.

**Policy basis.** K1-I4 ("established … labelled reference number"; "applies only to plausible identifiers"); PG-1
(labels never decide; consequence 3: absence of formatting never establishes non-phone).

**Why engineering, not policy.** It removes an engineering exclusion that did not satisfy the decided "established"
test. No category is created.

**Expected tests.** `No. 9876543210`, `ID 9876543210`, `#9876543210`, `number 9876543210`, `Mobile No. 9876543210`,
`Call 9876543210` → `PHONE`, REJECTED; `Tender No. 2026/IT/0457`, `Tender ID 12345678`, `Order #12345678`, `PIN 411001`
→ `[]`, accepted.

**Affected REV-002 rows.** P32 (as §4); P10, P25, P33 unchanged in result; P25's title no longer refers to a
contact-word rule.

## §6 ED-DEC-002-D — Unit recognition (AUDIT-001 ED4-F2)

**Old (ED-DEC-001 ED-4 items 2–3).** Any `RANGE` token "immediately followed (≤ 1 space)" by a listed unit was excluded;
the list included ordinary words and abbreviations (`in`, `ms`, `hr`, `hrs`, `min`, `mins`, `sec`, `secs`, `day(s)`,
`week(s)`, `month(s)`, `year(s)`, `yr(s)`, `units`, `pieces`, `nos`, `ha`, single letters `m`, `l`, `g`, `t`, `w`) and
amount units `k`, `m`, `mn`, `cr`, `bn` with a space allowed. `Call 9876543210 in office hours` → excluded.

**Corrected (REV-003).** A unit or amount-unit exclusion applies only when **all** hold:
1. **Unambiguous unit token.** The token is in one of two closed lists:
   - **Spaced-or-glued units** (≤ 1 whitespace allowed): `mm`, `cm`, `km`, `inch`, `inches`, `ft`, `feet`, `sq ft`,
     `sq. ft.`, `sqft`, `sq m`, `sqm`, `acre`, `acres`, `hectare`, `hectares`, `mg`, `kg`, `ton`, `tons`, `tonne`,
     `tonnes`, `lb`, `lbs`, `ml`, `ltr`, `litre`, `litres`, `liter`, `liters`, `kl`, `kb`, `mb`, `gb`, `tb`, `kw`,
     `mw`, `kwh`, `mwh`, `kmph`, `km/h`, `mph`, `pcs`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`,
     `years`, and amount units `lakh`, `lakhs`, `lac`, `lacs`, `crore`, `crores`, `million`, `billion`, `thousand`,
     and `%`.
   - **Glued-only units** (no whitespace between number and unit): `m`, `l`, `g`, `t`, `w`, `k`, `mn`, `bn`, `cr`
     (e.g. `50k`, `5m`, `3cr`).
   Removed entirely: `in`, `ms`, `hr`, `hrs`, `min`, `mins`, `sec`, `secs`, `day`, `week`, `month`, `year`, `yr`,
   `yrs`, `units`, `pieces`, `nos`, `ha`.
2. **Word boundary.** The unit token is followed by a non-letter (or end of text).
3. **Structural membership.** The digits excluded are exactly **one quantity token** immediately before the unit:
   `NUM` or `RANGE` as defined in ED-DEC-001 ED-4 (`\d+(?:[.,]\d+)*`, optional `-`/`–`/`—`/`to` range), with **no
   internal whitespace or other `SEP`** except the decimal point / grouping commas / range connector. If the ED-2 run
   containing those digits has any other group (e.g. `98765 43210 kg`, `+91 98765 43210 kg`), the unit does **not**
   exclude it; the run is evaluated normally.
4. Currency-symbol / currency-code exclusions **before** the number are unchanged (not part of this defect).

**Policy basis.** K1-I4 ("established … evidently a … amount"); PG-1 consequence 1 (local, national, international
numbers recognized in any rendering) and consequence 3.

**Why engineering, not policy.** It narrows an engineering exclusion to content that actually establishes a quantity.
It does not decide what a phone is.

**Expected tests.** `Call 9876543210 in office hours`, `9876543210 hr`, `9876543210 Ms. Rao`, `98765 43210 kg` →
`PHONE`, REJECTED; `120000 sq ft`, `250000 kg`, `1500000 litres`, `75 lakh`, `50k` → `[]`, accepted; `2026-10-02 10:30`
→ `[]`, accepted; `Rs 1250000`, `₹50,00,000` → `[]`, accepted; `We serve 1200 students across 3 campuses` → `[]`,
accepted.

**Affected REV-002 rows.** P9 (`3.5 crore` unchanged), P30 (`5000 kg`, `120000 sq ft`, `250 GB` unchanged in result).
No row result changes; new rows added.

## §7 ED-DEC-002-E — False email construction (AUDIT-001 ED6-F1)

**Old (REV-002 §4.4 step 2).** `⟨AT⟩` included the word `at` and "`@` with optional surrounding whitespace"; `⟨DOT⟩`
included plain `.`; the word `at` sufficed with one `⟨DOT⟩`. `documents available at eprocure.gov.in` →
`available@eprocure.gov.in` → `PERSONAL_EMAIL`; `rate @ 12.50` → `rate@12.50`, and `normalizeDomain('12.50')` →
`12.0.0.50` (non-null) → `PERSONAL_EMAIL`. Spaced residues (`jane @ gmail`) were collapsed to `jane@gmail` →
`UNCERTAIN_EMAIL`.

**Corrected (REV-003).**
1. **Valid email domain (`EMAIL_DOMAIN`)** — required by every email form, checked on the candidate **before**
   `normalizeDomain` is called:
   - ≥ 2 labels separated by `.`; each label 1–63 characters of `[\p{L}\p{N}-]`, not starting or ending with `-`;
   - the final label is ≥ 2 characters and consists only of letters (`\p{L}`), or is `xn--` followed by
     `[a-z0-9-]+`;
   - total length ≤ 253.
   A numeric final label is invalid, so IPv4-like strings (`12.50`, `192.168.1.1`) are never email domains and
   `normalizeDomain`'s IPv4 parsing is never reached for them.
2. **Email-syntax signal.** A candidate requires an actual **local part** (`[\p{L}\p{N}._%+'-]+`, not starting or
   ending with `.`) joined to an `EMAIL_DOMAIN` by exactly one of these at-signals:
   - (E-a) **contiguous `@`**: `local@domain` (the existing pattern source, with ED-3 / E-3 edge trimming);
   - (E-b) **literal `@` with inserted whitespace**: `local\s{1,3}@\s{0,3}domain` or `local\s{0,3}@\s{1,3}domain`;
   - (E-c) **bracketed at-token**: `local\s*[\[({<]at[\])}>]\s*domain′`;
   - (E-d) **word `at`**: `local\s+at\s+label(\s*⟨DOTW⟩\s*label)+`, where `⟨DOTW⟩` is the word `dot` or a bracketed
     `[dot]` / `(dot)` / `{dot}` / `<dot>`. **A literal `.` is not allowed anywhere in an (E-d) domain.**
   In (E-c), `domain′` may use literal `.` or any `⟨DOTW⟩`. In every form the reconstructed domain must satisfy
   `EMAIL_DOMAIN`.
3. **No manufacturing.** Whitespace is never removed except as the explicit (E-b) / (E-c) / (E-d) inserted-character
   renderings, each of which still requires a real local part, a real at-signal and a valid domain. The word `at`
   followed by an ordinary dotted domain (`available at eprocure.gov.in`) is **not** an email candidate.
4. **Residues (contiguous only).** `local@label` (contiguous, single alphabetic label, no dot) → `UNCERTAIN_EMAIL`
   (K1-I3 rule 3 example `jane@gmail`); `local@` → `FRAGMENT`; `@label.label` → `FRAGMENT`; `@label` → nothing;
   contiguous `local@X` with `X` not a valid domain and not a single alphabetic label (e.g. `qty@12.50`) → nothing.
   **Spaced residues** (`jane @ gmail`, `rate @ rs`) → nothing.
5. **Classification unchanged.** Once a candidate exists, `D = normalizeDomain(domain)` and K1-I1 / K1-I2
   classification apply exactly as before (`D === null` → `UNCERTAIN_EMAIL`).
6. `mailto:` addresses use the same `EMAIL_DOMAIN` validation.

**Policy basis.** K1-I3 rule 1 (complete identifiers in any rendering, incl. `jane [at] gmail [dot] com`,
`info (at) acme (dot) com`); K1-I3 rule 3 (`jane@gmail` → K1-I4); K1-I4 ("applies only to plausible identifiers, not
to every number"; plausibility is engineering); K1-R1 / K1-I1 / K1-I2 (classification).

**Why engineering, not policy.** The correction defines what an email *candidate* is (an engineering detection
matter, K1-I3 non-decision). Classification of a genuine candidate is unchanged.

**Contradictions recorded, not hidden.**
- **Spaced literal `@` (E-b).** The instruction for this round asked that spaces around `@` not be removed and that a
  candidate be "contiguous". `john @ example.com` conveys a complete address with inserted whitespace, which K1-I3
  rule 1 places in scope. Dropping it would narrow decided policy. (E-b) therefore keeps it, but only with a real
  local part and an `EMAIL_DOMAIN`, which is what defeats `rate @ 12.50`. Residual: `Book now @ www.example.in` (valid
  local-part token, literal `@`, valid domain) is still a candidate (`now@example.in`) and is classified by domain;
  the text cannot establish it is not an address (K1-I4).
- **Word `at` with a dotted domain (E-d).** `jane at gmail.com` also conveys a complete address, but its form is
  identical to ordinary prose (`available at eprocure.gov.in`). Under K1-I4's delegation of "plausibly" to
  engineering, this form is treated as **not plausibly** an address and is not detected. This is recorded as a
  **documented recognition limitation** in the same class as the limitations REV-PREP E-5 already lists
  (renderings in scope that the detector may miss). The policy target set is unchanged.
- **Spaced residues.** `jane @ gmail` is no longer `UNCERTAIN_EMAIL` (REV-PREP E-7 step 5 engineering rule narrowed);
  contiguous `jane@gmail` (the K1-I3 rule 3 example) is unchanged.

**Expected tests.** `available at eprocure.gov.in`, `rate @ 12.50`, `units @ 12.50 each`, `qty@12.50`,
`admin@192.168.1.1`, `jane @ gmail` → `[]`, accepted; `john@example.com`, `john @ example.com`,
`john [at] example [dot] com`, `info@mail.example.com` → `BUSINESS_EMAIL`, accepted; `john@gmail.com`,
`john @ gmail.com`, `john at gmail dot com`, `jane [at] gmail.com` → `PERSONAL_EMAIL`, REJECTED; `jane@gmail` →
`UNCERTAIN_EMAIL`, REJECTED; `jane at gmail.com` → `[]`, accepted (documented limitation); `Book now @ www.example.in`
→ `PERSONAL_EMAIL`, REJECTED (residual).

**Affected REV-002 rows.** M7, M8, M10, M14 unchanged in result; M16 (`'not a url'` website) unchanged; new rows added.

## §8 Effects on other AUDIT-001 findings, and items left open

| AUDIT-001 finding | Status after this amendment |
|---|---|
| ED2-F1, ED2-F2, ED4-F1, ED4-F2, ED6-F1 (CRITICAL) | **Corrected** (§3–§7) |
| ED2-F3 (`#` roles) | Resolved by §4 rule 5 (consequential) |
| ED2-F5 (`x` precedence; marker word boundaries) | Resolved by §4 rules 1, 6, 7 (consequential) |
| ED4-F3 (contact-word window) | Moot: rule removed by §5 |
| ED3-F3 (`№`) | `№` dropped by §5; `m²` → `m2` residual remains (glued `m` + digit has no word boundary) |
| ED6-F4 (`FRAGMENT` unreachable) | Resolved by §3 |
| ED7-F3 (P4 / P16 / P32 expectations) | Updated in REV-003 |
| ED1-F1, ED1-F2, ED2-F4, ED3-F1, ED3-F2, ED4-F4, ED4-F5, ED6-F2, ED6-F3, ED7-F1 (except rows added for §3–§7), ED7-F2, ED7-F4, ED7-F5 | **Open — not in scope of this amendment.** Carried forward unchanged. |

**New observation (not corrected; scope).** PG-2 states the net effect "no email address (business or personal) and no
phone number may appear in a `context.*` value". The existing CONTRACT-REC §3 screen catches only contiguous emails
(`PERSONAL_EMAIL_PATTERN`), and K1-B rejects only personal / uncertain emails. An **obfuscated business email** in
`context.*` (e.g. `info (at) example (dot) com`, or `john @ example.com`) therefore passes both screens under REV-002
and REV-003. This predates this amendment (it was latent in REV-002) and was not raised by AUDIT-001. It needs an
engineering correction (screen `context.*` for any email kind) in a later amendment; it requires no Product Owner
decision because PG-2 already states the intended net effect.

## §9 Governance status

```text
Record type: ENGINEERING DECISION AMENDMENT (ED-DEC-002)

ED-DEC-002-A masked numbers: CORRECTED (mask sequences are run symbols; masked run → FRAGMENT, no stripping)
ED-DEC-002-B extensions / #: CORRECTED (extension context; word marker + ≥ L_min digits → run; # single role per state;
                             single glued x → K1-I3 rule 3 / K1-I4 tie-break)
ED-DEC-002-C generic labels: CORRECTED (no generic-label exclusion; connectors only after specific labels)
ED-DEC-002-D units:          CORRECTED (closed unambiguous list; glued-only short units; single quantity token)
ED-DEC-002-E email:          CORRECTED (EMAIL_DOMAIN; explicit at-signals; word-at needs word / bracketed dots)
Defects that could not be corrected without policy change: NONE
Contradictions recorded: spaced literal @ kept (K1-I3 rule 1); word-at + dotted domain = documented limitation;
                         single glued x resolved by K1-I3 rule 3 / K1-I4
New observation: obfuscated business email in context.* (PG-2 net effect) — open

Product Owner decisions changed: NO
PD-1: PENDING
Implementation authorized: NO
Implementation performed: NO
Validation performed: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO
```
