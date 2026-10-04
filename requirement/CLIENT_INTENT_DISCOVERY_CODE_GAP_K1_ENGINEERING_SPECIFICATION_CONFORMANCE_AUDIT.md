# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION CONFORMANCE AUDIT

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-CONFORMANCE-AUDIT-001
**Date:** 2026-10-02
**Type:** Read-only governance / conformance audit. Not a Product Owner decision, not an engineering decision, not a
revision, **not an implementation authorization**.
**Audited records:**
- ED-DEC — CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001
  (`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION.md`)
- REV-002 — CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-002
  (`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION.md`)

**Independence disclosure.** This audit was performed in the same working session that authored ED-DEC and REV-002.
It is therefore a self-audit in substance. To compensate, every finding below is tied to a quoted rule, a governing
record, or a verified code fact, and expected-result rows were re-derived from the stated rules rather than from the
authors' intent. A later audit by a different reviewer is advisable before PD-1 authorization.

> **PD-1: PENDING. Implementation authorized: NO.** Nothing in ED-DEC, REV-002 or this audit is edited.

**Classification legend:** `PASS` · `FINDINGS` · `BLOCKED` (only if a Product Owner decision is needed).
Finding severity: **CRITICAL** (specification as written would produce behavior contrary to decided policy or cannot
be implemented deterministically) · **MAJOR** (material ambiguity / missing coverage that lets a defect survive) ·
**MINOR** (documentation / citation).

---

## A. Baseline (verified before reading or writing)

| Check | Expected | Observed | Result |
|---|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | same | PASS |
| Staged files | 0 | 0 | PASS |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | same (empty) | PASS |
| Working tree outside `requirement/` untracked | only `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | same | PASS |
| ED-DEC sha256 (recorded in REV-002 lineage) | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` | same | PASS |
| REV-002 sha256 (reported at creation) | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` | same | PASS |
| Audit file / record ID pre-existence | — | did not exist | PASS |

**Baseline: PASS.**

## B. Governing records used (sha256 verified, all match their recorded values)

| Abbrev. | File (`requirement/`) | sha256 |
|---|---|---|
| ED-DEC | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION.md` | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` |
| REV-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION.md` | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` |
| REV-PREP (rev. 1) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md` | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` |
| K1-ESPEC (rev. 0) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_PREPARATION.md` | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` |
| PG-DEC (PG-1..PG-4) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POLICY_GAPS_PRODUCT_OWNER_DECISION.md` | `448370f18b9d093e62fbb9c3463dd79631a0a352eb399dc97a1151ceee3bac5d` |
| PG-PREP | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POLICY_GAPS_PO_DECISION_PREPARATION.md` | `9ae7fca776c6dd50edb6ca90fc41e6de89e4a9d7ec70b57a50e5662ca9ff8d5d` |
| PG-Q | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POLICY_GAPS_PO_QUESTIONNAIRE.md` | `ea6d8121bba3f926ec3d11f2677d48f9ede37873bdaf7d3ef45dc8cf140d8a52` |
| K1I-DEC (K1-I1..I6) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_SEMANTICS_PRODUCT_OWNER_DECISION.md` | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` |
| K1I-AUDIT | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_SEMANTICS_CONFORMANCE_AUDIT.md` | `bb33d7a72b03f6674ed8019951c4b2393d5c31e96c107ebef1616de9b2f3ef92` |
| K1I-Q / K1I-PREP | `…_K1_IMPLEMENTATION_SEMANTICS_PO_QUESTIONNAIRE.md` / `…_PO_DECISION_PREPARATION.md` | `5660c18e…324e4` / `73b60186…1b831` |
| K1-DEC (K1-R1..R3) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_RESIDUAL_PRODUCT_OWNER_DECISION.md` | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` |
| K1-AUDIT | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_RESIDUAL_DECISION_CONFORMANCE_AUDIT.md` | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` |
| K1-Q / K1-PREP | `…_K1_RESIDUAL_PO_QUESTIONNAIRE.md` / `…_K1_RESIDUAL_PO_DECISION_PREPARATION.md` | `39840320…a8262` / `4a126835…0f1b4` |
| PO-DEC (K1-B) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_PRODUCT_OWNER_DECISION.md` | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` |
| REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| OQ-DEC | `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| DEC-003 | `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| CONTRACT-REC | `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| ADAPTER-REC | `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| READINESS-001 | `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |

Policy content relied on is PG-DEC §3–§6 and the condensed K1-B / K1-R / K1-I table reproduced in REV-PREP §3 and
REV-002 §2 (cross-checked against PG-DEC §3 wording for PG-1).

---

## C. Audit per engineering decision

### C.1 ED-1 — `L_min` — **FINDINGS**

| Check | Result |
|---|---|
| `L_min = 6` (ED-DEC ED-1; REV-002 §4.5) | Confirmed, consistent in both records |
| `L_max = 15` | Confirmed |
| 7-digit local numbers phones | Yes (`6 ≤ 7 ≤ 15`; P1, P7) |
| 6-digit local numbers phones | Yes (P12b) |
| Formatting not made mandatory | Yes — REV-002 §4.5 "Formatting, `+`, separators, labels and country / area code presence are not inputs to plausibility" |
| `core-payments` 8–15 not adopted | Yes — REV-002 §4.5 "Not used" |
| PG-1 / K1-I4 contradiction | None in the value itself (`6 ≤ 7` satisfies the PG-1 derived bound; lower floor is more fail-closed) |

Findings:
- **ED1-F1 (MINOR, citation).** ED-DEC ED-1 "Engineering background" asserts that local subscriber numbers in the target
  market are 6–8 digits, and that 5-digit runs are "not plausibly a complete callable number in the target-market
  numbering context". Neither fact is supported by any repository record or code. The "target market" inference rests
  only on examples (`+91`, `₹`, `lakh`, `Pune`). The record labels the assertion as unresearched background, and the
  risk-asymmetry argument (over-rejection is the accepted error) stands without it; but the **rejection of `L_min = 5`
  depends on the unsupported assertion**. *Policy change:* no. *Blocks implementation:* no.
- **ED1-F2 (MINOR, citation).** `L_max = 15` relies on the international numbering format's 15-digit maximum
  (REV-PREP E-4). PG-DEC §3 states E.164 "is a numbering standard … Neither is the Product Owner's definition". Using it
  as a technical ceiling is permissible engineering, but neither ED-DEC nor REV-002 restates that the ceiling is a
  technical bound only. *Policy change:* no. *Blocks:* no.

### C.2 ED-2 — Separator handling — **FINDINGS**

| Rule (ED-DEC ED-2 / REV-002 §4.5) | Assessment |
|---|---|
| `SEP` = `\s`, dashes U+2010–2015 / U+2212, `.`, `(`, `)`, `·`, `_` | Deterministic. Consistent across both records. |
| `/`, `,` end a run | Deterministic; documented change from REV-PREP. |
| Max 3 consecutive `SEP` | Deterministic. |
| One space joins any groups | Deterministic — but see ED2-F4. |
| Window rule for `n > 15` | Deterministic. |
| Extensions (markers, 1–6 digits, exclusion from count) | See ED2-F2, ED2-F3, ED2-F5. |
| Extension-alone fragment | See ED2-F2. |
| Mask characters | See ED2-F1. |
| `#` treatment | See ED2-F3. |

Findings:
- **ED2-F1 (CRITICAL, engineering defect with policy effect).** REV-002 §4.5 defines a **run** as optional `+`, a digit,
  then "(≤ 3 `SEP` characters, digit)" repetitions. Mask characters `X x * •` are neither digits nor `SEP`, so **a run
  can never contain a mask character**; the next rule ("A run is masked when it contains a mask sequence …") is
  unreachable. Consequence: a masked rendering is split at the mask and each visible part is judged alone. Where a
  visible part has ≥ 6 digits, it is classified `PHONE`:
  - `98765 43XXX` → run `98765 43` (7 digits) → `PHONE` → REJECTED;
  - `9876543***` → run `9876543` → REJECTED.
  PG-DEC §3 consequence 2: "renderings masked, withheld or truncated by the source, must not by themselves trigger
  K1-B." The specification as written violates that consequence for partially masked numbers with ≥ 6 contiguous
  visible digits. (Where visible parts are short, e.g. P16 `98XXX XX210`, the result is NORMALIZED but the detector
  returns `[]`, not the `FRAGMENT` REV-002 §9.2 P16 expects.) ED-DEC ED-2 item 8 has the same structure ("adjacent to a
  digit (or to a separator inside the run)"), so the defect is in both records. *Policy change:* not intended, but in
  effect narrows PG-1 band 3. *Blocks implementation:* yes, until corrected by an engineering revision (no Product
  Owner decision needed: REV-PREP E-4 step 4 already says masks are evaluated "in digit positions").
- **ED2-F2 (CRITICAL, internal contradiction with policy effect).** REV-002 §4.5 / ED-DEC ED-2 item 7: a marker
  attaches when "followed … by **1–6 digits**"; separately, "A word marker with digits and no attachable run →
  `FRAGMENT` (extension alone); its digits never form a base run" — with no digit limit stated. REV-002 §9.2 **P4**
  expects `extension 5550100` (7 digits) → NORMALIZED / `FRAGMENT`. Two problems:
  1. Determinism: it is undefined whether the 1–6 limit applies to the extension-alone rule, and whether "1–6 digits"
     means "followed by at most 6 digits, then a non-digit" or "the first 1–6 of a longer run" (e.g. `ext. 9876543210`).
  2. Policy: PG-1 says "A string is a phone number if it conveys all the digits … Formatting does not decide … labels
     … neither makes a string a phone number nor stops it being one", and defines extension-alone by example as
     `ext. 204`, `extension 567` "with no base number in it". Treating a 7+ digit sequence after the word `extension`
     as a fragment lets a label stop a plausible number from being a phone (PG-DEC §3 consequence 3, first bullet in
     spirit). P4's second example therefore conflicts with PG-1.
  *Policy change:* yes in effect (narrowing). *Blocks:* yes until corrected; correction is engineering (bound the
  extension-alone rule to fewer than `L_min` digits, or evaluate ≥ `L_min` digits as a run).
- **ED2-F3 (MAJOR, documentation inconsistency / determinism).** `#` has three roles:
  1. ED-2 item 7 / REV-002 §4.5: extension marker after a run;
  2. ED-2 item 7: with no attachable run "`#` is ignored as punctuation" (so `#9876543210` would be a 10-digit run →
     `PHONE`);
  3. ED-4 item 5 / REV-002 §4.4 step 6: generic reference label.
  Because exclusions (step 6) run before runs (step 7), role 3 pre-empts roles 1 and 2 whenever `#` is followed by a
  token and no contact word precedes it. ED-DEC's own text for role 2 therefore never applies, and role 1 applies only
  where a contact word happens to precede (`Tel 22 1234 5678 #204`), subject to the undefined "word" count (ED4-F3).
  REV-002 P32 (`#12345678` → NORMALIZED) follows role 3 and contradicts ED-DEC ED-2 item 7's role 2. *Policy change:*
  see ED4-F1. *Blocks:* no by itself; must be reconciled in the next revision.
- **ED2-F4 (MAJOR, engineering ambiguity / false positives).** "Any permitted separator run, including one space, joins
  adjacent groups … no length condition" and `SEP` includes every `\s` (incl. newline). Unrelated adjacent numbers are
  joined into one plausible run:
  - `by 2026 150 schools` → `2026 150` (7) → REJECTED;
  - `Q3 2026 10 vacancies` → `3 2026 10` (7) → REJECTED;
  - numbers on consecutive lines, table-like lists `12 15 20 25` (8) → REJECTED.
  None is "established" otherwise under ED-4, so this is within K1-I4's fail-closed reach only if such joins are
  "plausibly" a phone. ED-DEC does not analyse this case (its rejected alternatives address only long groups). Not a
  policy conflict (PG-1 accepted volume effects), but an unexamined envelope choice. *Blocks:* no.
- **ED2-F5 (MAJOR, determinism).** Precedence between extension and mask rules is undefined for `5550100x204`: `x` is a
  single mask-capable character with digits on both sides (mask by ED-2 item 8) and also an extension marker after a
  run (item 7). Results differ (FRAGMENT vs PHONE). Word-boundary requirements for `ext` / `extn` / `extension` are also
  not stated (`next`, `text`, `context` contain `ext`). *Blocks:* no, but must be fixed before implementation.

### C.3 ED-3 — Unicode normalization — **FINDINGS (minor)**

| Check | Result |
|---|---|
| Order NFKC → strip `\p{Cf}` → `\p{Nd}` → ASCII → `toLowerCase` | Confirmed, identical in ED-DEC and REV-002 §4.3 |
| Only `\p{Nd}` converted; no arbitrary transliteration | Confirmed |
| Stored evidence unchanged | Confirmed (REV-002 §3 C-1; §4.3 "Positions in `C` are never mapped back") |
| No position-mapping requirement | Confirmed — no rule needs offsets (fields are reported by path, values never echoed) |
| Verbatim-quote requirement unaffected | Confirmed — `checkVerbatim` (`intentSourceProviderContract.ts`) compares original strings; the detection copy is never used for verbatim checks |

Findings:
- **ED3-F1 (MINOR, wording).** "value = (count of consecutive `\p{Nd}` code points immediately before it) mod 10"
  (REV-002 §4.3 step 3) does not say "in code-point order" versus "in the string". Read as string order it is wrong
  (`९८` would map to `0 1`). The intended reading (code-point space) is recoverable from ED-DEC's reference to the
  Unicode stability guarantee, but the specification should state it.
- **ED3-F2 (MINOR, citation).** The `\p{Nd}` algorithm relies on the Unicode stability policy (decimal digits in
  contiguous ascending ranges from zero). This is an external technical standard not recorded in the repository. It is
  a reasonable engineering basis, not a policy definition.
- **ED3-F3 (MINOR, list consistency).** Verified: `'№'.normalize('NFKC') === 'No'`, so the `№` entries in ED-4 item 5
  can never match after normalization (dead entries; behavior unchanged because `no` is also listed). Verified:
  `'m²'.normalize('NFKC') === 'm2'`, so `120000 m²` becomes `120000 m2`; the unit `m` followed by `2` has no word
  boundary and is not in the unit list → `PHONE` (unlisted residual). Verified: `'℡'` → `TEL` (helpful: `℡:` becomes
  `tel:`).

### C.4 ED-4 — Exclusion rules — **FINDINGS**

| Category | Establishing content? | Assessment |
|---|---|---|
| Dates (separator grammar + range validity), month names, year ranges, times | Yes | Conforms; see ED4-F4 anchoring |
| Prices / currency symbols / codes before or after | Yes | Conforms |
| `lakh` / `crore` / `%` etc. after | Yes | Conforms |
| Comma grouping | Yes | Conforms (commas end runs anyway) |
| Short decimals | Yes (bounded) | Conforms after the boundary wording; dotted phones not excluded (P26) |
| Measurement units | **Partly** | ED4-F2 |
| Versions (labelled), IPv4 (range-checked) | Yes | Conforms |
| Specific reference labels | Yes (K1-I4 names "labelled reference number") | Conforms; ED4-F5 minor |
| Generic labels `no`, `no.`, `number`, `#`, `№`, `id` | **No** | ED4-F1 |
| Unlabelled numbers, postal codes, quantities | Not excluded | Conforms to PG-1 constraint 3 (documented residual) |

Required probes (re-derived from the stated rules):

| Text | ED-4 result | Phone result | Conforms to PG-1 / K1-I4? |
|---|---|---|---|
| `Mobile No. 9876543210` | not excluded (contact word) | REJECTED | Yes |
| `No. 9876543210` | **excluded** (generic label) | NORMALIZED | **Questionable** — ED4-F1 |
| `ID 9876543210` | **excluded** | NORMALIZED | **Questionable** — ED4-F1 |
| `#9876543210` | **excluded** | NORMALIZED | **Questionable** — ED4-F1 |
| `Call 9876543210 in office hours` | **excluded** (unit `in`) | NORMALIZED | **No** — ED4-F2 |
| `9876543210 Ms. Rao`, `9876543210 HR desk` | **excluded** (units `ms`, `hr`) | NORMALIZED | **No** — ED4-F2 |
| `Pune 411001` | not excluded | REJECTED | Yes (documented residual) |
| `PIN 411001` | excluded (specific label) | NORMALIZED | Yes |
| `150000 users` | not excluded | REJECTED | Yes (documented residual) |
| `2025-261234` | year range matched without trailing digit boundary (ED4-F4) | ambiguous | Determinism issue |

Findings:
- **ED4-F1 (CRITICAL, policy-conformance risk).** ED-DEC ED-4 item 5 treats generic labels (`no`, `no.`, `number`,
  `#`, `№`, `id`) as establishing a reference number unless a contact word precedes. These labels mean only "number" /
  "identifier"; a phone number is itself a number, so they do not **establish a non-phone meaning**. ED-DEC's own
  constraint ("Every exclusion must rest on content that establishes a non-phone meaning") and PG-DEC §3 ("labels …
  neither makes a string a phone number nor stops it being one"; consequence 3 "must not treat absence of formatting
  … as establishing that a string is not a phone number") are not met: the exclusion is triggered by a label that is
  equally consistent with a phone, and its only safeguard depends on the *absence* of a contact word. Effect:
  `No. 9876543210`, `ID 9876543210`, `#9876543210` pass K1-B. K1-I4's examples name "labelled reference number"; that
  supports **specific** reference labels, not generic ones. *Policy change:* yes in effect (narrows K1-I4 / PG-1 band
  2). *Blocks implementation:* yes until corrected; correction is engineering (remove generic labels from the
  exclusion set, or let them qualify only after a specific label, e.g. `Tender No.`). No Product Owner decision
  required.
- **ED4-F2 (CRITICAL, engineering defect with policy effect).** The unit list (ED-DEC ED-4 item 3) contains ordinary
  English words and abbreviations — `in`, `ms`, `hr`, `hrs`, `min`, `sec`, `day(s)`, `week(s)`, `month(s)`, `year(s)`,
  `units`, single letters `m`, `l`, `g`, `t`, `w` — matched "immediately followed (≤ 1 space)". A fully formatted,
  clearly phone-like number followed by such a word is excluded: `Call 9876543210 in office hours`. PG-DEC §3
  consequence 1 requires local, national and international numbers to be recognized in any rendering; the following
  word does not establish a measurement. The same pattern applies to amount units `k`, `m`, `cr`. *Policy change:* yes
  in effect. *Blocks:* yes until corrected (engineering: restrict units to unambiguous unit tokens, require the
  number token itself to be non-phone-like, or exempt runs that already satisfy plausibility with formatting — the
  last would have to be reviewed against "formatting never decides").
- **ED4-F3 (MAJOR, determinism).** The contact-word rule "not preceded within the same phrase (≤ 2 words)" leaves
  "phrase" and "word" undefined (do digit groups count as words? punctuation?). `Call us on No. 9876543210` (contact
  word 3 words before) → excluded. The contact-word list omits common channel words (`skype`, `telegram`, `signal`,
  `viber`, `wechat`, `number`). *Blocks:* no, but must be defined.
- **ED4-F4 (MAJOR, determinism).** Only IPv4 and short decimals state digit-boundary anchoring. Date, year-range, time,
  amount and unit recognizers do not state that the match must not be adjacent to further digits. Unanchored, a
  recognizer can carve an exclusion out of a longer digit run (e.g. year range `2025-26` inside `2025-261234`, leaving
  `1234`, n = 4 → no ground; anchored, the run is 10 digits → `PHONE`). *Blocks:* no; must be stated.
- **ED4-F5 (MINOR).** Specific labels include common words (`order`, `case`, `file`, `part`, `model`, `account`,
  `application`, `contract`, `lot`, `batch`), and the reference token may be any digit run, including a 10-digit
  mobile-shaped number (`place your order 9876543210`). This is within K1-I4's "labelled reference number" wording but
  increases false-negative exposure. Recorded only.

### C.5 ED-5 — Intake boundary — **PASS**

| Check | Result |
|---|---|
| Exact boundary | Inline at end of `toIntentSignalInput`, after authorization evidence, before `return` (ED-DEC ED-5; REV-002 §7). Implementable: `quote` and `website` are local variables there. |
| Missing website | `requiredString(raw.website, 'website', …)` throws `required` before K1 (existing). |
| Invalid (non-normalizable) website | K1 runs with `W = null`; existing `website invalid` rejection after `searches.getById` unchanged (code: `intentIntake.ts:107–113`). Verified: `normalizeDomain('not a url') === null`. |
| No business domain → all emails personal | Stated; consistent with REV-PREP E-1 / K1-ESPEC E-1 and K1-I4 (undetermined → personal). |
| Separate units | Provider `ProviderResultOutcome` vs thrown intake error; unchanged code paths. |

**Critical question — does the intake check cause provider results to be treated differently from the provider
contract specification?** **No.** Code facts:
- `normalizeIntentEvent` builds intake `quote: signal.evidence` and `website: candidate.business?.website`
  (`intentSource.ts` intake construction); adapters set `evidence` from `raw.excerpt` / `interest.statement` /
  `item.text` and `website` from `organization.website` / `business.website` (`intentSourceAdapters.ts:54/60, 102/107,
  139/144`), which `prepare*` fill from `intentEvidence.evidence` / `evidence[i].statement` /
  `intentEvidence[i].evidence` and `business.website`.
- The intake check sees `requiredString(...)`'s **trimmed** quote. Trimming removes edge whitespace only (and U+FEFF,
  which the detection copy removes anyway); no detector rule depends on edge whitespace. Results are identical.
- The provider check screens a superset (statements + `context.*`) with the same predicate and website, earlier.
- X1 re-derivation calls `normalizeWith` (`intentSourceProviderContract.ts` `requireExactProviderResultForIntake`), so
  it repeats the same scope (PG-3 consequence 1).

Observation (not a finding against ED-5): for a provider result whose `business.website` is non-empty but not
normalizable, the **provider** check (not the intake check) now returns `REJECTED` at P2 when an evidence statement
contains any email; previously such a result was `NORMALIZED` at P2 and rejected at P3 (`website invalid`). This
follows from E-1 (`W` null → personal), which predates ED-5.

### C.6 ED-6 — Detector architecture — **FINDINGS**

| Check | Result |
|---|---|
| Separation: email scan / phone scan / domain classification / fragments / uncertainty / policy predicate | Present (REV-002 §4.1–4.4; ED-DEC ED-6 internal list) |
| Same detector on both paths | Yes — both call `containsPersonalContactIdentifier(text, website)`; `W` computed inside from the same raw website |
| Return kinds sufficient for K1-B / K1-R1 / K1-I1..I4 / PG-1 | Yes for the predicate: every phone is personal (K1-R1), plausible-but-unestablished runs fold into `PHONE` (K1-I4 outcome identical), undetermined emails → `UNCERTAIN_EMAIL`. No information needed for any decided rule is lost. |
| Existing `isPersonalContactIdentifier` unchanged | Yes |

Findings:
- **ED6-F1 (CRITICAL, over-capture in detector spec).** REV-002 §4.4 step 2: `⟨AT⟩` includes the word `at` and
  "`@` with optional surrounding whitespace"; `⟨DOT⟩` includes plain `.`; the word form is accepted when one `⟨DOT⟩`
  follows. Ordinary prose then forms "emails":
  - `documents available at eprocure.gov.in` → `available@eprocure.gov.in` → `PERSONAL_EMAIL` → REJECTED;
  - `rate @ 12.50 per unit` → `rate@12.50`; verified `normalizeDomain('12.50') === '12.0.0.50'` (non-null, IPv4
    parse) → `PERSONAL_EMAIL` → REJECTED.
  K1-I3 covers "complete identifiers in any rendering"; these strings are not identifiers, and K1-I4 applies only to
  strings that are plausibly identifiers. The REV-PREP E-5 wording ("the word `at` only where the remainder forms
  `label (dot-token label)+`") already allowed this; REV-002 made it exact without examining it. *Policy change:* in
  effect broadens K1-B beyond identifiers. *Blocks:* yes until corrected (engineering: require a bracketed or word dot
  token for the word form `at`, and reject numeric-only / IP-literal domains for spaced `@`).
- **ED6-F2 (MINOR, observability).** Kinds do not distinguish "excluded by ED-4" from "below `L_min`" or "no digits";
  both return `[]`. Tests therefore cannot assert *why* a run was not a phone, which weakens ED-4 regression tests.
- **ED6-F3 (MINOR).** Step 2 (`⟨DOT⟩` includes `.`, `⟨AT⟩` includes `@`) also matches ordinary emails before step 3, so
  step 3's edge-trimming rules apply only to residues step 2 misses. Outcomes are the same; the double definition is a
  maintenance hazard.
- **ED6-F4 (MINOR).** ED2-F1 makes `FRAGMENT` unreachable for masked runs, so the `FRAGMENT` kind is partly unreachable
  as specified.

### C.7 ED-7 — Test specification — **FINDINGS**

Coverage check against the required boundaries (REV-002 §9):

| Boundary | Row(s) | Status |
|---|---|---|
| business / personal / subdomain / parent / sibling / affiliate / ccTLD | M1, M2, M3, M4, M5, M6 | Covered |
| obfuscated / incomplete / uncertain email | M7, M8 / M9 / M10 | Covered |
| local / national / extension / extension-only / bare / obfuscated / masked phone | P1, P2, P3, P4, P6–P7, P15, P16 | Covered (P4, P16 expectations defective — ED2-F1, ED2-F2) |
| multiple: business + personal | M12 | Covered |
| multiple: **business-only emails (several at `W`)** | — | **Missing** (REV-PREP E-11 row "accepted") |
| multiple: **phone + business email**, **phone + personal email** | — | **Missing** |
| `context.targetCustomer` / `geography` / `service` | C1–C5 × 3 × 3 families | Covered |
| transient `title` / `body` (pushed) | X1 | Covered |
| transient **`snippet`** | — | **Missing** (X1 names body / title only) |
| transient `basis` (pushed) | X2 | Covered |
| transient `title` / `snippet` / `basis` on the **pulled** path | R6 covers notice `body` only | **Missing** |
| provider rejection / intake rejection | R1–R3 / I2–I4, I8, I10 | Covered |
| provider / intake equivalence | R4 | Covered, but see ED7-F2 |
| unchanged stored quote | N6 | Covered |
| no leakage in messages | C5, ED-DEC ED-7 "Value non-echo" | Covered |

Line 578: the test appends `procurement@college.example.edu` to a pulled notice's **`body`**; `body` is in
`FREE_TEXT_KEYS` and is transient source text. Expectation `NORMALIZED` remains correct; "retain and retitle"
(ED-DEC ED-7) is correct.

Findings:
- **ED7-F1 (MAJOR, missing coverage).** Missing rows listed above (business-only multiple emails; phone + business
  email; phone + personal email; transient `snippet`; pulled-path `title` / `snippet` / `basis`). No row probes the
  defects found in this audit (ED2-F1 partial masks with ≥ 6 visible digits; ED2-F2 `extension` + ≥ 6 digits; ED2-F5
  `5550100x204`; ED4-F1 `No.` / `ID` / `#` + 10 digits; ED4-F2 `9876543210 in …`; ED4-F4 anchoring; ED6-F1 `at
  domain` prose and `@ 12.50`; ED2-F4 adjacent unrelated numbers). These defects would survive the specified matrix.
- **ED7-F2 (MINOR, test design).** R4 assertion (b) — "every NORMALIZED event's intake passes `toIntentIntakeInput`" —
  is tautological: `normalizeIntentEvent` already calls `toIntentIntakeInput` (`intentSource.ts`), so a NORMALIZED
  outcome implies it. Assertion (a) (REJECTED `field` is never `signals[i].quote`) is the effective equivalence test.
- **ED7-F3 (MINOR, expectations enshrine findings).** P4 (`extension 5550100` → NORMALIZED), P16 (`FRAGMENT` kinds) and
  P32 (`#12345678` → NORMALIZED) encode behavior questioned in ED2-F1, ED2-F2 and ED4-F1. P25's second example
  (`Fax: 22 1234 5678`) contains no generic label, so it does not test the contact-word rule its title names.
- **ED7-F4 (MINOR, citation).** REV-002 R6 / ED-DEC ED-7 retitle the line-578 test citing PG-3. That test uses the
  **pulled** path (`normalizeProviderResult`); its basis is K1-I5 rule 3 / REV-PREP E-8 (transient source text), not
  PG-3 (pushed-proof carriage).
- **ED7-F5 (MINOR, implementation readiness).** §9 states "`W = example.com` (website `https://www.example.com`) unless
  stated", but existing provider fixtures use other websites (e.g. `https://bakery.example.com`,
  `https://city.example.gov` in `intentSourceProviderFixtures.ts`). Provider rows need `business.website` overrides;
  the specification does not say so.

### C.8 ED-8 — Dependency decision — **PASS**

- No library is required by REV-002; every rule uses regex (incl. `\p{…}`), `normalize`, and `normalizeDomain`.
- `core-research/package.json` has no phone / email parser; none added (verified unchanged: code fingerprint empty).
- The reasoning (PG-1 "No external definition adopted"; PG-DEC §3 constraint 3) is policy-consistent and does not
  itself depend on an external definition. (ED-3's reliance on the Unicode standard and ED-1's on the numbering
  format are recorded under ED3-F2 / ED1-F2, not here.)
- Deterministic implementation with existing capabilities: yes, once ED-2 / ED-4 / ED-6 findings are corrected.

---

## D. Policy consistency matrix

| Chain | Governing rule | Specification (REV-002 / ED-DEC) | Result |
|---|---|---|---|
| K1-R1 → K1-I1 / I2 | business = `W` host or subdomain; everything else personal; every phone personal | §4.2 `D === W || D.endsWith('.'+W)`; no related-domain list; `PHONE` always ground | Consistent |
| K1-I3 → K1-I4 | complete identifiers any rendering; fragments no ground; undetermined + plausible → personal | `UNCERTAIN_EMAIL`, `PHONE` grounds; `FRAGMENT` none | **Inconsistent in part**: ED2-F1 (masked → PHONE), ED6-F1 (non-identifiers captured) |
| K1-I5 → PG-2 / PG-3 | evidence always; `context.*` free text; proof text transient | §5 table; §6 order; X1 via `normalizeWith` | Consistent |
| K1-I6 → PG-4 | provider result unit; intake event unit; distinct | §6, §7, §8 | Consistent |
| PG-1 → ED-1 | local / national phones; formatting never decides | `L_min = 6`; format not an input | Consistent |
| PG-1 → ED-2 | extension by base; extension alone fragment; masked no trigger | extension 1–6 + extension-alone unbounded; masks unreachable | **Inconsistent**: ED2-F1, ED2-F2 |
| PG-1 → ED-4 | exclusions only where established; labels never decide | generic labels; common-word units | **Inconsistent**: ED4-F1, ED4-F2 |
| PG-2 → ED-5 / ED-7 | `context.*` screened, existing screen kept, provider-only field | §5, §6; C1–C5 | Consistent |
| PG-3 → ED-7 | title / snippet / body / basis transient | X1, X2, R6 | Consistent in rule; coverage gaps ED7-F1; citation ED7-F4 |
| PG-4 → ED-5 / ED-7 | intake screened; whole event; provider equivalent | §7; I1–I12; R4 | Consistent (ED7-F2 minor) |
| Fail-closed (K1-I4) | reject when plausible and not established | `L_min = 6`; residuals documented | Consistent in direction; undermined by ED4-F1 / ED4-F2 exclusions |
| Structured fields (K1-I5 rule 4, PG-4) | unchanged | §5; I6, I7 | Consistent |
| Rejection scope (K1-I6, PG-4) | nothing broader / narrower | §8 | Consistent |

## E. Engineering consistency matrix

| Chain | Check | Result |
|---|---|---|
| ED-1 → ED-2 | window rule uses `[L_min, L_max]` | Consistent |
| ED-2 → ED-4 | exclusion before runs; `#` roles | **Inconsistent**: ED2-F3 (ED-2 item 7 role 2 pre-empted by ED-4) |
| ED-2 internal | run grammar vs mask rule | **Inconsistent**: ED2-F1 |
| ED-2 internal | extension attach vs extension alone | **Inconsistent**: ED2-F2 |
| ED-2 internal | extension `x` vs mask `x` | **Undefined**: ED2-F5 |
| ED-3 → ED-4 | `№` after NFKC | Dead entry: ED3-F3 |
| ED-4 → ED-7 | every recognizer + negative tested | Partly; defects untested (ED7-F1) |
| ED-1 / ED-2 → ED-7 | P4, P16, P32 expectations | **Inconsistent** with rules or policy (ED7-F3) |
| ED-5 → ED-6 | same predicate, same `website` | Consistent |
| ED-6 → ED-7 | kinds asserted as multisets | Consistent; observability gap ED6-F2 |
| ED-5 → ED-7 | I10 / I11 order | Consistent with code (`toIntentSignalInput` before `getById` before `normalizeCandidate`) |
| ED-DEC ↔ REV-002 | lists by hash reference; rule text | Consistent (same defects in both) |

## F. Current-code observations (facts only; future code marked)

| # | Specification dependency | Current code | Status |
|---|---|---|---|
| CC-1 | `normalizeDomain` behavior (IDN, `www.`, trailing dot, `null`) | `core-discovery/src/normalize.ts:15–35`; exported `index.ts:27`; already a dependency | Exists as assumed. Also returns IPv4-parsed hosts for numeric input (`'5.5'` → `5.0.0.5`) — relevant to ED6-F1. |
| CC-2 | `toIntentSignalInput` local `quote`, `website`; insertion point before `return` | `intentSignal.ts:257–345`; `quote` is trimmed by `requiredString` (`:236–246`) | Exists; implementable |
| CC-3 | Re-prefix `signals[i].quote` | `toIntentIntakeInput` (`:405–425`) excludes only `searchId` / `companyName` / `website` | Exists as assumed |
| CC-4 | Provider insertion point after `UNATTRIBUTED` in three `prepare*` | `intentSourceProviderContract.ts:387–575` | Exists as assumed |
| CC-5 | `normalizeWith` maps `IntentSignalValidationError` → `REJECTED` | `:743–781` | Exists |
| CC-6 | Intake built from evidence / website verbatim | `intentSource.ts` intake construction; `intentSourceAdapters.ts` | Exists; supports equivalence |
| CC-7 | X1 re-derivation via `normalizeWith` | `requireExactProviderResultForIntake` | Exists |
| CC-8 | Existing CONTRACT-REC §3 screen on `context.*` | `screenProviderKeys` → `checkIdentifier` (non-`FREE_TEXT_KEYS`) | Exists |
| CC-9 | `contactIdentifiers.ts`, its two exports, provider helper, intake inline check, new tests | absent | `SPECIFICATION — NOT CURRENT IMPLEMENTATION` (not a failure) |
| CC-10 | Test `:578` | present, `body` append, `NORMALIZED` | As described |
| CC-11 | Worker / ingress tests for I1, I2, I9, I12 | `worker.test.ts:2342` describe; `intentIngressIntake.test.ts` | Harness exists; cases `SPECIFICATION — NOT CURRENT IMPLEMENTATION` |
| CC-12 | Fixtures with `W = example.com` | fixtures use other hosts | ED7-F5 |

No specification rule depends on a function or field that does not exist, apart from the intentionally new items in
CC-9.

## Policy / engineering / implementation classification of material rules

| Rule | Classification | Note |
|---|---|---|
| Every phone personal; business = `W` / subdomain | PO POLICY | K1-R1, K1-I1/I2 |
| Fail-closed for plausible, unestablished strings | PO POLICY | K1-I4 |
| Masked / extension-alone not a ground | PO POLICY | PG-1 (c), band 3 |
| `context.*` screened; proof text transient; intake whole-event unit | PO POLICY | PG-2, PG-3, PG-4 |
| `L_min = 6`, `L_max = 15` | ENGINEERING SPECIFICATION | delegated by PG-DEC §3 |
| Separator set, max run, window rule | ENGINEERING SPECIFICATION | ED2-F4 unexamined envelope |
| Mask / extension grammar | ENGINEERING SPECIFICATION | **silently narrows PG-1 as written** (ED2-F1, ED2-F2) |
| Generic-label exclusion; common-word units | ENGINEERING SPECIFICATION | **silently narrows K1-I4 / PG-1 as written** (ED4-F1, ED4-F2) |
| Word `at` / spaced `@` email reconstruction | ENGINEERING SPECIFICATION | **silently broadens K1-B as written** (ED6-F1) |
| `W` null → all emails personal | ENGINEERING SPECIFICATION | consistent with K1-I4 |
| NFKC / `\p{Cf}` / `\p{Nd}` / lowercase | ENGINEERING SPECIFICATION | — |
| Module placement, exports, helper names, check position | IMPLEMENTATION DETAIL | — |
| Fixture construction, test file placement | IMPLEMENTATION DETAIL | — |
| Contact-word window "word"/"phrase" definition; recognizer anchoring; `x` precedence | UNRESOLVED (engineering) | ED4-F3, ED4-F4, ED2-F5 |

---

## G. Findings (grouped)

**Policy conflicts (in effect; all correctable by engineering, none requires a Product Owner decision):**
- ED2-F1 (CRITICAL) masked renderings with ≥ 6 contiguous visible digits classified `PHONE` — contrary to PG-1
  consequence 2.
- ED2-F2 (CRITICAL) `extension` + ≥ 6 digits treated as fragment; P4 — contrary to PG-1 "labels never decide".
- ED4-F1 (CRITICAL) generic labels `No.` / `ID` / `#` / `number` exclude phone-shaped numbers — not "established".
- ED4-F2 (CRITICAL) common-word units (`in`, `ms`, `hr`, …) exclude formatted phones — contrary to PG-1
  consequence 1.
- ED6-F1 (CRITICAL) prose `at <domain>` and `@ 12.50` reconstructed as personal emails — broadens K1-B beyond
  identifiers.

**Unsupported rationale / citation:** ED1-F1 (6–8 digit subscriber-number assertion; basis for rejecting `L_min = 5`);
ED1-F2 (15-digit ceiling from numbering standard); ED3-F2 (Unicode stability policy); ED7-F4 (PG-3 cited for a
pulled-path test).

**Engineering ambiguities:** ED2-F3 (`#` roles); ED2-F4 (unrelated adjacent numbers joined, incl. across newlines);
ED2-F5 (`x` extension vs mask; marker word boundaries); ED3-F1 (`\p{Nd}` "immediately before" wording); ED4-F3
("word" / "phrase", contact-word list); ED4-F4 (recognizer digit-boundary anchoring); ED4-F5 (common-word specific
labels).

**Implementation-readiness issues:** ED7-F1 (missing tests, defects would survive); ED7-F5 (fixture website
overrides); ED6-F2 (kinds cannot show exclusion reason).

**Documentation inconsistencies:** ED2-F3 (ED-2 item 7 vs ED-4 / P32); ED3-F3 (`№` dead entry; `m²`); ED6-F3
(overlapping email steps); ED6-F4 (`FRAGMENT` partly unreachable); ED7-F2 (tautological R4 (b)); ED7-F3 (P4 / P16 /
P32 / P25 expectations).

**Next required step (not performed here).** An engineering decision amendment (e.g.
`CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-002`) correcting ED-2, ED-4, ED-6 and ED-7 per the CRITICAL and
MAJOR findings, followed by an engineering specification rev. 3 and a re-audit. No Product Owner question arises: each
correction restores conformance to already-decided policy (PG-1 consequences 1–3, K1-I3, K1-I4).

## H. Implementation authorization

```text
Record type: ENGINEERING SPECIFICATION CONFORMANCE AUDIT (read-only)

ED-1: FINDINGS (minor; citation)
ED-2: FINDINGS (2 critical, 3 major)
ED-3: FINDINGS (minor)
ED-4: FINDINGS (2 critical, 2 major, 1 minor)
ED-5: PASS
ED-6: FINDINGS (1 critical, 3 minor)
ED-7: FINDINGS (1 major, 4 minor)
ED-8: PASS
BLOCKED: NONE (no Product Owner decision required)
Specification ready for implementation authorization: NO (CRITICAL findings open)

Product Owner decisions changed: NO
PD-1: PENDING
implementation authorized: NO
Implementation performed: NO
Validation performed: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO

Files created: 1 (this record)
Existing records modified: 0
Code / test / schema / migration / API / UI / dependency changes: 0
```
