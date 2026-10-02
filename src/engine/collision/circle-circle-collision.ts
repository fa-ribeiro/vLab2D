import { Circle } from "../geometry/circle.ts";
import { Vector2 } from "../math/vector2.ts";
import type { Collision } from "./collision.ts";

/**
 * Detects narrow-phase collision between two circles at supplied world
 * positions.
 *
 * Touching circles count as a collision with zero penetration depth. When the
 * circle centers differ, the returned normal is the unit vector from A toward
 * B.
 *
 * Exactly coincident centers have no geometrically defined A-to-B direction.
 * In that degenerate case this function deliberately returns world `+X` as a
 * deterministic fallback normal rather than introducing randomness.
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
  const deltaX = positionB.x - positionA.x;
  const deltaY = positionB.y - positionA.y;

  const distanceSquared = deltaX * deltaX + deltaY * deltaY;
  const combinedRadius = circleA.radius + circleB.radius;

  if (distanceSquared > combinedRadius * combinedRadius) {
    return undefined;
  }

  if (distanceSquared === 0) {
    return { normal: new Vector2(1, 0), penetrationDepth: combinedRadius };
  }

  const distance = Math.sqrt(distanceSquared);

  return {
    normal: new Vector2(deltaX / distance, deltaY / distance),
    penetrationDepth: combinedRadius - distance,
  };
}
