import { type BodySnapshot, Rectangle } from "../../engine/mod.ts";
import type { InspectionOptions, InspectionStyle } from "./inspection-options.ts";
import { ViewportTransform } from "../viewport/viewport-transform.ts";

interface CanvasInspectionDrawingContext {
  beginPath(): void;

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
 * configuration and can later consume launch-time, runtime-edited, or restored
 * settings without changing its drawing responsibilities.
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
   * Geometry contours follow domain geometry and viewport scale. Body-origin
   * and orientation glyphs use configured display-space dimensions so they
   * remain readable while zooming.
   *
   * Velocity vectors represent the displacement implied by the current
   * velocity over the configured projection time. Their shaft therefore scales
   * with world velocity and viewport scale, while the arrowhead remains a
   * configured display-space glyph. Vectors shorter than the configured
   * minimum visible display length are omitted without changing the underlying
   * BodyState velocity.
   *
   * A shapeless Body has no geometry contour. Its Body origin and velocity are
   * still meaningful, but orientation is not visualized until concrete
   * geometry provides a useful local frame to inspect.
   *
   * Each indicator resolves its own optional style override against
   * options.defaultStyle immediately before drawing.
   *
   * @param snapshots Detached Body observations to inspect.
   * @param options Renderer-neutral inspection configuration for this frame.
   */
  public render(snapshots: readonly BodySnapshot[], options: InspectionOptions): void {
    if (
      !options.geometryContour.visible &&
      !options.bodyOrigin.visible &&
      !options.orientation.visible &&
      !options.velocity.visible
    ) {
      return;
    }

    this.#context.save();

    for (const snapshot of snapshots) {
      this.#renderBody(snapshot, options);
    }

    this.#context.restore();
  }

  #renderBody(snapshot: BodySnapshot, options: InspectionOptions): void {
    const x = this.#transform.worldToDisplayX(snapshot.state.position.x);
    const y = this.#transform.worldToDisplayY(snapshot.state.position.y);

    const shape = snapshot.definition.shape;

    const needsLocalFrame = shape !== undefined &&
      (options.orientation.visible || options.geometryContour.visible);

    if (needsLocalFrame) {
      this.#context.save();
      this.#context.translate(x, y);

      // BodyState.orientation is positive counter-clockwise in mathematical
      // world space. Canvas display Y points downward, so the equivalent
      // display-space frame uses the negated angle.
      this.#context.rotate(-snapshot.state.orientation);

      if (options.geometryContour.visible) {
        this.#applyStyle(options.defaultStyle, options.geometryContour.style);

        if (shape instanceof Rectangle) {
          const width = shape.width * this.#transform.pixelsPerUnit;
          const height = shape.height * this.#transform.pixelsPerUnit;

          this.#context.strokeRect(-width / 2, -height / 2, width, height);
        } else {
          const radius = shape.radius * this.#transform.pixelsPerUnit;

          this.#context.beginPath();
          this.#context.arc(0, 0, radius, 0, Math.PI * 2);
          this.#context.stroke();
        }
      }

      if (options.orientation.visible) {
        this.#applyStyle(options.defaultStyle, options.orientation.style);

        // The Body-local +X axis is local 0°. Drawing along +X inside the
        // already-rotated local frame makes orientation visible without
        // introducing angle trigonometry or an arrow semantic.
        this.#strokeLine(0, 0, options.orientation.length, 0);
      }

      this.#context.restore();
    }

    if (options.velocity.visible) {
      this.#applyStyle(options.defaultStyle, options.velocity.style);
      this.#renderVelocity(snapshot, x, y, options);
    }

    if (options.bodyOrigin.visible) {
      this.#applyStyle(options.defaultStyle, options.bodyOrigin.style);

      // BodyState.position locates the Body's local origin in world space.
      // It coincides with the geometric center for today's centered Circle and
      // Rectangle definitions, but it must not be confused with a future
      // centroid or center of mass.
      this.#context.beginPath();
      this.#context.arc(x, y, options.bodyOrigin.radius, 0, Math.PI * 2);
      this.#context.stroke();
    }
  }

  #renderVelocity(
    snapshot: BodySnapshot,
    startX: number,
    startY: number,
    options: InspectionOptions,
  ): void {
    const endWorldX = snapshot.state.position.x +
      snapshot.state.velocity.x * options.velocity.projectionTime;
    const endWorldY = snapshot.state.position.y +
      snapshot.state.velocity.y * options.velocity.projectionTime;

    const endX = this.#transform.worldToDisplayX(endWorldX);
    const endY = this.#transform.worldToDisplayY(endWorldY);

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;
    const minimumVisibleLengthSquared = options.velocity.minimumVisibleLength *
      options.velocity.minimumVisibleLength;

    // Visibility is deliberately a display-space concern. A Body may still be
    // physically moving even when zoom makes its velocity vector too small to
    // communicate usefully on screen.
    if (lengthSquared < minimumVisibleLengthSquared) {
      return;
    }

    const length = Math.sqrt(lengthSquared);
    const directionX = deltaX / length;
    const directionY = deltaY / length;

    // Build the fixed-size arrowhead directly from the display-space direction
    // and its perpendicular. The shaft keeps physical/world scaling while the
    // arrowhead remains a readable presentation glyph.
    const baseX = endX - directionX * options.velocity.arrowheadSize;
    const baseY = endY - directionY * options.velocity.arrowheadSize;

    const halfWidth = options.velocity.arrowheadSize / 2;
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
