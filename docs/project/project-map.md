# vLab2D — Project Map

Last updated: 2026-09-28

This is an orientation map, not a frozen architecture or roadmap.

```mermaid
mindmap
  root((vLab2D))
    Purpose
      Learn TypeScript
      Learn simulation concepts
      Have fun
      Build something beautiful
      Explore visually
    Engine / Domain
      Reusable definitions
        Body
        Future Shapes
      World-owned runtime state
      Integrators
      Future forces
      Future collision pipeline
    Simulation / Orchestration
      One or more Worlds
      Deterministic stepping
      Controlled comparisons
    Visualization
      Canvas primary
      SVG secondary
      Inspector
      Diagnostics
      Multiple views
    Runtime
      Browser scheduling
      Fixed timestep loop
      Host interactions
    Engineering values
      Intrinsic properties vs initial conditions vs runtime state
      Safe defaults
      Explicit cardinality
      Vanilla TypeScript
      Minimal dependencies
      Separation of concerns
      Dependency injection
      Composition over inheritance
      JSDoc and rationale-focused comments
      Trustworthy tests
      Visual documentation
```

## Architectural flow

```mermaid
flowchart LR
    DEF["Reusable definitions<br/>Body / future Shape"]
    INIT["Initial conditions"]
    WORLD["World<br/>authoritative runtime state"]
    SIM["Simulation<br/>coordinates Worlds"]
    RUNTIME["Runtime<br/>drives Simulation"]
    VIS["Visualization<br/>observes detached state"]

    DEF --> WORLD
    INIT --> WORLD
    WORLD --> SIM --> RUNTIME

    WORLD -. observations .-> VIS
    SIM -. coordinated observations .-> VIS
```

The central lifecycle rule is:

```text
intrinsic properties
    → reusable immutable definition

initial conditions
    → insertion into a state-owning context

runtime state
    → owned by that context
```

The same reusable definition may create multiple independent runtime instances.

## Current Body / World relationship

```mermaid
flowchart TD
    BODY["Body<br/>reusable definition"]
    ADD["KinematicWorld.addBody(...)"]
    INIT["BodyInitialConditions<br/>position / velocity"]
    ID["world-local BodyId"]
    STATE["World-owned KinematicState"]

    BODY --> ADD
    INIT --> ADD
    ADD --> ID
    ADD --> STATE
```

`Body` currently has no intrinsic properties. This is intentional during Phase 1.

## Future cardinality direction

Cardinality is decided per relationship rather than assumed to be one-to-one.

```mermaid
classDiagram
    class Simulation
    class World
    class Body
    class GeometryAttachment
    class Shape
    class Integrator

    Simulation "1" o-- "1..*" World
    World "1" o-- "0..*" Body
    World "1" --> "1" Integrator
    Body "1" o-- "0..*" GeometryAttachment
    GeometryAttachment "1" --> "1" Shape
```

The Body/geometry part of this diagram is a future direction rather than current implementation. Phase 2 may exercise only zero-or-one Shape while learning the model, without encoding a permanently singular relationship.

## Development phases

```mermaid
flowchart LR
    P1["Phase 1<br/>Structure + lifecycle"]
    P2["Phase 2<br/>Geometry"]
    P3["Phase 3<br/>Collision / shape physics"]
    P4["Phase 4+<br/>Compound bodies / materials / appearance"]

    P1 --> P2 --> P3 --> P4
```

The detailed and authoritative phased strategy lives in [`roadmap.md`](roadmap.md).

## Development loop

```mermaid
flowchart LR
    A[Establish baseline] --> B[Understand problem]
    B --> C[Compare approaches]
    C --> D[Scope smallest step]
    D --> E[Implement]
    E --> F[Test + verify]
    F --> G[User review]
    G --> H[Sync affected docs]
    H --> I[Inspect staged diff]
    I --> J[Commit]
    J --> K[New authoritative baseline]
```

## Engine boundary

```mermaid
flowchart LR
    EXT[Renderer / Runtime / Simulation / Inspector] -->|queries| Q[Read-only observation API]
    Q --> ENG[Engine / World]
    EXT -->|commands| C[Validated control API]
    C --> ENG
    ENG --> STATE[(Authoritative mutable runtime state)]
    STATE --> ENG
    ENG -->|detached snapshots / observations| Q
```

The engine remains the only authority allowed to mutate simulation state. Observation and control are separate concerns: outsiders may inspect safe representations of state and request changes, while the engine validates and applies those changes consistently.
