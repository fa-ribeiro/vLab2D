import { Vector2 } from "../math/vector2.ts";
import type { BodyState } from "../world/body-state.ts";
import type { KinematicIntegrator } from "./kinematic-integrator.ts";

/**
 * Advances kinematic body state using the Explicit Euler integration method.
 *
 * Explicit Euler estimates the next state entirely from values at the
 * beginning of the timestep:
 *
 * - `nextPosition = position + velocity * dt`
 * - `nextVelocity = velocity + acceleration * dt`
 * - `nextOrientation = orientation + angularVelocity * dt`
 * - `nextAngularVelocity = angularVelocity`
 *
 * Angular velocity is currently constant because angular acceleration has not
 * yet been introduced.
 *
 * This method is intentionally simple and provides a useful baseline for
 * comparison with other numerical integration methods.
 */
export class ExplicitEulerIntegrator implements KinematicIntegrator {
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
    const nextPosition = state.position.add(state.velocity.scale(dt));
    const nextVelocity = state.velocity.add(acceleration.scale(dt));
    const nextOrientation = state.orientation + state.angularVelocity * dt;

    return {
      position: nextPosition,
      velocity: nextVelocity,
      orientation: nextOrientation,
      angularVelocity: state.angularVelocity,
    };
  }
}
