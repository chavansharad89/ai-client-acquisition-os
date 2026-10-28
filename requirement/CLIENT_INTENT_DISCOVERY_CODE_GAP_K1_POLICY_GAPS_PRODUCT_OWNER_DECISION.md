# CLIENT INTENT DISCOVERY — CODE-GAP K-1 POLICY GAPS PG-1 … PG-4 — PRODUCT OWNER DECISION

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POLICY-GAPS-PO-DEC-001
**Date:** 2026-10-02
**Type:** Product Owner decision record (governance only). Not an implementation authorization.

> **These Product Owner decisions define policy semantics only. They do not authorize implementation.**
> **PD-1 remains PENDING.**

**Abbreviations:**

| Short form | Record ID / file |
|---|---|
| PG-Q | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POLICY-GAPS-PO-QUESTIONNAIRE-001 (authoritative question list) |
| PG-PREP | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POLICY-GAPS-PO-DEC-PREP-001 |
| K1-ESPEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001 |
| K1I-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-001 (K1-I1..K1-I6) |
| K1I-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-DEC-CONFORMANCE-AUDIT-001 |
| K1-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001 (K1-R1, K1-R2, K1-R3) |
| K1-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001 |
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 (K1-B) |
| OQ-DEC | OQ-PO-DEC-001 (OQ-3, OQ-7, OQ-11) |
| DEC-003 | INTENT-INTAKE-PO-DEC-003 |
| CONTRACT-REC | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 |
| ADAPTER-REC | INTENT-SOURCE-ADAPTER-IMPL-REC-001 |
| REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (canonical) |

**Statement labels:**

| Label | Meaning |
|---|---|
| **EXISTING CONSTRAINT** | Already decided by a cited record, or an identified implementation fact |
| **PO POLICY (this record)** | A new rule first decided here |
| **ENGINEERING** | How code implements the policy. **Not decided here.** |

---

## §1 Decision authority

This record contains the Product Owner decisions for **PG-1, PG-2, PG-3 and PG-4** of PG-Q, and for nothing else.

- **Decision maker.** Claude Code acted as Product Owner for this decision round, under explicit delegation from the
  repository owner in session on 2026-10-02.
  - The delegation is limited to PG-1..PG-4.
  - It grants no implementation, validation, provider-call, external-research or participant-contact authority.
- **Not reopened.** K1-B, K1-R1, K1-R2, K1-R3 and K1-I1..K1-I6 stand as recorded. Each answer below fills a gap those
  records left open (K1I-AUDIT I3-F2, I4-F3, I5-F2; K1-ESPEC §9). None amends them.
- **Options.** Where an answer coincides with a PG-Q option label, the label is cited. Each answer is stated in the
  Product Owner's own words. Alternatives are not ranked.
- **No new Product Owner questions** are created by this record.

## §2 Baseline (verified before deciding)

| Item | Value | Matches PG-PREP §3 / PG-Q §2 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); untracked records under `requirement/` only | Yes |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |
| Target file / record ID pre-existence | Neither existed | — |

| Record | sha256 (verified; unchanged) |
|---|---|
| PG-PREP (preparation record) | `9ae7fca776c6dd50edb6ca90fc41e6de89e4a9d7ec70b57a50e5662ca9ff8d5d` |
| PG-Q (questionnaire) | `ea6d8121bba3f926ec3d11f2677d48f9ede37873bdaf7d3ef45dc8cf140d8a52` |
| K1-ESPEC (engineering-spec preparation) | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` |
| K1I-DEC (K1-I1..I6 decision) | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` |
| K1I-AUDIT (K1-I1..I6 audit) | `bb33d7a72b03f6674ed8019951c4b2393d5c31e96c107ebef1616de9b2f3ef92` |
| K1I-Q | `5660c18e0347e94de7320940ded55025ef9db92e256a2878b129a220a59324e4` |
| K1I-PREP | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` |
| K1-DEC (K1-R1..R3 decision) | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` |
| K1-AUDIT (K1-R1..R3 audit) | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` |
| PO-DEC (K1-B) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` |
| REQ-001 (canonical requirement) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |

**Baseline: PASS.**

---

## §3 PG-1 — Phone-number boundary

### Decision (PO POLICY, this record)

**Governing principle.** For K1-B, a string is a phone number if it conveys **all the digits the source used to convey a
number by which someone can be called or messaged**.
- Leaving out dialing prefixes that context supplies (country code, area / trunk code) does **not** make it a
  fragment.
- Formatting does not decide the question either way. The presence or absence of `+`, separators, parentheses, labels
  or a `tel:` reference neither makes a string a phone number nor stops it being one.
- A **fragment** under K1-I3 rule 2 is a rendering in which digits of the number are **masked, withheld or truncated
  by the source**, so the number cannot be read.

| Category (PG-Q) | Decision | Option |
|---|---|---|
| **(a) Local number without area or trunk code** (e.g. `555-0100`) | **Phone number.** In scope; personal under K1-R1 rule 3. | P-YES |
| **(b) National number without country code** | **Phone number.** In scope; personal under K1-R1 rule 3. | P-YES |
| **(c) Extension** | **With a number** (e.g. `+91 22 1234 5678 ext. 204`): the string is classified by its **base number**; the extension neither makes nor unmakes a phone number. **By itself** (e.g. `ext. 204`, `extension 567`, with no base number in it): **not a phone number** — it is a fragment under K1-I3 rule 2 and is not, by itself, a K1-B ground. | P-NO for extension alone |
| **(d) Unformatted bare digit run** (no `+`, separator, label or `tel:`) | **No category rule. K1-I4 governs.** A bare digit run is a phone number if it is one. Because the system usually cannot know, K1-I4 applies in full: if it **plausibly** is a phone number and the system cannot **establish** that it is not, it is treated as personal and the provider result is `REJECTED`. Lack of formatting alone never establishes that a run is not a phone number. | P-I4 |

**Three bands** (restating the table, not adding to it):
1. **Clearly phone-like:** a complete local, national or international number in any rendering, including words,
   inserted characters, `tel:` / `sms:`, and a number with an extension. → phone → personal → `REJECTED`.
2. **Ambiguous numeric strings** (bare runs, and any rendering the system cannot place) → K1-I4: rejected if plausible
   and not established otherwise.
3. **Not phone numbers:** extension-only values; renderings masked, withheld or truncated by the source; strings
   established as something else (K1-I4's examples: "evidently a date, price, amount or labelled reference number").
   → no K1-B ground.

**K1-I4 delegation confirmed.** What counts as "plausibly" and "established" for band 2 remains the engineering matter
K1I-DEC §6 made it, subject to the constraints in "Consequences" below. The Product Owner accepts that this engineering
envelope affects rejection volume (K1I-AUDIT I4-F3) within those constraints.

### Rationale

- **"Every phone number … in any form" (K1-R1 rules 1, 3).**
  - A local or national number is how phone numbers are ordinarily published, including office and switchboard
    numbers, which K1-R1 rule 3 names as personal.
  - Excluding them would remove most real-world phone renderings from K1-B.
- **Usability, not completeness of dialing prefix, is the harvesting risk.**
  - DEC-003 §6 prohibits "personal email / phone harvesting".
  - A number missing only its country or area code is fully usable by anyone in, or aware of, that context. It is
    harvestable.
  - A masked number, or an extension without its base number, is not usable to reach anyone. That is the K1-I3
    rule 2 line.
- **Formatting is typography.** K1-I3 already decided that renderings do not matter: "in any form", words, inserted
  characters. Treating unformatted runs as categorically non-phone would let formatting defeat the rule, which is the
  outcome K1-I3 rejected.
- **Bare runs are genuinely undecidable in general.** CONTRACT-REC §6 item 4 records that a bare digit string "cannot
  be told apart from a numeric identifier". K1-I4 was decided for exactly that situation, so no separate category rule
  is created.
- **No external definition adopted.** The `core-payments` 8–15 digit validator is an input validator for another
  purpose, and E.164 is a numbering standard. Neither is the Product Owner's definition. No digit threshold is set here.

### Supporting records

EXISTING CONSTRAINT: K1-R1 rules 1, 3 (K1-DEC §3); K1-I3 rules 1–3 (K1I-DEC §5); K1-I4 (K1I-DEC §6); DEC-003 §6;
CONTRACT-REC §6 item 4; K1I-AUDIT I3-F2, I4-F3, I4-F4; PG-PREP §4.

### Consequences engineering must respect

1. Categories (a), (b) and numbers with extensions must be recognized as phone numbers when present in K1-B-scope
   text, in any rendering K1-I3 covers.
2. Extension-only values, and renderings masked, withheld or truncated by the source, must not by themselves trigger
   K1-B.
3. For bare digit runs and other ambiguous strings, the engineering envelope for "plausibly" and "established":
   - must not treat absence of formatting as, by itself, establishing that a string is not a phone number;
   - must not exclude a run solely because it lacks a country or area code;
   - must be stated explicitly in the engineering specification and covered by tests.
4. K1-R1 is unchanged: every phone number recognized is personal. No phone number is ever classified business.

### Engineering-only (not decided here)

Recognition patterns; separators; digit counting; length bounds of the "plausibly" envelope; exclusion recognizers;
extension markers; word / obfuscation handling; libraries; locale data.

### Unresolved

Nothing at policy level for PG-1. The exact envelope is engineering, under constraint 3.

---

## §4 PG-2 — `context.targetCustomer`, `context.geography`, `context.service`

### Decision (PO POLICY, this record)

**All three `context.*` values are free text for K1-I5** (rule 2). The same rule applies to each of
`context.targetCustomer`, `context.geography` and `context.service`. Option: **PG2-FT**. PG2-ST and PG2-MIX are not
selected.

- **In scope.** They are passed beyond the privacy screen on the normalized event, so they are in K1-B scope under
  K1-I5 rule 2. K1-B applies to them in full: K1-R1, K1-I1..K1-I4, and PG-1.
- **Unit.** A K1-B trigger in any of them rejects the whole provider result (K1-I6).
- **Existing screen retained, explicitly.** The existing CONTRACT-REC §3 value screen on these keys is **not
  changed**. It continues to apply alongside K1-B: any email address or leading `mailto:` / `tel:` / `sms:` value in
  them is rejected, as today.
  - **Net effect:** no email address (business or personal) and no phone number may appear in a `context.*` value.
  - The free-text classification **adds** K1-B screening and **removes** nothing.

### Rationale

- **They are free text in fact.**
  - Each is an unbounded optional `string | null` with no vocabulary, enum, format or length limit
    (`IntentSourceContext`, `intentSource.ts:97–101`). Each is supplied by the provider and describes the context in
    words: a target customer, a place, a service.
  - K1-I5 rule 4 covers "structured fields and metadata" — identifiers, URLs, dates, enumerations, identity anchors.
    These values are none of those.
- **Lifecycle test is met.** They are carried on `NormalizedIntentEvent.context` beyond the privacy screen
  (ADAPTER-REC §5; CONTRACT-REC §4). K1-I5 rule 2 brings passed-on free text into scope "if the system … passes it
  beyond the privacy screen as part of the signal, event or outcome".
- **Uniform treatment.** All three share type, provenance and lifecycle. `geography` reads as more regular, but it is
  still an uncontrolled string. No record or code fact supports treating the three differently.
- **Retaining the existing screen avoids a silent change.**
  - Today the keys are screened for email / scheme values (CONTRACT-REC §3). Lifting that would let a business email
    into a field that carries no evidence role. Nothing in K1-I5 requires that.
  - K1-R1 classifies emails "for the purpose of applying K1-B to a free-text evidence field". It expressly leaves "Any
    identifier handling outside free-text fields. CONTRACT-REC §3 behavior is unchanged."
  - Context values are not evidence fields, so keeping the stricter existing screen there is consistent with K1-R1.

### Supporting records

EXISTING CONSTRAINT: K1-I5 rules 2, 4 (K1I-DEC §7); CONTRACT-REC §3, §4; ADAPTER-REC §5; K1-R1 scope sentence and
non-decisions (K1-DEC §3); K1I-AUDIT I5-F2; IMPLEMENTATION FACT `IntentSourceContext`; PG-PREP §5.

### Consequences engineering must respect

1. `context.*` values must be screened by K1-B whenever they are carried on the event, in addition to the existing
   CONTRACT-REC §3 value check, which must not be removed or weakened.
2. A trigger in any `context.*` value rejects the whole provider result.
3. Values are never stripped, masked or rewritten (CONTRACT-REC §3 "rejected, never stripped"; K1-R2).

### Engineering-only (not decided here)

Where and how the two screens run for these keys; ordering; field path in rejection reporting; tests.

### Unresolved

None.

---

## §5 PG-3 — Text carried in the pushed-result proof

### Decision (PO POLICY, this record)

**Carriage inside the pushed-result proof solely for re-verification is transient use (K1-I5 rule 3), not "passed on"
(K1-I5 rule 2).** Option: **PG3-TRANSIENT**. PG3-PASSED and PG3-READ are not selected.

This means `title`, `snippet`, `body` and `authorization.basis` are **not** brought into K1-B scope by the proof
mechanism. That holds both:
- when the bytes merely travel with the opaque proof; and
- when they are re-read at the save step to re-run the same normalization (X1).

**Conditions of the classification.** It holds only while the carried text:
1. stays inside the opaque proof, in memory, for the life of the request;
2. is not persisted, displayed or logged;
3. is used for nothing except re-running the same verification / normalization.

If any of those stops being true for a field, that field is "passed on" (or retained or displayed) and **K1-I5 rule 2
applies to it** without a further Product Owner record.

K1-I5 rule 3's restriction continues to apply: an identifier in that text "must not be extracted, stored, displayed or
used".

### Rationale

- **Purpose test.**
  - K1-I5 rule 3's own example of transient use is verification: "to verify that a statement appears verbatim in the
    source (OQ-3 item 1)".
  - The proof exists only so the save step can re-check that the event is the exact verified result (OD-13 X1). That
    is the same kind of use, repeated at a later step of one request.
- **Harvesting test.**
  - Rule 2 targets text that can be harvested because it is kept, shown or handed on as content.
  - The proof's state is private to the verification module and is "In memory only; never persisted (Q9)"
    (`providerAuthenticity.ts:178`). It exposes no text to the caller, and nothing from it is logged or displayed.
  - There is no harvesting surface for DEC-003 §6 to address.
- **Consistency across paths.** A pulled result and a pushed result with the same content should face the same K1-B
  scope. Treating the proof as "passed on" would screen `body` / `title` / `snippet` / `basis` only for pushed
  results, and would reject pushed results that are identical to accepted pulled ones.
- **Evidence statements are unaffected.** They are always screened (rule 1) at P2, and again in the X1 re-derivation,
  which re-runs the same normalization.

### Supporting records

EXISTING CONSTRAINT: K1-I5 rules 1–3 (K1I-DEC §7); OQ-3 item 1; DEC-003 §6; OD-13 Option B and X1 (INTENT-INTAKE-OD13-
EXACT-BINDING-DEC-001), not reopened; IMPLEMENTATION FACT `providerAuthenticity.ts:24–27`, `:171`, `:178`, `:362`;
PG-PREP §6.

### Consequences engineering must respect

1. The X1 re-derivation must apply K1-B with the same scope as P2: evidence statements and in-scope free text (incl.
   `context.*`, PG-2), and **not** `title` / `snippet` / `body` / `basis`.
2. The proof mechanism must not expose, log, persist or display the carried text. Any change that would do so brings
   that text under K1-I5 rule 2 (condition above).
3. No redesign of the proof mechanism is required or authorized by this decision.

### Engineering-only (not decided here)

None beyond respecting the conditions. The proof mechanism is unchanged.

### Unresolved

K1I-AUDIT I5-F4 (wording of "used" in K1-I5) is not resolved by this record. It remains non-blocking. This record
applies the evident reading: the text may be used for verification; an identifier in it is never used as an
identifier.

---

## §6 PG-4 — Non-provider intake

### Decision (PO POLICY, this record)

**Yes. K1-B applies to intake input that does not originate from a provider result. The rejection unit is the whole
intake event.** Option: **PG4-EVENT**. PG4-NO, PG4-ENTRY and PG4-OTHER are not selected.

1. **Scope.** An intake event recorded without a provider result behind it — one `RecordIntentIntakeInput`, or the
   single-signal input, which is an intake event of one signal — is screened by K1-B before anything is written.
2. **Evidence item for this path (explicit definition).**
   - For K1-B on non-provider intake, the "evidence item" is the **intake event as a whole**.
   - If any in-scope text of any signal in the event triggers K1-B, the whole event is rejected. No signal of it is
     recorded, and no Company, Prospect, signal or Opportunity is created or updated from it.
   - Nothing smaller is accepted from it, and nothing larger is rejected.
3. **K1-I6 unchanged.**
   - For provider results, the evidence item remains the provider result (K1-I6). This decision does not extend,
     replace or reinterpret K1-I6.
   - An intake event produced from one provider result corresponds to that one result, so where both screens apply,
     their units coincide and no new boundary is created on the provider path.
4. **In-scope text on this path (K1-I5 applied).**
   - Each signal's `quote` is the evidence statement: always screened (rule 1).
   - The other caller-supplied fields are not free text:
     - `companyName` and `website` are identity anchors (counterparts of `business.name` / `business.website`);
     - `sourceUrl` is a provenance reference;
     - `sourceLabel` is a bounded source-type label (counterpart of the system-assigned label on the provider path);
     - `kind`, `field`, `observedAt` and `authorizationEvidence` are structured.
   - They remain structured fields / metadata (rule 4). K1-B adds nothing to them, and this decision changes no
     existing validation of them.
5. **Not broader.** Other intake events, previously persisted rows, and other provider results are unaffected.

### Rationale

- **The privacy screen is a condition of every Client Intent Signal.**
  - OQ-3 item 4 makes passing "the existing privacy screen (DEC-003 §6 …)" a condition for **any** item to be a
    Client Intent Signal, and K1-R3 places K1-B inside that screen.
  - A signal recorded through a non-provider path is persisted to the same `source_quote` and displayed and used the
    same way (K1-ESPEC §6). An unscreened entry point would let it carry a personal phone or email, which is exactly
    the harvesting DEC-003 §6 prohibits.
- **K1-I6 cannot be stretched, so the unit is defined here.** K1-I6 defined the evidence item as the provider result
  "for K1-B application only" and said nothing about input without one. This record defines the non-provider unit
  separately rather than reading K1-I6 into it.
- **Whole event, for the same reasons that applied to provider results.**
  - Intake already validates "the whole event … before any write" and "One invalid entry rejects the whole event"
    (ADAPTER-REC §4).
  - Rejecting single entries while recording the rest would be partial acceptance of a supplied item, which K1-I6
    declined for provider results.
  - The event is the unit the caller supplied and the unit the system validates atomically.
- **Code already treats non-provider intake as a distinct path.** The single-signal form refuses FIRST_PARTY because
  "it has no provider result behind it (OD-7 item 3)". Recognizing the path for privacy is consistent with that.

### Supporting records

EXISTING CONSTRAINT: K1-B (PO-DEC §2); K1-R3 (K1-DEC §5); OQ-3 item 4; DEC-003 §6; K1-I5 rules 1, 4 (K1I-DEC §7); K1-I6
(K1I-DEC §8), unchanged; ADAPTER-REC §4; K1I-AUDIT I6-F1; IMPLEMENTATION FACT `intentIntake.ts:93`, `:147–151`;
PG-PREP §7.

### Consequences engineering must respect

1. K1-B must run on non-provider intake events before any lookup or write. A trigger rejects the whole event.
2. On the provider path, observable results must not change: a provider result's outcome is decided by K1-I6.
   Engineering may place a shared check at the intake boundary only if it rejects exactly the same results and
   nothing else.
3. Rejection uses existing validation-failure handling. No new outcome or state is created (consistent with K1-I4's
   "No new outcome").

### Engineering-only (not decided here)

Placement (e.g. intake validation vs the intake function); error field / reason / message; extension of K1-ESPEC E-9 /
E-10 / §7 / §8; tests.

### Unresolved

None at policy level.

**Observation (not a decision):** non-provider intake applies no CONTRACT-REC §3-style identifier screen to its
structured fields. That is existing behavior. It is unchanged by this record and outside PG-4.

---

## §7 Cross-question consistency

| Check | Result |
|---|---|
| **PG-1 ↔ K1-I4** | Bands 1 and 3 are determinate. Band 2 (bare runs, ambiguous renderings) is handed to K1-I4 unchanged, with K1-I4's own delegation of "plausibly" / "established" confirmed. PG-1 adds constraints on the envelope (formatting alone never establishes non-phone) but no threshold. **Consistent.** |
| **PG-1 ↔ K1-I3** | "Complete" (open per K1I-AUDIT I3-F2) is given content: all digits the source used are present; dialing prefixes may be absent. "Fragment" keeps K1-I3's example (masked digits) and adds extension-alone and withheld / truncated digits, all of which "no complete … phone number can be read" from. **Consistent; fills an open item.** |
| **PG-1 ↔ K1-R1** | Only "is this a phone number" is decided. "Every phone number" remains personal; no business phone exists; email classification untouched. **No change.** |
| **PG-2 ↔ K1-I5** | `context.*` settled as rule 2 free text, passed on → in scope. Rule 4 unaffected for genuinely structured fields. The existing CONTRACT-REC §3 screen on these keys is retained, as K1-R1's non-decision ("CONTRACT-REC §3 behavior is unchanged") requires. **Settled; consistent.** |
| **PG-2 ↔ K1-R1 rule 2** | A business email in `context.*` is still rejected, by the retained existing screen and not by K1-B. K1-R1's business classification governs free-text evidence fields, and context values are not evidence fields. **No conflict.** |
| **PG-3 ↔ K1-I5** | Proof carriage settled as rule 3 transient, with conditions that move text to rule 2 if lifecycle changes. Rule 1 (evidence statements) and PG-2 scope apply identically at P2 and in X1 re-derivation. **Settled; consistent.** |
| **PG-4 ↔ K1-I6** | K1-I6's provider-result unit is untouched. A separate, explicitly defined unit (intake event) applies only to non-provider intake. Provider-derived intake events map 1:1 to provider results, so units coincide. **No silent redefinition.** |
| **PG-4 ↔ K1-I5 / K1-R3 / OQ-3** | Same screen membership (K1-R3), same scope rules (K1-I5), existing rejection handling; no new outcome. **Consistent.** |
| **vs K1-R2** | No masking, stripping or rewriting anywhere; names untouched. **No conflict.** |
| **vs K1-I1 / K1-I2** | Domain classification unchanged, and applies to `context.*` and non-provider quotes exactly as to evidence statements. **No conflict.** |
| **vs OQ-7 / OQ-11** | No identity rule touched. **No conflict.** |

**No contradiction found.**

## §8 Engineering boundary

These decisions constrain a later revision of K1-ESPEC. They do not edit it and do not authorize implementing it.
Engineering must still specify:

- **E-4 / E-7 step 6:** the "plausibly" / "established" envelope for bare digit runs, under PG-1 constraints 1–4.
  Recognition of local / national numbers and extensions. Extension-only exclusion.
- **E-8 / §6:** `context.*` rows → screened by K1-B, existing screen retained (PG-2). `title` / `snippet` / `body` /
  `basis` rows → transient on every path, with the PG-3 conditions.
- **E-9 / E-10 / §7:** non-provider intake check, its placement before any lookup or write, the whole-event unit, and
  provider-path equivalence (PG-4). X1 re-derivation scope (PG-3 consequence 1).
- **E-12:** field / reason / message for `context.*` and intake-path rejections, within the existing
  `IntentSignalValidationReason` set unless engineering finds that insufficient.
- **E-13 / §8:** expected values for the rows previously marked † (P4, P5, P7, P8, U2, U5, L5, L7), plus new intake-path
  cases.

**No implementation authorization is created here.**

## §9 Remaining open items

| Item | Status | Changed by this record? |
|---|---|---|
| PD-1 implementation scope / authorization | **PENDING** | No |
| PD-2 evidence-class representation | PENDING | No |
| PD-3 service-category vocabulary / matching beyond D3 | PENDING | No |
| PD-6 expressed vs observed time | PENDING | No |
| PD-8 new source family | PENDING | No |
| PD-9 provider authorization | PENDING | No |
| S14 applicability to LinkedIn lead-form responses (EG-5) | OPEN | No |
| EG-1 kinds / prevalence of personal data in real quotes | OPEN EVIDENCE GAP | No (volume effect of PG-1 band 2, PG-2 and PG-4 unknown) |
| EG-CR-4 bare-digit limitation (CONTRACT-REC §6 item 4) | OPEN (implementation) | No; PG-1 routes it to K1-I4 |
| K1I-AUDIT I5-F4 "used" wording | Non-blocking ambiguity | No (evident reading applied in §5) |
| K1I-AUDIT I6-F6 I4 × I6 amplification | Acknowledged consequence | No |
| Engineering items in §8 | ENGINEERING SPEC REVISION REQUIRED | — |
| Non-provider intake structured-field identifier screen | Existing behavior, observation only (§6) | No |

No new Product Owner question is created.

## §10 Governance

```text
PG-1: DECIDED — local (a) and national (b) numbers are phone numbers; number+extension classified by base number; extension alone not a phone (fragment); bare digit runs (d) governed by K1-I4 (delegation confirmed, with envelope constraints); formatting alone never decides
PG-2: DECIDED — context.targetCustomer / geography / service are free text (K1-I5 rule 2) → K1-B applies; existing CONTRACT-REC §3 screen on them retained (PG2-FT)
PG-3: DECIDED — text carried in the pushed-result proof solely for re-verification is transient (K1-I5 rule 3), conditionally (PG3-TRANSIENT)
PG-4: DECIDED — K1-B applies to non-provider intake; rejection unit = whole intake event; K1-I6 unchanged (PG4-EVENT)

Prior decisions reopened / amended / superseded: NONE (K1-B, K1-R1..R3, K1-I1..I6 stand)
New Product Owner questions created: NONE
Engineering items decided: NONE

PD-1: PENDING
Implementation authorized: NO
Validation authorized: NO
Provider calls: NO
External research: NO
Participant contact: NO
Commit / push: NO

Files created: 1 (this record)
Existing records modified: 0
Production / test / schema / migration / API / UI changes: 0
```

**Independence limitation.** K1-ESPEC, PG-PREP, PG-Q and this decision were produced in the same working session, and
this decision was made by Claude Code under delegated Product Owner authority. It is not an independent human decision.
