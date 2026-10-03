import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";

import { Body } from "../body/body.ts";
import type { BodyCollision } from "../collision/body-collision.ts";
import { Circle } from "../geometry/circle.ts";
import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import { Vector2 } from "../math/vector2.ts";
import type { CollisionSolver } from "../solver/collision-solver.ts";
import type { BodyId } from "./body-id.ts";
import type { BodySnapshot } from "./body-snapshot.ts";
import type { BodyState } from "./body-state.ts";
import { World } from "./world.ts";

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

type SolverCall = {
  readonly bodies: readonly BodySnapshot[];
  readonly collisions: readonly BodyCollision[];
};

class StubCollisionSolver implements CollisionSolver {
  public readonly calls: SolverCall[] = [];

  public constructor(
    private readonly solveFn: (
      bodies: readonly BodySnapshot[],
      collisions: readonly BodyCollision[],
    ) => ReadonlyMap<BodyId, BodyState> = (bodies) =>
      new Map(bodies.map(({ id, state }) => [id, state] as const)),
  ) {}

  public solve(
    bodies: readonly BodySnapshot[],
    collisions: readonly BodyCollision[],
  ): ReadonlyMap<BodyId, BodyState> {
    this.calls.push({ bodies, collisions });
    return this.solveFn(bodies, collisions);
  }
}

Deno.test("World adds a body and exposes its initial runtime state", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(3, 4),
    velocity: new Vector2(-2, 5),
    orientation: Math.PI / 4,
    angularVelocity: Math.PI / 2,
  });

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 3, 4);
  assertVector(state.velocity, -2, 5);
  assertEquals(state.orientation, Math.PI / 4);
  assertEquals(state.angularVelocity, Math.PI / 2);
});

Deno.test("World uses zero-valued body initial-condition defaults", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  const bodyId = world.addBody(new Body());

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 0, 0);
  assertVector(state.velocity, 0, 0);
  assertEquals(state.orientation, 0);
  assertEquals(state.angularVelocity, 0);
});

Deno.test("World assigns different identifiers to different body instances", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  const body = new Body();

  const firstBodyId = world.addBody(body);
  const secondBodyId = world.addBody(body);

  assert(firstBodyId !== secondBodyId);
});

Deno.test("World can reuse one Body definition with independent runtime states", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  const body = new Body();

  const firstId = world.addBody(body, {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
    orientation: Math.PI / 6,
    angularVelocity: Math.PI / 4,
  });

  const secondId = world.addBody(body, {
    position: new Vector2(10, 20),
    velocity: new Vector2(30, 40),
    orientation: -Math.PI / 3,
    angularVelocity: -Math.PI / 2,
  });

  const firstState = world.getBodyState(firstId);
  const secondState = world.getBodyState(secondId);

  assert(firstState !== undefined);
  assert(secondState !== undefined);

  assertVector(firstState.position, 1, 2);
  assertVector(firstState.velocity, 3, 4);
  assertEquals(firstState.orientation, Math.PI / 6);
  assertEquals(firstState.angularVelocity, Math.PI / 4);

  assertVector(secondState.position, 10, 20);
  assertVector(secondState.velocity, 30, 40);
  assertEquals(secondState.orientation, -Math.PI / 3);
  assertEquals(secondState.angularVelocity, -Math.PI / 2);
});

Deno.test("World copies body initial conditions into runtime state", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  const position = new Vector2(1, 2);
  const velocity = new Vector2(3, 4);

  const bodyId = world.addBody(new Body(), {
    position,
    velocity,
    orientation: Math.PI / 8,
    angularVelocity: Math.PI / 5,
  });

  // Deliberately bypass TypeScript's readonly contract to verify that
  // caller-owned initial-condition values are not authoritative world state.
  (position as { x: number }).x = 999;
  (velocity as { y: number }).y = 999;

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);

  assertVector(state.position, 1, 2);
  assertVector(state.velocity, 3, 4);
  assertEquals(state.orientation, Math.PI / 8);
  assertEquals(state.angularVelocity, Math.PI / 5);
});

Deno.test("World rejects invalid body initial conditions", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  assertThrows(
    () =>
      world.addBody(new Body(), {
        position: new Vector2(Number.NaN, 0),
      }),
    RangeError,
    "Initial body state position must contain finite components.",
  );

  assertThrows(
    () =>
      world.addBody(new Body(), {
        orientation: Number.POSITIVE_INFINITY,
      }),
    RangeError,
    "Initial body state orientation must be finite.",
  );

  assertThrows(
    () =>
      world.addBody(new Body(), {
        angularVelocity: Number.NEGATIVE_INFINITY,
      }),
    RangeError,
    "Initial body state angular velocity must be finite.",
  );

  assertEquals(world.getBodySnapshots(), []);
});

Deno.test("World rejects non-zero initial velocity for a static Body", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });
  const staticBody = new Body({ type: "static" });

  assertThrows(
    () =>
      world.addBody(staticBody, {
        velocity: new Vector2(1, 0),
      }),
    RangeError,
    "Static Body initial velocity must be zero.",
  );

  assertEquals(world.getBodySnapshots(), []);
});

Deno.test("World rejects non-zero initial angular velocity for a static Body", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });
  const staticBody = new Body({ type: "static" });

  assertThrows(
    () =>
      world.addBody(staticBody, {
        angularVelocity: Math.PI / 4,
      }),
    RangeError,
    "Static Body initial angular velocity must be zero.",
  );

  assertEquals(world.getBodySnapshots(), []);
});

Deno.test("World advances every body using the injected integrator", () => {
  const gravity = new Vector2(0, -10);

  const firstNextState = createBodyState(
    new Vector2(5, 6),
    new Vector2(7, 8),
    0.25,
    Math.PI / 5,
  );

  const secondNextState = createBodyState(
    new Vector2(50, 60),
    new Vector2(70, 80),
    -0.5,
    -Math.PI / 6,
  );

  const integrator = new StubIntegrator((state) => {
    if (state.position.x === 1) {
      return firstNextState;
    }

    if (state.position.x === 10) {
      return secondNextState;
    }

    throw new Error("Unexpected state.");
  });

  const world = new World({
    gravity,
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  const body = new Body();

  const firstBodyId = world.addBody(body, {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
    orientation: Math.PI / 6,
    angularVelocity: Math.PI / 4,
  });

  const secondBodyId = world.addBody(body, {
    position: new Vector2(10, 20),
    velocity: new Vector2(30, 40),
    orientation: -Math.PI / 3,
    angularVelocity: -Math.PI / 2,
  });

  world.step(0.5);

  const firstResult = world.getBodyState(firstBodyId);
  const secondResult = world.getBodyState(secondBodyId);

  assert(firstResult !== undefined);
  assert(secondResult !== undefined);

  assertVector(firstResult.position, 5, 6);
  assertVector(firstResult.velocity, 7, 8);
  assertEquals(firstResult.orientation, 0.25);
  assertEquals(firstResult.angularVelocity, Math.PI / 5);

  assertVector(secondResult.position, 50, 60);
  assertVector(secondResult.velocity, 70, 80);
  assertEquals(secondResult.orientation, -0.5);
  assertEquals(secondResult.angularVelocity, -Math.PI / 6);

  assertEquals(integrator.calls.length, 2);

  assertEquals(integrator.calls[0].state.orientation, Math.PI / 6);
  assertEquals(integrator.calls[0].state.angularVelocity, Math.PI / 4);

  assertEquals(integrator.calls[1].state.orientation, -Math.PI / 3);
  assertEquals(integrator.calls[1].state.angularVelocity, -Math.PI / 2);

  for (const call of integrator.calls) {
    assertStrictEquals(call.acceleration, gravity);
    assertEquals(call.dt, 0.5);
  }
});

Deno.test("World preserves static Body state without invoking the integrator", () => {
  const integrator = new StubIntegrator(() => {
    throw new Error("Static Bodies must not be integrated.");
  });
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });
  const staticBody = new Body({ type: "static", shape: new Circle(1) });

  const bodyId = world.addBody(staticBody, {
    position: new Vector2(3, 4),
    orientation: Math.PI / 3,
  });

  world.step(1);

  const state = world.getBodyState(bodyId);

  assert(state !== undefined);
  assertVector(state.position, 3, 4);
  assertVector(state.velocity, 0, 0);
  assertEquals(state.orientation, Math.PI / 3);
  assertEquals(state.angularVelocity, 0);
  assertEquals(integrator.calls, []);
});

Deno.test("World uses updated gravity on subsequent steps", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  world.addBody(new Body());

  const newGravity = new Vector2(4, -2);

  world.setGravity(newGravity);
  world.step(1);

  assertStrictEquals(world.gravity, newGravity);
  assertStrictEquals(integrator.calls[0].acceleration, newGravity);
});

Deno.test("World rejects invalid gravity without replacing the current value", () => {
  const gravity = new Vector2(0, -10);

  const world = new World({
    gravity,
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  assertThrows(
    () => world.setGravity(new Vector2(Number.NaN, 0)),
    RangeError,
    "Gravity must contain finite components.",
  );

  assertStrictEquals(world.gravity, gravity);
});

Deno.test("World rejects an invalid timestep before integrating bodies", () => {
  const integrator = new StubIntegrator((state) => state);

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
    orientation: Math.PI / 7,
    angularVelocity: Math.PI / 9,
  });

  assertThrows(() => world.step(-1), RangeError, "The timestep must not be negative.");

  assertEquals(integrator.calls.length, 0);

  const stateAfterRejectedStep = world.getBodyState(bodyId);

  assert(stateAfterRejectedStep !== undefined);

  assertVector(stateAfterRejectedStep.position, 1, 2);
  assertVector(stateAfterRejectedStep.velocity, 3, 4);
  assertEquals(stateAfterRejectedStep.orientation, Math.PI / 7);
  assertEquals(stateAfterRejectedStep.angularVelocity, Math.PI / 9);
});

Deno.test("World preserves all body states when any integration result is invalid", () => {
  const firstNextState = createBodyState(new Vector2(5, 6), new Vector2(7, 8), 0, Math.PI / 5);

  const invalidSecondState = createBodyState(
    new Vector2(Number.NaN, 60),
    new Vector2(70, 80),
    0,
    -Math.PI / 6,
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

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });

  const body = new Body();

  const firstBodyId = world.addBody(body, {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
    orientation: Math.PI / 6,
    angularVelocity: Math.PI / 4,
  });

  const secondBodyId = world.addBody(body, {
    position: new Vector2(10, 20),
    velocity: new Vector2(30, 40),
    orientation: -Math.PI / 3,
    angularVelocity: -Math.PI / 2,
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
  assertEquals(firstResult.orientation, Math.PI / 6);
  assertEquals(firstResult.angularVelocity, Math.PI / 4);

  assertVector(secondResult.position, 10, 20);
  assertVector(secondResult.velocity, 30, 40);
  assertEquals(secondResult.orientation, -Math.PI / 3);
  assertEquals(secondResult.angularVelocity, -Math.PI / 2);
});

Deno.test("World rejects a non-finite integrator orientation atomically", () => {
  const firstNextState = createBodyState(
    new Vector2(5, 6),
    new Vector2(7, 8),
    0.25,
    Math.PI / 5,
  );
  const invalidSecondState = createBodyState(
    new Vector2(50, 60),
    new Vector2(70, 80),
    Number.NaN,
    -Math.PI / 6,
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

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });
  const body = new Body();

  const firstBodyId = world.addBody(body, {
    position: new Vector2(1, 2),
    orientation: Math.PI / 6,
    angularVelocity: Math.PI / 4,
  });
  const secondBodyId = world.addBody(body, {
    position: new Vector2(10, 20),
    orientation: -Math.PI / 3,
    angularVelocity: -Math.PI / 2,
  });

  assertThrows(
    () => world.step(0.5),
    RangeError,
    `Integrator result for body ${secondBodyId} orientation must be finite.`,
  );

  const firstResult = world.getBodyState(firstBodyId);
  const secondResult = world.getBodyState(secondBodyId);

  assert(firstResult !== undefined);
  assert(secondResult !== undefined);

  assertEquals(firstResult.orientation, Math.PI / 6);
  assertEquals(firstResult.angularVelocity, Math.PI / 4);

  assertEquals(secondResult.orientation, -Math.PI / 3);
  assertEquals(secondResult.angularVelocity, -Math.PI / 2);
});

Deno.test("World rejects a non-finite integrator angular velocity atomically", () => {
  const firstNextState = createBodyState(
    new Vector2(5, 6),
    new Vector2(7, 8),
    0.25,
    Math.PI / 5,
  );
  const invalidSecondState = createBodyState(
    new Vector2(50, 60),
    new Vector2(70, 80),
    -0.5,
    Number.NaN,
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

  const world = new World({
    gravity: new Vector2(0, -10),
    integrator,
    collisionSolver: new StubCollisionSolver(),
  });
  const body = new Body();

  const firstBodyId = world.addBody(body, {
    position: new Vector2(1, 2),
    angularVelocity: Math.PI / 4,
  });
  const secondBodyId = world.addBody(body, {
    position: new Vector2(10, 20),
    angularVelocity: -Math.PI / 2,
  });

  assertThrows(
    () => world.step(0.5),
    RangeError,
    `Integrator result for body ${secondBodyId} angular velocity must be finite.`,
  );

  const firstResult = world.getBodyState(firstBodyId);
  const secondResult = world.getBodyState(secondBodyId);

  assert(firstResult !== undefined);
  assert(secondResult !== undefined);

  assertEquals(firstResult.angularVelocity, Math.PI / 4);
  assertEquals(secondResult.angularVelocity, -Math.PI / 2);
});

Deno.test("World rejects invalid initial gravity", () => {
  assertThrows(
    () =>
      new World({
        gravity: new Vector2(0, Number.POSITIVE_INFINITY),
        integrator: new StubIntegrator((state) => state),
        collisionSolver: new StubCollisionSolver(),
      }),
    RangeError,
    "Gravity must contain finite components.",
  );
});

Deno.test("World exposes snapshots of all bodies", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  const body = new Body();

  const firstId = world.addBody(body, {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
    orientation: Math.PI / 6,
    angularVelocity: Math.PI / 4,
  });

  const secondId = world.addBody(body, {
    position: new Vector2(10, 20),
    velocity: new Vector2(30, 40),
    orientation: -Math.PI / 3,
    angularVelocity: -Math.PI / 2,
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
  assertEquals(first.state.orientation, Math.PI / 6);
  assertEquals(first.state.angularVelocity, Math.PI / 4);

  assertStrictEquals(second.definition, body);
  assertVector(second.state.position, 10, 20);
  assertVector(second.state.velocity, 30, 40);
  assertEquals(second.state.orientation, -Math.PI / 3);
  assertEquals(second.state.angularVelocity, -Math.PI / 2);
});

Deno.test("World snapshots expose Circle geometry through the Body definition", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  const circle = new Circle(2);
  const body = new Body({ shape: circle });

  const bodyId = world.addBody(body, {
    orientation: Math.PI / 5,
    angularVelocity: Math.PI / 7,
  });

  const snapshot = world.getBodySnapshots().find(({ id }) => id === bodyId);

  assert(snapshot !== undefined);
  assertStrictEquals(snapshot.definition, body);
  assertStrictEquals(snapshot.definition.shape, circle);
  assertEquals(snapshot.state.orientation, Math.PI / 5);
  assertEquals(snapshot.state.angularVelocity, Math.PI / 7);
});

Deno.test("World exposes an empty body snapshot collection when empty", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  assertEquals(world.getBodySnapshots(), []);
});

Deno.test("World body snapshots detach runtime state from authoritative world state", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
    orientation: Math.PI / 6,
    angularVelocity: Math.PI / 4,
  });

  const snapshots = world.getBodySnapshots();

  const observedState = snapshots[0].state;

  // Deliberately bypass TypeScript's readonly contract to verify that
  // observed runtime values are not authoritative World state.
  (observedState.position as { x: number }).x = 999;
  (observedState as { angularVelocity: number }).angularVelocity = 999;

  const authoritativeSnapshot = world.getBodyState(bodyId);

  assert(authoritativeSnapshot !== undefined);

  assertVector(authoritativeSnapshot.position, 1, 2);
  assertEquals(authoritativeSnapshot.orientation, Math.PI / 6);
  assertEquals(authoritativeSnapshot.angularVelocity, Math.PI / 4);
});

Deno.test("World getBodyState returns detached state", () => {
  const world = new World({
    gravity: new Vector2(0, -10),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: new StubCollisionSolver(),
  });

  const bodyId = world.addBody(new Body(), {
    position: new Vector2(1, 2),
    velocity: new Vector2(3, 4),
    orientation: Math.PI / 6,
    angularVelocity: Math.PI / 4,
  });

  const observedState = world.getBodyState(bodyId);

  assert(observedState !== undefined);

  (observedState.velocity as { x: number }).x = 999;
  (observedState as { angularVelocity: number }).angularVelocity = 999;

  const nextObservation = world.getBodyState(bodyId);

  assert(nextObservation !== undefined);

  assertVector(nextObservation.velocity, 3, 4);
  assertEquals(nextObservation.orientation, Math.PI / 6);
  assertEquals(nextObservation.angularVelocity, Math.PI / 4);
});

Deno.test("World delegates integrated candidates and detected collisions to its solver", () => {
  const solver = new StubCollisionSolver();
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new StubIntegrator((state) => ({
      ...state,
      position: state.position.add(new Vector2(1, 0)),
    })),
    collisionSolver: solver,
  });
  const circle = new Body({ shape: new Circle(1) });

  const bodyAId = world.addBody(circle, { position: new Vector2(-1, 0) });
  const bodyBId = world.addBody(circle, { position: new Vector2(0, 0) });

  world.step(1);

  assertEquals(solver.calls.length, 1);
  assertEquals(solver.calls[0].bodies.length, 2);
  assertEquals(solver.calls[0].collisions.length, 1);

  const observedA = solver.calls[0].bodies.find(({ id }) => id === bodyAId);
  const observedB = solver.calls[0].bodies.find(({ id }) => id === bodyBId);

  assert(observedA !== undefined);
  assert(observedB !== undefined);
  assertEquals(observedA.state.position, new Vector2(0, 0));
  assertEquals(observedB.state.position, new Vector2(1, 0));
});

Deno.test("World copies solver results across the authoritative-state boundary", () => {
  let solverState: BodyState | undefined;

  const solver = new StubCollisionSolver((bodies) => {
    const input = bodies[0];
    solverState = {
      ...input.state,
      position: new Vector2(10, 20),
      velocity: new Vector2(30, 40),
    };
    return new Map([[input.id, solverState]]);
  });

  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: solver,
  });
  const bodyId = world.addBody(new Body());

  world.step(0);

  assert(solverState !== undefined);
  (solverState.position as { x: number }).x = 999;
  (solverState as { angularVelocity: number }).angularVelocity = 999;

  const authoritative = world.getBodyState(bodyId);
  assert(authoritative !== undefined);
  assertEquals(authoritative.position, new Vector2(10, 20));
  assertEquals(authoritative.velocity, new Vector2(30, 40));
  assertEquals(authoritative.angularVelocity, 0);
});

Deno.test("World rejects an incomplete solver result atomically", () => {
  const solver = new StubCollisionSolver(
    (bodies) => new Map([[bodies[0].id, bodies[0].state]]),
  );
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new StubIntegrator((state) => ({
      ...state,
      position: state.position.add(new Vector2(1, 0)),
    })),
    collisionSolver: solver,
  });

  const firstId = world.addBody(new Body(), { position: new Vector2(1, 0) });
  const secondId = world.addBody(new Body(), { position: new Vector2(2, 0) });

  assertThrows(
    () => world.step(1),
    Error,
    "Collision solver must return exactly one state for every World body.",
  );

  assertEquals(world.getBodyState(firstId)?.position, new Vector2(1, 0));
  assertEquals(world.getBodyState(secondId)?.position, new Vector2(2, 0));
});

Deno.test("World rejects a non-finite solver result atomically", () => {
  const solver = new StubCollisionSolver((bodies) => {
    const result = new Map<BodyId, BodyState>();
    for (const body of bodies) {
      result.set(body.id, body.state);
    }
    const second = bodies[1];
    result.set(second.id, {
      ...second.state,
      velocity: new Vector2(Number.NaN, 0),
    });
    return result;
  });
  const world = new World({
    gravity: new Vector2(0, 0),
    integrator: new StubIntegrator((state) => state),
    collisionSolver: solver,
  });

  const firstId = world.addBody(new Body(), { position: new Vector2(1, 0) });
  const secondId = world.addBody(new Body(), { position: new Vector2(2, 0) });

  assertThrows(
    () => world.step(0),
    RangeError,
    `Collision solver result for body ${secondId} velocity must contain finite components.`,
  );

  assertEquals(world.getBodyState(firstId)?.position, new Vector2(1, 0));
  assertEquals(world.getBodyState(secondId)?.position, new Vector2(2, 0));
});
