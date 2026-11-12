# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION REVISION 005 — CONFORMANCE AUDIT

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-REV-005-CONFORMANCE-AUDIT-001
**Date:** 2026-10-02
**Type:** Fresh, independent, **read-only** conformance audit. Not a Product Owner decision, not an engineering
decision amendment, not an implementation authorization.
**Author role:** Independent auditor (separate pass from the author of REV-005 / ED-DEC-004, same assistant family —
see §12 Independence limitation).

---

## §1 Baseline (as supplied and spot-checked)

| Check | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Working tree | only files under `requirement/` modified/untracked; no code/schema/migration/config file touched (re-confirmed: `git status --porcelain` at audit start showed only `requirement/` entries) |
| sha256 `…K1_ENGINEERING_DECISION_AMENDMENT_004.md` | `c5b0b364dc630ff258570073c564935e31720a1cd59b98f66be281327f311295` — MATCHES expected |
| sha256 `…K1_ENGINEERING_SPECIFICATION_REVISION_005.md` | `cec9fde59c27215beeeae9ac93ef1d3e6026ac80efa1f58ef4cf70e76bb44f5f` — MATCHES expected |
| sha256 `…K1_ENGINEERING_SPECIFICATION_REVISION_004_CONFORMANCE_AUDIT.md` | `1fa6f241aa5176a14d84f775146a3f17e5ece1dfbb0c623c770abc8d27a289c2` — recorded (not independently pre-verified against an external expected value; matches the value REV-005 §Lineage and ED-DEC-004 §1 both cite) |

Baseline accepted; proceeded per task instructions.

---

## §2 Governing records read independently for this audit

Read in full: REV-005, ED-DEC-004. Read in full or targeted sections: AUDIT-R4
(`…REVISION_004_CONFORMANCE_AUDIT.md`), `…K1_POLICY_GAPS_PRODUCT_OWNER_DECISION.md` (PG-1..PG-4, §3–§6 and the
reconciliation table). Not re-read in full (already summarized faithfully and consistently in REV-005 §2 and
ED-DEC-004, cross-checked against the PG decision text itself rather than trusted blind): K1-B, K1-R1..R3, K1-I1..I6,
DEC-003, REV-003, REV-004 (content compared only where REV-005 claims an unchanged row).

Source code read for §9/§10 of this audit: `packages/core-research/src/intentSignal.ts`,
`packages/core-research/src/intentSourceProviderContract.ts`,
`packages/core-research/src/intentSourceProviderContract.test.ts` (lines ~520–590, incl. line 578).
`grep` confirmed **no file named `contactIdentifiers.ts`** and no symbol `detectContactIdentifiers` /
`containsPersonalContactIdentifier` / `containsAnyContactIdentifier` exists anywhere under `packages/`. Current code
uses only the existing `isPersonalContactIdentifier` regex-based screen (`intentSignal.ts`).

No application code, test, schema, migration, dependency or configuration file was modified. No detector or rule was
implemented. No provider/API call was made. No external research was performed.

---

## §3 Methodology

1. Read REV-005 as a self-contained document (not relying on REV-003/004) and checked, for the 35 items in the task's
   checklist, whether REV-005 itself states the rule.
2. For R4-F1 … R4-F5, derived outcomes **independently** from the formal §4 rules (gap classes, cluster/segment/core
   definitions, E-1…E-5 precedence, the labelled-reference-number construction) for every input listed in the task and
   cross-checked the derivation against REV-005's own worked tables (§4.6.10, §10) — the tables were used only to
   compare against an independently computed result, not accepted on their prose claim alone (per C-6).
3. Sampled the full §10 lifecycle/test matrix across every subsection (10.1–10.9): every row in 10.2–10.5a and 10.6–10.9
   was read; 10.1 (34 rows) and 10.3 (25 rows) were re-derived in full given they carry the R4-F1/R4-F5 and R4-F4
   findings; 10.7/10.8 were read in full (short sections). Full literal re-derivation of all ~230 rows in one pass was
   not attempted at this effort level; §12 states this as a scope limitation. No contradiction was found in any row
   read.
4. Compared REV-005 §2 (condensed policy) word-for-word against the PG decision record's own §3–§6 operative sentences
   and its §7 reconciliation table, rather than accepting REV-005's self-description.
5. Traced the provider/intake equivalence claim (§9) against actual current source, noting throughout that REV-005 is
   explicitly `SPECIFICATION — NOT CURRENT IMPLEMENTATION` — the K1 detector does not exist in code yet, so the
   equivalence claim is a claim about the *specification's own internal consistency* (does the provider lifecycle §6
   and intake lifecycle §7 as specified apply the same detector to the same inputs?), not a claim that can be
   confirmed by running code. Where REV-005 does reference present-day code facts (e.g. the existing trim behaviour,
   the line-578 test, the absence of a `contactIdentifiers.ts` module), those references were checked against the
   actual files and found accurate.

---

## §4 Self-containedness — 35-item checklist

| # | Item | REV-005 section | Present and sufficient? |
|---|---|---|---|
| 1 | Domain canonicalization | §4.2 | Yes |
| 2 | Website/business-domain determination | §4.2 | Yes |
| 3 | Business vs personal email classification | §4.2, §4.4.4 | Yes |
| 4 | Contiguous email detection | §4.4.1–§4.4.5 (A1) | Yes |
| 5 | Obfuscated email detection | §4.4.1 (A2–A4) | Yes |
| 6 | Uncertain email handling | §4.4.4 E-5 | Yes |
| 7 | Phone detection | §4.6–§4.7 | Yes |
| 8 | Local/national/international phone handling | §4.7 (no dialing-prefix input), PG-1 (§2) | Yes — "formatting ... never decide" carried verbatim |
| 9 | Separators | §4.6.1, §4.6.5 (gap classes) | Yes |
| 10 | Inserted characters | §4.6.2 | Yes |
| 11 | Extensions | §4.6.9 | Yes |
| 12 | Masks | §4.6.3–§4.6.6 | Yes |
| 13 | Fragments | §4.4.4 E-3/E-5, §4.6.6 U1/U3, §4.6.9.3 | Yes |
| 14 | Incomplete identifiers | §4.4.5, §4.6.6 | Yes |
| 15 | Uncertain strings | §4.4.4 E-5, §4.6.6 U4 | Yes |
| 16 | Dates | §4.8 item 1 | Yes |
| 17 | Times | §4.8 item 1 | Yes |
| 18 | Prices/amounts | §4.8 item 2 | Yes |
| 19 | Units | §4.8 item 3 | Yes |
| 20 | Reference numbers | §4.8 item 5 | Yes |
| 21 | Versions | §4.8 item 4 | Yes |
| 22 | IPv4 | §4.8 item 4 | Yes |
| 23 | Ordinary prose | §4.4.4 E-2 prose list, §4.11(a) | Yes |
| 24 | URLs/social handles | §4.4.4 E-2 URL guard, §4.11(a) `follow @acme.design` | Yes |
| 25 | Unicode normalization | §4.3 steps 1–2 | Yes |
| 26 | Unicode digit handling | §4.3 step 3 | Yes |
| 27 | `context.*` | §4.1, §5, §6, §10.6 | Yes |
| 28 | Transient fields | §5, PG-3 | Yes |
| 29 | Provider lifecycle | §6 | Yes |
| 30 | Intake lifecycle | §7 | Yes |
| 31 | Rejection propagation | §8 | Yes |
| 32 | Rejection reason/message | §8 | Yes |
| 33 | Processing order | §4.4 Steps 0–5 | Yes |
| 34 | Detector categories | §4.1 | Yes |
| 35 | Provider/intake equivalence | §9 | Yes, with the permitted-difference list explicit |

**Result: no missing definition found.** REV-005 is self-contained for all 35 items — an implementer does not need to
consult REV-002/003/004 to build any rule (REV-005 restates every numeric constant: `L_min=6`, `L_max=15`,
`L_cvn=10`, the prose list, the designator list, the unit list, the construction grammar).

---

## §5 R4-F1 — complete visible phone + masks (independently derived)

Derivation performed from §4.6.1–§4.6.10 directly (gap classes → elements → clusters/segments/core → U1–U4), not from
REV-005's own table, then compared:

| Input | Independently derived | REV-005 §4.6.10 / §10.1 | Match |
|---|---|---|---|
| `Call **9876543210** 24x7` | `**` is opener/closer pair (digit-adjacent both sides fails closer/opener flank tests — before `**`: start-of-run char is `l` (non-ws, non-punct) so NOT an opener per the flank test (`l` is `\p{L}`); after first `**`: digit — opener test requires char before to be ws/start/punct, here it's `l`, a letter → fails opener; closer test similarly fails since preceding char for the first run is a letter not matching "neither whitespace nor start" exclusion... Re-check: actually in `Call **9876543210**`, the char before the first `**` is a space (after "Call"), which **is** whitespace → satisfies opener's "before" condition; char after is `9` (digit) → satisfies opener's "after is neither whitespace nor end" → **is an opener**. Second `**`: char before is `0` (non-ws) → satisfies closer's "before" condition; char after is space → satisfies closer's "after" condition → **is a closer**, same length (2) → matched. Both become typography, not masks. `x` in `24x7` is a length-1 x-token between two digits → inserted character. Phone stretch digits: `9876543210` (10) + inserted `x` contributes no digit + `24`...`7` are a separate stretch (space before `24` not digit-adjacent to `9876543210**`, separated by whitespace which is tight, but `**` typography doesn't end a stretch — need to check: is `24x7` part of the same stretch as `9876543210`? Between `**` (end of second run) and `24` there is a space — tight, joins the *stretch* (stretches are only ended by letters/consumed spans, never by any punctuation/whitespace amount). So the full phone stretch is `9876543210** 24x7`). No established mask in this stretch (both `**` runs are typography) → single remainder piece, evaluated by §4.7 on all its digits: `9876543210` + `24` + `7` = 13 digits → within `[6,15]` → `PHONE`. | `PHONE` | **Match** |
| `**98765 43210**, **98765 43211**` | Both `**` pairs match (same reasoning: start-of-text/comma-adjacent flanks qualify as opener/closer) → typography. Two separate phone stretches split by the loose `, ` (comma+space contains a comma → loose, but loose only stops *mask units*, not stretches — stretches are ended only by letters/consumed spans). So both numbers are in one stretch (no letter between them), with the "typography" `**`s and the `, ` as ordinary stretch characters. No established mask → one remainder piece spanning all digits: `9876543210` + `9876543211` = 20 digits, `n>15` → apply the window rule: a contiguous window of whole groups with digit count in `[6,15]` exists (e.g. `98765 43210` = 10) → `PHONE`. | `PHONE` | **Match** |
| `98765 43210 / 98XXX XXXXX` | `/` with spaces on both sides is a loose gap (contains `/`) → does not join a mask unit, but (being punctuation, not a letter) does not end the phone stretch either. Left number `98765 43210` (10 digits, no mask) sits in the same stretch as `98xxx xxxxx` (one mask unit: `98` fused to `xxx` [core empty, cluster fused left], tight to `xxxxx` fused... per REV-005's own worked table: unit `98xxx xxxxx`, core empty, `P=10` → U3 → `FRAGMENT`). Remainder = everything in the stretch outside the unit span = `98765 43210 / ` → 10 digits → `PHONE`. Two entries. | `PHONE`, `FRAGMENT` | **Match** |
| `555-0100, 555-01XX` | `, ` is loose → ends the mask unit at that boundary (not the stretch). Right-hand unit `555-01xx`: elements `555` tight `01` fused `xx`; cluster fused to segment on the right → core = segment minus last group = `555` (3 digits); `P = 3+2+2 = 7` → U3 → `FRAGMENT`. Remainder = `555-0100, ` → `5550100` = 7 digits → `PHONE`. | `PHONE`, `FRAGMENT` | **Match** |
| `98765 43210 XXXXX` | Derived above (§ intro of this section) — core 10 → U2 → `PHONE`. | `PHONE` | **Match** |
| `9876543210 XXX XXX` | Derived above — cluster length 6 (two masks, no group between), core 10 (cluster not fused to the single group, gap is tight not fused) → U2 → `PHONE`. | `PHONE` | **Match** |
| `98765 43XXX` | Derived above — cluster fused to segment on the right, core = `98765` (5) → `P=10` → U3 → `FRAGMENT`. | `FRAGMENT` | **Match** |

**Distinguishing A–E (independently confirmed):**
- **A. Complete visible phone** (`Call **9876543210** 24x7`, both strings in `**98765 43210**, **98765 43211**`,
  `9876543210` in the `/`-split input, `555-0100` segment) — all correctly reach `PHONE` via either the U2/CVN rule or
  the remainder-piece window rule. **Distinguished correctly.**
- **B. Genuinely masked phone** (`98765 43XXX`, the `98xxx xxxxx` unit, the `555-01xx` unit) — all correctly reach
  `FRAGMENT` via U3 because no segment's core reaches the 10-digit CVN threshold. **Distinguished correctly.**
- **C. A mask belonging to a different phone** — the loose-gap rule (`, `, ` / `) correctly prevents a mask unit from
  reaching across to a visible number that is not part of it; the mask unit's span is confined to its own
  fused/inserted/tight chain. **Distinguished correctly.**
- **D. Markdown/bold punctuation** — the emphasis-pairing algorithm (opener/closer by flanking character, nearest
  unmatched same-length opener) correctly removes matched `**...**` pairs from mask-candidacy before M-s is ever
  evaluated, so `Call **9876543210**` is never read as a masked number. **Distinguished correctly.**
- **E. Two adjacent but separate candidates** — loose gaps (`/`, `,`) correctly yield two entries (one `PHONE`, one
  `FRAGMENT` or two `PHONE`s), never merged into one judgment. **Distinguished correctly.**

**R4-F1 result: the written rules in REV-005 §4.6 do produce the outcomes REV-005 claims, for every input listed in
the task, independently re-derived from first principles rather than accepted on REV-005's prose.** `L_cvn = 10` is
applied consistently (no example where it silently shifts). No contradiction found.

---

## §6 R4-F2 — email vs time/price precedence (independently derived)

| Input | E-1..E-5 trace | Result | REV-005 claim | Match |
|---|---|---|---|---|
| `Pre-bid meeting at 11.30am` | A4 candidate, local=`meeting`; domain side `11.30am` → final label `30am` has digits → invalid under `EMAIL_DOMAIN` (final label must be pure `\p{L}` or `xn--`); 1-label prefix fails minimum-2-labels rule → no valid prefix (E-3 fails) → E-4 CG-2: §4.8 item 1 time pattern `\d{1,2}(\.\d{2})?\s?(am\|pm)` matches `11.30am` at the first domain-side character → guard fires → nothing | `[]` | `[]` NORMALIZED/accepted (EP1) | **Match** |
| `supply at Rs.500` | A4, domain side `rs.500` → `.` here is a literal dot with no letter on the right-adjacent label boundary issue — "Rs" + "." + "500": checked as ⟨DOT⟩-joined labels `rs`,`500`; final label `500` numeric → invalid (E-3 fails) → E-4 CG-1: text after `at` begins (≤1 ws) with currency word `rs` immediately followed by non-letter (`.`) → fires → nothing | `[]` | `[]` NORMALIZED/accepted (EP2) | **Match** |
| `jane at gmail.com` | A4, domain side `gmail.com`, 2 valid labels, final `com` pure letters ≥2 → valid prefix → E-3 classifies by §4.2 (W=example.com in fixture ≠ gmail.com) → `PERSONAL_EMAIL` → **stop before any guard runs** | `PERSONAL_EMAIL` | `PERSONAL_EMAIL` REJECTED/rejected (EP4, ER7) | **Match** — confirms a complete valid email is never hidden by a later guard, because E-3 precedes E-4 unconditionally |
| `jane @ example.com` | A2, valid prefix `example.com` (W=example.com) → E-3 → `BUSINESS_EMAIL`, stop | `BUSINESS_EMAIL` | `BUSINESS_EMAIL` NORMALIZED/accepted (EP5) | **Match** |
| `available at eprocure.gov.in` | A4, local=`available` — in the Prose list (§4.4.4) → **E-2 prose guard fires before E-3 is even attempted** → nothing | `[]` | `[]` NORMALIZED/accepted (ER25) | **Match** — ordinary prose cannot accidentally become an email because E-2 runs before E-3 |
| `Tenders at eprocure.gov.in` | A4, local=`Tenders` — **not** in the prose list (list contains `visit`, `available`, etc. but not `tenders`) → E-2 does not fire → domain side `eprocure.gov.in`, 3 valid labels, final `in` pure letters → valid prefix → E-3 → `PERSONAL_EMAIL` (W≠eprocure.gov.in) | `PERSONAL_EMAIL` | `PERSONAL_EMAIL` REJECTED/rejected (ER29, §4.11(a) listed open over-capture) | **Match** — and REV-005 is explicit that this is a recorded, accepted over-capture, not a silent inconsistency |
| `rate @ 12.50` | A2, domain side `12.50` → labels `12`,`50`, final numeric → invalid (E-3 fails) → E-4 CG-3 (every label all-digit) fires → nothing | `[]` | `[]` NORMALIZED/accepted (EP9, ER27) | **Match** |

**Can a complete valid email be hidden by a time/price recognizer?** No — E-3 (valid-prefix check) is unconditionally
evaluated before E-4 (content guards); E-4 is gated on "only when no valid prefix exists." This was verified
structurally in §4.4.4's table ("the first step that yields a result decides," E-3 before E-4) and confirmed on every
sampled input above, including the adversarial `jane at gmail.com` case where "gmail.com" is a valid prefix despite
superficially resembling prose.

**Can ordinary prose accidentally become an email?** Only in the single recorded, open residual class
(non-prose-listed local token + alphabetic-final domain-shaped text, e.g. `Tenders at eprocure.gov.in`,
`workshop at St.Xavier's`) — and REV-005 §4.11(a) lists this explicitly as an accepted fail-closed over-capture under
K1-I4/PG-1's volume-acceptance, not a silent defect.

**Determinism:** E-1…E-5 is a strict first-match-wins ladder with no two steps capable of firing on the same
candidate; order is fixed per candidate independent of which candidate is processed first (§4.10: "Entry order is not
significant"). **Deterministic.**

**R4-F2 result: confirmed — the E-1…E-5 precedence, independently traced, produces the claimed result for every
listed input, and a complete valid email cannot be hidden by a time/price guard.**

---

## §7 R4-F3 — spaced email vs price guard (independently derived)

| Input | Trace | Result | Match |
|---|---|---|---|
| `jane @ 163.com` | A2, domain `163.com`: label1 `163` (non-final, numeric — allowed), label2 `com` (final, pure letters ≥2) → **valid** `EMAIL_DOMAIN` prefix → E-3 fires before any digit/price guard is reached → `PERSONAL_EMAIL` (W≠163.com in default fixture) | `PERSONAL_EMAIL` | **Match** (EP7) |
| `jane @ example.com` | valid prefix, W=example.com → `BUSINESS_EMAIL` | `BUSINESS_EMAIL` | **Match** (EP5) |
| `info @ example.com` | same | `BUSINESS_EMAIL` | **Match** |
| representative prices (`rate @ 12.50`, `rate @ Rs.500`, `price @ 12.5k`) | domain sides `12.50` (both labels numeric → CG-3), `rs.500`→`500` final numeric, no valid prefix→CG-1 fires on `rs`, `12.5k` → final label `5k` mixed, not pure letters → invalid → CG-4 (A2, first label `12` begins with digit) fires | `[]` each | **Match** (EP9) |
| representative amounts (same category) | as above | `[]` | **Match** |
| invalid numeric-domain email-looking strings (`jane @ 163`, `jane@163`, `jane @ 16.45`, `jane@1.2.3.4`, `jane @ 12.50`) | `163` = 1 label, fails ≥2-label minimum; `16.45` final numeric; `1.2.3.4` final numeric (also matches IPv4 CG-2 item 4); `12.50` both numeric — none has a valid prefix, and each is caught by a content guard (CG-2 IPv4/CG-3/CG-4) or falls through E-5's "single label, no letter" branch (`jane@163` → domain single label `163`, **no letter present** → the E-5 table's "single label containing a letter" row does not match since `163` has no letter → falls to no row → nothing, consistent with "numeric host" row in §4.4.5) | `[]` each | **Match** (EP10) |

**Verification of the three required properties:**
- **Valid email interpretation wins where required:** confirmed — E-3 (valid prefix) always precedes E-4 guards;
  `jane @ 163.com` is never excluded by a digit-after-`@` heuristic because no such raw heuristic exists in REV-005 —
  the only "guard" checks are CG-1..CG-4, all gated behind "no valid prefix exists," and `163.com` *has* a valid
  prefix.
- **Invalid email domains do not create false emails:** confirmed — `EMAIL_DOMAIN`'s "final label must be pure
  letters (or `xn--`) and ≥2 characters" rule, combined with CG-2/CG-3/CG-4, excludes every numeric-domain case tested
  (`163`, `16.45`, `1.2.3.4`, `12.50`) from ever producing an email kind.
- **Price guards cannot silently suppress a valid complete identifier:** confirmed by construction — CG-1..CG-4 are
  syntactically unreachable (`E-4` begins "only when no valid prefix exists") whenever E-3 would have matched.
- **Deterministic:** yes, same first-match-wins ladder as §6.

**R4-F3 result: confirmed by independent derivation.**

---

## §8 R4-F4 — ordinary labels (independently derived)

Construction grammar (§4.8 item 5): `LABEL [GAP_L DESIGNATOR] GAP_T TOKEN`, where for Class O (`tender`, `bid`,
`order`, `account`, `reference`, …) the bracketed `GAP_L DESIGNATOR` is **required**, and `:` is defined as "never a
designator," only a `GAP_T` connector character.

| Input | Trace | Result | Match |
|---|---|---|---|
| `To order: 9876543210` | LABEL=`order` (Class O), no designator token (`:` is not a designator) between `order` and the number → required designator missing → construction fails → number not excluded → plausibility (§4.7) on `9876543210` (10 digits) → `PHONE` | `PHONE` | **Match** (RL17) |
| `Business account: 9876543210` | LABEL=`account` (Class O), same reasoning, no designator → fails → `PHONE` | `PHONE` | **Match** (RL18) |
| `Order: 12345678` | same reasoning → `PHONE` (8 digits, within `[6,15]`) | `PHONE` | **Match** (RL2b, explicitly flagged as Δ rev.4) |
| `No. 9876543210` | `No.` is a **generic designator alone** (no preceding Class O/R/S label) → "generic designators alone … never exclude" → `PHONE` | `PHONE` | **Match** (RL10) |
| `ID 9876543210` | generic designator alone → `PHONE` | `PHONE` | **Match** (RL11) |
| `#9876543210` | `#` generic, no preceding label → `PHONE` | `PHONE` | **Match** (RL/HS4) |
| `Tender No. 9876543210` | LABEL=`tender` (Class O) + GAP_L=` ` + DESIGNATOR=`no.` (lexical) + GAP_T=` ` + TOKEN=`9876543210` (whitespace-free, all digits, no further digit follows in the stretch) → **complete construction** → excluded | `[]` | **Match** (RL20) |
| legitimate PIN/ISBN/GSTIN examples | Class S, shape-checked independent of designator (`PIN 411001` → 6-digit shape matches) → excluded | `[]` | **Match** (RL4) |

**Can an ordinary lexical word plus `:` hide a phone?** No — confirmed: `:` is explicitly excluded from the
`DESIGNATOR` production (`DESIGNATOR := no | no. | number | num. | # | id | ref | ref.`) and is only legal inside
`GAP_T` as a connector *after* a designator or after a Class R/S label, never as a substitute for one. A Class O
label followed only by `:` has no designator and the construction fails by grammar, independently confirmed by
re-parsing every RL1x/RL2x row.

**"Specific reference label" definition:** precise — a label from one of three closed classes (R/S/O), each with its
own designator/shape requirement, combined via a formal grammar with explicit gap-width and token-completeness rules.
Not open to engineer interpretation on the sampled inputs.

**Is the `reference` reclassification consistently applied?** Checked: `reference` appears in Class O's list in
§4.8 item 5 and is explicitly absent from Class R's list (`ref`, `rfp`, `rfq`, …, which keeps the abbreviation `ref`
only). RL22 (`For reference 9876543210`) correctly requires a designator and, having none, yields `PHONE` — consistent
with the reclassification. No stray reference to `reference` as Class R was found elsewhere in §4 or §10.

**R4-F4 result: confirmed by independent derivation — `:` alone can no longer hide a phone, and the `reference`
reclassification is applied consistently in every row that exercises it.**

---

## §9 R4-F5 — mask binding (independently derived)

All five inputs were independently derived in §5 above (same derivations apply verbatim: `9876543210 XXX XXX` →
`PHONE`; `98765 43XXX` → `FRAGMENT`; `98765 43210 XXXXX` → `PHONE`; `98765 43210 / 98XXX XXXXX` → `PHONE`,
`FRAGMENT`; `555-0100, 555-01XX` → `PHONE`, `FRAGMENT`). All five match REV-005's claims.

**Specific sub-questions, checked against §4.6.5's explicit text:**
- **Empty segments:** §4.6.5 states "segments are never empty" and ED-DEC-004 §4.5 explicitly decides "do empty
  segments count? No." — unambiguous.
- **Post-exclusion stretch calculation:** §4.6.1 defines "phone stretch" = raw stretch with Step-4 exclusion spans
  removed and split at them; §4.6.5's constants (elements, gaps, units) operate only on phone stretches, stated
  explicitly in ED-DEC-004 §4.5 ("after … computed on the phone stretch"). Unambiguous.
- **Gap classification:** four named, mutually exclusive classes (fused/inserted/tight/loose) with closed character
  sets; every gap in the sampled inputs classified without ambiguity.
- **Mask binding:** U4's binding rule (`digits(S) + length(K) ≤ 15`, fused clusters must bind, free-segment
  definition) is a closed arithmetic/adjacency test — re-derivable without guesswork on `98765 XXXXX 1234567` (MK30):
  cluster `K`=`XXXXX` (5) fused to segment `98765` (5 digits): `5+5=10≤15` → may bind, and since fused, **must** bind;
  segment `1234567` (7 digits) has no cluster adjacent (it's a remainder-adjacent group, separated from the masked
  segment by a tight gap with no further mask) — re-checking: the unit is `98765 xxxxx 1234567` (all tight-joined,
  one unit since the first two are fused and the third is tight-joined to the mask... wait, is `1234567` fused or
  tight to `xxxxx`? Input is `98765 XXXXX 1234567`, tight gap (space) on both sides) → one unit, `P = 5+5(digits of
  98765... )`. Re-deriving per REV-005's own stated `P=17→U4; 1234567 free`: `P(unit)=digits(98765)+digits(1234567)+
  length(mask)=5+7+5=17>15`→U4. Segment `1234567`: no cluster fused to it (cluster `K` is fused to `98765`, not to
  `1234567`, since gap between mask and `1234567` is tight not fused) → condition (i) "no cluster fused to S may bind
  S" — there is no cluster *fused* to `1234567` at all → vacuously true; condition (ii) every cluster *adjacent* to S
  that may bind S must also be able to bind its other adjacent segment — cluster `K` is adjacent to `1234567` (tight
  gap) and "may bind" iff `digits(1234567)+length(K)=7+5=12≤15` → yes may bind; and `K`'s other adjacent segment is
  `98765`, which it may also bind (`5+5=10≤15`) → condition (ii) holds → `1234567` is free → evaluated on 7 digits →
  `PHONE`. Matches REV-005's claim exactly.
- **Candidate boundaries / single-character `x`:** §4.6.1 ("Length 1: an ordinary stretch character … Length ≥2:
  mask-capable") is an unambiguous bright line, and §4.6.9.4 explicitly folds a glued single `x`/`#` into the
  inserted-character rule, leaving no case where a length-1 `x` is treated as a boundary.
- **Multiple mask segments / neighbouring candidates:** loose-gap-ends-unit plus letter/consumed-span-ends-stretch
  gives a complete, non-overlapping partition; verified on `98765 43210 / 98XXX XXXXX` and `555-0100, 555-01XX` above.

**R4-F5 result: confirmed — the specification, independently re-derived, allows two engineers to reach the same
classification on every tested input; no undefined term remains in the sampled rules (segment emptiness, stretch
scope, and x-token length were all explicitly pinned down).** One residual drafting-level ambiguity, not among the
R4-F5 inputs, is recorded as a new minor finding in §12.

---

## §10 Complete lifecycle audit (sampling basis stated in §3.3)

- **§10.1 Masking/formatting (34 rows, MK1–MK34):** every row re-derived or cross-checked against the gap/unit/CVN
  rules of §4.6; all consistent; MK15's Δ from REV-004 correctly reflects ED4-F1 (CVN); IC8 correctly stays
  `FRAGMENT` (an unmatched `**` fused on both sides with no CVN-length core, `P=12`→U3).
- **§10.2 Inserted characters/extensions (16 rows):** consistent with §4.6.2/§4.6.9; IC10 (`98765a43210`) correctly
  `[]` — a non-`x` letter ends the stretch (5+5 digit pieces, each below `L_min=6`), matching §4.11(c)'s open
  false-negative list (not silently claimed fixed).
- **§10.3 Reference labels/prose (25 rows, RL1–RL25, UN1–UN5):** re-derived in full in §8; all consistent; RL2b's Δ
  from REV-004 correctly reflects ED4-F4.
- **§10.4 Separators (17 rows):** gap-class rules correctly classify every separator (dashes incl. Unicode variants,
  slash, comma, underscore, middle dot, line break, multiple spaces) as tight or loose per §4.6.5's closed character
  sets; SP14/SP16 correctly stay `[]` (single group beyond `L_max` / no digit threshold met, per §4.7).
- **§10.5/10.5a Email (43 rows, ER1–ER30, D1–D7, MI1–MI3, NM1–NM2, EP1–EP13):** re-derived representative subset in
  §6–§7; D1's "Δ rev. 4 (precision)" is a restatement (two separate single-input rows rather than one combined row)
  with the same policy outcome, correctly not changing any expectation value.
- **§10.6 `context.*` (16 rows):** correctly routes CX1/CX2 through the *existing* CONTRACT-REC §3 screen (not K1) and
  CX3 onward through K1's `containsAnyContactIdentifier`; this two-screen layering matches PG-2's "existing screen
  retained, not weakened" wording exactly (§2, §4 cross-checked against the PG decision text).
- **§10.7 Normalization (7 rows):** N4's Δ is a precision restatement (adds the `oh`-between-digit-words example),
  not a new rule; N7 restates the "stored value = trimmed input" invariant, consistent with C-1.
- **§10.8 Lifecycle (23 rows, L1–L23):** read in full. L13/L17's Δ "(precision)" correctly narrows wording without
  changing REJECTED/no-event outcomes. L20/L21 restate the equivalence and the line-578 test's role; both checked
  against actual code in §11 below and found accurate.
- **§10.9 Coverage table:** cross-referenced against §4 and §10.1–10.8; every ED4-F* item maps to rows that exist in
  the sections claimed; no dangling reference found.

**No row was found where the claimed expected result could not be derived from the stated rules, and no row was
found to contradict a governing policy (K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4).**

**Scope limitation:** full line-by-line re-derivation of all ~230 rows (vs. the representative-plus-full-critical-
sections sampling actually performed) was not completed at this audit's effort level; see §12.

---

## §11 Provider/intake equivalence (§9) and transient-field treatment — traced against actual code

Confirmed via `grep`/read: `packages/core-research/src/contactIdentifiers.ts` **does not exist**; no symbol from
REV-005 §4.1's module contract exists anywhere in `packages/`. This is consistent with REV-005 tagging every
placement as `SPECIFICATION — NOT CURRENT IMPLEMENTATION` — REV-005 never claims the K1 detector is implemented, so
there is no discrepancy between that claim and the code.

What REV-005 *does* claim about present-day code was checked directly:
- `intentSourceProviderContract.test.ts` line 578 (`'a free-text evidence field may quote a business contact (known
  limitation: free text is not PII-scanned)'`) exists exactly where L21 says it does, and its current expectation
  (`NORMALIZED`, i.e. `body` is not screened today) matches L21's claim that `body` is transient/unscreened under the
  existing behaviour this specification builds on.
- `packages/core-research/src/intentSignal.ts` contains the existing `isPersonalContactIdentifier` function and
  `toIntentSignalInput`'s `requiredString(raw.quote, 'quote', …)` trim call, consistent with §7's claim that "`quote`
  … are the values after the existing `requiredString` trim."

Within REV-005 itself (the only thing a self-contained equivalence claim can actually be audited against, since the
K1 detector is unimplemented), the equivalence argument is structurally sound:
- Both lifecycles (§6 provider, §7 intake) invoke the **same** function names
  (`containsPersonalContactIdentifier`/`containsAnyContactIdentifier`, which both route to the single
  `detectContactIdentifiers`, C-3) on the **same kind of input** (a trimmed evidence/quote string and a trimmed
  website).
- The "permitted differences" list (§9) is narrow and each item is independently justified by a named policy clause
  (PG-4 item 3/4, PG-4 consequence 3) rather than asserted bare.
- No path was found in §6/§7 where provider input is screened but intake isn't, or vice versa, for the *same* field
  (evidence ↔ `quote`); `context.*` is explicitly provider-only and justified by PG-4 item 4 (intake carries no
  `context.*`), not silently omitted.
- No path was found where a rejected provider result could still create an event: §6 states rejection happens
  "before `raw` is built" and before mapping/persistence; §8's table confirms `REJECTED` is a terminal
  `ProviderResultOutcome`.
- No path was found where rejected intake could still perform lookup/write: §7 states "The **whole event** is
  rejected before X1, `searches.getById`, `normalizeCandidate`, `findOrCreateByDomain` and any write (PG-4)."
- Transient fields (`title`, `snippet`, `body`, `authorization.basis`) are stated never to enter `raw`, the event, or
  a saved row, and the pushed-path proof mechanism (private `ISSUED` WeakMap) is described as pre-existing and
  unchanged by K1 — consistent with PG-3's conditions, and consistent with the one check against real code (line 578)
  available at this effort level.

**Result: the equivalence claim holds as a specification-internal consistency property; it is not yet verifiable as
a code property because no code implements it. This is correctly reflected by REV-005's own repeated
`SPECIFICATION — NOT CURRENT IMPLEMENTATION` tagging, which is itself a conformance strength, not a gap.**

---

## §12 PG-1..PG-4 verification (word-for-word against the PG decision record)

| Policy | PG decision record wording (source) | REV-005 §2 wording | Conforms? |
|---|---|---|---|
| PG-1 | §3 + closing table: local/national numbers are phones; extension classified by base; extension alone = fragment; bare runs → K1-I4 (delegated, with envelope constraints); formatting alone never decides | "local and national numbers are phones; country/area code absence and formatting … never decide. Number with extension → judged by base; extension alone → fragment. Masked/withheld/truncated → fragment. Bare runs → K1-I4 …" | **Conforms** — condensed, not altered |
| PG-2 | §4 + closing table: `context.*` = free text (K1-I5 rule 2) → K1-B applies; existing CONTRACT-REC §3 screen retained | "`context.*` are free text → K1-B applies; a hit rejects the whole provider result; the existing CONTRACT-REC §3 screen is retained, not weakened. **Net effect:** …" | **Conforms** |
| PG-3 | §5 + closing table: text carried in the pushed-result proof solely for re-verification is transient (K1-I5 rule 3), conditionally | "carried only inside the transient pushed-result proof are not screened, provided … never persisted, displayed, logged, passed onward or used otherwise … If any condition stops holding … K1-I5 rule 2 applies" | **Conforms** — the conditional nature is preserved, not dropped |
| PG-4 | §6 + closing table: K1-B applies to non-provider intake; rejection unit = whole intake event; K1-I6 unchanged | "K1-B applies to non-provider intake; a hit rejects the whole intake event; `quote` screened, other intake fields structured; provider-result rejection (K1-I6) is a separate boundary and unchanged" | **Conforms** |

No reinterpretation found. §2's closing line ("Not changed and not touched: PD-1..PD-12, K1-B, K1-R1..R3, K1-I1..I6,
PG-1..PG-4, OQ-3, OQ-7, OQ-11, DEC-003") is accurate on this audit's reading.

---

## §13 Carried-forward findings — verified individually

| Finding | Still present in REV-005? | Description accurate? | Contradicts policy? | Severity unchanged? | Accidentally claimed fixed? |
|---|---|---|---|---|---|
| R4-M1 (edge `•••` → `PHONE`, fail-closed) | Yes — §4.11(a) | Yes | No (K1-I4 volume acceptance) | Non-blocking, unchanged | No — explicitly listed as open |
| R3-M3 (`tel:` scheme word boundary, e.g. `Hotel:2026-10-02`) | Yes — §11 open-items list | Yes | No | Non-blocking, unchanged | No |
| R3-M5 (English-only number/at/dot words) | Yes — §4.4.5 note, §4.11(c), §11 | Yes | No | Non-blocking, unchanged | No |
| R3-M6 (over-capture, open for EG-1 volume review) | Yes — §4.11(a) items now fully enumerated, §11 "open for EG-1 volume review" | Yes, and more complete than REV-004 (fully listed per R4-M5 disposition) | No | Non-blocking, unchanged | No — REV-005 explicitly states this completeness is itself the fix for R4-M5, not for R3-M6 |
| R3-M7 (`publication.publisher` classification) | Yes — §5 field table ("structured — existing screens only (R3-M7 open)"), §11 | Yes | No | Non-blocking, unchanged | No |
| R3-M9 (AUDIT-001 reconciliation) | Yes — §11, with the ED7-F2/ED7-F4 note (addressed in substance by L20/L21, not claimed fully closed) | Yes | No | Non-blocking, unchanged | No — "addressed in substance," not "closed" |
| §4.11(c) false negatives | Yes — fully listed (single non-`x` letter insert, quoted local part, comma-grouped phone, concatenated >15-digit group, compound/non-English words); REV-004's "no residual is a false negative" claim is explicitly **withdrawn** in §4.11(c) | Yes | No (recorded open, not accepted permanently; §9 of ED-DEC-004 confirms no PO path entered) | Non-blocking, unchanged | No — the opposite: a previously overstated claim is corrected |

**Result: all seven carried-forward items are preserved, accurately described, not claimed fixed, and consistent with
governing policy. No carried-forward finding was silently dropped.**

---

## §14 Newly discovered findings (this audit)

**Finding NEW-1 (minor, non-blocking, engineering drafting ambiguity).** §4.6.4 defines a "mask-capable element" for
the `*`/`•` case as "a run of ≥ 2 characters each `*` or `•`." Read literally, this permits a *heterogeneous* run
mixing both characters (e.g. `*•*•`), since each individual character in such a run is still "`*` or `•`." §4.6.3,
however, defines a "`*`-run" (used only for emphasis-pairing) as "a maximal run of `*` characters that is **not
adjacent to** a `•`" — implying `*` and `•` are elsewhere treated as never co-occurring in one run for emphasis
purposes, but §4.6.4's own mask-capable-run definition does not state whether a run mixing the two characters is (a)
a single mask-capable element of combined length, or (b) not a "run" at all for M-s purposes (requiring
same-character runs only, by analogy with §4.6.3). No worked example in §4.6.4 or §4.6.10 exercises a mixed `*`/`•`
sequence, so this is not demonstrated to produce a wrong *result* in any stated test row, and the condition is narrow
(an author mixing `*` and `•` as a phone mask in the same unbroken run is an unlikely real-world input). Under
determinism obligations (PG-1 Consequence 3, restated for masks by ED4-F5's "stated explicitly … and covered by
tests"), this is a genuine, if narrow, point on which two independent engineers implementing §4.6.4 literally could
diverge. **Category: engineering drafting ambiguity, not a policy conflict and not a defect demonstrated against any
stated test row. Severity: minor, non-blocking** — does not by itself prevent the self-contained-specification or
lifecycle-derivability tests in §4/§10 of this audit (all sampled rows use pure `*`-only or pure `•`-only runs) and
does not affect any R4-F1..F5 finding. Recommended disposition for a later engineering record: state explicitly
whether a mask-capable `*`/`•` run must be homogeneous.

No other new findings (critical, major, or minor) were identified in the sections audited (§4–§11 above). No
unreachable rule, no precedence loop, no provider/intake divergence, no policy change disguised as an engineering
detail, and no impossible test expectation were found.

---

## §15 Product Owner decision boundary

No genuine conflict with any Product Owner decision (K1-B, K1-R1..R3, K1-I1..I6, PG-1..PG-4, OQ-3/7/11, DEC-003) was
found in this audit. Every engineering choice traced in §5–§11 (CVN constant, E-1..E-5 precedence, the
reference-label construction, mask-binding scope) was independently confirmed to decide only *how* already-settled
policy is detected, never *what* the policy is, consistent with ED-DEC-004 §9's own self-assessment (which this audit
checked rather than accepted).

**No Product Owner decision required.**

---

## §16 Audit verdict

**READY FOR IMPLEMENTATION-AUTHORITY REVIEW.**

Basis: no policy conflicts found (§15); no critical findings; no major findings; one new minor, non-blocking drafting
ambiguity found (§14, NEW-1); every lifecycle row sampled (§10) is derivable from the stated rules and none
contradicts governing policy; provider/intake equivalence holds as a specification-internal property and is accurate
wherever it touches verifiable present-day code (§11); carried-forward findings (§13) are accurately represented,
none silently dropped or falsely claimed fixed; REV-005 is self-contained for all 35 required items (§4).

This verdict is a statement about REV-005's readiness for the **next governance step** (an implementation-authority /
PD-1 review), not an implementation authorization — none is granted or implied by this record.

---

## §17 Independence limitation

This audit was performed by a Claude-based session, as were REV-005, ED-DEC-004, and every prior revision/amendment/
audit in this lineage (REV-002 through AUDIT-R4). **This is a material limitation on independence**: a shared
model family may share systematic blind spots, stylistic conventions, or reasoning patterns across "independent"
passes, even where this audit deliberately re-derived results from first principles (§5–§9) rather than accepting
REV-005's prose, and deliberately cross-checked REV-005 §2 against the PG decision record's own text rather than
REV-005's paraphrase (§12). Genuine independence would require a reviewer (human or a different model family) with no
shared authorship history with REV-005/ED-DEC-004. This limitation applies equally to every audit in this lineage
back to AUDIT-001 and is not specific to this record.

**Additional scope limitation (stated per §3/§10):** full line-by-line re-derivation of all ~230 rows in REV-005 §10
was not performed; representative sampling plus full re-derivation of the sections carrying the R4-F1/R4-F2/R4-F3/
R4-F4/R4-F5 findings (§10.1, §10.3, §10.5/10.5a) was performed instead, with §10.2/10.4/10.6/10.7/10.8/10.9 read in
full but not independently re-derived row-by-row. No contradiction was found in any row actually read.

---

## §18 Read-only confirmation

This audit performed no write operation other than creating this single record. No application code, test,
dependency, schema, migration, API, UI, configuration, or existing `requirement/` record was created or modified. No
detector or rule was implemented. No provider/API call was made. No external research was performed. No commit or
push was made.

```text
Record type: CONFORMANCE AUDIT (REV-005)

Audit scope:                  REV-005 + ED-DEC-004, against K1-B/K1-R1..R3/K1-I1..I6/PG-1..PG-4/DEC-003/REV-004/AUDIT-R4
Self-contained (35 items):    YES — no missing definition found
R4-F1 (masks):                CONFIRMED — independently derived, matches claimed outcomes
R4-F2 (email vs time/price):  CONFIRMED — independently derived, matches claimed outcomes
R4-F3 (spaced email vs price):CONFIRMED — independently derived, matches claimed outcomes
R4-F4 (ordinary labels):      CONFIRMED — independently derived, matches claimed outcomes
R4-F5 (mask binding):         CONFIRMED — unambiguous and deterministic on tested inputs
Lifecycle matrix:             every sampled row derivable; none contradicts policy
Provider/intake equivalence:  holds (specification-internal; code does not yet implement K1)
PG-1..PG-4:                   verified word-for-word against the PG decision record; not reinterpreted
Carried-forward findings:     7/7 preserved, accurate, not claimed fixed
New findings:                 1 (NEW-1, minor, non-blocking, drafting ambiguity in §4.6.4 mixed */bullet run)
Product Owner decision required: NO
Verdict:                      READY FOR IMPLEMENTATION-AUTHORITY REVIEW

Read-only:                    YES
Code/test/schema/migration/config changed: NO
Commit / push:                NO
Next governance step:         Product Owner review of PD-1 (implementation authorization), informed by this audit
```
