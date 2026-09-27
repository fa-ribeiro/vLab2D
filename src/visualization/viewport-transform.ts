function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

/**
 * Maps mathematical world coordinates into a rectangular display viewport.
 *
 * The world origin is mapped to the center of the viewport. Positive world X
 * points right and positive world Y points up, while positive display Y points
 * down.
 *
 * The transform contains no rendering behavior and is independent from any
 * particular display technology such as SVG or Canvas.
 */
export class ViewportTransform {
  /**
   * Creates a world-to-display coordinate transform.
   *
   * @param width The viewport width in display units.
   * @param height The viewport height in display units.
   * @param pixelsPerUnit The number of display units representing one world unit.
   * @throws {RangeError} If any supplied value is not positive and finite.
   */
  public constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly pixelsPerUnit: number,
  ) {
    assertPositiveFinite(width, "Width");
    assertPositiveFinite(height, "Height");
    assertPositiveFinite(pixelsPerUnit, "Pixels per unit");
  }

  /**
   * Maps a world X coordinate into display space.
   */
  public worldToDisplayX(worldX: number): number {
    return this.width / 2 + worldX * this.pixelsPerUnit;
  }

  /**
   * Maps a world Y coordinate into display space.
   *
   * Mathematical positive Y points upward, so the coordinate is inverted when
   * mapped into display space where positive Y points downward.
   */
  public worldToDisplayY(worldY: number): number {
    return this.height / 2 - worldY * this.pixelsPerUnit;
  }
}
