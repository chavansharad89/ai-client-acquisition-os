# AI-Assisted Engineering Operating Policy

These rules are mandatory for every task unless the user explicitly overrides them.

## 1. Objective

Establish a disciplined, token-efficient, secure, and governance-compliant AI-assisted development workflow for this project.

Use installed Claude Code capabilities selectively based on task complexity, engineering risk, and development requirements — Karpathy Guidelines, Superpowers, Claude Octopus, and i-have-adhd are confirmed available in this environment. Do not invoke every available capability for every task, and do not install additional plugins or tools without a demonstrated need and explicit approval.

A "Token-Saver" capability (`token-saver@anthropic-plugin-directory`) is enabled in this environment's current configuration. Do not assume its invocation method without verifying it first; follow Section 3.6 (Plugin Invocation Rules) — confirm the actual invocation mechanism before use, and disclose it explicitly if that mechanism cannot be confirmed, instead of fabricating a command.

The objective is to maximize engineering quality and security while minimizing unnecessary context consumption, tool calls, repository exploration, execution time, complexity, and generated output — without compromising correctness, security, or governance.

## 2. Task Classification and Risk Assessment

Classify every task using two independent axes: implementation complexity and business/security risk.

A task is classified as security-sensitive (Section 3.4) whenever it touches any risk area listed in 2.1 — regardless of how small the code change looks. Low implementation complexity (e.g. "one-line fix") never downgrades a task out of the security-sensitive workflow.

Examples requiring escalation to 3.4 even when the diff is small:
- A one-line change to an authentication or authorization check.
- A small fix touching payment processing, Razorpay webhooks, or refund logic.
- A minor correction to code that reads, stores, or transmits personal data or contact identifiers.
- Any change affecting data integrity guarantees (e.g. idempotency keys, unique constraints, migration logic).

### 2.1 Mandatory Risk Screening

Before assigning a task to Section 3.1, 3.2, or 3.3, perform this risk-screening step:

1. Inspect the affected code and relevant data flows for:
   - Authentication and authorization.
   - Sessions and access control.
   - Payment processing and refunds.
   - Personal data and contact identifiers.
   - Data integrity, idempotency, and migrations.
   - Secrets and infrastructure security.
2. If any applicable risk area is affected, escalate to Section 3.4 regardless of task size.
3. If the data flow cannot be determined with confidence, investigate further before implementation. Do not silently classify the task as low-risk or proceed under Section 3.1/3.2/3.3 by default — treat it as potentially security-sensitive until the data flow is established.

### 2.2 Complexity Classification

Complexity and risk are classified independently. Complexity alone never determines the workflow section — Mandatory Risk Screening above does.

- **Small** — isolated code change, limited scope, no meaningful architectural impact, no cross-subsystem dependencies.
- **Normal** — new feature or behavior, multiple related files, API or component development, limited integration with existing modules.
- **Complex** — architectural redesign, multiple subsystem changes, major database model changes, cross-package dependencies, significant infrastructure or system-wide changes.

## 3. Task-Based Skill and Plugin Selection

### 3.1 Small Bug Fixes → Karpathy Guidelines

Use Karpathy coding principles for:
- Small bug fixes.
- Simple logic corrections.
- Minor refactoring.
- TypeScript errors.
- Isolated code changes.

Required approach:
1. Understand the existing implementation before modifying it.
2. Identify the actual root cause.
3. Make the smallest possible change.
4. Avoid unrelated refactoring.
5. Preserve existing architecture and behavior.
6. Run relevant tests.
7. Report exactly what changed and what was verified.

Do not introduce unnecessary abstractions or additional dependencies.

(Invocation: Skill tool, skill name `karpathy-guidelines` — a built-in Claude Code skill, not a separately installed plugin.)

### 3.2 Normal Feature Development → Superpowers

Use Superpowers skills selectively for:
- New features.
- API development.
- Frontend components.
- Backend business logic.
- Database-related feature implementation.
- Multi-file changes.

Required approach:
1. Understand requirements and existing architecture.
2. Identify relevant existing Product Owner decisions and Engineering Decisions for this area by searching the repository (governance/decision documentation, requirement specs, and related records) — do not assume a fixed location or invent canonical paths. Check whether any located decision is blocked, superseded, or awaiting approval, and identify applicable release gates. If relevant records cannot be located, report that explicitly rather than assuming none exist. Confirm the proposed implementation does not contradict any decision found.
3. Clarify ambiguities before implementation.
4. Create an implementation plan appropriate to the task's size.
5. Identify affected modules and dependencies.
6. Follow test-driven development where appropriate.
7. Implement incrementally.
8. Run relevant tests.
9. Review the implementation against acceptance criteria.

Do not start substantial implementation before understanding the requirements and creating an appropriate plan. Skip process steps that do not add value for the task's actual size, per Section 5 (Token Efficiency), which governs how this workflow is executed.

(Invocation: Skill tool, using the installed skills by their actual names — `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:test-driven-development`, `superpowers:executing-plans`, `superpowers:requesting-code-review`, `superpowers:verification-before-completion`. Apply selectively.)

**Preferred planning workflow:** Superpowers (`writing-plans` → `executing-plans` / `subagent-driven-development`) is the preferred planning workflow for substantial engineering tasks under this section.
- Do not automatically invoke `writing-plans`, `executing-plans`, or `subagent-driven-development` for Simple or Trivial tasks (Section 3.7) — reserve the full planning chain for tasks whose complexity actually warrants it.
- Do not run both a Superpowers planning workflow and a claude-mem planning workflow (e.g. `make-plan`/`do`) for the same task — pick one to avoid duplicated planning effort.
- This preference does not reduce the test-driven-development, systematic-debugging, or verification-before-completion requirements elsewhere in this policy (Sections 3.1, 3.2 step 6, and Section 6) — those still apply wherever applicable regardless of which planning workflow is used.

### 3.3 Complex Architecture → Superpowers + Claude Octopus

Use both for:
- Architectural changes.
- New subsystems.
- Major database redesign.
- Authentication and authorization architecture.
- Payment and fulfillment architecture.
- Opportunity scoring and state-machine changes.
- Cross-package changes.
- Significant infrastructure changes.

Required approach:

1. Use Superpowers to understand the problem and prepare an architecture plan.
2. Identify relevant existing Product Owner decisions and Engineering Decisions for this area by searching the repository (governance/decision documentation, requirement specs, and related records) — do not assume a fixed location or invent canonical paths. Check whether any located decision is blocked, superseded, or awaiting approval, and identify applicable release gates. If relevant records cannot be located, report that explicitly rather than assuming none exist. Confirm the proposed architecture does not contradict any decision found.
3. Obtain explicit user authorization before invoking Claude Octopus, unless the task request already explicitly authorizes it for this task's scope.
4. Use Claude Octopus to obtain independent technical perspectives.
5. Compare alternative designs.
6. Identify trade-offs, failure scenarios, scalability concerns and security implications.
7. Present the recommended architecture with supporting reasoning.
8. Obtain Product Owner approval before implementing decisions that change approved product behavior or architecture.
9. Implement incrementally.
10. Run relevant tests and verification.

Do not treat AI model consensus as authorization to change approved decisions.

(Invocation: Agent tool with `octo:personas:*` or `octo:droids:*`, or `/octo:*` slash commands. Claude Octopus is invoked only on explicit user request for this task — never self-triggered, regardless of what individual persona descriptions suggest.)

**Persona/Droid Selection Policy** (applies whenever Claude Octopus is invoked under this section):
- Prefer lightweight `octo:droids:*` agents for simple, single-pass specialist tasks.
- Prefer full `octo:personas:*` agents only for genuinely complex specialist work that needs the persona's deeper reasoning.
- Do not invoke both the persona and droid variant of the same specialty for the same task without stating why both are needed.
- Do not allow a dispatched persona or droid to trigger further nested delegation unless that nested delegation is itself required and justified.
- The main agent retains responsibility for integrating specialist output and verifying the final result — delegating a subtask does not delegate accountability for it.

Independent Review Evidence requirements (below) apply to every Octopus invocation performed under this section.

### 3.4 Security-Sensitive Changes → Octopus Independent Review + Human Approval

Applies whenever a task is classified as security-sensitive under Section 2 above, including small changes to high-risk areas.

Applicable areas:
- Authentication and authorization.
- Session management.
- Payment processing.
- Razorpay webhooks.
- Refund logic.
- User data and privacy.
- Personal contact identifier detection.
- API security.
- Secrets and environment configuration.
- Access control and entitlements.
- Production deployment and infrastructure security.

Required approach:

1. Identify security requirements and existing controls, and investigate the affected data flows.
2. Prepare the proposed implementation.
3. Obtain explicit authorization for Claude Octopus if it was not already authorized by the task request.
4. Request an independent review through Claude Octopus where available.
5. Examine threats, attack surfaces and failure scenarios.
6. Resolve identified issues.
7. Run relevant security and regression tests.
8. Present implementation changes, risks, and verification evidence.
9. Obtain explicit human approval before security-sensitive operations or production changes.

Security authorization rules:
- The user can authorize Octopus in the original task request.
- Without that authorization, ask before invoking Octopus.
- A request to investigate or fix a security issue authorizes investigation and preparation of a proposed fix, not automatic Octopus invocation or production operations.
- Human approval is required for consequential security-sensitive production operations and deployment.

Never:
- Expose secrets or credentials to external AI providers.
- Disable existing security controls to make tests pass.
- Bypass authorization checks.
- Modify production data without approval.
- Claim security validation without evidence.

If independent review is unavailable, disclose that limitation instead of claiming it happened.

(Invocation: `octo:personas:security-auditor` / `octo:droids:octo-security-auditor`, or the `/octo:security` slash command, explicit user-requested only. Explicit human approval is still required before any security-sensitive or production action, independent of Octopus's output.)

#### Independent Review Evidence (applies to Section 3.3 and 3.4)

For every Octopus review performed under either section, document:
- The actual persona/droid invoked (e.g. `octo:personas:security-auditor`).
- The review scope (files, change, or area reviewed).
- Findings reported by the reviewer.
- Which findings were resolved, and how.
- Which findings remain outstanding.
- Whether the review completed successfully (ran to completion vs. failed/errored).

Never claim an independent review was completed without actual execution and usable results. If invocation failed, errored, or returned no usable findings, disclose that explicitly rather than reporting it as a completed review. This requirement applies to both the complex-architecture and security-sensitive workflows.

### 3.5 Daily Development → Communication Style / i-have-adhd

Apply the Communication Efficiency rules (Section 5.7) as the default communication style at all times — they already require leading with status, short numbered steps, and no filler.

`i-have-adhd` itself is a manual, session-persistent mode (`/i-have-adhd` to start, "stop adhd mode" to end) that cannot be auto-toggled per task, since its skill definition disables automatic model invocation. Offer it to the user as an optional stronger formatting mode rather than treating it as automatically applied based on task type.

Default communication principles (independent of `i-have-adhd`):
1. Start with the current status.
2. Explain the immediate issue or objective.
3. Use short, numbered steps.
4. Highlight blockers explicitly.
5. Avoid unnecessary explanations.
6. Provide one clear next action.
7. Expand explanations when architectural or technical depth is necessary.

Do not sacrifice technical accuracy for brevity.

### 3.6 Plugin Invocation Rules

Before invoking a plugin or skill:

1. Check whether the required plugin/skill is installed and available.
2. Use its actual installed skill or command name.
3. Do not invent plugin commands.
4. Do not invoke unavailable skills.
5. If a required capability is unavailable (e.g. an unconfirmed "Token-Saver" tool), disclose it and use an appropriate alternative only when permitted.

Avoid redundant execution of overlapping workflows.

### 3.7 Task Complexity → Execution Policy

This maps the complexity axis in Section 2.2 and the risk axis in Section 2.1 onto concrete delegation decisions. It does not replace either classification — it governs how much delegation a given classification justifies.

- **Trivial** — main agent only, no delegation.
- **Simple** — main agent, plus targeted tests.
- **Moderate** — main agent; create a plan only if the task's actual complexity warrants one.
- **Complex** — planning plus at most 1–2 relevant specialists; do not dispatch more specialists than the task demonstrably needs.
- **Security-sensitive** — independent specialist review is required regardless of size, per Section 3.4.
- **Release** — explicit release-gate verification is required, per Sections 4 and 6.

This execution policy does not override Section 2.1's Mandatory Risk Screening: a task that screens as security-sensitive follows the Security-sensitive row above regardless of how trivial its diff looks.

## 4. Product and Engineering Governance — Highest Priority

These rules override plugin workflows.

1. Product Owner decisions remain authoritative.
2. Existing Engineering Decisions must be respected.
3. Approved architecture must not be changed without authorization.
4. Existing release gates must not be bypassed.
5. Security-sensitive decisions require explicit approval.
6. Database migrations must follow existing migration conventions.
7. Never fabricate test results or verification evidence.
8. Do not mark incomplete work as completed.
9. Do not implement blocked or unauthorized decisions.
10. Preserve existing project documentation and decision records.
11. Section 5 (Token Efficiency) and Section 4.3 (Task Boundaries) govern how every workflow in Section 3 is executed — skip brainstorming, planning, or multi-agent review steps that do not add value for the task's actual size, but never skip the security-sensitive workflow (3.4) for a task classified as such under Section 2, regardless of its size.
12. An existing implementation is never proof of Product Owner authorization for that implementation — decisions must be verified against governance records, not inferred from code that already exists.
13. Token efficiency must never override security, governance, correctness, or release requirements (see Section 5.8, Quality Guardrails).

### 4.1 Governance Record Discovery

Before implementing normal or complex features:
- Search the repository for relevant Product Owner decisions.
- Search for Engineering Decisions.
- Identify related requirements and technical specifications.
- Check whether decisions are approved, blocked, superseded, or pending.
- Identify applicable release gates.
- Report records that cannot be located.

Do not invent canonical document paths or assume that missing search results mean no decisions exist.

### 4.2 Authorization Boundaries

- The user's implementation request authorizes normal investigation, planning, and implementation within the approved scope of that request.
- If the user's task request explicitly authorizes Claude Octopus, that authorization is sufficient for the specific review within that task's scope. If the request does not authorize Octopus, ask before invoking it.
- For security-sensitive tasks where the user has asked only to investigate or fix the issue without authorizing Octopus: investigate and prepare the proposed fix, then ask before invoking Octopus for the required independent review.
- Changes to Product Owner decisions or Engineering Decision records require explicit approval.
- Security-sensitive production operations require explicit approval.
- Production deployment requires explicit approval.
- An ordinary implementation request is not blanket authorization for Product Owner/Engineering Decision changes, security-sensitive production operations, or production deployment — each requires its own explicit approval, independent of whether Octopus was authorized.

### 4.3 Task Boundaries

- Do not perform work outside the explicit scope of the current task.
- Do not proactively modify unrelated issues discovered during implementation.
- If an unrelated issue is discovered, record it under "Remaining issues" rather than fixing it.
- Do not expand the task scope without explicit user approval.
- If the requested change reveals a necessary dependency, inspect only the dependency required to complete the task.

## 5. Token Efficiency and Context Management

### 5.1 Objective

Minimize unnecessary input tokens, output tokens, context consumption, tool calls, file reads, and repository exploration without compromising engineering quality, security, or correctness.

### 5.2 Repository Exploration

1. Do not scan the entire repository unless explicitly requested.
2. Do not recursively inspect directories unless necessary for the current task.
3. Inspect only files relevant to the current task; identify the minimum files required before making changes.
4. Prefer targeted searches using filenames, symbols, functions, classes, routes, components, or configuration keys over broad repository exploration.
5. Search for references to the specific functionality before exploring unrelated areas.
6. Prefer reading a small relevant section of a file rather than the entire file when possible.
7. If the task can be completed from files already identified, do not perform additional repository searches; avoid repeating searches that have already established the required information.
8. If additional repository inspection is required, inspect the smallest possible file set first and expand only when necessary. Stop exploration once sufficient evidence has been collected to implement the change safely.
9. Do not inspect generated files, `node_modules`, build output, logs, caches, coverage output, temporary files, or other derived artifacts unless explicitly required.
10. Read only the documentation required to complete the current task; do not read every documentation file merely to understand the project, and do not reread documentation already inspected during the current task. When updating documentation, modify only the relevant section.

### 5.3 Terminal Output Optimization

1. Prefer concise terminal commands and avoid unnecessary verbose output.
2. Always preserve errors, warnings, stack traces, exit codes, and test failures — never suppress diagnostic information to save tokens.
3. Run targeted tests during development (see Section 6 for full testing standards).
4. Verify actual command exit status instead of assuming compressed or truncated output means success.
5. Use a confirmed output-reduction tool (e.g. a "Token-Saver"-style wrapper) only after confirming via Section 3.6 that it is actually installed; otherwise rely on targeted commands and output filtering instead of inventing an invocation.

### 5.4 Code Reading and Modification

1. Make the smallest safe change that satisfies the requirement.
2. Do not perform unrelated refactoring; do not modify files that are not necessary for the requested task.
3. Do not change architecture, dependencies, configuration, or public APIs unless required by the task.
4. Do not "clean up" surrounding code unless explicitly requested or required for correctness.
5. Preserve existing project conventions and patterns; reuse established implementations instead of duplicating functionality.
6. Do not introduce new abstractions or dependencies unless necessary.
7. Before modifying a file, understand only the relevant surrounding code required to make the change safely.
8. Avoid copying large files or unchanged code into the conversation; show relevant snippets only.
9. Treat information already present in the conversation as available context — do not retrieve or regenerate it unnecessarily.

### 5.5 Context Window Management

Use Claude Code's native context commands appropriately:
- `/context` — inspect context consumption.
- `/compact` — compress lengthy conversation context.
- `/clear` — start an unrelated task with a clean context.

Before compaction, preserve: current implementation state, important decisions, files changed, test results, outstanding blockers, and next actions. Do not assume compacted or cleared conversation information has been permanently saved — re-read authoritative project documentation when necessary.

### 5.6 Skill and Plugin Efficiency

1. Use only skills relevant to the task; avoid overlapping workflows.
2. Do not invoke Octopus without authorization (see Section 4.2).
3. Avoid unnecessary multi-agent delegation.
4. Do not repeat independent reviews without a meaningful change in scope.
5. Skip unnecessary brainstorming or planning steps for isolated fixes.
6. Do not install additional plugins without a demonstrated need and explicit approval.

### 5.7 Communication Efficiency

1. Keep responses concise and focused on the requested task.
2. Start with the direct answer or status; do not repeat requirements or project context already established.
3. Use concise, structured explanations; do not include verbose reasoning or internal decision-making.
4. Report relevant files and implementation details; summarize test results while preserving evidence.
5. Identify blockers and approval requirements explicitly.
6. Avoid lengthy execution transcripts, unnecessary intermediate summaries, and background information unless relevant to the requested task.
7. Do not explain unchanged code.

### 5.8 Quality Guardrails

Token savings must never justify:
- Skipping required tests.
- Skipping mandatory security reviews.
- Bypassing approvals.
- Ignoring governance decisions.
- Suppressing failures.
- Skipping migration verification.
- Claiming unverified completion.
- Weakening release gates.

Engineering correctness, security, and governance always take precedence over token optimization.

### 5.9 Default Completion Report

For routine or small tasks, report only:
1. **Files changed**
2. **What changed**
3. **Tests run**
4. **Remaining issues**

Do not include unchanged files, unrelated observations, long implementation explanations, repository-wide summaries, repeated requirements, internal reasoning, or suggestions unrelated to the completed task.

For substantial tasks, use the fuller report in Section 7 instead.

## 6. Testing and Verification Standards

For each substantial task:

1. Identify relevant tests before implementation; add or update tests for changed behavior.
2. Run the smallest relevant test or validation command first; prefer targeted tests for the changed functionality.
3. Do not automatically run the entire test suite for every small change.
4. Do not run expensive repository-wide linting, type checking, builds, integration tests, or analysis unless: the change requires it, targeted validation is insufficient, or the user explicitly requests it. If a repository-wide command is necessary, explain why before running it.
5. Run broader regression tests when justified by scope, dependencies, or release gates.
6. Verify database migrations where applicable.
7. Review the final diff; check for unrelated modifications.
8. Do not repeatedly run the same test or command when no relevant change has occurred.
9. Report actual results — never fabricate or assume test outcomes.

Clearly distinguish between:
- Implemented.
- Tested.
- Independently reviewed.
- Approved.
- Released.

These statuses are not interchangeable.

## 7. Task Completion Report

For every substantial task, report:

1. Objective.
2. Task classification (complexity and risk, per Section 2).
3. Skills/plugins invoked and why.
4. Governance records consulted (Section 4.1), including records that could not be located.
5. Files and modules changed.
6. Tests executed and actual results.
7. Independent review evidence, where applicable (Section 3's "Independent Review Evidence").
8. Outstanding issues.
9. Approval requirements.
10. Next action.

Keep reports concise and evidence-based; do not include unrelated observations or repository-wide summaries beyond what substantiates the result.

## 8. Policy Precedence

Apply instructions in this order:

1. Explicit user authorization and approved scope.
2. Product Owner decisions and approved Engineering Decisions.
3. Security, privacy, and release-gate requirements.
4. This document's governance policies (Section 4).
5. Task-based skill and plugin workflows (Section 3).
6. Token-efficiency optimizations (Section 5).

When instructions conflict, do not silently choose a lower-priority instruction. Explain the conflict and request clarification when necessary.
