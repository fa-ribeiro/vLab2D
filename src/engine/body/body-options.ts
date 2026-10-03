import type { BodyShape } from "../geometry/body-shape.ts";

/**
 * Configures the intrinsic properties of a reusable Body definition.
 */
export interface BodyOptions {
  /**
   * Optional intrinsic geometry for the Body.
   *
   * A Body without geometry remains valid and can continue to act as a
   * particle-like entity.
   */
  readonly shape?: BodyShape;

  /**
   * Reciprocal of the Body's mass used by dynamic response calculations.
   *
   * The current engine supports dynamic Bodies only, so inverse mass must be a
   * positive finite number. It defaults to `1`, corresponding to unit mass.
   *
   * A future static-body pass will deliberately extend the contract so
   * `inverseMass === 0` represents an immovable Body.
   */
  readonly inverseMass?: number;
}
