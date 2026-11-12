# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING DECISION (ED-1 .. ED-8)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001
**Date:** 2026-10-02
**Type:** Engineering decision record. Not a Product Owner decision, not an audit, not an implementation authorization.
**Author role:** Engineering Decision Authority (K1 implementation semantics).
**Resolves:** the eight items listed in CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-PREP-001 §9
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md`, "REV-PREP").

> **PD-1 remains PENDING. This record does not authorize implementation.**
> It decides engineering choices **inside** the decided policy. It makes no Product Owner decision, reopens none, and
> creates no Product Owner question.

**Abbreviations:** as in REV-PREP (PG-DEC, K1I-DEC, K1-DEC, PO-DEC, CONTRACT-REC, ADAPTER-REC, REQ-001, OQ-DEC,
DEC-003). `E-n` = REV-PREP §5 area n. `W` = `normalizeDomain(website)`.

**Labels used per decision:** **FACT** (verified from records or code, read-only) · **CONSTRAINT** (imposed by decided
policy or by REV-PREP SPEC) · **CHOICE** (the engineering decision made here).

---

## §1 Baseline verification (performed before writing)

| Check | Recorded (REV-PREP §2) | Observed | Result |
|---|---|---|---|
| Branch | `feature/client-intent-discovery-complete` | same | PASS |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | same | PASS |
| Staged files | 0 | 0 | PASS |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | same (empty) | PASS |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`; untracked records under `requirement/` only | same | PASS |
| Target files / record ID | — | did not exist before this round | PASS |

### Governing-record hashes (sha256, verified)

| Record | File | sha256 | Matches REV-PREP §2 |
|---|---|---|---|
| REV-PREP (latest engineering preparation) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md` | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` | n/a (latest; first recorded here) |
| PG-DEC | `…_K1_POLICY_GAPS_PRODUCT_OWNER_DECISION.md` | `448370f18b9d093e62fbb9c3463dd79631a0a352eb399dc97a1151ceee3bac5d` | Yes |
| PG-PREP | `…_K1_POLICY_GAPS_PO_DECISION_PREPARATION.md` | `9ae7fca776c6dd50edb6ca90fc41e6de89e4a9d7ec70b57a50e5662ca9ff8d5d` | Yes |
| PG-Q | `…_K1_POLICY_GAPS_PO_QUESTIONNAIRE.md` | `ea6d8121bba3f926ec3d11f2677d48f9ede37873bdaf7d3ef45dc8cf140d8a52` | Yes |
| K1-ESPEC (rev. 0) | `…_K1_ENGINEERING_SPECIFICATION_PREPARATION.md` | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` | Yes |
| K1I-DEC | `…_K1_IMPLEMENTATION_SEMANTICS_PRODUCT_OWNER_DECISION.md` | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes |
| K1I-AUDIT | `…_K1_IMPLEMENTATION_SEMANTICS_CONFORMANCE_AUDIT.md` | `bb33d7a72b03f6674ed8019951c4b2393d5c31e96c107ebef1616de9b2f3ef92` | Yes |
| K1I-Q | `…_K1_IMPLEMENTATION_SEMANTICS_PO_QUESTIONNAIRE.md` | `5660c18e0347e94de7320940ded55025ef9db92e256a2878b129a220a59324e4` | Yes |
| K1I-PREP | `…_K1_IMPLEMENTATION_SEMANTICS_PO_DECISION_PREPARATION.md` | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` | Yes |
| K1-DEC | `…_K1_RESIDUAL_PRODUCT_OWNER_DECISION.md` | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| K1-AUDIT | `…_K1_RESIDUAL_DECISION_CONFORMANCE_AUDIT.md` | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` | Yes |
| K1-Q | `…_K1_RESIDUAL_PO_QUESTIONNAIRE.md` | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` | Yes |
| K1-PREP | `…_K1_RESIDUAL_PO_DECISION_PREPARATION.md` | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` | Yes |
| PO-DEC (K1-B) | `…_CODE_GAP_PRODUCT_OWNER_DECISION.md` | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 | `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| READINESS-001 | `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |

All files are under `requirement/`. **Baseline: PASS.**

## §2 Code inspected (read-only)

| Location | What was confirmed |
|---|---|
| `packages/core-research/src/intentSignal.ts:91–96` | `PERSONAL_EMAIL_PATTERN = /[^\s@/]+@[^\s@/]+\.[^\s@/]+/`; `isPersonalContactIdentifier` = pattern **or** leading `mailto:` / `tel:` / `sms:` |
| `intentSignal.ts:257–345` | `toIntentSignalInput` order: system-assigned keys → kind → field → required strings → `sourceUrl` → `observedAt` → authorization evidence → return. `quote` is the value stored as `signal` and `sourceQuote`. |
| `intentSignal.ts:387–437` | `toIntentIntakeInput` re-prefixes every per-entry error except `searchId` / `companyName` / `website` as `signals[i].<field>`; any error aborts the whole call. |
| `intentSourceProviderContract.ts:270–303` | `FREE_TEXT_KEYS = title, snippet, body, statement, evidence, basis`; every other string key (incl. `context.*`) goes through `checkIdentifier` (CONTRACT-REC §3 screen). |
| `intentSourceProviderContract.ts:387–575` | Each family's `prepare*` performs verbatim / per-item checks, then the `UNATTRIBUTED` skip, then builds `raw`. Evidence paths: `intentEvidence.evidence` (web), `evidence[i].statement` (AI platform), `intentEvidence[i].evidence` (notice). |
| `intentSourceProviderContract.ts:743–781` | `normalizeWith` converts any `IntentSignalValidationError` thrown in `prepare` / `normalizeIntentEvent` to `REJECTED` with that error's `field` / `reason` / `message`. |
| `packages/core-discovery/src/normalize.ts:15–35` | `normalizeDomain`: trim, add scheme, `new URL().hostname` (IDN → A-label), lower-case, strip trailing `.` and leading `www.`; `null` when unparsable or empty. Exported from `@acos/core-discovery` (`index.ts:27`), already a `core-research` dependency. |
| `apps/worker/src/searchWorker/intentIntake.ts:93–115` | `toIntentIntakeInput` (`:99`) → X1 (`:101`) → `searches.getById` (`:104`) → `normalizeCandidate` → `website` `invalid` rejection when the website has no usable domain (`:107–113`). |
| `packages/core-research/src/intentSourceProviderContract.test.ts:578–582` | Test titled "a free-text evidence field may quote a business contact (known limitation: free text is not PII-scanned)": appends `procurement@college.example.edu` to a notice **`body`**; expects `NORMALIZED`. |
| Existing tests | `intentSignal.test.ts` (`toIntentSignalInput` / `toIntentIntakeInput` describes); `intentSourceProviderContract.test.ts` (privacy describes `:536–583`, X1 helper `:676`); `apps/worker/src/searchWorker/worker.test.ts:2342` ("intent intake", in-memory deps, `intakeEvent` helper); `apps/web/src/server/intentIngressIntake.test.ts`. |
| `packages/core-research/package.json` | Dependencies: no phone / email parsing library present. |

---

## §3 Decisions

### ED-1 — Minimum plausible-phone digit count (`L_min`)

**FACT.**
- PG-1 (a): a local number without area or trunk code is a phone (example `555-0100`, 7 base digits). PG-1: formatting
  never decides, so the unformatted `5550100` must be treated identically.
- PG-DEC §3 "Engineering-only" delegates "digit counting; length bounds of the 'plausibly' envelope" to engineering.
  PG-DEC §3 consequence 1: local and national numbers must be recognized in any rendering.
- The records and fixtures place the product in an Indian market context (`+91` examples, `₹`, `lakh`, `crore`, `Pune,
  India` in REV-PREP E-4 / E-7 / E-13 and PG-PREP).
- The plausibility test applies equally to formatted and unformatted runs (REV-PREP E-4), so `L_min` also bounds
  recognition of formatted local numbers.

**CONSTRAINT.** `L_min ∈ {5, 6, 7}`; `L_min ≤ 7` (PG-1 (a)); K1-I4 fail-closed; the `core-payments` 8–15 validator is
not the governing rule.

**Engineering background (stated, not researched in this round, not a Product Owner definition).** Fixed-line numbering
in the evident target market writes local subscriber numbers of 6 to 8 digits after an omitted area code. A 6-digit
local number written without its area code is therefore a real category-(a) rendering.

**CHOICE: `L_min = 6`.** Also confirmed: **`L_max = 15`** (REV-PREP E-4 engineering proposal adopted unchanged).

**Rationale.**
- **Risk asymmetry.** If the background assumption is wrong, `L_min = 6` only over-rejects (a volume cost the Product
  Owner accepted, PG-DEC §3 "K1-I4 delegation confirmed"). If `L_min = 7` and 6-digit local numbers exist, real phones
  pass unscreened, which breaches PG-1 consequence 1 and K1-I4's fail-closed rule. The safer error is chosen.
- **Plausibility floor.** 5-digit runs are not plausibly a complete callable number in the target-market numbering
  context, and they are dominated by ordinary quantities (counts, postal-style codes of other countries, budgets
  without grouping). `L_min = 5` would add those rejections without covering any additional category-(a) number that
  this record can identify.

**Affected examples (result under `L_min = 6`, assuming no ED-4 exclusion applies).**

| Text in a screened field | Base digits | Result |
|---|---|---|
| `555-0100`, `5550100` | 7 | phone → REJECTED |
| `23 4567`, `234567` (6-digit local) | 6 | phone → REJECTED |
| `Pune 411001` (unlabelled 6-digit postal code) | 6 | phone → REJECTED (cannot be established otherwise; see ED-4 residual) |
| `PIN 411001`, `Pincode: 411001` | — | excluded (labelled reference, ED-4) → no ground |
| `12000 users`, `50000` | 5 | no ground |
| `1200 students` | 4 | no ground |
| 16-digit single undelimited group | 16 | no ground (> `L_max`) |

**Rejected alternatives.**
- `L_min = 7`: matches the PG-1 example exactly and avoids unlabelled 6-digit postal-code rejections, but leaves 6-digit
  local numbers unrecognized, contrary to PG-1 consequence 1 and K1-I4's fail-closed direction.
- `L_min = 5`: maximal fail-closed reach, but rejects a large class of ordinary 5-digit quantities without identifying
  any additional category-(a) number; this goes beyond "plausibly".

### ED-2 — Phone separator handling

**FACT.** K1-I3: inserted characters are in scope. PG-1: separators never decide. REV-PREP E-4 lists the candidate set
{space, `-`, `.`, `(`, `)`, `/`, `·`, `•`, `_`} and also lists `•` and `#` as mask characters and `#` as an extension
marker (an overlap that must be removed for determinism).

**CONSTRAINT.** Deterministic; covers ordinary local / national / international groupings and inserted-character
renderings; does not change PG-1's meaning.

**CHOICE.** All rules apply to the detection copy (ED-3).

1. **Separator set `SEP`.** Any whitespace character (`\s`); `-` and the Unicode dashes U+2010–U+2015 and U+2212; `.`;
   `(`; `)`; `·` (U+00B7); `_`.
   - `/` is **not** a separator: it ends a run (it commonly separates alternative numbers and date parts; each part is
     then judged on its own).
   - `,` `;` `:` and every other character not listed **end** a run.
   - `•` is removed from `SEP` (it is a mask character only). `#` is never a separator.
2. **Maximum separator run.** At most **3** consecutive `SEP` characters may lie between two digits of one run. Four or
   more end the run. Within the limit, repeated separators (`--`, `  `, `) -`) are allowed and carry no meaning.
3. **Joining groups.** A *group* is a maximal sequence of digits with no separator. Any permitted separator run,
   including one space, joins adjacent groups into one run. There is no length condition on the groups.
4. **Over-long runs (window rule).** Let `n` be the run's base digit count.
   - `L_min ≤ n ≤ L_max` → the run is a candidate as a whole.
   - `n > L_max` → the run is plausible if **any contiguous window of whole groups** has a digit count in
     `[L_min, L_max]` and is not excluded. (This keeps `9876543210 9876543211` from escaping as one 20-digit run; a
     single undelimited group longer than `L_max` still has no ground.)
   - `n < L_min` → no ground.
5. **Leading `+`.** A `+` immediately before the first digit belongs to the run and is not counted. A `+` elsewhere ends
   the run.
6. **Edges.** Separators or punctuation before the first digit (or `+`) and after the last digit are not part of the
   run and have no effect (`(022) 2345 6789` → run starts at `0`, includes `) `). A letter immediately before or after
   a run ends it but does **not** disqualify it.
7. **Extensions.** Markers (case-insensitive): `ext`, `extn`, `extension`, `x`, each optionally followed by `.` and / or
   `:`; and `#`.
   - A marker **attaches** to the preceding run when the text between that run's last digit and the marker is at most 3
     characters from {whitespace, `,`, `-`, `(`}, and the marker is followed (after optional whitespace, at most 3
     characters) by 1–6 digits. The extension digits are never counted and never decide (PG-1 (c)); the base run is
     judged alone.
   - A word marker (`ext`, `extn`, `extension`) followed by digits with **no** attachable base run → extension alone →
     **fragment**. Its digits are never treated as a base run.
   - `x` or `#` with no attachable base run is not a marker: `#` is ignored as punctuation and `x` is an ordinary
     letter (subject to the mask rule in item 8).
8. **Mask characters** `M = {X, x, *, •}`. A run is **masked** (→ fragment, no ground) when it contains a mask
   sequence that is adjacent to a digit (or to a separator inside the run) and either has length ≥ 2 or has digits (or
   in-run separators followed by digits) on both sides. `X` / `x` count as mask characters only when the maximal
   letter token containing them consists solely of `X` / `x`. A single `x` attached to one side only (`x9876543210`) is
   not a mask.

**Rejected alternatives.**
- Keeping `/` as a separator: joins alternative numbers and date parts into over-long or spurious runs.
- A rule that one space does not join two long groups: insufficient for `+91 98765 43210 98765 43211`; the window rule
  covers all such cases with one mechanism.
- A separator limit of 1 or 2: misses `98765 - 43210` (3 characters) style renderings.

### ED-3 — Unicode normalization and digit handling

**FACT.** K1-R2 and CONTRACT-REC §3: quotes are verbatim, never altered. REV-PREP §5 common constraint: detection on a
read-only copy; no detected value is stored, logged or returned. NFKC already maps full-width digits and letters,
compatibility spaces (NBSP, U+2000–U+200A, U+202F, U+3000) to U+0020, full-width `@ . - ( )` to ASCII, and
super/subscript and circled digits to ASCII digits. NFKC does **not** map non-ASCII decimal digits (e.g. Devanagari
`०–९`) and does **not** remove format characters (U+200B, U+200C, U+200D, U+2060, U+FEFF, U+00AD).

**CHOICE.** The detection copy `C` of a screened string `s` is built in this fixed order:
1. `C = s.normalize('NFKC')`.
2. Remove every `\p{Cf}` (format) character. Technically necessary: invisible inserted characters are a K1-I3
   rendering and would otherwise split runs and addresses.
3. Map every `\p{Nd}` character that is not `0–9` to its ASCII digit. Value = (number of consecutive `\p{Nd}` code
   points immediately preceding it) mod 10. This relies on the Unicode stability guarantee that decimal digits are
   encoded in contiguous ascending ranges starting at zero. **Only `\p{Nd}` is mapped**; letters, `\p{No}` not already
   handled by NFKC, and all other characters are not transliterated.
4. `C = C.toLowerCase()` (locale-independent).

Rules:
- The detector never maps positions in `C` back to `s`, never returns substrings of `C` or `s`, and never logs either.
- The stored value (`quote`, evidence statement, `context.*`) is passed through **byte-for-byte unchanged**.
  Normalization cannot affect the evidence quote.
- Homoglyph unification beyond NFKC and transliteration of letters are **not** introduced (documented limitation,
  REV-PREP E-5).

**Rejected alternatives.** NFC (misses full-width / compatibility renderings); NFKC + full Unicode case folding (no
additional detection benefit over `toLowerCase` for the ASCII keyword sets used; adds complexity); transliteration
(not technically necessary).

### ED-4 — Exclusion lists

**FACT.** K1-I4 examples: "evidently a date, price, amount or labelled reference number". PG-DEC §3 constraint 3:
absence of formatting, or of a country / area code, never establishes non-phone. Exclusions must be stated explicitly
and tested.

**CONSTRAINT.** Every exclusion must rest on content that **establishes** a non-phone meaning (date grammar, currency,
unit, label, version marker). None may rely on missing formatting.

**CHOICE.** Exclusion recognizers run on `C` **before run formation** and mark *excluded spans*. Digits inside an
excluded span cannot join a run (the span acts as a run boundary). Exclusions do **not** apply inside a `tel:` / `sms:`
URI (see E-4 in the revision). Matching is case-insensitive and on word boundaries. `NUM` below =
`\d+(?:[.,]\d+)*`; `RANGE` = `NUM(?:\s?(?:-|–|—|to)\s?NUM)?`.

1. **Dates and times.**
   - `YYYY<s>MM<s>DD` and `DD<s>MM<s>YYYY` / `MM<s>DD<s>YYYY` / `DD<s>MM<s>YY`, where `<s>` is one of `- . /` and both
     separators are identical; valid only if month ∈ 1–12, day ∈ 1–31, 4-digit year ∈ 1900–2099. Invalid values are
     **not** excluded.
   - Month-name forms: a 1–2 digit day and / or a 4-digit year (1900–2099) adjacent (≤ 2 characters of space, `,`, `.`,
     `-`) to a month name (`jan`, `january`, `feb`, `february`, `mar`, `march`, `apr`, `april`, `may`, `jun`, `june`,
     `jul`, `july`, `aug`, `august`, `sep`, `sept`, `september`, `oct`, `october`, `nov`, `november`, `dec`,
     `december`, each optionally followed by `.`).
   - Year ranges: `(?:fy\s?)?(19|20)\d{2}\s?[-–/]\s?(\d{2}|(19|20)\d{2})` (e.g. `2025-26`, `FY 2025–2026`).
   - Times: `\d{1,2}:\d{2}(:\d{2})?` with optional `am` / `pm`; `\d{1,2}(\.\d{2})?\s?(am|pm)`.
   - **Not excluded:** unseparated runs such as `20261002`.
2. **Prices and amounts.** A `RANGE` token is excluded when:
   - immediately preceded (≤ 1 space; optional `.` after a code) by a currency symbol `₹ $ € £ ¥ ₩ ₽ ¢ ₺ ₫ ₦ ₱ ₪ ฿` or a
     currency code / word `rs`, `inr`, `usd`, `eur`, `gbp`, `aed`, `sgd`, `aud`, `cad`, `jpy`, `cny`, `rupees`,
     `rupee`, `dollars`, `euros`; or
   - immediately followed (≤ 1 space) by a currency code from the same list, by `/-`, or by an amount unit `lakh`,
     `lakhs`, `lac`, `lacs`, `crore`, `crores`, `cr`, `k`, `m`, `mn`, `million`, `bn`, `billion`, `thousand`, or `%`;
     or
   - it is **comma-grouped**: Western `\d{1,3}(,\d{3})+` or Indian `\d{1,3},(\d{2},)*\d{3}`, optionally with a decimal
     part; or
   - it is a **short decimal**: `\d+\.\d{1,2}` that is not immediately preceded or followed by a digit, and not
     preceded or followed (across ≤ 3 `SEP` characters, ED-2) by a further digit. (A dotted run such as
     `555.010.0199` or `98765.43210` is **not** a decimal and is not excluded.)
3. **Measurement units.** A `RANGE` token immediately followed (≤ 1 space) by: `mm`, `cm`, `m`, `km`, `in`, `inch`,
   `inches`, `ft`, `feet`, `sq ft`, `sq. ft.`, `sqft`, `sq m`, `sqm`, `acre`, `acres`, `hectare`, `hectares`, `ha`,
   `mg`, `g`, `kg`, `t`, `ton`, `tons`, `tonne`, `tonnes`, `lb`, `lbs`, `ml`, `l`, `ltr`, `litre`, `litres`, `liter`,
   `liters`, `kl`, `kb`, `mb`, `gb`, `tb`, `w`, `kw`, `mw`, `kwh`, `mwh`, `ms`, `sec`, `secs`, `min`, `mins`, `hr`,
   `hrs`, `hour`, `hours`, `day`, `days`, `week`, `weeks`, `month`, `months`, `year`, `years`, `yr`, `yrs`, `kmph`,
   `km/h`, `mph`, `nos`, `pcs`, `pieces`, `units`.
4. **Versions and structural numbers.**
   - Version: a dotted token `\d+(\.\d+){1,3}` immediately preceded by `v` or by the word `version`, `ver`, `ver.`,
     `release` or `build` (≤ 1 space). An unlabelled dotted token is **not** a version.
   - IPv4: exactly four dot-separated groups, each 0–255, not adjacent to further digits or dots.
5. **Labelled reference numbers.** The single token (digits, letters, `/`, `-`, `.`, `_`; no whitespace) that follows a
   label within ≤ 3 characters of {whitespace, `.`, `:`, `-`, `#`, `/`}, optionally with an intervening `no`, `no.`,
   `number`, `#` or `№`.
   - **Specific labels** (always establish a reference): `ref`, `reference`, `rfp`, `rfq`, `rfi`, `eoi`, `tender`,
     `bid`, `nit`, `invoice`, `inv`, `order`, `po`, `case`, `ticket`, `gst`, `gstin`, `cin`, `pan`, `tan`, `sku`,
     `part`, `model`, `serial`, `s/n`, `lot`, `batch`, `contract`, `agreement`, `file`, `application`, `registration`,
     `reg`, `account`, `a/c`, `isbn`, `issn`, `doi`, `pin`, `pincode`, `pin code`, `postal code`, `zip`, `zip code`.
   - **Generic labels** `no`, `no.`, `number`, `#`, `№`, `id`: establish a reference **only if** not preceded within
     the same phrase (≤ 2 words) by a contact word: `phone`, `ph`, `tel`, `telephone`, `mobile`, `mob`, `cell`,
     `contact`, `whatsapp`, `fax`, `landline`, `helpline`, `call`, `sms`. (`Mobile No. 9876543210` is **not**
     excluded.)

**Residual (documented, not policy).** Unlabelled numbers that carry no establishing content remain plausible phones
when within `[L_min, L_max]`, e.g. an unlabelled postal code (`Pune 411001`), an unlabelled 6+ digit count without
grouping (`150000 users`), a hyphenated numeric range without currency or unit (`50000-100000`), and digit runs inside
URLs. This is the K1-I4 outcome PG-1 accepted. Lists change only by a later engineering-specification revision.

**Rejected alternatives.** Unlabelled version / decimal heuristics (would exclude dotted phone renderings); a URL
exclusion (would exclude phone links such as messaging URLs carrying a number); open-ended count nouns (`users`,
`students`) as units (no establishing content; unbounded list); full ISO 4217 list (not available in the repository;
would require external research).

### ED-5 — Intake-check function boundary

**FACT.** F-R1, F-R2 (REV-PREP §4): `toIntentSignalInput` is the single validation point every intake entry passes;
`toIntentIntakeInput` aborts the whole event on any entry error and re-prefixes `quote` as `signals[i].quote`;
validation precedes X1, the first lookup and every write. `recordIntentIntakeForOwner` rejects a website with no usable
domain (`normalizeCandidate` → `website` `invalid`), but only **after** `searches.getById`. E-1: `W` null → no business
domain → every email personal.

**CONSTRAINT.** PG-4: non-provider intake screened; whole event rejected; provider-path behavior equivalent; distinct
units.

**CHOICE.**
- **Boundary.** One inline check at the **end of `toIntentSignalInput`**, after the authorization-evidence block and
  immediately before `return`:
  `if (containsPersonalContactIdentifier(quote, website)) throw new IntentSignalValidationError('quote', 'not-allowed', <fixed message>)`.
  No new helper in `intentSignal.ts`; no change to `toIntentIntakeInput` (its existing re-prefixing yields
  `signals[i].quote`) and none to `recordIntentIntakeForOwner` / `recordIntentSignalForOwner`.
- **Input / output contract.** Input: the validated `quote` (the exact value later stored) and the validated `website`
  string. Output: none on pass; on a K1 ground, the thrown error above. Nothing is returned, stored or logged about the
  detected identifier.
- **Website not normalizable.** The check **runs** with `W = null` (no business domain): every email is personal;
  phones, uncertain strings and fragments are unaffected (they never depend on `W`). This is neither a bypass nor a new
  rejection: a clean quote passes `toIntentSignalInput`, and the existing `website` `invalid` rejection in
  `recordIntentIntakeForOwner` still applies unchanged.
- **Order effect.** Earlier validation errors keep precedence (K1 runs last in `toIntentSignalInput`). Deterministic.

**Equivalence (re-verified).** The provider path calls the same predicate with the same `website`
(`business.website`), on a superset of texts, earlier (E-9). `W = null` yields the same result on both paths.

**Rejected alternatives.** Bypassing K1 when `W` is null (an unscreened quote would pass validation and rely on a later,
separate check that runs after a lookup); rejecting the event as `website invalid` inside K1 (moves an existing,
unrelated rule and changes its order); a check in `toIntentIntakeInput` (would split per-entry validation across two
functions and duplicate the per-entry indexing its existing re-prefixing already provides).

### ED-6 — Detector module architecture

**FACT.** `isPersonalContactIdentifier` (structured-field screen) lives in `intentSignal.ts` and must remain unchanged.
Both `intentSignal.ts` and `intentSourceProviderContract.ts` are in `core-research`; `normalizeDomain` is available
from `@acos/core-discovery`. Tests import module files directly (e.g. `./intentSignal`).

**CHOICE.**
- **Location.** New file `packages/core-research/src/contactIdentifiers.ts`. Not exported from the package `index.ts`
  (no public API change).
- **Exports (exactly two).**
  1. `detectContactIdentifiers(text: string, website: string | null): readonly ContactIdentifierKind[]` — mechanics.
     Returns one entry per detected item in scan order; an empty array means **no identifier**.
     `ContactIdentifierKind = 'BUSINESS_EMAIL' | 'PERSONAL_EMAIL' | 'UNCERTAIN_EMAIL' | 'PHONE' | 'FRAGMENT'`.
     - `BUSINESS_EMAIL`: complete email whose domain `D` satisfies `D === W || D.endsWith('.' + W)`.
     - `PERSONAL_EMAIL`: complete email, any other `D` (including `W` null).
     - `UNCERTAIN_EMAIL`: email-shaped residue (E-7 step 5) or `D` unclassifiable (E-1).
     - `PHONE`: any run (incl. `tel:` / `sms:` content and number words) that is plausible after exclusions. The
       detector does not distinguish formatted from bare runs (PG-1).
     - `FRAGMENT`: E-6 forms, masked runs, extension alone.
     The kinds carry **no value, offset or substring**.
  2. `containsPersonalContactIdentifier(text: string, website: string | null): boolean` — the K1-B predicate: true iff
     `detectContactIdentifiers` returns any of `PERSONAL_EMAIL`, `UNCERTAIN_EMAIL`, `PHONE`.
- **Internal (not exported).** `toDetectionCopy` (ED-3); exclusion-span marking (ED-4); email scan (E-3, E-5);
  phone scan (E-4, ED-1, ED-2); `classifyEmailDomain(D, W)` (E-1 / E-2) — domain classification is **inside the
  module but outside the scanners**: scanners produce domains, one function classifies them. `W` is computed once per
  call as `website === null ? null : normalizeDomain(website)`; `D` via `normalizeDomain` of the trimmed domain.
- **Responsibilities.** Detection mechanics and the K1-B predicate only. Field selection (which texts are screened),
  rejection unit, field path and message stay with the callers:
  - provider: one private helper in `intentSourceProviderContract.ts` (e.g. `screenContactIdentifiers`) called in
    each `prepare*` immediately after the `UNATTRIBUTED` skip, screening evidence statements (in array order) then
    `context.targetCustomer`, `context.geography`, `context.service`, and calling `reject(path, 'not-allowed', …)` on
    the first hit;
  - intake: the inline check in ED-5.
- **Shared behavior.** Both paths call the same `containsPersonalContactIdentifier`; there is no second detector.
- `isPersonalContactIdentifier` and `checkIdentifier` remain unchanged and continue to run where they run today.

**Rejected alternatives.** Detector inside `intentSignal.ts` (mixes structured validation and free-text scanning in one
file already carrying OD-1..OD-7 logic); returning matched values (prohibited by K1-I5 rule 3 / OD-11 pattern); a
separate package (unnecessary).

### ED-7 — Test architecture

**FACT.** Existing suites and helpers listed in §2. Test `:578` exercises **`body`** (transient under PG-3), and its
expectation `NORMALIZED` remains correct, but its title states "free text is not PII-scanned", which becomes false once
evidence statements and `context.*` are screened.

**CHOICE.**

| Suite (file) | New / existing | Covers | Fixture strategy |
|---|---|---|---|
| `packages/core-research/src/contactIdentifiers.test.ts` | **new** | email detection (M1–M13), domain classification (E-1/E-2 incl. `W` null), phone detection (P1–P17 + ED-1 boundary 5/6/7, `L_max` 15/16), ED-2 separators / window / extensions / masks, ED-3 normalization, obfuscation (E-5), fragments (E-6), uncertain strings (E-7 step 5), every ED-4 recognizer with a matching negative, multiple identifiers | Table-driven `it.each` rows of `[text, website, expectedKinds]`; literal strings only; no provider fixtures |
| `packages/core-research/src/intentSourceProviderContract.test.ts` | existing file, **new** `describe('K1-B — evidence statements and context.*')` | provider rejection per family (path / reason / non-echo), `context.*` (C1–C5 × 3 families), R1–R5, PG-3 pushed proof (X1–X4) | Extend existing `webFixtures`, `noticeFixtures`, `aiPlatformSignal()` via a local helper that inserts the identifier into **both** the evidence statement and the source text (`snippet` / `body`) so the verbatim check passes; existing X1 / signed-envelope helpers for pushed results |
| `packages/core-research/src/intentSignal.test.ts` | existing file, **new** `describe('K1-B — intake quote (PG-4)')` | I2 (field `signals[1].quote`), I3, I4, I5, I6, I7, I8, `W` null case | Existing intake input builders |
| `apps/worker/src/searchWorker/worker.test.ts` | existing `describe('intent intake …')` at `:2342`, **new** cases | I1, I2 (no lookup, no rows), I9 (prior rows unchanged) | Existing in-memory deps and `intakeEvent` helper |
| `apps/web/src/server/intentIngressIntake.test.ts` | existing, **one new** case | ingress maps the K1 intake rejection to the existing generic 400; log fields `externalId` / `field` / `reason` only | Existing ingress harness |

- **Test `:578` decision: retain and retitle; do not change its expectation; do not split.** New title (substance):
  "a contact in transient notice `body` is not screened (PG-3) — evidence statements are". The evidence-statement and
  `context.*` cases it does not cover are added as separate tests in the new K1 describe, not by expanding this test.
- **Existing privacy-key tests `:536–576`:** unchanged (R7).
- **R4 (provider-path equivalence)** is tested by two assertions over every K1 provider case: (a) every `REJECTED`
  outcome carries a provider-path `field` (never `signals[i].quote`); (b) for every `NORMALIZED` outcome,
  `toIntentIntakeInput(outcome.event.intake)` does not throw.
- **Value non-echo** is asserted in every rejecting test: the message, outcome JSON and captured log records do not
  contain the identifier string.
- Tests verify policy boundaries only; no test asserts behavior beyond REV-PREP E-13 and the revision's matrix.

### ED-8 — Parser / library

**FACT.** No phone / email parsing library is a `core-research` dependency. Every behavior in ED-1..ED-6 is expressible
with ECMAScript regular expressions (incl. `\p{Nd}` / `\p{Cf}` Unicode property escapes), `String.prototype.normalize`,
and the existing `normalizeDomain`.

**CHOICE: no new dependency.** The detector is implemented in-repository.

**Rationale.** A numbering-plan library would import an external definition of "phone number", which PG-1 expressly
declines to adopt ("No external definition adopted"), and would make plausibility depend on country metadata,
contrary to PG-DEC §3 constraint 3 (no exclusion for a missing country / area code). Adding any dependency would in
any case require separate authorization under PD-1 scope. **Not blocked:** no library is required.

---

## §4 Implementation consequences (for a future, separately authorized implementation)

| Area | Consequence |
|---|---|
| New file | `packages/core-research/src/contactIdentifiers.ts` (+ `contactIdentifiers.test.ts`) |
| `intentSignal.ts` | One inline check at the end of `toIntentSignalInput` (ED-5); one import. `isPersonalContactIdentifier` unchanged. |
| `intentSourceProviderContract.ts` | One private screening helper; one call in each of the three `prepare*` functions after the `UNATTRIBUTED` skip. `screenProviderKeys` / `checkIdentifier` unchanged. |
| Worker / ingress / schema / migration / API / UI | No change. |
| Dependencies | None added. |
| Tests | Per ED-7; test `:578` retitled only. |

## §5 Unresolved items

None of ED-1..ED-8 is blocked. No item required a Product Owner decision.

Carried forward unchanged (not engineering items, not resolved here): PD-1 PENDING; EG-1 / EG-CR-4 volume unknown
(REV-PREP §8); K1I-AUDIT I5-F4 non-blocking; F-R5 observation.

## §6 Governance status

**These engineering decisions do NOT authorize implementation. PD-1 remains PENDING and untouched.**

```text
Record type: ENGINEERING DECISION (ED-1 .. ED-8)

ED-1: DECIDED  L_min = 6 (L_max = 15 confirmed)
ED-2: DECIDED  separator set / max run 3 / window rule / extensions / masks
ED-3: DECIDED  NFKC → strip \p{Cf} → \p{Nd}→ASCII → toLowerCase; stored text unchanged
ED-4: DECIDED  enumerated date / amount / currency / unit / version / IPv4 / label lists
ED-5: DECIDED  inline at end of toIntentSignalInput; W null → screen with no business domain
ED-6: DECIDED  contactIdentifiers.ts; detectContactIdentifiers + containsPersonalContactIdentifier
ED-7: DECIDED  fixture strategy; test :578 retained + retitled
ED-8: DECIDED  no new dependency
Blocked EDs: NONE

Product Owner decisions changed: NO (PD-2, PD-3, PD-6, PD-8, PD-9, PG-1..PG-4, K1-B, K1-R1..R3, K1-I1..I6 untouched)
New Product Owner questions: NONE
PD-1: PENDING
Implementation authorized: NO
Implementation performed: NO
Validation performed: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO
```
