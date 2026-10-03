import type { Collision } from "../collision/collision.ts";
import type { BodyCollision } from "../collision/body-collision.ts";
import { assertFiniteBodyState, assertFiniteVector } from "../kinematics/validation.ts";
import { assertFiniteNumber, assertNonNegativeNumber } from "../math/validation.ts";
import { Vector2 } from "../math/vector2.ts";
import { computeCollisionFrictionImpulse } from "../response/collision-friction-impulse.ts";
import { computeCollisionNormalImpulse } from "../response/collision-normal-impulse.ts";
import { computeCollisionPositionCorrections } from "../response/collision-position-correction.ts";
import type { BodyId } from "../world/body-id.ts";
import type { BodySnapshot } from "../world/body-snapshot.ts";
import type { BodyState } from "../world/body-state.ts";
import type { CollisionSolver } from "./collision-solver.ts";
import {
  ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS,
  type IterativeBatchCollisionSolverConfig,
} from "./iterative-batch-collision-solver-config.ts";

/** Per-step contact data prepared before iterative velocity response begins. */
interface PreparedContact {
  readonly bodyAId: BodyId;
  readonly bodyBId: BodyId;
  readonly collision: Collision;
  readonly targetNormalVelocity: number;
}

/**
 * Resolves collisions with one positional batch followed by iterative batch
 * velocity response.
 *
 * The algorithm deliberately keeps a read/accumulate/apply boundary inside
 * every velocity iteration. All contacts in one pass therefore read the same
 * velocity snapshot, preserving within-pass symmetry and contact-order
 * independence. Response from one pass becomes visible to every contact in the
 * next pass.
 *
 * Restitution targets are captured once from the input impact velocities before
 * response begins. Iteration therefore converges toward a fixed impact-time
 * bounce target rather than repeatedly redefining restitution from already
 * modified velocities.
 */
export class IterativeBatchCollisionSolver implements CollisionSolver {
  readonly #restitutionThreshold: number;
  readonly #velocityIterations: number;

  /**
   * Creates an iterative batch solver.
   *
   * @param config Optional solver policy.
   * @throws {RangeError} If the restitution threshold is negative/non-finite or
   * velocity iterations is not a positive integer.
   */
  public constructor(config: IterativeBatchCollisionSolverConfig = {}) {
    const restitutionThreshold = config.restitutionThreshold ??
      ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.restitutionThreshold;
    const velocityIterations = config.velocityIterations ??
      ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.velocityIterations;

    assertFiniteNumber(restitutionThreshold, "Restitution threshold");
    assertNonNegativeNumber(restitutionThreshold, "Restitution threshold");

    if (!Number.isInteger(velocityIterations) || velocityIterations <= 0) {
      throw new RangeError("Velocity iterations must be a positive integer.");
    }

    this.#restitutionThreshold = restitutionThreshold;
    this.#velocityIterations = velocityIterations;
  }

  /** Minimum impact closing speed required for restitution. */
  public get restitutionThreshold(): number {
    return this.#restitutionThreshold;
  }

  /** Number of batch velocity-response passes. */
  public get velocityIterations(): number {
    return this.#velocityIterations;
  }

  /**
   * Resolves the supplied collisions against detached integrated Body states.
   */
  public solve(
    bodies: readonly BodySnapshot[],
    collisions: readonly BodyCollision[],
  ): ReadonlyMap<BodyId, BodyState> {
    const bodiesById = new Map(bodies.map((body) => [body.id, body] as const));

    // Prepare fixed restitution targets before any response changes velocity.
    const preparedContacts: readonly PreparedContact[] = collisions.map(
      ({ bodyAId, bodyBId, collision }): PreparedContact => {
        const bodyA = bodiesById.get(bodyAId);
        const bodyB = bodiesById.get(bodyBId);

        if (bodyA === undefined || bodyB === undefined) {
          throw new Error("A colliding body is missing from the collision solver input.");
        }

        const restitution = Math.max(
          bodyA.definition.restitution,
          bodyB.definition.restitution,
        );

        return {
          bodyAId,
          bodyBId,
          collision,
          targetNormalVelocity: computeTargetNormalVelocity(
            collision,
            bodyA.state.velocity,
            bodyB.state.velocity,
            restitution,
            this.#restitutionThreshold,
          ),
        };
      },
    );

    // Positional response remains one batch. Every contact is resolved from the
    // same integrated geometry and its correction is accumulated by BodyId.
    const accumulatedPositionCorrections = new Map<BodyId, Vector2>();

    for (const { bodyAId, bodyBId, collision } of preparedContacts) {
      const bodyA = bodiesById.get(bodyAId);
      const bodyB = bodiesById.get(bodyBId);

      if (bodyA === undefined || bodyB === undefined) {
        throw new Error("A colliding body is missing from the collision solver input.");
      }

      const positionCorrections = computeCollisionPositionCorrections(
        collision,
        bodyA.definition.inverseMass,
        bodyB.definition.inverseMass,
      );

      accumulateVector(accumulatedPositionCorrections, bodyAId, positionCorrections.bodyA);
      accumulateVector(accumulatedPositionCorrections, bodyBId, positionCorrections.bodyB);
    }

    // Working velocities remain detached candidate data. Each iteration first
    // reads one consistent snapshot, then applies the complete accumulated pass.
    const responseVelocities = new Map<BodyId, Vector2>();

    for (const body of bodies) {
      responseVelocities.set(body.id, body.state.velocity);
    }

    for (let iteration = 0; iteration < this.#velocityIterations; iteration++) {
      const accumulatedVelocityChanges = new Map<BodyId, Vector2>();

      for (const { bodyAId, bodyBId, collision, targetNormalVelocity } of preparedContacts) {
        const bodyA = bodiesById.get(bodyAId);
        const bodyB = bodiesById.get(bodyBId);
        const velocityA = responseVelocities.get(bodyAId);
        const velocityB = responseVelocities.get(bodyBId);

        if (
          bodyA === undefined ||
          bodyB === undefined ||
          velocityA === undefined ||
          velocityB === undefined
        ) {
          throw new Error("A colliding body is missing from the collision solver input.");
        }

        const normalImpulseResponse = computeCollisionNormalImpulse(
          collision,
          velocityA,
          velocityB,
          bodyA.definition.inverseMass,
          bodyB.definition.inverseMass,
          targetNormalVelocity,
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

        // Friction uses the same pass snapshot as the normal solve. The current
        // linear-only normal impulse changes velocity only along the normal, so
        // the tangential relative velocity is unchanged within this pass.
        const friction = Math.sqrt(bodyA.definition.friction * bodyB.definition.friction);

        const frictionImpulseResponse = computeCollisionFrictionImpulse(
          collision,
          velocityA,
          velocityB,
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

      for (const [bodyId, velocity] of responseVelocities) {
        const velocityChange = accumulatedVelocityChanges.get(bodyId);

        if (velocityChange === undefined) {
          continue;
        }

        const nextVelocity = velocity.add(velocityChange);

        assertFiniteVector(nextVelocity, `Collision response velocity for body ${bodyId}`);
        responseVelocities.set(bodyId, nextVelocity);
      }
    }

    // Resolve one complete candidate state for every input Body. World will
    // independently validate this complete result before committing it.
    const resolvedStates = new Map<BodyId, BodyState>();

    for (const body of bodies) {
      const positionCorrection = accumulatedPositionCorrections.get(body.id);
      const responseVelocity = responseVelocities.get(body.id);

      if (responseVelocity === undefined) {
        throw new Error(`Candidate velocity for body ${body.id} is missing from the solver.`);
      }

      const resolvedState: BodyState = {
        ...body.state,
        position: positionCorrection === undefined
          ? body.state.position
          : body.state.position.add(positionCorrection),
        velocity: responseVelocity,
      };

      assertFiniteBodyState(resolvedState, `Collision response result for body ${body.id}`);
      resolvedStates.set(body.id, resolvedState);
    }

    return resolvedStates;
  }
}

/**
 * Converts impact-time restitution policy into the fixed relative normal
 * velocity target used by every iterative solver pass.
 */
function computeTargetNormalVelocity(
  collision: Collision,
  velocityA: Vector2,
  velocityB: Vector2,
  restitution: number,
  restitutionThreshold: number,
): number {
  const initialRelativeVelocity = velocityB.subtract(velocityA);
  const initialNormalVelocity = initialRelativeVelocity.dot(collision.normal);
  const closingSpeed = -initialNormalVelocity;

  return closingSpeed > restitutionThreshold ? restitution * closingSpeed : 0;
}

function accumulateVector(
  vectors: Map<BodyId, Vector2>,
  bodyId: BodyId,
  vector: Vector2,
): void {
  const accumulated = vectors.get(bodyId);

  vectors.set(bodyId, accumulated === undefined ? vector : accumulated.add(vector));
}
