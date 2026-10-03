import { assertEquals, assertThrows } from "@std/assert";

import {
  Body,
  type BodyState,
  type KinematicIntegrator,
  Vector2,
  World,
} from "../../engine/mod.ts";
import { Simulation } from "../../simulation/simulation.ts";
import { BrowserSimulationRuntime } from "./simulation-runtime.ts";

class TrackingIntegrator implements KinematicIntegrator {
  readonly dts: number[] = [];

  public integrate(state: BodyState, _acceleration: Vector2, dt: number): BodyState {
    this.dts.push(dt);

    return state;
  }
}

class FakeAnimationFrameScheduler {
  readonly #callbacks: Array<(timestamp: number) => void> = [];
  #nextId = 1;

  public readonly requestFrame = (callback: (timestamp: number) => void): number => {
    this.#callbacks.push(callback);

    return this.#nextId++;
  };

  public get pendingFrameCount(): number {
    return this.#callbacks.length;
  }

  public runNext(timestamp: number): void {
    const callback = this.#callbacks.shift();

    if (callback === undefined) {
      throw new Error("No animation frame is pending.");
    }

    callback(timestamp);
  }
}

function createSimulation(integrator: KinematicIntegrator): Simulation {
  const world = new World({
    gravity: new Vector2(0, -9.81),
    integrator,
  });

  world.addBody(new Body());

  return new Simulation([world]);
}

Deno.test("BrowserSimulationRuntime rejects an invalid fixed timestep", () => {
  const simulation = createSimulation(new TrackingIntegrator());

  assertThrows(
    () =>
      new BrowserSimulationRuntime(
        simulation,
        {
          fixedTimestep: 0,
          maxFrameDelta: 0.25,
          onFrame: () => {},
        },
        () => 1,
      ),
    RangeError,
    "Fixed timestep must be a positive finite number.",
  );

  assertThrows(
    () =>
      new BrowserSimulationRuntime(
        simulation,
        {
          fixedTimestep: Number.NaN,
          maxFrameDelta: 0.25,
          onFrame: () => {},
        },
        () => 1,
      ),
    RangeError,
    "Fixed timestep must be a positive finite number.",
  );
});

Deno.test("BrowserSimulationRuntime rejects an invalid maximum frame delta", () => {
  const simulation = createSimulation(new TrackingIntegrator());

  assertThrows(
    () =>
      new BrowserSimulationRuntime(
        simulation,
        {
          fixedTimestep: 1 / 60,
          maxFrameDelta: 0,
          onFrame: () => {},
        },
        () => 1,
      ),
    RangeError,
    "Maximum frame delta must be a positive finite number.",
  );

  assertThrows(
    () =>
      new BrowserSimulationRuntime(
        simulation,
        {
          fixedTimestep: 1 / 60,
          maxFrameDelta: Number.POSITIVE_INFINITY,
          onFrame: () => {},
        },
        () => 1,
      ),
    RangeError,
    "Maximum frame delta must be a positive finite number.",
  );
});

Deno.test("BrowserSimulationRuntime run renders initial state and schedules one frame", () => {
  const scheduler = new FakeAnimationFrameScheduler();
  const simulation = createSimulation(new TrackingIntegrator());

  let frameCount = 0;

  const runtime = new BrowserSimulationRuntime(
    simulation,
    {
      fixedTimestep: 0.125,
      maxFrameDelta: 0.25,
      onFrame: () => {
        frameCount++;
      },
    },
    scheduler.requestFrame,
  );

  runtime.run();

  assertEquals(frameCount, 1);
  assertEquals(scheduler.pendingFrameCount, 1);
});

Deno.test("BrowserSimulationRuntime run is idempotent", () => {
  const scheduler = new FakeAnimationFrameScheduler();
  const simulation = createSimulation(new TrackingIntegrator());

  let frameCount = 0;

  const runtime = new BrowserSimulationRuntime(
    simulation,
    {
      fixedTimestep: 0.125,
      maxFrameDelta: 0.25,
      onFrame: () => {
        frameCount++;
      },
    },
    scheduler.requestFrame,
  );

  runtime.run();
  runtime.run();

  assertEquals(frameCount, 1);
  assertEquals(scheduler.pendingFrameCount, 1);
});

Deno.test(
  "BrowserSimulationRuntime first browser timestamp establishes the clock baseline",
  () => {
    const scheduler = new FakeAnimationFrameScheduler();
    const integrator = new TrackingIntegrator();
    const simulation = createSimulation(integrator);

    let frameCount = 0;

    const runtime = new BrowserSimulationRuntime(
      simulation,
      {
        fixedTimestep: 0.125,
        maxFrameDelta: 0.25,
        onFrame: () => {
          frameCount++;
        },
      },
      scheduler.requestFrame,
    );

    runtime.run();
    scheduler.runNext(1_000);

    assertEquals(integrator.dts, []);
    assertEquals(frameCount, 1);
    assertEquals(scheduler.pendingFrameCount, 1);
  },
);

Deno.test(
  "BrowserSimulationRuntime consumes accumulated time through fixed Simulation steps",
  () => {
    const scheduler = new FakeAnimationFrameScheduler();
    const integrator = new TrackingIntegrator();
    const simulation = createSimulation(integrator);

    const observedStepCounts: number[] = [];

    const runtime = new BrowserSimulationRuntime(
      simulation,
      {
        fixedTimestep: 0.125,
        maxFrameDelta: 0.25,
        onFrame: () => {
          observedStepCounts.push(integrator.dts.length);
        },
      },
      scheduler.requestFrame,
    );

    runtime.run();

    scheduler.runNext(1_000);
    scheduler.runNext(1_250);

    assertEquals(integrator.dts, [0.125, 0.125]);
    assertEquals(observedStepCounts, [0, 2]);
    assertEquals(scheduler.pendingFrameCount, 1);
  },
);

Deno.test("BrowserSimulationRuntime carries fractional accumulated time across frames", () => {
  const scheduler = new FakeAnimationFrameScheduler();
  const integrator = new TrackingIntegrator();
  const simulation = createSimulation(integrator);

  const runtime = new BrowserSimulationRuntime(
    simulation,
    {
      fixedTimestep: 0.125,
      maxFrameDelta: 0.25,
      onFrame: () => {},
    },
    scheduler.requestFrame,
  );

  runtime.run();

  scheduler.runNext(1_000);
  scheduler.runNext(1_187.5);
  scheduler.runNext(1_250);

  assertEquals(integrator.dts, [0.125, 0.125]);
});

Deno.test("BrowserSimulationRuntime clamps a large browser frame delta", () => {
  const scheduler = new FakeAnimationFrameScheduler();
  const integrator = new TrackingIntegrator();
  const simulation = createSimulation(integrator);

  const runtime = new BrowserSimulationRuntime(
    simulation,
    {
      fixedTimestep: 0.125,
      maxFrameDelta: 0.25,
      onFrame: () => {},
    },
    scheduler.requestFrame,
  );

  runtime.run();

  scheduler.runNext(1_000);
  scheduler.runNext(2_000);

  assertEquals(integrator.dts, [0.125, 0.125]);
});
