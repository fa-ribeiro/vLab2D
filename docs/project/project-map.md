# vLab2D — Project Map

Last updated: 2026-09-26

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
    Simulation
      World state
      Bodies
      Forces
      Integrators
      Collision detection
      Collision solving
    Experiments
      Multiple worlds
      Shared initial conditions
      Different gravity
      Different integrators
      Sensitivity to initial conditions
    Visualization
      Renderer independent of physics
      Velocity and acceleration vectors
      Bounds
      Contact points and normals
      Trails and state colors
      Side-by-side views
      Overlay views
    Observation
      Optional controls
      Inspector
      Logger / console
      Metrics
    Engineering values
      Vanilla TypeScript
      Minimal dependencies
      Separation of concerns
      Dependency injection
      Composition over inheritance
      Modular interchangeable behavior
      JSDoc and rationale-focused comments
      Trustworthy tests
      Visual documentation
```

## Conceptual flow

```mermaid
flowchart LR
    E[Experiment / Orchestrator] --> SA[Simulation A]
    E --> SB[Simulation B]

    SA --> WA[World State A]
    SB --> WB[World State B]

    PA[Injected physics policies] --> SA
    PB[Injected physics policies] --> SB

    WA --> V[Visualization / Comparison]
    WB --> V

    WA --> O[Optional observers]
    WB --> O

    O --> UI[Inspector / controls]
    O --> LOG[Logger / metrics]
```

The exact boundary between `World`, `Simulation`, and injected policies remains intentionally open until early implementations provide evidence.

## Development loop

```mermaid
flowchart LR
    A[Understand problem] --> B[Compare approaches]
    B --> C[Explain rationale / why not]
    C --> D[Implement smallest step]
    D --> E[Document + test]
    E --> F[Observe / run]
    F --> G[User review & approval]
    G --> H[Sync affected project docs]
    H --> I[Verify + inspect staged diff]
    I --> J[Commit]
    J --> K[Next feature]
```

## Engine boundary

```mermaid
flowchart LR
    EXT[Renderer / Debugger / UI / Experiment] -->|queries| Q[Read-only observation API]
    Q --> ENG[Simulation Engine]
    EXT -->|commands| C[Validated control API]
    C --> ENG
    ENG --> STATE[(Authoritative mutable state)]
    STATE --> ENG
    ENG -->|snapshots / views / events| Q
```

The engine is the only authority allowed to mutate simulation state. Observation and control are separate concerns: outsiders may inspect safe representations of state and request changes, while the engine validates and applies those changes consistently.
