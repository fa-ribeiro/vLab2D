# vLab2D — Project Context

> Canonical stable project-context document. A new chat should read this file first; `handoff.md` defines the resume procedure and `workflow.md` defines the working agreement.

## 1. Project identity

Working description:

**A modular interactive visual 2D physics laboratory for learning, experimentation, and enjoyment.**

This is a hobby/learning project, not an attempt to build a production-grade or full-featured 2D physics engine.

The project should remain exploratory: we use known algorithms and established techniques, understand them by implementing them, and choose future directions based on curiosity and what becomes interesting while working.

## 2. Primary goals

1. Learn TypeScript through a substantial but enjoyable project.
2. Learn physics-simulation concepts by implementing small, understandable versions of established techniques.
3. Build something relaxing, colorful, informative, and satisfying to watch.
4. Make invisible simulation state visible through optional visual indicators and diagnostics.
5. Support experiments comparing two or more simulated worlds under different conditions.
6. Practice project management: scope control, milestones, decisions, refactoring, prioritization, and maintaining project continuity.
7. Preserve enough project context that a fresh chat can continue with minimal loss of context.

## 3. Guiding philosophy

- Direction, not a fixed destination.
- Small complete steps rather than an ambitious master specification.
- Curiosity drives features.
- Prefer known techniques over inventing algorithms unnecessarily.
- Understand before optimizing.
- Do not implement a feature merely because a professional physics engine would have it.
- Avoid premature abstractions. Let abstractions appear when a second real use case makes them useful.
- Prefer focused responsibilities and clear separation of concerns.
- Prefer explicit dependency injection for replaceable collaborators/policies rather than hidden construction or global reach-through.
- Use OOP pragmatically where it clarifies the domain; prefer composition over deep inheritance.
- Visual clarity and beauty are part of the project, not merely decoration.
- Documentation and code comments are part of the learning experience: explain non-obvious behavior, algorithms, assumptions, tradeoffs, and decisions; do not narrate obvious code.
- Use vanilla TypeScript and keep dependencies minimal; prefer implementing relevant functionality from scratch, with Deno/Deno standard-library tooling as appropriate infrastructure.
- Explain meaningful technical choices with rationale, alternatives, pros/cons, and the important “why not” arguments.
- Prefer industry best practices and established patterns when they fit the learning goal; explain when/why the project deliberately uses a simpler variant.
- Treat tests as part of the feature and optimize for confidence in behavior and edge cases rather than coverage percentages.
- Use Mermaid diagrams and practical analogies when they materially improve understanding of structural or abstract concepts.
- The physics engine is infrastructure; experiments and observation are the content.

## 4. Current conceptual architecture

### Simulation / Physics

The simulation core should be conceptually independent from presentation. It advances worlds and exposes state/events, without knowing how they are displayed.

The engine owns all authoritative mutable simulation state. External systems may observe that state through a read-only/query boundary and request changes through a controlled command/API boundary, but they should not receive writable references to internal objects. Runtime changes such as gravity updates or applied forces should be validated and applied by the engine at a safe/consistent point so simulation invariants remain intact.

An important open design question is how to separate **world state** from the **behavior/policies that advance it**. A likely direction is that a world represents state while a runtime/simulator composes replaceable policies such as an integrator or collision strategy, but this is intentionally not settled yet. The first concrete implementation should provide evidence before we freeze that boundary.

Potential responsibilities:

- bodies and physical state
- forces
- numerical integration
- collision detection / response
- constraints, if explored later
- deterministic stepping where practical

### Experiment orchestration

An experiment may contain one or more worlds.

Potential responsibilities:

- create/clone worlds
- synchronize stepping
- keep initial conditions comparable
- vary one or more parameters between worlds
- reset / pause / resume / single-step
- collect comparison metrics

Examples:

- different gravity strengths
- different integration algorithms
- tiny differences in initial conditions
- chaotic systems such as a future double-pendulum experiment

### Rendering / Visualization

Rendering should remain independent from the physics engine.

The same simulation(s) may eventually be represented in different ways, for example:

- one world normally
- multiple worlds side by side
- multiple worlds overlaid
- presentation-only view
- debugging/diagnostic view

Visual indicators should be optional and independently configurable where sensible.

Possible indicators:

- velocity vector
- acceleration vector
- direction / speed
- bounding boxes
- collision/contact points
- collision normals
- centers / pivots
- trails
- active/inactive/sleeping state
- labels or selected-body information

### UI / Controls

The options/control panel is optional rather than intrinsic to rendering.

Possible controls:

- start
- pause
- resume
- single step
- reset
- experiment/world selection
- visualization toggles
- colors and indicator customization
- physics/world parameters

### Logging / Observation

An optional console/logger should be independent from the renderer and physics algorithms.

Possible event categories:

- simulation lifecycle
- collisions
- body state changes
- warnings/errors
- metrics
- debugging observations

The same information might later feed a console, graph, exporter, or other observer without changing the simulation core.

## 5. Multi-world experiments

Multi-world comparison is an important project capability, not merely a future cosmetic feature.

Desired properties:

- two or more worlds can start from the same base state
- one parameter can be changed while keeping others equal
- worlds can advance synchronously
- worlds may use different numerical integrators
- worlds can be rendered side by side or overlaid
- differences between worlds may be visualized or measured

Important learning themes:

- numerical integration behavior
- determinism
- sensitivity to initial conditions
- chaotic systems / butterfly effect
- energy drift and stability

## 6. Initial repository boundary

The first bootstrap intentionally creates only a few structural boundaries:

- `src/engine/` — self-contained simulation engine; `mod.ts` is its public consumer entry point
- `src/visualization/` — rendering/diagnostic presentation concerns, outside the engine
- `docs/project/` — continuity, decisions, status, workflow, environment, and project map
- `tests/` — reserved for project-level/bootstrap tests; feature tests should normally be colocated

Do not infer future folders from this bootstrap. Add deeper module structure only when real features require it.

## 7. Early project shape

Do not treat this as a binding roadmap. It is only a plausible starting sequence.

- First visible body
- Gravity
- Fixed timestep
- Boundary collision / bouncing
- Play / pause / step / reset
- Optional vectors/overlays
- Multiple bodies
- Body-body collision
- Clone a world
- Two synchronized worlds
- Compare gravity or timestep
- Compare integration algorithms
- Overlay and side-by-side layouts
- Comparison metrics
- Chaotic experiment, potentially a double pendulum

The project may deliberately diverge from this sequence.

## 8. Continuity principle

Project continuity is a first-class requirement. Stable identity, goals, constraints, architecture, decisions, environment, workflow, and current status must remain recoverable from the repository rather than depending on conversation history.

The detailed development/learning agreement lives in `workflow.md`. The procedure for resuming the project in a fresh chat lives in `handoff.md`. The current operational state lives in `status.md`.

The continuity documents do not replace the source repository, tests, configuration, or Git history; a faithful handoff needs the repository as well.

## 9. Repository identity

Repository: <https://github.com/fa-ribeiro/vLab2D>

Current implementation state deliberately does **not** live in this document. Read `status.md` for the current checkpoint and next step. This file should remain focused on stable project identity, goals, constraints, architecture, and continuity principles rather than repeating operational status.
