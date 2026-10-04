# CLIENT INTENT DISCOVERY — REQUIREMENT HASH RECONCILIATION (AMENDMENT 2)

**Record ID:** CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-002
**Date:** 2026-10-01
**Type:** governance reconciliation record only. Not a decision record, not a Product Owner decision, not an
implementation authorization.
**Reconciles:** CLIENT-INTENT-DISCOVERY-REQ-001 (Amendment 2) against existing Client Intent Discovery records.
**Precedent:** CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-001 (Amendment 1) — same method: new standalone record; no
existing record modified.
**Author role:** governance recorder.

> **This record changes no existing record, decision, status, selected answer, dependency or authority. It re-pins no
> hash and grants no execution authority.**

---

## §0 Baseline (verified before writing; read-only checks)

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Working-tree entries | 3 (before this record): `M CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (Amendment 2); untracked `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md`, `CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md` |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`, sha256 — method of REQ-001 §0 / RECON-001 §0) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty diff: no code changes outside `requirement/`) |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` — working tree, independently computed | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` — HEAD blob (pre-Amendment-2), independently computed | `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` |

Both computed values equal the values supplied with the instruction for this record.

**Precondition checks (all passed):**

| # | Check | Result |
|---|---|---|
| 1 | Branch / HEAD | As above |
| 2 | Staged files | 0 |
| 3 | Current requirement sha256 | `ccf88646…` (computed) |
| 4 | Pre-Amendment-2 sha256 | `e107b3e2…` (HEAD blob, computed) |
| 5 | Amendment 2 present | Yes — header paragraph (line 47) and `## §13 Amendment 2 …` (line 491) |
| 6 | Amendment 1 present | Yes — header paragraph (line 25), §2A (line 139), §3A (line 247) |
| 7 | OQ-1..OQ-12 unchanged | Yes — §10 block byte-identical to HEAD |
| 8 | OQ decisions unchanged | Yes — tracked OQ records identical to HEAD; untracked OQ-1-2-8-PO-DEC-001 sha256 `21c81585…` equals the value recorded in REQ-001 §13.0 |
| 9 | Provider evidence records unchanged | Yes — PROVIDER-EVIDENCE-001 and PREP-001 identical to HEAD; PROVIDER-FINALIZATION-DEC-001 sha256 `adcb7f53…` equals the value recorded in REQ-001 §13.0 |
| 10 | Hash reference search | §4 (git grep over tracked and untracked files) |

## §1 Purpose

This record reconciles the canonical requirement's version transition from the pre-Amendment-2 version to the
post-Amendment-2 version **without rewriting historical governance evidence**.

## §2 Amendment transition

| Item | Value |
|---|---|
| Requirement | `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (CLIENT-INTENT-DISCOVERY-REQ-001) |
| OLD (pre-Amendment-2) sha256 | `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e` |
| NEW (post-Amendment-2) sha256 | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| Amendment | Amendment 2 (2026-10-01) — as titled in the requirement: "provider-neutral, multi-source Client Intent Discovery architecture" |
| Observed nature | **Additive** (observed fact): `git diff --numstat` against HEAD = 288 lines added, 0 lines removed. |

As recorded in the requirement itself, Amendment 2 adds one header paragraph and §13 (§13.0–§13.11). This record does
not characterize or reinterpret the amendment further and makes no substantive policy decision.

## §3 Historical-reference rule

- Historical records retain the hash of the requirement version they actually evaluated.
- Those hashes are **not** rewritten.
- Existing decisions are **not** retroactively attributed to Amendment 2; no existing decision is to be read as
  having evaluated Amendment 2.
- **No hash-chain re-pin is performed.**

## §4 Reference inventory

Search: `git grep -n -I --untracked <hash>` over the repository (excluding `node_modules`), for both hashes.

### 4.1 Old hash `e107b3e2…` — 7 occurrences

| # | Record | Line | Section / context | Classification |
|---|---|---|---|---|
| 1 | `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md` | 36 | §0 Baseline — records table; row "`CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (canonical)" | **HISTORICAL** — baseline attestation of the version this decision was made against |
| 2 | `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | 342 | §13 "Post-write verification note — concurrent amendment of REQ-001"; observed new hash after Amendment 1 | **HISTORICAL** — point-in-time observation |
| 3 | `CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md` | 44 | §0 "Records used (sha256, computed at baseline)"; row "(Amendment 1; canonical)" | **HISTORICAL** — baseline attestation |
| 4 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` | 511 | §13.0 Amendment 2 baseline — "This record, pre-Amendment-2 sha256" | **HISTORICAL** — the requirement's own pre-amendment reference |
| 5 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION.md` | 26 | §0 "Baseline (verified before writing)"; row "`CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (current)" | **HISTORICAL** — baseline attestation; "current" refers to its verification time |
| 6 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION.md` | 44 | §2 Amendment — "Amended sha256" (Amendment 1 transition) | **HISTORICAL** — record of the Amendment 1 transition |
| 7 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION.md` | 97 | §6 "Current canonical requirement" — "is the **current** sha256 of the amended requirement" | **CURRENT CANONICAL REFERENCE** (explicitly so labelled by RECON-001) — accurate as of RECON-001; **superseded by §7 of this record**; preserved unchanged |

**R-4.1** Occurrences #1–#6 remain historical and are not edited.

**R-4.2** Occurrence #7 is the only reference an existing record explicitly identifies as a current canonical
pointer. It is not ambiguous: it identifies the canonical version as of RECON-001 (Amendment 1). It is **not
edited**; editing it would modify an existing governance record and break its own pinned hash. The current canonical
pointer is instead recorded by §7 of this record, which supersedes RECON-001 §6 for that purpose only. RECON-001's
other content is unaffected.

### 4.2 New hash `ccf88646…` — 0 occurrences

No existing record references the new hash. Therefore no existing record treats the new hash as a historical hash for
an event that predates Amendment 2.

### 4.3 AMBIGUOUS — STOP

None.

## §5 Decision integrity

| Check | Result |
|---|---|
| OQ-1..OQ-12 (REQ-001 §10) unchanged | Verified — §10 block byte-identical to HEAD |
| OQ-1 answer (Google Search selected for first consideration, policy level only) unchanged | Verified — OQ-1-2-8-PO-DEC-001 sha256 `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548`, unchanged |
| OQ-2 and OQ-8 adopted statuses unchanged | Verified — same record, unchanged |
| OQ-3..OQ-12 decisions (OQ-PO-DEC-001) unchanged | Verified — identical to HEAD |
| No provider authorization added | Verified — Amendment 2 §13.11 "Providers authorized by Amendment 2: NONE"; R-13.29; no grant wording found in the Amendment 2 diff |
| No provider newly rejected | Verified — Amendment 2 records no rejection; PROVIDER-FINALIZATION-DEC-001 unchanged |
| No execution authority added | Verified — every authority line in Amendment 2 §13.11 is NONE |
| Amendment 2 did not reopen an earlier decision | Verified — R-13.28 lists preserved decisions; no decision record modified |

## §6 Chain integrity

No downstream hash cascade was performed. No downstream record was edited to make its hash references match the
amended requirement. The following record hashes were verified unchanged at baseline:

| Record | ID | sha256 |
|---|---|---|
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-PREP-001 | `4b60c6e3ad1052f321036dc1325ecc9b8d5f0b3df2cb159b94ce560fbdd83314` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md` | CLIENT-INTENT-DISCOVERY-OQ-DEC-001 | `ccf11dc7dad6de6ed617070974963042eac977da45a8e9c3bf630d36f0270bb2` |
| `CLIENT_INTENT_DISCOVERY_OQ_PRODUCT_OWNER_SESSION_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-OQ-SESSION-PREP-001 | `4506a050d215805e483fbaf07c2f56a57a43655f80b47808472cbe94a62ebe44` |
| `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE_PREPARATION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-PREP-001 | `1f7e0af55c526aa491d443be297221860e116f4290a2aead52b29a7d70fb973f` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_EVIDENCE.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-EVIDENCE-001 | `2387838ff125c35a8f6bf19e88eab4e8f91ef43a5665aecd2c0d18ad7be31647` |
| `CLIENT_INTENT_DISCOVERY_PROVIDER_FINALIZATION_DECISION.md` | CLIENT-INTENT-DISCOVERY-PROVIDER-FINALIZATION-DEC-001 | `adcb7f5333511cdc673bd4046b86217d1c6e889801521c80c34bd9fae2ab6bab` |
| `CLIENT_INTENT_DISCOVERY_OQ_1_2_8_PRODUCT_OWNER_DECISION.md` | CLIENT-INTENT-DISCOVERY-OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| `CLIENT_INTENT_DISCOVERY_REQUIREMENT_HASH_RECONCILIATION.md` | CLIENT-INTENT-DISCOVERY-REQ-HASH-RECON-001 | `a5973f4f644369b910547436ccadd4c31e66ee3787025173ece6c269a12b5765` |
| `INTENT_INTAKE_GOOGLE_ADS_PROVIDER_REQUIREMENT.md` | INTENT-INTAKE-GOOGLE-ADS-REQ-001 | `928f157d58a9b245cafae7b15ccf8e724f085a331a3735da2e6e7ad4b44961a4` |

## §7 Current canonical version

- **CURRENT CANONICAL REQUIREMENT:** `requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` —
  `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` (post-Amendment-2).
- **HISTORICAL GOVERNANCE REFERENCES:** `e107b3e2ba42793f9a57937ef1946c0ef130e88840fe97039afd463de419860e`
  (post-Amendment-1 / pre-Amendment-2) and `606e046e1ff9e70b802f48e2c0ee7c0ff97bbbf32c1f511512e5f1de53b8ae68`
  (pre-Amendment-1, per RECON-001) remain historical attestations in the records that cite them.
- Existing records retain their original hashes. No decision has been reopened or re-decided against Amendment 2.

## §8 Authority

```text
Implementation authorization: NONE
Provider-call authorization: NONE
External HTTP authorization: NONE
Production provider access: NONE
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

## §9 Execution counters (this record)

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
Scraping/browser automation: 0
Validation: 0
Outreach/contact: 0
Deployment: 0
Commits: 0
Pushes: 0
```

## §10 Final state

```text
Requirement reconciliation (Amendment 2): RECORDED

CURRENT CANONICAL REQUIREMENT: ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1
HISTORICAL GOVERNANCE REFERENCES: unchanged (§4.1)

Existing decisions changed: NONE
Existing decision statuses changed: NONE
Existing selected answers changed: NONE
Existing records modified: NONE
Historical hashes rewritten: NONE
Hash-chain re-pin: NONE

NO DECISIONS CHANGED
NO EXECUTION AUTHORITY GRANTED
NO HASH-CHAIN RE-PIN PERFORMED
```
