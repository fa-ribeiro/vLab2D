import {
  Body,
  BrowserSimulationRuntime,
  CanvasKinematicRenderer,
  SemiImplicitEulerIntegrator,
  Simulation,
  Vector2,
  World,
} from "../../src/mod.ts";
import { CanvasExampleHost } from "./canvas-example-host.ts";

const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_DELTA = 0.25;

const canvas = document.querySelector<HTMLCanvasElement>("#simulation");

if (canvas === null) {
  throw new Error("Simulation canvas was not found.");
}

const context = canvas.getContext("2d");

if (context === null) {
  throw new Error("Canvas 2D rendering is not available.");
}

const world = new World(new Vector2(0, -1), new SemiImplicitEulerIntegrator());

const particle = new Body();

world.addBody(particle, { position: new Vector2(-4, 3), velocity: new Vector2(1, 2) });
world.addBody(particle, { position: new Vector2(0, 5) });
world.addBody(particle, { position: new Vector2(4, 2), velocity: new Vector2(-1, 2) });

const simulation = new Simulation([world]);

const renderer = new CanvasKinematicRenderer(context, canvas.width, canvas.height, 40, 6);

renderer.setViewportCenter(3, 2);
renderer.setViewportScale(25);

const host = new CanvasExampleHost(canvas, world, renderer);

const runtime = new BrowserSimulationRuntime(simulation, {
  fixedTimestep: FIXED_TIMESTEP,
  maxFrameDelta: MAX_FRAME_DELTA,
  onFrame: () => host.renderFrame(),
});

runtime.run();
