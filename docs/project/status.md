# Project Status

## Current checkpoint

The engine now has a small kinematics foundation with two numerical integration methods.

The public engine API currently provides:

- `Vector2`, an immutable two-dimensional vector value.
- `KinematicState`, representing position and velocity at a particular instant.
- `ExplicitEulerIntegrator`, which advances position using the velocity at the beginning of the timestep.
- `SemiImplicitEulerIntegrator`, which updates velocity first and then advances position using the updated velocity.

Both integration algorithms operate on the same kinematic state representation, return new state objects, and do not mutate their inputs.

Their intentionally similar implementations make their defining numerical difference explicit and provide the first concrete example of alternative simulation behaviors in vLab2D.

## Next step

Introduce the first small piece of simulation behavior that **consumes an integration strategy**.

The purpose of this step is not yet to design a complete simulation runtime. It is to discover, from a real consumer, what information and behavior an integrator actually needs to expose.

Although the two current Euler implementations have the same `integrate(...)` method shape, vLab2D will not introduce a shared `Integrator` interface until a real consumer provides stronger evidence that this is the appropriate abstraction.
