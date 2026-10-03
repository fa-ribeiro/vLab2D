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
 *    non-negative; restitution must be finite and in `[0, 1]`; the restitution
 *    threshold must be finite and non-negative.
 * 2. **Check mobility** — two zero-inverse-mass Bodies cannot receive a useful
 *    impulse response.
 * 3. **Measure closing speed** — compute B's velocity relative to A and project
 *    it onto the ordered collision normal.
 * 4. **Separating-contact guard** — if relative normal velocity is non-negative,
 *    the pair is not closing and must receive no normal impulse.
 * 5. **Choose effective restitution** — impacts whose closing speed is at or
 *    below the threshold are solved inelastically to suppress tiny bounces.
 * 6. **Solve impulse magnitude** — choose the impulse that produces the target
 *    post-response relative normal velocity.
 * 7. **Convert impulse to velocity changes** — apply equal/opposite impulse,
 *    scaled by each Body's inverse mass.
 *
 * ```text
 * relativeVelocity       = velocityB - velocityA
 * relativeNormalVelocity = relativeVelocity · normal
 * closingSpeed           = -relativeNormalVelocity
 *
 * effectiveRestitution =
 *   closingSpeed > restitutionThreshold
 *     ? restitution
 *     : 0
 *
 * impulseMagnitude =
 *   -(1 + effectiveRestitution) × relativeNormalVelocity
 *   / (inverseMassA + inverseMassB)
 *
 * velocityChangeA = -impulse × inverseMassA
 * velocityChangeB = +impulse × inverseMassB
 * ```
 *
 * The threshold changes bounce policy only. A low-speed closing contact still
 * receives the inelastic normal impulse required to remove closing motion.
 * Tangential relative velocity remains deliberately untouched by this helper.
 *
 * This impulse model still changes linear velocity only. Friction,
 * contact-point angular effects, and iterative contact solving remain separate
 * or later capabilities.
 *
 * @param collision Narrow-phase collision result for ordered pair A/B.
 * @param velocityA Current world-space linear velocity of Body A.
 * @param velocityB Current world-space linear velocity of Body B.
 * @param inverseMassA Non-negative finite inverse mass of Body A.
 * @param inverseMassB Non-negative finite inverse mass of Body B.
 * @param restitution Effective restitution coefficient for the colliding pair.
 * Defaults to `0` to preserve inelastic response.
 * @param restitutionThreshold Non-negative closing-speed threshold below which
 * restitution is suppressed. Defaults to `0`, preserving previous behavior.
 * @returns The normal impulse and per-Body linear-velocity changes.
 * @throws {RangeError} If either inverse mass is negative or not finite,
 * restitution is outside `[0, 1]`, or the threshold is negative/non-finite.
 */
export function computeCollisionNormalImpulse(
  collision: Collision,
  velocityA: Vector2,
  velocityB: Vector2,
  inverseMassA: number,
  inverseMassB: number,
  restitution = 0,
  restitutionThreshold = 0,
): CollisionNormalImpulse {
  // Step 1 — Validate every scalar that participates in the impulse solve.
  assertResponseInverseMass(inverseMassA, "Body A inverse mass");
  assertResponseInverseMass(inverseMassB, "Body B inverse mass");
  assertRestitution(restitution);
  assertRestitutionThreshold(restitutionThreshold);

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

  const closingSpeed = -relativeNormalVelocity;

  // Step 5 — Very small impacts are solved inelastically. The normal impulse
  // still removes closing motion; only the rebound component is suppressed.
  const effectiveRestitution = closingSpeed > restitutionThreshold ? restitution : 0;

  // Step 6 — Solve j = -(1 + e) * vn / (wA + wB), using the threshold-selected
  // effective restitution rather than blindly applying bounce to every impact.
  const impulseMagnitude = (-(1 + effectiveRestitution) * relativeNormalVelocity) /
    totalInverseMass;
  const impulse = collision.normal.scale(impulseMagnitude);

  // Step 7 — Equal/opposite impulse produces different velocity changes when
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

function assertRestitutionThreshold(value: number): void {
  assertFiniteNumber(value, "Restitution threshold");
  assertNonNegativeNumber(value, "Restitution threshold");
}

function zeroImpulseResponse(): CollisionNormalImpulse {
  return {
    impulse: new Vector2(0, 0),
    bodyAVelocityChange: new Vector2(0, 0),
    bodyBVelocityChange: new Vector2(0, 0),
  };
}
