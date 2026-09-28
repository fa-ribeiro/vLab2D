# Decisions and Architectural Intentions

Last updated: 2026-09-28

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

**Status:** Superseded by D-060 through D-064

This decision originally kept the boundary between world state, simulation orchestration, and runtime behavior deliberately open while the project gathered implementation evidence.

The later architecture checkpoint establishes a clearer direction: `World` owns authoritative body runtime state and world-level policies; `Simulation` coordinates one or more worlds; `Runtime` drives simulation execution and host scheduling; visualization remains independent observation/presentation. See D-060 through D-064.

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

## D-034 — Runtime motion state is separate from integration behavior

**Status:** Accepted; representation evolved by D-066

The original `KinematicState` class established that motion state describes position and velocity at a particular instant while numerical integration remains separate behavior.

Phase 1B.1 keeps that separation but replaces the constructible `KinematicState` class with the structural `BodyState` runtime-data contract. Integrators continue to advance state without state values knowing how to advance themselves through time.

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

**Status:** Superseded by D-040 and D-066

`KinematicSimulation` originally established authoritative state ownership, validated stepping, and injected integration behavior for one state value.

`KinematicWorld` later became the real multi-body state owner, preserving those invariants at world scope. Phase 1B.1 therefore retires the obsolete single-state `KinematicSimulation` rather than carrying two competing state-owning runtime concepts forward.

The future `Simulation` concept has a different role: orchestration of one or more Worlds rather than ownership of one body's runtime state.

## D-039 — Kinematic integration is represented by a narrow strategy contract

**Status:** Accepted

The engine defines `KinematicIntegrator` as the capability required by the World to advance current `BodyState` from an acceleration and timestep.

The interface remains deliberately specific to kinematic motion; it is not intended to define a universal numerical integration abstraction.

`ExplicitEulerIntegrator` and `SemiImplicitEulerIntegrator` implement this contract and can therefore be injected interchangeably into a World.

Phase 1B.1 deliberately keeps the `KinematicIntegrator` name because its current inputs and outputs still describe a genuinely narrow kinematic integration responsibility.

## D-040 — Worlds own body state

**Status:** Accepted

`KinematicWorld` owns the authoritative kinematic state associated with each body.

Bodies are identified externally by `BodyId` values. External consumers do not receive mutable body objects and do not access the world's internal body storage directly.

This preserves the engine's state-ownership boundary while allowing bodies to be referenced consistently by renderers, debuggers, future commands, and other engine consumers.

The current implementation uses a private `Map<BodyId, WorldBody>` whose runtime `state` is a `BodyState`. The additional internal record also retains the reusable `Body` definition associated with each world-local instance.

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

`getBodyState(...)` returns a detached `BodyState`, including detached position and velocity values.

Collection-level observation similarly returns detached body snapshots rather than exposing the world's internal state objects.

This protects the engine's ownership boundary at runtime rather than relying solely on TypeScript `readonly` declarations, which do not provide runtime immutability.

An external consumer may therefore inspect or even improperly mutate its returned observation without changing the authoritative state owned by the world.

## D-045 — Collection observation does not expose world storage

**Status:** Accepted

`KinematicWorld` exposes bodies for observation through `BodySnapshot` values rather than exposing its private body-state storage.

A body snapshot combines the body's world-local identity with its detached `BodyState` observation and represents data rather than engine behavior.

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
- initial placement of the world origin at the viewport center, later generalized by D-052 into a mutable world-space viewport center;
- conversion of world X coordinates into display X coordinates;
- inversion and conversion of mathematical world Y coordinates into display Y coordinates;
- validation of viewport dimensions and scale.

The transform is deliberately independent from rendering technology. It contains no SVG or Canvas behavior.

It is also independent from simulation-domain value types such as `Vector2`; coordinate conversion currently operates on numeric coordinates directly.

`SvgKinematicRenderer` and `CanvasKinematicRenderer` create and own their respective `ViewportTransform` internally. The transform is not currently injected because the project has not demonstrated a need for independently replaceable transformation behavior.

Existing renderer constructor shapes are preserved.

The extraction does not introduce a renderer interface, camera abstraction, matrix framework, scene graph, pan, zoom, or inverse display-to-world mapping.

Those capabilities should be introduced only when concrete visualization or interaction requirements establish their necessary shape.

## D-050 — Canvas is the primary visualization target

**Status:** Accepted

Canvas and canvas-like interactive rendering are the primary visualization target for vLab2D and should drive the design of new interactive visualization capabilities.

SVG remains a valuable secondary companion renderer for reproducible static snapshots, inspectable output, debugging captures, exports, and documentation images. Maintain SVG support when the adaptation is natural and reasonably inexpensive.

Visualization design must not be reduced to the lowest common denominator merely to preserve SVG parity. If a useful Canvas capability does not map naturally to SVG, prefer the Canvas design. SVG may adapt, expose a reduced or static equivalent, or omit that capability rather than forcing compromise into the primary interactive path.

Shared visualization abstractions should represent concepts that are genuinely common to their consumers. They should not be introduced solely to force Canvas and SVG into identical semantics.

## D-051 — Continuous visible world bounds belong to the viewport transform

**Status:** Accepted

`ViewportTransform` owns the continuous world-space extent visible through its viewport in addition to world-to-display coordinate conversion.

The current no-allocation API exposes four derived scalar bounds:

- `minWorldX`;
- `maxWorldX`;
- `minWorldY`;
- `maxWorldY`.

These values describe viewport geometry independently from any particular renderer or grid implementation.

Integer-grid selection remains renderer behavior. SVG and Canvas independently apply `ceil` and `floor` to the continuous bounds, skip zero where the world axes own that coordinate, and render the resulting grid using technology-specific drawing operations and presentation styles.

No separate `WorldBounds` value object is introduced yet because the current immutable scalar getters express the demonstrated requirement without per-frame allocation or additional structure.

This extraction is Canvas-led viewport evolution that also remains naturally useful to SVG. The D-051 extraction itself did not introduce inverse display-to-world mapping, panning, zoom, a camera abstraction, or a transformation-matrix framework. D-052 later introduces viewport panning by generalizing the fixed origin-centered view into a mutable world-space center.

## D-052 — Viewport position is represented by a mutable world-space center

**Status:** Accepted

`ViewportTransform` represents which part of the world is being viewed through a mutable world-space center while retaining immutable viewport dimensions and display scale.

The configured `(centerWorldX, centerWorldY)` position maps to the center of the display. World-to-display conversion and continuous visible-world bounds are derived from that center, so bodies, grids, axes, and origin markers remain spatially coherent as the view moves.

Center changes occur through `setCenter(...)`. Both coordinates are validated before either stored value changes, preserving the center as one logical pair when an update is rejected.

Renderers continue to own their `ViewportTransform` internally rather than exposing or injecting it. `CanvasKinematicRenderer` and `SvgKinematicRenderer` expose semantic `setViewportCenter(...)` operations where programmatic centering is useful. Canvas additionally exposes `panViewportBy(...)`, which accepts finite display-space deltas and translates them into a world-center change.

Interactive pointer mechanics remain browser-host responsibility. The Canvas example owns pointer events, pointer capture, and CSS-pixel-to-Canvas-unit conversion; the renderer receives only display-space pan deltas and remains independent from DOM input APIs.

This establishes panning without introducing a camera abstraction, transformation matrices, zoom, or inverse display-to-world mapping. D-054 later introduces inverse mapping after pointer-coordinate inspection provides a concrete use case; the remaining capabilities stay deferred until similarly justified.

## D-053 — Milestone tags use semantic versions

**Status:** Accepted

Git commits remain the detailed implementation-history record. Version tags are reserved for selective, complete, coherent, demonstrable project milestones that are useful to name, revisit, compare, or show independently.

Use annotated Git tags whose names follow `vMAJOR.MINOR.PATCH`. The annotation should combine the version with a short milestone label, for example `v0.2.0 - Interactive Canvas`.

While vLab2D remains in initial development:

- `v0.X.0` marks a new meaningful milestone, such as a coherent demonstrable capability or substantial intentional evolution of the still-unstable public design;
- `v0.x.Y` marks a corrective or refining checkpoint for an existing milestone without establishing a new project capability;
- an intentional breaking contract change must not be represented only by a patch increment;
- not every feature, fix, refactor, or commit receives a version tag.

`v1.0.0` is reserved for a deliberate future point where the project has a coherent first mature laboratory shape and its public contracts are stable enough for compatibility to become an explicit promise. It is not tied to a milestone count or schedule.

Published version tags are immutable historical markers: do not move or reuse an existing version tag for different code. The detailed tagging criteria and process live in `workflow.md`.

## D-054 — Inverse display-to-world mapping belongs to the viewport transform

**Status:** Accepted

`ViewportTransform` owns inverse display-to-world coordinate mapping in addition to forward world-to-display conversion.

The inverse API remains scalar and allocation-free through `displayToWorldX(...)` and `displayToWorldY(...)`. The calculations account for the current world-space viewport center, display scale, and the opposite Y-axis orientation between mathematical world space and display space.

The capability was introduced only after pointer-coordinate inspection created a concrete need to translate display input back into world coordinates.

`CanvasKinematicRenderer` exposes thin scalar delegation methods because the live Canvas host needs the mapping for interaction and inspection. The renderer continues to own its `ViewportTransform` internally rather than exposing the transform object. `SvgKinematicRenderer` does not currently expose equivalent inverse methods because no concrete SVG consumer requires them.

Browser-specific conversion from Pointer Event client coordinates into Canvas drawing-buffer coordinates remains host responsibility. UI formatting and presentation of the resulting world coordinate also remain host concerns. `ViewportTransform` therefore stays independent from DOM APIs, CSS layout, renderer output, and engine-domain types such as `Vector2`.

This adds bidirectional coordinate conversion without introducing a point value type, camera abstraction, transformation matrices, body picking, selection, or zoom.

## D-055 — Viewport scale is mutable geometry while zoom interaction policy belongs to the host

**Status:** Accepted

`ViewportTransform` treats display scale (`pixelsPerUnit`) as mutable viewport state alongside the mutable world-space center, while viewport width and height remain immutable.

A validated `setPixelsPerUnit(...)` operation changes magnification while preserving the current world-space viewport center. Forward world-to-display mapping, inverse display-to-world mapping, and continuous visible-world bounds all derive from the current scale.

For interactive zoom, `setPixelsPerUnitAroundDisplayPoint(...)` changes scale and center together so the world coordinate underneath a supplied display-space anchor remains fixed. The requested scale, anchor coordinates, and candidate center are validated before the new scale and center are committed, preserving the viewport update atomically.

`CanvasKinematicRenderer` exposes semantic viewport operations rather than exposing its transform object. It supports programmatic scale changes, read-only observation of the current scale, and scale changes around a Canvas display-space anchor. `SvgKinematicRenderer` exposes the naturally shared programmatic scale operation but does not mirror Canvas-specific interaction APIs without a concrete SVG consumer.

Browser wheel and trackpad semantics remain host/application responsibility. The Canvas example owns browser client-to-Canvas coordinate conversion, wheel-delta normalization, zoom sensitivity, minimum and maximum scale policy, suppression of page scrolling during Canvas zoom, and conversion from wheel input into an absolute requested viewport scale.

The transform therefore owns zoom geometry and viewport invariants, while the host owns interaction policy. This adds pointer-anchored zoom without introducing wheel-event knowledge into the renderer or transform, and without introducing a camera abstraction, transformation matrices, or gesture framework.

## D-056 — Body picking uses Canvas presentation geometry and rendered snapshots

**Status:** Accepted

The first body-picking capability is a Canvas visualization query rather than an engine/world spatial query.

`KinematicWorld` currently owns only kinematic body state: identity, position, and velocity. It has no physical body shape or radius. The visible body radius is owned by `CanvasKinematicRenderer` and is expressed in Canvas display units. Moving hit testing into `KinematicWorld` would therefore make presentation geometry masquerade as simulation geometry.

`CanvasKinematicRenderer.findBodyAtDisplayPoint(...)` receives detached `BodySnapshot` observations plus a Canvas drawing-buffer coordinate. It maps each observed body position through the renderer's current `ViewportTransform` and tests the point against the same circular marker radius used for rendering.

If more than one marker contains the point, the nearest rendered center is chosen. Picking therefore does not depend on snapshot array order, which is intentionally not part of `KinematicWorld`'s public observation contract.

The browser host retains the latest detached snapshots used to render the visible frame and reuses those snapshots for pointer hit testing. This keeps visual inspection aligned with what the user can actually see while leaving authoritative simulation state inside `KinematicWorld`.

The host owns presentation of the picked result, such as the current `BodyId` readout. No persistent selection state, body highlighting, drag manipulation, physical engine shape, or generic picking framework is introduced by this decision.

## D-057 — Hover identity is transient host state and rendering input

**Status:** Accepted

Hovering is presentation state owned by the browser host, not authoritative simulation state and not persistent renderer state.

The host retains the current pointer client position and recomputes the hovered body from the latest detached snapshots used for the current frame. This evaluation occurs during the animation loop as well as in response to pointer-driven viewport changes because bodies can move underneath a stationary pointer.

`CanvasKinematicRenderer` remains stateless about hover identity. Its `render(...)` operation receives an optional `BodyId` describing which body, if any, should receive the frame's hover treatment. The renderer owns only how that highlighted body is drawn: currently a simple display-space halo around the existing body marker.

The same `renderedSnapshots` observation set is therefore used to determine hover identity and to render both the bodies and the corresponding hover feedback. This keeps inspection synchronized with the visible frame without reading newer authoritative world state during input handling.

Transient hover is distinct from persistent selection. This decision does not establish click semantics, selected-body ownership, selection persistence, drag manipulation, a style/theme system, or engine-owned interaction state.

## D-058 — Selection is persistent host state changed by click, not drag

**Status:** Accepted

Persistent body selection is interaction/application state owned by the browser host. It is not authoritative simulation state and is not retained internally by `CanvasKinematicRenderer`.

The host stores an optional selected `BodyId`. Selection changes only when a primary-pointer interaction completes as a click. Pointer movement is measured from the pointer-down position in browser client coordinates; once movement exceeds a small host-defined tolerance, the interaction is treated as viewport dragging and must not change selection.

On a valid click, the host converts the release position into Canvas drawing-buffer coordinates and reuses `CanvasKinematicRenderer.findBodyAtDisplayPoint(...)` with the current detached observations. Clicking a rendered body selects its `BodyId`; clicking empty Canvas clears selection. Pointer cancellation, lost capture, pointer leave, body motion, panning, and zoom do not by themselves clear or replace the selected identity.

Selection stores identity rather than a `BodySnapshot`. The selected body can therefore continue moving while new detached observations are produced each frame without making an old snapshot authoritative or persistent.

`CanvasKinematicRenderer` remains stateless about interaction identity. Its `render(...)` operation receives the current hovered and selected body identifiers as per-frame presentation input and draws distinct display-space markers for those states. A body may be both hovered and selected at the same time.

Click-versus-drag tolerance and gesture interpretation are browser-host policy. This decision does not establish editable body properties, selected-body inspector structure, drag-to-move behavior, engine-owned selection state, a generic interaction framework, or a general styling system.

## D-059 — Selected-body inspection resolves fresh detached observations by identity

**Status:** Accepted

The first selected-body inspector is read-only browser-host presentation. It does not add an engine query, renderer-owned inspector state, or a persistent selected snapshot.

Persistent selection continues to store only an optional `BodyId`. Whenever current inspection values are needed, the host resolves that identity against the latest detached `BodySnapshot` observations already obtained for the current rendered frame.

The inspector currently presents the selected body's position and velocity. Because the matching snapshot is resolved again after each new world observation, those values follow the selected body's changing state over time while `KinematicWorld` remains the sole owner of authoritative mutable body state.

A detached snapshot is an observation, not persistent selection state. The host therefore must not retain a selected snapshot as the source of truth across frames.

If a selected identity cannot be found in the current observation set, the inspector presents unavailable values without implicitly clearing or replacing selection. Future body-removal semantics should be decided explicitly if body removal is introduced.

Formatting and DOM presentation remain host concerns. This decision does not introduce editable body controls, a general inspector framework, body mutation through the UI, or drag-to-move behavior.

## D-060 — vLab2D evolves around four conceptual layers

**Status:** Accepted architectural direction

The project now uses four conceptual layers to guide refactoring and future growth:

1. **Engine / Domain** — reusable physical definitions, world-owned authoritative state, mathematical values, and concrete simulation policies such as numerical integration.
2. **Simulation / Orchestration** — coordinates one or more worlds and exposes deterministic simulation stepping.
3. **Visualization** — observes detached simulation information and presents it without owning or mutating authoritative simulation state.
4. **Runtime** — drives simulation execution in a host environment, including wall-clock scheduling and host-specific interaction/event mechanics.

These are responsibility boundaries, not a requirement to create a framework, dependency-injection container, or interface for every concept.

The dependency direction should remain inward: runtime may drive simulation, simulation may coordinate worlds, and visualization may observe simulation/world output. Engine/domain code must not depend on browser runtime or visualization concerns.

The current source tree does not yet fully implement all four layers. Phase 1 of the roadmap incrementally migrates the existing implementation toward this structure while preserving current behavior.

## D-061 — Intrinsic properties, initial conditions, and runtime state are distinct lifecycle categories

**Status:** Accepted

vLab2D treats **intrinsic properties**, **initial conditions**, and **runtime state** as distinct concepts.

**Intrinsic properties** describe what a reusable definition is in its own domain context. They belong to that definition and should be immutable so the same definition can be reused safely.

**Initial conditions** describe how a reusable definition enters a state-owning context. They are supplied at the insertion/instantiation boundary and are not themselves intrinsic properties of the reusable definition.

**Runtime state** describes the current evolving state of one instantiated object. It is owned exclusively by the state-owning context responsible for advancing and validating that state.

The lifecycle is therefore:

```text
immutable reusable definition
        +
initial conditions
        ↓
state-owning context
        ↓
independent runtime instance
```

Reusing the same definition with the same or different initial conditions creates independent runtime instances. A detached observation of runtime state is not itself authoritative runtime state.

This principle should guide future concepts such as shapes, body geometry attachments, worlds, and simulation/runtime composition.

## D-062 — Reusable definitions should own only intrinsic properties

**Status:** Accepted

A reusable domain object should contain only properties that describe that object in its own context.

Properties that describe environment, host presentation, or one particular runtime instance must not be added merely because they are convenient to reach from the object.

Examples:

- body geometry or future mass may be intrinsic body properties when concrete physics requires them;
- a body's world position and velocity are not intrinsic properties and belong to world-specific initial/runtime state;
- gravity describes a world/environment, not a body;
- Canvas marker size, selection state, colors used only for debugging, and viewport scale are presentation/runtime concerns rather than physical body properties.

This rule does not imply that every real-world characteristic belongs in the engine model. An engine abstraction intentionally models only the concepts relevant to its domain responsibility.

## D-063 — `Body` is a reusable definition; `KinematicWorld.addBody(...)` establishes independent runtime state

**Status:** Accepted and implemented

`Body` is the first explicit reusable physical definition in the engine. It currently has no intrinsic properties, which is intentional: Phase 1 does not introduce mass, shape, material, or other unproven concepts.

A body definition enters a world through `KinematicWorld.addBody(body, initialConditions)`.

The current initial conditions are:

- world-space position, defaulting to `(0, 0)`;
- velocity, defaulting to `(0, 0)` world units per second.

The world copies supplied initial-condition values before accepting them as authoritative runtime state.

Each call to `addBody(...)` creates an independent world-local runtime instance with its own `BodyId` and state. The same `Body` definition may therefore be added multiple times to one world or reused across different worlds.

`BodyId` remains world-local and belongs to the runtime instance rather than to the reusable `Body` definition.

The World remains the exclusive authority over mutable runtime state. External consumers observe detached state rather than mutating the `Body` definition or world storage directly.

## D-064 — Relationship cardinality is a domain decision, not a convenience default

**Status:** Accepted architectural direction

Do not assume one-to-one relationships merely because a singular property is convenient to implement.

For each relationship, decide independently:

- how many related objects are meaningful;
- who owns or composes them;
- whether the relationship is mutable after construction;
- whether reuse/sharing is safe.

Current and intended examples include:

- `Simulation` may coordinate one or more `World` instances;
- `World` owns zero or more body runtime instances;
- a future `Body` may have zero or more geometry attachments, allowing particle-like bodies and later compound bodies;
- a geometry attachment refers to one shape definition;
- a `World` has one active strategy per world-level responsibility, such as one current integrator and, if later justified, one collision pipeline;
- visualization/observation may have zero or more views of the same simulation state.

Phase 2 may deliberately exercise only zero-or-one shape per body while learning the geometry model, but the architecture must not encode a permanently singular body-shape relationship that is already known to be too restrictive.

## D-065 — Future `World` default gravity is Earth-like `(0, -9.81)`

**Status:** Accepted architectural direction

The engine coordinate convention uses positive Y upward. Therefore a natural Earth-like default gravity vector points downward and is represented as:

```text
(0, -9.81)
```

world units per second squared.

The future general `World` API should use this as its default gravity unless later evidence establishes a better default for the laboratory.

This decision does not retroactively change every existing example. During Phase 1 refactoring, examples may continue to pass explicit acceleration/gravity values where doing so preserves their existing demonstrated behavior.

## D-066 — Body runtime state is structural data and the obsolete single-state simulation is retired

**Status:** Accepted and implemented

Phase 1B.1 clarifies the engine vocabulary around runtime state.

`BodyState` is a readonly structural TypeScript interface containing the runtime motion data currently required for a world-owned body instance:

```text
position
velocity
```

It is not a constructible domain object, does not own behavior, and does not represent intrinsic properties of the reusable `Body` definition.

The World creates authoritative `BodyState` values from `BodyInitialConditions`, owns their evolution, validates candidate replacements, and returns detached state observations.

`BodySnapshot` replaces `KinematicBodySnapshot` as the public detached observation of world-local body identity plus `BodyState`.

`KinematicIntegrator` remains deliberately narrow. Its `integrate(...)` operation consumes a `BodyState`, acceleration, and timestep and returns a candidate `BodyState`. The kinematic qualifier therefore still communicates a real contract rather than historical naming.

The earlier `KinematicSimulation` is removed. Its useful lessons—authoritative state ownership, validated candidate-before-commit updates, and injected integration behavior—are already represented by `KinematicWorld`. Keeping the old class would create a competing meaning for the future `Simulation` layer, which is reserved for orchestration of one or more Worlds.

No new physics or simulation behavior is introduced by this decision.
