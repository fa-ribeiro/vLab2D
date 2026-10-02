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
 * Polygon edge normals provide the usual SAT axes. Because a circle has no
 * edges of its own, one additional axis is tested from the circle center toward
 * the closest polygon vertex. That extra axis is required to detect separation
 * around polygon corners.
 *
 * Touching geometry counts as a collision with zero penetration depth. The
 * returned normal points from the Circle (A) toward the polygon (B).
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
  const polygonVertices = transformVerticesToWorld(
    getLocalVertices(polygon),
    polygonPosition,
    polygonOrientation,
  );

  const axes = [...getPolygonAxes(polygonVertices)];

  const closestVertex = findClosestVertex(polygonVertices, circlePosition);
  const vertexDelta = closestVertex.subtract(circlePosition);
  const vertexDistanceSquared = vertexDelta.dot(vertexDelta);

  // A zero-length center-to-vertex vector cannot define an axis. If the circle
  // center lies exactly on a polygon vertex, the polygon edge normals still
  // provide valid SAT axes for this already-touching/overlapping configuration.
  if (vertexDistanceSquared > 0) {
    axes.push(vertexDelta.scale(1 / Math.sqrt(vertexDistanceSquared)));
  }

  let minimumCollision: Collision | undefined;

  for (const axis of axes) {
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
