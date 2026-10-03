import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import type { Collision } from "./collision.ts";
import { getLocalVertices, transformVerticesToWorld } from "./polygon-geometry.ts";
import { getAxisCollision, getPolygonAxes, projectCircle, projectVertices } from "./sat.ts";

/**
 * Detects narrow-phase collision between a circle and a convex polygon using
 * the Separating Axis Theorem (SAT).
 *
 * A Circle has no edges, so Circle-Polygon SAT needs one extra idea beyond the
 * Polygon-Polygon case. The algorithm is:
 *
 * 1. **World polygon geometry** — transform the polygon's local vertices.
 * 2. **Polygon axes** — collect the polygon edge normals.
 * 3. **Corner axis** — find the polygon vertex closest to the Circle center and,
 *    when possible, add the normalized center-to-vertex direction. This extra
 *    axis detects separation/penetration around polygon corners.
 * 4. **Projection/separation test** — project the Circle and polygon onto every
 *    candidate axis. Any disjoint pair of intervals proves separation.
 * 5. **Minimum-overlap selection** — among overlapping axes, retain the minimum
 *    translation that moves polygon B out of Circle A.
 *
 * Touching geometry counts as a collision with zero penetration depth.
 *
 * @param circle Intrinsic Circle geometry for shape A.
 * @param circlePosition World position of the Circle center.
 * @param polygon Convex polygonal geometry for shape B.
 * @param polygonPosition World position of the polygon's local origin.
 * @param polygonOrientation World orientation of the polygon in radians.
 * @returns Collision separation information, or `undefined` when a separating
 * axis exists.
 */
export function detectCirclePolygonCollision(
  circle: Circle,
  circlePosition: Vector2,
  polygon: Rectangle | RegularPolygon,
  polygonPosition: Vector2,
  polygonOrientation: number,
): Collision | undefined {
  // Step 1 — World polygon geometry.
  const polygonVertices = transformVerticesToWorld(
    getLocalVertices(polygon),
    polygonPosition,
    polygonOrientation,
  );

  // Step 2 — Polygon edge normals are always SAT candidate axes.
  const candidateAxes = [...getPolygonAxes(polygonVertices)];

  // Step 3 — Add the Circle-specific corner axis. Edge normals alone are not
  // sufficient near polygon vertices: their X/Y-like projections can overlap
  // even while the Circle is diagonally separated from a corner.
  const closestVertex = findClosestVertex(polygonVertices, circlePosition);
  const vertexDelta = closestVertex.subtract(circlePosition);
  const vertexDistanceSquared = vertexDelta.dot(vertexDelta);

  // A zero-length center-to-vertex vector cannot define an axis. If the Circle
  // center lies exactly on a polygon vertex, the polygon edge normals still
  // provide valid SAT axes for this already-touching/overlapping configuration.
  if (vertexDistanceSquared > 0) {
    candidateAxes.push(vertexDelta.scale(1 / Math.sqrt(vertexDistanceSquared)));
  }

  let minimumCollision: Collision | undefined;

  // Steps 4 and 5 — Test every candidate axis. A single separating axis proves
  // no collision; otherwise retain the smallest escape translation.
  for (const axis of candidateAxes) {
    const axisCollision = getAxisCollision(
      projectCircle(circlePosition, circle.radius, axis),
      projectVertices(polygonVertices, axis),
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

  // Rectangle and RegularPolygon always provide edges, so at least the polygon
  // axes are tested even when the optional closest-vertex axis is unavailable.
  if (minimumCollision === undefined) {
    throw new Error("Circle-polygon collision detection produced no candidate axis.");
  }

  return minimumCollision;
}

/** Finds the polygon vertex with the smallest squared distance to `point`. */
function findClosestVertex(vertices: readonly Vector2[], point: Vector2): Vector2 {
  let closestVertex = vertices[0];
  let closestDistanceSquared = distanceSquared(vertices[0], point);

  for (let index = 1; index < vertices.length; index += 1) {
    const candidate = vertices[index];
    const candidateDistanceSquared = distanceSquared(candidate, point);

    if (candidateDistanceSquared < closestDistanceSquared) {
      closestVertex = candidate;
      closestDistanceSquared = candidateDistanceSquared;
    }
  }

  return closestVertex;
}

function distanceSquared(left: Vector2, right: Vector2): number {
  const deltaX = right.x - left.x;
  const deltaY = right.y - left.y;

  return deltaX * deltaX + deltaY * deltaY;
}
