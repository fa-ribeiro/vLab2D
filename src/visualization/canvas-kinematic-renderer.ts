import type { KinematicBodySnapshot } from "../engine/mod.ts";
import { ViewportTransform } from "./viewport-transform.ts";

interface CanvasDrawingContext {
  clearRect(x: number, y: number, width: number, height: number): void;

  beginPath(): void;

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;

  fill(): void;
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
}
