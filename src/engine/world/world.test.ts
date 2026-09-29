import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";

import { Body } from "../body/body.ts";
import { Circle } from "../geometry/circle.ts";
import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import type { BodyState } from "./body-state.ts";
import { World } from "./world.ts";

function assertVector(actual: Vector2, expectedX: number, expectedY: number): void {
  assertEquals(actual.x, expectedX);
  assertEquals(actual.y, expectedY);
}

function createBodyState(position: Vector2, velocity: Vector2): BodyState {
  return { position, velocity };
}

type IntegrationCall = {
  state: BodyState;
  acceleration: Vector2;
  dt: number;
};

class StubIntegrator implements KinematicIntegrator {
  public readonly calls: IntegrationCall[] = [];

  public constructor(
    private readonly integrateFn: (
      state: BodyState,
      acceleration: Vector2,
      dt: number,
    ) => BodyState,
  ) {}

  public integrate(state: BodyState, acceleration: Vector2, dt: number): BodyState {
    this.calls.push({
      state,
      acceleration,
      dt,
    });

    return this.integrateFn(state, acceleration, dt);
  }
}

Deno.test("World adds a body and exposes its initial runtime state", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World(new Vector2(0, -10), integrator);

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(3, 4),
    velocity: new Vector2(-2, 5),
  });

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 3, 4);
  assertVector(state.velocity, -2, 5);
});

Deno.test("World uses zero-valued body initial-condition defaults", () => {
  const world = new World(new Vector2(0, -10), new StubIntegrator((state) => state));

  const bodyId = world.addBody(new Body());

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 0, 0);
  assertVector(state.velocity, 0, 0);
});

Deno.test("World assigns different identifiers to different body instances", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World(new Vector2(0, -10), integrator);

  const body = new Body();

  const firstBodyId = world.addBody(body);
  const secondBodyId = world.addBody(body);

  assert(firstBodyId !== secondBodyId);
});

Deno.test("World can reuse one Body definition with independent runtime states", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World(new Vector2(0, -10), integrator);

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
});

Deno.test("World copies body initial conditions into runtime state", () => {
  const world = new World(new Vector2(0, -10), new StubIntegrator((state) => state));

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

Deno.test("World rejects invalid body initial conditions", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World(new Vector2(0, -10), integrator);

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

Deno.test("World advances every body using the injected integrator", () => {
  const gravity = new Vector2(0, -10);

  const firstNextState = createBodyState(new Vector2(5, 6), new Vector2(7, 8));

  const secondNextState = createBodyState(new Vector2(50, 60), new Vector2(70, 80));

  const integrator = new StubIntegrator((state) => {
    if (state.position.x === 1) {
      return firstNextState;
    }

    if (state.position.x === 10) {
      return secondNextState;
    }

    throw new Error("Unexpected state.");
  });

  const world = new World(gravity, integrator);

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
    assertStrictEquals(call.acceleration, gravity);
    assertEquals(call.dt, 0.5);
  }
});

Deno.test("World uses updated gravity on subsequent steps", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World(new Vector2(0, -10), integrator);

  world.addBody(new Body());

  const newGravity = new Vector2(4, -2);

  world.setGravity(newGravity);
  world.step(1);

  assertStrictEquals(world.gravity, newGravity);
  assertStrictEquals(integrator.calls[0].acceleration, newGravity);
});

Deno.test("World rejects invalid gravity without replacing the current value", () => {
  const gravity = new Vector2(0, -10);

  const world = new World(gravity, new StubIntegrator((state) => state));

  assertThrows(
    () => world.setGravity(new Vector2(Number.NaN, 0)),
    RangeError,
    "Gravity must contain finite components.",
  );

  assertStrictEquals(world.gravity, gravity);
});

Deno.test("World rejects an invalid timestep before integrating bodies", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World(new Vector2(0, -10), integrator);

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

Deno.test("World preserves all body states when any integration result is invalid", () => {
  const firstNextState = createBodyState(new Vector2(5, 6), new Vector2(7, 8));

  const invalidSecondState = createBodyState(new Vector2(Number.NaN, 60), new Vector2(70, 80));

  const integrator = new StubIntegrator((state) => {
    if (state.position.x === 1) {
      return firstNextState;
    }

    if (state.position.x === 10) {
      return invalidSecondState;
    }

    throw new Error("Unexpected state.");
  });

  const world = new World(new Vector2(0, -10), integrator);

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
});

Deno.test("World rejects invalid initial gravity", () => {
  assertThrows(
    () =>
      new World(new Vector2(0, Number.POSITIVE_INFINITY), new StubIntegrator((state) => state)),
    RangeError,
    "Gravity must contain finite components.",
  );
});

Deno.test("World exposes snapshots of all bodies", () => {
  const world = new World(new Vector2(0, -10), new StubIntegrator((state) => state));

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

  assertStrictEquals(first.definition, body);
  assertVector(first.state.position, 1, 2);
  assertVector(first.state.velocity, 3, 4);

  assertStrictEquals(second.definition, body);
  assertVector(second.state.position, 10, 20);
  assertVector(second.state.velocity, 30, 40);
});

Deno.test("World snapshots expose Circle geometry through the Body definition", () => {
  const world = new World(new Vector2(0, -10), new StubIntegrator((state) => state));

  const circle = new Circle(2);
  const body = new Body({ shape: circle });

  const bodyId = world.addBody(body);

  const snapshot = world.getBodySnapshots().find(({ id }) => id === bodyId);

  assert(snapshot !== undefined);
  assertStrictEquals(snapshot.definition, body);
  assertStrictEquals(snapshot.definition.shape, circle);
});

Deno.test("World exposes an empty body snapshot collection when empty", () => {
  const world = new World(new Vector2(0, -10), new StubIntegrator((state) => state));

  assertEquals(world.getBodySnapshots(), []);
});

Deno.test("World body snapshots detach runtime state from authoritative world state", () => {
  const world = new World(new Vector2(0, -10), new StubIntegrator((state) => state));

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
  });

  const snapshots = world.getBodySnapshots();

  const observedState = snapshots[0].state;

  // Deliberately bypass TypeScript's readonly contract to verify that
  // observed runtime values are not authoritative World state.
  (observedState.position as { x: number }).x = 999;

  const authoritativeSnapshot = world.getBodyState(bodyId);

  assert(authoritativeSnapshot !== undefined);

  assertVector(authoritativeSnapshot.position, 1, 2);
});

Deno.test("World getBodyState returns detached state", () => {
  const world = new World(new Vector2(0, -10), new StubIntegrator((state) => state));

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
