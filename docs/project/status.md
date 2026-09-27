# Project Status

## Current checkpoint

vLab2D has an end-to-end path from simulation state to a static visual representation with a basic Cartesian reference frame.

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

`getBodySnapshots()` returns detached observations containing body identity and state without exposing the world's private `
