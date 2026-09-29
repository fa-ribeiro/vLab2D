import type { Simulation } from "../../simulation/simulation.ts";

/**
 * Configures fixed-timestep browser execution for a Simulation.
 */
export interface BrowserSimulationRuntimeOptions {
  /**
   * The deterministic Simulation timestep in seconds.
   */
  readonly fixedTimestep: number;

  /**
   * The maximum wall-clock frame delta accumulated from one browser frame.
   *
   * Clamping prevents the Runtime from attempting to simulate an arbitrarily
   * large backlog after the browser suspends or heavily delays animation
   * frames.
   */
  readonly maxFrameDelta: number;

  /**
   * Invoked once for the initial frame and once after each processed browser
   * frame.
   *
   * The callback may observe Worlds and render current state, but Runtime does
   * not know what presentation technology, if any, the callback uses.
   */
  readonly onFrame: () => void;
}

type RequestFrame = (callback: (timestamp: number) => void) => number;

/**
 * Drives a deterministic Simulation from browser animation-frame timing.
 *
 * Browser wall-clock time is scheduling input only. The Runtime accumulates
 * elapsed frame time and advances the Simulation through zero or more
 * fixed-size `step(dt)` calls before invoking the host frame callback.
 *
 * The Runtime does not own rendering, input handling, World state, or
 * Simulation status. It only owns browser frame scheduling and fixed-timestep
 * accumulation.
 */
export class BrowserSimulationRuntime {
  readonly #simulation: Simulation;
  readonly #fixedTimestep: number;
  readonly #maxFrameDelta: number;
  readonly #onFrame: () => void;
  readonly #requestFrame: RequestFrame;

  #running = false;
  #previousTimestamp: number | undefined;
  #accumulator = 0;

  /**
   * Creates a browser Simulation Runtime.
   *
   * @param simulation The deterministic Simulation to drive.
   * @param options Fixed-timestep and host-frame configuration.
   * @param requestFrame Optional animation-frame scheduling function. Browser
   * callers normally omit this argument; it exists so the host dependency can
   * be replaced in tests or alternate browser-like environments.
   * @throws {RangeError} If the fixed timestep or maximum frame delta is not a
   * positive finite number.
   */
  public constructor(
    simulation: Simulation,
    options: BrowserSimulationRuntimeOptions,
    requestFrame: RequestFrame = (callback) => requestAnimationFrame(callback),
  ) {
    assertPositiveFinite(options.fixedTimestep, "Fixed timestep");
    assertPositiveFinite(options.maxFrameDelta, "Maximum frame delta");

    this.#simulation = simulation;
    this.#fixedTimestep = options.fixedTimestep;
    this.#maxFrameDelta = options.maxFrameDelta;
    this.#onFrame = options.onFrame;
    this.#requestFrame = requestFrame;
  }

  /**
   * Starts browser-driven Simulation execution.
   *
   * The initial host frame callback runs synchronously so current World state
   * can be presented before the first animation-frame timestamp arrives.
   *
   * Calling `run()` again after execution has started has no effect.
   */
  public run(): void {
    if (this.#running) {
      return;
    }

    this.#running = true;

    this.#onFrame();
    this.#requestFrame(this.#frame);
  }

  readonly #frame = (timestamp: number): void => {
    if (this.#previousTimestamp === undefined) {
      this.#previousTimestamp = timestamp;
      this.#requestFrame(this.#frame);
      return;
    }

    const frameDelta = (timestamp - this.#previousTimestamp) / 1000;
    this.#previousTimestamp = timestamp;

    this.#accumulator += Math.min(frameDelta, this.#maxFrameDelta);

    while (this.#accumulator >= this.#fixedTimestep) {
      this.#simulation.step(this.#fixedTimestep);
      this.#accumulator -= this.#fixedTimestep;
    }

    this.#onFrame();
    this.#requestFrame(this.#frame);
  };
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}
