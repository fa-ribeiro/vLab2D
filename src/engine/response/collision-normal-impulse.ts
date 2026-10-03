import type { Collision } from "../collision/collision.ts";
import { assertFiniteNumber, assertNonNegativeNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";

/**
 * Normal impulse response for an ordered colliding Body pair A/B.
 *
 * `impulse` points along the collision normal. The impulse is applied in
 * opposite directions to the two Bodies, scaled by each Body's inverse mass,
 * producing the returned linear-velocity changes.
 */
export interface CollisionNormalImpulse {
  /** World-space impulse applied to Body B and opposite to Body A. */
  readonly impulse: Vector2;

  /** Linear-velocity change to apply to Body A. */
  readonly bodyAVelocityChange: Vector2;

  /** Linear-velocity change to apply to Body B. */
  readonly bodyBVelocityChange: Vector2;
}

/**
 * Computes a zero-restitution collision impulse along the collision normal.
 *
 * The response pipeline is:
 *
 * 1. **Validate response masses** — inverse masses must be finite and
 *    non-negative.
 * 2. **Check mobility** — two zero-inverse-mass Bodies cannot receive a useful
 *    impulse response.
 * 3. **Measure closing speed** — compute B's velocity relative to A and project
 *    it onto the ordered collision normal.
 * 4. **Separating-contact guard** — if relative normal velocity is non-negative,
 *    the pair is not closing and must receive no normal impulse.
 * 5. **Solve impulse magnitude** — choose the zero-restitution impulse that
 *    makes post-response relative normal velocity equal zero.
 * 6. **Convert impulse to velocity changes** — apply equal/opposite impulse,
 *    scaled by each Body's inverse mass.
 *
 * ```text
 * relativeVelocity       = velocityB - velocityA
 * relativeNormalVelocity = relativeVelocity · normal
 *
 * impulseMagnitude = -relativeNormalVelocity / (inverseMassA + inverseMassB)
 *
 * velocityChangeA = -impulse × inverseMassA
 * velocityChangeB = +impulse × inverseMassB
 * ```
 *
 * Tangential relative velocity is deliberately untouched. This first impulse
 * model changes linear velocity only. Restitution, friction, contact-point
 * angular effects, and iterative contact solving are later capabilities.
 *
 * @param collision Narrow-phase collision result for ordered pair A/B.
 * @param velocityA Current world-space linear velocity of Body A.
 * @param velocityB Current world-space linear velocity of Body B.
 * @param inverseMassA Non-negative finite inverse mass of Body A.
 * @param inverseMassB Non-negative finite inverse mass of Body B.
 * @returns The normal impulse and per-Body linear-velocity changes.
 * @throws {RangeError} If either inverse mass is negative or not finite.
 */
export function computeCollisionNormalImpulse(
  collision: Collision,
  velocityA: Vector2,
  velocityB: Vector2,
  inverseMassA: number,
  inverseMassB: number,
): CollisionNormalImpulse {
  // Step 1 — Validate response weights before they participate in the solve.
  assertResponseInverseMass(inverseMassA, "Body A inverse mass");
  assertResponseInverseMass(inverseMassB, "Body B inverse mass");

  const totalInverseMass = inverseMassA + inverseMassB;

  // Step 2 — If neither Body can change velocity, there is nothing to solve.
  if (totalInverseMass === 0) {
    return zeroImpulseResponse();
  }

  // Step 3 — Measure B's motion relative to A, then keep only the component
  // along the collision normal. Negative means the pair is closing.
  const relativeVelocity = velocityB.subtract(velocityA);
  const relativeNormalVelocity = relativeVelocity.dot(collision.normal);

  // Step 4 — Never impulse a pair that is already separating or moving only
  // tangentially. Doing so would add unwanted normal motion/energy.
  if (relativeNormalVelocity >= 0) {
    return zeroImpulseResponse();
  }

  // Step 5 — With restitution e = 0, solve the impulse that makes the
  // post-response relative normal velocity exactly zero.
  const impulseMagnitude = -relativeNormalVelocity / totalInverseMass;
  const impulse = collision.normal.scale(impulseMagnitude);

  // Step 6 — Equal/opposite impulse produces different velocity changes when
  // inverse masses differ. A zero-inverse-mass Body naturally receives none.
  return {
    impulse,
    bodyAVelocityChange: impulse.scale(-inverseMassA),
    bodyBVelocityChange: impulse.scale(inverseMassB),
  };
}

function assertResponseInverseMass(value: number, name: string): void {
  assertFiniteNumber(value, name);
  assertNonNegativeNumber(value, name);
}

function zeroImpulseResponse(): CollisionNormalImpulse {
  return {
    impulse: new Vector2(0, 0),
    bodyAVelocityChange: new Vector2(0, 0),
    bodyBVelocityChange: new Vector2(0, 0),
  };
}
