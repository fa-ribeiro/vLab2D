import type { Collision } from "../collision/collision.ts";
import { assertFiniteNumber, assertNonNegativeNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";

/**
 * Positional corrections for an ordered colliding Body pair A/B.
 *
 * When response movement is possible, `bodyA` moves opposite the collision
 * normal and `bodyB` moves along it. A zero-inverse-mass Body receives no
 * translation. If both inverse masses are zero, neither Body moves.
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
 * The response pipeline is:
 *
 * 1. **Validate response masses** — inverse masses must be finite and
 *    non-negative.
 * 2. **Check mobility** — if both inverse masses are zero, neither Body can be
 *    translated by response.
 * 3. **Build the MTV** — `normal × penetrationDepth` is the full translation
 *    that would move B out of A according to the ordered Collision contract.
 * 4. **Split the MTV** — distribute that translation between A and B in
 *    proportion to their inverse masses.
 *
 * ```text
 * A correction = -normal × depth × inverseMassA / totalInverseMass
 * B correction = +normal × depth × inverseMassB / totalInverseMass
 * ```
 *
 * A zero-inverse-mass Body therefore receives no positional correction and the
 * other Body receives the full translation.
 *
 * This helper intentionally does not know whether zero inverse mass belongs to
 * a static Body or, in the future, a kinematic Body. Body type controls motion
 * behavior; inverse mass controls response weighting.
 *
 * This function performs no mutation. It only calculates world-space
 * translations; authoritative state ownership remains with World.
 *
 * @param collision Narrow-phase collision result for ordered pair A/B.
 * @param inverseMassA Non-negative finite inverse mass of Body A.
 * @param inverseMassB Non-negative finite inverse mass of Body B.
 * @returns World-space positional corrections for A and B.
 * @throws {RangeError} If either inverse mass is negative or not finite.
 */
export function computeCollisionPositionCorrections(
  collision: Collision,
  inverseMassA: number,
  inverseMassB: number,
): CollisionPositionCorrections {
  // Step 1 — Validate the numeric response weights before using them in a
  // denominator or applying them to the MTV.
  assertResponseInverseMass(inverseMassA, "Body A inverse mass");
  assertResponseInverseMass(inverseMassB, "Body B inverse mass");

  const totalInverseMass = inverseMassA + inverseMassB;

  // Step 2 — Two zero-inverse-mass Bodies are immovable by positional response.
  if (totalInverseMass === 0) {
    return {
      bodyA: new Vector2(0, 0),
      bodyB: new Vector2(0, 0),
    };
  }

  // Step 3 — Construct the full minimum translation vector. By contract this
  // vector points in the direction that moves B out of A.
  const minimumTranslation = collision.normal.scale(collision.penetrationDepth);

  // Step 4 — Split the MTV by inverse mass. A moves opposite the collision
  // normal; B moves along it. More inverse mass means a larger share of motion.
  return {
    bodyA: minimumTranslation.scale(-inverseMassA / totalInverseMass),
    bodyB: minimumTranslation.scale(inverseMassB / totalInverseMass),
  };
}

function assertResponseInverseMass(value: number, name: string): void {
  assertFiniteNumber(value, name);
  assertNonNegativeNumber(value, name);
}
