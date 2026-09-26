import { Vector2 } from "../math/vector2.ts";
import { KinematicState } from "./kinematic-state.ts";

/**
 * Advances kinematic state using the Semi-Implicit Euler integration method.
 *
 * Semi-Implicit Euler first updates velocity from acceleration and then uses
 * that updated velocity to advance position:
 *
 * - `nextVelocity = velocity + acceleration * dt`
 * - `nextPosition = position + nextVelocity * dt`
 *
 * This ordering distinguishes Semi-Implicit Euler from Explicit Euler, which
 * advances position using the velocity at the beginning of the timestep.
 *
 * Semi-Implicit Euler is also commonly known as Symplectic Euler.
 */
export class SemiImplicitEulerIntegrator {
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
    const nextVelocity = state.velocity.add(acceleration.scale(dt));
    const nextPosition = state.position.add(nextVelocity.scale(dt));

    return new KinematicState(nextPosition, nextVelocity);
  }
}
