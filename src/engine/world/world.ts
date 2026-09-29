import type { Body } from "../body/body.ts";
import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import {
  assertFiniteBodyState,
  assertFiniteVector,
  assertValidTimestep,
} from "../kinematics/validation.ts";
import { Vector2 } from "../math/vector2.ts";
import type { BodyId } from "./body-id.ts";
import type { BodyInitialConditions } from "./body-initial-conditions.ts";
import type { BodySnapshot } from "./body-snapshot.ts";
import type { BodyState } from "./body-state.ts";

interface WorldBody {
  readonly definition: Body;
  state: BodyState;
}

/**
 * Owns and advances the runtime state of a collection of identified body
 * instances.
 *
 * Reusable {@link Body} definitions enter the world through `addBody(...)`.
 * Initial position and velocity are supplied separately as world-specific
 * initial conditions. The world copies those values into authoritative runtime
 * state that remains private and may be observed through detached snapshots.
 *
 * All body instances currently share the same world gravity and numerical
 * integration strategy.
 */
export class World {
  #nextBodyId: BodyId = 1;

  readonly #bodies = new Map<BodyId, WorldBody>();
  readonly #integrator: KinematicIntegrator;

  #gravity: Vector2;

  /**
   * Creates a world.
   *
   * @param gravity The gravitational acceleration applied to every body,
   * expressed in world units per second squared.
   * @param integrator The numerical integration strategy used to advance body
   * states.
   * @throws {RangeError} If the gravity vector contains a non-finite component.
   */
  public constructor(gravity: Vector2, integrator: KinematicIntegrator) {
    assertFiniteVector(gravity, "Gravity");

    this.#gravity = gravity;
    this.#integrator = integrator;
  }

  /**
   * The gravitational acceleration currently applied to every body in the
   * world, expressed in world units per second squared.
   */
  public get gravity(): Vector2 {
    return this.#gravity;
  }

  /**
   * Changes the gravity used by subsequent world steps.
   *
   * @param gravity The new gravitational acceleration, expressed in world
   * units per second squared.
   * @throws {RangeError} If either component is not finite.
   */
  public setGravity(gravity: Vector2): void {
    assertFiniteVector(gravity, "Gravity");

    this.#gravity = gravity;
  }

  /**
   * Adds a reusable body definition to the world as an independent runtime
   * instance.
   *
   * Position and velocity are world-specific initial conditions rather than
   * intrinsic body properties. Omitted values default to zero. The supplied
   * vectors are copied before becoming authoritative runtime state.
   *
   * The same body definition may be added more than once, including to
   * different worlds. Each addition receives its own world-local identifier
   * and independent runtime state.
   *
   * @param body The reusable body definition to instantiate in this world.
   * @param initialConditions Optional initial position and velocity.
   * @returns The world-local identifier assigned to the new body instance.
   * @throws {RangeError} If an initial condition contains a non-finite
   * component.
   */
  public addBody(body: Body, initialConditions: BodyInitialConditions = {}): BodyId {
    const position = initialConditions.position ?? new Vector2(0, 0);
    const velocity = initialConditions.velocity ?? new Vector2(0, 0);

    const initialState: BodyState = {
      position: new Vector2(position.x, position.y),
      velocity: new Vector2(velocity.x, velocity.y),
    };

    assertFiniteBodyState(initialState, "Initial body state");

    const bodyId = this.#nextBodyId++;

    this.#bodies.set(bodyId, {
      definition: body,
      state: initialState,
    });

    return bodyId;
  }

  /**
   * Returns a detached snapshot of the current runtime state of a body.
   *
   * Modifying the returned state cannot change the authoritative state owned by
   * the world.
   *
   * @param bodyId The identifier of the body to observe.
   * @returns A snapshot of the body's current state, or `undefined` when the
   * identifier does not belong to this world.
   */
  public getBodyState(bodyId: BodyId): BodyState | undefined {
    const worldBody = this.#bodies.get(bodyId);

    return worldBody === undefined ? undefined : copyState(worldBody.state);
  }

  /**
   * Returns observations of all bodies currently owned by the world.
   *
   * The returned array and runtime states are detached from authoritative World
   * storage. Each snapshot intentionally shares the immutable reusable Body
   * definition that was supplied to `addBody(...)`, allowing observers to read
   * intrinsic properties such as geometry without duplicating definition data.
   *
   * Snapshot order should not be interpreted as part of the world's public
   * contract.
   *
   * @returns A snapshot for every body currently in the world.
   */
  public getBodySnapshots(): readonly BodySnapshot[] {
    return Array.from(this.#bodies, ([id, worldBody]): BodySnapshot => ({
      id,
      definition: worldBody.definition,
      state: copyState(worldBody.state),
    }));
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

    const nextStates = new Map<BodyId, BodyState>();

    for (const [bodyId, worldBody] of this.#bodies) {
      const nextState = this.#integrator.integrate(worldBody.state, this.#gravity, dt);

      assertFiniteBodyState(nextState, `Integrator result for body ${bodyId}`);

      nextStates.set(bodyId, nextState);
    }

    for (const [bodyId, nextState] of nextStates) {
      const worldBody = this.#bodies.get(bodyId);

      if (worldBody === undefined) {
        throw new Error(`Body ${bodyId} disappeared during an atomic world step.`);
      }

      worldBody.state = nextState;
    }
  }
}

function copyState(state: BodyState): BodyState {
  return {
    position: new Vector2(state.position.x, state.position.y),
    velocity: new Vector2(state.velocity.x, state.velocity.y),
  };
}
