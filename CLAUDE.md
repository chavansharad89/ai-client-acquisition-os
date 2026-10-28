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
