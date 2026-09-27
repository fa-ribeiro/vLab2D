import {
  KinematicState,
  KinematicWorld,
  SemiImplicitEulerIntegrator,
  Vector2,
} from "../src/engine/mod.ts";
import { SvgKinematicRenderer } from "../src/visualization/svg-kinematic-renderer.ts";

const world = new KinematicWorld(new Vector2(0, -9.81), new SemiImplicitEulerIntegrator());

world.createBody(new KinematicState(new Vector2(-4, 3), new Vector2(2, 3)));

world.createBody(new KinematicState(new Vector2(0, 5), new Vector2(0, 0)));

world.createBody(new KinematicState(new Vector2(4, 2), new Vector2(-1, 4)));

for (let step = 0; step < 5; step++) {
  world.step(0.1);
}

const renderer = new SvgKinematicRenderer(800, 600, 40, 6);

const svg = renderer.render(world.getBodySnapshots());

await Deno.mkdir("generated", {
  recursive: true,
});

await Deno.writeTextFile("generated/kinematic-world.svg", svg);

console.log("Generated generated/kinematic-world.svg");
