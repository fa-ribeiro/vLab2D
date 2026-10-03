import type { BodyShape } from "../geometry/body-shape.ts";
import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import { detectCircleCircleCollision } from "./circle-circle-collision.ts";
import { detectCirclePolygonCollision } from "./circle-polygon-collision.ts";
import type { Collision } from "./collision.ts";
import { detectPolygonPolygonCollision } from "./polygon-polygon-collision.ts";

/**
 * Detects narrow-phase collision between any two currently supported physical
 * Body shapes.
 *
 * This function is intentionally a dispatcher rather than a collision
 * algorithm itself. Its job is:
 *
 * 1. Identify the concrete shape pair.
 * 2. Route to the appropriate narrow-phase algorithm.
 * 3. Preserve the ordered A/B {@link Collision} contract.
 *
 * Circle-Circle and Polygon-Polygon naturally accept A/B in either order.
 * Circle-Polygon has one canonical implementation with Circle as A and Polygon
 * as B. When the public arguments arrive as Polygon/Circle, this dispatcher
 * calls the canonical algorithm with reversed arguments and then reverses only
 * the returned normal so the final result still means "move public B out of
 * public A".
 *
 * Every combination in BodyShape is supported. Consequently, `undefined`
 * unambiguously means the supplied shapes are strictly separated.
 *
 * Touching geometry counts as collision with zero penetration depth. A Body
 * without geometry should be skipped by its caller rather than represented
 * here as an unsupported shape.
 */
export function detectCollision(
  shapeA: BodyShape,
  positionA: Vector2,
  orientationA: number,
  shapeB: BodyShape,
  positionB: Vector2,
  orientationB: number,
): Collision | undefined {
  // Step 1 — Dispatch combinations whose public A shape is a Circle.
  if (shapeA instanceof Circle) {
    if (shapeB instanceof Circle) {
      return detectCircleCircleCollision(shapeA, positionA, shapeB, positionB);
    }

    if (shapeB instanceof Rectangle || shapeB instanceof RegularPolygon) {
      return detectCirclePolygonCollision(shapeA, positionA, shapeB, positionB, orientationB);
    }

    return shapeB satisfies never;
  }

  // Step 2 — Dispatch combinations whose public A shape is polygonal.
  if (shapeA instanceof Rectangle || shapeA instanceof RegularPolygon) {
    if (shapeB instanceof Circle) {
      // The canonical Circle-Polygon algorithm receives the arguments in the
      // opposite order. Reorient its result back to the public A/B contract.
      return invertCollisionNormal(
        detectCirclePolygonCollision(shapeB, positionB, shapeA, positionA, orientationA),
      );
    }

    if (shapeB instanceof Rectangle || shapeB instanceof RegularPolygon) {
      return detectPolygonPolygonCollision(
        shapeA,
        positionA,
        orientationA,
        shapeB,
        positionB,
        orientationB,
      );
    }

    return shapeB satisfies never;
  }

  return shapeA satisfies never;
}

/**
 * Reverses only the directional part of an ordered Collision result.
 *
 * Penetration depth is independent of pair order, while the normal must reverse
 * when A and B swap roles.
 */
function invertCollisionNormal(collision: Collision | undefined): Collision | undefined {
  if (collision === undefined) {
    return undefined;
  }

  return {
    normal: collision.normal.scale(-1),
    penetrationDepth: collision.penetrationDepth,
  };
}
