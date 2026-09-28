import type { World } from "../engine/mod.ts";

/**
 * Describes whether a World can still participate in Simulation stepping.
 */
export type SimulationWorldStatus = { readonly status: "active" } | {
  readonly status: "failed";
  readonly error: unknown;
};

/**
 * Deterministically coordinates stepping of one or more Worlds.
 *
 * A Simulation owns World membership and per-World execution status, but it
 * does not own physical World state. Worlds remain authoritative over their
 * bodies, environment, and integration behavior.
 *
 * When one World throws while processing a valid timestep, that World is marked
 * as failed and later Worlds are still stepped. Failed Worlds are skipped on
 * subsequent Simulation steps.
 */
export class Simulation {
  readonly #worlds: readonly World[];
  readonly #worldSet: ReadonlySet<World>;
  readonly #failures = new Map<World, unknown>();

  /**
   * Creates a Simulation with fixed World membership.
   *
   * @param worlds The unique Worlds coordinated by this Simulation.
   * @throws {RangeError} If no Worlds are supplied or the same World reference
   * appears more than once.
   */
  public constructor(worlds: readonly World[]) {
    if (worlds.length === 0) {
      throw new RangeError("A simulation must contain at least one world.");
    }

    const worldSet = new Set(worlds);

    if (worldSet.size !== worlds.length) {
      throw new RangeError("A simulation cannot contain the same world more than once.");
    }

    this.#worlds = [...worlds];
    this.#worldSet = worldSet;
  }

  /**
   * Returns the Worlds coordinated by this Simulation.
   *
   * The returned array is detached from the Simulation's membership storage.
   * Mutating it cannot add, remove, or reorder Worlds inside the Simulation.
   * The World references themselves are the actual coordinated Worlds.
   */
  public getWorlds(): readonly World[] {
    return [...this.#worlds];
  }

  /**
   * Returns the execution status of a World in this Simulation.
   *
   * Status observations are detached values. A failed status retains the
   * original value thrown by the World so experiments can inspect the actual
   * failure.
   *
   * @param world The World whose status should be observed.
   * @returns The current status, or `undefined` when the World is not a member
   * of this Simulation.
   */
  public getWorldStatus(world: World): SimulationWorldStatus | undefined {
    if (!this.#worldSet.has(world)) {
      return undefined;
    }

    if (this.#failures.has(world)) {
      return {
        status: "failed",
        error: this.#failures.get(world),
      };
    }

    return { status: "active" };
  }

  /**
   * Advances every active World by the same timestep.
   *
   * An invalid Simulation timestep is rejected before any World is touched.
   * Exceptions from an individual World are captured as that World's terminal
   * failed status and do not prevent later active Worlds from advancing.
   *
   * @param dt The timestep duration in seconds.
   * @throws {RangeError} If the timestep is negative or not finite.
   */
  public step(dt: number): void {
    assertValidTimestep(dt);

    for (const world of this.#worlds) {
      if (this.#failures.has(world)) {
        continue;
      }

      try {
        world.step(dt);
      } catch (error) {
        this.#failures.set(world, error);
      }
    }
  }
}

function assertValidTimestep(dt: number): void {
  if (!Number.isFinite(dt)) {
    throw new RangeError("The timestep must be finite.");
  }

  if (dt < 0) {
    throw new RangeError("The timestep must not be negative.");
  }
}
