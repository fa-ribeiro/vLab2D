import { assert, assertEquals } from "@std/assert";

import { SemiImplicitEulerIntegrator } from "../kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import { WORLD_DEFAULTS } from "./world-defaults.ts";
import { World } from "./world.ts";

Deno.test("WORLD_DEFAULTS exposes optional World policy in one place", () => {
  assertEquals(WORLD_DEFAULTS.restitutionThreshold, 0);
  assert(Object.isFrozen(WORLD_DEFAULTS));
});

Deno.test("World resolves omitted solver policy through WORLD_DEFAULTS", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
  });

  assertEquals(world.restitutionThreshold, WORLD_DEFAULTS.restitutionThreshold);
});
