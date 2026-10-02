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
 * Every combination in BodyShape is supported. Consequently, `undefined`
 * unambiguously means the supplied shapes are strictly separated.
 *
 * The returned collision normal always points from shape A toward shape B.
 * Touching geometry counts as collision with zero penetration depth.
 *
 * This function accepts physical BodyShape values only. A Body without
 * geometry has nothing to collide and should be skipped by its caller rather
 * than represented here as an unsupported shape.
 */
export function detectCollision(
  shapeA: BodyShape,
  positionA: Vector2,
  orientationA: number,
  shapeB: BodyShape,
  positionB: Vector2,
  orientationB: number,
): Collision | undefined {
  if (shapeA instanceof Circle) {
    if (shapeB instanceof Circle) {
      return detectCircleCircleCollision(shapeA, positionA, shapeB, positionB);
    }

    if (shapeB instanceof Rectangle || shapeB instanceof RegularPolygon) {
      return detectCirclePolygonCollision(shapeA, positionA, shapeB, positionB, orientationB);
    }

    return shapeB satisfies never;
  }

  if (shapeA instanceof Rectangle || shapeA instanceof RegularPolygon) {
    if (shapeB instanceof Circle) {
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

function invertCollisionNormal(collision: Collision | undefined): Collision | undefined {
  if (collision === undefined) {
    return undefined;
  }

  return {
    normal: collision.normal.scale(-1),
    penetrationDepth: collision.penetrationDepth,
  };
}
