# MVP REAL-USER VALIDATION TEMPLATE

**This is a blank template, not a completed validation record.** No session
has been run. Every field below is unfilled on purpose — filling it with
placeholder or synthetic data would misrepresent engineering verification as
real-user validation, which `requirement/MVP_SCOPE_BOUNDARY.md` §9 and §11
explicitly require to be kept separate.

One copy of this template = one real participant, one real session. Do not
batch multiple participants into a single copy.

---

## Session record

| Field | Value |
|---|---|
| Validation date | |
| Participant identifier (anonymized — never a real name/email) | |
| Facilitator | |
| Session format (in person / call / async written) | |

## Service definition used (§3 stage 1 — as entered by the participant, not assumed)

| Field | Value |
|---|---|
| Service | |
| Target customer | |
| Geography | |
| Minimum project value | |

## Search reviewed

| Field | Value |
|---|---|
| Search ID | |
| Opportunity IDs reviewed (one row below per opportunity) | |

## Per-opportunity judgment

Repeat this block once per opportunity the participant actually reviewed.

| Field | Value |
|---|---|
| Opportunity ID | |
| Business shown | |
| **Primary question — exact wording, do not paraphrase:** "Would you actually contact this business?" | Yes / No |
| Useful / not useful (§5.5) | |
| Reason (verbatim, participant's own words) | |
| Notable qualitative feedback (verbatim) | |

## Session-level notes

- Anything the participant said unprompted about trust, evidence, or fabrication (§9 criterion 9 — "the system does not fabricate business needs") should be recorded verbatim here, not summarized.
- Do not record secondary-outcome data (contacted / replied / sales conversation / won client) as part of THIS gate — §9 states those "do not gate engineering completion" and may be collected separately, later.

---

## How this closes the gate

Per `requirement/MVP_SCOPE_BOUNDARY.md` §9, the MVP's real-user validation
gate is closed only when a real person — not a developer, not a synthetic
fixture — has answered the primary question above for real, delivered
opportunities. A filled copy of this template, with a real (anonymized)
participant and unfabricated answers, is the evidence that gate requires.
Until at least one such copy exists, §9 remains NOT EVIDENCED regardless of
how complete the engineering surface is.
