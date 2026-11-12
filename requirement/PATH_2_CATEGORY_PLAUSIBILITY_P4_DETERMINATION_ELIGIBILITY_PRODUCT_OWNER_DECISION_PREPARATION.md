# PATH 2 — CATEGORY PLAUSIBILITY

## P4 — Determination Eligibility for A-11 E1 — Product Owner Decision Preparation

---

## 1. Decision ID

**P4-PO-DEC-001** — the same decision reserved in
`PATH_2_CATEGORY_PLAUSIBILITY_P4_DETERMINATION_ELIGIBILITY_PRODUCT_OWNER_DECISION.md`.

This record prepares that decision for the Product Owner. It is not a competing decision and
reserves no new decision ID. It does not modify P4-PO-DEC-001.

**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

### 1.1 Alternative-label crosswalk (mandatory reading)

This record uses the alternative labels given in the Product Owner's preparation request. They
differ from the labels in P4-PO-DEC-001 §5. The substance is the same.

| This record | P4-PO-DEC-001 §5 | Substance |
|---|---|---|
| **P4-A** | P4-B | F-1 implementation must precede the validation session. |
| **P4-B** | P4-A, with "may an `EXCLUDED / PRE-F1` determination supply E1?" answered YES | Current M-2/Q-1 state is sufficient for E1 only; E2/E3 stay subject to F-1 §11 item 5. |
| **P4-C** | P4-C | Ambiguity remains; a further explicit ruling is required. |

When the decision is recorded, the Product Owner should name the substance, or cite which
record's labels are used, so that the selection cannot be misread.

---

## 2. Status

```text
P4 (P4-PO-DEC-001) ........ PENDING PRODUCT OWNER DECISION
ALTERNATIVE SELECTED ...... NONE
AUTHORITY GRANTED ......... NONE
```

A read-only search of `requirement/` found no Product Owner ruling selecting any P4
alternative. The only records referencing P4 are P4-PO-DEC-001 (PENDING) and its parent
VS-PO-DEC-001 §4, which marks P4 "UNRESOLVED".

---

## 3. Question

> Whether an A-11 validation session may produce an E1-qualifying determination under the currently authorized M-2/Q-1 scope, or whether F-1 implementation must precede that validation session.

---

## 4. Authoritative rule

| Field | Value |
|---|---|
| Artifact | `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` |
| Section | §11 "F1-F Decision — Persistence / Backward Compatibility", item 5; restated in §17 |
| Classification | Product Owner decision ("F-1 STATUS: DECIDED"). Implementation authorization NOT GRANTED (§19). |
| Wording | "only determinations created after the F-1 implementation, with complete fields, are validation-valid. Legacy rows may not be used to satisfy any D11 coverage item, evidence check, or spot-check." |
| Legacy row | §11 item 1: "any determination row whose segment objects lack `basis`." |

The A-12 Companion Record §2 transcribes this rule as `VALID`, `EXCLUDED / PRE-F1` and
`EXCLUDED — NOT VALIDATION-VALID`. The Companion is an instrument, not an independent authority.

---

## 5. Evidence relevant to P4

| # | Evidence | Source | Bearing on P4 |
|---|---|---|---|
| V1 | F-1 §11 item 5 (quoted in §4). | F-1 Evidence Decision §11 | Excludes pre-F-1/legacy rows from D11 coverage items, evidence checks and spot-checks. |
| V2 | Excluded determinations "are not assessed in §4 or §5 and do not enter any result in §6." | Companion §2 Rule | Excluded rows receive no substantive §6.3 finding. |
| V3 | E1 requires, "for each determination included in the authorized A-11 validation set", the persisted model-seen source record(s) from the M-2 path, traceable to the determination. Acceptance does not mention validation status. | A-11 matrix §3 E1 | E1's own text does not require `VALID`. "Authorized A-11 validation set" is not defined. |
| V4 | E2 is the §6.4 manual spot-check against the captured source. | A-11 matrix §4 | A spot-check is named in V1. |
| V5 | E3 must be recorded "under the A-12 §6.3 Companion Record rules" and satisfy "the Companion Record requirements". | A-11 matrix §5 | Brings V2 into E3. |
| V6 | E1 → E2 → E3 → A-11 closure dependency; M-2/T6 are enabling evidence only. | A-11 matrix §6, §7 | E1 alone does not close A-11. |
| V7 | "a determination intended to qualify as `VALID` must have the required captured source evidence; absence of required capture rows is an E1 failure; such a determination cannot satisfy E1–E3". | A11-PO-DEC-003 §3 | Sets a requirement for `VALID`-intended determinations. Silent on non-`VALID` determinations. |
| V8 | A-11 is "Capture of the fetched source for the §6.3 substantive check and the §6.4 spot-check … live-validation prerequisite". | F-1 Consolidated Audit §18, via A-11 matrix §0.1 | A-11's purpose is to serve §6.3/§6.4, which V1/V2 restrict to valid determinations. |
| V9 | "Without that [F-1] decision, no session can reach PASS." | Gate Audit §11 item 2 | Audit observation. F-1 is decided but not implemented. |
| V10 | M-2 selection "does not bundle M-2 with F-1". F-1 remains NOT AUTHORIZED outside the M-2 scope. | A11-P1-PO-DEC-002; A-11 matrix header | M-2 is not "the F-1 implementation" for V1. |
| V11 | No F-1 basis value (`CITED_SOURCE_EVIDENCE`, `MODEL_REPORTED_INSUFFICIENT_EVIDENCE`) occurs under `packages/` or `apps/`. | Read-only search recorded in P4-PO-DEC-001 §2 fact 9 | Any determination created now would lack `basis`: a legacy row, `EXCLUDED / PRE-F1`. |
| V12 | M-2 implemented; T6/T6.1–T6.7 PASS; Q-1 implemented, Q1-T1–Q1-T8 PASS; both uncommitted on HEAD `5992b82`. | A-11 matrix §1–§2; VS-PO-DEC-001 §2 | Capture and retrieval mechanisms exist. |
| V13 | No validation-session determination exists; D11-H and Companion session fields are blank. | VS-PO-DEC-001 §1–§2 | E1 cannot begin under any alternative. |

---

## 6. Alternatives

Listed without ranking. None is selected.

### P4-A — F-1 implementation must precede the validation session

Only a `VALID` determination (created after F-1 implementation, complete fields) may enter the
authorized A-11 validation set for E1.

* **Supported by:** V1 ("any … evidence check"), V7 (A-11 evidence framed around `VALID`-intended determinations), V8 (A-11 exists to serve §6.3/§6.4), V6 (E1 without usable E2/E3 cannot advance closure), V9.
* **Limited by:** V3 (E1 text has no validity condition); V1 is framed as *D11* validation validity, and no record states that E1 is a D11 evidence check.
* **Effect:** F-1 needs separate implementation authorization and completion first. No validation session for E1 purposes until then.

### P4-B — M-2/Q-1 sufficient for E1 only; E2/E3 remain subject to F-1 §11 item 5

A determination created during a separately authorized validation session may supply E1 if its
persisted M-2 source is complete, traceable and Q-1-retrievable, even though it is classified
`EXCLUDED / PRE-F1`. It remains excluded from E2, E3 and every D11 check.

* **Supported by:** V3 (E1 acceptance names no validity status), V12 (mechanisms exist), V1's explicit "D11" framing.
* **Limited by:** V7 (A-11 evidence requirements are stated for `VALID`-intended determinations); V2/V4/V5 (the same determination cannot carry E2/E3); V6 (E1 from such determinations cannot by itself lead to A-11 closure); V3's undefined "authorized A-11 validation set".
* **Effect:** a later `VALID` set would still be needed for E2/E3. If selected, the Product Owner must also define "the authorized A-11 validation set" and state what closure value such E1 evidence has.

### P4-C — Another explicitly documented interpretation: ambiguity remains

The records do not establish whether E1 eligibility can be separated from F-1 determination
validity. This is the interpretation P4-PO-DEC-001 §3.3 records. No further repository-supported
interpretation was found.

* **Supported by:** V1 vs V3 tension; V7 silent on non-`VALID` rows; no definition of "authorized A-11 validation set".
* **Limited by:** leaves P4, and therefore VS-PO-DEC-001 P4, unresolved.
* **Effect:** P4 stays open until the ruling in §9 is made.

---

## 7. Consequences for E1

| Question | Answer from the repository |
|---|---|
| Does F-1 §11.5 definitively exclude PRE-F1 determinations from E1? | **No explicit rule.** V1 names D11 checks; V3 names no validity status. Ambiguous. |
| Is the current M-2/Q-1 state sufficient for E1? | **As a mechanism:** yes, to capture and return source for a determination (V12). **As E1 evidence:** no — E1 requires actual validation-session determinations (V3, V13), none exist, and whether a PRE-F1 determination qualifies is the open P4 question. |
| Must F-1 implementation precede creation of an E1-eligible determination? | **Not established.** Required under P4-A; not required under P4-B; undetermined under P4-C. |

| Alternative | D11 | Validation session | E1 |
|---|---|---|---|
| P4-A | unchanged unless separately authorized | blocked pending F-1 | blocked |
| P4-B | unchanged unless separately authorized | requires separate authorization (VS-PO-DEC-001) | potentially eligible once session evidence exists |
| P4-C | unchanged | blocked | blocked |

This table is not an authorization.

---

## 8. Consequences for E2/E3

These are settled by existing authority under **every** alternative:

1. A `EXCLUDED / PRE-F1` determination cannot supply E2: a §6.4 spot-check is excluded by F-1 §11 item 5 (V1, V4).
2. A `EXCLUDED / PRE-F1` determination cannot supply E3: it is not assessed in Companion §4 and enters no §6 result (V2, V5), and F-1 §11 item 5 excludes it from evidence checks (V1).
3. Therefore E2 and E3 require `VALID` determinations, which require F-1 implementation (V1, V10, V11).
4. E2 and E3 remain **OPEN**; F-1 implementation remains **NOT AUTHORIZED** beyond M-2.

No alternative in §6 changes this. Changing it would require an explicit Product Owner amendment
of F-1 §11 item 5, which is outside P4.

---

## 9. Required Product Owner decision

The Product Owner must rule, explicitly:

1. **Selection:** P4-A, P4-B or P4-C (by substance, per §1.1).
2. **Validation-set membership:** whether "the authorized A-11 validation set" (A-11 matrix §3 E1) requires Companion §2 status `VALID`, or may include `EXCLUDED / PRE-F1` determinations.
3. **If P4-B:** the closure value of E1 evidence from `EXCLUDED / PRE-F1` determinations, given §8.
4. **If P4-A:** confirmation that F-1 implementation authorization is a prerequisite to VS-PO-DEC-001 Option C for E1 purposes (this does not itself authorize F-1 implementation).

| Field | Value |
|---|---|
| Alternative selected (substance) | |
| Validation-set membership ruling | |
| Additional ruling (item 3 or 4) | |
| Product Owner | |
| Date | |

The decision, when made, should be recorded as a separate decision entry or an authorized update
to P4-PO-DEC-001.

---

## 10. Authority boundary

This record grants **no** authority for:

* D11 readiness or reclassification;
* provider calls;
* live source fetching;
* participant validation;
* determination creation;
* E1, E2 or E3 execution;
* A-11 closure;
* additional F-1 implementation;
* modifying the A-11 matrix, D11-H, the D11 Facilitator Record, the Companion Record, F-1 records, A-12 artifacts, P4-PO-DEC-001, VS-PO-DEC-001, or any implementation file.

D11 remains **NOT READY FOR LIVE VALIDATION** until a separate Product Owner decision explicitly
authorizes the transition.

---

## 11. Current status

```text
P4 ........................... PENDING PRODUCT OWNER DECISION
Validation-session decision .. PENDING (VS-PO-DEC-001)
D11 .......................... NOT READY FOR LIVE VALIDATION
F-1 implementation ........... NOT AUTHORIZED (except completed M-2 scope)
E1 ........................... BLOCKED
E2 ........................... OPEN
E3 ........................... OPEN
A-11 ......................... OPEN
A-12 ......................... CLOSED
```

---

## 12. Repository safety checks

| Check | Before writing | After writing |
|---|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` | unchanged |
| Staged files | 0 | 0 |
| Tracked diff SHA-256 (`git diff`) | `2259ae276cd2da98609878322fcf6d11c8f57c22f75e112340396d853af71b87` | unchanged |
| Existing `requirement/*.md` files (SHA-256 snapshot) | 86 files | all 86 unchanged |
| New files | — | this record only |
| `git diff --check` | — | clean |

No provider, live validation, participant session, Docker/Postgres or application test was run.

## STOP
