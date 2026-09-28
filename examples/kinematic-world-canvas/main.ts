import {
  Body,
  type BodyId,
  SemiImplicitEulerIntegrator,
  Vector2,
  World,
} from "../../src/engine/mod.ts";
import { CanvasKinematicRenderer } from "../../src/visualization/canvas-kinematic-renderer.ts";

const MIN_VIEWPORT_SCALE = 10;
const MAX_VIEWPORT_SCALE = 200;
const ZOOM_SENSITIVITY = 0.002;

const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_DELTA = 0.25;

const CLICK_MOVEMENT_TOLERANCE = 4;

const canvasElement = document.querySelector<HTMLCanvasElement>("#simulation");
if (canvasElement === null) {
  throw new Error("Simulation canvas was not found.");
}
const canvas: HTMLCanvasElement = canvasElement;

const context = canvas.getContext("2d");
if (context === null) {
  throw new Error("Canvas 2D rendering is not available.");
}

const coordinateOutputElement = document.querySelector<HTMLOutputElement>(
  "#pointer-world-coordinate",
);
if (coordinateOutputElement === null) {
  throw new Error("Pointer world-coordinate output was not found.");
}
const coordinateOutput: HTMLOutputElement = coordinateOutputElement;

const bodyOutputElement = document.querySelector<HTMLOutputElement>("#pointer-body");
if (bodyOutputElement === null) {
  throw new Error("Pointer body output was not found.");
}
const bodyOutput: HTMLOutputElement = bodyOutputElement;

const selectedBodyOutputElement = document.querySelector<HTMLOutputElement>("#selected-body");
if (selectedBodyOutputElement === null) {
  throw new Error("Selected body output was not found.");
}
const selectedBodyOutput: HTMLOutputElement = selectedBodyOutputElement;

const selectedBodyPositionOutputElement = document.querySelector<HTMLOutputElement>(
  "#selected-body-position",
);
if (selectedBodyPositionOutputElement === null) {
  throw new Error("Selected body position output was not found.");
}
const selectedBodyPositionOutput: HTMLOutputElement = selectedBodyPositionOutputElement;

const selectedBodyVelocityOutputElement = document.querySelector<HTMLOutputElement>(
  "#selected-body-velocity",
);
if (selectedBodyVelocityOutputElement === null) {
  throw new Error("Selected body velocity output was not found.");
}
const selectedBodyVelocityOutput: HTMLOutputElement = selectedBodyVelocityOutputElement;

const world = new World(new Vector2(0, -1), new SemiImplicitEulerIntegrator());

const particle = new Body();

world.addBody(particle, { position: new Vector2(-4, 3), velocity: new Vector2(1, 2) });

world.addBody(particle, { position: new Vector2(0, 5) });

world.addBody(particle, { position: new Vector2(4, 2), velocity: new Vector2(-1, 2) });

const renderer = new CanvasKinematicRenderer(context, canvas.width, canvas.height, 40, 6);

renderer.setViewportCenter(3, 2);
renderer.setViewportScale(25);

let renderedSnapshots = world.getBodySnapshots();

let activePointerId: number | undefined;
let previousPointerX = 0;
let previousPointerY = 0;

let hoveredBodyId: BodyId | undefined;
let selectedBodyId: BodyId | undefined;

let pointerClientX: number | undefined;
let pointerClientY: number | undefined;

let pointerDownX = 0;
let pointerDownY = 0;
let pointerMovedBeyondClickTolerance = false;

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || activePointerId !== undefined) {
    return;
  }

  activePointerId = event.pointerId;

  previousPointerX = event.clientX;
  previousPointerY = event.clientY;

  pointerDownX = event.clientX;
  pointerDownY = event.clientY;
  pointerMovedBeyondClickTolerance = false;

  canvas.setPointerCapture(event.pointerId);
});

function setSelectedBody(bodyId: BodyId | undefined): void {
  selectedBodyId = bodyId;

  selectedBodyOutput.value = bodyId === undefined ? "Selected: —" : `Selected: ${bodyId}`;

  refreshSelectedBodyInspection();
}

function endPointerDrag(pointerId: number): void {
  if (pointerId === activePointerId) {
    activePointerId = undefined;
  }
}

canvas.addEventListener("pointerup", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  if (!pointerMovedBeyondClickTolerance) {
    const display = clientToDisplayCoordinates(event.clientX, event.clientY);

    setSelectedBody(renderer.findBodyAtDisplayPoint(renderedSnapshots, display.x, display.y));
  }
});

canvas.addEventListener("pointercancel", (event) => {
  endPointerDrag(event.pointerId);
});

canvas.addEventListener("lostpointercapture", (event) => {
  endPointerDrag(event.pointerId);
});

function clientToDisplayCoordinates(
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: ((clientX - bounds.left) * canvas.width) / bounds.width,
    y: ((clientY - bounds.top) * canvas.height) / bounds.height,
  };
}

function normalizeWheelDelta(event: WheelEvent): number {
  switch (event.deltaMode) {
    case WheelEvent.DOM_DELTA_LINE:
      return event.deltaY * 16;

    case WheelEvent.DOM_DELTA_PAGE:
      return event.deltaY * canvas.getBoundingClientRect().height;

    default:
      return event.deltaY;
  }
}

function updatePointerInspection(clientX: number, clientY: number): void {
  pointerClientX = clientX;
  pointerClientY = clientY;

  const display = clientToDisplayCoordinates(clientX, clientY);

  const worldX = renderer.displayToWorldX(display.x);
  const worldY = renderer.displayToWorldY(display.y);

  coordinateOutput.value = `World: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`;

  hoveredBodyId = renderer.findBodyAtDisplayPoint(renderedSnapshots, display.x, display.y);

  bodyOutput.value = hoveredBodyId === undefined ? "Body: —" : `Body: ${hoveredBodyId}`;
}

function refreshPointerInspection(): void {
  if (pointerClientX === undefined || pointerClientY === undefined) {
    hoveredBodyId = undefined;
    return;
  }

  updatePointerInspection(pointerClientX, pointerClientY);
}

function clearPointerInspection(): void {
  pointerClientX = undefined;
  pointerClientY = undefined;
  hoveredBodyId = undefined;

  coordinateOutput.value = "World: —";
  bodyOutput.value = "Body: —";
}

function refreshSelectedBodyInspection(): void {
  if (selectedBodyId === undefined) {
    selectedBodyPositionOutput.value = "Position: —";

    selectedBodyVelocityOutput.value = "Velocity: —";

    return;
  }

  const snapshot = renderedSnapshots.find(({ id }) => id === selectedBodyId);

  if (snapshot === undefined) {
    selectedBodyPositionOutput.value = "Position: —";

    selectedBodyVelocityOutput.value = "Velocity: —";

    return;
  }

  const { position, velocity } = snapshot.state;

  selectedBodyPositionOutput.value = `Position: (${position.x.toFixed(2)}, ${position.y.toFixed(
    2,
  )})`;

  selectedBodyVelocityOutput.value = `Velocity: (${velocity.x.toFixed(2)}, ${velocity.y.toFixed(
    2,
  )})`;
}

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId === activePointerId) {
    const deltaClientX = event.clientX - previousPointerX;
    const deltaClientY = event.clientY - previousPointerY;

    previousPointerX = event.clientX;
    previousPointerY = event.clientY;

    const totalDeltaX = event.clientX - pointerDownX;
    const totalDeltaY = event.clientY - pointerDownY;

    const movementSquared = totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY;

    if (movementSquared > CLICK_MOVEMENT_TOLERANCE * CLICK_MOVEMENT_TOLERANCE) {
      pointerMovedBeyondClickTolerance = true;
    }

    const bounds = canvas.getBoundingClientRect();

    const deltaDisplayX = (deltaClientX * canvas.width) / bounds.width;

    const deltaDisplayY = (deltaClientY * canvas.height) / bounds.height;

    renderer.panViewportBy(deltaDisplayX, deltaDisplayY);
  }

  updatePointerInspection(event.clientX, event.clientY);
});

canvas.addEventListener("pointerleave", () => {
  clearPointerInspection();
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    const display = clientToDisplayCoordinates(event.clientX, event.clientY);

    const wheelDelta = normalizeWheelDelta(event);

    const zoomFactor = Math.exp(-wheelDelta * ZOOM_SENSITIVITY);

    const requestedScale = renderer.viewportScale * zoomFactor;

    const nextScale = Math.min(
      MAX_VIEWPORT_SCALE,
      Math.max(MIN_VIEWPORT_SCALE, requestedScale),
    );

    renderer.setViewportScaleAroundDisplayPoint(nextScale, display.x, display.y);
    updatePointerInspection(event.clientX, event.clientY);
  },
  { passive: false },
);

let previousTimestamp: number | undefined;
let accumulator = 0;

function frame(timestamp: number): void {
  if (previousTimestamp === undefined) {
    previousTimestamp = timestamp;
    requestAnimationFrame(frame);
    return;
  }

  const frameDelta = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  // Avoid attempting to simulate a very large backlog after the browser
  // suspends or heavily delays animation frames.
  accumulator += Math.min(frameDelta, MAX_FRAME_DELTA);

  while (accumulator >= FIXED_TIMESTEP) {
    world.step(FIXED_TIMESTEP);
    accumulator -= FIXED_TIMESTEP;
  }

  renderedSnapshots = world.getBodySnapshots();

  refreshPointerInspection();
  refreshSelectedBodyInspection();

  renderer.render(renderedSnapshots, hoveredBodyId, selectedBodyId);
  requestAnimationFrame(frame);
}

renderer.render(renderedSnapshots, hoveredBodyId, selectedBodyId);
requestAnimationFrame(frame);
