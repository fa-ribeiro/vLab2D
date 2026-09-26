# Decisions and Architectural Intentions

Last updated: 2026-09-26

This file records decisions that should survive chat boundaries. Some entries are architectural intentions rather than implementation commitments; those are labeled accordingly.

## D-001 — Project is a learning/hobby project

**Status:** Accepted

The goal is not a professional, production-grade, full-featured physics engine. Learning and enjoyment take priority over completeness and industrial robustness.

## D-002 — Exploratory development

**Status:** Accepted

Do not fix an overly ambitious final goal. Build in small useful increments and allow future directions to emerge from curiosity and experiments.

## D-003 — Use established techniques

**Status:** Accepted

Physics algorithms and solutions should normally come from known methods. The learning challenge is understanding, implementing, observing, and comparing them rather than unnecessarily reinventing them.

## D-004 — Simulation and visualization should be independent

**Status:** Architectural intention

The physics/simulation core should not depend on a particular renderer, layout, debug overlay, panel, or logger.

## D-005 — Visual diagnostics are first-class

**Status:** Accepted

The project should make simulation state visible through optional indicators such as vectors, bounds, contacts, normals, trails, states, and other diagnostics.

## D-006 — Presentation components are optional/composable

**Status:** Architectural intention

Options panels, logger/console, diagnostic overlays, and other observers should be addable/removable without becoming intrinsic to the simulation itself.

## D-007 — Multiple worlds are a core experimental concept

**Status:** Accepted

The lab should eventually support two or more worlds for controlled comparisons, including different gravity, algorithms, and small initial-condition changes.

## D-008 — Multiple world presentation strategies

**Status:** Architectural intention

The same worlds may be displayed side by side, overlaid, or by other visualization/layout strategies without changing the underlying simulations.

## D-009 — Deterministic comparison matters

**Status:** Architectural intention

When comparing worlds, differences not intentionally varied should remain equal where practical: same initial state, timestep, generated objects, and random seed if randomness is introduced.

## D-010 — Avoid premature framework design

**Status:** Accepted

Do not begin with a large family of generic interfaces/plugins solely because they may be useful later. Extract abstractions when concrete second use cases appear.

## D-011 — Continuity documentation is a project requirement

**Status:** Accepted

Maintain a continuity pack containing project goals, current status, decisions, environment, workflow, and handoff instructions. Update it whenever materially relevant information changes.

## D-012 — Documentation explains intent, not syntax

**Status:** Accepted

Documentation and code comments are important because this is a learning project. Comments should document non-obvious behavior, algorithms, assumptions, units/conventions, tradeoffs, design rationale, limitations, and important edge cases. Avoid comments that merely restate obvious code, property names, or simple syntax. Clear code should carry the obvious meaning; comments should preserve the reasoning that the code alone does not communicate well.

## D-013 — Separation of concerns / focused responsibilities

**Status:** Accepted

Prefer components with a clear, focused responsibility. An object/module should know and do what its role requires, but should not accumulate unrelated physics, rendering, UI, logging, orchestration, or persistence concerns simply for convenience. This is a guiding principle rather than a rule that every class must be tiny.

## D-014 — Dependency inversion and explicit dependency injection

**Status:** Accepted

Prefer supplying meaningful external collaborators to components rather than having those components construct or secretly reach for their own dependencies. This should make behavior easier to vary, compare, test, and understand. Do not turn every value or trivial helper into an injected dependency; use dependency injection where the dependency represents a replaceable policy, service, strategy, or external capability.

Examples that may eventually be good injected policies include an integrator, collision detector/solver, logger/observer, clock/timestep source, or other behavior that genuinely has alternative implementations.

## D-015 — Pragmatic OOP with composition over inheritance

**Status:** Accepted

OOP is welcome where objects provide a natural model for meaningful concepts such as worlds, bodies, experiments, renderers, or observers. Prefer composition and replaceable behaviors over deep inheritance trees. Do not force every concept into a class, and do not create inheritance hierarchies solely to imitate real-world taxonomy.

## D-016 — Multi-behavior simulation architecture remains deliberately open

**Status:** Open / architectural question

We expect multiple simulations/worlds to differ in policies such as gravity, integration algorithm, timestep, or future solver behavior. Do not yet decide whether behavior lives directly on a `World`, in a CHIP-8-like runtime/simulator object, or in another composition. A promising hypothesis is to keep world state separate from the mechanism that advances it, then let an experiment coordinate multiple independent world/runtime pairs. This should be validated by the first concrete implementations before becoming a settled architecture.

## D-017 — Vanilla TypeScript and minimal dependencies

**Status:** Accepted

Use vanilla TypeScript and keep dependencies to a minimum. When project functionality can reasonably be implemented from scratch, prefer doing so because implementation itself is part of the learning exercise. Accept appropriate platform/tooling dependencies such as Deno and Deno standard-library utilities, especially for testing. Do not introduce a framework or third-party package solely to avoid learning or implementing a relevant concept.

## D-018 — Explanations must include rationale and alternatives

**Status:** Accepted

For meaningful technical choices, explain the concept/terminology, the proposed approach, why it fits the project, relevant industry practice, and credible alternatives. Include pros/cons and especially the important "why not" arguments so rejected approaches teach as much as the selected one. Clearly distinguish best practice from project-specific simplification.

## D-019 — Feature implementation is incremental and approval-gated

**Status:** Accepted

Implement features from the ground up in small steps. Walk through the code and architecture with explanations, formatted code, and relevant tests. Do not treat an implementation as settled until the user has reviewed/approved it. Once approved, record/commit the completed feature before moving to the next feature. This is both a learning workflow and a project-management discipline.

## D-020 — Behavioral subsystems should be modular and interchangeable

**Status:** Accepted

Design behavioral areas that genuinely vary as independent, composable implementations. Expected examples include numerical integrators, collision detectors, collision solvers, force models, and later other simulation policies. A simulated world/experiment should be able to plug in different implementations so behaviors can be compared without rewriting unrelated code. Keep this modularity concrete and avoid generic plugin abstractions before real alternate implementations exist.

## D-021 — Testing favors trust over coverage metrics

**Status:** Accepted

Testing is first-class. Prefer solid, behavior-focused tests over chasing a coverage percentage. Tests should exercise contracts, meaningful edge cases, numerical/geometry boundaries where applicable, and error handling. Test code must itself be understandable and trustworthy; a high coverage number is not a substitute for useful assertions.

## D-022 — Folder structure should communicate modularity

**Status:** Accepted

When the source layout is introduced, its structure should help a reader understand responsibilities and replaceable subsystems. Organize around coherent project concepts/modules rather than an arbitrary file taxonomy, while avoiding needless nesting for tiny early milestones.

## D-023 — Visual explanations are part of the learning/documentation style

**Status:** Accepted

The user is a visually oriented learner. When a structural, relational, algorithmic, or abstract concept becomes clearer when seen, complement prose with diagrams or schemes, preferring Mermaid in Markdown documentation. Diagrams should clarify rather than decorate, and should be accompanied by text and practical examples where useful.

## D-024 — Engine owns mutation; external access is read-only and command-driven

**Status:** Accepted

The simulation engine must be a self-contained module that owns its mutable state and preserves its invariants. External components such as renderers, debuggers, inspectors, loggers, or experiment orchestration code must not mutate internal body/world objects directly.

The engine should expose two conceptually separate boundaries:

1. **Observation/query boundary** — provides read-only simulation information suitable for rendering, inspection, comparison, diagnostics, and metrics. The implementation must avoid leaking mutable internal references merely because TypeScript marks a type as `readonly`; where necessary, use snapshots, immutable views, copies, or other controlled representations.
2. **Command/control boundary** — accepts validated requests such as changing gravity, applying a force/impulse, adding/removing entities, pausing/resetting, or changing supported runtime parameters. The engine decides when and how those requests become state changes so invariants and timestep consistency are preserved.

This boundary should make invalid or unsafe state transitions difficult or impossible from outside the engine. It also supports deterministic experiments, logging, testing, and later alternate front ends. The exact API shape (direct methods, command objects, queued commands, transactional update phase, etc.) remains open until concrete use cases justify it.

## D-025 — Public engine API is a first-class documented contract

**Status:** Accepted

The engine's public observation and command/control APIs must be especially well documented with JSDoc suitable for generated API documentation. Documentation should focus on the contract a caller needs to use the API correctly rather than restating TypeScript syntax.

For public API members, document as applicable:

- semantic purpose and intended use
- parameter meaning, including units and coordinate/time conventions
- return-value meaning and ownership/lifetime expectations
- mutation and side effects
- validation rules and rejected/invalid inputs
- errors or exceptional outcomes
- simulation-phase/timing constraints, including whether a request is immediate or deferred
- invariants preserved by the engine
- determinism/reproducibility implications where relevant
- examples for APIs whose correct use is not obvious
- important performance or allocation characteristics when they affect callers

Internal implementation details should not leak into the public contract unless callers genuinely need them. Public documentation should make it difficult for a third-party renderer, debugger, inspector, experiment runner, or other consumer to misuse the engine.

Prefer Deno's native `deno doc` tooling for generated documentation because it directly consumes JSDoc, can lint public API documentation, and can generate searchable static HTML without adding a documentation dependency. Re-evaluate third-party generators only if a concrete requirement is not met by Deno's tooling.

## D-026 — Initial repository structure

**Status:** Proposed / pending v0.0.0 approval

Begin with a deliberately small repository structure: project continuity under `docs/project/`, a self-contained `src/engine/` boundary, a separate `src/visualization/` boundary, and `tests/` only for project-level/bootstrap tests. Feature-specific tests should normally be colocated with the module they exercise. Add deeper folders such as `integrators/`, `collisions/`, or `forces/` only when concrete implementations exist.

## D-027 — Prefer the Deno-native toolchain for bootstrap quality gates

**Status:** Proposed / pending v0.0.0 approval

Use Deno's built-in formatter, linter, type checker, test runner, task runner, and documentation generator rather than adding third-party equivalents. The normal bootstrap quality gate is `deno task verify`, combining formatting verification, linting, type checking, API-doc linting, and tests.

## D-028 — `src/engine/mod.ts` is the public engine entry module

**Status:** Proposed / pending v0.0.0 approval

Treat `src/engine/mod.ts` as the consumer-facing engine root. Renderers, debuggers, inspectors, experiment orchestration, and other external code should depend on exports from this root rather than importing engine implementation files directly. This gives the engine an explicit API/documentation boundary while still allowing internal structure to evolve incrementally.
