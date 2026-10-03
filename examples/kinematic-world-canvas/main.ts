import {
  Body,
  BodyPicker,
  BrowserSimulationRuntime,
  CanvasInspectionRenderer,
  CanvasKinematicRenderer,
  Circle,
  type InspectionOptions,
  Rectangle,
  RegularPolygon,
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
  defaultStyle: {
    color: "#e4611f",
    lineWidth: 1.5,
  },
  aabb: {
    visible: true,
    style: {
      color: "#0891b2",
      lineWidth: 1,
    },
  },
  geometryContour: {
    visible: true,
  },
  bodyOrigin: {
    visible: true,
    radius: 3,
    style: {
      color: "#ffcc00",
    },
  },
  orientation: {
    visible: true,
    length: 18,
    style: {
      color: "#e4611f",
    },
  },
  velocity: {
    visible: true,
    projectionTime: 1,
    arrowheadSize: 6,
    minimumVisibleLength: 4,
    style: {
      color: "#dc2626",
    },
  },
  broadPhaseCandidates: {
    visible: true,
    style: {
      color: "#7c3aed",
      lineWidth: 1,
    },
  },
  collisionMtv: {
    visible: true,
    arrowheadSize: 6,
    minimumVisibleLength: 2,
    style: {
      color: "#2563eb",
      lineWidth: 2,
    },
  },
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
world.addBody(circle, { position: new Vector2(3.5, 3) });

// These two circles are deliberately a broad-phase false positive: their
// AABBs overlap, but their center distance is greater than the sum of radii.
world.addBody(circle, { position: new Vector2(-1, -2) });
world.addBody(circle, { position: new Vector2(0.9, -0.1) });

const rectangle = new Body({ shape: new Rectangle(2, 1) });

world.addBody(rectangle, {
  position: new Vector2(5, 4),
  orientation: Math.PI / 6,
  angularVelocity: Math.PI / 4,
});
world.addBody(rectangle, {
  position: new Vector2(-5, 4),
  orientation: Math.PI / 3,
  angularVelocity: -Math.PI / 6,
});

const triangle = new Body({ shape: new RegularPolygon(3, 1) });
const hexagon = new Body({ shape: new RegularPolygon(6, 1), inverseMass: 1 / 100 });

world.addBody(triangle, {
  position: new Vector2(-2, 1),
  angularVelocity: Math.PI / 3,
});
world.addBody(hexagon, {
  position: new Vector2(3, 0),
  orientation: Math.PI / 6,
  velocity: new Vector2(0, 0.5),
  angularVelocity: -Math.PI / 4,
});

// A dedicated bouncy Body makes restitution visible without changing the
// default inelastic behavior of the other example Bodies.
const bouncyBall = new Body({ shape: new Circle(0.6), restitution: 0.85 });

world.addBody(bouncyBall, { position: new Vector2(8, -1), velocity: new Vector2(0, -1) });

// Static geometry participates in collision detection/response but is not
// advanced by gravity or the World's kinematic integrator.
const floor = new Body({
  type: "static",
  shape: new Rectangle(20, 1),
});

world.addBody(floor, { position: new Vector2(2, -4.5), orientation: -Math.PI / 48 });

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
