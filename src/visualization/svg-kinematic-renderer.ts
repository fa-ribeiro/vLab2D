import type { KinematicBodySnapshot } from "../engine/mod.ts";

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

/**
 * Renders kinematic body snapshots as points in an SVG document.
 *
 * The renderer operates only on detached engine observations. It does not own,
 * advance, or mutate simulation state.
 *
 * Mathematical world coordinates are mapped to SVG display coordinates with
 * the world origin at the center of the viewport:
 *
 * - positive world X maps right;
 * - positive world Y maps up;
 * - positive SVG Y maps down.
 */
export class SvgKinematicRenderer {
  readonly #width: number;
  readonly #height: number;
  readonly #pixelsPerUnit: number;
  readonly #bodyRadius: number;

  /**
   * Creates an SVG kinematic renderer.
   *
   * @param width The SVG viewport width in display units.
   * @param height The SVG viewport height in display units.
   * @param pixelsPerUnit The number of display units representing one world
   * unit.
   * @param bodyRadius The radius used to draw each body in display units.
   * @throws {RangeError} If any supplied value is not positive and finite.
   */
  public constructor(width: number, height: number, pixelsPerUnit: number, bodyRadius = 4) {
    assertPositiveFinite(width, "Width");
    assertPositiveFinite(height, "Height");
    assertPositiveFinite(pixelsPerUnit, "Pixels per unit");
    assertPositiveFinite(bodyRadius, "Body radius");

    this.#width = width;
    this.#height = height;
    this.#pixelsPerUnit = pixelsPerUnit;
    this.#bodyRadius = bodyRadius;
  }

  /**
   * Renders body snapshots into a complete SVG document.
   *
   * @param snapshots The detached body observations to render.
   * @returns A complete SVG document as text.
   */
  public render(snapshots: readonly KinematicBodySnapshot[]): string {
    const bodies = snapshots.map((snapshot) => this.#renderBody(snapshot)).join("\n");

    return [
      `<svg xmlns="http://www.w3.org/2000/svg"`,
      `  width="${this.#width}"`,
      `  height="${this.#height}"`,
      `  viewBox="0 0 ${this.#width} ${this.#height}">`,
      bodies,
      "</svg>",
    ]
      .filter((line) => line.length > 0)
      .join("\n");
  }

  #renderBody(snapshot: KinematicBodySnapshot): string {
    const x = this.#worldToDisplayX(snapshot.state.position.x);
    const y = this.#worldToDisplayY(snapshot.state.position.y);

    return `  <circle data-body-id="${snapshot.id}" cx="${x}" cy="${y}" r="${this.#bodyRadius}" />`;
  }

  #worldToDisplayX(worldX: number): number {
    return this.#width / 2 + worldX * this.#pixelsPerUnit;
  }

  #worldToDisplayY(worldY: number): number {
    return this.#height / 2 - worldY * this.#pixelsPerUnit;
  }
}
