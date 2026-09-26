# Workflow and Working Arrangement

Last updated: 2026-09-26

## Development style

- Work in small, visible, satisfying increments.
- Prefer a runnable experiment over a large unfinished architecture.
- Introduce one meaningful concept/problem at a time when possible.
- Allow code to become slightly uncomfortable before extracting abstractions.
- Refactor because a real need has appeared, not because a pattern is fashionable.
- Prefer focused responsibilities and separation of concerns.
- Prefer composition over inheritance for varying behavior.
- Inject replaceable collaborators/policies explicitly when doing so clarifies dependencies or enables meaningful alternatives; avoid ceremonial DI for trivial values/helpers.
- Keep optional future ideas in a backlog rather than treating them as commitments.

## Learning style

When a new technical problem appears:

1. State the problem clearly.
2. Identify the standard approaches that are appropriate for this level of project.
3. Explain the relevant idea and tradeoffs.
4. Choose the simplest approach that teaches something useful.
5. Implement a small version.
6. Observe it visually and/or with diagnostics.
7. Compare alternatives when the comparison itself is interesting.
8. Refactor only when the implementation gives us evidence that refactoring is useful.

## Documentation and code-comment style

Documentation is part of the learning process, not an afterthought.

Use comments and documentation to explain **why**, **what is non-obvious**, and **what tradeoff or algorithm is being used**. Avoid comments that merely restate syntax or obvious names.

Good candidates for comments/docs include:

- non-obvious invariants, units, coordinate conventions, or assumptions
- algorithms whose behavior is not obvious from the code alone
- numerical methods and why a particular method is being used
- tricky collision/geometry logic
- reasons behind an architectural or implementation choice
- known limitations, approximations, and intentionally simplified behavior
- important edge cases and surprising consequences
- public APIs whose contract is not obvious from the type signature

Usually avoid comments such as “x coordinate”, “increment index”, or comments that just translate a line of TypeScript into English. Prefer clear names and small functions for obvious code.

When introducing a significant algorithm, prefer a short nearby explanation plus, when useful, a more complete project note or reference. The code should remain readable without turning every file into a textbook.

Documentation should help a future version of the user answer: “Why did I write it this way, what idea is this implementing, and what should I be careful about if I change it?”

## ChatGPT collaboration rules

- Preserve the user's opportunity to learn; do not automatically replace exploration with large finished solutions.
- Help with architecture, debugging, algorithms, TypeScript, visualization, UI, and project management.
- Prefer explanations grounded in the concrete problem currently encountered.
- Clearly distinguish a learning implementation from a production solution.
- When proposing classes/interfaces, explain the responsibility and dependency boundary they are intended to protect.
- Do not introduce deep inheritance trees when composition or a simple function/object would express the behavior more clearly.
- Avoid expanding scope merely because a professional engine might include a feature.
- Track meaningful decisions in `DECISIONS.md`.
- Track operational progress in `STATUS.md`.
- Track tooling/version changes in `ENVIRONMENT.md`.
- Update `PROJECT_CONTEXT.md` if the project's identity, major goals, architecture, or handoff protocol changes.

## Continuity maintenance trigger

Update the continuity pack after any of the following:

- a goal becomes important or is dropped
- an architectural decision is made/reversed
- a new dependency/tool/framework is adopted
- environment commands or versions change
- a milestone is completed
- the next milestone changes materially
- a workflow/working-arrangement preference changes
- a significant unresolved issue should survive into another chat

Minor coding discussion does not need documentation unless it affects future work.

## New-chat workflow

At the beginning of a new chat:

1. Load the continuity pack.
2. Load the source repository/files needed for the current task.
3. Read `STATUS.md` for where work stopped.
4. Read `DECISIONS.md` before proposing architectural changes.
5. Read `ENVIRONMENT.md` before giving setup/build commands.
6. Continue the existing project rather than restarting its design.
7. Update the pack as new durable information emerges.

## Feature implementation / approval loop

For each meaningful feature, default to this loop:

1. Define the smallest useful behavior and its place in the architecture.
2. Explain the relevant concepts, terminology, standard approaches, and tradeoffs.
3. Present the proposed approach and explicitly explain why it is preferred here and why plausible alternatives are not being selected yet.
4. Implement from the ground up in small, understandable pieces.
5. Walk through the formatted code, including how dependencies and responsibilities fit the wider design.
6. Add JSDoc/comments where intent, contracts, algorithms, assumptions, units, limitations, or rationale are not obvious from the code itself.
7. Add relevant tests, prioritizing trustworthy behavior/edge-case coverage over coverage percentage.
8. Run/inspect the feature and tests when execution is available.
9. Stop for user review/approval before treating the feature as settled.
10. After approval, record/commit the feature and update continuity documentation as needed before moving to the next feature.

## Technical-choice explanation standard

When presenting a meaningful choice, include as applicable:

- what the concept/technology/algorithm is
- how it works at an appropriate level
- why it fits the current problem
- relevant industry best practice/pattern
- advantages
- disadvantages/tradeoffs
- credible alternatives
- why those alternatives are not preferred _for this step_
- whether the choice is a learning simplification or something we would also expect in production code

Do not hide important tradeoffs behind "best practice" language.

## Modularity and dependency policy

- Use vanilla TypeScript.
- Keep external dependencies minimal; prefer implementing relevant mechanisms ourselves.
- Deno and appropriate Deno standard-library utilities are acceptable infrastructure, particularly for tests.
- Make genuinely variable behavior replaceable/composable: integrators, collision detection, collision solving, forces, and similar policies should be able to evolve toward independent implementations as concrete alternatives appear.
- Let the folder/module structure make these boundaries visible without prematurely creating a framework.

## Testing standard

- Treat tests as part of the feature, not optional cleanup.
- Prefer Deno's native testing facilities and suitable Deno standard-library assertions/utilities.
- Test contracts and behavior rather than implementation details where practical.
- Include important edge cases and error paths.
- Numerical code should use assertions/tolerances appropriate to floating-point behavior rather than brittle exact comparisons when exact equality is not a valid contract.
- Prefer a smaller suite we trust over superficial tests added only to increase coverage.

## Visual-learning standard

For structural, relational, process-oriented, or abstract topics, consider a Mermaid diagram alongside prose. Prefer the pattern **explanation + diagram + practical example** when it materially improves understanding. Do not diagram trivial concepts merely for decoration.

## Public API documentation standard

Treat the engine's exported API as a consumer-facing contract. Public observation/query and command/control members should receive JSDoc whenever callers need semantic information beyond the TypeScript signature.

For each meaningful public API, document as applicable:

- what the operation means in simulation terms
- parameter semantics and units
- coordinate-system/time conventions
- returned-data ownership and mutability guarantees
- whether the call mutates engine state or only observes it
- validation rules, rejected inputs, and errors
- when the state change takes effect
- invariants preserved by the operation
- relevant determinism or reproducibility behavior
- a concise example when usage is not self-evident

Do not add verbose documentation for obvious accessors or trivial values when the type/name fully communicate the contract. Documentation must teach correct use, not narrate syntax.

When a public root module exists, include `deno doc --lint` in the documentation-quality workflow and generate searchable HTML with `deno doc --html`. Prefer native Deno documentation tooling over a third-party generator unless a demonstrated project need justifies the dependency.
