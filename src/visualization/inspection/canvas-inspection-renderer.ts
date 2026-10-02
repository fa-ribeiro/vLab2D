import {
  type BodyCollision,
  type BodyShape,
  type BodySnapshot,
  Circle,
  type Collision,
  computeShapeAabb,
  Rectangle,
  RegularPolygon,
} from "../../engine/mod.ts";
import type { InspectionOptions, InspectionStyle } from "./inspection-options.ts";
import { ViewportTransform } from "../viewport/viewport-transform.ts";

interface CanvasInspectionDrawingContext {
  beginPath(): void;

  closePath(): void;

  moveTo(x: number, y: number): void;

  lineTo(x: number, y: number): void;

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;

  stroke(): void;

  strokeRect(x: number, y: number, width: number, height: number): void;

  save(): void;

  restore(): void;

  translate(x: number, y: number): void;

  rotate(angle: number): void;

  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
}

/**
 * Draws optional diagnostic overlays for detached Body observations.
 *
 * The inspection renderer does not clear the drawing surface and therefore
 * composes on top of normal Canvas rendering. It observes the same shared
 * ViewportTransform as the normal renderer so inspection geometry remains
 * spatially aligned with the visible scene.
 *
 * Inspection policy and presentation values arrive as plain InspectionOptions
 * on every render call. The renderer therefore owns no persistent user
 * configuration.
 */
export class CanvasInspectionRenderer {
  readonly #context: CanvasInspectionDrawingContext;
  readonly #transform: ViewportTransform;

  /**
   * Creates a Canvas inspection renderer.
   *
   * @param context The Canvas-like drawing context used for inspection overlays.
   * @param transform The shared world-to-display viewport transform.
   */
  public constructor(context: CanvasInspectionDrawingContext, transform: ViewportTransform) {
    this.#context = context;
    this.#transform = transform;
  }

  /**
   * Draws the enabled inspection indicators for the supplied observations.
   *
   * Geometry contours follow domain geometry. Shapeless presentation markers
   * are deliberately not treated as physical contours. Orientation is shown
   * only when a concrete shape supplies a meaningful local frame.
   *
   * Collision MTV inspection consumes BodyCollision observations supplied by
   * the caller. Pair discovery and narrow-phase detection remain Engine
   * responsibilities; this renderer only turns the supplied result into a
   * display-space diagnostic.
   *
   * @param snapshots Detached Body observations to inspect.
   * @param options Renderer-neutral inspection configuration for this frame.
   * @param bodyCollisions Collision observations produced from the same
   * snapshot set.
   */
  public render(
    snapshots: readonly BodySnapshot[],
    options: InspectionOptions,
    bodyCollisions: readonly BodyCollision[] = [],
  ): void {
    if (
      !options.aabb.visible &&
      !options.geometryContour.visible &&
      !options.bodyOrigin.visible &&
      !options.orientation.visible &&
      !options.velocity.visible &&
      !options.collisionMtv.visible
    ) {
      return;
    }

    this.#context.save();

    for (const snapshot of snapshots) {
      this.#renderBody(snapshot, options);
    }

    if (options.collisionMtv.visible) {
      this.#renderCollisionMtvs(snapshots, bodyCollisions, options);
    }

    this.#context.restore();
  }

  #renderBody(snapshot: BodySnapshot, options: InspectionOptions): void {
    if (options.aabb.visible) {
      this.#renderAabb(snapshot, options);
    }

    if (options.geometryContour.visible) {
      this.#renderGeometryContour(snapshot, options);
    }

    if (options.orientation.visible) {
      this.#renderOrientation(snapshot, options);
    }

    if (options.velocity.visible) {
      this.#renderVelocityIndicator(snapshot, options);
    }

    if (options.bodyOrigin.visible) {
      this.#renderBodyOrigin(snapshot, options);
    }
  }

  #renderAabb(snapshot: BodySnapshot, options: InspectionOptions): void {
    const shape = snapshot.definition.shape;

    // Shapeless Bodies have no physical geometry and therefore no physical
    // broad-phase bounds to inspect.
    if (shape === undefined) {
      return;
    }

    const bounds = computeShapeAabb(shape, snapshot.state.position, snapshot.state.orientation);

    // World +Y maps upward while Canvas +Y maps downward. Therefore the
    // display-space rectangle starts at world maxY and ends at world minY.
    const left = this.#transform.worldToDisplayX(bounds.min.x);
    const right = this.#transform.worldToDisplayX(bounds.max.x);
    const top = this.#transform.worldToDisplayY(bounds.max.y);
    const bottom = this.#transform.worldToDisplayY(bounds.min.y);

    this.#applyStyle(options.defaultStyle, options.aabb.style);
    this.#context.strokeRect(left, top, right - left, bottom - top);
  }

  #renderGeometryContour(snapshot: BodySnapshot, options: InspectionOptions): void {
    const shape = snapshot.definition.shape;

    // A shapeless Body has no domain contour. Its normal circular marker is a
    // presentation fallback and must not be reinterpreted as physical geometry.
    if (shape === undefined) {
      return;
    }

    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);

    this.#applyStyle(options.defaultStyle, options.geometryContour.style);

    this.#context.save();
    this.#context.translate(x, y);
    this.#context.rotate(-snapshot.state.orientation);

    this.#strokeGeometryContour(shape);

    this.#context.restore();
  }

  #strokeGeometryContour(shape: BodyShape): void {
    if (shape instanceof Circle) {
      const radius = shape.radius * this.#transform.pixelsPerUnit;

      this.#context.beginPath();
      this.#context.arc(0, 0, radius, 0, Math.PI * 2);
      this.#context.stroke();
      return;
    }

    if (shape instanceof Rectangle) {
      const width = shape.width * this.#transform.pixelsPerUnit;
      const height = shape.height * this.#transform.pixelsPerUnit;

      this.#context.strokeRect(-width / 2, -height / 2, width, height);
      return;
    }

    if (shape instanceof RegularPolygon) {
      this.#traceRegularPolygon(shape);
      this.#context.stroke();
      return;
    }

    shape satisfies never;
  }

  #renderOrientation(snapshot: BodySnapshot, options: InspectionOptions): void {
    if (snapshot.definition.shape === undefined) {
      return;
    }

    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);

    this.#applyStyle(options.defaultStyle, options.orientation.style);

    this.#context.save();
    this.#context.translate(x, y);
    this.#context.rotate(-snapshot.state.orientation);

    // The Body-local +X axis is local 0°. Drawing along +X inside the rotated
    // local frame makes orientation visible without inventing an arrow semantic.
    this.#strokeLine(0, 0, options.orientation.length, 0);

    this.#context.restore();
  }

  #renderVelocityIndicator(snapshot: BodySnapshot, options: InspectionOptions): void {
    const startX = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const startY = this.#transform.worldToDisplayY(snapshot.state.position.y);

    const endWorldX = snapshot.state.position.x +
      snapshot.state.velocity.x * options.velocity.projectionTime;
    const endWorldY = snapshot.state.position.y +
      snapshot.state.velocity.y * options.velocity.projectionTime;

    const endX = this.#transform.worldToDisplayX(endWorldX);
    const endY = this.#transform.worldToDisplayY(endWorldY);

    if (
      !this.#isArrowVisible(startX, startY, endX, endY, options.velocity.minimumVisibleLength)
    ) {
      return;
    }

    this.#applyStyle(options.defaultStyle, options.velocity.style);
    this.#strokeArrow(startX, startY, endX, endY, options.velocity.arrowheadSize);
  }

  #renderBodyOrigin(snapshot: BodySnapshot, options: InspectionOptions): void {
    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);

    this.#applyStyle(options.defaultStyle, options.bodyOrigin.style);

    // BodyState.position locates the Body's local origin in world space. It
    // must not be confused with a future centroid or center of mass.
    this.#context.beginPath();
    this.#context.arc(x, y, options.bodyOrigin.radius, 0, Math.PI * 2);
    this.#context.stroke();
  }

  #renderCollisionMtvs(
    snapshots: readonly BodySnapshot[],
    bodyCollisions: readonly BodyCollision[],
    options: InspectionOptions,
  ): void {
    const snapshotsById = new Map(
      snapshots.map((snapshot) => [snapshot.id, snapshot] as const),
    );

    for (const bodyCollision of bodyCollisions) {
      // Collision observations are expected to come from this same snapshot
      // set. Ignore stale/mismatched observations rather than inventing a
      // position for a body that is not currently being rendered.
      if (!snapshotsById.has(bodyCollision.bodyAId)) {
        continue;
      }

      const snapshotB = snapshotsById.get(bodyCollision.bodyBId);

      if (snapshotB === undefined) {
        continue;
      }

      this.#renderCollisionMtv(snapshotB, bodyCollision.collision, options);
    }
  }

  #renderCollisionMtv(
    snapshotB: BodySnapshot,
    collision: Collision,
    options: InspectionOptions,
  ): void {
    const startX = this.#transform.worldToDisplayX(snapshotB.state.position.x);
    const startY = this.#transform.worldToDisplayY(snapshotB.state.position.y);

    // Collision.normal is the minimum-separation direction for B relative to A.
    // Extending from B by penetrationDepth therefore visualizes the exact MTV.
    const endWorldX = snapshotB.state.position.x +
      collision.normal.x * collision.penetrationDepth;
    const endWorldY = snapshotB.state.position.y +
      collision.normal.y * collision.penetrationDepth;

    const endX = this.#transform.worldToDisplayX(endWorldX);
    const endY = this.#transform.worldToDisplayY(endWorldY);

    if (
      !this.#isArrowVisible(
        startX,
        startY,
        endX,
        endY,
        options.collisionMtv.minimumVisibleLength,
      )
    ) {
      return;
    }

    this.#applyStyle(options.defaultStyle, options.collisionMtv.style);
    this.#strokeArrow(startX, startY, endX, endY, options.collisionMtv.arrowheadSize);
  }

  #traceRegularPolygon(shape: RegularPolygon): void {
    const first = shape.vertices[0];

    this.#context.beginPath();
    this.#context.moveTo(
      first.x * this.#transform.pixelsPerUnit,
      -first.y * this.#transform.pixelsPerUnit,
    );

    for (let index = 1; index < shape.vertices.length; index++) {
      const vertex = shape.vertices[index];

      this.#context.lineTo(
        vertex.x * this.#transform.pixelsPerUnit,
        -vertex.y * this.#transform.pixelsPerUnit,
      );
    }

    this.#context.closePath();
  }

  #isArrowVisible(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    minimumVisibleLength: number,
  ): boolean {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;

    if (lengthSquared === 0) {
      return false;
    }

    return lengthSquared >= minimumVisibleLength * minimumVisibleLength;
  }

  #strokeArrow(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    arrowheadSize: number,
  ): void {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const directionX = deltaX / length;
    const directionY = deltaY / length;

    const baseX = endX - directionX * arrowheadSize;
    const baseY = endY - directionY * arrowheadSize;

    const halfWidth = arrowheadSize / 2;
    const perpendicularX = -directionY * halfWidth;
    const perpendicularY = directionX * halfWidth;

    this.#context.beginPath();

    this.#context.moveTo(startX, startY);
    this.#context.lineTo(endX, endY);

    this.#context.moveTo(endX, endY);
    this.#context.lineTo(baseX + perpendicularX, baseY + perpendicularY);

    this.#context.moveTo(endX, endY);
    this.#context.lineTo(baseX - perpendicularX, baseY - perpendicularY);

    this.#context.stroke();
  }

  #applyStyle(
    defaultStyle: InspectionStyle,
    override: Partial<InspectionStyle> | undefined,
  ): void {
    this.#context.strokeStyle = override?.color ?? defaultStyle.color;
    this.#context.lineWidth = override?.lineWidth ?? defaultStyle.lineWidth;
  }

  #strokeLine(x1: number, y1: number, x2: number, y2: number): void {
    this.#context.beginPath();
    this.#context.moveTo(x1, y1);
    this.#context.lineTo(x2, y2);
    this.#context.stroke();
  }
}
