import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import type { Collision } from "./collision.ts";
import { getLocalVertices, transformVerticesToWorld } from "./polygon-geometry.ts";

interface Projection {
  readonly min: number;
  readonly max: number;
}

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

  const centerDelta = positionB.subtract(positionA);

  let minimumPenetrationDepth = Number.POSITIVE_INFINITY;
  let collisionNormal: Vector2 | undefined;

  for (const axisSource of [verticesA, verticesB]) {
    for (let index = 0; index < axisSource.length; index += 1) {
      const current = axisSource[index];
      const next = axisSource[(index + 1) % axisSource.length];

      let axis = unitNormalForEdge(current, next);

      // An axis has no inherent direction. When the body centers establish one,
      // orient it toward B so the final Collision contract remains A -> B.
      if (centerDelta.dot(axis) < 0) {
        axis = axis.scale(-1);
      }

      const projectionA = projectVertices(verticesA, axis);
      const projectionB = projectVertices(verticesB, axis);

      if (projectionA.max < projectionB.min || projectionB.max < projectionA.min) {
        return undefined;
      }

      let penetrationDepth = projectionA.max - projectionB.min;

      if (centerDelta.dot(axis) === 0) {
        const oppositeDepth = projectionB.max - projectionA.min;

        // The centers cannot choose a direction along this axis. Use the
        // shorter escape direction; a tie keeps the generated axis so the
        // result stays deterministic.
        if (oppositeDepth < penetrationDepth) {
          axis = axis.scale(-1);
          penetrationDepth = oppositeDepth;
        }
      }

      if (penetrationDepth < minimumPenetrationDepth) {
        minimumPenetrationDepth = penetrationDepth;
        collisionNormal = axis;
      }
    }
  }

  // Rectangle and RegularPolygon always provide valid edges, so SAT must test
  // at least one candidate axis before reaching this point.
  if (collisionNormal === undefined) {
    throw new Error("Polygon collision detection produced no candidate axis.");
  }

  return {
    normal: collisionNormal,
    penetrationDepth: minimumPenetrationDepth,
  };
}

function unitNormalForEdge(start: Vector2, end: Vector2): Vector2 {
  const edgeX = end.x - start.x;
  const edgeY = end.y - start.y;
  const length = Math.hypot(edgeX, edgeY);

  return new Vector2(-edgeY / length, edgeX / length);
}

function projectVertices(vertices: readonly Vector2[], axis: Vector2): Projection {
  let min = vertices[0].dot(axis);
  let max = min;

  for (let index = 1; index < vertices.length; index += 1) {
    const projection = vertices[index].dot(axis);

    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}
