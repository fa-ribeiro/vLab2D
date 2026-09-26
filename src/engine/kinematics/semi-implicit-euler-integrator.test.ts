import { assert, assertEquals } from "@std/assert";

import { Vector2 } from "../math/vector2.ts";
import { KinematicState } from "./kinematic-state.ts";
import { SemiImplicitEulerIntegrator } from "./semi-implicit-euler-integrator.ts";

function assertVector(actual: Vector2, expectedX: number, expectedY: number): void {
  assertEquals(actual.x, expectedX);
  assertEquals(actual.y, expectedY);
}

Deno.test("SemiImplicitEulerIntegrator updates velocity before position", () => {
  const integrator = new SemiImplicitEulerIntegrator();

  const state = new KinematicState(new Vector2(0, 0), new Vector2(0, 0));

  const result = integrator.integrate(state, new Vector2(0, -10), 1);

  assertVector(result.velocity, 0, -10);
  assertVector(result.position, 0, -10);
});

Deno.test("SemiImplicitEulerIntegrator advances state using updated velocity", () => {
  const integrator = new SemiImplicitEulerIntegrator();

  const state = new KinematicState(new Vector2(1, 2), new Vector2(4, -2));

  const result = integrator.integrate(state, new Vector2(2, 6), 0.5);

  // next velocity:
  // (4, -2) + (2, 6) * 0.5
  // = (5, 1)
  assertVector(result.velocity, 5, 1);

  // next position:
  // (1, 2) + (5, 1) * 0.5
  // = (3.5, 2.5)
  assertVector(result.position, 3.5, 2.5);
});

Deno.test("SemiImplicitEulerIntegrator leaves its inputs unchanged", () => {
  const integrator = new SemiImplicitEulerIntegrator();

  const state = new KinematicState(new Vector2(1, 2), new Vector2(3, 4));

  const acceleration = new Vector2(5, 6);

  const result = integrator.integrate(state, acceleration, 0.5);

  assert(result !== state);

  assertVector(state.position, 1, 2);
  assertVector(state.velocity, 3, 4);
  assertVector(acceleration, 5, 6);
});

Deno.test("SemiImplicitEulerIntegrator with a zero timestep preserves state values", () => {
  const integrator = new SemiImplicitEulerIntegrator();

  const state = new KinematicState(new Vector2(3, 7), new Vector2(-2, 5));

  const result = integrator.integrate(state, new Vector2(10, -20), 0);

  assertVector(result.position, 3, 7);
  assertVector(result.velocity, -2, 5);
});
