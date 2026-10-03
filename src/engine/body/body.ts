import type { BodyShape } from "../geometry/body-shape.ts";
import { assertFiniteNumber, assertPositiveNumber } from "../math/validation.ts";
import type { BodyOptions } from "./body-options.ts";

/**
 * Defines the intrinsic properties of a reusable simulated body.
 *
 * A body definition does not own world-specific position, velocity, or other
 * runtime state. Those values are established when the body is added to a
 * world and are subsequently owned by that world.
 *
 * Geometry is optional. A shapeless Body remains valid for capabilities that
 * require identity and motion state but no spatial extent.
 */
export class Body {
  /**
   * Optional intrinsic geometry attached to this reusable definition.
   *
   * The reference is retained directly because supported Body geometry is
   * immutable and reusable.
   */
  public readonly shape: BodyShape | undefined;

  /**
   * Reciprocal of this dynamic Body's mass.
   *
   * Larger inverse mass means the Body responds more strongly to positional
   * corrections and, later, impulses. The current dynamic-only model requires
   * a positive finite value. A future static-body model will use zero inverse
   * mass to represent an immovable Body.
   */
  public readonly inverseMass: number;

  /**
   * Creates a reusable body definition.
   *
   * @param options Optional intrinsic Body configuration.
   * @throws {RangeError} If `inverseMass` is not positive and finite.
   */
  public constructor(options: BodyOptions = {}) {
    const inverseMass = options.inverseMass ?? 1;

    assertFiniteNumber(inverseMass, "Body inverse mass");
    assertPositiveNumber(inverseMass, "Body inverse mass");

    this.shape = options.shape;
    this.inverseMass = inverseMass;
  }
}
