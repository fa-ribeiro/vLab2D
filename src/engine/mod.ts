/**
 * Public API for the vLab2D simulation engine.
 *
 * External consumers should import engine functionality from this module
 * rather than depending directly on internal engine modules.
 *
 * @module
 */

export type { KinematicIntegrator } from "./kinematics/kinematic-integrator.ts";

export { ExplicitEulerIntegrator } from "./kinematics/explicit-euler-integrator.ts";
export { KinematicState } from "./kinematics/kinematic-state.ts";
export { SemiImplicitEulerIntegrator } from "./kinematics/semi-implicit-euler-integrator.ts";

export { Vector2 } from "./math/vector2.ts";

export { KinematicSimulation } from "./simulation/kinematic-simulation.ts";

export type { BodyId } from "./world/body-id.ts";
export type { KinematicBodySnapshot } from "./world/kinematic-body-snapshot.ts";

export { KinematicWorld } from "./world/kinematic-world.ts";
