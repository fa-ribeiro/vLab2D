/**
 * Canonical fallback values for the iterative batch collision solver.
 */
export const ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS: Readonly<{
  readonly restitutionThreshold: number;
  readonly velocityIterations: number;
}> = Object.freeze({
  restitutionThreshold: 0,
  velocityIterations: 8,
});

/**
 * Optional policy used by the iterative batch collision solver.
 */
export interface IterativeBatchCollisionSolverConfig {
  /**
   * Minimum relative normal closing speed required for restitution to apply.
   *
   * Impacts at or below this threshold are solved inelastically. Defaults to
   * `ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.restitutionThreshold`.
   */
  readonly restitutionThreshold?: number;

  /**
   * Number of batch velocity-response passes performed for each detected
   * contact set.
   *
   * Every pass reads one consistent velocity snapshot, accumulates all contact
   * impulses, then applies them together before the next pass. Higher values
   * allow response to propagate farther through coupled contacts while
   * preserving within-pass symmetry and contact-order independence.
   *
   * Defaults to `ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.velocityIterations`.
   */
  readonly velocityIterations?: number;
}
