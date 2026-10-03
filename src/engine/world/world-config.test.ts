import { assert, assertEquals, assertThrows } from "@std/assert";

import { SemiImplicitEulerIntegrator } from "../kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import { WORLD_DEFAULTS } from "./world-config.ts";
import { World } from "./world.ts";

Deno.test("WORLD_DEFAULTS exposes canonical optional World policy", () => {
  assertEquals(WORLD_DEFAULTS.restitutionThreshold, 0);
  assertEquals(WORLD_DEFAULTS.velocityIterations, 8);
  assert(Object.isFrozen(WORLD_DEFAULTS));
});

Deno.test("World resolves omitted optional policy through WORLD_DEFAULTS", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
  });

  assertEquals(world.restitutionThreshold, WORLD_DEFAULTS.restitutionThreshold);
  assertEquals(world.velocityIterations, WORLD_DEFAULTS.velocityIterations);
});

Deno.test("World retains configured velocity iteration count", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
    velocityIterations: 3,
  });

  assertEquals(world.velocityIterations, 3);
});

Deno.test("World rejects a non-positive velocity iteration count", () => {
  assertThrows(
    () =>
      new World({
        gravity: new Vector2(0, 0),
        integrator: new SemiImplicitEulerIntegrator(),
        velocityIterations: 0,
      }),
    RangeError,
    "Velocity iterations must be a positive integer.",
  );

  assertThrows(
    () =>
      new World({
        gravity: new Vector2(0, 0),
        integrator: new SemiImplicitEulerIntegrator(),
        velocityIterations: -1,
      }),
    RangeError,
    "Velocity iterations must be a positive integer.",
  );
});

Deno.test("World rejects a non-integer velocity iteration count", () => {
  assertThrows(
    () =>
      new World({
        gravity: new Vector2(0, 0),
        integrator: new SemiImplicitEulerIntegrator(),
        velocityIterations: 1.5,
      }),
    RangeError,
    "Velocity iterations must be a positive integer.",
  );

  assertThrows(
    () =>
      new World({
        gravity: new Vector2(0, 0),
        integrator: new SemiImplicitEulerIntegrator(),
        velocityIterations: Number.POSITIVE_INFINITY,
      }),
    RangeError,
    "Velocity iterations must be a positive integer.",
  );
});
