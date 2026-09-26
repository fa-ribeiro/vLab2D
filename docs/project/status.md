# Project Status

## Current checkpoint

The engine now has a small, state-owning kinematic simulation runtime.

The public engine API currently provides:

- `Vector2`, an immutable two-dimensional vector value.
- `KinematicState`, representing position and velocity at a particular instant.
- `KinematicIntegrator`, a narrow strategy contract for advancing kinematic state.
- `ExplicitEulerIntegrator`, which advances position using the velocity at the beginning of the timestep.
- `SemiImplicitEulerIntegrator`, which updates velocity first and then advances position using the updated velocity.
- `KinematicSimulation`, which owns authoritative kinematic state and delegates numerical integration to an injected strategy.

`KinematicSimulation` exposes state for observation while keeping mutation under its control.

Runtime changes are performed through validated commands such as `setAcceleration(...)` and `step(...)`.

Before a new state becomes authoritative, the simulation validates the candidate state returned by the injected integrator. Invalid commands or invalid integration results are rejected without replacing the current stable state.

This is the first concrete use of dependency injection and interchangeable simulation behavior in vLab2D.

## Next step

Introduce the next smallest simulation-domain concept on top of the kinematic runtime.

The goal is to continue discovering the engine architecture from concrete requirements rather than designing a complete world or physics model in advance.

The next feature should help clarify how individual simulated entities relate to simulation state, runtime behavior, and eventually multi-object worlds, while keeping the scope small enough to review, test, and understand completely.
