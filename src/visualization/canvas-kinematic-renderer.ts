import { type BodyId, type BodySnapshot, Circle } from "../engine/mod.ts";
import { ViewportTransform } from "./viewport-transform.ts";

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

  save(): void;

  restore(): void;

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
 */
export class CanvasKinematicRenderer {
  readonly #context: CanvasDrawingContext;
  readonly #transform: ViewportTransform;
  readonly #bodyRadius: number;

  /**
   * Creates a Canvas kinematic renderer.
   *
   * @param context The Canvas-like drawing context used for rendering.
   * @param width The viewport width in Canvas drawing-buffer units.
   * @param height The viewport height in Canvas drawing-buffer units.
   * @param pixelsPerUnit The number of Canvas display units representing one
   * world unit.
   * @param bodyRadius The fixed display-space radius used for shapeless body
   * markers.
   * @throws {RangeError} If the viewport dimensions, scale, or body radius are
   * not positive and finite.
   */
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
   * Increasing the scale zooms in while preserving the current
   * world-space viewport center.
   *
   * @param pixelsPerUnit The positive finite number of Canvas display units
   * representing one world unit.
   * @throws {RangeError} If the scale is not positive and finite.
   */
  public setViewportScale(pixelsPerUnit: number): void {
    this.#transform.setPixelsPerUnit(pixelsPerUnit);
  }

  /**
   * The current number of Canvas display units representing one world unit.
   */
  public get viewportScale(): number {
    return this.#transform.pixelsPerUnit;
  }

  /**
   * Changes the viewport scale while preserving the world point underneath
   * a Canvas display-space anchor.
   *
   * @param pixelsPerUnit The new positive finite display scale.
   * @param displayX The horizontal anchor in Canvas drawing-buffer units.
   * @param displayY The vertical anchor in Canvas drawing-buffer units.
   * @throws {RangeError} If the scale or anchor coordinates are invalid.
   */
  public setViewportScaleAroundDisplayPoint(
    pixelsPerUnit: number,
    displayX: number,
    displayY: number,
  ): void {
    this.#transform.setPixelsPerUnitAroundDisplayPoint(pixelsPerUnit, displayX, displayY);
  }

  /**
   * Pans the viewport by a displacement expressed in display units.
   *
   * Positive X moves the displayed world to the right.
   * Positive Y moves the displayed world downward.
   *
   * @param deltaX Horizontal display-space movement.
   * @param deltaY Vertical display-space movement.
   * @throws {RangeError} If either delta is not finite.
   */
  public panViewportBy(deltaX: number, deltaY: number): void {
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
      throw new RangeError("Viewport pan delta must be finite.");
    }

    this.#transform.setCenter(
      this.#transform.centerWorldX - deltaX / this.#transform.pixelsPerUnit,
      this.#transform.centerWorldY + deltaY / this.#transform.pixelsPerUnit,
    );
  }

  /**
   * Maps a horizontal Canvas display coordinate into world space.
   *
   * @param displayX The X coordinate in Canvas drawing-buffer units.
   * @returns The corresponding world X coordinate.
   */
  public displayToWorldX(displayX: number): number {
    return this.#transform.displayToWorldX(displayX);
  }

  /**
   * Maps a vertical Canvas display coordinate into world space.
   *
   * @param displayY The Y coordinate in Canvas drawing-buffer units.
   * @returns The corresponding world Y coordinate.
   */
  public displayToWorldY(displayY: number): number {
    return this.#transform.displayToWorldY(displayY);
  }

  /**
   * Finds the nearest body hit by its display-space picking radius.
   *
   * Shapeless bodies use the renderer's fixed presentation radius.
   * Circle bodies use their world-space radius transformed by the current
   * viewport scale.
   *
   * @param snapshots Detached body observations to test.
   * @param displayX Horizontal point coordinate in Canvas drawing-buffer units.
   * @param displayY Vertical point coordinate in Canvas drawing-buffer units.
   * @returns The identifier of the nearest hit body, or `undefined` when no
   * body contains the point.
   * @throws {TypeError} If a supplied body uses Rectangle geometry, which this
   * renderer does not support yet.
   *
   */
  public findBodyAtDisplayPoint(
    snapshots: readonly BodySnapshot[],
    displayX: number,
    displayY: number,
  ): BodyId | undefined {
    let nearestBodyId: BodyId | undefined;
    let nearestDistanceSquared = Number.POSITIVE_INFINITY;

    for (const snapshot of snapshots) {
      const bodyX = this.#transform.worldToDisplayX(snapshot.state.position.x);
      const bodyY = this.#transform.worldToDisplayY(snapshot.state.position.y);

      const radius = this.#bodyDisplayRadius(snapshot);

      const deltaX = displayX - bodyX;
      const deltaY = displayY - bodyY;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;

      if (distanceSquared <= radius * radius && distanceSquared < nearestDistanceSquared) {
        nearestBodyId = snapshot.id;
        nearestDistanceSquared = distanceSquared;
      }
    }

    return nearestBodyId;
  }

  /**
   * Clears the viewport and renders the supplied body snapshots.
   *
   * @param snapshots The detached body observations to render.
   * @throws {TypeError} If a supplied body uses Rectangle geometry, which this
   * renderer does not support yet.
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

    const radius = this.#bodyDisplayRadius(snapshot);

    this.#context.beginPath();
    this.#context.arc(x, y, radius, 0, Math.PI * 2);
    this.#context.fill();

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

  #bodyDisplayRadius(snapshot: BodySnapshot): number {
    const shape = snapshot.definition.shape;

    if (shape === undefined) {
      return this.#bodyRadius;
    }

    if (shape instanceof Circle) {
      return shape.radius * this.#transform.pixelsPerUnit;
    }

    throw new TypeError("CanvasKinematicRenderer does not support Rectangle geometry yet.");
  }
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
