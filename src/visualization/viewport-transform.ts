/**
 * Maps mathematical world coordinates into a rectangular display viewport.
 *
 * The configured world-space center is mapped to the center of the viewport.
 * The world origin is centered by default. Positive world X points right
 * and positive world Y points up, while positive display Y points down.
 *
 * The transform contains no rendering behavior and is independent from any
 * particular display technology such as SVG or Canvas.
 */
export class ViewportTransform {
  #centerWorldX = 0;
  #centerWorldY = 0;

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
   * The minimum visible world X coordinate.
   */
  public get minWorldX(): number {
    return this.#centerWorldX - this.width / (2 * this.pixelsPerUnit);
  }

  /**
   * The maximum visible world X coordinate.
   */
  public get maxWorldX(): number {
    return this.#centerWorldX + this.width / (2 * this.pixelsPerUnit);
  }

  /**
   * The minimum visible world Y coordinate.
   */
  public get minWorldY(): number {
    return this.#centerWorldY - this.height / (2 * this.pixelsPerUnit);
  }

  /**
   * The maximum visible world Y coordinate.
   */
  public get maxWorldY(): number {
    return this.#centerWorldY + this.height / (2 * this.pixelsPerUnit);
  }

  /**
   * The world X coordinate currently mapped to the horizontal viewport center.
   */
  public get centerWorldX(): number {
    return this.#centerWorldX;
  }

  /**
   * The world Y coordinate currently mapped to the vertical viewport center.
   */
  public get centerWorldY(): number {
    return this.#centerWorldY;
  }

  /**
   * Changes the world position mapped to the center of the viewport.
   *
   * @param worldX The world X coordinate to place at the viewport center.
   * @param worldY The world Y coordinate to place at the viewport center.
   * @throws {RangeError} If either coordinate is not finite.
   */
  public setCenter(worldX: number, worldY: number): void {
    assertFinite(worldX, "Center world X");
    assertFinite(worldY, "Center world Y");

    this.#centerWorldX = worldX;
    this.#centerWorldY = worldY;
  }

  /**
   * Maps a world X coordinate into display space.
   */
  public worldToDisplayX(worldX: number): number {
    return this.width / 2 + (worldX - this.#centerWorldX) * this.pixelsPerUnit;
  }

  /**
   * Maps a world Y coordinate into display space.
   *
   * Mathematical positive Y points upward, so the coordinate is inverted when
   * mapped into display space where positive Y points downward.
   */
  public worldToDisplayY(worldY: number): number {
    return this.height / 2 - (worldY - this.#centerWorldY) * this.pixelsPerUnit;
  }
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite.`);
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
