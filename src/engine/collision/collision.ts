import type { Vector2 } from "../math/vector2.ts";

/**
 * Describes the minimum separation information produced by narrow-phase
 * collision detection.
 *
 * The normal is a unit vector that points from shape A toward shape B.
 * `penetrationDepth` is measured in simulation/world units and is
 * non-negative. A depth of `0` represents touching geometry.
 */
export interface Collision {
  /** Unit normal pointing from shape A toward shape B. */
  readonly normal: Vector2;

  /**
   * Minimum distance, in simulation/world units, needed to separate the
   * overlapping shapes along the collision normal.
   *
   * A value of `0` means the shapes are touching without penetration.
   */
  readonly penetrationDepth: number;
}
