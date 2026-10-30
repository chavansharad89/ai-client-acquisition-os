## Token / Context Efficiency

These rules are mandatory for every task unless the user explicitly overrides them.

The objective is to minimize unnecessary context consumption, tool calls, file reads, repository exploration, and generated output while maintaining correctness.

### Repository Inspection

* Do not scan the entire repository unless explicitly requested.
* Do not recursively inspect directories unless necessary for the current task.
* Inspect only files relevant to the current task.
* Before making changes, identify the minimum files required.
* Prefer targeted searches over broad repository exploration.
* If the task can be completed from files already identified, do not perform additional repository searches.
* If additional repository inspection is required, inspect the smallest possible file set first and expand only when necessary.
* Do not inspect generated files, `node_modules`, build output, logs, caches, coverage output, temporary files, or other derived artifacts unless explicitly required.
* Do not reread documentation already available in the current context.
* Reuse information already established in the conversation instead of retrieving it again.

### Implementation Discipline

* Make the smallest safe change that satisfies the requirement.
* Do not perform unrelated refactoring.
* Do not modify files that are not necessary for the requested task.
* Do not change architecture, dependencies, configuration, or public APIs unless required by the task.
* Do not "clean up" surrounding code unless explicitly requested or required for correctness.
* Preserve existing project conventions and patterns.
* Do not duplicate existing functionality when an existing implementation can be reused.
* Do not introduce new abstractions unless they are necessary.
* Before modifying a file, understand only the relevant surrounding code required to make the change safely.

### Search Strategy

* Prefer exact or targeted searches using filenames, symbols, functions, classes, routes, components, or configuration keys.
* Search for references to the specific functionality before exploring unrelated areas.
* Prefer reading a small relevant section of a file rather than the entire file when possible.
* Avoid repeating searches that have already established the required information.
* Do not search for information that is already known from the current task context.
* Stop repository exploration once sufficient evidence has been collected to implement the change safely.

### Documentation Efficiency

* Read only the documentation required to complete the current task.
* Do not read every documentation file merely to understand the project.
* Do not reread documentation that has already been inspected during the current task.
* When documentation contains the required information, do not search for duplicate explanations elsewhere.
* When updating documentation, modify only the relevant section.

### Testing Efficiency

* Run the smallest relevant test or validation command first.
* Prefer targeted tests for the changed functionality.
* Do not automatically run the entire test suite for every small change.
* Do not run expensive repository-wide linting, type checking, builds, integration tests, or analysis unless:

  * the change requires it,
  * the targeted validation is insufficient, or
  * the user explicitly requests it.
* If a repository-wide command is necessary, explain why before running it.
* Do not repeatedly run the same test or command when no relevant change has occurred.

### Context Management

* Treat information already present in the conversation as available context.
* Do not retrieve or regenerate information unnecessarily.
* Do not repeat large file contents in responses.
* Do not paste unchanged code unless explicitly requested.
* Keep tool output and explanations focused on the current task.
* Avoid unnecessary intermediate summaries.
* Do not explain unchanged code.
* Do not provide background information unless it is relevant to the requested task.

### Response Efficiency

* Keep responses concise and focused on the requested task.
* Do not repeat requirements already provided by the user.
* Do not repeat project context already established.
* Do not provide unnecessary implementation explanations.
* Do not include verbose reasoning or internal decision-making.
* Report only information useful for understanding the result.

### Task Boundaries

* Do not perform work outside the explicit scope of the current task.
* Do not proactively modify unrelated issues discovered during implementation.
* If an unrelated issue is discovered, record it under "Remaining issues" rather than fixing it.
* Do not expand the task scope without explicit user approval.
* If the requested change reveals a necessary dependency, inspect only the dependency required to complete the task.

### Completion Report

After completing the task, report only:

1. **Files changed**
2. **What changed**
3. **Tests run**
4. **Remaining issues**

Do not include:

* Unchanged files
* Unrelated observations
* Long implementation explanations
* Repository-wide summaries
* Repeated requirements
* Internal reasoning
* Suggestions unrelated to the completed task


# AI-Assisted Engineering Workflow Policy

## 1. Objective

Use installed Claude Code plugins and skills selectively based on task complexity, engineering risk, and development requirements.

Do not invoke every available plugin for every task.

The objective is to maximize engineering quality while minimizing unnecessary token consumption, execution time, and complexity.

## 2. Task-Based Plugin Selection

### Task Classification (Complexity × Risk)

Task classification must consider two independent axes: implementation complexity and business/security risk. A task is classified as security-sensitive (Section 2.D) whenever it touches any of the risk areas listed in 2.D — regardless of how small the code change looks. Low implementation complexity (e.g. "one-line fix") never downgrades a task out of the security-sensitive workflow.

Examples requiring escalation to 2.D even when the diff is small:
- A one-line change to an authentication or authorization check.
- A small fix touching payment processing, Razorpay webhooks, or refund logic.
- A minor correction to code that reads, stores, or transmits personal data or contact identifiers.
- Any change affecting data integrity guarantees (e.g. idempotency keys, unique constraints, migration logic).

#### Mandatory Risk Screening

Before assigning a task to Section 2.A, 2.B, or 2.C, perform this risk-screening step:

1. Inspect the affected code and relevant data flows for:
   - Authentication and authorization.
   - Sessions and access control.
   - Payment processing and refunds.
   - Personal data and contact identifiers.
   - Data integrity, idempotency, and migrations.
   - Secrets and infrastructure security.
2. If any applicable risk area is affected, escalate to Section 2.D regardless of task size.
3. If the data flow cannot be determined with confidence, investigate further before implementation. Do not silently classify the task as low-risk or proceed under Section 2.A/2.B/2.C by default — treat it as potentially security-sensitive until the data flow is established.

#### Task Complexity Boundaries

Complexity and risk are classified independently. Complexity alone never determines the workflow section — Mandatory Risk Screening above does.

- **Small** — isolated code change, limited scope, no meaningful architectural impact, no cross-subsystem dependencies.
- **Normal** — new feature or behavior, multiple related files, API or component development, limited integration with existing modules.
- **Complex** — architectural redesign, multiple subsystem changes, major database model changes, cross-package dependencies, significant infrastructure or system-wide changes.

### A. Small Bug Fixes → Karpathy Principles

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

### B. Normal Feature Development → Superpowers

Use Superpowers for:
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
4. Create an implementation plan.
5. Identify affected modules and dependencies.
6. Follow test-driven development where appropriate.
7. Implement incrementally.
8. Run relevant tests.
9. Review the implementation against acceptance criteria.

Do not start substantial implementation before understanding the requirements and creating an appropriate plan.

(Invocation: Skill tool, e.g. `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:test-driven-development`. Apply selectively — skip process steps that do not add value for the task's actual size, per Token / Context Efficiency above, which governs how this workflow is executed.)

### C. Complex Architecture → Superpowers + Claude Octopus

Use both tools for:
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
3. Use Claude Octopus to obtain independent technical perspectives.
4. Compare alternative designs.
5. Identify trade-offs, failure scenarios, scalability concerns and security implications.
6. Present the recommended architecture with supporting reasoning.
7. Obtain Product Owner approval before implementing decisions that change approved product behavior or architecture.
8. Implement incrementally.
9. Run relevant tests and verification.

Do not treat AI model consensus as authorization to change approved decisions.

(Invocation: Agent tool with `octo:personas:*` or `octo:droids:*`, or `/octo:*` slash commands. Claude Octopus is invoked only on explicit user request for this task — never self-triggered, regardless of what individual persona descriptions suggest.)

Independent Review Evidence requirements (below, under Section 2.D) apply to every Octopus invocation performed under this section as well.

### D. Security-Sensitive Changes → Octopus Independent Review + Human Approval

Applies whenever a task is classified as security-sensitive under "Task Classification" above, including small changes to high-risk areas.

Applicable areas:
- Authentication and authorization.
- Session management.
- Payment processing.
- Razorpay webhooks.
- User data and privacy.
- Personal contact identifier detection.
- API security.
- Secrets and environment configuration.
- Access control and entitlements.
- Production deployment and infrastructure security.

Required approach:

1. Identify security requirements and existing controls.
2. Prepare the proposed implementation.
3. Request an independent review through Claude Octopus where available.
4. Examine threats, attack surfaces and failure scenarios.
5. Resolve identified issues.
6. Run relevant security tests.
7. Present implementation changes, risks and verification evidence.
8. Obtain explicit human approval before security-sensitive operations or production changes.

Never:
- Expose secrets to external AI providers.
- Disable existing security controls to make tests pass.
- Bypass authorization checks.
- Modify production data without approval.
- Claim security validation without evidence.

If independent review is unavailable, disclose that limitation instead of claiming it happened.

(Invocation: `octo:personas:security-auditor` / `octo:droids:octo-security-auditor`, or the `/octo:security` slash command, explicit user-requested only. Explicit human approval is still required before any security-sensitive or production action, independent of Octopus's output.)

#### Independent Review Evidence (applies to Section 2.C and Section 2.D)

For every Octopus review performed under either section, document:
- The actual persona/droid invoked (e.g. `octo:personas:security-auditor`).
- The review scope (files, change, or area reviewed).
- Findings reported by the reviewer.
- Which findings were resolved, and how.
- Which findings remain outstanding.
- Whether the review completed successfully (ran to completion vs. failed/errored).

Never claim an independent review was completed without actual execution and usable results. If invocation failed, errored, or returned no usable findings, disclose that explicitly rather than reporting it as a completed review.

### E. Daily Development → i-have-adhd Communication Principles

Apply this project's existing Response Efficiency rules (above) as the default communication style at all times — they already require leading with status, short numbered steps, and no filler.

`i-have-adhd` itself is a manual, session-persistent mode (`/i-have-adhd` to start, "stop adhd mode" to end) that cannot be auto-toggled per task, since its skill definition disables automatic model invocation. Offer it to the user as an optional stronger formatting mode rather than treating it as automatically applied based on task type.

Required communication style (default, independent of `i-have-adhd`):
1. Start with the current status.
2. Explain the immediate issue or objective.
3. Use short, numbered steps.
4. Highlight blockers explicitly.
5. Avoid unnecessary explanations.
6. Provide one clear next action.
7. Expand explanations when architectural or technical depth is necessary.

Do not sacrifice technical accuracy for brevity.

## 3. Engineering Governance — Highest Priority

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
11. Token / Context Efficiency and Task Boundaries rules (above) govern how every workflow in Section 2 is executed — skip brainstorming, planning, or multi-agent review steps that do not add value for the task's actual size, but never skip the security-sensitive workflow (2.D) for a task classified as such under "Task Classification," regardless of its size.
12. An existing implementation is never proof of Product Owner authorization for that implementation — decisions must be verified against governance records, not inferred from code that already exists.

### Authorization Boundaries

- The user's implementation request authorizes normal investigation, planning, and implementation within the approved scope of that request.
- If the user's task request explicitly authorizes Claude Octopus, that authorization is sufficient for the specific review within that task's scope. If the request does not authorize Octopus, ask before invoking it.
- For security-sensitive tasks where the user has asked only to investigate or fix the issue without authorizing Octopus: investigate and prepare the proposed fix, then ask before invoking Octopus for the required independent review.
- Changes to Product Owner decisions or Engineering Decision records require explicit approval.
- Security-sensitive production operations require explicit approval.
- Production deployment requires explicit approval.
- An ordinary implementation request is not blanket authorization for Product Owner/Engineering Decision changes, security-sensitive production operations, or production deployment — each requires its own explicit approval, independent of whether Octopus was authorized.

## 4. Plugin Invocation Rules

Before invoking a plugin or skill:

1. Check whether the required plugin/skill is installed and available.
2. Use its actual installed skill or command name.
3. Do not invent plugin commands.
4. Do not invoke unavailable skills.
5. If a required capability is unavailable, disclose it and use an appropriate alternative only when permitted.

Avoid redundant execution of overlapping workflows.

## 5. Execution and Reporting

For every substantial task, report:

- Objective.
- Approach selected.
- Files and modules changed.
- Tests executed.
- Test results.
- Outstanding issues.
- Approval requirements.
- Next action.

Always distinguish between:
- Implemented.
- Tested.
- Independently reviewed.
- Approved.
- Released.

These statuses are not interchangeable.