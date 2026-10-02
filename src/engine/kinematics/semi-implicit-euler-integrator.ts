import { Vector2 } from "../math/vector2.ts";
import type { BodyState } from "../world/body-state.ts";
import type { KinematicIntegrator } from "./kinematic-integrator.ts";

/**
 * Advances kinematic body state using the Semi-Implicit Euler integration
 * method.
 *
 * Semi-Implicit Euler first updates linear velocity from acceleration and then
 * uses that updated velocity to advance position:
 *
 * - `nextVelocity = velocity + acceleration * dt`
 * - `nextPosition = position + nextVelocity * dt`
 * - `nextOrientation = orientation + angularVelocity * dt`
 * - `nextAngularVelocity = angularVelocity`
 *
 * This ordering distinguishes Semi-Implicit Euler from Explicit Euler for
 * accelerated linear motion. Rotational motion currently has no angular
 * acceleration, so both methods advance orientation from the same constant
 * angular velocity.
 *
 * Semi-Implicit Euler is also commonly known as Symplectic Euler.
 */
export class SemiImplicitEulerIntegrator implements KinematicIntegrator {
  /**
   * Advances body state by one timestep.
   *
   * Neither the supplied state nor the acceleration vector is modified.
   * A new {@link BodyState} value is returned.
   *
   * @param state The body state at the beginning of the timestep.
   * @param acceleration The constant linear acceleration applied during the
   * timestep, expressed in world units per second squared.
   * @param dt The timestep duration in seconds.
   * @returns The approximated body state at the end of the timestep.
   */
  public integrate(state: BodyState, acceleration: Vector2, dt: number): BodyState {
    const nextVelocity = state.velocity.add(acceleration.scale(dt));
    const nextPosition = state.position.add(nextVelocity.scale(dt));
    const nextOrientation = state.orientation + state.angularVelocity * dt;

    return {
      position: nextPosition,
      velocity: nextVelocity,
      orientation: nextOrientation,
      angularVelocity: state.angularVelocity,
    };
  }
}
