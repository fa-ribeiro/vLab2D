import type { Body } from "../body/body.ts";
import { detectBodyCollisions } from "../collision/detect-body-collisions.ts";
import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import {
  assertFiniteBodyState,
  assertFiniteVector,
  assertValidTimestep,
} from "../kinematics/validation.ts";
import { Vector2 } from "../math/vector2.ts";
import type { CollisionSolver } from "../solver/collision-solver.ts";
import type { BodyId } from "./body-id.ts";
import type { BodyInitialConditions } from "./body-initial-conditions.ts";
import type { BodySnapshot } from "./body-snapshot.ts";
import type { BodyState } from "./body-state.ts";
import type { WorldConfig } from "./world-config.ts";

interface WorldBody {
  readonly definition: Body;
  state: BodyState;
}

/**
 * Owns and advances the runtime state of a collection of identified body
 * instances.
 *
 * Reusable {@link Body} definitions enter the world through `addBody(...)`.
 * Initial position, velocity, orientation, and angular velocity are supplied
 * separately as world-specific initial conditions. The world copies those
 * values into authoritative runtime state that remains private and may be
 * observed through detached snapshots.
 *
 * World owns body lifecycle, authoritative state, environment gravity, and the
 * atomic timestep boundary. It delegates numerical integration and collision
 * response to injected policies. Collision detection is still the current
 * concrete engine detector and will be extracted behind its own strategy
 * boundary separately.
 */
export class World {
  #nextBodyId: BodyId = 1;

  readonly #bodies = new Map<BodyId, WorldBody>();
  readonly #integrator: KinematicIntegrator;
  readonly #collisionSolver: CollisionSolver;

  #gravity: Vector2;

  /**
   * Creates a World from explicit environment and physics-policy choices.
   *
   * @param config Complete World configuration.
   * @throws {RangeError} If gravity contains a non-finite component.
   */
  public constructor(config: WorldConfig) {
    assertFiniteVector(config.gravity, "Gravity");

    this.#gravity = config.gravity;
    this.#integrator = config.integrator;
    this.#collisionSolver = config.collisionSolver;
  }

  /**
   * The gravitational acceleration currently applied to every dynamic body in
   * the world, expressed in world units per second squared.
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
   * Position, velocity, orientation, and angular velocity are world-specific
   * initial conditions rather than intrinsic body properties. Omitted values
   * default to zero. The supplied vectors are copied before becoming
   * authoritative runtime state.
   *
   * Orientation is expressed in radians. Angular velocity is expressed in
   * radians per second. Positive values rotate counter-clockwise in the
   * mathematical world coordinate system.
   *
   * Static Bodies must enter the World with zero velocity and zero angular
   * velocity. Their position and orientation may still be configured freely.
   * This preserves a clear distinction from future kinematic Bodies, which may
   * have prescribed motion despite also having zero inverse mass.
   *
   * The same body definition may be added more than once, including to
   * different worlds. Each addition receives its own world-local identifier
   * and independent runtime state.
   *
   * @param body The reusable body definition to instantiate in this world.
   * @param initialConditions Optional initial position, velocity, orientation,
   * and angular velocity.
   * @returns The world-local identifier assigned to the new body instance.
   * @throws {RangeError} If an initial condition contains a non-finite value, or
   * if a static Body is given non-zero velocity or angular velocity.
   */
  public addBody(body: Body, initialConditions: BodyInitialConditions = {}): BodyId {
    const position = initialConditions.position ?? new Vector2(0, 0);
    const velocity = initialConditions.velocity ?? new Vector2(0, 0);
    const orientation = initialConditions.orientation ?? 0;
    const angularVelocity = initialConditions.angularVelocity ?? 0;

    const initialState: BodyState = {
      position: new Vector2(position.x, position.y),
      velocity: new Vector2(velocity.x, velocity.y),
      orientation,
      angularVelocity,
    };

    assertFiniteBodyState(initialState, "Initial body state");
    assertBodyTypeInitialState(body, initialState);

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
   * Advances every body in the World by one atomic timestep.
   *
   * World coordinates the physics pipeline but does not implement the injected
   * policies it uses:
   *
   * 1. integrate every Body into a complete detached candidate state set;
   * 2. detect collisions from that candidate configuration;
   * 3. ask the injected CollisionSolver for resolved candidate states;
   * 4. validate that the solver returned one finite state for every Body;
   * 5. atomically replace authoritative World state.
   *
   * If integration, detection, solving, or validation fails, no authoritative
   * Body state is replaced.
   *
   * @param dt The timestep duration in seconds.
   * @throws {RangeError} If the timestep is negative or not finite, or if an
   * integration/solver result contains a non-finite value.
   */
  public step(dt: number): void {
    assertValidTimestep(dt);

    const integratedStates = this.#integrateBodies(dt);
    const integratedSnapshots = this.#createSnapshots(integratedStates);
    const collisions = detectBodyCollisions(integratedSnapshots);
    const resolvedStates = this.#collisionSolver.solve(integratedSnapshots, collisions);

    this.#validateResolvedStates(integratedStates, resolvedStates);
    this.#commitResolvedStates(resolvedStates);
  }

  /** Builds a complete post-integration candidate state set. */
  #integrateBodies(dt: number): ReadonlyMap<BodyId, BodyState> {
    const integratedStates = new Map<BodyId, BodyState>();

    for (const [bodyId, worldBody] of this.#bodies) {
      let nextState: BodyState;

      switch (worldBody.definition.type) {
        case "dynamic":
          nextState = this.#integrator.integrate(worldBody.state, this.#gravity, dt);
          assertFiniteBodyState(nextState, `Integrator result for body ${bodyId}`);
          break;

        case "static":
          nextState = copyState(worldBody.state);
          break;

        default:
          worldBody.definition.type satisfies never;
          throw new Error(`Unsupported Body type for body ${bodyId}.`);
      }

      integratedStates.set(bodyId, nextState);
    }

    return integratedStates;
  }

  /**
   * Creates detached observations of a complete candidate state set.
   *
   * Detection and solving receive observations rather than authoritative World
   * storage, preserving the World state-ownership boundary.
   */
  #createSnapshots(states: ReadonlyMap<BodyId, BodyState>): readonly BodySnapshot[] {
    return Array.from(this.#bodies, ([id, worldBody]): BodySnapshot => {
      const state = states.get(id);

      if (state === undefined) {
        throw new Error(
          `Candidate state for body ${id} is missing during an atomic world step.`,
        );
      }

      return { id, definition: worldBody.definition, state: copyState(state) };
    });
  }

  /**
   * Validates the injected solver's complete candidate result before commit.
   */
  #validateResolvedStates(
    integratedStates: ReadonlyMap<BodyId, BodyState>,
    resolvedStates: ReadonlyMap<BodyId, BodyState>,
  ): void {
    if (resolvedStates.size !== integratedStates.size) {
      throw new Error("Collision solver must return exactly one state for every World body.");
    }

    for (const bodyId of integratedStates.keys()) {
      const resolvedState = resolvedStates.get(bodyId);

      if (resolvedState === undefined) {
        throw new Error(`Collision solver did not return a state for body ${bodyId}.`);
      }

      assertFiniteBodyState(resolvedState, `Collision solver result for body ${bodyId}`);
    }
  }

  /** Commits a fully validated candidate set as detached authoritative state. */
  #commitResolvedStates(resolvedStates: ReadonlyMap<BodyId, BodyState>): void {
    for (const [bodyId, resolvedState] of resolvedStates) {
      const worldBody = this.#bodies.get(bodyId);

      if (worldBody === undefined) {
        throw new Error(`Collision solver returned an unknown body ${bodyId}.`);
      }

      // Copy at the ownership boundary so an injected solver cannot retain a
      // reference to the authoritative BodyState installed in the World.
      worldBody.state = copyState(resolvedState);
    }
  }
}

function assertBodyTypeInitialState(body: Body, state: BodyState): void {
  switch (body.type) {
    case "dynamic":
      return;

    case "static":
      if (state.velocity.x !== 0 || state.velocity.y !== 0) {
        throw new RangeError("Static Body initial velocity must be zero.");
      }

      if (state.angularVelocity !== 0) {
        throw new RangeError("Static Body initial angular velocity must be zero.");
      }
      return;

    default:
      body.type satisfies never;
      throw new Error("Unsupported Body type while validating initial state.");
  }
}

function copyState(state: BodyState): BodyState {
  return {
    position: new Vector2(state.position.x, state.position.y),
    velocity: new Vector2(state.velocity.x, state.velocity.y),
    orientation: state.orientation,
    angularVelocity: state.angularVelocity,
  };
}
