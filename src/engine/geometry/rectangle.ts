/**
 * Defines immutable rectangular geometry in simulation/world units.
 *
 * Rectangle is centered on its local origin. It owns dimensions only and
 * does not own world position, orientation, velocity, or other runtime state.
 */
export class Rectangle {
  /** The rectangle width in simulation/world units. */
  public readonly width: number;

  /** The rectangle height in simulation/world units. */
  public readonly height: number;

  /**
   * Creates rectangular geometry centered on its local origin.
   *
   * @param width The positive finite width in simulation/world units.
   * @param height The positive finite height in simulation/world units.
   * @throws {RangeError} If either dimension is not positive and finite.
   */
  public constructor(width: number, height: number) {
    if (!Number.isFinite(width) || width <= 0) {
      throw new RangeError("Rectangle width must be a positive finite number.");
    }

    if (!Number.isFinite(height) || height <= 0) {
      throw new RangeError("Rectangle height must be a positive finite number.");
    }

    this.width = width;
    this.height = height;
  }
}
