import { Vector2 } from "../math/vector2.ts";
import { KinematicState } from "./kinematic-state.ts";

/**
 * Advances kinematic state using the Explicit Euler integration method.
 *
 * Explicit Euler estimates the next state entirely from values at the
 * beginning of the timestep:
 *
 * - `nextPosition = position + velocity * dt`
 * - `nextVelocity = velocity + acceleration * dt`
 *
 * This method is intentionally simple and will later provide a useful baseline
 * for comparison with other numerical integration methods.
 */
export class ExplicitEulerIntegrator {
  /**
   * Advances a kinematic state by one timestep.
   *
   * Neither the supplied state nor the acceleration vector is modified.
   * A new {@link KinematicState} is returned.
   *
   * @param state The state at the beginning of the timestep.
   * @param acceleration The constant acceleration applied during the timestep,
   * expressed in world units per second squared.
   * @param dt The timestep duration in seconds.
   * @returns The approximated state at the end of the timestep.
   */
  public integrate(state: KinematicState, acceleration: Vector2, dt: number): KinematicState {
    const nextPosition = state.position.add(state.velocity.scale(dt));
    const nextVelocity = state.velocity.add(acceleration.scale(dt));

    return new KinematicState(nextPosition, nextVelocity);
  }
}
