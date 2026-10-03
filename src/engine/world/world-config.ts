import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import type { Vector2 } from "../math/vector2.ts";
import type { CollisionSolver } from "../solver/collision-solver.ts";

/**
 * Complete configuration required to construct a World.
 *
 * World owns environment state and stepping orchestration. Numerical integration
 * and collision response are explicit injected policies so experiments can
 * replace those behaviors without changing authoritative World state ownership.
 */
export interface WorldConfig {
  /**
   * Gravitational acceleration applied to dynamic Bodies.
   *
   * No default is provided because gravity is part of the experiment being
   * defined by the caller.
   */
  readonly gravity: Vector2;

  /**
   * Numerical integration strategy used to advance dynamic Body state.
   */
  readonly integrator: KinematicIntegrator;

  /**
   * Collision-response strategy used after collision detection.
   *
   * The solver receives detached post-integration Body snapshots and detected
   * collisions. It calculates candidate resolved states; World retains
   * validation and atomic commit ownership.
   */
  readonly collisionSolver: CollisionSolver;
}
