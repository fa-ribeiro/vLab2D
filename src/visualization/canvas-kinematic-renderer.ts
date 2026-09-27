import type { KinematicBodySnapshot } from "../engine/mod.ts";
import { ViewportTransform } from "./viewport-transform.ts";

const ORIGIN_MARKER_HALF_SIZE = 5;
const GRID_OPACITY = 0.15;
const AXIS_OPACITY = 0.45;

interface CanvasDrawingContext {
  clearRect(x: number, y: number, width: number, height: number): void;

  beginPath(): void;

  moveTo(x: number, y: number): void;

  lineTo(x: number, y: number): void;

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;

  fill(): void;

  stroke(): void;

  save(): void;

  restore(): void;

  globalAlpha: number;
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

/**
 * Renders kinematic body snapshots into a Canvas 2D drawing context.
 *
 * The renderer operates only on detached engine observations. It does not own,
 * advance, or mutate simulation state.
 *
 * Mathematical world coordinates are mapped to Canvas display coordinates with
 * the world origin at the center of the viewport:
 *
 * - positive world X maps right;
 * - positive world Y maps up;
 * - positive Canvas Y maps down.
 */
export class CanvasKinematicRenderer {
  readonly #context: CanvasDrawingContext;
  readonly #transform: ViewportTransform;
  readonly #bodyRadius: number;

  public constructor(
    context: CanvasDrawingContext,
    width: number,
    height: number,
    pixelsPerUnit: number,
    bodyRadius = 4,
  ) {
    const transform = new ViewportTransform(width, height, pixelsPerUnit);

    assertPositiveFinite(bodyRadius, "Body radius");

    this.#context = context;
    this.#transform = transform;
    this.#bodyRadius = bodyRadius;
  }

  /**
   * Clears the viewport and renders the supplied body snapshots.
   *
   * @param snapshots The detached body observations to render.
   */
  public render(snapshots: readonly KinematicBodySnapshot[]): void {
    this.#context.clearRect(0, 0, this.#transform.width, this.#transform.height);

    this.#renderGrid();
    this.#renderAxes();
    this.#renderOrigin();

    for (const snapshot of snapshots) {
      this.#renderBody(snapshot);
    }
  }

  #renderBody(snapshot: KinematicBodySnapshot): void {
    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);

    this.#context.beginPath();
    this.#context.arc(x, y, this.#bodyRadius, 0, Math.PI * 2);
    this.#context.fill();
  }

  #renderOrigin(): void {
    const x = this.#transform.worldToDisplayX(0);
    const y = this.#transform.worldToDisplayY(0);

    this.#strokeLine(x - ORIGIN_MARKER_HALF_SIZE, y, x + ORIGIN_MARKER_HALF_SIZE, y);

    this.#strokeLine(x, y - ORIGIN_MARKER_HALF_SIZE, x, y + ORIGIN_MARKER_HALF_SIZE);
  }

  #renderAxes(): void {
    const originX = this.#transform.worldToDisplayX(0);
    const originY = this.#transform.worldToDisplayY(0);

    this.#context.save();
    this.#context.globalAlpha = AXIS_OPACITY;

    this.#strokeLine(0, originY, this.#transform.width, originY);

    this.#strokeLine(originX, 0, originX, this.#transform.height);

    this.#context.restore();
  }

  #renderGrid(): void {
    const halfWorldWidth = this.#transform.width / (2 * this.#transform.pixelsPerUnit);

    const halfWorldHeight = this.#transform.height / (2 * this.#transform.pixelsPerUnit);

    const minWorldX = Math.ceil(-halfWorldWidth);
    const maxWorldX = Math.floor(halfWorldWidth);

    const minWorldY = Math.ceil(-halfWorldHeight);
    const maxWorldY = Math.floor(halfWorldHeight);

    this.#context.save();
    this.#context.globalAlpha = GRID_OPACITY;

    for (let worldX = minWorldX; worldX <= maxWorldX; worldX++) {
      if (worldX === 0) {
        continue;
      }

      const x = this.#transform.worldToDisplayX(worldX);

      this.#strokeLine(x, 0, x, this.#transform.height);
    }

    for (let worldY = minWorldY; worldY <= maxWorldY; worldY++) {
      if (worldY === 0) {
        continue;
      }

      const y = this.#transform.worldToDisplayY(worldY);

      this.#strokeLine(0, y, this.#transform.width, y);
    }

    this.#context.restore();
  }

  #strokeLine(x1: number, y1: number, x2: number, y2: number): void {
    this.#context.beginPath();
    this.#context.moveTo(x1, y1);
    this.#context.lineTo(x2, y2);
    this.#context.stroke();
  }
}
