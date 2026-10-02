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
 * Parallel/opposite axes are deliberately not deduplicated yet. Re-testing an
 * equivalent axis is harmless and keeps the first SAT implementation simple.
 */
export function getPolygonAxes(vertices: readonly Vector2[]): readonly Vector2[] {
  return vertices.map((start, index) => {
    const end = vertices[(index + 1) % vertices.length];
    const edgeX = end.x - start.x;
    const edgeY = end.y - start.y;
    const edgeLength = Math.hypot(edgeX, edgeY);

    return new Vector2(-edgeY / edgeLength, edgeX / edgeLength);
  });
}

/**
 * Projects polygon vertices onto a unit SAT axis.
 */
export function projectVertices(vertices: readonly Vector2[], axis: Vector2): Projection {
  let min = vertices[0].dot(axis);
  let max = min;

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
 * A circle projects to an interval centered on the projected circle center,
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
 * `undefined` means this axis separates the shapes. Otherwise the returned
 * normal and depth describe the shorter of the two translations that would
 * bring the projections to touching. The normal points in the direction shape
 * B would move away from shape A along this axis.
 *
 * Choosing between both escape directions from the projection intervals also
 * handles complete containment without relying on center-to-center direction.
 */
export function getAxisCollision(
  projectionA: Projection,
  projectionB: Projection,
  axis: Vector2,
): Collision | undefined {
  if (projectionA.max < projectionB.min || projectionB.max < projectionA.min) {
    return undefined;
  }

  const positiveDepth = projectionA.max - projectionB.min;
  const negativeDepth = projectionB.max - projectionA.min;

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
