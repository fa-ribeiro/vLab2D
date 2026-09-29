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

At the current checkpoint, vLab2D has four concrete architectural layers:

1. an independent simulation engine;
2. deterministic Simulation orchestration above one or more Worlds;
3. visualization outside the engine and Simulation layers;
4. browser Runtime scheduling that drives Simulation while remaining independent from rendering.

```mermaid
flowchart LR
    HOST["Host / Example"]
    RUNTIME["BrowserSimulationRuntime"]
    SIM["Simulation"]

    WORLD["World"]
    SNAP["Detached snapshots"]

    TRANSFORM["ViewportTransform"]
    SVG["SvgKinematicRenderer"]
    CANVAS["CanvasKinematicRenderer"]

    HOST --> RUNTIME
    RUNTIME --> SIM
    SIM --> WORLD

    HOST --> WORLD
    WORLD --> SNAP

    TRANSFORM --> SVG
    TRANSFORM --> CANVAS

    SNAP --> SVG
    SNAP --> CANVAS
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
├── mod.ts
├── engine/
│   ├── geometry/
│   ├── kinematics/
│   ├── math/
│   ├── world/
│   └── mod.ts
│
├── simulation/
│   └── simulation.ts
│
├── runtime/
│   └── browser/
│       └── simulation-runtime.ts
│
└── visualization/
    ├── canvas-kinematic-renderer.ts
    ├── svg-kinematic-renderer.ts
    └── viewport-transform.ts

examples/
├── kinematic-world-canvas/
│   ├── canvas-example-host.ts
│   └── main.ts
└── kinematic-world-svg.ts
```

These areas have different responsibilities.

| Area                     | Responsibility                                                                |
| ------------------------ | ----------------------------------------------------------------------------- |
| `src/mod.ts`             | Provide the package-facing composition facade                                 |
| `src/engine/`            | Own and advance simulation state                                              |
| `src/engine/mod.ts`      | Define the public consumer-facing engine boundary                             |
| `src/engine/math/`       | Small mathematical values and operations used by the engine                   |
| `src/engine/kinematics/` | Numerical integration behavior for current kinematic body state               |
| `src/engine/world/`      | Own collections of simulated bodies and their authoritative state             |
| `src/simulation/`        | Coordinate deterministic stepping and per-World execution status              |
| `src/runtime/browser/`   | Drive Simulation from browser wall-clock scheduling and fixed-timestep timing |
| `src/visualization/`     | Convert observed simulation information into visual representations           |
| `examples/`              | Compose components into runnable scenarios                                    |

The folders are not intended as permanent framework layers. They exist because concrete implementation responsibilities have appeared. Phase 1 deliberately stops here rather than renaming accurate folders merely to match an earlier speculative tree.

---

## 3. Dependency direction

vLab2D deliberately keeps dependencies pointing toward simulation concepts rather than allowing presentation concerns to leak inward.

```mermaid
flowchart TD
    EXAMPLE["Example / future application"]
    PACKAGE["Package facade<br/>src/mod.ts"]
    RUNTIME["Browser Runtime"]
    SIM["Simulation"]
    VIS["Visualization"]
    API["Engine layer API<br/>src/engine/mod.ts"]
    WORLD["World"]
    KIN["Kinematics"]
    MATH["Math"]

    EXAMPLE --> PACKAGE

    PACKAGE -. re-exports .-> RUNTIME
    PACKAGE -. re-exports .-> SIM
    PACKAGE -. re-exports .-> VIS
    PACKAGE -. re-exports .-> API

    RUNTIME --> SIM
    SIM --> API
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
        BODY["Body"]
        WORLD["World"]
        INT["Kinematic integrators"]
        STATE["BodyState / BodySnapshot"]
        VEC["Vector2"]
    end

    EXT --> API

    API --> BODY
    API --> WORLD
    API --> INT
    API --> STATE
    API --> VEC
```

TypeScript does not physically prevent a consumer from importing an internal file directly.

The boundary is therefore both:

- a source-code convention;
- a documented API contract.

Project code outside the engine should prefer `mod.ts`.

Both visualization renderers follow this rule by consuming public snapshot types from the engine boundary rather than depending on world storage internals.

---

## 5. State ownership

One of the strongest current architectural rules is:

> The simulation engine owns authoritative mutable simulation state.

For the multi-body runtime, that authority belongs to `World`.

```mermaid
flowchart TD
    BODY["Reusable immutable Body definition"]
    INIT["BodyInitialConditions"]
    WORLD["World"]
    STORE[("private BodyId → WorldBody storage")]
    STATE["World-owned BodyState"]

    COMMANDS["Validated commands<br/>addBody<br/>setGravity<br/>step"]
    QUERIES["Observation<br/>getBodyState<br/>getBodySnapshots"]
    SNAPSHOT["BodySnapshot"]
    DEF["shared immutable definition"]
    OBSSTATE["detached BodyState"]

    BODY --> COMMANDS
    INIT --> COMMANDS
    COMMANDS --> WORLD
    WORLD --> STORE
    STORE --> BODY
    STORE --> STATE

    STATE --> WORLD
    WORLD --> QUERIES
    QUERIES --> SNAPSHOT
    BODY --> DEF --> SNAPSHOT
    STATE --> OBSSTATE --> SNAPSHOT
```

`BodyState` is runtime data, not an intrinsic property of `Body`. Consumers do not construct authoritative state or receive the world's internal mutable storage.

`BodySnapshot` intentionally treats its two kinds of data differently: the immutable reusable `Body` definition is shared by reference, while World-owned runtime state is copied into a detached `BodyState` observation. A renderer can therefore discover intrinsic geometry without receiving writable World state.

---

## 6. Observation and control are separate

The engine API currently contains two conceptually different kinds of interaction.

### Observation

Observation asks:

> What is the simulation state?

Examples:

```text
world.gravity
world.getBodyState(...)
world.getBodySnapshots()
```

### Control

Control asks:

> Please change or advance the simulation.

Examples:

```text
world.addBody(...)
world.setGravity(...)
world.step(...)
```

The distinction is expressed through ordinary methods rather than separate command/query framework objects.

That is intentional. The project has not demonstrated a need for a command bus, repository abstraction, event system, or similar infrastructure.

---

## 7. World-owned bodies

`Body` is a reusable definition while the World owns each instantiated body's runtime identity and state.

```text
Body definition
    +
BodyInitialConditions
    ↓
World.addBody(...)
    ↓
BodyId → BodyState
```

`BodyId` is an opaque, world-local identifier.

`BodyState` currently contains position and velocity. It is a readonly structural data contract rather than a constructible state-owning class.

This keeps the distinction explicit:

```text
Body                  intrinsic reusable definition
BodyInitialConditions insertion configuration
BodyState              World-owned runtime data
BodySnapshot           identity + shared immutable definition + detached runtime observation
```

---

## 8. State and integration behavior are separate

`World` owns body runtime state and environmental gravity, but it does not contain a hard-coded numerical integration algorithm.

Instead it receives a `KinematicIntegrator`.

```mermaid
classDiagram
    class World {
        -Map bodies
        -Vector2 gravity
        -KinematicIntegrator integrator
        +addBody()
        +getBodySnapshots()
        +setGravity()
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

    World --> KinematicIntegrator : delegates stepping
    ExplicitEulerIntegrator ..|> KinematicIntegrator
    SemiImplicitEulerIntegrator ..|> KinematicIntegrator
```

This is a small application of the Strategy pattern:

- `World` decides **when** bodies are advanced and supplies its current gravity as the acceleration input;
- an integrator decides **how** one kinematic state is numerically advanced.

The interface remains deliberately specific to kinematics rather than becoming a generalized numerical-integration framework.

The names are intentionally different at the World and integrator boundaries:

```text
World.gravity
    environment property

KinematicIntegrator.integrate(..., acceleration, ...)
    mathematical quantity consumed by the integration algorithm
```

At the current stage, the acceleration supplied during stepping is exactly the World's gravity vector.

---

## 9. Stepping a world

A world step is deliberately transactional.

The world first calculates and validates every candidate state before committing any authoritative replacement.

```mermaid
sequenceDiagram
    participant Caller
    participant World as World
    participant Integrator as KinematicIntegrator
    participant Candidates as Candidate states
    participant State as Authoritative state

    Caller->>World: step(dt)
    World->>World: validate dt

    loop every body
        World->>Integrator: integrate(state, gravity, dt)
        Integrator-->>World: candidate state
        World->>World: validate candidate
        World->>Candidates: store candidate
    end

    World->>State: commit all candidates
    World-->>Caller: step complete
```

The invariant is:

> Either every body advances successfully, or no authoritative body state is replaced.

---

## 10. Body runtime-state model

The current runtime motion state is intentionally small.

```mermaid
classDiagram
    class Vector2 {
        +number x
        +number y
        +add()
        +subtract()
        +scale()
    }

    class BodyState {
        <<interface>>
        +Vector2 position
        +Vector2 velocity
    }

    BodyState *-- Vector2 : position
    BodyState *-- Vector2 : velocity
```

A `BodyState` contains only:

```text
position
velocity
```

It deliberately does not contain intrinsic Body properties, mass, force, geometry, orientation, angular velocity, or collision state.

Unlike the earlier `KinematicState` class, `BodyState` has no constructor or behavior. It is the structural data contract for World-owned runtime motion state.

---

## 11. Simulation orchestration

The real `Simulation` layer now lives outside the engine:

```text
src/simulation/simulation.ts
```

Its responsibility is deliberately small:

```text
fixed World membership
        +
per-World execution status
        +
deterministic step(dt)
```

```mermaid
flowchart TD
    SIM["Simulation"]
    W1["World A<br/>active"]
    W2["World B<br/>failed"]
    W3["World C<br/>active"]
    ERR["captured thrown value"]

    SIM --> W1
    SIM --> W2
    SIM --> W3
    W2 --> ERR
```

A Simulation contains `1..N` unique World references. Membership is fixed after construction and the supplied collection is copied so external array mutation cannot change the Simulation.

`simulation.step(dt)` validates the timestep before any World is touched. For a valid timestep it visits active Worlds in constructor order and supplies the same `dt` to each.

If a World throws while stepping, Simulation records that World as terminally failed and continues with later active Worlds. Failed Worlds are skipped on future steps.

This makes failure part of the experiment rather than a Simulation-wide abort:

```text
World A  active  → continues
World B  failed  → retains last valid World-owned state
World C  active  → continues
```

World stepping itself remains atomic, so Simulation failure status does not mean invalid physical state was committed.

`getWorlds()` exposes a detached membership collection containing the actual coordinated World references. `getWorldStatus(world)` exposes a detached `active` / `failed(error)` status, or `undefined` for a non-member.

Simulation does **not** own:

- body runtime state;
- gravity or integrators;
- body snapshots;
- simulation time;
- browser scheduling;
- start/pause/run lifecycle;
- rendering;
- retry/reset behavior;
- cross-World transactional rollback.

The earlier `KinematicSimulation` remains retired. It owned one body's state; the current `Simulation` instead coordinates independent Worlds.

---

## 12. Visualization boundary

Visualization lives outside the engine:

```text
src/visualization/
```

The current concrete renderers are:

```text
SvgKinematicRenderer
CanvasKinematicRenderer
```

Both consume detached engine observations, but their output mechanisms differ.

```mermaid
flowchart LR
    WORLD["World"]
    SNAP["readonly BodySnapshot[]"]

    SVG["SvgKinematicRenderer"]
    CANVAS["CanvasKinematicRenderer"]

    DOC["SVG document"]
    CTX["Canvas 2D context"]

    WORLD -->|"getBodySnapshots()"| SNAP

    SNAP --> SVG --> DOC
    SNAP --> CANVAS --> CTX
```

Neither renderer advances simulation time, calculates physics, modifies world state, or inspects private world storage.

Their rendering responsibilities are currently:

```text
SvgKinematicRenderer
    SVG document generation
    integer grid
    world axes
    origin marker
    body markers

CanvasKinematicRenderer
    Canvas frame clearing
    integer grid
    world axes
    origin marker
    body drawing
    display-space body-marker hit testing
    per-frame hover presentation
    per-frame selection presentation
```

Both renderers use `ViewportTransform` for coordinate placement while retaining rendering-technology-specific drawing behavior. Both expose programmatic viewport centering and scale changes. Canvas additionally accepts display-space pan deltas, exposes inverse display-to-world scalar queries, supports anchor-preserving scale changes, and can hit-test its rendered body markers, while browser pointer/wheel-event orchestration remains outside the renderer in host/example code.

Canvas and canvas-like interactive rendering are the primary visualization target. SVG remains a secondary static companion where maintaining support is natural and reasonably inexpensive. Shared abstractions should represent genuinely common concepts; SVG compatibility must not force Canvas into a weaker or less useful design.

The two renderers intentionally retain different output models. Their existence does not currently justify a generic renderer interface.

---

## 13. World coordinates versus display coordinates

The engine uses mathematical world coordinates:

```text
+x → right
+y → up
```

The current display technologies use coordinates where positive Y points downward.

Bidirectional conversion between world and display coordinates is owned by the shared `ViewportTransform`.

```mermaid
flowchart TD
    WORLD["World coordinates<br/>+X right<br/>+Y up"]
    TRANSFORM["ViewportTransform<br/>width<br/>height<br/>pixelsPerUnit"]

    SVG["SvgKinematicRenderer"]
    CANVAS["CanvasKinematicRenderer"]

    WORLD <--> TRANSFORM
    TRANSFORM --> SVG
    TRANSFORM <--> CANVAS
```

The forward mapping is:

```text
displayX = width / 2 + (worldX - centerWorldX) × pixelsPerUnit

displayY = height / 2 - (worldY - centerWorldY) × pixelsPerUnit
```

The inverse mapping is:

```text
worldX = centerWorldX + (displayX - width / 2) / pixelsPerUnit

worldY = centerWorldY - (displayY - height / 2) / pixelsPerUnit
```

The configured world-space center therefore appears at the center of the viewport; `(0, 0)` remains the default center.

`ViewportTransform` owns viewport dimensions, scale, mutable world-space center, validation, scalar forward/inverse coordinate conversion, and the continuous world-space extent visible through the viewport.

The visible extent is exposed through scalar values equivalent to:

```text
minWorldX
maxWorldX
minWorldY
maxWorldY
```

It deliberately does not know about integer-grid selection, SVG, Canvas, `World`, snapshots, `Vector2`, or rendering primitives.

Both renderers construct and retain their transform internally. Renderer methods expose semantic viewport operations without leaking the transform object itself.

The transform was extracted only after SVG and Canvas independently demonstrated the same coordinate-mapping responsibility. The mutable center extends that existing viewport responsibility rather than introducing a separate camera object.

---

## 14. Host/application responsibility

Example `main.ts` files act as composition roots.

The Canvas composition root decides:

- which Worlds to create;
- which integrator and gravity each World uses;
- which bodies to create;
- which Worlds belong to the Simulation;
- which browser Runtime configuration to use;
- which example-local host presents current state;
- which renderer to create;
- where output is displayed or written.

The Canvas-specific DOM and interaction mechanics live in `CanvasExampleHost`, which remains under `examples/kinematic-world-canvas/`. It owns pointer/wheel handling, hover and selection identity, inspection outputs, and per-frame rendering because those policies currently have one concrete consumer.

Runtime decides when deterministic Simulation steps occur from browser wall-clock input. The engine does not decide which renderer exists. Simulation does not know about wall-clock execution. Runtime does not know how a frame is rendered. The renderer does not decide which World, Simulation, Runtime, or integrator exists.

---

## 15. Current browser runtime flow

`BrowserSimulationRuntime` separates Simulation cadence from browser frame cadence.

```mermaid
sequenceDiagram
    participant Browser
    participant Main as Canvas main.ts
    participant Runtime as BrowserSimulationRuntime
    participant Simulation
    participant World
    participant Host as CanvasExampleHost
    participant Renderer as CanvasKinematicRenderer

    Main->>Runtime: run()
    Runtime->>Host: renderFrame() initial presentation
    Runtime->>Browser: requestAnimationFrame(callback)

    Browser->>Runtime: callback(timestamp)
    Runtime->>Runtime: establish first timestamp
    Runtime->>Browser: request next frame

    Browser->>Runtime: callback(timestamp)
    Runtime->>Runtime: calculate + clamp frame delta
    Runtime->>Runtime: add delta to accumulator

    loop while accumulator >= fixed timestep
        Runtime->>Simulation: step(fixed timestep)
        Simulation->>World: step(fixed timestep)
        Runtime->>Runtime: subtract fixed timestep
    end

    Runtime->>Host: renderFrame()
    Host->>World: getBodySnapshots()
    World-->>Host: detached snapshots
    Host->>Host: refresh pointer / selection inspection
    Host->>Renderer: render(snapshots, hovered BodyId, selected BodyId)
    Runtime->>Browser: request next frame
```

Variable browser frame delta is scheduling input only; fixed `Simulation.step(dt)` values remain the deterministic numerical progression.

Runtime remains unaware of Canvas, snapshots, and interaction state. The renderer remains unaware of `requestAnimationFrame` and Simulation stepping. Simulation remains unaware of browser time and render cadence.

The host also owns pointer and wheel interaction. It tracks the active pointer, uses browser pointer capture for dragging, and converts browser client coordinates from CSS space into Canvas drawing-buffer coordinates. Display-space deltas are passed to `CanvasKinematicRenderer.panViewportBy(...)`; absolute display coordinates are passed through the renderer's inverse mapping queries to produce the live world-coordinate readout and through its body-marker hit test to produce the live body readout.

For wheel/trackpad zoom, the host normalizes wheel deltas, applies zoom sensitivity and minimum/maximum scale policy, prevents page scrolling while the Canvas owns the wheel interaction, and supplies an absolute requested scale together with the pointer's Canvas display-space anchor. `CanvasKinematicRenderer` delegates the anchor-preserving geometry to `ViewportTransform`.

For picking, hover, and selection, the host owns interaction state while the engine continues to own authoritative body state. It retains the current pointer position, transient hovered `BodyId`, and persistent selected `BodyId`, then supplies the hover and selection identities to `render(...)` as per-frame presentation input.

Hover is recomputed during the animation loop because simulation bodies move independently of pointer events. A stationary pointer can therefore gain or lose a hovered body as the rendered snapshots change.

Selection changes only when a primary-pointer interaction completes without exceeding the host-defined movement tolerance. Once movement exceeds that tolerance, the interaction is treated as viewport dragging and does not alter selection. Clicking a body selects its `BodyId`; clicking empty Canvas clears selection. The renderer remains independent from DOM pointer/wheel-event APIs and persists neither hover nor selection identity.

The selected-body inspector uses the same latest detached observation set. The host resolves `selectedBodyId` against those snapshots on each frame and formats the matching body's position and velocity into DOM outputs. It stores identity persistently, not the matching snapshot.

```mermaid
flowchart LR
    INPUT["Pointer / wheel events"]
    HOST["Canvas example / host"]
    POLICY["CSS conversion + interaction policy"]
    RENDERER["CanvasKinematicRenderer"]
    TRANSFORM["ViewportTransform"]
    OUTPUT["World-coordinate output"]

    INPUT --> HOST --> POLICY --> RENDERER --> TRANSFORM
    TRANSFORM --> RENDERER --> HOST --> OUTPUT
```

---

## 16. Architectural principles demonstrated today

Several project principles are now demonstrated by the implementation.

### Simulation and visualization are independent

The engine contains no rendering dependency.

### Runtime and Simulation are independent

`BrowserSimulationRuntime` converts browser wall-clock cadence into fixed deterministic Simulation steps.

Simulation does not know about `requestAnimationFrame`, frame timestamps, accumulators, or rendering callbacks.

### State ownership is explicit

`World` owns authoritative body state.

### Observation does not expose world storage

Consumers receive detached observations.

### Behavior can be injected

The numerical integration algorithm is supplied through `KinematicIntegrator`.

### Composition is preferred over inheritance

Integrators implement a small behavior contract rather than participating in a deep class hierarchy.

### Public boundaries are deliberate

Complete package consumers should normally import from `src/mod.ts`.

`src/engine/mod.ts` remains the narrower engine-layer boundary for internal layers and consumers that intentionally depend only on engine/domain concepts.

### Abstractions are introduced from concrete needs

`ViewportTransform` was introduced only after SVG and Canvas independently demonstrated the same viewport geometry and coordinate-conversion responsibility. Its visible-world bounds were added only after both grid implementations independently derived the same continuous viewport extent. Inverse mapping was added only after pointer-coordinate inspection created a concrete display-to-world consumer.

### Canvas drives visualization evolution

Canvas and canvas-like interactive rendering are the primary visualization target. SVG is maintained as a useful secondary renderer when compatibility remains reasonable, but SVG parity does not constrain useful Canvas capabilities.

There is still no generalized renderer hierarchy, camera framework, event bus, entity-component system, or dependency-injection container.

Those abstractions have not been justified by the implementation.

---

## 17. What architecture this is — and is not

Some current ideas resemble well-known architectural patterns, but vLab2D is not attempting to implement a formal architecture methodology.

For example:

- injected integrators resemble the **Strategy pattern**;
- `mod.ts` acts as a **module facade/public boundary**;
- world-owned state and detached observations reinforce **encapsulation**;
- external composition follows **dependency inversion** where replaceable behavior is involved.

However, vLab2D is not currently claiming to be Clean Architecture, Hexagonal Architecture, an Entity Component System, Domain-Driven Design, an event-driven architecture, or a plugin framework.

Those labels would imply structures and constraints the project has not needed.

---

## 18. Implemented, intended, and future architecture

It is useful to keep these categories separate.

### Implemented

```text
✓ package-facing composition facade through src/mod.ts
✓ public engine-layer boundary through src/engine/mod.ts
✓ immutable Circle geometry in simulation/world units
✓ optional Circle geometry on reusable Body definitions
✓ shapeless particle-like Bodies remain valid
✓ mathematical Vector2 values
✓ readonly BodyState runtime-data contract
✓ replaceable kinematic integrators
✓ reusable Body definitions + multi-body World
✓ world-local BodyId
✓ world-owned authoritative body state
✓ BodySnapshot observations with shared immutable definitions + detached BodyState
✓ atomic world stepping
✓ deterministic Simulation orchestration across 1..N Worlds
✓ fixed unique Simulation World membership
✓ per-World active / failed execution status
✓ World-failure isolation while later Worlds continue
✓ failed Worlds skipped on subsequent Simulation steps
✓ detached Simulation membership / status observations
✓ independent SVG visualization
✓ independent Canvas 2D visualization
✓ shared ViewportTransform
✓ shared world-to-display coordinate mapping
✓ shared display-to-world coordinate mapping
✓ shared continuous visible world bounds
✓ mutable world-space viewport center
✓ mutable viewport display scale
✓ programmatic viewport centering in Canvas and SVG
✓ programmatic viewport scale in Canvas and SVG
✓ Canvas display-space panning operation
✓ pointer-drag panning in the Canvas browser host
✓ Canvas pointer world-coordinate inspection
✓ pointer-anchored wheel / trackpad zoom
✓ Canvas display-space body-marker picking
✓ live body-under-pointer inspection
✓ transient host-owned hover identity
✓ per-frame Canvas hover highlighting
✓ persistent host-owned selected-body identity
✓ click-versus-drag interaction distinction
✓ per-frame Canvas selection highlighting
✓ read-only selected-body position / velocity inspection
✓ selected identity resolved against fresh detached observations
✓ equivalent SVG and Canvas spatial references
✓ Canvas integer grid
✓ Canvas world axes
✓ Canvas world-origin marker
✓ external host/example composition
✓ example-local CanvasExampleHost for DOM interaction and rendering policy
✓ intentionally small Canvas main.ts composition root
✓ BrowserSimulationRuntime
✓ Runtime-owned requestAnimationFrame scheduling
✓ Runtime-owned frame-delta clamping
✓ Runtime-owned fixed-timestep accumulator loop
✓ host-defined Runtime frame callback
✓ simulation/render cadence separation
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
? pinch zoom
? selected-body velocity-vector diagnostic
? editable body controls
? UI controls
? collision detection and response
? forces
? richer body models
? logging / inspection
? diagnostic overlays
```

These are directions, not promises about concrete class or folder structure.

---

## 19. Shared viewport transformation

SVG and Canvas previously implemented the same world-to-display transformation independently.

That duplication produced the evidence needed to extract `ViewportTransform`.

```mermaid
flowchart TD
    WORLD["World coordinates"]
    TRANSFORM["ViewportTransform"]

    SVG["SvgKinematicRenderer"]
    CANVAS["CanvasKinematicRenderer"]

    WORLD <--> TRANSFORM
    TRANSFORM --> SVG
    TRANSFORM <--> CANVAS
```

The shared transform owns:

- immutable viewport width and height;
- mutable pixels per world unit;
- a mutable world-space position mapped to the viewport center;
- inversion between mathematical positive Y and display positive Y;
- conversion from world coordinates into display coordinates;
- inverse conversion from display coordinates into world coordinates.

The renderers retain responsibility for rendering-specific behavior.

Viewport dimensions remain immutable, while the world-space center and display scale are mutable so the visible region can move and change magnification without reconstructing the renderer. The transform is created internally by each renderer.

It is not currently an injected strategy because the project has not demonstrated a need to substitute transformation behavior independently from renderer construction.

The abstraction also remains independent from engine-domain values such as `Vector2`; its coordinate operations accept and return numbers. The inverse API stays scalar as well, avoiding a new point type or per-query allocation before a concrete need justifies one.

### Continuous visible world bounds

SVG and Canvas later independently derived the same continuous world-space extent in order to determine which integer grid coordinates were visible. That duplication established a second viewport responsibility.

`ViewportTransform` now exposes the minimum and maximum visible world coordinates on each axis:

```text
minWorldX
maxWorldX
minWorldY
maxWorldY
```

These bounds are derived from viewport dimensions, the mutable scale, and the current world-space center without allocating a separate bounds object.

The responsibility boundary is:

```mermaid
flowchart TD
    TRANSFORM["ViewportTransform"]
    BOUNDS["Continuous visible world bounds"]

    CANVAS["Canvas grid policy"]
    SVG["SVG grid policy"]

    TRANSFORM --> BOUNDS
    BOUNDS --> CANVAS
    BOUNDS --> SVG

    CANVAS --> CINT["ceil / floor / skip zero / draw"]
    SVG --> SINT["ceil / floor / skip zero / emit SVG"]
```

Continuous extent belongs to viewport geometry. Discrete grid selection remains renderer behavior: each renderer decides which integer coordinates to draw, reserves zero for the world axes, applies presentation styling, and uses its own drawing technology.

This keeps `ViewportTransform` useful beyond grid rendering while avoiding a grid-aware viewport abstraction. Panning changes the world-space center, and zoom changes the scale, so visible bounds follow both pieces of mutable viewport state rather than remaining symmetric around the world origin.

`CanvasKinematicRenderer.panViewportBy(...)` translates display-space drag displacement into a center change. The browser host owns Pointer Events and CSS-pixel conversion, preserving the renderer's independence from DOM input mechanics.

### Inverse display-to-world mapping

Pointer-coordinate inspection created the first concrete need to map a display position back into mathematical world space. The inverse equations belong to `ViewportTransform` because they are the reverse of the same viewport geometry already used for rendering.

`ViewportTransform` exposes scalar `displayToWorldX(...)` and `displayToWorldY(...)` operations. They account for the current world-space center, display scale, and inverted display Y axis. `CanvasKinematicRenderer` delegates these queries so its browser host can use the mapping without receiving the transform object itself. SVG does not expose a renderer-level inverse query because it currently has no consumer for one.

Browser client coordinates are not Canvas drawing-buffer coordinates. The host therefore converts Pointer Event coordinates using the Canvas bounding rectangle and drawing-buffer dimensions before invoking the renderer's inverse mapping. The host also owns presentation of the result, including decimal formatting and the DOM `<output>` element.

```mermaid
flowchart LR
    CLIENT["Pointer client coordinates"]
    HOST["Browser host conversion"]
    DISPLAY["Canvas drawing-buffer coordinates"]
    RENDERER["CanvasKinematicRenderer"]
    TRANSFORM["ViewportTransform inverse mapping"]
    WORLD["World coordinates"]

    CLIENT --> HOST --> DISPLAY --> RENDERER --> TRANSFORM --> WORLD
```

### Mutable scale and anchor-preserving zoom

Programmatic zoom introduced the first need for display scale to change after renderer construction. `ViewportTransform` therefore treats `pixelsPerUnit` as mutable viewport state rather than immutable constructor-only configuration.

`setPixelsPerUnit(...)` changes magnification while preserving the current world-space center. Because forward mapping, inverse mapping, and visible-world bounds all read the same current scale, they remain coherent after the change.

Interactive zoom created a stronger geometric requirement: the world point underneath the pointer should remain underneath the pointer while scale changes. `setPixelsPerUnitAroundDisplayPoint(...)` implements that invariant by:

1. resolving the world coordinate currently underneath the display-space anchor;
2. calculating the center required to keep that world coordinate at the same display location under the new scale;
3. validating the requested scale, anchor, and candidate center;
4. committing the new scale and center only after all candidate values are valid.

```mermaid
flowchart LR
    ANCHOR["Display-space anchor"]
    WORLD["World point under anchor"]
    SCALE["Requested scale"]
    CENTER["Candidate viewport center"]
    COMMIT["Atomic scale + center commit"]

    ANCHOR --> WORLD --> CENTER
    SCALE --> CENTER --> COMMIT
```

Both renderers expose programmatic scale changes because mutable scale is shared viewport geometry. Canvas additionally exposes its current scale and an anchor-aware scale operation because the browser host has a concrete interactive consumer for those capabilities.

The browser host owns wheel/trackpad interpretation: browser-coordinate conversion, delta-mode normalization, exponential zoom sensitivity, minimum/maximum scale limits, and cancellation of page scrolling during Canvas zoom. These are interaction policies rather than `ViewportTransform` invariants.

### Canvas body picking

The current body-picking capability is still intentionally tied to Canvas presentation geometry.

`World` snapshots now expose each immutable Body definition, including optional Circle geometry. `CanvasKinematicRenderer` has not adopted that domain geometry yet, however: it still draws every body using its existing fixed display-space marker. Picking therefore continues to test the marker radius until the dedicated Circle-rendering and Circle-aware-picking slices change those presentation semantics explicitly.

`findBodyAtDisplayPoint(...)` accepts detached snapshots and a display-space point. For each snapshot it maps the body's world position through the current viewport transform, compares squared display-space distance against the squared marker radius, and returns the nearest hit `BodyId`.

```mermaid
flowchart LR
    SNAP["Latest rendered snapshots"]
    POINT["Canvas display point"]
    RENDERER["CanvasKinematicRenderer"]
    TRANSFORM["ViewportTransform"]
    HIT["Nearest BodyId or none"]

    SNAP --> RENDERER
    POINT --> RENDERER
    RENDERER --> TRANSFORM
    TRANSFORM --> RENDERER
    RENDERER --> HIT
```

Squared distance avoids an unnecessary square root while expressing the same circular containment test. Choosing the nearest hit avoids depending on snapshot order when rendered markers overlap.

The browser host deliberately reuses the same detached snapshots that produced the visible frame when performing the hit test. Picking is therefore an observation of rendered presentation state, not a second read from authoritative world storage during the input event.

This does not establish physical body geometry, collision shape, persistent selection state, or a generic picking framework.

### Transient hover highlighting

Hover builds directly on the Canvas picking query while preserving state ownership boundaries.

The browser host owns the transient hovered `BodyId` because hover is interaction/presentation state rather than simulation state. `CanvasKinematicRenderer` remains stateless about hover identity: `render(...)` receives an optional highlighted body identifier for the current frame and draws a simple halo around that body's existing marker.

```mermaid
flowchart LR
    POINTER["Retained pointer position"]
    SNAP["Latest rendered snapshots"]
    HOST["Browser host"]
    PICK["Canvas hit test"]
    HOVER["Hovered BodyId"]
    RENDER["render(snapshots, hovered BodyId)"]
    HALO["Body + hover halo"]

    POINTER --> HOST
    SNAP --> HOST
    HOST --> PICK --> HOVER --> RENDER --> HALO
    SNAP --> RENDER
```

The host recomputes hover after obtaining each frame's latest detached snapshots. This is necessary because bodies move even when the pointer does not. The hover readout and halo can therefore appear or disappear under a stationary pointer without waiting for another DOM pointer event.

The same snapshot set drives hit testing and rendering, so the highlighted identity corresponds to the observations visible in that frame.

### Persistent click selection

Selection is deliberately separate from hover.

The browser host owns an optional selected `BodyId`. Unlike hover, selection is not recomputed from the pointer every frame. It changes only through an intentional click and therefore persists while the pointer moves away, leaves the Canvas, the viewport pans or zooms, and the selected body continues moving.

A primary-pointer interaction begins as a possible click and also drives viewport panning. The host measures total movement from the pointer-down position in browser client coordinates. If movement exceeds a small tolerance, the interaction becomes a drag and selection remains unchanged. If the pointer is released without exceeding the tolerance, the release point is hit-tested against the current rendered observations: a hit replaces the selected identity, while an empty-space click clears it.

```mermaid
flowchart TD
    DOWN["Primary pointer down"]
    MOVE["Pointer movement"]
    TOL["Movement exceeds click tolerance?"]
    DRAG["Pan viewport"]
    UP["Pointer up"]
    PICK["Hit-test release point"]
    SELECT["Store BodyId"]
    CLEAR["Clear selection"]

    DOWN --> MOVE --> TOL
    TOL -->|yes| DRAG
    TOL -->|no| UP --> PICK
    PICK -->|body| SELECT
    PICK -->|empty| CLEAR
```

Selection stores identity rather than a snapshot. Each new frame can therefore render the currently selected body from fresh detached observations without turning an old observation into persistent domain state.

`CanvasKinematicRenderer` receives both hovered and selected identifiers as per-frame presentation input and draws distinct rings for each. A body can be both hovered and selected, while the renderer itself owns neither state.

### Read-only selected-body inspection

Persistent identity now drives a live read-only inspector without changing the engine boundary.

The browser host stores only `selectedBodyId`. After obtaining each frame's detached snapshots, it searches those observations for the matching identity and formats the matching snapshot's current position and velocity into ordinary DOM outputs.

```mermaid
flowchart LR
    ID["selected BodyId"]
    SNAP["Latest detached snapshots"]
    HOST["Browser host"]
    MATCH["Matching snapshot"]
    POS["Position output"]
    VEL["Velocity output"]

    ID --> HOST
    SNAP --> HOST
    HOST --> MATCH
    MATCH --> POS
    MATCH --> VEL
```

The selected snapshot itself is not retained across frames. This preserves the distinction between persistent application identity and ephemeral engine observation:

```text
persistent: selected BodyId
ephemeral:  snapshot resolved for the current frame
authority:  World
```

If the selected identity cannot be resolved in the current observation set, the inspector shows unavailable values without silently changing selection. Body-removal behavior can therefore be decided separately if removal becomes a real capability.

Formatting precision and DOM structure remain host presentation concerns. No engine API, renderer inspector state, writable control, or generic inspector abstraction is required for this first inspector.

No editable body state, drag-to-move behavior, style/theme abstraction, `WorldBounds` value type, renderer hierarchy, camera model, transformation matrix framework, point abstraction, generic inspector framework, diagnostic-overlay framework, or gesture framework has been introduced.

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
