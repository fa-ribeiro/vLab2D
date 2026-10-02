import type { Vector2 } from "../math/vector2.ts";

/**
 * Describes minimum-separation information produced by narrow-phase collision
 * detection for an ordered shape pair A/B.
 *
 * `normal` is a unit vector in the direction of the minimum translation that
 * would move shape B out of overlap with shape A. `penetrationDepth` is the
 * non-negative length of that translation in simulation/world units.
 *
 * For ordinary external overlaps this direction usually also reads visually as
 * A toward B. Containment and coincident/degenerate configurations may not have
 * a unique meaningful center-to-center A-to-B direction, so the
 * minimum-separation definition is the authoritative contract.
 *
 * A depth of `0` represents touching geometry.
 */
export interface Collision {
  /**
   * Unit direction of the minimum translation that separates shape B from
   * shape A.
   */
  readonly normal: Vector2;

  /**
   * Minimum distance, in simulation/world units, needed to move shape B out of
   * overlap with shape A along {@link Collision.normal}.
   *
   * A value of `0` means the shapes are touching without penetration.
   */
  readonly penetrationDepth: number;
}
