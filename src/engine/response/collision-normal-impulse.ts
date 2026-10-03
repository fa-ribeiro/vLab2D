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
 * Computes a restitution-aware collision impulse along the collision normal.
 *
 * The response pipeline is:
 *
 * 1. **Validate response inputs** — inverse masses must be finite and
 *    non-negative; restitution must be finite and in `[0, 1]`.
 * 2. **Check mobility** — two zero-inverse-mass Bodies cannot receive a useful
 *    impulse response.
 * 3. **Measure closing speed** — compute B's velocity relative to A and project
 *    it onto the ordered collision normal.
 * 4. **Separating-contact guard** — if relative normal velocity is non-negative,
 *    the pair is not closing and must receive no normal impulse.
 * 5. **Solve impulse magnitude** — choose the impulse that makes the
 *    post-response relative normal velocity equal the restitution-scaled
 *    reflection of the incoming normal velocity.
 * 6. **Convert impulse to velocity changes** — apply equal/opposite impulse,
 *    scaled by each Body's inverse mass.
 *
 * ```text
 * relativeVelocity       = velocityB - velocityA
 * relativeNormalVelocity = relativeVelocity · normal
 *
 * targetNormalVelocity = -restitution × relativeNormalVelocity
 *
 * impulseMagnitude =
 *   -(1 + restitution) × relativeNormalVelocity
 *   / (inverseMassA + inverseMassB)
 *
 * velocityChangeA = -impulse × inverseMassA
 * velocityChangeB = +impulse × inverseMassB
 * ```
 *
 * With restitution `0`, the post-response relative normal velocity becomes
 * zero, reproducing the previous inelastic response. With restitution `1`,
 * the relative normal closing speed is fully reflected. Tangential relative
 * velocity remains deliberately untouched.
 *
 * This impulse model still changes linear velocity only. Friction,
 * contact-point angular effects, restitution thresholds, and iterative contact
 * solving remain later capabilities.
 *
 * @param collision Narrow-phase collision result for ordered pair A/B.
 * @param velocityA Current world-space linear velocity of Body A.
 * @param velocityB Current world-space linear velocity of Body B.
 * @param inverseMassA Non-negative finite inverse mass of Body A.
 * @param inverseMassB Non-negative finite inverse mass of Body B.
 * @param restitution Effective restitution coefficient for the colliding pair.
 * Defaults to `0` to preserve inelastic response.
 * @returns The normal impulse and per-Body linear-velocity changes.
 * @throws {RangeError} If either inverse mass is negative or not finite, or if
 * restitution is outside the finite range `[0, 1]`.
 */
export function computeCollisionNormalImpulse(
  collision: Collision,
  velocityA: Vector2,
  velocityB: Vector2,
  inverseMassA: number,
  inverseMassB: number,
  restitution = 0,
): CollisionNormalImpulse {
  // Step 1 — Validate every scalar that participates in the impulse solve.
  assertResponseInverseMass(inverseMassA, "Body A inverse mass");
  assertResponseInverseMass(inverseMassB, "Body B inverse mass");
  assertRestitution(restitution);

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

  // Step 5 — Restitution sets the desired outgoing normal speed. Solving for
  // impulse magnitude gives j = -(1 + e) * vn / (wA + wB).
  const impulseMagnitude = (-(1 + restitution) * relativeNormalVelocity) / totalInverseMass;
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

function assertRestitution(value: number): void {
  assertFiniteNumber(value, "Restitution");

  if (value < 0 || value > 1) {
    throw new RangeError("Restitution must be between 0 and 1.");
  }
}

function zeroImpulseResponse(): CollisionNormalImpulse {
  return {
    impulse: new Vector2(0, 0),
    bodyAVelocityChange: new Vector2(0, 0),
    bodyBVelocityChange: new Vector2(0, 0),
  };
}
