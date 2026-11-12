# PATH 2 — CATEGORY PLAUSIBILITY

## VS-GO-PO-DEC-001 Hash Discrepancy — Offline Reconciliation Record

**Record ID:** VS-GO-HASH-REC-001
**Type:** Offline governance-record verification. It is not a decision and grants no authority.
**Date:** 2026-09-29
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Raised by:** VS-SETUP-REC-002 §6 (`PATH_2_CATEGORY_PLAUSIBILITY_SESSION_READINESS_RECHECK_RECORD.md`)

```text
FINDING ................... A — HISTORICAL RECORDING ERROR
VS-GO-PO-DEC-001 .......... NOT MODIFIED
VS-SETUP-REC-001 / -002 ... NOT MODIFIED
VALIDATION SESSION ........ NOT AUTHORIZED FOR EXECUTION BY THIS RECORD
```

---

## 1. Baseline

| Item | Value |
|---|---|
| `git status --short` entries | 168 (before this record) |
| VS-GO-PO-DEC-001 (`PATH_2_CATEGORY_PLAUSIBILITY_SESSION_GO_AHEAD_PRODUCT_OWNER_DECISION.md`) sha256 | `9dd3ef416788042e2ab56caeb0e7e58493f56e240a7c857cd9c773fec699d362` |
| VS-SETUP-REC-001 (`PATH_2_CATEGORY_PLAUSIBILITY_SESSION_READINESS_SETUP_RECORD.md`) sha256 | `07459bdc246c63340d729cc0da37e332ddcb3b2ff931a0e5e2371eab100cf77c` |
| Text in VS-SETUP-REC-001 (line 36) | `` \| Migration-setup decision / VS-GO decision / VS-GO preparation sha256 (first 16) \| `5468bcba03d01665` / `9dd3ef4167880420` / `361b91243b47674c` \| `` |
| Value recorded for VS-GO | `9dd3ef4167880420` (16-character prefix only; no full hash was recorded) |

## 2. History evidence available locally

| Source | Result |
|---|---|
| Git history (`git log --all`) | None: both files are untracked (`??`); no commit, on any ref, contains VS-GO |
| `git stash list` | Empty |
| Other copies in the working tree (outside `node_modules`, `.git`) | None: only the one VS-GO file exists |
| Revision metadata inside VS-GO | None: single "DECIDED (2026-09-29)" status; no revision number, amendment or correction note (unlike its preparation record, which is marked "revision 3") |
| Other records pinning a VS-GO hash | Only VS-SETUP-REC-001 (prefix `…0420`) and VS-SETUP-REC-002 (full current hash, discrepancy flagged) |

No earlier revision of VS-GO is available, so no historical revision hash exists to compare against.

## 3. Comparison

```text
current  9dd3ef416788042e2ab56caeb0e7e58493f56e240a7c857cd9c773fec699d362
recorded 9dd3ef4167880420
         ^^^^^^^^^^^^^^^ = first 15 hex characters identical; character 16 differs ('e' vs '0')
```

## 4. Classification and basis

**A — Historical recording error.**

The finding rests on the hash comparison, not on timestamps:

1. SHA-256 output for different file content is effectively independent. The chance that a
   different revision of VS-GO shares the first 15 hex characters (60 bits) with the current revision
   is about 2⁻⁶⁰. A legitimate earlier revision (Option B) would not produce a value this close.
2. The recorded value therefore corresponds to the current VS-GO content with its 16th character
   wrongly copied. It does not correspond to any other revision.
3. No local evidence shows any other revision of VS-GO (§2).

File timestamps agree with this but are not relied on: VS-GO birth and last modification are both
14:55:50, and VS-SETUP-REC-001 was written at 15:09:03.

**Authoritative value:** `9dd3ef416788042e2ab56caeb0e7e58493f56e240a7c857cd9c773fec699d362`.

## 5. Impact

| Record | Affected? | Note |
|---|---|---|
| VS-GO-PO-DEC-001 | No | Content unchanged; the current hash is authoritative |
| VS-SETUP-REC-001 | Yes: §1 line 36, VS-GO prefix only | All its other values are unaffected; it is not rewritten (no existing authorization permits editing it) |
| VS-SETUP-REC-002 | No | It already records the full correct hash; its §6 open question is answered by this record |
| Any other record | No | None pins a VS-GO hash |

**Future correction:** none required in place. Any later record that cites the VS-GO hash should use
the full authoritative value in §4, not VS-SETUP-REC-001 line 36.

## 6. Activity

Performed: `git rev-parse`, `git status`, `git log --all`, `git stash list`; sha256 of the two files;
local file search and reads; file timestamp read; creation of this record.

Not performed: any database, Docker, Prisma or migration activity; runtime start or stop; provider,
Places, Search, web or live-source access; participant contact; Session ID assignment; fingerprint
capture; validation; determination; D11-H or Companion entries; any edit to an existing file.

| Counter | Value |
|---|---|
| External, provider, Places or Search calls | 0 |
| Database connections / SQL queries / migrations executed | 0 / 0 / 0 |
| Participant contacts / validation sessions / determinations | 0 / 0 / 0 |
| Files created / modified | 1 (this record) / 0 |

## STOP
