import { assert, assertEquals, assertThrows } from "@std/assert";

import { Body } from "../body/body.ts";
import { Circle } from "../geometry/circle.ts";
import { SemiImplicitEulerIntegrator } from "../kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import { World } from "./world.ts";

Deno.test("World mixes Body restitution using the larger value", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
  });

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

Deno.test("World uses zero restitution threshold by default", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
  });

  assertEquals(world.restitutionThreshold, 0);
});

Deno.test("World retains configured restitution threshold", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
    restitutionThreshold: 0.5,
  });

  assertEquals(world.restitutionThreshold, 0.5);
});

Deno.test("World suppresses restitution below its speed threshold", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
    restitutionThreshold: 0.5,
  });

  const dynamicCircle = new Body({
    shape: new Circle(1),
    restitution: 1,
  });
  const staticCircle = new Body({
    type: "static",
    shape: new Circle(1),
  });

  const dynamicId = world.addBody(dynamicCircle, {
    position: new Vector2(0, 0),
    velocity: new Vector2(0.4, 2),
  });
  world.addBody(staticCircle, {
    position: new Vector2(1, 0),
  });

  world.step(0);

  const dynamicState = world.getBodyState(dynamicId);

  assert(dynamicState !== undefined);

  // Closing speed 0.4 is below the threshold 0.5, so normal velocity is
  // removed without rebound. Tangential velocity is untouched.
  assertEquals(dynamicState.velocity, new Vector2(0, 2));
});

Deno.test("World applies restitution above its speed threshold", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
    restitutionThreshold: 0.5,
  });

  const dynamicCircle = new Body({
    shape: new Circle(1),
    restitution: 1,
  });
  const staticCircle = new Body({
    type: "static",
    shape: new Circle(1),
  });

  const dynamicId = world.addBody(dynamicCircle, {
    position: new Vector2(0, 0),
    velocity: new Vector2(0.6, 2),
  });
  world.addBody(staticCircle, {
    position: new Vector2(1, 0),
  });

  world.step(0);

  const dynamicState = world.getBodyState(dynamicId);

  assert(dynamicState !== undefined);

  assertEquals(dynamicState.velocity, new Vector2(-0.6, 2));
});

Deno.test("World rejects negative restitution threshold", () => {
  assertThrows(
    () =>
      new World({
        gravity: new Vector2(0, 0),
        integrator: new SemiImplicitEulerIntegrator(),
        restitutionThreshold: -0.1,
      }),
    RangeError,
    "Restitution threshold must not be negative.",
  );
});

Deno.test("World rejects non-finite restitution threshold", () => {
  assertThrows(
    () =>
      new World({
        gravity: new Vector2(0, 0),
        integrator: new SemiImplicitEulerIntegrator(),
        restitutionThreshold: Number.POSITIVE_INFINITY,
      }),
    RangeError,
    "Restitution threshold must be finite.",
  );
});
