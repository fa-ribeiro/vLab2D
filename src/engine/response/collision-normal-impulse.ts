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
 * Computes the normal impulse required to move a contact toward a requested
 * relative normal velocity.
 *
 * The target is deliberately supplied by the caller rather than derived from
 * restitution here. This keeps the impulse equation independent from material
 * mixing and World-level bounce policy, and—critically for iterative solving—
 * lets every solver pass work toward the same target captured at impact time.
 *
 * The response pipeline is:
 *
 * 1. **Validate response inputs** — inverse masses and the target normal
 *    velocity must be finite and non-negative.
 * 2. **Check mobility** — two zero-inverse-mass Bodies cannot receive a useful
 *    impulse response.
 * 3. **Measure current normal velocity** — compute B's velocity relative to A
 *    and project it onto the ordered collision normal.
 * 4. **Target guard** — if the current relative normal velocity is already at
 *    or above the requested target, no additional normal impulse is needed.
 * 5. **Solve impulse magnitude** — choose the impulse that would move this
 *    isolated pair exactly to the requested target normal velocity.
 * 6. **Convert impulse to velocity changes** — apply equal/opposite impulse,
 *    scaled by each Body's inverse mass.
 *
 * ```text
 * relativeVelocity       = velocityB - velocityA
 * currentNormalVelocity  = relativeVelocity · normal
 *
 * impulseMagnitude =
 *   (targetNormalVelocity - currentNormalVelocity)
 *   / (inverseMassA + inverseMassB)
 *
 * velocityChangeA = -impulse × inverseMassA
 * velocityChangeB = +impulse × inverseMassB
 * ```
 *
 * A target of zero gives the usual inelastic contact response: closing motion
 * is removed but no rebound is requested. A positive target requests
 * separation. In a coupled iterative solver, another contact may disturb a
 * previously solved pair, so later passes can apply another impulse toward the
 * same fixed target.
 *
 * Tangential relative velocity remains deliberately untouched by this helper.
 * Friction and contact-point angular effects are separate concerns.
 *
 * @param collision Narrow-phase collision result for ordered pair A/B.
 * @param velocityA Current world-space linear velocity of Body A.
 * @param velocityB Current world-space linear velocity of Body B.
 * @param inverseMassA Non-negative finite inverse mass of Body A.
 * @param inverseMassB Non-negative finite inverse mass of Body B.
 * @param targetNormalVelocity Non-negative desired relative normal velocity
 * after response. Defaults to `0` for inelastic contact.
 * @returns The normal impulse and per-Body linear-velocity changes.
 * @throws {RangeError} If either inverse mass or the target normal velocity is
 * negative or not finite.
 */
export function computeCollisionNormalImpulse(
  collision: Collision,
  velocityA: Vector2,
  velocityB: Vector2,
  inverseMassA: number,
  inverseMassB: number,
  targetNormalVelocity = 0,
): CollisionNormalImpulse {
  // Step 1 — Validate every scalar that participates in the impulse solve.
  assertResponseInverseMass(inverseMassA, "Body A inverse mass");
  assertResponseInverseMass(inverseMassB, "Body B inverse mass");
  assertTargetNormalVelocity(targetNormalVelocity);

  const totalInverseMass = inverseMassA + inverseMassB;

  // Step 2 — If neither Body can change velocity, there is nothing to solve.
  if (totalInverseMass === 0) {
    return zeroImpulseResponse();
  }

  // Step 3 — Measure B's motion relative to A, then keep only the component
  // along the collision normal.
  const relativeVelocity = velocityB.subtract(velocityA);
  const currentNormalVelocity = relativeVelocity.dot(collision.normal);

  // Step 4 — A positive restitution target may still require an impulse even
  // after the Bodies have started separating. Stop only when this contact has
  // reached (or exceeded) the fixed target requested by the caller.
  if (currentNormalVelocity >= targetNormalVelocity) {
    return zeroImpulseResponse();
  }

  // Step 5 — For this isolated pair, this impulse would move the current
  // relative normal velocity exactly to the requested target.
  const impulseMagnitude = (targetNormalVelocity - currentNormalVelocity) / totalInverseMass;
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

function assertTargetNormalVelocity(value: number): void {
  assertFiniteNumber(value, "Target normal velocity");
  assertNonNegativeNumber(value, "Target normal velocity");
}

function zeroImpulseResponse(): CollisionNormalImpulse {
  return {
    impulse: new Vector2(0, 0),
    bodyAVelocityChange: new Vector2(0, 0),
    bodyBVelocityChange: new Vector2(0, 0),
  };
}
