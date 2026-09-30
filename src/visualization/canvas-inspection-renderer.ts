import { type BodySnapshot, Rectangle } from "../engine/mod.ts";
import type { InspectionOptions } from "./inspection-options.ts";
import { ViewportTransform } from "./viewport-transform.ts";

const BODY_ORIGIN_RADIUS = 3;
const ORIENTATION_LINE_LENGTH = 18;

const INSPECTION_STROKE_STYLE = "#d97706";
const INSPECTION_LINE_WIDTH = 1.5;

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
   * and orientation glyphs use fixed display-space dimensions so they remain
   * readable while zooming.
   *
   * A shapeless Body has no geometry contour. Its Body origin is still
   * meaningful, but orientation is not visualized until concrete geometry
   * provides a useful local frame to inspect.
   *
   * @param snapshots Detached Body observations to inspect.
   * @param options Renderer-neutral indicator visibility options.
   */
  public render(snapshots: readonly BodySnapshot[], options: InspectionOptions): void {
    if (!options.showGeometryContour && !options.showBodyOrigin && !options.showOrientation) {
      return;
    }

    this.#context.save();
    this.#context.strokeStyle = INSPECTION_STROKE_STYLE;
    this.#context.lineWidth = INSPECTION_LINE_WIDTH;

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
      (options.showOrientation || options.showGeometryContour);

    if (needsLocalFrame) {
      this.#context.save();
      this.#context.translate(x, y);

      // BodyState.orientation is positive counter-clockwise in mathematical
      // world space. Canvas display Y points downward, so the equivalent
      // display-space frame uses the negated angle.
      this.#context.rotate(-snapshot.state.orientation);

      if (options.showGeometryContour) {
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

      if (options.showOrientation) {
        // The Body-local +X axis is local 0°. Drawing along +X inside the
        // already-rotated local frame makes orientation visible without
        // introducing angle trigonometry or an arrow semantic.
        this.#strokeLine(0, 0, ORIENTATION_LINE_LENGTH, 0);
      }

      this.#context.restore();
    }

    if (options.showBodyOrigin) {
      // BodyState.position locates the Body's local origin in world space.
      // It coincides with the geometric center for today's centered Circle and
      // Rectangle definitions, but it must not be confused with a future
      // centroid or center of mass.
      this.#context.beginPath();
      this.#context.arc(x, y, BODY_ORIGIN_RADIUS, 0, Math.PI * 2);
      this.#context.stroke();
    }
  }

  #strokeLine(x1: number, y1: number, x2: number, y2: number): void {
    this.#context.beginPath();
    this.#context.moveTo(x1, y1);
    this.#context.lineTo(x2, y2);
    this.#context.stroke();
  }
}
