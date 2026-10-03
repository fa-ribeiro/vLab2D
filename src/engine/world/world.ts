import type { Body } from "../body/body.ts";
import { detectBodyCollisions } from "../collision/detect-body-collisions.ts";
import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import {
  assertFiniteBodyState,
  assertFiniteVector,
  assertValidTimestep,
} from "../kinematics/validation.ts";
import { assertFiniteNumber, assertNonNegativeNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";
import { computeCollisionFrictionImpulse } from "../response/collision-friction-impulse.ts";
import { computeCollisionNormalImpulse } from "../response/collision-normal-impulse.ts";
import { computeCollisionPositionCorrections } from "../response/collision-position-correction.ts";
import type { BodyId } from "./body-id.ts";
import type { BodyInitialConditions } from "./body-initial-conditions.ts";
import type { BodySnapshot } from "./body-snapshot.ts";
import type { BodyState } from "./body-state.ts";
import { WORLD_DEFAULTS, type WorldConfig } from "./world-config.ts";

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
 * Dynamic body instances share the same world gravity and numerical
 * integration strategy. Static body instances remain fixed. Shaped bodies
 * participate in inverse-mass-weighted positional collision response,
 * thresholded restitution-aware normal impulse response, and tangential
 * friction response after dynamic integration.
 */
export class World {
  #nextBodyId: BodyId = 1;

  readonly #bodies = new Map<BodyId, WorldBody>();
  readonly #integrator: KinematicIntegrator;
  readonly #restitutionThreshold: number;

  #gravity: Vector2;

  /**
   * Creates a world from explicit experiment configuration and optional solver
   * policy.
   *
   * @param config Complete World configuration.
   * @throws {RangeError} If gravity contains a non-finite component or the
   * restitution threshold is negative/non-finite.
   */
  public constructor(config: WorldConfig) {
    assertFiniteVector(config.gravity, "Gravity");

    const restitutionThreshold = config.restitutionThreshold ??
      WORLD_DEFAULTS.restitutionThreshold;

    assertFiniteNumber(restitutionThreshold, "Restitution threshold");
    assertNonNegativeNumber(restitutionThreshold, "Restitution threshold");

    this.#gravity = config.gravity;
    this.#integrator = config.integrator;
    this.#restitutionThreshold = restitutionThreshold;
  }

  /**
   * The gravitational acceleration currently applied to every dynamic body in
   * the world, expressed in world units per second squared.
   */
  public get gravity(): Vector2 {
    return this.#gravity;
  }

  /**
   * The minimum relative normal closing speed required for restitution.
   *
   * Impacts at or below this speed are solved inelastically. Units are
   * world-distance units per second.
   */
  public get restitutionThreshold(): number {
    return this.#restitutionThreshold;
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
   * Advances every body in the world by one timestep.
   *
   * A World step is deliberately organized as a small physics pipeline:
   *
   * 1. **Integration** — build candidate states for every Body. Dynamic Bodies
   *    are advanced through the injected integrator; static Bodies keep their
   *    current state.
   * 2. **Collision detection** — observe the complete integrated candidate
   *    configuration and find colliding Body pairs.
   * 3. **Collision response** — for every detected collision, compute and
   *    accumulate positional corrections, thresholded restitution-aware normal
   *    impulses, and Coulomb-limited tangential friction impulses.
   * 4. **State resolution and validation** — apply all accumulated response
   *    changes to the integrated candidate states and validate the results.
   * 5. **Atomic commit** — only after every candidate is valid are the resolved
   *    states installed as authoritative World state.
   *
   * A static Body has zero inverse mass, so response never translates it or
   * changes its velocity. A dynamic Body colliding with a static Body therefore
   * receives the full positional and velocity response.
   *
   * Restitution currently mixes using the larger Body value. Friction currently
   * mixes using the geometric mean of the two Body values. Those properties
   * are deliberately passed into pure response mathematics as effective pair
   * coefficients, so their eventual migration to a physical Material model
   * does not require the collision equations to know where material data lives.
   *
   * Restitution threshold is different: it is a World-level solver policy.
   * Low-speed impacts still receive a normal impulse, but restitution is
   * suppressed so tiny contacts do not keep bouncing.
   *
   * Friction changes linear tangential velocity only. Without contact points
   * and rotational inertia, friction cannot yet create or change angular
   * velocity. Contact-point angular effects and iterative contact solving remain
   * later capabilities.
   *
   * Because one batch is calculated from the same candidate state,
   * configurations with several simultaneous contacts may still need later
   * solver iterations for fully coupled contact behavior.
   *
   * If integration or response produces an invalid state, the entire world step
   * is rejected and all current body states remain unchanged.
   *
   * @param dt The timestep duration in seconds.
   * @throws {RangeError} If the timestep is negative or not finite, or if an
   * integration/response result contains a non-finite value.
   */
  public step(dt: number): void {
    // Precondition — reject an invalid timestep before the physics pipeline
    // touches any candidate or authoritative body state.
    assertValidTimestep(dt);

    // Step 1 — Integration: build a complete candidate state set without
    // changing authoritative World state yet.
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

    // Step 2 — Collision detection: observe the integrated candidate states and
    // identify which shaped Body pairs are actually colliding.
    const integratedSnapshots = this.#createSnapshots(integratedStates);
    const collisions = detectBodyCollisions(integratedSnapshots);

    // Step 3 — Collision response: accumulate the changes requested by every
    // detected contact. These maps still describe candidate changes only.
    const accumulatedPositionCorrections = new Map<BodyId, Vector2>();
    const accumulatedVelocityChanges = new Map<BodyId, Vector2>();

    for (const { bodyAId, bodyBId, collision } of collisions) {
      const bodyA = this.#bodies.get(bodyAId);
      const bodyB = this.#bodies.get(bodyBId);
      const stateA = integratedStates.get(bodyAId);
      const stateB = integratedStates.get(bodyBId);

      if (
        bodyA === undefined ||
        bodyB === undefined ||
        stateA === undefined ||
        stateB === undefined
      ) {
        throw new Error("A colliding body disappeared during an atomic world step.");
      }

      // Step 3a — Positional response: remove geometric penetration.
      const positionCorrections = computeCollisionPositionCorrections(
        collision,
        bodyA.definition.inverseMass,
        bodyB.definition.inverseMass,
      );

      accumulateVector(accumulatedPositionCorrections, bodyAId, positionCorrections.bodyA);
      accumulateVector(accumulatedPositionCorrections, bodyBId, positionCorrections.bodyB);

      // Step 3b — Normal velocity response: remove/reflect closing velocity
      // according to the pair's effective restitution and the World's minimum
      // bounce-speed policy.
      const restitution = Math.max(bodyA.definition.restitution, bodyB.definition.restitution);

      const normalImpulseResponse = computeCollisionNormalImpulse(
        collision,
        stateA.velocity,
        stateB.velocity,
        bodyA.definition.inverseMass,
        bodyB.definition.inverseMass,
        restitution,
        this.#restitutionThreshold,
      );

      accumulateVector(
        accumulatedVelocityChanges,
        bodyAId,
        normalImpulseResponse.bodyAVelocityChange,
      );
      accumulateVector(
        accumulatedVelocityChanges,
        bodyBId,
        normalImpulseResponse.bodyBVelocityChange,
      );

      // Step 3c — Tangential friction response: the geometric mean combines the
      // temporary Body-level coefficients. The actual normal impulse from Step
      // 3b—including any threshold effect—sets the Coulomb friction limit.
      const friction = Math.sqrt(bodyA.definition.friction * bodyB.definition.friction);

      const frictionImpulseResponse = computeCollisionFrictionImpulse(
        collision,
        stateA.velocity,
        stateB.velocity,
        bodyA.definition.inverseMass,
        bodyB.definition.inverseMass,
        normalImpulseResponse.impulse,
        friction,
      );

      accumulateVector(
        accumulatedVelocityChanges,
        bodyAId,
        frictionImpulseResponse.bodyAVelocityChange,
      );
      accumulateVector(
        accumulatedVelocityChanges,
        bodyBId,
        frictionImpulseResponse.bodyBVelocityChange,
      );
    }

    // Step 4 — State resolution and validation: combine integration output with
    // all accumulated collision-response changes, still without committing.
    const resolvedStates = new Map<BodyId, BodyState>();

    for (const [bodyId, integratedState] of integratedStates) {
      const positionCorrection = accumulatedPositionCorrections.get(bodyId);
      const velocityChange = accumulatedVelocityChanges.get(bodyId);

      const resolvedState: BodyState = {
        ...integratedState,
        position: positionCorrection === undefined
          ? integratedState.position
          : integratedState.position.add(positionCorrection),
        velocity: velocityChange === undefined
          ? integratedState.velocity
          : integratedState.velocity.add(velocityChange),
      };

      assertFiniteBodyState(resolvedState, `Collision response result for body ${bodyId}`);

      resolvedStates.set(bodyId, resolvedState);
    }

    // Step 5 — Atomic commit: every resolved state is now known to be valid, so
    // the complete candidate set can become authoritative World state.
    for (const [bodyId, resolvedState] of resolvedStates) {
      const worldBody = this.#bodies.get(bodyId);

      if (worldBody === undefined) {
        throw new Error(`Body ${bodyId} disappeared during an atomic world step.`);
      }

      worldBody.state = resolvedState;
    }
  }

  /**
   * Creates detached observations of a complete candidate state set.
   *
   * Collision detection remains an observation query: even while World uses it
   * internally for response, the detector receives snapshots rather than
   * authoritative mutable storage.
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

function accumulateVector(
  vectors: Map<BodyId, Vector2>,
  bodyId: BodyId,
  vector: Vector2,
): void {
  const accumulated = vectors.get(bodyId);

  vectors.set(bodyId, accumulated === undefined ? vector : accumulated.add(vector));
}

function copyState(state: BodyState): BodyState {
  return {
    position: new Vector2(state.position.x, state.position.y),
    velocity: new Vector2(state.velocity.x, state.velocity.y),
    orientation: state.orientation,
    angularVelocity: state.angularVelocity,
  };
}
