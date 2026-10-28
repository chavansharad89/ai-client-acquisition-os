# CLIENT INTENT DISCOVERY — REQUIREMENT HASH RECONCILIATION

**Record ID:** CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-001
**Date:** 2026-10-01
**Type:** governance reconciliation record only. Not a decision record, not a Product Owner decision, not an
implementation authorization.
**Reconciles:** CLIENT-INTENT-DISCOVERY-REQ-001 (Amendment 1) against existing Client Intent Discovery records.
**Basis:** Option (a) of the prior analyst assessment, as directed by the Product Owner — record the reconciliation
in a new standalone record; modify no existing record.
**Author role:** governance recorder.

> **This record changes no existing record, decision, status, selected answer, dependency or authority. It re-pins no
> hash and grants no execution authority.**

---

## §0 Baseline (verified before writing; read-only checks)

| Item | Value |
|---|---|
| Branch | `phase-17-r34-worker-orchestration` |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Staged files | 0 |
| Working-tree entries | 248 (before this record) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (current) | `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` |

**Transcription note.** The pre-amendment hash supplied with the instruction for this record read
`606e046e1ff9e70b802b48e2…`. The value actually present in the repository (all seven occurrences, §4) is
`606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68`; the supplied variant occurs nowhere. This record
uses the repository value.

## §1 Purpose

This record reconciles the amended requirement's current hash with existing governance records **without rewriting
historical evidence**.

## §2 Amendment

| Item | Value |
|---|---|
| Requirement | `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (CLIENT-INTENT-DISCOVERY-REQ-001) |
| Pre-amendment sha256 | `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` |
| Amended sha256 | `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` |
| Amendment | Amendment 1 (2026-10-01) |
| Nature | **Additive.** The original requirement text was retained in full (0 lines removed). |

As recorded in the requirement itself, Amendment 1 introduced: additional Client Intent Discovery source categories
(§2A); per-provider evidence verification items (§2B); Google Ads separation (§2C); the intent distinction between
search intent, published client intent and inferred business need (§3A); R-5.4–R-5.5; and related open dependencies
AMD1-DEP-1 to AMD1-DEP-4 (§10A).

This record does not reinterpret the amendment and makes no substantive policy decision.

## §3 Historical-reference rule

References to `606e046e…` inside records created before Amendment 1 remain **historical attestations** of the
requirement version those records actually evaluated.

They must **not** be silently changed to `e107b3e2…`. Doing so could falsely represent those records as having
evaluated the amended requirement.

## §4 The seven old-hash references (all preserved unchanged)

| # | Record | Location | Existing meaning | Classification |
|---|---|---|---|---|
| 1 | `CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` | line 37, §1 "Source and baseline (verified before writing)" | Source requirement sha256 at preparation time | Historical |
| 2 | `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | line 66, §2 "Source integrity (verified before writing)" | Source requirement sha256 at log creation | Historical |
| 3 | `CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | line 40, §1 "Baseline (verified before writing)" | REQ-001 sha256 at session preparation | Historical |
| 4 | `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | line 39, §1.1 Records | Source requirement pin for OQ-PO-DEC-001 | Historical |
| 5 | `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE_PREPARATION.md` | line 33, §1.1 Records | Source requirement pin for PROVIDER-EVIDENCE-PREP-001 | Historical |
| 6 | `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | line 30, §1.1 Records | Source requirement pin for PROVIDER-EVIDENCE-001 | Historical |
| 7 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | line 102, §0.1 "This record, pre-amendment sha256" | The requirement's own pre-amendment hash | Historical (the requirement's own pre-amendment reference) — left untouched |

**R-4.1** References #1–#6 remain historical unless an explicit future governance action establishes a separate
current-reference field. No existing record labels any of them as a current / canonical reference.

**R-4.2** Reference #7 is the requirement's own historical pre-amendment reference and is left untouched.

## §5 Chain integrity

No downstream hash cascade was performed. These records pin one another's hashes; editing any of them would change
its own hash and break the pins held by later records. The following existing record hashes remain unchanged and must
not be edited merely to make them reference the amended requirement:

| Record | ID | sha256 (verified unchanged) |
|---|---|---|
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-PREP-001 | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |
| `CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001 | `4506a050d215805e483fbaf07c2f56a57a43655f80b47808472cbe94a62ebe44` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-PREP-001 | `1f7e0af55c526aa491d443be297221860e116f4290a2aead52b29a7d70fb973f` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-001 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |

## §6 Current canonical requirement

- `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` is the **current** sha256 of the amended
  requirement.
- `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68` remains the **historical pre-amendment** sha256.
- Existing records retain their original hashes and historical evidence.
- No decision has been reopened.
- No decision has been re-decided against the amended requirement.

## §7 Execution counters (this record)

```text
Files created: 1 (this record)
Existing records modified: 0
Production code changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring changes: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
```

## §8 Final state

```text
Requirement reconciliation: RECORDED

Existing decisions changed: NONE
Existing decision statuses changed: NONE
Existing selected answers changed: NONE
Existing records modified: NONE
Historical hashes rewritten: NONE
Hash-chain re-pin: NONE

Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Database authority: NONE
Schema/migration authority: NONE
Runtime-wiring authorization: NONE
Integration naming authority: NONE
Key-registration authority: NONE
Validation authority: NONE
Outreach/contact authority: NONE
Deployment authority: NONE
Scraping/browser automation authority: NONE
Credential-sharing authority: NONE
```
