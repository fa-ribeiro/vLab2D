import { type BodySnapshot, Circle, Rectangle, RegularPolygon } from "../../engine/mod.ts";
import { ViewportTransform } from "../viewport/viewport-transform.ts";

const ORIGIN_MARKER_HALF_SIZE = 5;
const GRID_OPACITY = 0.15;
const AXIS_OPACITY = 0.45;

/**
 * Renders detached body snapshots and spatial reference information into an
 * SVG document.
 */
export class SvgKinematicRenderer {
  readonly #transform: ViewportTransform;
  readonly #bodyRadius: number;

  /**
   * Creates an SVG kinematic renderer.
   *
   * @param width The SVG viewport width in display units.
   * @param height The SVG viewport height in display units.
   * @param pixelsPerUnit The positive finite number of display units
   * representing one world unit.
   * @param bodyRadius The fixed display-space radius used for shapeless body
   * markers.
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
   * Changes the viewport display scale.
   *
   * @param pixelsPerUnit The positive finite number of SVG display units
   * representing one world unit.
   * @throws {RangeError} If the scale is not positive and finite.
   */
  public setViewportScale(pixelsPerUnit: number): void {
    this.#transform.setPixelsPerUnit(pixelsPerUnit);
  }

  /**
   * Renders body snapshots into a complete SVG document.
   *
   * @param snapshots The detached body observations to render.
   * @returns A complete SVG document as text.
   */
  public render(snapshots: readonly BodySnapshot[]): string {
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

  #renderBody(snapshot: BodySnapshot): string {
    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);
    const shape = snapshot.definition.shape;

    if (shape instanceof Circle) {
      return this.#renderCircleBody(snapshot, shape.radius, x, y);
    }

    if (shape instanceof Rectangle) {
      return this.#renderRectangleBody(snapshot, shape.width, shape.height, x, y);
    }

    if (shape instanceof RegularPolygon) {
      return this.#renderRegularPolygonBody(snapshot, shape, x, y);
    }

    if (shape === undefined) {
      return this.#renderShapelessBody(snapshot, x, y);
    }

    return shape satisfies never;
  }

  #renderShapelessBody(snapshot: BodySnapshot, x: number, y: number): string {
    return `  <circle data-body-id="${snapshot.id}" cx="${x}" cy="${y}" r="${this.#bodyRadius}" />`;
  }

  #renderCircleBody(snapshot: BodySnapshot, worldRadius: number, x: number, y: number): string {
    const radius = worldRadius * this.#transform.pixelsPerUnit;
    const rotation = this.#bodyRotationTransform(snapshot.state.orientation, x, y);

    return `  <circle data-body-id="${snapshot.id}" cx="${x}" cy="${y}" r="${radius}" transform="${rotation}" />`;
  }

  #renderRectangleBody(
    snapshot: BodySnapshot,
    worldWidth: number,
    worldHeight: number,
    x: number,
    y: number,
  ): string {
    const width = worldWidth * this.#transform.pixelsPerUnit;
    const height = worldHeight * this.#transform.pixelsPerUnit;
    const rotation = this.#bodyRotationTransform(snapshot.state.orientation, x, y);

    return `  <rect data-body-id="${snapshot.id}" x="${x - width / 2}" y="${
      y - height / 2
    }" width="${width}" height="${height}" transform="${rotation}" />`;
  }

  #renderRegularPolygonBody(
    snapshot: BodySnapshot,
    shape: RegularPolygon,
    x: number,
    y: number,
  ): string {
    const points = shape.vertices
      .map((vertex) => {
        const pointX = x + vertex.x * this.#transform.pixelsPerUnit;
        const pointY = y - vertex.y * this.#transform.pixelsPerUnit;
        return `${pointX},${pointY}`;
      })
      .join(" ");

    const rotation = this.#bodyRotationTransform(snapshot.state.orientation, x, y);

    return `  <polygon data-body-id="${snapshot.id}" points="${points}" transform="${rotation}" />`;
  }

  #bodyRotationTransform(orientation: number, x: number, y: number): string {
    const displayAngleDegrees = -(orientation * 180) / Math.PI;
    return `rotate(${displayAngleDegrees} ${x} ${y})`;
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
      if (worldX === 0) continue;
      const x = this.#transform.worldToDisplayX(worldX);
      lines.push(`    <line x1="${x}" y1="0" x2="${x}" y2="${this.#transform.height}" />`);
    }

    for (let worldY = minWorldY; worldY <= maxWorldY; worldY++) {
      if (worldY === 0) continue;
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
