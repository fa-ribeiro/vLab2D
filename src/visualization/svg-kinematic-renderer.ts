import type { KinematicBodySnapshot } from "../engine/mod.ts";
import { ViewportTransform } from "./viewport-transform.ts";

const ORIGIN_MARKER_HALF_SIZE = 5;
const GRID_OPACITY = 0.15;
const AXIS_OPACITY = 0.45;

/**
 * Renders kinematic body snapshots and spatial reference information into an
 * SVG document.
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
 *
 * A low-opacity grid marks integer world coordinates. The world X and Y axes
 * span the visible viewport, and the world origin is rendered as a small
 * crosshair at its mapped display position.
 */
export class SvgKinematicRenderer {
  readonly #transform: ViewportTransform;
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
    const transform = new ViewportTransform(width, height, pixelsPerUnit);

    assertPositiveFinite(bodyRadius, "Body radius");

    this.#transform = transform;
    this.#bodyRadius = bodyRadius;
  }

  /**
   * Changes the world position shown at the center of the viewport.
   *
   * @param worldX The world X coordinate to place at the viewport center.
   * @param worldY The world Y coordinate to place at the viewport center.
   * @throws {RangeError} If either coordinate is not finite.
   */
  public setViewportCenter(worldX: number, worldY: number): void {
    this.#transform.setCenter(worldX, worldY);
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
      `  width="${this.#transform.width}"`,
      `  height="${this.#transform.height}"`,
      `  viewBox="0 0 ${this.#transform.width} ${this.#transform.height}">`,
      this.#renderGrid(),
      this.#renderAxes(),
      this.#renderOrigin(),
      bodies,
      "</svg>",
    ]
      .filter((line) => line.length > 0)
      .join("\n");
  }

  #renderBody(snapshot: KinematicBodySnapshot): string {
    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);

    return `  <circle data-body-id="${snapshot.id}" cx="${x}" cy="${y}" r="${this.#bodyRadius}" />`;
  }

  #renderOrigin(): string {
    const x = this.#transform.worldToDisplayX(0);
    const y = this.#transform.worldToDisplayY(0);

    return [
      `  <g data-world-origin="">`,
      `    <line x1="${x - ORIGIN_MARKER_HALF_SIZE}" y1="${y}" x2="${
        x + ORIGIN_MARKER_HALF_SIZE
      }" y2="${y}" stroke="currentColor" />`,
      `    <line x1="${x}" y1="${y - ORIGIN_MARKER_HALF_SIZE}" x2="${x}" y2="${
        y + ORIGIN_MARKER_HALF_SIZE
      }" stroke="currentColor" />`,
      `  </g>`,
    ].join("\n");
  }

  #renderAxes(): string {
    const originX = this.#transform.worldToDisplayX(0);
    const originY = this.#transform.worldToDisplayY(0);

    return [
      `  <line data-world-axis="x" x1="0" y1="${originY}" x2="${this.#transform.width}" y2="${originY}" stroke="currentColor" opacity="${AXIS_OPACITY}" />`,
      `  <line data-world-axis="y" x1="${originX}" y1="0" x2="${originX}" y2="${this.#transform.height}" stroke="currentColor" opacity="${AXIS_OPACITY}" />`,
    ].join("\n");
  }

  #renderGrid(): string {
    const lines: string[] = [];

    const minWorldX = Math.ceil(this.#transform.minWorldX);
    const maxWorldX = Math.floor(this.#transform.maxWorldX);

    const minWorldY = Math.ceil(this.#transform.minWorldY);
    const maxWorldY = Math.floor(this.#transform.maxWorldY);

    for (let worldX = minWorldX; worldX <= maxWorldX; worldX++) {
      if (worldX === 0) {
        continue;
      }

      const x = this.#transform.worldToDisplayX(worldX);

      lines.push(`    <line x1="${x}" y1="0" x2="${x}" y2="${this.#transform.height}" />`);
    }

    for (let worldY = minWorldY; worldY <= maxWorldY; worldY++) {
      if (worldY === 0) {
        continue;
      }

      const y = this.#transform.worldToDisplayY(worldY);

      lines.push(`    <line x1="0" y1="${y}" x2="${this.#transform.width}" y2="${y}" />`);
    }

    return [
      `  <g data-world-grid="" stroke="currentColor" stroke-opacity="${GRID_OPACITY}">`,
      ...lines,
      `  </g>`,
    ].join("\n");
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
