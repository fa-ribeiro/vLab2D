# Architecture

This section explains how vLab2D is structured, how its current components collaborate, and which boundaries the project deliberately protects.

vLab2D is an exploratory learning project rather than a production physics engine, so its architecture is intentionally allowed to grow with the implementation.

The architecture documentation therefore distinguishes between:

- **implemented architecture** — structures and boundaries visible in the current code;
- **architectural principles** — deliberate rules that guide new work;
- **future directions** — plausible extensions that have not yet earned an implementation.

The goal is not to predict the final system. It is to make the current system understandable.

---

## 1. Architecture at a glance

At the current checkpoint, vLab2D has three important runtime areas:

1. an independent simulation engine;
2. visualization outside that engine;
3. host/example code that composes the two.

```mermaid
flowchart LR
    HOST["Host / Example<br/>examples/"]

    subgraph ENGINE["Simulation Engine — src/engine/"]
        API["Public API<br/>mod.ts"]
        WORLD["KinematicWorld"]
        INTEGRATOR["KinematicIntegrator"]
        STATE["Kinematic state"]
    end

    subgraph VIS["Visualization — src/visualization/"]
        SVG["SvgKinematicRenderer"]
    end

    HOST --> API
    HOST --> SVG

    API --> WORLD
    WORLD --> INTEGRATOR
    WORLD --> STATE

    SVG -->|"public snapshot types"| API
```

The most important dependency rule is:

```text
simulation engine does not depend on visualization
```

Visualization may observe information exposed by the engine, but rendering concerns do not enter the simulation core.

---

## 2. Repository-level boundaries

The current source tree exposes the architecture directly:

```text
src/
├── engine/
│   ├── kinematics/
│   ├── math/
│   ├── simulation/
│   ├── world/
│   └── mod.ts
│
└── visualization/
    └── svg-kinematic-renderer.ts

examples/
└── kinematic-world-svg.ts
```

These areas have different responsibilities.

| Area                     | Responsibility                                                                  |
| ------------------------ | ------------------------------------------------------------------------------- |
| `src/engine/`            | Own and advance simulation state                                                |
| `src/engine/mod.ts`      | Define the public consumer-facing engine boundary                               |
| `src/engine/math/`       | Small mathematical values and operations used by the engine                     |
| `src/engine/kinematics/` | Kinematic state and numerical integration behavior                              |
| `src/engine/world/`      | Own collections of simulated bodies and their authoritative state               |
| `src/engine/simulation/` | Earlier single-state simulation runtime retained while the architecture evolves |
| `src/visualization/`     | Convert observed simulation information into visual representations             |
| `examples/`              | Compose components into runnable scenarios                                      |

The folders are not intended as permanent framework layers. They exist because concrete implementation responsibilities have appeared.

---

## 3. Dependency direction

vLab2D deliberately keeps dependencies pointing toward simulation concepts rather than allowing presentation concerns to leak inward.

```mermaid
flowchart TD
    EXAMPLE["Example / future application"]
    VIS["Visualization"]
    API["Engine public API<br/>mod.ts"]
    WORLD["World"]
    KIN["Kinematics"]
    MATH["Math"]

    EXAMPLE --> VIS
    EXAMPLE --> API

    VIS --> API

    API --> WORLD
    API --> KIN
    API --> MATH

    WORLD --> KIN
    WORLD --> MATH

    KIN --> MATH
```

There is deliberately no dependency in the opposite direction:

```mermaid
flowchart LR
    ENGINE["Engine"] -. "does not know about" .-> RENDERER["Renderer"]
    ENGINE -. "does not know about" .-> UI["UI"]
    ENGINE -. "does not know about" .-> EXAMPLE["Example / host"]
```

This gives the engine a useful property:

> A simulation can run without any renderer at all.

Likewise, a renderer does not advance physics. It consumes observations produced by the engine.

---

## 4. The engine boundary

External consumers are expected to enter the simulation engine through:

```text
src/engine/mod.ts
```

`mod.ts` exports the engine's supported public concepts while internal modules remain implementation details.

```mermaid
flowchart LR
    EXT["External consumer"]

    API["src/engine/mod.ts<br/>public boundary"]

    subgraph INTERNAL["Engine implementation"]
        WORLD["KinematicWorld"]
        SIM["KinematicSimulation"]
        INT["Integrators"]
        STATE["KinematicState"]
        VEC["Vector2"]
    end

    EXT --> API

    API --> WORLD
    API --> SIM
    API --> INT
    API --> STATE
    API --> VEC
```

TypeScript does not physically prevent a consumer from importing an internal file directly.

The boundary is therefore both:

- a source-code convention;
- a documented API contract.

Project code outside the engine should prefer `mod.ts`.

The SVG renderer already follows this rule:

```ts
import type { KinematicBodySnapshot } from "../engine/mod.ts";
```

That is significant because visualization depends on the **engine contract**, not on the engine's storage implementation.

---

## 5. State ownership

One of the strongest current architectural rules is:

> The simulation engine owns authoritative mutable simulation state.

For the multi-body runtime, that authority belongs to `KinematicWorld`.

```mermaid
flowchart TD
    WORLD["KinematicWorld"]

    STORE[("private Map&lt;BodyId, KinematicState&gt;")]

    COMMANDS["Validated commands<br/>createBody<br/>setAcceleration<br/>step"]

    QUERIES["Observation<br/>getBodyState<br/>getBodySnapshots"]

    SNAPSHOTS["Detached state / snapshots"]

    COMMANDS --> WORLD
    WORLD --> STORE

    STORE --> WORLD
    WORLD --> QUERIES
    QUERIES --> SNAPSHOTS
```

Consumers do not receive the world's internal `Map`, and observation APIs do not expose writable references into world storage.

This gives us a clear ownership boundary:

```text
outside world                     inside world

BodyId  ───────────────────────►  authoritative body state
                                  private Map

snapshot ◄──────────────────────  copied observation
```

A renderer can inspect a body snapshot, but changing that snapshot cannot change the world.

---

## 6. Observation and control are separate

The engine API currently contains two conceptually different kinds of interaction.

### Observation

Observation asks:

> What is the simulation state?

Examples:

```text
world.acceleration
world.getBodyState(...)
world.getBodySnapshots()
```

### Control

Control asks:

> Please change or advance the simulation.

Examples:

```text
world.createBody(...)
world.setAcceleration(...)
world.step(...)
```

The distinction can be visualized as:

```mermaid
flowchart LR
    CONSUMER["External consumer"]

    OBS["Observation API"]
    CTRL["Control API"]

    WORLD["KinematicWorld"]
    STATE[("Authoritative state")]

    CONSUMER -->|"query"| OBS
    OBS --> WORLD
    WORLD --> STATE

    STATE --> WORLD
    WORLD -->|"detached observations"| OBS
    OBS --> CONSUMER

    CONSUMER -->|"command"| CTRL
    CTRL --> WORLD
    WORLD -->|"validated mutation"| STATE
```

This separation is currently expressed through ordinary methods rather than through separate framework objects or interfaces.

That is intentional.

The project has not demonstrated a need for a command bus, repository abstraction, event system, or similar infrastructure.

---

## 7. World-owned bodies

Bodies currently do not exist as independently mutable runtime objects.

Instead:

```text
KinematicWorld
    owns
      ↓
BodyId → KinematicState
```

`BodyId` is an opaque, world-local identifier used by consumers to refer to body state owned by a world.

```mermaid
flowchart LR
    ID["BodyId"]

    WORLD["KinematicWorld"]

    STATE["KinematicState<br/>position + velocity"]

    ID -->|"identify"| WORLD
    WORLD -->|"owns"| STATE
```

This avoids handing consumers a mutable `Body` object whose state could bypass world invariants.

It also gives the world one clear place to coordinate future operations that affect multiple bodies.

---

## 8. State and behavior are separate

`KinematicWorld` owns state, but it does not contain a hard-coded numerical integration algorithm.

Instead it receives a `KinematicIntegrator`.

```mermaid
classDiagram
    class KinematicWorld {
        -Map bodies
        -Vector2 acceleration
        -KinematicIntegrator integrator
        +createBody()
        +getBodySnapshots()
        +setAcceleration()
        +step(dt)
    }

    class KinematicIntegrator {
        <<interface>>
        +integrate(state, acceleration, dt)
    }

    class ExplicitEulerIntegrator {
        +integrate(state, acceleration, dt)
    }

    class SemiImplicitEulerIntegrator {
        +integrate(state, acceleration, dt)
    }

    KinematicWorld --> KinematicIntegrator : delegates stepping
    ExplicitEulerIntegrator ..|> KinematicIntegrator
    SemiImplicitEulerIntegrator ..|> KinematicIntegrator
```

This is a small application of the **Strategy pattern**:

- `KinematicWorld` decides **when** bodies are advanced;
- an integrator decides **how** one kinematic state is numerically advanced.

The world depends on the narrow abstraction:

```ts
interface KinematicIntegrator {
  integrate(state: KinematicState, acceleration: Vector2, dt: number): KinematicState;
}
```

rather than constructing a particular algorithm internally.

This allows the same world model to use:

```text
Explicit Euler
       or
Semi-Implicit Euler
```

without changing world ownership semantics.

The interface is deliberately specific to kinematics rather than being a generalized numerical-integration framework.

---

## 9. Stepping a world

A world step is deliberately transactional.

The world does not update each body immediately after integrating it.

Instead it first calculates every candidate state.

```mermaid
sequenceDiagram
    participant Host
    participant World as KinematicWorld
    participant Integrator as KinematicIntegrator
    participant Candidates as Candidate states
    participant State as Authoritative state

    Host->>World: step(dt)

    World->>World: validate dt

    loop every body
        World->>Integrator: integrate(state, acceleration, dt)
        Integrator-->>World: candidate state
        World->>World: validate candidate
        World->>Candidates: store candidate
    end

    World->>State: commit all candidates
    World-->>Host: step complete
```

The important invariant is:

> Either every body advances successfully, or no authoritative body state is replaced.

Conceptually:

```text
calculate
    ↓
validate all
    ↓
commit all
```

rather than:

```text
calculate body A
    ↓
commit A
    ↓
calculate body B
    ↓
failure
    ↓
partially updated world
```

This becomes increasingly valuable as world behavior grows more complex.

---

## 10. Kinematic state model

The current physics state is intentionally small.

```mermaid
classDiagram
    class Vector2 {
        +number x
        +number y
        +add()
        +subtract()
        +scale()
    }

    class KinematicState {
        +Vector2 position
        +Vector2 velocity
    }

    KinematicState *-- Vector2 : position
    KinematicState *-- Vector2 : velocity
```

A `KinematicState` contains:

```text
position
velocity
```

It deliberately does not yet contain concepts such as:

```text
mass
force
shape
orientation
angular velocity
collision state
```

Those should appear only when simulation features create a real requirement for them.

---

## 11. The role of `KinematicSimulation`

The project currently contains two state-owning runtime concepts:

```mermaid
flowchart TD
    KS["KinematicSimulation"]
    KW["KinematicWorld"]

    KS --> ONE["one kinematic state"]
    KW --> MANY["many identified body states"]

    INT["KinematicIntegrator"]

    KS --> INT
    KW --> INT
```

`KinematicSimulation` came first and established several architectural ideas:

- authoritative state ownership;
- validated state changes;
- injected integration behavior;
- candidate-before-commit stepping.

`KinematicWorld` later applies those ideas to multiple identified bodies.

`KinematicSimulation` is currently still part of the public engine API, but it should not be interpreted as evidence that the final architecture requires both concepts permanently.

It is part of the project's evolutionary design history.

A future review may find that:

- both concepts remain useful;
- `KinematicWorld` subsumes the single-state runtime;
- or a different runtime boundary emerges from later requirements.

No change is necessary until the implementation provides evidence.

---

## 12. Visualization boundary

Visualization lives outside the engine:

```text
src/visualization/
```

The current renderer is:

```text
SvgKinematicRenderer
```

Its input is detached engine observation data.

Its output is SVG text.

```mermaid
flowchart LR
    WORLD["KinematicWorld"]

    SNAP["readonly KinematicBodySnapshot[]"]

    SVG["SvgKinematicRenderer"]

    DOC["SVG document"]

    WORLD -->|"getBodySnapshots()"| SNAP
    SNAP --> SVG
    SVG --> DOC
```

The renderer does not:

- advance simulation time;
- calculate acceleration;
- integrate velocity or position;
- modify world state;
- inspect the world's private storage.

Its responsibility starts after the simulation state has already been produced.

---

## 13. World coordinates versus display coordinates

The engine uses mathematical world coordinates:

```text
+x → right
+y → up
```

SVG uses display coordinates where positive Y points downward.

The renderer therefore performs a display transformation:

```mermaid
flowchart LR
    WORLD["World coordinates<br/>+X right<br/>+Y up"]

    MAP["World-to-display mapping"]

    DISPLAY["SVG coordinates<br/>+X right<br/>+Y down"]

    WORLD --> MAP --> DISPLAY
```

Currently:

```text
displayX = width / 2 + worldX × pixelsPerUnit

displayY = height / 2 - worldY × pixelsPerUnit
```

The minus sign in the Y mapping performs the coordinate-system inversion.

At present this transformation is private to `SvgKinematicRenderer`.

That duplication has **not yet appeared elsewhere**, so a shared viewport abstraction has intentionally not been extracted.

A future Canvas renderer is expected to provide the second concrete use case.

At that point a reusable transformation component may become justified.

---

## 14. Host/application responsibility

The example program currently acts as the composition root.

`examples/kinematic-world-svg.ts` decides:

- which integrator to use;
- which acceleration the world has;
- which bodies to create;
- how many simulation steps to perform;
- which renderer to create;
- where generated output is written.

```mermaid
flowchart TD
    HOST["kinematic-world-svg.ts"]

    INT["SemiImplicitEulerIntegrator"]
    WORLD["KinematicWorld"]
    BODIES["Initial body states"]

    SNAP["Body snapshots"]

    RENDER["SvgKinematicRenderer"]
    FILE["generated/kinematic-world.svg"]

    HOST --> INT
    HOST --> WORLD
    HOST --> BODIES

    INT --> WORLD
    BODIES --> WORLD

    WORLD --> SNAP
    HOST --> RENDER
    SNAP --> RENDER

    RENDER --> FILE
```

This is a useful architectural role even though there is not yet an `application/` subsystem.

The host composes otherwise independent pieces.

The engine does not decide which renderer exists, and the renderer does not decide which world or integrator exists.

---

## 15. Current runtime flow

Putting the pieces together:

```mermaid
sequenceDiagram
    participant Host as Example / Host
    participant World as KinematicWorld
    participant Integrator as KinematicIntegrator
    participant Renderer as SvgKinematicRenderer
    participant Output as SVG file

    Host->>World: createBody(initialState)
    Host->>World: createBody(initialState)
    Host->>World: createBody(initialState)

    loop simulation steps
        Host->>World: step(dt)
        World->>Integrator: integrate each body
        Integrator-->>World: candidate states
        World->>World: validate and commit
    end

    Host->>World: getBodySnapshots()
    World-->>Host: detached snapshots

    Host->>Renderer: render(snapshots)
    Renderer-->>Host: SVG text

    Host->>Output: write SVG
```

This represents the first complete vertical slice through vLab2D:

```text
configuration
     ↓
simulation
     ↓
observation
     ↓
visualization
     ↓
visible output
```

---

## 16. Architectural principles demonstrated today

Several project principles are no longer merely intentions; the current implementation demonstrates them.

### Simulation and visualization are independent

The engine contains no rendering dependency.

### State ownership is explicit

`KinematicWorld` owns authoritative body state.

### Observation does not expose world storage

Consumers receive detached observations.

### Behavior can be injected

The numerical integration algorithm is supplied to the world through `KinematicIntegrator`.

### Composition is preferred over inheritance

Integrators implement a small behavior contract rather than participating in a deep class hierarchy.

### Public boundaries are deliberate

External engine consumers are expected to import from `src/engine/mod.ts`.

### Abstractions are introduced from concrete needs

There is no generalized renderer hierarchy, viewport framework, event bus, entity-component system, or dependency-injection container.

None has yet been justified by the implementation.

---

## 17. What architecture this is — and is not

Some current ideas resemble well-known architectural patterns, but vLab2D is not attempting to implement a formal architecture methodology.

For example:

- injected integrators resemble the **Strategy pattern**;
- `mod.ts` acts as a **module facade/public boundary**;
- world-owned state and detached observations reinforce **encapsulation**;
- external composition follows **dependency inversion** where replaceable behavior is involved.

However, vLab2D is not currently claiming to be:

- Clean Architecture;
- Hexagonal Architecture;
- an Entity Component System;
- Domain-Driven Design;
- an event-driven architecture;
- a plugin framework.

Those labels would imply structures and constraints the project has not needed.

The project uses architectural ideas selectively when they solve real problems.

---

## 18. Implemented, intended, and future architecture

It is useful to keep these categories separate.

### Implemented

```text
✓ public engine boundary through mod.ts
✓ mathematical Vector2 values
✓ kinematic state
✓ replaceable kinematic integrators
✓ single-state KinematicSimulation
✓ multi-body KinematicWorld
✓ world-local BodyId
✓ world-owned authoritative body state
✓ detached body observations
✓ atomic world stepping
✓ independent SVG visualization
✓ world-to-SVG coordinate mapping
✓ external host/example composition
```

### Established architectural principles

```text
→ simulation remains independent from presentation
→ authoritative state remains engine-owned
→ external mutation uses validated APIs
→ observation should not leak writable engine state
→ genuinely variable behavior may use injected strategies
→ composition is preferred over unnecessary inheritance
→ abstractions should be earned by concrete use cases
```

### Future directions, not current architecture

Possible future capabilities include:

```text
? Canvas renderer
? reusable viewport/world-to-display transform
? pan and zoom
? experiment orchestration
? synchronized multiple worlds
? UI controls
? collision detection and response
? forces
? richer body models
? logging / inspection
? diagnostic overlays
```

These are directions, not promises about concrete class or folder structure.

---

## 19. Near-term architectural pressure: a second renderer

The next visualization milestone is expected to introduce a minimal Canvas renderer.

That will create an interesting architectural moment:

```mermaid
flowchart TD
    WORLD["World snapshots"]

    SVG["SVG renderer"]
    CANVAS["Canvas renderer"]

    SVGTRANS["SVG world/display mapping"]
    CANVASTRANS["Canvas world/display mapping"]

    WORLD --> SVG
    WORLD --> CANVAS

    SVG --> SVGTRANS
    CANVAS --> CANVASTRANS
```

If both renderers independently need the same concepts:

- viewport dimensions;
- world origin placement;
- pixels per world unit;
- Y-axis inversion;

then duplication will provide evidence for extracting a shared transform.

The architecture may then evolve toward:

```mermaid
flowchart TD
    SNAP["World snapshots"]

    TRANSFORM["World-to-display transform"]

    SVG["SVG renderer"]
    CANVAS["Canvas renderer"]

    SNAP --> SVG
    SNAP --> CANVAS

    TRANSFORM --> SVG
    TRANSFORM --> CANVAS
```

That transform may later become the natural home for:

```text
pan
zoom
world ↔ display conversion
visible world bounds
```

Importantly, that abstraction is not being created yet.

The second consumer should demonstrate its shape first.

---

## 20. Architecture evolution rule

vLab2D follows a simple architectural rule:

> Concrete requirements create pressure; repeated pressure earns abstractions.

```mermaid
flowchart LR
    NEED["Concrete need"]
    FIRST["First implementation"]
    SECOND["Second real use case"]
    DUP["Meaningful duplication / friction"]
    ABS["Extract abstraction"]

    NEED --> FIRST
    FIRST --> SECOND
    SECOND --> DUP
    DUP --> ABS
```

This keeps the code understandable while still allowing the architecture to mature.

The architecture documentation should evolve in the same way.

When this overview becomes too large, focused documents can be extracted from it, for example:

```text
docs/architecture/
├── README.md
├── engine.md
├── visualization.md
├── runtime.md
└── coordinate-systems.md
```

Those files should be created only when the amount of real architecture makes the split useful.

For now, this README is the architecture entry point and overview.
