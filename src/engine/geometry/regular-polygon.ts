import { assertFiniteNumber, assertPositiveNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";

/**
 * Defines immutable centered regular-polygon geometry in simulation/world units.
 *
 * The polygon is centered on its local origin. Vertex `0` lies on local `+X`,
 * and subsequent vertices proceed counter-clockwise in mathematical local
 * coordinates.
 *
 * RegularPolygon owns intrinsic geometry only. It does not own world position,
 * orientation, velocity, angular velocity, or any other runtime state.
 */
export class RegularPolygon {
  /** The number of equally spaced vertices. */
  public readonly vertexCount: number;

  /**
   * The circumradius in simulation/world units: distance from the local origin
   * to every vertex.
   */
  public readonly radius: number;

  /**
   * Precomputed local-space vertices in counter-clockwise order.
   *
   * The array is frozen after construction. Vertex values themselves follow
   * Vector2's immutable TypeScript contract.
   */
  public readonly vertices: readonly Vector2[];

  /**
   * Creates regular polygon geometry centered on its local origin.
   *
   * @param vertexCount The finite integer number of vertices, at least `3`.
   * @param radius The positive finite circumradius in simulation/world units.
   * @throws {RangeError} If the vertex count is non-finite, non-integer, less
   * than `3`, or if the radius is not positive and finite.
   */
  public constructor(vertexCount: number, radius: number) {
    assertFiniteNumber(vertexCount, "RegularPolygon vertex count");

    if (!Number.isInteger(vertexCount)) {
      throw new RangeError("RegularPolygon vertex count must be an integer.");
    }

    if (vertexCount < 3) {
      throw new RangeError("RegularPolygon vertex count must be at least 3.");
    }

    assertFiniteNumber(radius, "RegularPolygon radius");
    assertPositiveNumber(radius, "RegularPolygon radius");

    this.vertexCount = vertexCount;
    this.radius = radius;

    this.vertices = Object.freeze(
      Array.from({ length: vertexCount }, (_, index) => {
        const angle = (Math.PI * 2 * index) / vertexCount;

        return new Vector2(radius * Math.cos(angle), radius * Math.sin(angle));
      }),
    );
  }
}
