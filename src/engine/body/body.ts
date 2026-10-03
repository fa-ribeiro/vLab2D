import type { BodyShape } from "../geometry/body-shape.ts";
import { assertFiniteNumber, assertPositiveNumber } from "../math/validation.ts";
import type { BodyOptions } from "./body-options.ts";
import type { BodyType } from "./body-type.ts";

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
   * Behavioral category controlling how Worlds advance this Body.
   */
  public readonly type: BodyType;

  /**
   * Optional intrinsic geometry attached to this reusable definition.
   *
   * The reference is retained directly because supported Body geometry is
   * immutable and reusable.
   */
  public readonly shape: BodyShape | undefined;

  /**
   * Reciprocal of this Body's mass for response calculations.
   *
   * Dynamic Bodies have positive inverse mass. Static Bodies have zero inverse
   * mass so positional response and future impulse response leave them fixed.
   */
  public readonly inverseMass: number;

  /**
   * Creates a reusable body definition.
   *
   * @param options Optional intrinsic Body configuration.
   * @throws {RangeError} If the configured inverse mass contradicts the Body
   * type or is not finite.
   */
  public constructor(options: BodyOptions = {}) {
    const bodyType = options.type ?? "dynamic";
    const inverseMass = options.inverseMass ?? (bodyType === "static" ? 0 : 1);

    assertFiniteNumber(inverseMass, "Body inverse mass");

    switch (bodyType) {
      case "dynamic":
        assertPositiveNumber(inverseMass, "Dynamic Body inverse mass");
        break;

      case "static":
        if (inverseMass !== 0) {
          throw new RangeError("Static Body inverse mass must be zero.");
        }
        break;

      default:
        bodyType satisfies never;
        throw new RangeError(`Unsupported Body type: ${String(bodyType)}.`);
    }

    this.type = bodyType;
    this.shape = options.shape;
    this.inverseMass = inverseMass;
  }
}
