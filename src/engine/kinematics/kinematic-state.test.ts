import { assertEquals } from "@std/assert";

import { Vector2 } from "../math/vector2.ts";
import { KinematicState } from "./kinematic-state.ts";

Deno.test("KinematicState stores position and velocity", () => {
  const state = new KinematicState(new Vector2(3, 4), new Vector2(-2, 5));

  assertEquals(state.position.x, 3);
  assertEquals(state.position.y, 4);

  assertEquals(state.velocity.x, -2);
  assertEquals(state.velocity.y, 5);
});
