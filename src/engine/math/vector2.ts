/**
 * Represents an immutable vector in two-dimensional space.
 *
 * `Vector2` is unit-agnostic and may represent positions, velocities,
 * accelerations, forces, or other two-component quantities.
 */
export class Vector2 {
  /** The vector's x component. */
  public readonly x: number;

  /** The vector's y component. */
  public readonly y: number;

  /**
   * Creates a vector with the given components.
   *
   * The values are stored as supplied; `Vector2` does not impose units or
   * perform simulation-specific validation.
   *
   * @param x The x component.
   * @param y The y component.
   */
  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Returns the component-wise sum of this vector and another vector.
   */
  public add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  /**
   * Returns the component-wise difference between this vector and another
   * vector.
   */
  public subtract(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  /**
   * Returns this vector scaled by the given scalar value.
   *
   * Scaling multiplies both components by the same value. Negative values
   * reverse the vector's direction, while zero produces the zero vector.
   */
  public scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }
}
