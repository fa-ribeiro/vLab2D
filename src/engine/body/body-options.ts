import type { BodyShape } from "../geometry/body-shape.ts";
import type { BodyType } from "./body-type.ts";

/**
 * Configures the intrinsic properties of a reusable Body definition.
 */
export interface BodyOptions {
  /**
   * Behavioral category of the Body.
   *
   * Dynamic Bodies are physically integrated by a World. Static Bodies remain
   * fixed and act as immovable collision geometry. Defaults to `"dynamic"`.
   */
  readonly type?: BodyType;

  /**
   * Optional intrinsic geometry for the Body.
   *
   * A Body without geometry remains valid and can continue to act as a
   * particle-like entity.
   */
  readonly shape?: BodyShape;

  /**
   * Reciprocal of the Body's mass used by response calculations.
   *
   * Dynamic Bodies require a positive finite inverse mass and default to `1`,
   * corresponding to unit mass. Static Bodies require zero inverse mass and
   * default to `0`.
   *
   * Inverse mass expresses how strongly response calculations may move a Body;
   * {@link BodyType} expresses its broader motion behavior. Keeping those
   * concepts distinct leaves room for future kinematic Bodies, which may move
   * while also having zero inverse mass.
   */
  readonly inverseMass?: number;

  /**
   * Coefficient of restitution used by normal collision impulse response.
   *
   * `0` means no bounce and `1` means the relative closing speed along the
   * collision normal is fully reflected. Values between them produce partial
   * bounce. Defaults to `0`.
   *
   * This is temporarily stored directly on Body. The roadmap anticipates a
   * future physical Material concept, at which point restitution may migrate to
   * that richer definition without changing the response mathematics.
   */
  readonly restitution?: number;

  /**
   * Coulomb friction coefficient used by tangential collision response.
   *
   * Friction must be finite and non-negative. `0` disables friction; larger
   * values allow a stronger tangential impulse. Defaults to `0`, preserving the
   * frictionless behavior of existing Body definitions.
   *
   * Like restitution, this is intentionally a temporary Body-level property
   * until a concrete Material model is introduced.
   */
  readonly friction?: number;
}
