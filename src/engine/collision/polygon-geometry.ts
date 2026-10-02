import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";

/**
 * Returns ordered local-space vertices for a currently supported convex
 * polygonal Body shape.
 *
 * Rectangle vertices are derived from its intrinsic width and height rather
 * than stored by Rectangle itself. RegularPolygon already owns immutable
 * local-space vertices, so those values are reused directly.
 *
 * Vertices are ordered counter-clockwise in mathematical local coordinates.
 */
export function getLocalVertices(shape: Rectangle | RegularPolygon): readonly Vector2[] {
  if (shape instanceof Rectangle) {
    const halfWidth = shape.width / 2;
    const halfHeight = shape.height / 2;

    return [
      new Vector2(-halfWidth, -halfHeight),
      new Vector2(halfWidth, -halfHeight),
      new Vector2(halfWidth, halfHeight),
      new Vector2(-halfWidth, halfHeight),
    ];
  }

  if (shape instanceof RegularPolygon) {
    return shape.vertices;
  }

  return shape satisfies never;
}

/**
 * Transforms local-space vertices into world space using a Body pose.
 *
 * Rotation is applied around the local origin before translation. Positive
 * orientation therefore rotates counter-clockwise, matching the engine's
 * mathematical world-coordinate convention.
 */
export function transformVerticesToWorld(
  vertices: readonly Vector2[],
  position: Vector2,
  orientation: number,
): readonly Vector2[] {
  return vertices.map((vertex) => vertex.rotate(orientation).add(position));
}
