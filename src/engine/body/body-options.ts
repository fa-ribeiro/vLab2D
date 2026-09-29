import type { BodyShape } from "../geometry/body-shape.ts";

/**
 * Optional intrinsic geometry for the Body.
 *
 * A Body without geometry remains valid and can continue to act as a
 * particle-like entity.
 *
 * @throws {TypeError} If a supplied body uses Rectangle geometry, which this
 * renderer does not support yet.
 */
export interface BodyOptions {
  /**
   * Optional intrinsic geometry for the Body.
   *
   * Phase 2 currently supports only Circle geometry. A Body without geometry
   * remains valid and can continue to act as a particle-like entity.
   */
  readonly shape?: BodyShape;
}
