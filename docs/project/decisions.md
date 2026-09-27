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

Documentation and code comments are important because this is a learning project. Internal comments should document non-obvious behavior, algorithms, assumptions, units/conventions, tradeoffs, design rationale, limitations, and important edge cases. Avoid internal comments that merely restate obvious code, property names, or simple syntax. Clear code should carry the obvious meaning; comments should preserve reasoning that the code alone does not communicate well.

Public engine API documentation is the deliberate exception: every exported public symbol must satisfy the API-documentation contract in D-025, so obvious public members may receive concise JSDoc for completeness without turning that style into a rule for internal code.

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

The engine's exported public API must be documented with JSDoc suitable for generated API documentation and must pass `deno doc --lint`. Every exported public symbol receives documentation; obvious members may use concise JSDoc, while non-obvious contracts should be documented in greater depth. Documentation should focus on what a caller needs to use the API correctly rather than restating TypeScript syntax.

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

**Status:** Accepted

Begin with a deliberately small repository structure: project continuity under `docs/project/`, a self-contained `src/engine/` boundary, a separate `src/visualization/` boundary, and `tests/` only for project-level/bootstrap tests. Feature-specific tests should normally be colocated with the module they exercise. Add deeper folders such as `integrators/`, `collisions/`, or `forces/` only when concrete implementations exist.

## D-027 — Prefer the Deno-native toolchain for bootstrap quality gates

**Status:** Accepted

Use Deno's built-in formatter, linter, type checker, test runner, task runner, and documentation generator rather than adding third-party equivalents. The normal bootstrap quality gate is `deno task verify`, combining formatting verification, linting, type checking, API-doc linting, and tests.

## D-028 — `src/engine/mod.ts` is the public engine entry module

**Status:** Accepted

Treat `src/engine/mod.ts` as the consumer-facing engine root. Renderers, debuggers, inspectors, experiment orchestration, and other external code should depend on exports from this root rather than importing engine implementation files directly. This gives the engine an explicit API/documentation boundary while still allowing internal structure to evolve incrementally.

## D-029 — Test files use `*.test.ts` and unit tests are colocated

**Status:** Accepted

Use the `*.test.ts` naming form (for example `vector2.test.ts`). Unit/module tests should normally live beside the implementation they exercise. Keep the root `tests/` tree for integration, end-to-end, bootstrap, or other project-level tests that do not naturally belong to one module. This keeps behavior and its tests discoverable together while avoiding a mirrored test tree.

## D-030 — Documentation synchronization is part of the pre-commit definition of done

**Status:** Accepted

Documentation affected by a feature must be reviewed before that feature is committed. `status.md` will normally change for each meaningful feature; `decisions.md`, `environment.md`, `project-map.md`, `project-context.md`, or other documentation should change only when the feature materially affects them. Run the normal verification gate and inspect the staged diff after documentation is synchronized so code, tests, generated API documentation, and project documentation form one coherent commit.

## D-031 — Project-owned filenames prefer lowercase kebab-case

**Status:** Accepted

Prefer lowercase kebab-case for project-owned filenames, including Markdown documentation and TypeScript modules. Preserve well-established conventional filenames such as `README.md`, `CHANGELOG.md`, and `LICENSE`. The convention improves consistency and avoids unnecessary case-sensitive path mistakes across platforms.

## D-032 — Root `README.md` is the project front door

**Status:** Accepted

Keep the root `README.md` focused on presenting vLab2D to a repository visitor: project purpose, a concise environment/status summary, structure, normal commands, and links into deeper project documentation. The README may summarize information needed at the front door, but detailed authoritative information belongs in the appropriate project document. The detailed working agreement belongs in `docs/project/workflow.md` rather than being duplicated in the README.

## D-033 — Project documentation avoids duplicated sources of truth

**Status:** Accepted

Prefer one authoritative location for each kind of project information and use links or concise summaries elsewhere. In particular, `status.md` records only the current checkpoint and next small goal rather than commit history; Git remains the implementation-history source. `deno.json` is authoritative for task definitions, while the root README provides the human-facing command summary. Stable repository identity belongs in `project-context.md`. Handoff and environment documents should point to those authoritative sources instead of copying fast-changing details.

This reduces synchronization work and prevents contradictory documentation as the project evolves.

## D-034 — Kinematic state is separate from integration behavior

**Status:** Accepted

`KinematicState` describes motion at a particular instant through position and velocity. It does not know how to advance itself through time.

Numerical integration is a separate responsibility performed by integrator implementations.

This separation allows the same state representation to be processed by different numerical methods without coupling the state to a specific algorithm.

## D-035 — Engine time is expressed in seconds

**Status:** Accepted

Simulation timestep values (`dt`) are expressed in seconds.

Consequently, kinematic quantities use consistent time-based units:

- velocity: world units per second
- acceleration: world units per second squared

Hosts whose native timing source uses another unit, such as browser milliseconds, are responsible for converting values at the engine boundary.

This keeps numerical equations expressed in their conventional form and avoids coupling the engine to a particular host timing API.

## D-036 — Engine world coordinates use mathematical axis orientation

**Status:** Accepted

The simulation engine uses a mathematical two-dimensional coordinate system:

- positive X points right
- positive Y points up

The engine does not adopt browser Canvas screen coordinates, where positive Y normally points downward.

Renderers are responsible for transforming world coordinates into their target display coordinate system.

This keeps simulation mathematics independent from rendering technology and allows conventional physical values such as downward gravitational acceleration to be represented with a negative Y component.

## D-037 — Integrator abstraction is deliberately deferred

**Status:** Accepted

`ExplicitEulerIntegrator` and `SemiImplicitEulerIntegrator` currently expose the same `integrate(...)` method shape.

This similarity is not considered sufficient evidence that the project has discovered the correct general-purpose integrator abstraction.

A future integration method may require different state, historical information, force data, or other inputs. Extracting an interface from only the first two implementations could prematurely constrain later designs.

The concrete integrators therefore remain independent classes for now.

A shared integrator contract should be introduced only after a real simulation consumer demonstrates which behavior must genuinely be interchangeable.

This follows the project principle that abstractions should emerge from concrete requirements rather than be introduced speculatively.

## D-038 — Kinematic simulation owns authoritative state

**Status:** Accepted

`KinematicSimulation` owns the current kinematic state and acceleration.

External consumers may observe these values but may not replace them directly. Runtime changes occur through validated public commands such as `setAcceleration(...)` and `step(...)`.

An injected integrator produces a candidate next state. The simulation validates that candidate before accepting it as authoritative state.

This keeps state mutation controlled by the engine boundary and prevents invalid external or injected behavior from silently corrupting the simulation.

## D-039 — Kinematic integration is represented by a narrow strategy contract

**Status:** Accepted

The engine defines `KinematicIntegrator` as the capability required by `KinematicSimulation` to advance kinematic state.

The interface is deliberately specific to `KinematicState`; it is not intended to define a universal numerical integration abstraction.

`ExplicitEulerIntegrator` and `SemiImplicitEulerIntegrator` implement this contract and can therefore be injected interchangeably into the simulation.

The abstraction was introduced only after a concrete consumer demonstrated the need for interchangeable integration behavior.

## D-040 — Worlds own body state

**Status:** Accepted

`KinematicWorld` owns the authoritative kinematic state associated with each body.

Bodies are identified externally by `BodyId` values. External consumers do not receive mutable body objects and do not access the world's internal body storage directly.

This preserves the engine's state-ownership boundary while allowing bodies to be referenced consistently by renderers, debuggers, future commands, and other engine consumers.

The current implementation uses a private `Map<BodyId, KinematicState>` because it is simple, explicit, and sufficient for the project's current requirements.

More specialized storage should be introduced only if a concrete requirement justifies it.

## D-041 — Body identifiers are world-local opaque values

**Status:** Accepted

`BodyId` identifies a body within the `KinematicWorld` that created it.

Callers may retain and compare body identifiers, but they should not assign meaning to the underlying numeric value or depend on the world's current identifier allocation strategy.

Body identifiers are not required to be globally unique across different worlds.

This keeps public identity independent from internal storage and leaves the engine free to change the representation or allocation strategy later if a concrete requirement demands it.

## D-042 — Kinematic worlds use injected integration behavior

**Status:** Accepted

`KinematicWorld` depends on the narrow `KinematicIntegrator` contract rather than on a concrete numerical integration algorithm.

The integration strategy is supplied when the world is created and is used to advance every body in that world.

This allows the same world behavior and initial conditions to be exercised with different integration algorithms, such as Explicit Euler and Semi-Implicit Euler, without changing `KinematicWorld`.

The dependency is injected because integration behavior is genuinely variable and already has multiple concrete implementations. No dependency-injection framework or additional abstraction is required.

All bodies in a `KinematicWorld` currently share one integrator and one world-level acceleration. Per-body integration policies or acceleration should be introduced only if a concrete requirement demonstrates their need.

## D-043 — World steps are atomic

**Status:** Accepted

A `KinematicWorld` step is committed only when every body's candidate next state has been successfully computed and validated.

During a step, candidate states are kept separate from authoritative body state. The world replaces its current states only after all candidates are known to be valid.

If integration of any body fails or produces invalid state, no body's authoritative state is changed.

This prevents a failed step from leaving the world partially advanced, where some bodies represent the new timestep while others still represent the previous one.

The invariant is:

> A world step either succeeds for every body or changes no body state.

## D-044 — World observation uses detached state

**Status:** Accepted

`KinematicWorld` does not expose references to its authoritative body state through its public observation API.

`getBodyState(...)` returns a detached copy of the requested `KinematicState`, including detached position and velocity values.

Collection-level observation similarly returns detached body snapshots rather than exposing the world's internal state objects.

This protects the engine's ownership boundary at runtime rather than relying solely on TypeScript `readonly` declarations, which do not provide runtime immutability.

An external consumer may therefore inspect or even improperly mutate its returned observation without changing the authoritative state owned by the world.

## D-045 — Collection observation does not expose world storage

**Status:** Accepted

`KinematicWorld` exposes bodies for observation through `KinematicBodySnapshot` values rather than exposing its private `Map<BodyId, KinematicState>`.

A body snapshot combines the body's world-local identity with its observed kinematic state and represents data rather than engine behavior.

The order of snapshots returned by the world is not part of the public contract. Consumers should use `BodyId` when identity matters rather than depending on iteration or storage order.

This keeps the public observation model independent from the world's internal storage representation and allows that representation to evolve without affecting external renderers, debuggers, inspectors, or other consumers.

## D-046 — Documentation is organized into indexed sections

**Status:** Accepted

As project documentation grows, related documents should be grouped into coherent sections under `docs/`.

Each documentation section should normally provide a `README.md` that acts as its entry point and index.

The section README should:

- explain the purpose and scope of the section;
- guide readers toward the appropriate focused documents;
- provide useful reading paths where appropriate;
- avoid duplicating detailed information whose authoritative home is another document.

The repository `README.md` remains the overall project front door and should link to section-level documentation entry points rather than becoming a flat catalog of every documentation file.

`docs/project/README.md` is the first implementation of this structure and indexes the project's context, status, decisions, conceptual map, environment, workflow, and handoff documentation.

Future documentation areas, such as software architecture, should follow the same pattern when their scope becomes substantial enough to justify a dedicated section.

This keeps documentation navigable as the project grows while preserving the existing principle that each piece of information should have one authoritative home.

## D-047 — Architecture documentation describes implemented architecture first

**Status:** Accepted

Architecture documentation should primarily explain structures, dependencies, ownership rules, and runtime flows that can be demonstrated by the current implementation.

Architectural principles that guide future work may also be documented, but they should be distinguishable from concrete implemented structure.

Possible future components and architectural directions must be identified explicitly as future possibilities rather than presented as though they already exist.

This gives architecture documentation three useful categories:

1. **implemented architecture** — structures and relationships visible in the current source;
2. **established architectural principles** — accepted rules that guide new work;
3. **future directions** — plausible capabilities or abstractions that have not yet been implemented.

The purpose is to keep the architecture documentation trustworthy for contributors and readers while still explaining how the project may evolve.

Architecture documentation should use diagrams where they materially improve understanding of structural relationships, dependency direction, ownership, or runtime data flow.

As the architecture grows, `docs/architecture/README.md` remains the section entry point. Focused architecture documents should be extracted only when the amount of real implemented architecture makes that split useful.

## D-048 — Browser rendering cadence is decoupled from simulation cadence

**Status:** Accepted

The browser host advances simulation time using a fixed timestep rather than using the variable time between rendered frames directly as the physics timestep.

`requestAnimationFrame` timestamps measure elapsed real time. The host accumulates that elapsed time and performs zero or more fixed-size `KinematicWorld.step(...)` calls before rendering the latest committed world state.

This keeps:

- simulation timestep stable;
- numerical integration behavior independent from display refresh rate;
- browser scheduling concerns outside the simulation engine;
- rendering frequency independent from simulation frequency.

The browser host may cap unusually large frame deltas before adding them to the accumulator. This prevents a suspended or heavily delayed browser tab from attempting an excessive backlog of simulation steps when execution resumes.

Rendering currently uses the latest completed fixed-step state. Interpolation between simulation states is intentionally deferred until a concrete need justifies the additional state and presentation complexity.

The current loop remains application/example code rather than being extracted into a reusable runtime abstraction. A dedicated simulation-loop abstraction should be introduced only if additional hosts or runtime requirements demonstrate that need.

## D-049 — World-to-display mapping is owned by a shared viewport transform

**Status:** Accepted

SVG and Canvas independently demonstrated the same viewport configuration and world-to-display coordinate mapping.

That concrete duplication is now extracted into `ViewportTransform`.

`ViewportTransform` owns:

- viewport width;
- viewport height;
- display units per world unit;
- placement of the world origin at the viewport center;
- conversion of world X coordinates into display X coordinates;
- inversion and conversion of mathematical world Y coordinates into display Y coordinates;
- validation of viewport dimensions and scale.

The transform is deliberately independent from rendering technology. It contains no SVG or Canvas behavior.

It is also independent from simulation-domain value types such as `Vector2`; coordinate conversion currently operates on numeric coordinates directly.

`SvgKinematicRenderer` and `CanvasKinematicRenderer` create and own their respective `ViewportTransform` internally. The transform is not currently injected because the project has not demonstrated a need for independently replaceable transformation behavior.

Existing renderer constructor shapes are preserved.

The extraction does not introduce a renderer interface, camera abstraction, matrix framework, scene graph, pan, zoom, or inverse display-to-world mapping.

Those capabilities should be introduced only when concrete visualization or interaction requirements establish their necessary shape.
