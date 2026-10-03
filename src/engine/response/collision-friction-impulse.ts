import type { Collision } from "../collision/collision.ts";
import { assertFiniteNumber, assertNonNegativeNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";

/**
 * Tangential friction impulse response for an ordered colliding Body pair A/B.
 */
export interface CollisionFrictionImpulse {
  /** World-space friction impulse applied to Body B and opposite to Body A. */
  readonly impulse: Vector2;

  /** Linear-velocity change to apply to Body A. */
  readonly bodyAVelocityChange: Vector2;

  /** Linear-velocity change to apply to Body B. */
  readonly bodyBVelocityChange: Vector2;
}

/**
 * Computes a Coulomb friction impulse tangent to a collision normal.
 *
 * The response pipeline is:
 *
 * 1. **Validate response inputs** — inverse masses and friction must be finite
 *    and non-negative.
 * 2. **Check mobility/contact load** — friction cannot change two immovable
 *    Bodies and cannot exceed a zero normal impulse.
 * 3. **Extract tangential relative velocity** — remove the component of B's
 *    velocity relative to A that lies along the collision normal.
 * 4. **Solve the unconstrained tangent impulse** — calculate the impulse that
 *    would cancel that tangential relative velocity completely.
 * 5. **Apply the Coulomb limit** — clamp the tangent impulse magnitude to
 *    `friction × normalImpulseMagnitude`.
 * 6. **Convert impulse to velocity changes** — apply equal/opposite friction
 *    impulse scaled by each Body's inverse mass.
 *
 * ```text
 * relativeVelocity = velocityB - velocityA
 *
 * normalVelocity =
 *   normal × (relativeVelocity · normal)
 *
 * tangentVelocity =
 *   relativeVelocity - normalVelocity
 *
 * desiredFrictionImpulse =
 *   -tangentVelocity / (inverseMassA + inverseMassB)
 *
 * |frictionImpulse| <= friction × |normalImpulse|
 * ```
 *
 * This is linear-only friction. Without contact points and rotational inertia,
 * the friction impulse cannot yet create or change angular velocity.
 *
 * @param collision Narrow-phase collision result for ordered pair A/B.
 * @param velocityA Current world-space linear velocity of Body A.
 * @param velocityB Current world-space linear velocity of Body B.
 * @param inverseMassA Non-negative finite inverse mass of Body A.
 * @param inverseMassB Non-negative finite inverse mass of Body B.
 * @param normalImpulse Normal impulse already solved for the same collision.
 * @param friction Effective non-negative friction coefficient for the pair.
 * @returns Tangential friction impulse and per-Body velocity changes.
 */
export function computeCollisionFrictionImpulse(
  collision: Collision,
  velocityA: Vector2,
  velocityB: Vector2,
  inverseMassA: number,
  inverseMassB: number,
  normalImpulse: Vector2,
  friction: number,
): CollisionFrictionImpulse {
  // Step 1 — Validate scalar response inputs.
  assertResponseInverseMass(inverseMassA, "Body A inverse mass");
  assertResponseInverseMass(inverseMassB, "Body B inverse mass");
  assertFriction(friction);

  const totalInverseMass = inverseMassA + inverseMassB;
  const normalImpulseMagnitude = Math.max(0, normalImpulse.dot(collision.normal));
  const maximumFrictionImpulseMagnitude = friction * normalImpulseMagnitude;

  // Step 2 — No movable mass, no friction coefficient, or no normal contact
  // impulse means there is no tangential impulse to solve.
  if (totalInverseMass === 0 || maximumFrictionImpulseMagnitude === 0) {
    return zeroFrictionResponse();
  }

  // Step 3 — Remove the normal component from relative velocity. What remains
  // is the motion trying to slide the two surfaces across one another.
  const relativeVelocity = velocityB.subtract(velocityA);
  const relativeNormalVelocity = collision.normal.scale(relativeVelocity.dot(collision.normal));
  const relativeTangentVelocity = relativeVelocity.subtract(relativeNormalVelocity);

  const tangentSpeedSquared = relativeTangentVelocity.dot(relativeTangentVelocity);

  if (tangentSpeedSquared === 0) {
    return zeroFrictionResponse();
  }

  // Step 4 — This impulse would cancel all tangential relative velocity if
  // friction were unlimited.
  const desiredImpulse = relativeTangentVelocity.scale(-1 / totalInverseMass);
  const desiredImpulseMagnitude = Math.sqrt(desiredImpulse.dot(desiredImpulse));

  // Step 5 — Coulomb friction limits tangent impulse strength according to the
  // normal impulse. Below the limit the contact can cancel sliding completely;
  // above it the contact keeps sliding with the strongest allowed friction.
  const frictionImpulse = desiredImpulseMagnitude <= maximumFrictionImpulseMagnitude
    ? desiredImpulse
    : desiredImpulse.scale(maximumFrictionImpulseMagnitude / desiredImpulseMagnitude);

  // Step 6 — Apply equal/opposite impulse, weighted by inverse mass.
  return {
    impulse: frictionImpulse,
    bodyAVelocityChange: frictionImpulse.scale(-inverseMassA),
    bodyBVelocityChange: frictionImpulse.scale(inverseMassB),
  };
}

function assertResponseInverseMass(value: number, name: string): void {
  assertFiniteNumber(value, name);
  assertNonNegativeNumber(value, name);
}

function assertFriction(value: number): void {
  assertFiniteNumber(value, "Friction");
  assertNonNegativeNumber(value, "Friction");
}

function zeroFrictionResponse(): CollisionFrictionImpulse {
  return {
    impulse: new Vector2(0, 0),
    bodyAVelocityChange: new Vector2(0, 0),
    bodyBVelocityChange: new Vector2(0, 0),
  };
}
