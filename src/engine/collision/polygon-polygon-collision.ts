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
 * The algorithm is organized into five stages:
 *
 * 1. **World geometry** — transform both polygons' local vertices into world
 *    coordinates using their current poses.
 * 2. **Candidate axes** — collect edge normals from both polygons. SAT requires
 *    axes from both shapes because either shape may provide the separating axis.
 * 3. **Projection/separation test** — project both polygons onto every axis. A
 *    single disjoint interval proves the polygons are separated.
 * 4. **Minimum-overlap selection** — if every axis overlaps, keep the axis that
 *    needs the smallest translation to make the intervals merely touch.
 * 5. **Collision result** — return that minimum translation as our ordered A/B
 *    collision normal and penetration depth.
 *
 * Rectangle and RegularPolygon are both convex, so edge normals are sufficient
 * SAT axes. Touching polygons count as a collision with zero penetration depth.
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
  // Step 1 — World geometry: SAT works on the polygons at their actual current
  // poses, so transform their reusable local vertices into world coordinates.
  const verticesA = transformVerticesToWorld(getLocalVertices(shapeA), positionA, orientationA);
  const verticesB = transformVerticesToWorld(getLocalVertices(shapeB), positionB, orientationB);

  // Step 2 — Candidate axes: every edge normal from both convex polygons is a
  // possible separating axis.
  const candidateAxes = [...getPolygonAxes(verticesA), ...getPolygonAxes(verticesB)];

  let minimumCollision: Collision | undefined;

  // Steps 3 and 4 — Project onto each axis. Any separating axis ends the test
  // immediately; otherwise retain the smallest translation seen so far.
  for (const axis of candidateAxes) {
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

  // Step 5 — Every candidate axis overlapped, so the polygons collide. The
  // smallest per-axis escape translation is the minimum translation vector.
  return minimumCollision;
}
