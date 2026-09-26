# Project Status

## Current checkpoint

The engine now has a minimal multi-body kinematic world.

The public engine API currently provides:

- `Vector2`, an immutable two-dimensional vector value.
- `KinematicState`, representing position and velocity at a particular instant.
- `KinematicIntegrator`, a narrow strategy contract for advancing kinematic state.
- `ExplicitEulerIntegrator`, which advances position using the velocity at the beginning of the timestep.
- `SemiImplicitEulerIntegrator`, which updates velocity first and then advances position using the updated velocity.
- `KinematicSimulation`, a state-owning single-state runtime used to establish controlled mutation, validation, and injected integration behavior.
- `BodyId`, an opaque world-local identifier for a simulated body.
- `KinematicWorld`, which owns the kinematic state of multiple identified bodies.

`KinematicWorld` currently supports creating bodies and observing their state.

Body state is stored privately by the world in a `Map<BodyId, KinematicState>`. External consumers interact with bodies through their identifiers and do not receive access to the world's internal storage.

Body creation validates the supplied initial state before accepting it into the world. Unknown body identifiers return `undefined` when queried.

The world currently provides only identity, ownership, creation, and observation. It does not yet advance bodies through time.

## Next step

Allow `KinematicWorld` to advance all of its bodies through time.

The next feature should introduce:

- an injected `KinematicIntegrator`;
- a world-level constant acceleration, initially serving as gravity;
- `step(dt)` behavior that advances every body using the same world configuration.

A world step should preserve the state-safety guarantees already established by the engine.

All candidate body states should therefore be computed and validated before any of them replace the world's current authoritative state.

The intended behavior is transactional:

> Either the entire world step succeeds, or the world remains unchanged.

This will turn `KinematicWorld` from a state container into the first practical multi-body simulation workbench while keeping the scope deliberately small.
