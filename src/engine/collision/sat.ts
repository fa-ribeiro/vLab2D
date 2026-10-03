import { Vector2 } from "../math/vector2.ts";
import type { Collision } from "./collision.ts";

/**
 * One-dimensional projection interval used by SAT.
 *
 * `min` and `max` are scalar coordinates along a unit axis.
 */
export interface Projection {
  readonly min: number;
  readonly max: number;
}

/**
 * Returns one unit normal for every edge of a convex polygon.
 *
 * For SAT, a polygon edge itself is not the test axis: the axis is the edge's
 * perpendicular normal. Projecting onto these normals is sufficient to test
 * separation between convex polygons.
 *
 * Parallel/opposite axes are deliberately not deduplicated yet. Re-testing an
 * equivalent axis is harmless and keeps the first SAT implementation simple.
 */
export function getPolygonAxes(vertices: readonly Vector2[]): readonly Vector2[] {
  return vertices.map((start, index) => {
    const end = vertices[(index + 1) % vertices.length];
    const edgeX = end.x - start.x;
    const edgeY = end.y - start.y;
    const edgeLength = Math.hypot(edgeX, edgeY);

    // (-y, x) rotates the edge 90° counter-clockwise. Dividing by edge length
    // makes the axis unit length so projection distances remain world distances.
    return new Vector2(-edgeY / edgeLength, edgeX / edgeLength);
  });
}

/**
 * Projects polygon vertices onto a unit SAT axis.
 *
 * Each 2D vertex becomes one scalar through a dot product. SAT only needs the
 * smallest and largest scalar: together they form the polygon's 1D shadow on
 * this axis.
 */
export function projectVertices(vertices: readonly Vector2[], axis: Vector2): Projection {
  const firstProjection = vertices[0].dot(axis);
  let min = firstProjection;
  let max = firstProjection;

  for (let index = 1; index < vertices.length; index += 1) {
    const projection = vertices[index].dot(axis);

    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}

/**
 * Projects a circle onto a unit SAT axis.
 *
 * A circle projects to an interval centered on the projected Circle center,
 * extending one radius in each direction.
 */
export function projectCircle(center: Vector2, radius: number, axis: Vector2): Projection {
  const centerProjection = center.dot(axis);

  return {
    min: centerProjection - radius,
    max: centerProjection + radius,
  };
}

/**
 * Evaluates two projection intervals on one unit SAT axis.
 *
 * This is the one-dimensional heart of SAT:
 *
 * 1. **Separation check** — if the intervals have a gap, this axis proves the
 *    original 2D shapes cannot collide.
 * 2. **Escape distances** — if they overlap, calculate how far B would have to
 *    move in either +axis or -axis direction until the intervals merely touch.
 * 3. **Minimum direction** — choose the shorter escape. Its direction becomes
 *    the ordered collision normal and its length the penetration depth.
 *
 * Testing both escape directions is important for containment: center-to-center
 * direction alone cannot reliably identify the true minimum translation when
 * one projection is entirely inside the other.
 */
export function getAxisCollision(
  projectionA: Projection,
  projectionB: Projection,
  axis: Vector2,
): Collision | undefined {
  // Step 1 — A gap on even one SAT axis proves separation.
  if (projectionA.max < projectionB.min || projectionB.max < projectionA.min) {
    return undefined;
  }

  // Step 2 — Two translations can separate overlapping 1D intervals:
  // move B toward +axis until B.min reaches A.max, or toward -axis until B.max
  // reaches A.min.
  const positiveDepth = projectionA.max - projectionB.min;
  const negativeDepth = projectionB.max - projectionA.min;

  // Step 3 — Choose the shorter escape translation. `<=` also gives a stable
  // deterministic direction when both choices are equally short.
  if (positiveDepth <= negativeDepth) {
    return {
      normal: axis,
      penetrationDepth: positiveDepth,
    };
  }

  return {
    normal: axis.scale(-1),
    penetrationDepth: negativeDepth,
  };
}
