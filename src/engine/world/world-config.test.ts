import { assert, assertEquals } from "@std/assert";

import { SemiImplicitEulerIntegrator } from "../kinematics/semi-implicit-euler-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import { WORLD_DEFAULTS } from "./world-config.ts";
import { World } from "./world.ts";

Deno.test("WORLD_DEFAULTS exposes canonical optional World policy", () => {
  assertEquals(WORLD_DEFAULTS.restitutionThreshold, 0);
  assert(Object.isFrozen(WORLD_DEFAULTS));
});

Deno.test("World resolves omitted optional policy through WORLD_DEFAULTS", () => {
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new SemiImplicitEulerIntegrator(),
  });

  assertEquals(world.restitutionThreshold, WORLD_DEFAULTS.restitutionThreshold);
});
