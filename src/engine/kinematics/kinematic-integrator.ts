import { Vector2 } from "../math/vector2.ts";
import { KinematicState } from "./kinematic-state.ts";

/**
 * Defines a numerical integration strategy for two-dimensional kinematic state.
 *
 * Implementations approximate the state at the end of a timestep from the
 * state and constant acceleration available at the beginning of that timestep.
 *
 * The interface is deliberately specific to kinematic state rather than being
 * a general-purpose integration abstraction.
 */
export interface KinematicIntegrator {
  /**
   * Advances a kinematic state by one timestep.
   *
   * Implementations must not modify the supplied state or acceleration.
   *
   * @param state The state at the beginning of the timestep.
   * @param acceleration The acceleration applied during the timestep, expressed
   * in world units per second squared.
   * @param dt The timestep duration in seconds.
   * @returns The approximated state at the end of the timestep.
   */
  integrate(state: KinematicState, acceleration: Vector2, dt: number): KinematicState;
}
