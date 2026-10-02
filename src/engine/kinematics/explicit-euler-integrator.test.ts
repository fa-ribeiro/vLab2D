import { assert, assertEquals } from "@std/assert";

import { Vector2 } from "../math/vector2.ts";
import type { BodyState } from "../world/body-state.ts";
import { ExplicitEulerIntegrator } from "./explicit-euler-integrator.ts";

function assertVector(actual: Vector2, expectedX: number, expectedY: number): void {
  assertEquals(actual.x, expectedX);
  assertEquals(actual.y, expectedY);
}

function createBodyState(
  position: Vector2,
  velocity: Vector2,
  orientation = 0,
  angularVelocity = 0,
): BodyState {
  return { position, velocity, orientation, angularVelocity };
}

Deno.test("ExplicitEulerIntegrator advances position using the initial velocity", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(new Vector2(1, 2), new Vector2(4, -2));

  const result = integrator.integrate(state, new Vector2(0, 0), 0.5);

  assertVector(result.position, 3, 1);
  assertVector(result.velocity, 4, -2);
});

Deno.test("ExplicitEulerIntegrator advances velocity using acceleration", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(new Vector2(0, 0), new Vector2(2, 4));

  const result = integrator.integrate(state, new Vector2(2, -6), 0.5);

  assertVector(result.position, 1, 2);
  assertVector(result.velocity, 3, 1);
});

Deno.test("ExplicitEulerIntegrator uses the initial velocity when updating position", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(new Vector2(0, 0), new Vector2(0, 0));

  const result = integrator.integrate(state, new Vector2(0, -10), 1);

  assertVector(result.position, 0, 0);
  assertVector(result.velocity, 0, -10);
});

Deno.test("ExplicitEulerIntegrator preserves orientation when angular velocity is zero", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(new Vector2(1, 2), new Vector2(3, 4), Math.PI / 3);

  const result = integrator.integrate(state, new Vector2(5, 6), 0.5);

  assertEquals(result.orientation, Math.PI / 3);
  assertEquals(result.angularVelocity, 0);
});

Deno.test("ExplicitEulerIntegrator advances orientation using angular velocity", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(new Vector2(1, 2), new Vector2(3, 4), Math.PI / 3, Math.PI);

  const result = integrator.integrate(state, new Vector2(5, 6), 0.5);

  assertEquals(result.orientation, Math.PI / 3 + Math.PI * 0.5);
  assertEquals(result.angularVelocity, Math.PI);
});

Deno.test("ExplicitEulerIntegrator supports clockwise angular velocity", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(
    new Vector2(0, 0),
    new Vector2(0, 0),
    Math.PI / 2,
    -Math.PI / 2,
  );

  const result = integrator.integrate(state, new Vector2(0, 0), 1);

  assertEquals(result.orientation, 0);
  assertEquals(result.angularVelocity, -Math.PI / 2);
});

Deno.test("ExplicitEulerIntegrator leaves its inputs unchanged", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(new Vector2(1, 2), new Vector2(3, 4), Math.PI / 6, Math.PI / 4);

  const acceleration = new Vector2(5, 6);

  const result = integrator.integrate(state, acceleration, 0.5);

  assert(result !== state);

  assertVector(state.position, 1, 2);
  assertVector(state.velocity, 3, 4);
  assertEquals(state.orientation, Math.PI / 6);
  assertEquals(state.angularVelocity, Math.PI / 4);
  assertVector(acceleration, 5, 6);
});

Deno.test("ExplicitEulerIntegrator with a zero timestep preserves state values", () => {
  const integrator = new ExplicitEulerIntegrator();

  const state = createBodyState(
    new Vector2(3, 7),
    new Vector2(-2, 5),
    -Math.PI / 4,
    Math.PI / 3,
  );

  const result = integrator.integrate(state, new Vector2(10, -20), 0);

  assertVector(result.position, 3, 7);
  assertVector(result.velocity, -2, 5);
  assertEquals(result.orientation, -Math.PI / 4);
  assertEquals(result.angularVelocity, Math.PI / 3);
});
