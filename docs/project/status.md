# Project Status

## Current checkpoint

vLab2D now has its first end-to-end path from simulation state to visible output.

### Simulation engine

The public engine API currently provides:

- `Vector2`, an immutable two-dimensional vector value.
- `KinematicState`, representing position and velocity at a particular instant.
- `KinematicIntegrator`, a narrow strategy contract for advancing kinematic state.
- `ExplicitEulerIntegrator`, which advances position using the velocity at the beginning of the timestep.
- `SemiImplicitEulerIntegrator`, which updates velocity first and then advances position using the updated velocity.
- `KinematicSimulation`, a state-owning single-state runtime used to establish controlled mutation, validation, and injected integration behavior.
- `BodyId`, an opaque world-local identifier for a simulated body.
- `KinematicBodySnapshot`, a detached observation of one body's identity and kinematic state.
- `KinematicWorld`, which owns and advances the kinematic state of multiple identified bodies.

`KinematicWorld` supports:

- creating bodies;
- observing an individual body's state;
- observing snapshots of all bodies in the world;
- configuring a world-level constant acceleration;
- advancing every body through time with an injected `KinematicIntegrator`.

All bodies currently share the same world acceleration and integration strategy.

The world's authoritative body state remains private. External consumers interact through `BodyId` values and detached observations rather than receiving references to the world's internal storage.

`getBodyState(...)` returns a detached copy of an individual body's state.

`getBodySnapshots()` returns detached observations containing body identity and state without exposing the world's private `Map`.

World stepping remains transactional: all candidate body states are computed and validated before any authoritative state is replaced. A failed step leaves every body at its previous state.

### Visualization

The project now has its first concrete visualization implementation: `SvgKinematicRenderer`.

The renderer:

- lives outside the simulation engine under `src/visualization/`;
- consumes `KinematicBodySnapshot` values rather than engine internals;
- performs no physics calculations and does not mutate simulation state;
- maps mathematical world coordinates into SVG display coordinates;
- places the mathematical world origin at the center of the viewport;
- preserves positive X to the right;
- converts positive world Y into upward visual motion despite SVG's downward-positive Y axis;
- renders each observed body as a simple SVG circle.

The example in `examples/kinematic-world-svg.ts` creates a `KinematicWorld`, advances several bodies using `SemiImplicitEulerIntegrator`, observes the resulting world through the public snapshot API, and writes the rendered result to:

```text
generated/kinematic-world.svg
```

The generated SVG provides the project's first visible confirmation that the simulation and visualization boundaries work together as intended.

The current end-to-end flow is:

```mermaid
flowchart LR
    IC[Initial conditions] --> W[KinematicWorld]
    I[KinematicIntegrator] --> W
    W -->|step| W
    W -->|getBodySnapshots| S[Detached body snapshots]
    S --> R[SvgKinematicRenderer]
    R --> SVG[SVG document]
```

The simulation engine remains independent from visualization. The renderer depends only on information exposed through the engine's public observation boundary.

## Next step

Make the first visualization easier to interpret spatially.

The next small goal should add simple visual reference information to the SVG renderer, starting with the world origin and coordinate axes.

This will make body positions and the world-to-display coordinate transformation visually obvious while keeping the scope small.

The feature should remain within visualization:

- no engine changes unless a concrete requirement emerges;
- no physics calculations in the renderer;
- no animation loop yet;
- no trails, velocity vectors, controls, or richer renderer abstraction yet.

This keeps the next increment focused while making the visual workbench increasingly useful for inspecting future simulation behavior.
