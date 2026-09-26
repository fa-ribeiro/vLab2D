import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";

import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import { KinematicState } from "../kinematics/kinematic-state.ts";
import { Vector2 } from "../math/vector2.ts";
import { KinematicSimulation } from "./kinematic-simulation.ts";

class StubIntegrator implements KinematicIntegrator {
  public state: KinematicState | undefined;
  public acceleration: Vector2 | undefined;
  public dt: number | undefined;

  public constructor(private readonly result: KinematicState) {}

  public integrate(state: KinematicState, acceleration: Vector2, dt: number): KinematicState {
    this.state = state;
    this.acceleration = acceleration;
    this.dt = dt;

    return this.result;
  }
}

Deno.test("KinematicSimulation delegates stepping to the injected integrator", () => {
  const initialState = new KinematicState(new Vector2(1, 2), new Vector2(3, 4));

  const acceleration = new Vector2(5, 6);

  const nextState = new KinematicState(new Vector2(10, 20), new Vector2(30, 40));

  const integrator = new StubIntegrator(nextState);

  const simulation = new KinematicSimulation(initialState, acceleration, integrator);

  simulation.step(0.5);

  assertStrictEquals(integrator.state, initialState);
  assertStrictEquals(integrator.acceleration, acceleration);
  assertEquals(integrator.dt, 0.5);

  assertStrictEquals(simulation.state, nextState);
});

Deno.test("KinematicSimulation uses an updated acceleration on subsequent steps", () => {
  const initialState = new KinematicState(new Vector2(0, 0), new Vector2(0, 0));

  const integrator = new StubIntegrator(initialState);

  const simulation = new KinematicSimulation(initialState, new Vector2(0, -10), integrator);

  const newAcceleration = new Vector2(4, -2);

  simulation.setAcceleration(newAcceleration);
  simulation.step(1);

  assertStrictEquals(simulation.acceleration, newAcceleration);
  assertStrictEquals(integrator.acceleration, newAcceleration);
});

Deno.test("KinematicSimulation rejects invalid timesteps without changing state", () => {
  const initialState = new KinematicState(new Vector2(1, 2), new Vector2(3, 4));

  const integrator = new StubIntegrator(
    new KinematicState(new Vector2(10, 20), new Vector2(30, 40)),
  );

  const simulation = new KinematicSimulation(initialState, new Vector2(0, -10), integrator);

  assertThrows(() => simulation.step(-1), RangeError, "The timestep must not be negative.");

  assertStrictEquals(simulation.state, initialState);
});

Deno.test("KinematicSimulation rejects non-finite timesteps", () => {
  const initialState = new KinematicState(new Vector2(0, 0), new Vector2(0, 0));

  const simulation = new KinematicSimulation(
    initialState,
    new Vector2(0, 0),
    new StubIntegrator(initialState),
  );

  assertThrows(() => simulation.step(Number.NaN), RangeError, "The timestep must be finite.");

  assertThrows(
    () => simulation.step(Number.POSITIVE_INFINITY),
    RangeError,
    "The timestep must be finite.",
  );
});

Deno.test(
  "KinematicSimulation rejects invalid acceleration without replacing the current value",
  () => {
    const initialState = new KinematicState(new Vector2(0, 0), new Vector2(0, 0));

    const acceleration = new Vector2(0, -10);

    const simulation = new KinematicSimulation(
      initialState,
      acceleration,
      new StubIntegrator(initialState),
    );

    assertThrows(
      () => simulation.setAcceleration(new Vector2(Number.NaN, 0)),
      RangeError,
      "Acceleration must contain finite components.",
    );

    assertStrictEquals(simulation.acceleration, acceleration);
  },
);

Deno.test(
  "KinematicSimulation rejects an invalid integrator result and preserves its current state",
  () => {
    const initialState = new KinematicState(new Vector2(1, 2), new Vector2(3, 4));

    const invalidState = new KinematicState(new Vector2(Number.NaN, 20), new Vector2(30, 40));

    const simulation = new KinematicSimulation(
      initialState,
      new Vector2(0, 0),
      new StubIntegrator(invalidState),
    );

    assertThrows(
      () => simulation.step(1),
      RangeError,
      "Integrator result position must contain finite components.",
    );

    assertStrictEquals(simulation.state, initialState);
  },
);

Deno.test("KinematicSimulation rejects invalid initial state", () => {
  const invalidState = new KinematicState(new Vector2(Number.NaN, 0), new Vector2(0, 0));

  assertThrows(
    () =>
      new KinematicSimulation(
        invalidState,
        new Vector2(0, 0),
        new StubIntegrator(invalidState),
      ),
    RangeError,
    "Initial state position must contain finite components.",
  );
});
