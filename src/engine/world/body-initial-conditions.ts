import type { Vector2 } from "../math/vector2.ts";

/**
 * Defines the initial runtime conditions used when a body enters a world.
 *
 * Omitted values use safe zero-valued defaults.
 */
export interface BodyInitialConditions {
  /** Initial world-space position. Defaults to `(0, 0)`. */
  readonly position?: Vector2;

  /** Initial velocity in world units per second. Defaults to `(0, 0)`. */
  readonly velocity?: Vector2;

  /**
   * Initial orientation in radians. Defaults to `0`.
   *
   * Zero aligns the body's local axes with the world axes. Positive values
   * rotate counter-clockwise in the mathematical world coordinate system.
   */
  readonly orientation?: number;

  /**
   * Initial angular velocity in radians per second. Defaults to `0`.
   *
   * Positive values rotate counter-clockwise in the mathematical world
   * coordinate system; negative values rotate clockwise.
   */
  readonly angularVelocity?: number;
}
