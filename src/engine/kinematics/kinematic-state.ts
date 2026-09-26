import { Vector2 } from "../math/vector2.ts";

/**
 * Represents the kinematic state of a point in two-dimensional world space.
 *
 * A kinematic state contains only the information required to describe motion
 * at a particular instant: position and velocity. It deliberately contains no
 * mass, forces, acceleration, collision information, or integration behavior.
 *
 * Instances expose their state as read-only values through the TypeScript API.
 */
export class KinematicState {
  /** The current position in world space. */
  public readonly position: Vector2;

  /** The current velocity in world units per second. */
  public readonly velocity: Vector2;

  /**
   * Creates a kinematic state.
   *
   * @param position The current position in world space.
   * @param velocity The current velocity in world units per second.
   */
  public constructor(position: Vector2, velocity: Vector2) {
    this.position = position;
    this.velocity = velocity;
  }
}
