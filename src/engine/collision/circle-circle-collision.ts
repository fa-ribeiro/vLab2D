import { Circle } from "../geometry/circle.ts";
import { Vector2 } from "../math/vector2.ts";
import type { Collision } from "./collision.ts";

/**
 * Detects narrow-phase collision between two circles at supplied world
 * positions.
 *
 * Circle-Circle collision can be solved directly from the two centers:
 *
 * 1. **Center displacement** — compute the vector from A to B.
 * 2. **Separation test** — compare squared center distance with squared combined
 *    radius, avoiding a square root for definitely separated circles.
 * 3. **Degenerate-center handling** — if both centers coincide, use a stable
 *    fallback normal because geometry provides no unique direction.
 * 4. **Normal/depth calculation** — normalize the center displacement and
 *    subtract actual distance from the combined radius.
 *
 * Touching circles count as a collision with zero penetration depth. When the
 * circle centers differ, the returned normal is the unit vector from A toward
 * B. Exactly coincident centers use world `+X` as a deterministic fallback.
 *
 * @param circleA Intrinsic Circle geometry for shape A.
 * @param positionA World position of Circle A's local origin.
 * @param circleB Intrinsic Circle geometry for shape B.
 * @param positionB World position of Circle B's local origin.
 * @returns Collision separation information, or `undefined` when the circles
 * are strictly separated.
 */
export function detectCircleCircleCollision(
  circleA: Circle,
  positionA: Vector2,
  circleB: Circle,
  positionB: Vector2,
): Collision | undefined {
  // Step 1 — Center displacement from A toward B.
  const deltaX = positionB.x - positionA.x;
  const deltaY = positionB.y - positionA.y;

  const distanceSquared = deltaX * deltaX + deltaY * deltaY;
  const combinedRadius = circleA.radius + circleB.radius;

  // Step 2 — Separation test. Squared values avoid an unnecessary square root
  // for the common non-colliding case.
  if (distanceSquared > combinedRadius * combinedRadius) {
    return undefined;
  }

  // Step 3 — Coincident centers have no geometrically meaningful A-to-B axis.
  // Use a deterministic fallback so the response remains stable/repeatable.
  if (distanceSquared === 0) {
    return { normal: new Vector2(1, 0), penetrationDepth: combinedRadius };
  }

  // Step 4 — The centers differ, so their normalized displacement is the
  // ordered A-to-B normal. Remaining overlap is the penetration depth.
  const distance = Math.sqrt(distanceSquared);

  return {
    normal: new Vector2(deltaX / distance, deltaY / distance),
    penetrationDepth: combinedRadius - distance,
  };
}
