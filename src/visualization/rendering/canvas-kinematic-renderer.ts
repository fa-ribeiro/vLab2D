import { type BodyId, type BodySnapshot, Rectangle } from "../../engine/mod.ts";
import { ViewportTransform } from "../viewport/viewport-transform.ts";

const ORIGIN_MARKER_HALF_SIZE = 5;

const GRID_OPACITY = 0.15;
const AXIS_OPACITY = 0.45;

const HOVER_RING_PADDING = 4;
const HOVER_RING_OPACITY = 0.6;

const SELECTION_RING_PADDING = 8;
const SELECTION_RING_OPACITY = 1;

interface CanvasDrawingContext {
  clearRect(x: number, y: number, width: number, height: number): void;

  beginPath(): void;

  moveTo(x: number, y: number): void;

  lineTo(x: number, y: number): void;

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;

  fill(): void;

  stroke(): void;

  fillRect(x: number, y: number, width: number, height: number): void;

  strokeRect(x: number, y: number, width: number, height: number): void;

  save(): void;

  restore(): void;

  translate(x: number, y: number): void;

  rotate(angle: number): void;

  globalAlpha: number;
}

/**
 * Renders detached body snapshots into a Canvas 2D drawing context.
 *
 * The renderer operates only on detached engine observations. It does not own,
 * advance, or mutate simulation state.
 *
 * Mathematical world coordinates are mapped to Canvas display coordinates with
 * the configured viewport world position at the center of the display.
 *
 * - positive world X maps right;
 * - positive world Y maps up;
 * - positive Canvas Y maps down.
 *
 * Shape geometry is rendered around each body's local origin. Positive body
 * orientation is counter-clockwise in world space; the renderer negates that
 * angle when applying Canvas rotation because Canvas display Y points down.
 */
export class CanvasKinematicRenderer {
  readonly #context: CanvasDrawingContext;
  readonly #transform: ViewportTransform;
  readonly #shapelessBodyRadius: number;

  /**
   * Creates a Canvas kinematic renderer.
   *
   * @param context The Canvas-like drawing context used for rendering.
   * @param transform The shared world-to-display viewport transform.
   * @param shapelessBodyRadius The fixed display-space radius used for
   * shapeless body markers.
   * @throws {RangeError} If the shapeless body radius is not positive and finite.
   */
  public constructor(
    context: CanvasDrawingContext,
    transform: ViewportTransform,
    shapelessBodyRadius = 4,
  ) {
    assertPositiveFinite(shapelessBodyRadius, "Shapeless body radius");

    this.#context = context;
    this.#transform = transform;
    this.#shapelessBodyRadius = shapelessBodyRadius;
  }

  /**
   * Clears the viewport and renders the supplied body snapshots.
   *
   * @param snapshots The detached body observations to render.
   */
  public render(
    snapshots: readonly BodySnapshot[],
    hoveredBodyId?: BodyId,
    selectedBodyId?: BodyId,
  ): void {
    this.#context.clearRect(0, 0, this.#transform.width, this.#transform.height);

    this.#renderGrid();
    this.#renderAxes();
    this.#renderOrigin();

    for (const snapshot of snapshots) {
      this.#renderBody(snapshot, snapshot.id === hoveredBodyId, snapshot.id === selectedBodyId);
    }
  }

  #renderBody(snapshot: BodySnapshot, hovered: boolean, selected: boolean): void {
    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);

    const shape = snapshot.definition.shape;

    if (shape instanceof Rectangle) {
      const width = shape.width * this.#transform.pixelsPerUnit;
      const height = shape.height * this.#transform.pixelsPerUnit;

      this.#context.save();
      this.#context.translate(x, y);
      this.#context.rotate(-snapshot.state.orientation);
      this.#context.fillRect(-width / 2, -height / 2, width, height);

      if (hovered) {
        this.#context.save();
        this.#context.globalAlpha = HOVER_RING_OPACITY;

        this.#context.strokeRect(
          -width / 2 - HOVER_RING_PADDING,
          -height / 2 - HOVER_RING_PADDING,
          width + HOVER_RING_PADDING * 2,
          height + HOVER_RING_PADDING * 2,
        );

        this.#context.restore();
      }

      if (selected) {
        this.#context.save();
        this.#context.globalAlpha = SELECTION_RING_OPACITY;

        this.#context.strokeRect(
          -width / 2 - SELECTION_RING_PADDING,
          -height / 2 - SELECTION_RING_PADDING,
          width + SELECTION_RING_PADDING * 2,
          height + SELECTION_RING_PADDING * 2,
        );

        this.#context.restore();
      }

      this.#context.restore();
      return;
    }

    const radius = shape === undefined
      ? this.#shapelessBodyRadius
      : shape.radius * this.#transform.pixelsPerUnit;

    if (shape === undefined) {
      this.#context.beginPath();
      this.#context.arc(x, y, radius, 0, Math.PI * 2);
      this.#context.fill();
    } else {
      this.#context.save();
      this.#context.translate(x, y);
      this.#context.rotate(-snapshot.state.orientation);
      this.#context.beginPath();
      this.#context.arc(0, 0, radius, 0, Math.PI * 2);
      this.#context.fill();
      this.#context.restore();
    }

    if (hovered) {
      this.#context.save();
      this.#context.globalAlpha = HOVER_RING_OPACITY;

      this.#context.beginPath();
      this.#context.arc(x, y, radius + HOVER_RING_PADDING, 0, Math.PI * 2);
      this.#context.stroke();

      this.#context.restore();
    }

    if (selected) {
      this.#context.save();
      this.#context.globalAlpha = SELECTION_RING_OPACITY;

      this.#context.beginPath();
      this.#context.arc(x, y, radius + SELECTION_RING_PADDING, 0, Math.PI * 2);
      this.#context.stroke();

      this.#context.restore();
    }
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
    const minWorldX = Math.ceil(this.#transform.minWorldX);
    const maxWorldX = Math.floor(this.#transform.maxWorldX);

    const minWorldY = Math.ceil(this.#transform.minWorldY);
    const maxWorldY = Math.floor(this.#transform.maxWorldY);

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

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
