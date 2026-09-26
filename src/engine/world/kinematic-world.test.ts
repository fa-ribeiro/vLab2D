import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";

import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import { KinematicState } from "../kinematics/kinematic-state.ts";
import { Vector2 } from "../math/vector2.ts";
import { KinematicWorld } from "./kinematic-world.ts";

function assertVector(actual: Vector2, expectedX: number, expectedY: number): void {
  assertEquals(actual.x, expectedX);
  assertEquals(actual.y, expectedY);
}

type IntegrationCall = {
  state: KinematicState;
  acceleration: Vector2;
  dt: number;
};

class StubIntegrator implements KinematicIntegrator {
  public readonly calls: IntegrationCall[] = [];

  public constructor(
    private readonly integrateFn: (
      state: KinematicState,
      acceleration: Vector2,
      dt: number,
    ) => KinematicState,
  ) {}

  public integrate(state: KinematicState, acceleration: Vector2, dt: number): KinematicState {
    this.calls.push({
      state,
      acceleration,
      dt,
    });

    return this.integrateFn(state, acceleration, dt);
  }
}

Deno.test("KinematicWorld creates a body and exposes its state", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  const initialState = new KinematicState(new Vector2(3, 4), new Vector2(-2, 5));

  const bodyId = world.createBody(initialState);

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 3, 4);
  assertVector(state.velocity, -2, 5);
});

Deno.test("KinematicWorld assigns different identifiers to different bodies", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  const state = new KinematicState(new Vector2(0, 0), new Vector2(0, 0));

  const firstBodyId = world.createBody(state);
  const secondBodyId = world.createBody(state);

  assert(firstBodyId !== secondBodyId);
});

Deno.test("KinematicWorld associates each body identifier with its own state", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

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
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  const invalidState = new KinematicState(new Vector2(Number.NaN, 0), new Vector2(0, 0));

  assertThrows(
    () => world.createBody(invalidState),
    RangeError,
    "Initial body state position must contain finite components.",
  );
});

Deno.test("KinematicWorld advances every body using the injected integrator", () => {
  const acceleration = new Vector2(0, -10);

  const firstState = new KinematicState(new Vector2(1, 2), new Vector2(3, 4));

  const secondState = new KinematicState(new Vector2(10, 20), new Vector2(30, 40));

  const firstNextState = new KinematicState(new Vector2(5, 6), new Vector2(7, 8));

  const secondNextState = new KinematicState(new Vector2(50, 60), new Vector2(70, 80));

  const integrator = new StubIntegrator((state) => {
    if (state === firstState) {
      return firstNextState;
    }

    if (state === secondState) {
      return secondNextState;
    }

    throw new Error("Unexpected state.");
  });

  const world = new KinematicWorld(acceleration, integrator);

  const firstBodyId = world.createBody(firstState);
  const secondBodyId = world.createBody(secondState);

  world.step(0.5);

  const firstResult = world.getBodyState(firstBodyId);
  const secondResult = world.getBodyState(secondBodyId);

  assert(firstResult !== undefined);
  assert(secondResult !== undefined);

  assertVector(firstResult.position, 5, 6);
  assertVector(firstResult.velocity, 7, 8);

  assertVector(secondResult.position, 50, 60);
  assertVector(secondResult.velocity, 70, 80);

  assertEquals(integrator.calls.length, 2);

  for (const call of integrator.calls) {
    assertStrictEquals(call.acceleration, acceleration);
    assertEquals(call.dt, 0.5);
  }
});

Deno.test("KinematicWorld uses updated acceleration on subsequent steps", () => {
  const initialState = new KinematicState(new Vector2(0, 0), new Vector2(0, 0));

  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  world.createBody(initialState);

  const newAcceleration = new Vector2(4, -2);

  world.setAcceleration(newAcceleration);
  world.step(1);

  assertStrictEquals(world.acceleration, newAcceleration);
  assertStrictEquals(integrator.calls[0].acceleration, newAcceleration);
});

Deno.test(
  "KinematicWorld rejects invalid acceleration without replacing the current value",
  () => {
    const acceleration = new Vector2(0, -10);

    const world = new KinematicWorld(acceleration, new StubIntegrator((state) => state));

    assertThrows(
      () => world.setAcceleration(new Vector2(Number.NaN, 0)),
      RangeError,
      "Acceleration must contain finite components.",
    );

    assertStrictEquals(world.acceleration, acceleration);
  },
);

Deno.test("KinematicWorld rejects an invalid timestep before integrating bodies", () => {
  const initialState = new KinematicState(new Vector2(1, 2), new Vector2(3, 4));

  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  const bodyId = world.createBody(initialState);

  assertThrows(() => world.step(-1), RangeError, "The timestep must not be negative.");

  assertEquals(integrator.calls.length, 0);

  const stateAfterRejectedStep = world.getBodyState(bodyId);

  assert(stateAfterRejectedStep !== undefined);

  assertVector(stateAfterRejectedStep.position, 1, 2);
  assertVector(stateAfterRejectedStep.velocity, 3, 4);
});

Deno.test(
  "KinematicWorld preserves all body states when any integration result is invalid",
  () => {
    const firstState = new KinematicState(new Vector2(1, 2), new Vector2(3, 4));

    const secondState = new KinematicState(new Vector2(10, 20), new Vector2(30, 40));

    const firstNextState = new KinematicState(new Vector2(5, 6), new Vector2(7, 8));

    const invalidSecondState = new KinematicState(
      new Vector2(Number.NaN, 60),
      new Vector2(70, 80),
    );

    const integrator = new StubIntegrator((state) => {
      if (state === firstState) {
        return firstNextState;
      }

      if (state === secondState) {
        return invalidSecondState;
      }

      throw new Error("Unexpected state.");
    });

    const world = new KinematicWorld(new Vector2(0, -10), integrator);

    const firstBodyId = world.createBody(firstState);
    const secondBodyId = world.createBody(secondState);

    assertThrows(
      () => world.step(0.5),
      RangeError,
      `Integrator result for body ${secondBodyId} position must contain finite components.`,
    );

    const firstResult = world.getBodyState(firstBodyId);
    const secondResult = world.getBodyState(secondBodyId);

    assert(firstResult !== undefined);
    assert(secondResult !== undefined);

    assertVector(firstResult.position, 1, 2);
    assertVector(firstResult.velocity, 3, 4);

    assertVector(secondResult.position, 10, 20);
    assertVector(secondResult.velocity, 30, 40);
  },
);

Deno.test("KinematicWorld rejects invalid initial acceleration", () => {
  assertThrows(
    () =>
      new KinematicWorld(
        new Vector2(0, Number.POSITIVE_INFINITY),
        new StubIntegrator((state) => state),
      ),
    RangeError,
    "Acceleration must contain finite components.",
  );
});

Deno.test("KinematicWorld exposes snapshots of all bodies", () => {
  const world = new KinematicWorld(new Vector2(0, -10), new StubIntegrator((state) => state));

  const firstId = world.createBody(new KinematicState(new Vector2(1, 2), new Vector2(3, 4)));

  const secondId = world.createBody(
    new KinematicState(new Vector2(10, 20), new Vector2(30, 40)),
  );

  const snapshots = world.getBodySnapshots();

  assertEquals(snapshots.length, 2);

  const first = snapshots.find((snapshot) => snapshot.id === firstId);
  const second = snapshots.find((snapshot) => snapshot.id === secondId);

  assert(first !== undefined);
  assert(second !== undefined);

  assertVector(first.state.position, 1, 2);
  assertVector(first.state.velocity, 3, 4);

  assertVector(second.state.position, 10, 20);
  assertVector(second.state.velocity, 30, 40);
});

Deno.test("KinematicWorld exposes an empty body snapshot collection when empty", () => {
  const world = new KinematicWorld(new Vector2(0, -10), new StubIntegrator((state) => state));

  assertEquals(world.getBodySnapshots(), []);
});

Deno.test("KinematicWorld body snapshots cannot mutate authoritative world state", () => {
  const world = new KinematicWorld(new Vector2(0, -10), new StubIntegrator((state) => state));

  const bodyId = world.createBody(new KinematicState(new Vector2(1, 2), new Vector2(3, 4)));

  const snapshots = world.getBodySnapshots();

  const observedState = snapshots[0].state;

  // Deliberately bypass TypeScript's readonly contract to verify that the
  // observation object is detached from authoritative world state.
  (observedState.position as { x: number }).x = 999;

  const authoritativeSnapshot = world.getBodyState(bodyId);

  assert(authoritativeSnapshot !== undefined);

  assertVector(authoritativeSnapshot.position, 1, 2);
});

Deno.test("KinematicWorld getBodyState returns detached state", () => {
  const world = new KinematicWorld(new Vector2(0, -10), new StubIntegrator((state) => state));

  const bodyId = world.createBody(new KinematicState(new Vector2(1, 2), new Vector2(3, 4)));

  const observedState = world.getBodyState(bodyId);

  assert(observedState !== undefined);

  (observedState.velocity as { x: number }).x = 999;

  const nextObservation = world.getBodyState(bodyId);

  assert(nextObservation !== undefined);

  assertVector(nextObservation.velocity, 3, 4);
});
