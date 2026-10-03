import type { BodyShape } from "../geometry/body-shape.ts";
import {
  assertFiniteNumber,
  assertNonNegativeNumber,
  assertPositiveNumber,
} from "../math/validation.ts";
import { BODY_DEFAULTS, type BodyConfig } from "./body-config.ts";
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
  /** Behavioral category controlling how Worlds advance this Body. */
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
   * relative normal closing speed.
   *
   * This placement is provisional: a future physical Material definition may
   * become the source of restitution.
   */
  public readonly restitution: number;

  /**
   * Coulomb friction coefficient controlling tangential collision response.
   *
   * `0` disables friction. Larger non-negative values permit stronger
   * tangential impulses.
   *
   * This placement is provisional: a future physical Material definition may
   * become the source of friction.
   */
  public readonly friction: number;

  /**
   * Creates a reusable body definition.
   *
   * Omitted optional values resolve through {@link BODY_DEFAULTS}. Inverse mass
   * is deliberately type-dependent: dynamic and static Bodies have different
   * semantic defaults.
   *
   * @param config Optional intrinsic Body configuration.
   * @throws {RangeError} If inverse mass contradicts the Body type or is not
   * finite, restitution is outside `[0, 1]`, or friction is negative/non-finite.
   */
  public constructor(config: BodyConfig = {}) {
    const bodyType = config.type ?? BODY_DEFAULTS.type;
    const inverseMass = config.inverseMass ?? BODY_DEFAULTS.inverseMass[bodyType];
    const restitution = config.restitution ?? BODY_DEFAULTS.restitution;
    const friction = config.friction ?? BODY_DEFAULTS.friction;

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

    assertFiniteNumber(friction, "Body friction");
    assertNonNegativeNumber(friction, "Body friction");

    this.type = bodyType;
    this.shape = config.shape;
    this.inverseMass = inverseMass;
    this.restitution = restitution;
    this.friction = friction;
  }
}
