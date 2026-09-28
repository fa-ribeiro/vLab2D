import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";

import { Body } from "../body/body.ts";
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

Deno.test("KinematicWorld adds a body and exposes its initial runtime state", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(3, 4),
    velocity: new Vector2(-2, 5),
  });

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 3, 4);
  assertVector(state.velocity, -2, 5);
});

Deno.test("KinematicWorld uses zero-valued body initial-condition defaults", () => {
  const world = new KinematicWorld(new Vector2(0, -10), new StubIntegrator((state) => state));

  const bodyId = world.addBody(new Body());

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 0, 0);
  assertVector(state.velocity, 0, 0);
});

Deno.test("KinematicWorld assigns different identifiers to different body instances", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  const body = new Body();

  const firstBodyId = world.addBody(body);
  const secondBodyId = world.addBody(body);

  assert(firstBodyId !== secondBodyId);
});

Deno.test(
  "KinematicWorld can reuse one Body definition with independent runtime states",
  () => {
    const integrator = new StubIntegrator((state) => state);

    const world = new KinematicWorld(new Vector2(0, -10), integrator);

    const body = new Body();

    const firstId = world.addBody(body, {
      position: new Vector2(1, 2),
      velocity: new Vector2(3, 4),
    });

    const secondId = world.addBody(body, {
      position: new Vector2(10, 20),
      velocity: new Vector2(30, 40),
    });

    const firstState = world.getBodyState(firstId);
    const secondState = world.getBodyState(secondId);

    assert(firstState !== undefined);
    assert(secondState !== undefined);

    assertVector(firstState.position, 1, 2);
    assertVector(firstState.velocity, 3, 4);

    assertVector(secondState.position, 10, 20);
    assertVector(secondState.velocity, 30, 40);
  },
);

Deno.test("KinematicWorld copies body initial conditions into runtime state", () => {
  const world = new KinematicWorld(new Vector2(0, -10), new StubIntegrator((state) => state));

  const position = new Vector2(1, 2);
  const velocity = new Vector2(3, 4);

  const bodyId = world.addBody(new Body(), {
    position,
    velocity,
  });

  // Deliberately bypass TypeScript's readonly contract to verify that
  // caller-owned initial-condition values are not authoritative world state.
  (position as { x: number }).x = 999;
  (velocity as { y: number }).y = 999;

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 1, 2);
  assertVector(state.velocity, 3, 4);
});

Deno.test("KinematicWorld rejects invalid body initial conditions", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  assertThrows(
    () =>
      world.addBody(new Body(), {
        position: new Vector2(Number.NaN, 0),
      }),
    RangeError,
    "Initial body state position must contain finite components.",
  );

  assertEquals(world.getBodySnapshots(), []);
});

Deno.test("KinematicWorld advances every body using the injected integrator", () => {
  const acceleration = new Vector2(0, -10);

  const firstNextState = new KinematicState(new Vector2(5, 6), new Vector2(7, 8));

  const secondNextState = new KinematicState(new Vector2(50, 60), new Vector2(70, 80));

  const integrator = new StubIntegrator((state) => {
    if (state.position.x === 1) {
      return firstNextState;
    }

    if (state.position.x === 10) {
      return secondNextState;
    }

    throw new Error("Unexpected state.");
  });

  const world = new KinematicWorld(acceleration, integrator);

  const body = new Body();

  const firstBodyId = world.addBody(body, {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
  });

  const secondBodyId = world.addBody(body, {
    position: new Vector2(10, 20),
    velocity: new Vector2(30, 40),
  });

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
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  world.addBody(new Body());

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
  const integrator = new StubIntegrator((state) => state);

  const world = new KinematicWorld(new Vector2(0, -10), integrator);

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
  });

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
    const firstNextState = new KinematicState(new Vector2(5, 6), new Vector2(7, 8));

    const invalidSecondState = new KinematicState(
      new Vector2(Number.NaN, 60),
      new Vector2(70, 80),
    );

    const integrator = new StubIntegrator((state) => {
      if (state.position.x === 1) {
        return firstNextState;
      }

      if (state.position.x === 10) {
        return invalidSecondState;
      }

      throw new Error("Unexpected state.");
    });

    const world = new KinematicWorld(new Vector2(0, -10), integrator);

    const body = new Body();

    const firstBodyId = world.addBody(body, {
      position: new Vector2(1, 2),
      velocity: new Vector2(3, 4),
    });

    const secondBodyId = world.addBody(body, {
      position: new Vector2(10, 20),
      velocity: new Vector2(30, 40),
    });

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

  const body = new Body();

  const firstId = world.addBody(body, {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
  });

  const secondId = world.addBody(body, {
    position: new Vector2(10, 20),
    velocity: new Vector2(30, 40),
  });

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

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
  });

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

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
  });

  const observedState = world.getBodyState(bodyId);

  assert(observedState !== undefined);

  (observedState.velocity as { x: number }).x = 999;

  const nextObservation = world.getBodyState(bodyId);

  assert(nextObservation !== undefined);

  assertVector(nextObservation.velocity, 3, 4);
});
