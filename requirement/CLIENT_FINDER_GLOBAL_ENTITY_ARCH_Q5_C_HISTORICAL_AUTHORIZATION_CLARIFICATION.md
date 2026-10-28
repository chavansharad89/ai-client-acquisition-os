# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: Q5-C HISTORICAL-ROW AUTHORIZATION — CLARIFICATION

**Record type:** Governance clarification (interpretation of an already-made Product Owner decision — not a new decision).
**Authority:** Engineering interpretation of `CF-GLOBAL-ENTITY-ARCH-Q5-PO-DEC-001` §2 (Q5-C = B) and its companion `CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_SPECIFICATION.md` §J. This record does not exercise Product Owner authority and does not itself authorize anything; it resolves an ambiguity surfaced during Phase I implementation by re-reading the two documents above, which remain the actual authority.
**Date:** 2026-10-21.
**Triggered by:** an open question explicitly flagged in the Phase I implementation report (this session, 2026-10-20) — the `authorizeSignalForSharing` function, as built, does not special-case a signal's age, and that choice was flagged as "new engineering judgment... in case a stricter reading is intended."
**No code, schema, migration, or test is changed by this record.**

---

## 1. The question

Does Q5-C (= B) mean:

- **(X)** a historical `companySummary`/`businessModel` row (one that existed before the Q5-B authorization mechanism existed) may still be individually, explicitly authorized under the existing Q5-B mechanism, one row at a time, by a privileged actor — Q5-C only forbids *automatic/batch* processing of historical rows; or
- **(Y)** historical rows must remain **completely ineligible** for authorization under the existing mechanism — any authorization of a historical row, individual or batch, requires a **future, separate, explicit** Product Owner decision that has not yet been made.

## 2. Determination

**(Y) is correct.** Historical rows must remain completely ineligible until a future, separate, explicit PO decision. Individual/manual authorization of a historical row under the current Q5-B mechanism is **not** permitted by the existing Q5-C decision.

## 3. Textual basis

From `CF-GLOBAL-ENTITY-ARCH-Q5-PO-DEC-001` §2 (Q5-C), verbatim:

> Existing, already-stored `companySummary`/`businessModel` values (every row, `OBSERVED` or `INFERRED`, written before the Q5-A/Q5-B mechanism exists) remain private. This record does **not** authorize, and no future document may treat this record as having implicitly authorized:
> - backfilling them,
> - automatically revalidating them,
> - publishing them,
> - migrating them into global public evidence,
> - retroactively applying the newly-selected Q5-A/Q5-B standard to them.
>
> Historical values may be reconsidered only through a **future, separate, explicit** Product Owner decision.

Two of the five listed prohibited actions — **"publishing them"** and **"retroactively applying the newly-selected Q5-A/Q5-B standard to them"** — describe the *act itself*, not its manner (batch vs. individual). Authorizing one specific historical row through `authorizeSignalForSharing` is precisely "retroactively applying the newly-selected Q5-A/Q5-B standard" to that row, and a successful authorization is precisely what makes a row eligible to eventually be "published" (served) through the future cross-freelancer read path. Nothing in this list is qualified by scale — there is no "...unless done one row at a time by a privileged operator" carve-out anywhere in §2.

This is confirmed, more explicitly, by the companion engineering specification's §J ("Historical data (Q5-C enforcement)"), verbatim:

> A future, separate, explicit PO decision would be required to authorize **any one-time historical re-evaluation**; this document does not propose, design, or pre-approve one.
>
> **New vs. historical observations, made explicit:** "historical" here means any row that exists at the moment this gate's storage is introduced.

"**Any one-time** historical re-evaluation" is unambiguous: it explicitly includes a single, individual, one-time act — the exact thing (X) would have permitted. The specification does not distinguish "one-time, individually invoked" from "batch" as a basis for permissibility; it forbids re-evaluating a historical row **at all**, regardless of how that re-evaluation is invoked, absent the future PO decision.

## 4. What "historical" means, operationally

Per the engineering specification's own §J: **"historical" = any `research_signals` row that existed at the moment the Q5-B authorization mechanism's storage (`research_signal_global_authorizations`, migration 0059) was introduced.** This is a real, non-invented boundary — not a cutoff this clarification invents — already stated in the authoritative specification. A future correction to `authorizeSignalForSharing` would need to compare a signal's existence against that boundary (e.g., the recorded apply time of migration 0059, or an explicit go-live constant set once the gate is actually deployed) and reject any signal predating it, pending the future PO decision §3 above describes.

## 5. Implication for the current Phase I implementation (not acted on by this record)

`packages/core-research/src/signalAuthorization.ts`'s `authorizeSignalForSharing`, as built in the prior Phase I session, does **not** implement this boundary — it validates only the Q5-A floor and Phase H classification, and will currently authorize a signal regardless of how old the underlying research is. Per the determination in §2, this is **not compliant** with Q5-C and will need a future code change (adding the historical-row check described in §4) before Phase I can be considered fully conformant. **No code is changed by this record** — this is noted here only so the gap is tracked, pending separate authorization to implement the fix.

## 6. Status

**Clarification only.** Does not authorize code changes. Does not itself constitute the "future, separate, explicit Product Owner decision" §2/§J both require before any historical row may be reconsidered — that decision, if ever made, must be its own, distinct, explicitly-titled `*_PO_DECISION.md` record, exactly as both source documents require.
