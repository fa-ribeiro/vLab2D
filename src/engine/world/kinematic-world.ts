import {
  assertFiniteState,
  assertFiniteVector,
  assertValidTimestep,
} from "../kinematics/validation.ts";
import { KinematicState } from "../kinematics/kinematic-state.ts";
import { Vector2 } from "../math/vector2.ts";
import type { BodyId } from "./body-id.ts";
import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";

/**
 * Owns and advances the kinematic state of a collection of identified bodies.
 *
 * Bodies are represented externally by {@link BodyId} values. Their
 * authoritative state remains private to the world and may be observed through
 * the world's public API.
 *
 * All bodies currently share the same world acceleration and numerical
 * integration strategy.
 */
export class KinematicWorld {
  #nextBodyId: BodyId = 1;

  readonly #bodies = new Map<BodyId, KinematicState>();
  readonly #integrator: KinematicIntegrator;

  #acceleration: Vector2;

  /**
   * Creates a kinematic world.
   *
   * @param acceleration The constant acceleration applied to every body,
   * expressed in world units per second squared.
   * @param integrator The numerical integration strategy used to advance body
   * states.
   * @throws {RangeError} If the acceleration contains a non-finite component.
   */
  public constructor(acceleration: Vector2, integrator: KinematicIntegrator) {
    assertFiniteVector(acceleration, "Acceleration");

    this.#acceleration = acceleration;
    this.#integrator = integrator;
  }

  /**
   * The acceleration currently applied to every body in the world, expressed
   * in world units per second squared.
   */
  public get acceleration(): Vector2 {
    return this.#acceleration;
  }

  /**
   * Changes the acceleration used by subsequent world steps.
   *
   * @param acceleration The new acceleration, expressed in world units per
   * second squared.
   * @throws {RangeError} If either component is not finite.
   */
  public setAcceleration(acceleration: Vector2): void {
    assertFiniteVector(acceleration, "Acceleration");

    this.#acceleration = acceleration;
  }

  /**
   * Creates a body with the supplied initial kinematic state.
   *
   * The world validates the state before accepting it. A failed creation does
   * not add a body to the world.
   *
   * @param initialState The body's initial position and velocity.
   * @returns The identifier assigned to the newly created body.
   * @throws {RangeError} If the initial state contains a non-finite component.
   */
  public createBody(initialState: KinematicState): BodyId {
    assertFiniteState(initialState, "Initial body state");

    const bodyId = this.#nextBodyId++;

    this.#bodies.set(bodyId, initialState);

    return bodyId;
  }

  /**
   * Returns the current kinematic state of a body.
   *
   * @param bodyId The identifier of the body to observe.
   * @returns The body's current state, or `undefined` when the identifier does
   * not belong to this world.
   */
  public getBodyState(bodyId: BodyId): KinematicState | undefined {
    return this.#bodies.get(bodyId);
  }

  /**
   * Advances every body in the world by one timestep.
   *
   * Candidate states are calculated and validated for every body before any
   * authoritative body state is replaced. If integration of any body produces
   * an invalid state, the entire world step is rejected and all current body
   * states remain unchanged.
   *
   * @param dt The timestep duration in seconds.
   * @throws {RangeError} If the timestep is negative or not finite, or if an
   * integrator result contains a non-finite component.
   */
  public step(dt: number): void {
    assertValidTimestep(dt);

    const nextStates = new Map<BodyId, KinematicState>();

    for (const [bodyId, state] of this.#bodies) {
      const nextState = this.#integrator.integrate(state, this.#acceleration, dt);

      assertFiniteState(nextState, `Integrator result for body ${bodyId}`);

      nextStates.set(bodyId, nextState);
    }

    for (const [bodyId, nextState] of nextStates) {
      this.#bodies.set(bodyId, nextState);
    }
  }
}
