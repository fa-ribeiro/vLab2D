import { Body, SemiImplicitEulerIntegrator, Vector2, World } from "../src/engine/mod.ts";
import { Simulation } from "../src/simulation/simulation.ts";
import { SvgKinematicRenderer } from "../src/visualization/svg-kinematic-renderer.ts";

const world = new World(new Vector2(0, -9.81), new SemiImplicitEulerIntegrator());

const particle = new Body();

world.addBody(particle, {
  position: new Vector2(-4, 3),
  velocity: new Vector2(2, 3),
});

world.addBody(particle, {
  position: new Vector2(0, 5),
});

world.addBody(particle, {
  position: new Vector2(4, 2),
  velocity: new Vector2(-1, 4),
});

const simulation = new Simulation([world]);

for (let step = 0; step < 5; step++) {
  simulation.step(0.1);
}

const renderer = new SvgKinematicRenderer(800, 600, 40, 6);

renderer.setViewportCenter(3, 2);

const svg = renderer.render(world.getBodySnapshots());

await Deno.mkdir("generated", {
  recursive: true,
});

await Deno.writeTextFile("generated/kinematic-world.svg", svg);

console.log("Generated generated/kinematic-world.svg");
