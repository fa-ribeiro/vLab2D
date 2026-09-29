import type { BodyShape } from "../geometry/body-shape.ts";

/**
 * Configures the intrinsic properties of a reusable Body definition.
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
