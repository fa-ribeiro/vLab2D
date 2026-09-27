import {
  KinematicState,
  KinematicWorld,
  SemiImplicitEulerIntegrator,
  Vector2,
} from "../../src/engine/mod.ts";
import { CanvasKinematicRenderer } from "../../src/visualization/canvas-kinematic-renderer.ts";

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

const world = new KinematicWorld(new Vector2(0, -1), new SemiImplicitEulerIntegrator());

world.createBody(new KinematicState(new Vector2(-4, 3), new Vector2(1, 2)));

world.createBody(new KinematicState(new Vector2(0, 5), new Vector2(0, 0)));

world.createBody(new KinematicState(new Vector2(4, 2), new Vector2(-1, 2)));

const renderer = new CanvasKinematicRenderer(context, canvas.width, canvas.height, 40, 6);

renderer.setViewportCenter(3, 2);

let activePointerId: number | undefined;
let previousPointerX = 0;
let previousPointerY = 0;

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || activePointerId !== undefined) {
    return;
  }

  activePointerId = event.pointerId;
  previousPointerX = event.clientX;
  previousPointerY = event.clientY;

  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) {
    return;
  }

  const deltaClientX = event.clientX - previousPointerX;
  const deltaClientY = event.clientY - previousPointerY;

  previousPointerX = event.clientX;
  previousPointerY = event.clientY;

  const bounds = canvas.getBoundingClientRect();

  const deltaDisplayX = (deltaClientX * canvas.width) / bounds.width;
  const deltaDisplayY = (deltaClientY * canvas.height) / bounds.height;

  renderer.panViewportBy(deltaDisplayX, deltaDisplayY);
});

function endPointerDrag(pointerId: number): void {
  if (pointerId === activePointerId) {
    activePointerId = undefined;
  }
}

canvas.addEventListener("pointerup", (event) => {
  endPointerDrag(event.pointerId);
});

canvas.addEventListener("pointercancel", (event) => {
  endPointerDrag(event.pointerId);
});

canvas.addEventListener("lostpointercapture", (event) => {
  endPointerDrag(event.pointerId);
});

function pointerToDisplayCoordinates(event: PointerEvent): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: ((event.clientX - bounds.left) * canvas.width) / bounds.width,
    y: ((event.clientY - bounds.top) * canvas.height) / bounds.height,
  };
}

function updatePointerWorldCoordinate(event: PointerEvent): void {
  const display = pointerToDisplayCoordinates(event);

  const worldX = renderer.displayToWorldX(display.x);
  const worldY = renderer.displayToWorldY(display.y);

  coordinateOutput.value = `World: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`;
}

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerId === activePointerId) {
    const deltaClientX = event.clientX - previousPointerX;
    const deltaClientY = event.clientY - previousPointerY;

    previousPointerX = event.clientX;
    previousPointerY = event.clientY;

    const bounds = canvas.getBoundingClientRect();

    const deltaDisplayX = (deltaClientX * canvas.width) / bounds.width;

    const deltaDisplayY = (deltaClientY * canvas.height) / bounds.height;

    renderer.panViewportBy(deltaDisplayX, deltaDisplayY);
  }

  updatePointerWorldCoordinate(event);
});

const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_DELTA = 0.25;

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

  renderer.render(world.getBodySnapshots());

  requestAnimationFrame(frame);
}

renderer.render(world.getBodySnapshots());
requestAnimationFrame(frame);
