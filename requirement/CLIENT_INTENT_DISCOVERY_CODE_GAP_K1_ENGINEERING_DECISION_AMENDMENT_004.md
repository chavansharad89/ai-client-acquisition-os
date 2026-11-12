# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING DECISION AMENDMENT 004

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-004
**Date:** 2026-10-02
**Type:** Engineering decision amendment. Not a Product Owner decision, not an audit, not a specification revision,
**not an implementation authorization**.
**Author role:** Engineering specification owner, K1 workstream.
**Amends:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001 (ED-DEC-001) as amended by ED-DEC-002 and
CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-003 (ED-DEC-003), **only** in the detector semantics named in §4.
None of those records is edited.
**Responds to:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-004-CONFORMANCE-AUDIT-001 ("AUDIT-R4"),
findings R4-F1 … R4-F5.
**Carried into:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-005 ("REV-005"), created in the same round.

> **PD-1: PENDING. Implementation authorized: NO. Validation authorized: NO. Provider calls / external research
> authorized: NO.**

Abbreviations as in AUDIT-R4: PO-DEC (K1-B), K1-DEC (K1-R1..R3), K1I-DEC (K1-I1..I6), PG-DEC (PG-1..PG-4),
ED-DEC-001/002/003, REV-004, CONTRACT-REC, ADAPTER-REC, OQ-DEC, DEC-003. `C′` = number-word-converted detection copy.
`W` = normalized business website domain. "E" = text placed in an evidence statement (provider) and in `quote`
(intake). `P` = positions (digits + established-mask characters).

---

## §1 Baseline (verified before writing)

| Check | Expected | Observed | Result |
|---|---|---|---|
| Branch | `feature/client-intent-discovery-complete` | same | PASS |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | same | PASS |
| Staged files | 0 | 0 | PASS |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing, untouched); untracked records under `requirement/` only | 1 modified + 33 untracked, all under `requirement/` (34 status lines; AUDIT-R4 added one record since its own baseline) | PASS |
| Code fingerprint (`git diff HEAD --binary -- . ':(exclude)requirement/'`, sha256) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty diff) | same | PASS |
| Implementation changes since AUDIT-R4 | none | none (fingerprint unchanged; nothing outside `requirement/` modified or untracked) | PASS |
| PD-1 | PENDING | READINESS-001 row PD-1 ("Whether to authorize implementation of any part of the provider-neutral core (and its scope)"); no PD-1 decision record exists under `requirement/` | PASS — PENDING |
| This record / REV-005 | must not exist | did not exist | PASS |

Governing-record hashes (sha256, files under `requirement/`; every hash recorded in REV-004 lineage and AUDIT-R4 §1
re-computed this round):

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
| 10 | REV-004 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_004.md` | `d9b1f918c4c85c72121affffb8b3a1a150330fb9bff0cca1760622dd37a5c4f4` | Yes |
| 11 | AUDIT-R4 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_004_CONFORMANCE_AUDIT.md` | `1fa6f241aa5176a14d84f775146a3f17e5ece1dfbb0c623c770abc8d27a289c2` | First recorded here |
| 12 | AUDIT-001 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_CONFORMANCE_AUDIT.md` | `53c79c39a73fa522217a5805ddd73ec39a977741eedd4151ee7fe237f66d8b97` | Yes |
| 13 | REV-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION.md` | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` | Yes |
| 14 | REV-PREP (rev. 1) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_PREPARATION.md` | `b0af5a9be2848ced1fe49e866390a6a8663762c452737c076447c5687c0a32f8` | Yes |
| 15 | K1-ESPEC (rev. 0) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_PREPARATION.md` | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` | Yes |
| 16 | DEC-003 | `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| 17 | OQ-DEC (OQ-3, OQ-7, OQ-11) | `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| 18 | CONTRACT-REC | `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| 19 | ADAPTER-REC | `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| 20 | READINESS-001 (PD-1) | `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |
| 21 | REQ-001 (working tree, pre-existing modification) | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |

Code facts CF-1 … CF-12 of AUDIT-R4 §3.1 are relied on as stated there; no code was changed and no code fact is newly
asserted. **Baseline: PASS.**

---

## §2 Purpose and governing principle

This amendment exists **solely** to resolve AUDIT-R4 findings R4-F1 … R4-F5 by correcting or clarifying the engineering
semantics of the K1 detector. It decides how the detector implements already-decided policy; it decides no policy.

**ED3-P is retained unchanged** ("one reading suffices": where any admissible reading yields a plausible identifier not
established as something else, the identifier is reported; "established" requires content; separators, punctuation,
whitespace quantity and formatting never establish anything by themselves).

**ED4-P (clarification of ED3-P, no change of direction).** "Established" is a status that content must *earn*. A rule
may therefore use structure — gaps, punctuation, line breaks, digit counts — to **withhold** "established" status from
a mask, guard or label (which can only move an outcome toward detection), but never to **confer** it. Concretely:
- a separator may stop a mask from reaching a neighbouring number; it never makes a number non-phone;
- a recognizer may suppress an *uncertain* email reading; it never suppresses a reading that is already a complete,
  valid address;
- a label suppresses a number only through a complete, specific construction; a colon or a generic word never does.

---

## §3 Classification of the findings (prompt §7: no silent policy change)

Each finding was compared with REV-004, ED-DEC-003, K1-I3 / K1-I4, PG-1 … PG-4 and DEC-003 §6.

| Finding | Conflict found | Category | Basis |
|---|---|---|---|
| R4-F1 | REV-004 §4.6.4 step 2 makes the whole stretch one number's extent; MK15 enshrines it; conflicts with K1-I3 r1 / PG-1 Consequence 1 and with REV-004's own C-6 | **2 — engineering defect** | K1-I3 r2 / PG-1 band 3 fix *what* a fragment is; K1I-DEC §6 delegates *how* "established" is detected; no policy text is unclear |
| R4-F2 | REV-004 Step 2 (email) runs before Step 4 (exclusions) and A4 has no content guard; conflicts with K1-I4's "established" clause | **2 — engineering defect** (processing order) | K1-I4 already says evidently-a-price/date strings cause no rejection |
| R4-F3 | REV-004 A2 price guard precedes domain validation; conflicts with K1-I3 r1 / K1-R1 r1 | **2 — engineering defect** (precedence) | K1-I3 r1 is unambiguous for complete renderings |
| R4-F4 | REV-004 Class O designator set contains `:`; conflicts with K1I-DEC §6 ("labelled reference number") and PG-DEC §3 (labels never decide) | **2 — engineering defect** (designator set) | the PO example is a labelled reference number, not a word followed by a colon |
| R4-F5 | REV-004 §4.6.3 / §4.6.4 leave segment, stretch scope and single-`x` handling under-specified | **1 — engineering ambiguity** | determinism is an engineering obligation (PG-1 Consequence 3) |

**No category-3 (Product Owner policy) conflict was found.** No Product Owner decision is required; none is made,
assumed or invented here.

---

## §4 Finding-by-finding decisions

### 4.1 ED4-F1 — Masks must not hide a complete phone (R4-F1)

1. **Audit finding.** A complete, fully visible phone becomes `FRAGMENT` when an established mask lies anywhere in the
   same stretch and `P ≤ 15`, or when a fused mask may bind the segment holding it: `Call **9876543210** 24x7`,
   `**98765 43210**, **98765 43211**`, `98765 43210 / 98XXX XXXXX`, `555-0100, 555-01XX`; MK15
   (`98765 43210 XXXXX` → `FRAGMENT`) enshrines the defect.
2. **Governing policy.** K1-I3 r1 (complete phone in any rendering → in scope), r2 (fragment = digits masked by the
   source so the number cannot be read), r3; K1-I4; PG-1 principle, band 3, Consequences 1–2.
3. **Engineering problem.** REV-004 tied mask extent to the *stretch*, which (correctly, R3-F5) spans separate items,
   and treated every `*` / `•` pair adjacent to digits as a possible mask (markdown bold included).
4. **Chosen rule** (REV-005 §4.6.3–§4.6.7):
   - **Emphasis pairing.** Runs of `*` are paired as markdown emphasis delimiters (opener / closer by flanking
     characters; nearest preceding unmatched opener of equal length on the same line). Matched runs are typography and
     can never be masks. `•` is not paired.
   - **M-s narrowed.** An unmatched run of ≥ 2 `*` / `•` is an established mask only if it is fused to a digit on at
     least one side **and** each of its sides is either fused to a digit or separated by a tight gap from another
     mask-capable run (x-token ≥ 2 or `*` / `•` run ≥ 2). A run that faces a digit group across a gap on its non-fused
     side (`9876543210** 2026`) is typography. M-x (x-token ≥ 2) is unchanged.
   - **Mask unit (same-candidate rule).** Masks bind only within a *mask unit*: a maximal chain of groups and
     established masks in which each consecutive pair is **fused** (no character), **inserted** (exactly one
     non-letter character or one single `x` between two groups) or **tight** (1–3 characters, a whitespace run
     counting as one, drawn only from non-line-break whitespace, `-`, `–`, `—`, `−`, `.`, `(`, `)`). Any other gap
     (`,`, `/`, `;`, `:`, `|`, `#`, `_`, `·`, `+`, typography `*` / `•`, a line break, or more than 3 characters) is
     **loose** and ends the unit. Loose gaps never end a *stretch* (R3-F5 preserved); they only stop a mask reaching
     across them.
   - **Remainder.** Everything in the phone stretch outside mask units is evaluated exactly as an unmasked stretch
     (§4.7 window rule), piece by piece between units.
   - **Complete-visible-number (CVN) precedence.** Inside a unit, a *segment* (maximal run of groups with no mask
     between) minus any end group *fused* to a mask is its *core*. If any core contains a window of whole groups with
     **`L_cvn = 10` … `L_max = 15`** digits, the unit is `PHONE`: a run of complete-number length that no mask touches
     cannot be established as the visible part of a masked number.
   - **Otherwise** `P(unit) ≤ 15` → `FRAGMENT`; `P(unit) > 15` → REV-004 segment binding (clarified, ED4-F5) → `PHONE`
     if any free segment is plausible, else `FRAGMENT`.
5. **Why `L_cvn = 10`.** It is the smallest digit count that keeps every ordinary masked rendering a fragment while
   releasing a complete number next to an unrelated mask. Masked renderings with a detached mask have visible prefixes
   of up to 9 digits even with a country code (`+91 98765 XXXXX` = 7, `022 2345 XXXX` = 7, `+44 7911 123 XXX` = 9,
   `+55 11 98765 XXXX` = 9); `L_cvn ≤ 9` would make those trigger, contrary to PG-1 Consequence 2. A visible run of 10
   or more digits not fused to any mask is already of complete-number length; the reading "complete number + separate
   mask" is then admissible and C-6 / ED3-P report it. `L_cvn` is a new named engineering constant; it is used only for
   CVN and does not change `L_min = 6` or `L_max = 15` (ED-DEC-001 ED-1).
6. **Rejected alternatives.**
   - *Visible digits ≥ `L_min` (6) next to a mask → PHONE* (AUDIT-R4 §12 suggestion, broad form): makes
     `+91 98765 XXXXX` and `022 2345 XXXX` trigger (PG-1 band 3 / Consequence 2). Rejected.
   - *Every `*` / `X` / `•` near digits is fragment-inducing:* the defect itself. Rejected.
   - *Split stretches at punctuation:* reintroduces R3-F5 (`98765,43210`, `98765/43210` would stop being phones).
     Rejected; punctuation now limits masks only.
   - *Lower the one-number bound (`P ≤ 13`):* `98765 43210 XXX` (`P = 13`) would still hide a complete number. Rejected.
7. **Why policy is unchanged.** Masked renderings in which the mask sits inside the number's own unit and no
   complete-length run is untouched stay `FRAGMENT` (K1-I3 r2, PG-1 band 3). Every change moves a result from
   `FRAGMENT` to `PHONE` only where a complete visible number is present (K1-I3 r1, PG-1 Consequence 1, ED3-P).
8. **Test implications.** MK15 changes `FRAGMENT` → `PHONE` (Δ rev. 4). New rows MK19–MK34 (REV-005 §10.1), incl. all
   four R4-F1 inputs and `Plot XX, 9876543210`. All other MK / IC rows keep their REV-004 expectation (re-traced,
   REV-005 §10.1).

### 4.2 ED4-F2 — Email detection must not pre-empt clear time / price exclusions (R4-F2)

1. **Audit finding.** `Pre-bid meeting at 11.30am`, `supply at Rs.500 per unit` → A4 candidate with ≥ 2 labels, a
   letter and no valid prefix → `UNCERTAIN_EMAIL` → rejected; REV-004's own time / price recognizers run later (Step 4)
   and cannot rescue.
2. **Governing policy.** K1-I4 ("A string the system establishes is not a contact identifier (for example, because it
   is evidently a date, price, amount …) is not uncertain and causes no rejection"); K1-I3 r1 / r3.
3. **Engineering problem.** Precedence: content that establishes a non-email was consulted only after the uncertain
   classification had been made.
4. **Chosen rule — deterministic email precedence (REV-005 §4.4.4), per at-signal candidate:**
   - **E-1** extract local and domain side (unchanged);
   - **E-2** structural guards — URL (A2–A4), prose (A2, A4) → nothing (unchanged);
   - **E-3** local non-empty **and** a valid `EMAIL_DOMAIN` prefix → classify (§4.2). **Stop.** No content guard can
     run after a valid prefix is found (local empty + valid prefix → `FRAGMENT`);
   - **E-4** content guards, only when no valid prefix exists → nothing:
     CG-1 currency symbol / code after the at-signal (≤ 1 whitespace); CG-2 a §4.8 item 1–4 pattern (date / time,
     price / amount, unit quantity, version / IPv4) matching from the first domain-side character; CG-3 every
     domain-side label numeric; CG-4 (A2, A4 only) first domain-side label begins with a digit; handle guard (A2,
     unchanged);
   - **E-5** uncertainty table (REV-004, unchanged for A1 / A2 / A3). **A4 only:** "≥ 2 labels, no valid prefix" →
     `UNCERTAIN_EMAIL` only if the **final** domain-side label contains a letter; otherwise nothing. A4 single label →
     nothing (unchanged).
   - The §4.8 patterns are *called* by CG-2 on the candidate text; Step 4 itself is not moved.
5. **Rejected alternatives.** *A4 never uncertain (valid prefix or nothing):* would drop `jane at gmail.c` from K1-I4
   fail-closed handling — weakens K1-I4 more than necessary. *Run Step 4 before Step 2:* exclusion spans would then
   consume digits inside genuine addresses (`jane@11.30am.com`, `jane @ 163.com`), recreating R4-F3. Rejected.
6. **Why policy is unchanged.** Uncertainty is withdrawn only where content (time, date, price, amount, unit,
   version, IPv4, currency, all-numeric host) establishes a non-email — K1-I4's own carve-out — or, for the word `at`
   only, where the domain side has no alphabetic final label and so is not plausibly an address. A1 / A2 / A3
   uncertainty (`jane@gmail`, `jane@gmail.c`, `jane @ gmail`, `jane [at] gmail`) is unchanged: K1-I4 is not weakened.
7. **Test implications.** New rows EP1–EP3, EP11 (REV-005 §10.5a). No existing row changes (re-traced: ER20–ER22,
   ER24–ER28 unchanged).

### 4.3 ED4-F3 — Price guards must not hide complete spaced emails (R4-F3)

1. **Audit finding.** `jane @ 163.com`, `jane @ 126.com`, `info @ 1und1.de` → A2 price guard (`@` followed by a digit)
   → nothing; A1 `jane@163.com` is detected, so the guard alone decides.
2. **Governing policy.** K1-I3 r1; K1-R1 r1 ("in any form"); PG-2 net effect for `context.*`.
3. **Engineering problem.** A guard evaluated before validation let a partial recognizer match (a digit after `@`)
   override a complete address.
4. **Chosen rule.** The E-1 … E-5 precedence of ED4-F2: a valid `EMAIL_DOMAIN` prefix (E-3) is decisive; the price /
   digit guards are content guards (E-4) and run only when no valid prefix exists. `EMAIL_DOMAIN` is unchanged: labels
   may be numeric except the final label, which must be ≥ 2 letters (or `xn--…`). Hence numeric-only or numeric-final
   domains (`163`, `163.456`, `12.50`, `1.2.3.4`) are never valid and never become accidental detections; they reach
   E-4 and yield nothing. Legitimate prices (`rate @ 12.50`, `rate @ rs 500`, `rate @ Rs.500`, `price @ 12.5k`) have no
   valid prefix and stay excluded by CG-1 … CG-4.
5. **Rejected alternative.** *Exempt only domains with a known TLD:* needs a TLD list (no dependency, C-4) and leaves
   the precedence implicit. Rejected.
6. **Why policy is unchanged.** Complete renderings are detected and classified exactly as their contiguous form
   (K1-I3 r1); only address-less numeric content is excluded (K1-I4 carve-out).
7. **Test implications.** New rows EP4–EP10, EP12 (REV-005 §10.5a), CX14 (`context.*`). ER27 unchanged (re-traced).

### 4.4 ED4-F4 — Ordinary label words must not hide phones (R4-F4)

1. **Audit finding.** Class O word + `:` designator excludes a complete phone: `To order: 9876543210`,
   `Business account: 9876543210`, `Bulk order: 9876543210`.
2. **Governing policy.** K1I-DEC §6 ("evidently … a labelled reference number"); PG-DEC §3 (labels neither make nor
   unmake a phone) and Consequence 3.
3. **Engineering problem.** `:` is punctuation after any word; as a designator it turned ordinary prose into a
   "construction".
4. **Chosen rule (REV-005 §4.8 item 5).**
   - **Specific reference-label construction** = `LABEL [GAP_L DESIGNATOR] GAP_T TOKEN`, fully matched, with token
     completeness. Nothing else excludes a number.
   - **Lexical designators only:** `no`, `no.`, `number`, `num.`, `#`, `id`, `ref`, `ref.`. **`:` is never a
     designator**; it is only a connector character in `GAP_T` (and therefore allowed after a designator, `Order No:`,
     or after a Class R / S label, `Ref:`, `PIN:`).
   - **Class O** (ordinary words: `tender`, `bid`, `order`, `case`, `ticket`, `part`, `model`, `serial`, `lot`,
     `batch`, `contract`, `agreement`, `file`, `application`, `registration`, `account`, `a/c`, and now `reference`)
     excludes only with a lexical designator after `GAP_L` (0–1 whitespace).
   - **`reference` moves from Class R to Class O**: it has an ordinary-prose meaning before a number ("for reference
     9876543210"); `ref` (abbreviation) stays Class R.
   - **Class R** (reference-only abbreviations / terms: `ref`, `rfp`, `rfq`, `rfi`, `eoi`, `nit`, `invoice`, `inv`, `po`,
     `sku`, `s/n`, `doi`, `reg`) and **Class S** (shape-checked) are otherwise unchanged; designator optional.
   - **Generic designators alone** (`No.`, `#`, `ID`, `number`, with or without `:`) never exclude.
   - **Number boundary:** `TOKEN` = one whitespace-free run of `[0-9a-z/._-]` containing ≥ 1 digit; exclusion applies
     only if no further digit follows the token in the same raw stretch (token completeness, unchanged).
5. **Rejected alternative.** *Keep `:` but exclude Class O tokens that are plausible phones:* would make
   `Tender No. 9876543210` (a labelled reference number, K1-I4 carve-out) a phone and leave the `:` heuristic in place.
   Rejected.
6. **Why policy is unchanged.** Exclusion still requires content establishing a labelled reference number (K1I-DEC §6);
   a word followed by a colon is formatting (PG-DEC §3). Changes move results only toward detection.
7. **Test implications.** RL2 input `Order: 12345678` changes `[]` → `PHONE` (Δ rev. 4; moved to RL2b). New rows
   RL17–RL25 (REV-005 §10.3).

### 4.5 ED4-F5 — Mask binding must be unambiguous (R4-F5)

1. **Audit finding.** Undefined: whether digitless pieces are segments; whether "within the stretch" means the raw or
   the phone stretch; whether a dropped length-1 x-token is removed or a boundary.
2. **Governing policy.** K1I-DEC §6 (delegation of "plausibly" / "established"); PG-1 Consequence 3 ("stated
   explicitly … and covered by tests").
3. **Decisions (REV-005 §4.6):**

| Question | Decision |
|---|---|
| Do empty segments count? | **No.** Segments are maximal runs of ≥ 1 group with no mask between. Consecutive masks with no group between form one **cluster**; its length is the sum of their characters (gaps not counted). `9876543210 XXX XXX` has one cluster of length 6. |
| "Within the stretch" — before or after exclusions? | **After.** Masks, units, segments and remainders are computed on the **phone stretch** (raw stretch with Step 4 exclusion spans removed and split at them). Step 4 itself uses only raw stretches and `JOIN_NEAR` (unchanged). M-s side tests look only at immediately adjacent characters / the next element across one tight gap — never "anywhere in the stretch". |
| How do masks bind to digits? | A cluster is **fused** to a group when no character lies between them. Within a unit, a fused cluster must bind that segment if admissible; a non-fused cluster may bind either adjacent segment; no cluster binds outside its unit. |
| How do spaces / punctuation affect binding? | Fused / inserted / tight gaps join; loose gaps end the unit (§4.1 above). A whitespace run counts as one character; a line break is loose. Punctuation never ends a stretch. |
| Separation of multiple candidates in one sentence | Stretches: letters, consumed spans (URIs, emails), exclusion spans. Within a stretch: mask units (bounded by loose gaps) and remainder pieces between them; each yields at most one entry. Unmasked text is never split by punctuation; the §4.7 window rule evaluates it. |
| Complete phone adjacent to a mask | Loose gap → it is in the remainder → `PHONE` if plausible. Same unit → CVN (core ≥ 10) → `PHONE`; otherwise masked reading (`P ≤ 15` → `FRAGMENT`) or binding (`P > 15`). |
| Length-1 x-token | Always an ordinary stretch character (never a letter, never a mask); between two groups it is an inserted character. "Dropped" in REV-004 is replaced by this definition; no outcome in REV-004 §9 changes. |
| `9876543210 XXX XXX` | One unit; core `9876543210` (10, not fused) → CVN → **`PHONE`** |
| `98765 43XXX` | One unit; core `98765` (5; `43` fused) → `P = 10` → **`FRAGMENT`** |
| `98765 43210 XXXXX` | One unit; core 10 → CVN → **`PHONE`** (MK15, Δ rev. 4) |
| `98765 43210 / 98XXX XXXXX` | ` / ` is loose → unit `98XXX XXXXX` (`P = 10`, core empty) → `FRAGMENT`; remainder `98765 43210` → `PHONE` → **`PHONE`, `FRAGMENT`** |

4. **Rejected alternative.** *Count digitless pieces as segments:* lets a mask "bind nothing real" and makes results
   depend on mask spacing (`XXX XXX` vs `XXXXXX`). Rejected.
5. **Why policy is unchanged.** Clarification only; every resolution is deterministic, stated and tested.
6. **Test implications.** Rows MK1, MK15, MK21, MK23 (REV-005 §10.1) plus the R4-F5 coverage table (REV-005 §10.9).

---

## §5 Minor items necessarily touched (no separate decision) and carried items

| Item | Why touched | Disposition in REV-005 |
|---|---|---|
| R4-M2 (claim "no residual is a false negative") | the claim is false; a self-contained spec must not state it | Claim withdrawn. REV-005 §4.11 lists open false negatives (recorded open — **not** accepted permanently, so the AUDIT-R4 §13 conditional PO path is not entered): single non-`x` letter inserted (`98765a43210`), quoted local part (`"jane.doe"@gmail.com`), comma-grouped phone (`987,654,3210`), concatenated single group > 15 digits, R3-M5 word forms |
| R4-M3 (row precision) | REV-005 must restate every row | L2 (verified path + `field`), L13 (P2), L17 (P2; X1 not reached), L19 / N7 (after existing trim), L20 (non-tautological equivalence), L21 (K1-I5 r3 basis), N4 (second example exercises `oh`), D1 (two inputs, one entry each), §4.4.4 `gmail..com` cited under the single-label branch — marked "Δ rev. 4 (precision)" |
| R4-M4 (missing rows; ED-DEC-003 references) | coverage of `context.*` classes and R4 inputs | CX9–CX15 added. ED-DEC-003 §3.2 item 7 "EX1–EX10" should read EX1–EX6, and §3.3 item 7 "EA1–EA12" should read ER15–ER23 / ER27 (REV-004 numbering). ED-DEC-003 is **not** edited; this record states the correct references. |
| R4-M5 (unlisted over-capture) | §4.11 must be complete | Listed in REV-005 §4.11 |

Carried unchanged (not corrected here; none needs a PO decision): R4-M1 (edge `•••` → `PHONE`, fail-closed), R3-M3
(`tel:` scheme word boundary), R3-M5 (English-only number / at / dot words), R3-M6 (now fully listed in §4.11, item
remains open for volume review under EG-1), R3-M7 (`publication.publisher` classification), R3-M9 (AUDIT-001
reconciliation: ED1-F1, ED1-F2, ED2-F4, ED3-F2, ED4-F4, ED6-F2, ED6-F3, ED7-F2, ED7-F4, ED7-F5; ED7-F2 and ED7-F4 are
addressed in substance by the L20 / L21 precision rows).

---

## §6 Changed test expectations (REV-004 → REV-005)

| Row | REV-004 | REV-005 | Cause |
|---|---|---|---|
| MK15 `98765 43210 XXXXX` | `FRAGMENT` / NORMALIZED / accepted | `PHONE` / REJECTED / rejected | ED4-F1 (CVN) |
| RL2 input `Order: 12345678` (moved to RL2b) | `[]` / NORMALIZED / accepted | `PHONE` / REJECTED / rejected | ED4-F4 (`:` not a designator) |
| L2, L13, L17, L19, L20, L21, N4, N7, D1 | as REV-004 | restated precisely (same policy outcome) | R4-M3 precision |

No other REV-004 row changes expectation. Every REV-004 row is retained in REV-005 with its ID.

## §7 Remaining limitations (non-blocking; recorded, not accepted as policy)

1. **Tight detached mask beside a short complete number** (`555-0100 XXXX`, `1234567 XX`): read as one masked number
   (`P ≤ 15`, core < 10) → `FRAGMENT`. This is the same reading PG-1 band 3 requires for `+91 98765 XXXXX`; the two are
   indistinguishable by content. A loose gap (`555-0100, XXXX`) or a ≥ 10-digit core releases the number. Row MK29.
2. **Fail-closed over-capture introduced or confirmed here:** a genuine masked number split by a line break
   (`+91 98765` ⏎ `XXXXX` → `PHONE`); a `*` / `•` mask spaced from digits on one side (`98•• 43210` → `PHONE`);
   `Order: 12345678` → `PHONE`. Permitted under PG-1 (volume accepted) and K1-I4.
3. Open false negatives listed in §5 row R4-M2 (unchanged from REV-004 behaviour; disposition deferred to a later
   engineering record; no PO acceptance sought or implied).
4. `L_cvn = 10` is a judgement under K1I-DEC §6; a genuine masked rendering with ≥ 10 visible digits and a detached
   mask (`+86 1380 0138 XXX`) is reported as `PHONE` (fail-closed).

---

## §8 Policy boundary

> **This amendment does not modify K1-B, K1-R1–K1-R3, K1-I1–K1-I6, PG-1–PG-4, OQ-3, OQ-7, OQ-11, DEC-003 or
> PD-1–PD-12.** It preserves ED-DEC-001, ED-DEC-002 and ED-DEC-003 except for the technical corrections stated in §4
> (REV-004 §4.4.4 guard order and A4 uncertainty; §4.6.3–§4.6.4 mask taxonomy and binding scope; §4.8 item 5 designator
> set and Class R / O membership of `reference`). `L_min = 6` and `L_max = 15` are unchanged.

PG-1 (phone semantics), PG-2 (`context.*` = free text + existing screen + net effect), PG-3 (transient pushed-result
proof text) and PG-4 (non-provider intake boundary, whole-event unit) are carried into REV-005 verbatim in substance
and are not reinterpreted.

## §9 Product Owner dependencies

**NONE.**

| Finding | Two materially different policy outcomes left open by the governing records? | Result |
|---|---|---|
| R4-F1 | No — K1-I3 r1 / r2 and PG-1 band 1 / band 3 fix both outcomes; only "established" (delegated) is decided | Engineering |
| R4-F2 | No — K1-I4 carve-out names prices and dates | Engineering |
| R4-F3 | No — K1-I3 r1 / K1-R1 r1 "any form" | Engineering |
| R4-F4 | No — K1I-DEC §6 "labelled reference number"; PG-DEC §3 labels never decide | Engineering |
| R4-F5 | No — determinism is an engineering obligation | Engineering |

No complete-identifier false negative is accepted permanently by this record, so the AUDIT-R4 §13 conditional PO path
is not entered.

## §10 Implementation boundary

- Implementation **NOT authorized**; PD-1 **unchanged (PENDING)**.
- Validation **NOT authorized**; no validation session was run.
- Provider / API calls **NOT authorized**; none made. External research **NOT authorized**; none performed.
- No code, test, dependency, package-manifest, lockfile, schema, migration, API, contract, UI or configuration change;
  no generated artifact; no commit; no push; no existing record modified.
- `SPECIFICATION — NOT CURRENT IMPLEMENTATION` applies to every file, function and placement named here and in REV-005.

---

## §11 Governance statement

```text
Record type: ENGINEERING DECISION AMENDMENT (ED-DEC-004)

Findings resolved (engineering): R4-F1, R4-F2, R4-F3, R4-F4, R4-F5
Finding categories:              R4-F1..F4 engineering defect; R4-F5 engineering ambiguity; PO conflict: NONE
Product Owner dependencies:      NONE
PO decisions changed:            NO (K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4 unchanged)
ED-DEC-001/002/003:              preserved except the technical corrections in §4

PD-1: PENDING
Implementation authorized:       NO
Validation authorized:           NO
Provider calls authorized:       NO
External research authorized:    NO
Implementation performed:        NO
Tests modified:                  NO
Dependencies changed:            NO
Migrations / schemas changed:    NO
Commit / push:                   NO

Files created this round: 2 (this record, REV-005)
Existing records modified: 0
Next governance step: fresh independent / read-only conformance audit of REV-005
```
