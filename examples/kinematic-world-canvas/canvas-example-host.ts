import type {
  BodyId,
  BodyPicker,
  BodySnapshot,
  CanvasKinematicRenderer,
  ViewportTransform,
  World,
} from "../../src/mod.ts";

const MIN_VIEWPORT_SCALE = 10;
const MAX_VIEWPORT_SCALE = 200;
const ZOOM_SENSITIVITY = 0.002;

const CLICK_MOVEMENT_TOLERANCE = 4;

/**
 * Owns browser interaction and presentation state for the Canvas example.
 *
 * This host is intentionally example-local. It coordinates DOM events,
 * inspection outputs, picking, hover, selection, viewport interaction, and
 * rendering without turning those policies into reusable Runtime or engine
 * abstractions.
 */
export class CanvasExampleHost {
  readonly #canvas: HTMLCanvasElement;
  readonly #world: World;
  readonly #viewport: ViewportTransform;
  readonly #picker: BodyPicker;
  readonly #renderer: CanvasKinematicRenderer;

  readonly #coordinateOutput: HTMLOutputElement;
  readonly #bodyOutput: HTMLOutputElement;
  readonly #selectedBodyOutput: HTMLOutputElement;
  readonly #selectedBodyPositionOutput: HTMLOutputElement;
  readonly #selectedBodyVelocityOutput: HTMLOutputElement;

  #renderedSnapshots: readonly BodySnapshot[];

  #activePointerId: number | undefined;
  #previousPointerX = 0;
  #previousPointerY = 0;

  #hoveredBodyId: BodyId | undefined;
  #selectedBodyId: BodyId | undefined;

  #pointerClientX: number | undefined;
  #pointerClientY: number | undefined;

  #pointerDownX = 0;
  #pointerDownY = 0;
  #pointerMovedBeyondClickTolerance = false;

  public constructor(
    canvas: HTMLCanvasElement,
    world: World,
    viewport: ViewportTransform,
    picker: BodyPicker,
    renderer: CanvasKinematicRenderer,
  ) {
    this.#canvas = canvas;
    this.#world = world;
    this.#viewport = viewport;
    this.#picker = picker;
    this.#renderer = renderer;

    const document = canvas.ownerDocument;

    this.#coordinateOutput = requireOutput(
      document,
      "#pointer-world-coordinate",
      "Pointer world-coordinate output",
    );

    this.#bodyOutput = requireOutput(document, "#pointer-body", "Pointer body output");

    this.#selectedBodyOutput = requireOutput(
      document,
      "#selected-body",
      "Selected body output",
    );

    this.#selectedBodyPositionOutput = requireOutput(
      document,
      "#selected-body-position",
      "Selected body position output",
    );

    this.#selectedBodyVelocityOutput = requireOutput(
      document,
      "#selected-body-velocity",
      "Selected body velocity output",
    );

    this.#renderedSnapshots = world.getBodySnapshots();

    this.#attachInteractionHandlers();
  }

  /**
   * Observes the latest World state, refreshes host inspection state, and
   * renders one Canvas frame.
   */
  public renderFrame(): void {
    this.#renderedSnapshots = this.#world.getBodySnapshots();

    this.#refreshPointerInspection();
    this.#refreshSelectedBodyInspection();

    this.#renderer.render(this.#renderedSnapshots, this.#hoveredBodyId, this.#selectedBodyId);
  }

  // Wires browser input events to the example's interaction handlers.
  #attachInteractionHandlers(): void {
    this.#canvas.addEventListener("pointerdown", (event) => {
      this.#handlePointerDown(event);
    });

    this.#canvas.addEventListener("pointerup", (event) => {
      this.#handlePointerUp(event);
    });

    this.#canvas.addEventListener("pointercancel", (event) => {
      this.#endPointerDrag(event.pointerId);
    });

    this.#canvas.addEventListener("lostpointercapture", (event) => {
      this.#endPointerDrag(event.pointerId);
    });

    this.#canvas.addEventListener("pointermove", (event) => {
      this.#handlePointerMove(event);
    });

    this.#canvas.addEventListener("pointerleave", () => {
      this.#clearPointerInspection();
    });

    this.#canvas.addEventListener(
      "wheel",
      (event) => {
        this.#handleWheel(event);
      },
      { passive: false },
    );
  }

  // Starts a primary-pointer interaction as a possible click or drag.
  #handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.#activePointerId !== undefined) {
      return;
    }

    this.#activePointerId = event.pointerId;

    this.#previousPointerX = event.clientX;
    this.#previousPointerY = event.clientY;

    this.#pointerDownX = event.clientX;
    this.#pointerDownY = event.clientY;
    this.#pointerMovedBeyondClickTolerance = false;

    this.#canvas.setPointerCapture(event.pointerId);
  }

  // Turns a click-like pointer release into body selection.
  #handlePointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.#activePointerId) {
      return;
    }

    if (!this.#pointerMovedBeyondClickTolerance) {
      const display = this.#clientToDisplayCoordinates(event.clientX, event.clientY);

      this.#setSelectedBody(
        this.#picker.findBodyAtDisplayPoint(this.#renderedSnapshots, display.x, display.y),
      );
    }
  }

  // Pans the viewport during drag and refreshes pointer inspection.
  #handlePointerMove(event: PointerEvent): void {
    if (event.pointerId === this.#activePointerId) {
      const deltaClientX = event.clientX - this.#previousPointerX;
      const deltaClientY = event.clientY - this.#previousPointerY;

      this.#previousPointerX = event.clientX;
      this.#previousPointerY = event.clientY;

      const totalDeltaX = event.clientX - this.#pointerDownX;
      const totalDeltaY = event.clientY - this.#pointerDownY;

      const movementSquared = totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY;

      if (movementSquared > CLICK_MOVEMENT_TOLERANCE * CLICK_MOVEMENT_TOLERANCE) {
        this.#pointerMovedBeyondClickTolerance = true;
      }

      const bounds = this.#canvas.getBoundingClientRect();

      const deltaDisplayX = (deltaClientX * this.#canvas.width) / bounds.width;
      const deltaDisplayY = (deltaClientY * this.#canvas.height) / bounds.height;

      this.#viewport.panByDisplayDelta(deltaDisplayX, deltaDisplayY);
    }

    this.#updatePointerInspection(event.clientX, event.clientY);
  }

  // Normalizes wheel input and applies bounded pointer-anchored zoom.
  #handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const display = this.#clientToDisplayCoordinates(event.clientX, event.clientY);

    const wheelDelta = this.#normalizeWheelDelta(event);
    const zoomFactor = Math.exp(-wheelDelta * ZOOM_SENSITIVITY);
    const requestedScale = this.#viewport.pixelsPerUnit * zoomFactor;

    const nextScale = Math.min(
      MAX_VIEWPORT_SCALE,
      Math.max(MIN_VIEWPORT_SCALE, requestedScale),
    );

    this.#viewport.setPixelsPerUnitAroundDisplayPoint(nextScale, display.x, display.y);

    this.#updatePointerInspection(event.clientX, event.clientY);
  }

  // Stores selected identity and refreshes the read-only inspector.
  #setSelectedBody(bodyId: BodyId | undefined): void {
    this.#selectedBodyId = bodyId;

    this.#selectedBodyOutput.value = bodyId === undefined
      ? "Selected: —"
      : `Selected: ${bodyId}`;

    this.#refreshSelectedBodyInspection();
  }

  // Stops drag tracking for the active pointer.
  #endPointerDrag(pointerId: number): void {
    if (pointerId === this.#activePointerId) {
      this.#activePointerId = undefined;
    }
  }

  // Converts browser CSS coordinates to Canvas drawing-buffer coordinates.
  #clientToDisplayCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    const bounds = this.#canvas.getBoundingClientRect();

    return {
      x: ((clientX - bounds.left) * this.#canvas.width) / bounds.width,
      y: ((clientY - bounds.top) * this.#canvas.height) / bounds.height,
    };
  }

  // Normalizes wheel delta modes into pixel-like host units.
  #normalizeWheelDelta(event: WheelEvent): number {
    switch (event.deltaMode) {
      case WheelEvent.DOM_DELTA_LINE:
        return event.deltaY * 16;

      case WheelEvent.DOM_DELTA_PAGE:
        return event.deltaY * this.#canvas.getBoundingClientRect().height;

      default:
        return event.deltaY;
    }
  }

  // Updates coordinate and hovered-body readouts for a pointer position.
  #updatePointerInspection(clientX: number, clientY: number): void {
    this.#pointerClientX = clientX;
    this.#pointerClientY = clientY;

    const display = this.#clientToDisplayCoordinates(clientX, clientY);

    const worldX = this.#viewport.displayToWorldX(display.x);
    const worldY = this.#viewport.displayToWorldY(display.y);

    this.#coordinateOutput.value = `World: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`;

    this.#hoveredBodyId = this.#picker.findBodyAtDisplayPoint(
      this.#renderedSnapshots,
      display.x,
      display.y,
    );

    this.#bodyOutput.value = this.#hoveredBodyId === undefined
      ? "Body: —"
      : `Body: ${this.#hoveredBodyId}`;
  }

  // Re-resolves hover against the latest rendered snapshots.
  #refreshPointerInspection(): void {
    if (this.#pointerClientX === undefined || this.#pointerClientY === undefined) {
      this.#hoveredBodyId = undefined;
      return;
    }

    this.#updatePointerInspection(this.#pointerClientX, this.#pointerClientY);
  }

  // Clears transient pointer position, hover, and readouts.
  #clearPointerInspection(): void {
    this.#pointerClientX = undefined;
    this.#pointerClientY = undefined;
    this.#hoveredBodyId = undefined;

    this.#coordinateOutput.value = "World: —";
    this.#bodyOutput.value = "Body: —";
  }

  // Resolves persistent selection against the latest snapshots.
  #refreshSelectedBodyInspection(): void {
    if (this.#selectedBodyId === undefined) {
      this.#selectedBodyPositionOutput.value = "Position: —";
      this.#selectedBodyVelocityOutput.value = "Velocity: —";
      return;
    }

    const snapshot = this.#renderedSnapshots.find(({ id }) => id === this.#selectedBodyId);

    if (snapshot === undefined) {
      this.#selectedBodyPositionOutput.value = "Position: —";
      this.#selectedBodyVelocityOutput.value = "Velocity: —";
      return;
    }

    const { position, velocity } = snapshot.state;

    this.#selectedBodyPositionOutput.value = `Position: (${position.x.toFixed(2)}, ${
      position.y.toFixed(
        2,
      )
    })`;

    this.#selectedBodyVelocityOutput.value = `Velocity: (${velocity.x.toFixed(2)}, ${
      velocity.y.toFixed(
        2,
      )
    })`;
  }
}

// Resolves a required output element or fails early during host construction.
function requireOutput(
  document: Document,
  selector: string,
  description: string,
): HTMLOutputElement {
  const output = document.querySelector<HTMLOutputElement>(selector);

  if (output === null) {
    throw new Error(`${description} was not found.`);
  }

  return output;
}
