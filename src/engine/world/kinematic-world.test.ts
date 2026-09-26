import { assert, assertEquals, assertThrows } from "@std/assert";

import { KinematicState } from "../kinematics/kinematic-state.ts";
import { Vector2 } from "../math/vector2.ts";
import { KinematicWorld } from "./kinematic-world.ts";

function assertVector(actual: Vector2, expectedX: number, expectedY: number): void {
  assertEquals(actual.x, expectedX);
  assertEquals(actual.y, expectedY);
}

Deno.test("KinematicWorld creates a body and exposes its state", () => {
  const world = new KinematicWorld();

  const initialState = new KinematicState(new Vector2(3, 4), new Vector2(-2, 5));

  const bodyId = world.createBody(initialState);

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 3, 4);
  assertVector(state.velocity, -2, 5);
});

Deno.test("KinematicWorld assigns different identifiers to different bodies", () => {
  const world = new KinematicWorld();

  const state = new KinematicState(new Vector2(0, 0), new Vector2(0, 0));

  const firstBodyId = world.createBody(state);
  const secondBodyId = world.createBody(state);

  assert(firstBodyId !== secondBodyId);
});

Deno.test("KinematicWorld associates each body identifier with its own state", () => {
  const world = new KinematicWorld();

  const firstId = world.createBody(new KinematicState(new Vector2(1, 2), new Vector2(3, 4)));

  const secondId = world.createBody(
    new KinematicState(new Vector2(10, 20), new Vector2(30, 40)),
  );

  const firstState = world.getBodyState(firstId);
  const secondState = world.getBodyState(secondId);

  assert(firstState !== undefined);
  assert(secondState !== undefined);

  assertVector(firstState.position, 1, 2);
  assertVector(firstState.velocity, 3, 4);

  assertVector(secondState.position, 10, 20);
  assertVector(secondState.velocity, 30, 40);
});

Deno.test("KinematicWorld rejects invalid initial body state", () => {
  const world = new KinematicWorld();

  const invalidState = new KinematicState(new Vector2(Number.NaN, 0), new Vector2(0, 0));

  assertThrows(
    () => world.createBody(invalidState),
    RangeError,
    "Initial body state position must contain finite components.",
  );
});
