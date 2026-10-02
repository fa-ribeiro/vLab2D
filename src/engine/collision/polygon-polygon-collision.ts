import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import type { Collision } from "./collision.ts";
import { getLocalVertices, transformVerticesToWorld } from "./polygon-geometry.ts";
import { getAxisCollision, getPolygonAxes, projectVertices } from "./sat.ts";

/**
 * Detects narrow-phase collision between two convex polygonal shapes using the
 * Separating Axis Theorem (SAT).
 *
 * Rectangle and RegularPolygon are both convex, so their world-space vertices
 * can be projected onto each edge normal from both shapes. A single axis with
 * disjoint projections proves separation. If every tested axis overlaps, the
 * axis requiring the least separation supplies the collision normal and
 * penetration depth.
 *
 * Touching polygons count as a collision with zero penetration depth.
 *
 * @param shapeA Convex polygonal geometry for shape A.
 * @param positionA World position of shape A's local origin.
 * @param orientationA World orientation of shape A in radians.
 * @param shapeB Convex polygonal geometry for shape B.
 * @param positionB World position of shape B's local origin.
 * @param orientationB World orientation of shape B in radians.
 * @returns Collision separation information, or `undefined` when a separating
 * axis exists.
 */
export function detectPolygonPolygonCollision(
  shapeA: Rectangle | RegularPolygon,
  positionA: Vector2,
  orientationA: number,
  shapeB: Rectangle | RegularPolygon,
  positionB: Vector2,
  orientationB: number,
): Collision | undefined {
  const verticesA = transformVerticesToWorld(getLocalVertices(shapeA), positionA, orientationA);
  const verticesB = transformVerticesToWorld(getLocalVertices(shapeB), positionB, orientationB);

  let minimumCollision: Collision | undefined;

  for (const axis of [...getPolygonAxes(verticesA), ...getPolygonAxes(verticesB)]) {
    const axisCollision = getAxisCollision(
      projectVertices(verticesA, axis),
      projectVertices(verticesB, axis),
      axis,
    );

    if (axisCollision === undefined) {
      return undefined;
    }

    if (
      minimumCollision === undefined ||
      axisCollision.penetrationDepth < minimumCollision.penetrationDepth
    ) {
      minimumCollision = axisCollision;
    }
  }

  // Rectangle and RegularPolygon always provide valid edges, so SAT must test
  // at least one candidate axis before reaching this point.
  if (minimumCollision === undefined) {
    throw new Error("Polygon collision detection produced no candidate axis.");
  }

  return minimumCollision;
}
