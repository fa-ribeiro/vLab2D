import {
  Body,
  BodyPicker,
  BrowserSimulationRuntime,
  CanvasInspectionRenderer,
  CanvasKinematicRenderer,
  Circle,
  type InspectionOptions,
  Rectangle,
  SemiImplicitEulerIntegrator,
  Simulation,
  Vector2,
  ViewportTransform,
  World,
} from "../../src/mod.ts";
import { CanvasExampleHost } from "./canvas-example-host.ts";

const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_DELTA = 0.25;

const SHAPELESS_BODY_RADIUS = 6;
const PICK_TOLERANCE = 4;

const INSPECTION_OPTIONS: InspectionOptions = {
  showGeometryContour: true,
  showBodyOrigin: true,
  showOrientation: true,
  showVelocity: true,
};

// Resolve the browser drawing surface and its Canvas 2D context.
const canvas = document.querySelector<HTMLCanvasElement>("#simulation");

if (canvas === null) {
  throw new Error("Simulation canvas was not found.");
}

const context = canvas.getContext("2d");

if (context === null) {
  throw new Error("Canvas 2D rendering is not available.");
}

// Build and populate the simulated World independently from browser presentation.
const world = new World(new Vector2(0, -0.1), new SemiImplicitEulerIntegrator());

const particle = new Body();

world.addBody(particle, { position: new Vector2(-4, 3), velocity: new Vector2(1, 2) });
world.addBody(particle, { position: new Vector2(0, 5) });
world.addBody(particle, { position: new Vector2(4, 2), velocity: new Vector2(-1, 2) });

const circle = new Body({ shape: new Circle(1) });

world.addBody(circle, { position: new Vector2(2, 3), orientation: Math.PI / 4 });

const rectangle = new Body({ shape: new Rectangle(2, 1) });

world.addBody(rectangle, { position: new Vector2(5, 4), orientation: Math.PI / 6 });
world.addBody(rectangle, { position: new Vector2(-5, 4), orientation: Math.PI / 3 });

const simulation = new Simulation([world]);

// Canvas rendering, picking, and inspection observe the same mutable viewport state.
const viewport = new ViewportTransform(canvas.width, canvas.height, 40);
viewport.setCenter(3, 2);
viewport.setPixelsPerUnit(25);

const renderer = new CanvasKinematicRenderer(context, viewport, SHAPELESS_BODY_RADIUS);
const inspectionRenderer = new CanvasInspectionRenderer(context, viewport);
const picker = new BodyPicker(viewport, SHAPELESS_BODY_RADIUS, PICK_TOLERANCE);

const host = new CanvasExampleHost(
  canvas,
  world,
  viewport,
  picker,
  renderer,
  inspectionRenderer,
  INSPECTION_OPTIONS,
);

const runtime = new BrowserSimulationRuntime(simulation, {
  fixedTimestep: FIXED_TIMESTEP,
  maxFrameDelta: MAX_FRAME_DELTA,
  onFrame: () => host.renderFrame(),
});

runtime.run();
