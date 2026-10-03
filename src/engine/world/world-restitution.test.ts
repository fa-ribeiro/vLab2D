import { assert, assertEquals } from "@std/assert";

import { Body } from "../body/body.ts";
import { Circle } from "../geometry/circle.ts";
import { SemiImplicitEulerIntegrator } from "../kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import { World } from "./world.ts";

Deno.test("World mixes Body restitution using the larger value", () => {
  const world = new World(new Vector2(0, 0), new SemiImplicitEulerIntegrator());

  const dynamicCircle = new Body({
    shape: new Circle(1),
    restitution: 0.25,
  });
  const staticCircle = new Body({
    type: "static",
    shape: new Circle(1),
    restitution: 0.75,
  });

  const dynamicId = world.addBody(dynamicCircle, {
    position: new Vector2(0, 0),
    velocity: new Vector2(3, 2),
  });
  const staticId = world.addBody(staticCircle, {
    position: new Vector2(1, 0),
  });

  world.step(0);

  const dynamicState = world.getBodyState(dynamicId);
  const staticState = world.getBodyState(staticId);

  assert(dynamicState !== undefined);
  assert(staticState !== undefined);

  // The pair uses restitution 0.75 (the larger Body value). Incoming normal
  // speed 3 therefore becomes outgoing normal speed 2.25.
  assertEquals(dynamicState.velocity, new Vector2(-2.25, 2));

  // Zero inverse mass still prevents the static Body from receiving any
  // velocity change even though its restitution affects the pair response.
  assertEquals(staticState.velocity, new Vector2(0, 0));
});
