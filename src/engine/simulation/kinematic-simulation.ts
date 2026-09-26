import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import { KinematicState } from "../kinematics/kinematic-state.ts";
import { Vector2 } from "../math/vector2.ts";
import { assertFiniteState, assertFiniteVector } from "../kinematics/validation.ts";

/**
 * Owns and advances the authoritative state of a single two-dimensional
 * kinematic simulation.
 *
 * External consumers may observe the current state and acceleration, but
 * changes are performed only through the simulation's public commands.
 *
 * Numerical integration is delegated to an injected
 * {@link KinematicIntegrator}, keeping state ownership independent from the
 * numerical algorithm used to advance that state.
 */
export class KinematicSimulation {
  readonly #integrator: KinematicIntegrator;

  #state: KinematicState;
  #acceleration: Vector2;

  /**
   * Creates a kinematic simulation.
   *
   * The initial state and acceleration must contain only finite numeric values.
   *
   * @param initialState The initial position and velocity.
   * @param acceleration The initial acceleration, expressed in world units per
   * second squared.
   * @param integrator The numerical strategy used to advance the simulation.
   * @throws {RangeError} If the initial state or acceleration contains a
   * non-finite component.
   */
  public constructor(
    initialState: KinematicState,
    acceleration: Vector2,
    integrator: KinematicIntegrator,
  ) {
    assertFiniteState(initialState, "Initial state");
    assertFiniteVector(acceleration, "Acceleration");

    this.#state = initialState;
    this.#acceleration = acceleration;
    this.#integrator = integrator;
  }

  /**
   * The current kinematic state.
   */
  public get state(): KinematicState {
    return this.#state;
  }

  /**
   * The acceleration currently applied to the simulation, expressed in world
   * units per second squared.
   */
  public get acceleration(): Vector2 {
    return this.#acceleration;
  }

  /**
   * Changes the acceleration used by subsequent simulation steps.
   *
   * @param acceleration The new acceleration, expressed in world units per
   * second squared.
   * @throws {RangeError} If either acceleration component is not finite.
   */
  public setAcceleration(acceleration: Vector2): void {
    assertFiniteVector(acceleration, "Acceleration");

    this.#acceleration = acceleration;
  }

  /**
   * Advances the simulation by one timestep.
   *
   * The integrator first produces a candidate state. The simulation validates
   * that candidate before replacing its current authoritative state, ensuring
   * that a failed integration cannot partially update the simulation.
   *
   * @param dt The timestep duration in seconds.
   * @throws {RangeError} If the timestep is negative or not finite, or if the
   * integrator produces a state containing non-finite values.
   */
  public step(dt: number): void {
    if (!Number.isFinite(dt)) {
      throw new RangeError("The timestep must be finite.");
    }

    if (dt < 0) {
      throw new RangeError("The timestep must not be negative.");
    }

    const nextState = this.#integrator.integrate(this.#state, this.#acceleration, dt);

    assertFiniteState(nextState, "Integrator result");

    this.#state = nextState;
  }
}
