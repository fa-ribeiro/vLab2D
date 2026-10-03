import { assert, assertEquals } from "@std/assert";

import { Body } from "../body/body.ts";
import { Circle } from "../geometry/circle.ts";
import { SemiImplicitEulerIntegrator } from "../kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import { World } from "./world.ts";

Deno.test("World mixes Body friction using the geometric mean", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
  });

  const dynamicCircle = new Body({
    shape: new Circle(1),
    friction: 0.25,
  });
  const staticCircle = new Body({
    type: "static",
    shape: new Circle(1),
    friction: 1,
  });

  const dynamicId = world.addBody(dynamicCircle, {
    position: new Vector2(0, 0),
    velocity: new Vector2(3, 4),
  });
  const staticId = world.addBody(staticCircle, {
    position: new Vector2(1, 0),
  });

  world.step(0);

  const dynamicState = world.getBodyState(dynamicId);
  const staticState = world.getBodyState(staticId);

  assert(dynamicState !== undefined);
  assert(staticState !== undefined);

  // Mixed friction = sqrt(0.25 * 1) = 0.5.
  // The normal impulse magnitude is 3, so Coulomb friction is capped at 1.5.
  // It therefore reduces tangential speed 4 -> 2.5 without affecting the
  // already-resolved normal velocity.
  assertEquals(dynamicState.velocity, new Vector2(0, 2.5));
  assertEquals(staticState.velocity, new Vector2(0, 0));
});

Deno.test("World contact is frictionless when either Body friction is zero", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
  });

  const dynamicCircle = new Body({
    shape: new Circle(1),
    friction: 1,
  });
  const staticCircle = new Body({
    type: "static",
    shape: new Circle(1),
  });

  const dynamicId = world.addBody(dynamicCircle, {
    position: new Vector2(0, 0),
    velocity: new Vector2(3, 4),
  });
  world.addBody(staticCircle, {
    position: new Vector2(1, 0),
  });

  world.step(0);

  const dynamicState = world.getBodyState(dynamicId);

  assert(dynamicState !== undefined);
  assertEquals(dynamicState.velocity, new Vector2(0, 4));
});
