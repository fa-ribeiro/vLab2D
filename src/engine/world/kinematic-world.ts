import { assertFiniteState } from "../kinematics/validation.ts";
import { KinematicState } from "../kinematics/kinematic-state.ts";
import type { BodyId } from "./body-id.ts";

/**
 * Owns the kinematic state of a collection of identified bodies.
 *
 * Bodies are represented externally by {@link BodyId} values. Their
 * authoritative state remains private to the world and may be observed through
 * the world's public API.
 *
 * This initial world implementation is intentionally limited to body creation
 * and state observation. Simulation stepping and other world behavior will be
 * introduced separately as concrete requirements arise.
 */
export class KinematicWorld {
  #nextBodyId: BodyId = 1;

  readonly #bodies = new Map<BodyId, KinematicState>();

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
}
