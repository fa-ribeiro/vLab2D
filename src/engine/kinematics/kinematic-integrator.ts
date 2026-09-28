import { Vector2 } from "../math/vector2.ts";
import type { BodyState } from "../world/body-state.ts";

/**
 * Defines a numerical integration strategy for two-dimensional kinematic body
 * state.
 *
 * Implementations approximate the state at the end of a timestep from the
 * current body state and constant acceleration available at the beginning of
 * that timestep.
 *
 * The interface is deliberately specific to kinematic motion rather than being
 * a general-purpose numerical integration abstraction.
 */
export interface KinematicIntegrator {
  /**
   * Advances body state by one timestep.
   *
   * Implementations must not modify the supplied state or acceleration.
   *
   * @param state The body state at the beginning of the timestep.
   * @param acceleration The acceleration applied during the timestep, expressed
   * in world units per second squared.
   * @param dt The timestep duration in seconds.
   * @returns The approximated body state at the end of the timestep.
   */
  integrate(state: BodyState, acceleration: Vector2, dt: number): BodyState;
}
