# Project Status

## Current checkpoint

The first kinematics foundation is in place.

The engine currently provides:

- `Vector2`, an immutable two-dimensional vector value.
- `KinematicState`, representing position and velocity at a particular instant.
- `ExplicitEulerIntegrator`, which advances a kinematic state using constant acceleration and the Explicit Euler method.

The integration behavior is kept separate from the state it operates on. Kinematic state and integration inputs are not mutated during an integration step.

The implementation is covered by colocated tests, including checks that Explicit Euler uses the velocity at the beginning of the timestep when updating position.

## Next step

Implement a **Semi-Implicit Euler integrator**.

This will give the project two concrete integration algorithms with naturally comparable behavior. Once both implementations exist, review their actual interfaces and extract a shared `Integrator` contract only if the common abstraction is justified by the code.

The two algorithms will then provide the first concrete example of interchangeable simulation behavior in vLab2D.
