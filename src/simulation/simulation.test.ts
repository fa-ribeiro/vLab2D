import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";

import {
  Body,
  type BodyState,
  type KinematicIntegrator,
  Vector2,
  World,
} from "../engine/mod.ts";
import { Simulation } from "./simulation.ts";

class TrackingIntegrator implements KinematicIntegrator {
  readonly dts: number[] = [];

  public constructor(
    private readonly integrateState: (
      state: BodyState,
      acceleration: Vector2,
      dt: number,
    ) => BodyState,
  ) {}

  public integrate(state: BodyState, acceleration: Vector2, dt: number): BodyState {
    this.dts.push(dt);

    return this.integrateState(state, acceleration, dt);
  }
}

function createWorld(integrator: KinematicIntegrator): World {
  const world = new World({
    gravity: new Vector2(0, -9.81),
    integrator,
  });

  world.addBody(new Body());

  return world;
}

Deno.test("Simulation requires at least one World", () => {
  assertThrows(
    () => new Simulation([]),
    RangeError,
    "A simulation must contain at least one world.",
  );
});

Deno.test("Simulation rejects duplicate World references", () => {
  const world = createWorld(new TrackingIntegrator((state) => state));

  assertThrows(
    () => new Simulation([world, world]),
    RangeError,
    "A simulation cannot contain the same world more than once.",
  );
});

Deno.test("Simulation detaches its World membership from caller arrays", () => {
  const firstWorld = createWorld(new TrackingIntegrator((state) => state));
  const secondWorld = createWorld(new TrackingIntegrator((state) => state));

  const suppliedWorlds = [firstWorld];
  const simulation = new Simulation(suppliedWorlds);

  suppliedWorlds.push(secondWorld);

  const observedWorlds = simulation.getWorlds();

  assertEquals(observedWorlds, [firstWorld]);

  // Deliberately bypass readonly to prove the returned collection is detached.
  (observedWorlds as World[]).push(secondWorld);

  assertEquals(simulation.getWorlds(), [firstWorld]);
  assertEquals(simulation.getWorldStatus(secondWorld), undefined);
});

Deno.test("Simulation reports active status for member Worlds", () => {
  const world = createWorld(new TrackingIntegrator((state) => state));
  const outsideWorld = createWorld(new TrackingIntegrator((state) => state));

  const simulation = new Simulation([world]);

  assertEquals(simulation.getWorldStatus(world), { status: "active" });
  assertEquals(simulation.getWorldStatus(outsideWorld), undefined);

  const observedStatus = simulation.getWorldStatus(world);

  // Deliberately bypass readonly to prove status observations are detached.
  if (observedStatus !== undefined) {
    (observedStatus as { status: string }).status = "failed";
  }

  assertEquals(simulation.getWorldStatus(world), { status: "active" });
});

Deno.test(
  "Simulation steps every active World once in constructor order with the same timestep",
  () => {
    const callOrder: string[] = [];

    const firstIntegrator = new TrackingIntegrator((state) => {
      callOrder.push("first");
      return state;
    });

    const secondIntegrator = new TrackingIntegrator((state) => {
      callOrder.push("second");
      return state;
    });

    const firstWorld = createWorld(firstIntegrator);
    const secondWorld = createWorld(secondIntegrator);

    const simulation = new Simulation([firstWorld, secondWorld]);

    simulation.step(0.25);

    assertEquals(callOrder, ["first", "second"]);
    assertEquals(firstIntegrator.dts, [0.25]);
    assertEquals(secondIntegrator.dts, [0.25]);
  },
);

Deno.test("Simulation rejects an invalid timestep before touching any World", () => {
  const firstIntegrator = new TrackingIntegrator((state) => state);
  const secondIntegrator = new TrackingIntegrator((state) => state);

  const firstWorld = createWorld(firstIntegrator);
  const secondWorld = createWorld(secondIntegrator);

  const simulation = new Simulation([firstWorld, secondWorld]);

  assertThrows(() => simulation.step(-1), RangeError, "The timestep must not be negative.");

  assertThrows(() => simulation.step(Number.NaN), RangeError, "The timestep must be finite.");

  assertEquals(firstIntegrator.dts, []);
  assertEquals(secondIntegrator.dts, []);

  assertEquals(simulation.getWorldStatus(firstWorld), { status: "active" });
  assertEquals(simulation.getWorldStatus(secondWorld), { status: "active" });
});

Deno.test("Simulation records a World failure and continues stepping later Worlds", () => {
  const expectedError = new Error("Experimental integrator failed.");

  const firstIntegrator = new TrackingIntegrator((state) => state);
  const failingIntegrator = new TrackingIntegrator(() => {
    throw expectedError;
  });
  const laterIntegrator = new TrackingIntegrator((state) => state);

  const firstWorld = createWorld(firstIntegrator);
  const failingWorld = createWorld(failingIntegrator);
  const laterWorld = createWorld(laterIntegrator);

  const simulation = new Simulation([firstWorld, failingWorld, laterWorld]);

  simulation.step(0.5);

  assertEquals(firstIntegrator.dts, [0.5]);
  assertEquals(failingIntegrator.dts, [0.5]);
  assertEquals(laterIntegrator.dts, [0.5]);

  assertEquals(simulation.getWorldStatus(firstWorld), { status: "active" });
  assertEquals(simulation.getWorldStatus(laterWorld), { status: "active" });

  const failedStatus = simulation.getWorldStatus(failingWorld);

  assertEquals(failedStatus?.status, "failed");

  if (failedStatus?.status === "failed") {
    assertStrictEquals(failedStatus.error, expectedError);
  }
});

Deno.test("Simulation skips failed Worlds on subsequent steps", () => {
  const expectedError = new Error("Experimental integrator failed.");

  const failingIntegrator = new TrackingIntegrator(() => {
    throw expectedError;
  });
  const activeIntegrator = new TrackingIntegrator((state) => state);

  const failingWorld = createWorld(failingIntegrator);
  const activeWorld = createWorld(activeIntegrator);

  const simulation = new Simulation([failingWorld, activeWorld]);

  simulation.step(0.1);
  simulation.step(0.2);

  assertEquals(failingIntegrator.dts, [0.1]);
  assertEquals(activeIntegrator.dts, [0.1, 0.2]);

  const failedStatus = simulation.getWorldStatus(failingWorld);

  assertEquals(failedStatus?.status, "failed");

  if (failedStatus?.status === "failed") {
    assertStrictEquals(failedStatus.error, expectedError);
  }
});
