# Interactive Visual 2D Lab — Project Context

> Canonical handoff document. A new chat should read this file first. Keep it synchronized with the companion files in this folder whenever important project information changes.

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

## 5a. Initial repository boundary (v0.0.0 draft)

The first bootstrap intentionally creates only a few structural boundaries:

- `src/engine/` — self-contained simulation engine; `mod.ts` is its public consumer entry point
- `src/visualization/` — rendering/diagnostic presentation concerns, outside the engine
- `docs/project/` — continuity, decisions, status, workflow, environment, and project map
- `tests/` — reserved for project-level/bootstrap tests; feature tests should normally be colocated

Do not infer future folders from this bootstrap. Add deeper module structure only when real features require it.

## 6. Early project shape

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

## 7. Working arrangement with ChatGPT

ChatGPT should act as a collaborator/tutor, not as an autopilot that removes the learning challenge.

Default working style:

- use Deno 2.9.7, TypeScript 6.0.3, and Visual Studio Code as the recorded working environment
- use vanilla TypeScript with minimal external dependencies
- for each meaningful feature: explain concepts/options and rationale, implement incrementally, add relevant tests/docs, then pause for user approval before the feature is considered settled/committed
- explain credible alternatives and why they are not preferred for the current step
- favor modular/interchangeable implementations for genuinely variable simulation behaviors such as integrators and collision subsystems
- let source-folder structure communicate these module boundaries without premature framework design
- prefer trustworthy tests over superficial coverage-chasing
- complement non-trivial structural/algorithmic explanations with Mermaid diagrams when useful
- treat meaningful documentation and comments as part of implementation quality
- treat the engine public API as a first-class documented contract: JSDoc should explain semantics, units, mutability/ownership, validation, timing/side effects, invariants, and non-obvious usage
- prefer Deno's native `deno doc` for API-documentation linting and searchable generated HTML before considering third-party documentation generators
- prefer comments that preserve reasoning, assumptions, units, algorithms, limitations, and tradeoffs
- avoid obvious comments that merely restate identifiers or syntax
- explain concepts and tradeoffs before introducing sophisticated solutions
- prefer small next steps
- avoid dumping a production architecture onto the project
- help identify standard algorithms when a problem appears
- distinguish learning-friendly implementations from production-grade ones
- challenge unnecessary complexity
- preserve separation of concerns; avoid letting physics, rendering, UI, logging, and orchestration leak into each other
- preserve state ownership: external observers read through safe views/snapshots; state changes go through validated engine APIs rather than direct object mutation
- prefer composition and explicit injected collaborators when behavior genuinely needs to vary
- use OOP as a modeling tool, not as a requirement to turn every concept into a class or inheritance hierarchy
- help with debugging while preserving understanding
- support project management and decision recording

When a meaningful decision, milestone, environment change, workflow change, architectural change, or newly discovered goal occurs, update the continuity pack.

## 8. Continuity protocol

At the beginning of a new chat:

1. Provide this continuity pack (or make it available as Project files).
2. Ask ChatGPT to read `PROJECT_CONTEXT.md` first, followed by `STATUS.md`, `DECISIONS.md`, `ENVIRONMENT.md`, and `WORKFLOW.md`.
3. Continue from the recorded current state rather than reconstructing the project from memory.
4. Treat `STATUS.md` as the current operational state and `DECISIONS.md` as the source of settled choices.
5. If code/files are part of the project, provide or connect the repository as well; these notes do not replace source code.

### Important limitation

This pack can preserve project context, decisions, workflow, and recorded environment details, but it cannot literally reproduce hidden chat state, model internals, or guarantee that ChatGPT product/tool capabilities remain unchanged between chats. The goal is a reproducible _project handoff_, not a snapshot of the underlying AI runtime.

## 9. Current state

The project is still in the brainstorming / definition phase.

The recorded development environment is Deno 2.9.7, TypeScript 6.0.3, and Visual Studio Code. The project uses vanilla TypeScript and intentionally minimizes external dependencies. Deno native tooling and appropriate Deno standard-library utilities are acceptable, particularly for testing.

No renderer technology, exact build/run workflow, repository structure, or physics representation has yet been selected. A UI framework is not planned under the vanilla/minimal-dependency policy. The exact source structure and documentation-generation workflow will be chosen when implementation begins.

Remaining unknowns should remain unknown until deliberately decided.

## 10. New-chat bootstrap text

Use the following short instruction when starting a fresh chat:

> We are continuing the Interactive Visual 2D Lab project. Read the attached continuity pack, starting with `PROJECT_CONTEXT.md`, then `STATUS.md`, `DECISIONS.md`, `ENVIRONMENT.md`, and `WORKFLOW.md`. Treat those files as the source of truth for project goals, current status, settled decisions, environment, and our working arrangement. Do not redesign the project from scratch. Continue from the recorded state and update the continuity pack whenever materially relevant information changes.
