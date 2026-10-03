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
 * The relative velocity of B with respect to A is projected onto the ordered
 * collision normal:
 *
 * ```text
 * relativeVelocity       = velocityB - velocityA
 * relativeNormalVelocity = relativeVelocity · normal
 * ```
 *
 * A negative relative normal velocity means the Bodies are closing. With no
 * restitution yet, the impulse magnitude is chosen so the post-response
 * relative normal velocity becomes zero:
 *
 * ```text
 * impulseMagnitude = -relativeNormalVelocity / (inverseMassA + inverseMassB)
 * ```
 *
 * The resulting impulse changes velocity according to inverse mass:
 *
 * ```text
 * velocityChangeA = -impulse × inverseMassA
 * velocityChangeB = +impulse × inverseMassB
 * ```
 *
 * Tangential relative velocity is deliberately untouched. If the Bodies are
 * already separating or moving tangentially, no impulse is applied. If both
 * inverse masses are zero, the pair is immovable by impulse response and zero
 * changes are returned.
 *
 * This first impulse model changes linear velocity only. Restitution, friction,
 * contact-point angular effects, and iterative contact solving are later
 * response capabilities.
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
  assertResponseInverseMass(inverseMassA, "Body A inverse mass");
  assertResponseInverseMass(inverseMassB, "Body B inverse mass");

  const totalInverseMass = inverseMassA + inverseMassB;

  if (totalInverseMass === 0) {
    return zeroImpulseResponse();
  }

  const relativeVelocity = velocityB.subtract(velocityA);
  const relativeNormalVelocity = relativeVelocity.dot(collision.normal);

  // A non-negative value means the pair is separating or has no closing
  // velocity along the collision normal. Applying an impulse here would pull
  // separating Bodies back together or invent normal motion from tangential
  // motion.
  if (relativeNormalVelocity >= 0) {
    return zeroImpulseResponse();
  }

  const impulseMagnitude = -relativeNormalVelocity / totalInverseMass;
  const impulse = collision.normal.scale(impulseMagnitude);

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
