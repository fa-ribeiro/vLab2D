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
}
