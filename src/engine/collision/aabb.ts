import type { BodyShape } from "../geometry/body-shape.ts";
import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import { getLocalVertices, transformVerticesToWorld } from "./polygon-geometry.ts";

/**
 * Axis-aligned bounding box in world coordinates.
 *
 * `min` contains the smallest world X/Y coordinates enclosed by the box and
 * `max` contains the largest. AABBs are conservative collision bounds: overlap
 * means two shapes may collide, while separation proves they cannot collide.
 */
export interface Aabb {
  /** Minimum enclosed world-space X and Y coordinates. */
  readonly min: Vector2;

  /** Maximum enclosed world-space X and Y coordinates. */
  readonly max: Vector2;
}

/**
 * Computes the world-space axis-aligned bounding box for a physical Body shape
 * at the supplied pose.
 *
 * Circle orientation does not affect its bounds. Polygonal shapes are first
 * transformed into world space and then enclosed by the minimum/maximum X/Y
 * coordinates of their vertices.
 *
 * @param shape Intrinsic physical geometry to bound.
 * @param position World position of the shape's local origin.
 * @param orientation World orientation in radians.
 * @returns The smallest world-axis-aligned box enclosing the supplied shape.
 */
export function computeShapeAabb(
  shape: BodyShape,
  position: Vector2,
  orientation: number,
): Aabb {
  if (shape instanceof Circle) {
    return {
      min: new Vector2(position.x - shape.radius, position.y - shape.radius),
      max: new Vector2(position.x + shape.radius, position.y + shape.radius),
    };
  }

  if (shape instanceof Rectangle || shape instanceof RegularPolygon) {
    return computeVerticesAabb(
      transformVerticesToWorld(getLocalVertices(shape), position, orientation),
    );
  }

  return shape satisfies never;
}

/**
 * Tests whether two axis-aligned bounding boxes overlap or touch.
 *
 * Touching counts as overlap so this broad-phase predicate remains conservative
 * with the engine's narrow-phase rule that touching geometry is a collision.
 *
 * @param a First world-space AABB.
 * @param b Second world-space AABB.
 * @returns `true` when the boxes overlap or touch on both world axes.
 */
export function aabbsOverlap(a: Aabb, b: Aabb): boolean {
  return !(a.max.x < b.min.x || b.max.x < a.min.x || a.max.y < b.min.y || b.max.y < a.min.y);
}

function computeVerticesAabb(vertices: readonly Vector2[]): Aabb {
  let minX = vertices[0].x;
  let maxX = vertices[0].x;
  let minY = vertices[0].y;
  let maxY = vertices[0].y;

  for (let index = 1; index < vertices.length; index += 1) {
    const vertex = vertices[index];

    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  }

  return {
    min: new Vector2(minX, minY),
    max: new Vector2(maxX, maxY),
  };
}
