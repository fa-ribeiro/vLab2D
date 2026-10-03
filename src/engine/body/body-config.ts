import type { BodyShape } from "../geometry/body-shape.ts";
import type { BodyType } from "./body-type.ts";

/**
 * Canonical fallback values used when optional Body configuration is omitted.
 *
 * The object is frozen so these values are constants, not mutable process-wide
 * settings. Alternative reusable configurations should be expressed as named
 * presets rather than by mutating these defaults.
 */
export const BODY_DEFAULTS: Readonly<{
  readonly type: BodyType;
  readonly inverseMass: Readonly<Record<BodyType, number>>;
  readonly restitution: number;
  readonly friction: number;
}> = Object.freeze({
  type: "dynamic",
  inverseMass: Object.freeze(
    {
      dynamic: 1,
      static: 0,
    } satisfies Record<BodyType, number>,
  ),
  restitution: 0,
  friction: 0,
});

/**
 * Configures the intrinsic properties of a reusable Body definition.
 *
 * Every property is optional because Body has meaningful domain defaults.
 * Runtime state such as position and velocity remains separate and belongs to
 * the World instance that owns the Body at runtime.
 */
export interface BodyConfig {
  /**
   * Behavioral category of the Body.
   *
   * Defaults to `BODY_DEFAULTS.type`.
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
   * The default depends on Body type and is read from
   * `BODY_DEFAULTS.inverseMass[type]`.
   */
  readonly inverseMass?: number;

  /**
   * Coefficient of restitution used by normal collision impulse response.
   *
   * `0` means no bounce and `1` means the relative closing speed along the
   * collision normal is fully reflected. Values between them produce partial
   * bounce. Defaults to `BODY_DEFAULTS.restitution`.
   *
   * This is temporarily stored directly on Body. A future physical Material
   * concept may become the source of restitution instead.
   */
  readonly restitution?: number;

  /**
   * Coulomb friction coefficient used by tangential collision response.
   *
   * Friction must be finite and non-negative. `0` disables friction; larger
   * values allow a stronger tangential impulse. Defaults to
   * `BODY_DEFAULTS.friction`.
   *
   * Like restitution, this is intentionally a temporary Body-level property
   * until a concrete Material model is introduced.
   */
  readonly friction?: number;
}
