import { assertFiniteNumber, assertPositiveNumber } from "../math/validation.ts";

/**
 * Defines immutable circular geometry in simulation/world units.
 *
 * Circle is intrinsic reusable geometry. It does not own world position,
 * orientation, velocity, or any other runtime state.
 */
export class Circle {
  /** The circle radius in simulation/world units. */
  public readonly radius: number;

  /**
   * Creates circular geometry.
   *
   * @param radius The positive finite radius in simulation/world units.
   * @throws {RangeError} If the radius is not positive and finite.
   */
  public constructor(radius: number) {
    assertFiniteNumber(radius, "Circle radius");
    assertPositiveNumber(radius, "Circle radius");

    this.radius = radius;
  }
}
