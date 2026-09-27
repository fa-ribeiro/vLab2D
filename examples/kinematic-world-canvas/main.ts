import {
  KinematicState,
  KinematicWorld,
  SemiImplicitEulerIntegrator,
  Vector2,
} from "../../src/engine/mod.ts";
import { CanvasKinematicRenderer } from "../../src/visualization/canvas-kinematic-renderer.ts";

const canvas = document.querySelector<HTMLCanvasElement>("#simulation");

if (canvas === null) {
  throw new Error("Simulation canvas was not found.");
}

const context = canvas.getContext("2d");

if (context === null) {
  throw new Error("Canvas 2D rendering is not available.");
}

const world = new KinematicWorld(new Vector2(0, -1), new SemiImplicitEulerIntegrator());

world.createBody(new KinematicState(new Vector2(-4, 3), new Vector2(1, 2)));

world.createBody(new KinematicState(new Vector2(0, 5), new Vector2(0, 0)));

world.createBody(new KinematicState(new Vector2(4, 2), new Vector2(-1, 2)));

const renderer = new CanvasKinematicRenderer(context, canvas.width, canvas.height, 40, 6);

const timestep = 1 / 60;

function frame(): void {
  world.step(timestep);

  renderer.render(world.getBodySnapshots());

  requestAnimationFrame(frame);
}

renderer.render(world.getBodySnapshots());
requestAnimationFrame(frame);
