import type { Vector2 } from "../math/vector2.ts";

/**
 * Describes the runtime motion state of a body instance owned by a world.
 *
 * Body state is runtime data rather than an intrinsic property of a reusable
 * body definition. A world creates and owns authoritative state when a body
 * definition is added with initial conditions.
 *
 * Public observations may expose detached `BodyState` values, but callers must
 * not treat an observed value as authoritative mutable world state.
 */
export interface BodyState {
  /** The body's current position in world space. */
  readonly position: Vector2;

  /** The body's current velocity in world units per second. */
  readonly velocity: Vector2;

  /**
   * The body's current orientation in radians.
   *
   * Zero aligns the body's local axes with the world axes. Positive values
   * rotate counter-clockwise in the mathematical world coordinate system.
   */
  readonly orientation: number;

  /**
   * The body's current angular velocity in radians per second.
   *
   * Positive values rotate counter-clockwise in the mathematical world
   * coordinate system; negative values rotate clockwise.
   */
  readonly angularVelocity: number;
}
