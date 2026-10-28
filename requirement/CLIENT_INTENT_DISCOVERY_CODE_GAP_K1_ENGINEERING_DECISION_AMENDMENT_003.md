# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING DECISION AMENDMENT 003

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-003
**Date:** 2026-10-02
**Type:** Engineering decision amendment. Not a Product Owner decision, not an audit, not a specification revision,
**not an implementation authorization**.
**Author role:** Engineering specification owner, K1 workstream.
**Amends:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-001 (ED-DEC-001) as amended by
CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-DEC-002 (ED-DEC-002), **only** in the detector semantics named in §3.
Neither record is edited.
**Responds to:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-003-CONFORMANCE-AUDIT-001 ("AUDIT-R3"),
findings R3-F1 … R3-F7.
**Carried into:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-004 ("REV-004"), created in the same round.

> **PD-1: PENDING. Implementation authorized: NO.**

Abbreviations as in AUDIT-R3: K1-DEC (K1-R1..R3), K1I-DEC (K1-I1..I6), PG-DEC (PG-1..PG-4), REV-003, CONTRACT-REC,
ADAPTER-REC, OQ-DEC. `C` = detection copy. `W` = normalized business website domain. "E" = text placed in an evidence
statement (provider) or `quote` (intake).

---

## §1 Baseline (verified before writing)

| Check | Observed | Matches latest K1 record (AUDIT-R3 §1 / §3) |
|---|---|---|
| Branch | `feature/client-intent-discovery-complete` | Yes |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md`; 30 untracked files, all under `requirement/`; nothing outside `requirement/` | Yes (AUDIT-R3 added one record since its own baseline) |
| Code fingerprint (`git diff HEAD --binary -- . ':(exclude)requirement/'`, sha256) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty diff) | Yes |
| This record / REV-004 | did not exist | Yes |

Governing-record hashes (sha256, all files under `requirement/`):

| # | Record | File | sha256 | Match |
|---|---|---|---|---|
| 1 | PO-DEC (K1-B) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_PRODUCT_OWNER_DECISION.md` | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| 2 | K1-DEC (K1-R1..R3) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_RESIDUAL_PRODUCT_OWNER_DECISION.md` | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| 3 | K1I-DEC (K1-I1..I6) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_SEMANTICS_PRODUCT_OWNER_DECISION.md` | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes |
| 4 | PG-DEC (PG-1..PG-4) | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POLICY_GAPS_PRODUCT_OWNER_DECISION.md` | `448370f18b9d093e62fbb9c3463dd79631a0a352eb399dc97a1151ceee3bac5d` | Yes |
| 5 | ED-DEC-001 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION.md` | `96b30d8576734b8608869ccdb987df6a742e407f7d9956d855966aa8a56015eb` | Yes |
| 6 | ED-DEC-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_DECISION_AMENDMENT.md` | `b9c7aaa8af5e99b2c6e2cd74054eaa0f163944b8acb33a47edb3fdc805abefde` | Yes |
| 7 | REV-003 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_003.md` | `c3f42694d2b3a76d34fd9cd1118711103e0fe61bed4780e68c5f05c259e374bf` | Yes |
| 8 | AUDIT-R3 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_003_CONFORMANCE_AUDIT.md` | `a6b5e3da5c565002af8bcfd776bc01e9de1fb582bde2f170c6b91cfeadd92a0b` | First recorded here |
| 9 | AUDIT-001 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_CONFORMANCE_AUDIT.md` | `53c79c39a73fa522217a5805ddd73ec39a977741eedd4151ee7fe237f66d8b97` | Yes |
| 10 | REV-002 | `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION.md` | `666b965fb435330e1f4363b5ddf024c97a8ec5c0e5b4e2a8a11b54feabb51696` | Yes |
| 11 | DEC-003 | `INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md` | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| 12 | OQ-DEC (OQ-3, OQ-7, OQ-11) | `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| 13 | CONTRACT-REC | `INTENT_SOURCE_PROVIDER_CONTRACT_IMPLEMENTATION_RECORD.md` | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| 14 | ADAPTER-REC | `INTENT_SOURCE_ADAPTER_IMPLEMENTATION_RECORD.md` | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| 15 | READINESS-001 (PD-1) | `CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md` | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |
| 16 | REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |

PD-1 re-checked: READINESS-001 row PD-1 ("Whether to authorize implementation of any part of the provider-neutral
core"); no PD-1 decision record exists. **PD-1 PENDING.** Code facts CF-1 … CF-8 of AUDIT-R3 §3 are relied on as stated
there; no code was changed and no code fact is newly asserted by this record.

**Baseline: PASS.**

---

## §2 Purpose

This amendment exists **solely** to resolve findings R3-F1 … R3-F7 of AUDIT-R3 by fixing the engineering semantics of the
K1 detector. It decides how the detector implements already-decided policy; it decides no policy.

Minor findings R3-M1 … R3-M9 are **not** in scope. Three are necessarily touched because the corrections below cannot be
specified without them; §3.8 states exactly how. The rest are carried unchanged.

Governing principle applied to every finding (K1I-DEC §5 rule 3, §6; PG-DEC §3 band 2–3 and Consequence 3):

> **ED3-P (one reading suffices).** Where a string admits more than one reading and **any** admissible reading yields a
> plausible email or phone that is not *established* as something else, the detector reports that identifier.
> "Established" requires **content**: a recognized date, time, price, amount, unit quantity, version, network address,
> URL, specifically labelled reference number, or a source mask laid out within one number's extent (§3.1). The choice,
> presence, absence or quantity of separators, punctuation or whitespace never establishes anything by itself.

---

## §3 Finding-by-finding decisions

### 3.1 ED3-F1 — Mask sequences (R3-F1)

1. **Audit finding.** REV-003 §4.5 chains any length-≥ 2 mask sequence within ≤ 3 `SEP` of a run into the run and makes
   the whole run `FRAGMENT`. `**9876543210**`, `Call 98765 43210 **`, `*** 98765 43210 ***` and
   `98765 XXXXX 98765 43210` therefore escape although a complete number is visible.
2. **Governing policy.** K1-I3 r1 (complete identifier in any rendering → in scope), r2 (fragment = no complete number
   can be read, e.g. digits masked by the source), r3 (undetermined → K1-I4); K1-I4 (plausible and not established
   otherwise → personal); PG-1 band 3 and Consequence 2 (masked renderings must not by themselves trigger K1-B).
3. **Engineering problem.** `*` and `•` are both mask characters and ordinary typography (emphasis, footnote, bullet,
   rating). `x`/`X` has no typographic use next to digits. REV-003 treated all three alike and let one mask sequence
   neutralize every digit near it.
4. **Chosen rule.**
   - **Established mask** (the only kind that can make a candidate a fragment):
     - **M-x:** a letter token consisting only of `x` with length ≥ 2, inside a phone stretch (fused to digits or not);
     - **M-s:** a sequence of ≥ 2 `*` / `•` that is **interior** (a digit occurs on both sides of it within the same
       stretch) **and fused** (no character between it and a digit) on at least one side.
   - Every other mask-capable character is **typography**: single `*` / `•` / `x` anywhere; `*` / `•` sequences at the
     edge of a stretch (digits on one side only), fused or not; `*` / `•` sequences separated from digits on both sides.
     Typography is an ordinary stretch character (it neither adds nor removes digits).
   - **Positions** `P` of a stretch = its digits + the characters of its established masks.
   - **One-number extent:** a stretch with ≥ 1 established mask and `P ≤ L_max (15)` is one masked number →
     `FRAGMENT`. Visible digits are never re-evaluated alone.
   - **Multi-item stretch:** if `P > 15`, the established masks split the stretch into **segments**. A mask may *bind*
     to an adjacent segment only if `digits(segment) + length(mask) ≤ 15`. A mask fused to a segment binds it whenever
     admissible; a mask must bind at least one adjacent segment when any binding is admissible; a mask with no
     admissible binding binds nothing. A segment is **free** if, in some admissible assignment, no mask binds it. If any
     free segment is plausible (§4.7 of REV-004) → `PHONE`; else → `FRAGMENT`.
5. **Rejected alternatives.**
   - *"Visible digits alone plausible → not a fragment"* (AUDIT-R3 example). Rejected: `98765 43XXX` and
     `+91 98765 XXXXX` have 7 plausible visible digits; this would make policy-example masked numbers trigger K1-B,
     contrary to PG-1 Consequence 2.
   - *Markdown-pair recognizer only.* Rejected: does not cover unpaired footnote / rating asterisks
     (`Call 98765 43210 **`).
   - *Proximity bands (≤ 3 `SEP`).* Rejected: separator quantity would decide (R3-F5).
6. **Why policy is unchanged.** Genuine source masks laid out within one number's extent (`98765 43XXX`,
   `+91 98765 XXXXX`, `XXX-XX-0100`, `98•••43210`, `98XXX XX210`) stay `FRAGMENT` (K1-I3 r2, PG-1 band 3). Where
   masking is not established (`*` / `•` at an edge, which are routinely emphasis or footnote marks), the case is
   undetermined and K1-I3 r3 / K1-I4 direct the fail-closed result. The only outcomes that change move toward
   rejection on strings policy calls undetermined.
7. **Test implications.** New rows MK7–MK16 of REV-004 §9.1; REV-003 MK2 (`98765 43***`, `98765 43•••`) changes to
   `PHONE` and is restated; documented boundary rows `98765 43210 XXXXX` (`P = 15` → `FRAGMENT`) and
   `9876543210 XXXXXX` (`P = 16` → `PHONE`).

### 3.2 ED3-F2 — Single inserted characters (R3-F2)

1. **Audit finding.** `98765*43210`, `98x76543210`, `98765x43210`, `98765#43210`, `98765 x 43210` resolve to
   `FRAGMENT` or to two 5-digit runs; `98765 4x210` and `5550100x204` resolve to `PHONE`. Same uncertainty, opposite
   direction by digit position.
2. **Governing policy.** K1-I3 r1 ("a phone number … with inserted characters (personal)"), r3; K1-I4; PG-1 ("an
   extension neither makes nor unmakes a phone number"; extension alone → fragment).
3. **Engineering problem.** A single character between digits has up to three readings — inserted character,
   extension marker, one-digit mask — and REV-003 chose among them by position.
4. **Chosen rule.**
   - **Any single character between digits that is not a letter, and any single `x` token between digits, is
     always readable as an inserted character**: it is an ordinary stretch character and the digits on both sides
     belong to the same stretch. Under ED3-P, the inserted-character reading alone decides `PHONE` when plausible; the
     extension and mask readings can never turn a plausible inserted-character reading into "not a phone".
   - **Single mask characters are never masks** (ED3-F1); only established masks (≥ 2 characters) are.
   - **`#`** has exactly two roles: (i) designator inside a qualifying labelled-reference phrase (ED3-F4); (ii)
     otherwise an ordinary stretch character. It is never a mask, a separator with special effect, or a generic label.
   - **Word extension markers** (`ext`, `extn`, `extension`, optional `.` / `:`) are letters and therefore end a
     stretch; the base stretch is judged alone. Digits after a marker (1–6, not followed by a digit) with a base stretch
     ending ≤ 3 characters (whitespace, `,`, `-`, `(`) before the marker are extension digits of that base (no separate
     entry). Without a base: masked → `FRAGMENT`; `< 6` digits → `FRAGMENT` (extension alone); `≥ 6` → evaluated as an
     ordinary stretch.
   - **Glued `x` / `#` as extension markers** need no rule of their own: the joined (inserted) reading already contains
     every base digit, and the window rule (REV-004 §4.7) covers a base of whole groups when the joined count exceeds 15.
5. **Rejected alternatives.** Keeping the extension-context split (`98765x43210` → base `98765` → nothing): narrows
   K1-I3 r1. Treating every single letter between digits as inserted: rejected as a plausibility choice (alphanumeric
   codes such as `A12B34C56`); letters other than `x` (and `o` between digits, number-word step) end a stretch.
   This is the engineering definition of "plausibly" (K1I-DEC §6 last bullet) and is stated, not hidden.
6. **Why policy is unchanged.** K1-I3 r1 names inserted characters as in scope; K1-I4 resolves the remaining ambiguity
   toward privacy. Extension semantics (PG-1) are preserved: base judged; extension alone → `FRAGMENT`.
7. **Test implications.** REV-004 §9.2 rows IC1–IC10, EX1–EX10, HS1–HS4; REV-003 MK2 third example
   (`98765*43210`) and MK6 (`98x76543210`) change to `PHONE`.

### 3.3 ED3-F3 — Email candidate sequence and invalid forms (R3-F3)

1. **Audit finding.** When a located `@` candidate fails local or domain validation, REV-003 gives no outcome;
   `Email:jane@gmail.com`, `**jane@gmail.com**`, `jane@gmail.com—urgent`, `mailto:jane@gmail.com?subject=RFP` escape.
2. **Governing policy.** K1-R1 r1 (any form, incl. `mailto:`); K1-I3 r1, r3; K1-I4.
3. **Engineering problem.** Whole-token validation lets glued punctuation defeat a complete address; no fallback to
   K1-I4 exists for a candidate that is address-shaped but invalid.
4. **Chosen rule — fixed sequence for every `@` and every at-signal:**
   1. **Detection:** every literal `@` in `C` (incl. NFKC-folded `＠`, `﹫`) and every at-form (ED3-F6).
   2. **Normalization / extraction:** *local* = the maximal run of local-part characters `[\p{L}\p{N}._%+'-]`
      immediately before the at-signal, with leading / trailing `.` removed. *Domain side* = the maximal sequence after
      the at-signal of labels `[\p{L}\p{N}-]+` joined by dot-forms (ED3-F6). `mailto:` addresses end at `?`, `#`,
      whitespace or end; `,`-separated `mailto:` lists yield one candidate each. Glued punctuation and markup (`:`, `*`, `—`, `(`,
      `"` etc.) is therefore outside the extraction and cannot invalidate it.
   3. **Validation:** the **longest** prefix of the domain side that ends at a label boundary and satisfies
      `EMAIL_DOMAIN` (≥ 2 labels; label 1–63 chars, no leading / trailing `-`; final label ≥ 2 letters or
      `xn--…`; total ≤ 253).
   4. **Classification:** local non-empty and a valid prefix → §4.2 of REV-004 (`BUSINESS_EMAIL` / `PERSONAL_EMAIL`,
      `UNCERTAIN_EMAIL` if `normalizeDomain` fails).
   5. **Uncertainty:** local non-empty and **no** valid prefix:
      - every domain-side label numeric (`12.50`, `192.168.1.1`) → nothing (established amount / address);
      - a single label containing a letter (`jane@gmail`) → `UNCERTAIN_EMAIL` (K1-I3 r3 example);
      - ≥ 2 labels, at least one letter, still invalid (`gmail..com`, `gmail.c`, `-gmail.com`, over-long label) →
        `UNCERTAIN_EMAIL`;
      - empty domain side → `FRAGMENT` (`jane@`).
      Local empty: valid ≥ 2-label domain → `FRAGMENT` (`@gmail.com`); single label → nothing (handle `@acme`).
   6. **Rejection:** `PERSONAL_EMAIL` / `UNCERTAIN_EMAIL` trigger K1-B (and every email kind triggers in `context.*`,
      ED3-F7).
5. **Rejected alternatives.** Classifying every validation failure as `UNCERTAIN_EMAIL` without extraction: would
   reject `Email:info@example.com` (a business address) — over-capture that policy does not require. Treating invalid
   candidates as nothing: narrows K1-I4 (the finding).
6. **Why policy is unchanged.** Extraction only isolates the address the text already contains; failures that remain
   address-shaped go to K1-I4 fail-closed; only content (all-numeric host) establishes a non-email.
7. **Test implications.** REV-004 §9.5 rows EA1–EA12.

### 3.4 ED3-F4 — Reference-label exclusions (R3-F4)

1. **Audit finding.** Ordinary words (`order`, `case`, `account`, …) act as labels; `to order 98765 43210`,
   `In case 9876543210 is busy`, `WhatsApp Business account 9876543210` are excluded; a single-token rule consumes half
   of a spaced number.
2. **Governing policy.** K1I-DEC §6 ("evidently … a labelled reference number"); PG-DEC §3 (labels neither make nor
   unmake a phone number) and Consequence 3.
3. **Engineering problem.** The exclusion fired on the presence of a word, not on content establishing that the word
   labels a reference number.
4. **Chosen rule.** REV-003's label list is **partitioned, not extended**:
   - **Class R — reference-only labels** (no ordinary-prose meaning before a number): `ref`, `reference`, `rfp`,
     `rfq`, `rfi`, `eoi`, `nit`, `invoice`, `inv`, `po`, `sku`, `s/n`, `doi`, `reg`. Optional designator; any token
     containing a digit.
   - **Class S — shape-constrained labels:** `pin`, `pincode`, `pin code`, `postal code` (token exactly 6 digits, or
     `ddd ddd`); `zip`, `zip code` (`d{5}` or `d{5}-d{4}`); `isbn` (10 or 13 digits with optional `-` / space, last
     may be `x`); `issn` (`dddd-ddd[d|x]`); `gst`, `gstin` (`dd` + 5 letters + 4 digits + letter + alnum + `z` +
     alnum); `pan` (5 letters + 4 digits + letter); `tan` (4 letters + 5 digits + letter); `cin` (`[lu]` + 5 digits +
     2 letters + 4 digits + 3 letters + 6 digits). Token not matching the shape → no exclusion.
   - **Class O — ordinary-word labels:** `tender`, `bid`, `order`, `case`, `ticket`, `part`, `model`, `serial`, `lot`,
     `batch`, `contract`, `agreement`, `file`, `application`, `registration`, `account`, `a/c`. Excluded **only** with
     an explicit designator immediately after the label (≤ 1 whitespace): `no`, `no.`, `number`, `num.`, `#`, `id`,
     `ref`, `ref.`, or `:`.
   - **Token completeness (all classes):** the exclusion applies only if no further digit follows the token within the
     same raw stretch (before the next letter or consumed span). `Order No. 98765 43210` → not excluded.
   - Generic labels (`no`, `no.`, `number`, `#`, `id`) alone never exclude; contact words are not inputs.
5. **Rejected alternatives.** Removing ordinary-word labels entirely: would make `Order No. 4567890` and
   `Tender ID 12345678` plausible phones although content (label + designator) establishes a reference. Requiring
   designators for every label: needless over-capture of `Ref 2026/IT/0457`.
6. **Why policy is unchanged.** Exclusion now requires content that establishes a labelled reference number (PO's own
   example); bare words never suffice; formatting is not consulted.
7. **Test implications.** REV-004 §9.3 rows RL1–RL14.

### 3.5 ED3-F5 — Separators (R3-F5)

1. **Audit finding.** `/`, `,` and ≥ 4 whitespace characters end a run, so `98765/43210`, `98765,43210`,
   `98765    43210` are not phones while `98765-43210` is.
2. **Governing policy.** PG-DEC §3 ("presence or absence of `+`, separators, parentheses, labels … neither makes a
   string a phone number nor stops it being one"); Consequence 3; K1I-DEC §6.
3. **Engineering problem.** Candidate boundaries were defined by a separator whitelist and a separator count.
4. **Chosen rule.**
   - **Phone stretch:** a maximal substring of the number-word-converted copy containing at least one digit and no
     letter (other than `x` tokens, ED3-F1/F2) and no consumed span (URI, email, exclusion). **No character other than
     a letter, and no quantity of whitespace, ends a stretch.** Stretch boundaries are letters, consumed spans and text
     ends — content, not formatting.
   - **Groups** = maximal digit sequences; any non-digit character separates groups.
   - **`JOIN_NEAR`** (used only to *restrict* exclusions, never to end a stretch): two digit groups separated by ≤ 3
     characters containing no letter or digit, a whitespace run counting as one character. Unit and short-decimal
     exclusions apply only to a quantity token not `JOIN_NEAR` another group.
   - Dates, times, amounts with thousands grouping, versions and IPv4 remain excluded **by content** before stretches
     are formed (`02/10/2026` stays excluded; `98765/43210` does not match any content recognizer).
5. **Rejected alternatives.** Adding `/` and `,` to `SEP` while keeping a 3-character limit: the limit is still a
   formatting boundary (the finding's ≥ 4-space case). Unbounded joining but a line-break boundary: line breaks are
   formatting.
6. **Why policy is unchanged.** Every boundary now rests on content; this only widens detection (fail-closed). PG-DEC
   §3 accepts the resulting volume effect of the engineering envelope.
7. **Test implications.** REV-004 §9.4 rows SP1–SP16; REV-003 P21 / P22 change to `PHONE`; accepted over-capture rows
   (`12.50, 13.75`, `1920x1080`).

### 3.6 ED3-F6 — Email renderings (R3-F6)

1. **Audit finding.** `jane at gmail.com`, `[.]`, spaced dots and "at the rate" are not detected; one is labelled a
   "known limitation".
2. **Governing policy.** K1-I3 r1 (any rendering conveying a complete address), r2, r3; K1-I4.
3. **Engineering problem.** The word-at form forbade literal dots to avoid prose like `available at eprocure.gov.in`;
   several dot / at renderings were simply absent.
4. **Chosen rule.**
   - **At-forms:** A1 contiguous `@`; A2 literal `@` with whitespace (≤ 3) on one or both sides; A3 bracketed `[at]`,
     `(at)`, `{at}`, `<at>`, `[@]`, `(@)`, `{@}`, `<@>` (glued or ≤ 3 whitespace); A4 word forms `at`, `at the rate`,
     `at the rate of`, `at-the-rate`, `at-the-rate-of` (whitespace-delimited).
   - **Dot-forms ⟨DOT⟩ between labels:** literal `.` glued on both sides, or with whitespace on both sides
     (`gmail . com`), or with whitespace before only (`gmail .com`); `[.]`, `(.)`, `{.}`, `<.>`; word `dot`; `[dot]`,
     `(dot)`, `{dot}`, `<dot>`; ≤ 3 whitespace around bracketed / word forms. A literal `.` glued before and followed by
     whitespace (`gmail. Then`) is sentence punctuation and **ends** the domain side.
   - **Guards (content that establishes a non-email):**
     - *URL guard* (A2, A3, A4): first domain label `www`; domain side immediately followed by `/` or `:` + digit; or
       `://` before the local part.
     - *Price guard* (A2): `@` followed (≤ 1 whitespace) by a digit or a currency symbol / code from the price list.
     - *Handle guard* (A2): whitespace before `@`, glued label after, no ⟨DOT⟩ → nothing (`follow @acme`).
     - *Prose guard* (A2, A4): local token (lower-cased) in the closed list `available`, `availability`, `visit`,
       `visiting`, `visited`, `apply`, `applied`, `us`, `online`, `found`, `find`, `published`, `posted`, `listed`,
       `hosted`, `live`, `located`, `based`, `held`, `login`, `register`, `registered`, `submit`, `submitted`,
       `upload`, `uploaded`, `download`, `downloaded`, `accessible`, `access`, `here`, `there`, `website`, `site`,
       `portal`, `page`, `link`, `details`, `information`, `more`, `now`, `today` → nothing. Mailbox-like words
       (`info`, `contact`, `sales`, `support`, `admin`, `office`, `hr`, `careers`, `enquiry`, `orders`, `shop`) are
       deliberately **not** listed.
   - **Single-label (no ⟨DOT⟩) results:** A1 / A2 / A3 → `UNCERTAIN_EMAIL` (`jane@gmail`, `jane @ gmail`,
     `jane [at] gmail`); A4 → nothing (`jane at gmail`: the English word `at` is the only signal, so there is no address
     syntax to make the string plausible).
   - **Per-form classification under K1-I3:** see REV-004 §4.4.5 (complete → classify; fragment → `FRAGMENT`;
     uncertain → `UNCERTAIN_EMAIL`; ordinary text → nothing). No complete rendering is left as a "known limitation".
5. **Rejected alternatives.** Keeping `jane at gmail.com` as a documented limitation: narrows K1-I3 r1 (AUDIT-R3
   conditional PO path); not taken, so no PO acceptance is needed. Treating every `word at word.tld` as an email
   without a prose guard: would reject the most common tender-portal citation (`available at eprocure.gov.in`); the
   guard is content that establishes a sentence, per K1I-DEC §6 "established".
6. **Why policy is unchanged.** Every rendering that conveys a complete address is detected and classified exactly as
   the conventional form (K1-I3 r1); fragments stay fragments; undetermined forms go to K1-I4; only content guards
   establish "not an email".
7. **Test implications.** REV-004 §9.5 rows ER1–ER30; REV-003 EM10 (`jane @ gmail` → `UNCERTAIN_EMAIL`), EM11
   (→ `PERSONAL_EMAIL`), EM12 (`Book now @ www.example.in` → `[]`) change and are restated.

### 3.7 ED3-F7 — `context.*` net effect (R3-F7)

1. **Audit finding.** An obfuscated business email in `context.*` (`contact info [at] example [dot] com`) is not a K1
   trigger and does not match the CONTRACT-REC §3 regex → NORMALIZED, contrary to PG-DEC §4 "Net effect: no email address
   (business or personal) and no phone number may appear in a `context.*` value".
2. **Governing policy.** PG-2 (free text; K1-B applies; existing screen retained, not weakened; the net-effect sentence).
3. **Engineering problem.** The provider helper used the evidence predicate (personal kinds only) for `context.*`.
4. **Chosen rule.** The net-effect sentence is read as **operative** (it is stated in the Decision block of PG-DEC §4,
   not in the rationale). The provider K1 helper applies a second predicate to `context.targetCustomer`,
   `context.geography` and `context.service`:
   `containsAnyContactIdentifier(text, website)` = any of `BUSINESS_EMAIL`, `PERSONAL_EMAIL`, `UNCERTAIN_EMAIL`,
   `PHONE` from the **same** `detectContactIdentifiers`. Hit → `reject(path, 'not-allowed', '<path> contains a contact
   identifier — context values must not contain email addresses or phone numbers')`. The existing CONTRACT-REC §3 screen
   is unchanged and still runs first (so a contiguous email keeps its existing field / message). `FRAGMENT` is not a
   trigger (K1-I3 r2: a fragment is not an address).
5. **Rejected alternative.** Reading the sentence as descriptive and leaving obfuscated business email allowed: would
   require a PO clarification (AUDIT-R3 conditional path); not taken.
6. **Why policy is unchanged.** Implements the PO's stated outcome; adds screening, removes nothing; detector semantics
   are identical for evidence, `quote` and `context.*` — only the trigger set differs, as PG-2 itself specifies.
   Intake carries no `context.*` (PG-4: `quote` is the only intake free-text field), so provider / intake equivalence
   for evidence ↔ `quote` is unaffected.
7. **Test implications.** REV-004 §9.6 rows CX1–CX8 for each of the three fields.

### 3.8 Items necessarily touched (no separate decision)

| Item | Why touched | Disposition in REV-004 |
|---|---|---|
| R3-M2 (rows by reference only) | REV-004 must be self-contained | All C / X / I / R rows are written out; missing rows added (name alone, name + business email, phone + business email, business-only multiple emails, masked + complete phone, `snippet`, pulled `title` / `basis`) |
| R3-M4 (Step 4 needs Step 5 runs) | ED3-F4 / F5 redefine both steps | Exclusion conditions use only raw stretches and `JOIN_NEAR`, defined before Step 4 |
| R3-M8 (E-c glue) | ED3-F6 redefines at- and dot-forms | Glue / whitespace stated for every form |
| R3-M1 (`www.` strip) | REV-004 must state canonicalization | Existing `normalizeDomain` behaviour stated; one row added; no rule change |

R3-M3, R3-M5, R3-M6, R3-M7, R3-M9 are carried unchanged (REV-004 §10).

---

## §4 Policy boundary

> **This amendment does not modify K1-I1–K1-I6, PG-1–PG-4, or any other Product Owner decision.**

K1-B, K1-R1..R3, OQ-3, OQ-7, OQ-11, DEC-003, PD-1..PD-12 are likewise untouched. CONTRACT-REC §3 and every existing
screen keep their behaviour and position.

## §5 Product Owner dependencies

**NONE.**

Independent verification of AUDIT-R3's claim that R3-F1 … R3-F7 are engineering-resolvable:

| Finding | Two materially different policy outcomes left open by the governing records? | Result |
|---|---|---|
| R3-F1 | No — K1-I3 r2 fixes masked → fragment; r3 / K1-I4 fix undetermined → reject; "established" is delegated (K1I-DEC §6) | Engineering |
| R3-F2 | No — K1-I3 r1 names inserted characters; PG-1 fixes extension semantics | Engineering |
| R3-F3 | No — K1-R1 r1 "any form"; K1-I4 fail-closed | Engineering |
| R3-F4 | No — K1I-DEC §6 "labelled reference number"; PG-DEC §3 labels never decide | Engineering |
| R3-F5 | No — PG-DEC §3 separators never decide | Engineering |
| R3-F6 | No, **because** no complete rendering is retained as a false negative (the conditional PO path is not entered) | Engineering |
| R3-F7 | No, **because** the PO's net-effect sentence is implemented as written (the conditional PO path is not entered) | Engineering |

## §6 Implementation boundary

- Implementation **not authorized**; PD-1 **unchanged (PENDING)**.
- No code changes; no test-file changes; no dependency, package-manifest or lockfile changes; no schema or migration
  changes; no API / contract / UI changes; no provider calls; no validation; no participant contact; no external
  research; no commit; no push.
- `SPECIFICATION — NOT CURRENT IMPLEMENTATION` applies to every file, function and placement named here and in REV-004.

## §7 Test obligations (specification only — no test written)

`W = example.com`. Kinds = `detectContactIdentifiers`; outcome = provider `normalizeProviderResult` status / intake
`toIntentIntakeInput` result. Full matrix: REV-004 §9.

| Finding | Input in E (unless stated) | Kinds | Provider / intake |
|---|---|---|---|
| F1 | `**9876543210**` | `PHONE` | REJECTED / rejected |
| F1 | `Call 98765 43210 **`; `*** 98765 43210 ***` | `PHONE` | REJECTED / rejected |
| F1 | `98765 XXXXX 98765 43210` | `PHONE` | REJECTED / rejected |
| F1 | `98765 43XXX 98765 43210` (masked + complete, one stretch) | `PHONE` | REJECTED / rejected |
| F1 | `98765 43XXX`; `+91 98765 XXXXX`; `XXX-XX-0100`; `98•••43210` | `FRAGMENT` | NORMALIZED / accepted |
| F1 | `98765 43***`; `98765 43•••` (edge `*` / `•`, undetermined) | `PHONE` | REJECTED / rejected |
| F1 | `98765 43210 XXXXX` (`P = 15`) / `9876543210 XXXXXX` (`P = 16`) | `FRAGMENT` / `PHONE` | NORMALIZED / REJECTED |
| F2 | `98765*43210`; `98765x43210`; `98765#43210`; `98x76543210`; `98765 x 43210` | `PHONE` | REJECTED / rejected |
| F2 | `5550100x204`; `5550100 ext 204` | `PHONE` | REJECTED / rejected |
| F2 | `ext 204` (no base) | `FRAGMENT` | NORMALIZED / accepted |
| F2 | `98765**43210` (interior fused 2-char mask, `P = 12`) | `FRAGMENT` | NORMALIZED / accepted |
| F3 | `Email:jane@gmail.com`; `**jane@gmail.com**`; `jane@gmail.com—urgent`; `_jane@gmail.com_` | `PERSONAL_EMAIL` | REJECTED / rejected |
| F3 | `mailto:jane@gmail.com?subject=RFP` | `PERSONAL_EMAIL` | REJECTED / rejected |
| F3 | `Email:info@example.com`; `mailto:info@example.com?subject=RFP` | `BUSINESS_EMAIL` | NORMALIZED / accepted |
| F3 | `jane@gmail..com`; `jane@gmail.c` | `UNCERTAIN_EMAIL` | REJECTED / rejected |
| F3 | `qty@12.50`; `admin@192.168.1.1` | `[]` | NORMALIZED / accepted |
| F4 | `to order 98765 43210`; `WhatsApp to order 9876543210`; `In case 9876543210 is busy`; `WhatsApp Business account 9876543210` | `PHONE` | REJECTED / rejected |
| F4 | `Order No. 98765 43210`; `PIN 9876543210` | `PHONE` | REJECTED / rejected |
| F4 | `Order #12345678`; `Tender ID 12345678`; `RFP No. 2026/IT/0457`; `PIN 411001`; `ISBN 978-81-203-1234-5` | `[]` | NORMALIZED / accepted |
| F5 | `98765/43210`; `98765,43210`; `98765    43210`; `98765·43210`; `98765_43210` | `PHONE` | REJECTED / rejected |
| F5 | `02/10/2026`; `9,876,543` | `[]` | NORMALIZED / accepted |
| F6 | `jane at gmail.com`; `jane[at]gmail[.]com`; `jane (at) gmail (.) com`; `jane @ gmail . com`; `jane at the rate gmail dot com` | `PERSONAL_EMAIL` | REJECTED / rejected |
| F6 | `available at eprocure.gov.in`; `visit us at www.example.com`; `Book now @ www.example.in`; `jane at gmail` | `[]` | NORMALIZED / accepted |
| F6 | `jane @ gmail`; `jane [at] gmail` | `UNCERTAIN_EMAIL` | REJECTED / rejected |
| F7 | `context.service = "contact info [at] example [dot] com"` (each of the three fields) | `BUSINESS_EMAIL` | REJECTED, `field = context.<name>` / — |
| F7 | `context.geography = "Pune, India"` | `[]` | NORMALIZED / — |

---

## §8 Governance statement

```text
Record type: ENGINEERING DECISION AMENDMENT (ED-DEC-003)

Findings resolved (engineering): R3-F1, R3-F2, R3-F3, R3-F4, R3-F5, R3-F6, R3-F7
Product Owner dependencies:      NONE
PO decisions changed:            NO (K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4 unchanged)

PD-1: PENDING
Implementation authorized:       NO
Implementation performed:        NO
Tests modified:                  NO
Dependencies changed:            NO
Migrations / schemas changed:    NO
Provider calls:                  NO
External research:               NO
Validation:                      NO
Participant contact:             NO
Commit / push:                   NO

Files created this round: 2 (this record, REV-004)
Existing records modified: 0
```
