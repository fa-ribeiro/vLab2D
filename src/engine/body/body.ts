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
   * mass so positional and impulse response leave them fixed.
   */
  public readonly inverseMass: number;

  /**
   * Coefficient controlling how strongly normal collision velocity bounces.
   *
   * `0` is inelastic along the collision normal, while `1` fully reflects the
   * relative normal closing speed. World combines the two colliding Bodies'
   * values before solving their normal impulse.
   */
  public readonly restitution: number;

  /**
   * Creates a reusable body definition.
   *
   * @param options Optional intrinsic Body configuration.
   * @throws {RangeError} If the configured inverse mass contradicts the Body
   * type or is not finite, or if restitution is outside the finite range
   * `[0, 1]`.
   */
  public constructor(options: BodyOptions = {}) {
    const bodyType = options.type ?? "dynamic";
    const inverseMass = options.inverseMass ?? (bodyType === "static" ? 0 : 1);
    const restitution = options.restitution ?? 0;

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

    assertFiniteNumber(restitution, "Body restitution");

    if (restitution < 0 || restitution > 1) {
      throw new RangeError("Body restitution must be between 0 and 1.");
    }

    this.type = bodyType;
    this.shape = options.shape;
    this.inverseMass = inverseMass;
    this.restitution = restitution;
  }
}
