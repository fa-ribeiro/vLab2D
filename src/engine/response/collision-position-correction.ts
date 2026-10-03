import type { Collision } from "../collision/collision.ts";
import { assertFiniteNumber, assertPositiveNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";

/**
 * Positional corrections for an ordered colliding Body pair A/B.
 *
 * `bodyA` moves opposite the collision normal and `bodyB` moves along it. The
 * two vectors together remove the collision penetration when applied to the
 * pair's positions.
 */
export interface CollisionPositionCorrections {
  /** World-space translation to apply to Body A. */
  readonly bodyA: Vector2;

  /** World-space translation to apply to Body B. */
  readonly bodyB: Vector2;
}

/**
 * Computes inverse-mass-weighted positional separation for a collision.
 *
 * The current response model supports dynamic Bodies only, so both inverse
 * masses must be positive and finite. The collision's minimum translation is
 * split proportionally to inverse mass:
 *
 * ```text
 * A correction = -normal × depth × inverseMassA / totalInverseMass
 * B correction = +normal × depth × inverseMassB / totalInverseMass
 * ```
 *
 * Equal inverse masses therefore split the correction equally. A Body with a
 * larger inverse mass receives a larger share because it represents less mass
 * and is easier to move.
 *
 * This function performs no mutation. It only calculates world-space
 * translations; authoritative state ownership remains with World.
 *
 * @param collision Narrow-phase collision result for ordered pair A/B.
 * @param inverseMassA Positive finite inverse mass of Body A.
 * @param inverseMassB Positive finite inverse mass of Body B.
 * @returns World-space positional corrections for A and B.
 * @throws {RangeError} If either inverse mass is not positive and finite.
 */
export function computeCollisionPositionCorrections(
  collision: Collision,
  inverseMassA: number,
  inverseMassB: number,
): CollisionPositionCorrections {
  assertDynamicInverseMass(inverseMassA, "Body A inverse mass");
  assertDynamicInverseMass(inverseMassB, "Body B inverse mass");

  const totalInverseMass = inverseMassA + inverseMassB;
  const minimumTranslation = collision.normal.scale(collision.penetrationDepth);

  return {
    bodyA: minimumTranslation.scale(-inverseMassA / totalInverseMass),
    bodyB: minimumTranslation.scale(inverseMassB / totalInverseMass),
  };
}

function assertDynamicInverseMass(value: number, name: string): void {
  assertFiniteNumber(value, name);
  assertPositiveNumber(value, name);
}
