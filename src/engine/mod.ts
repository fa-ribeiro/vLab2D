/**
 * Public API for the vLab2D simulation engine.
 *
 * External consumers should import engine functionality from this module
 * rather than depending directly on internal engine modules.
 *
 * @module
 */

export { ExplicitEulerIntegrator } from "./kinematics/explicit-euler-integrator.ts";
export { KinematicState } from "./kinematics/kinematic-state.ts";
export { Vector2 } from "./math/vector2.ts";
