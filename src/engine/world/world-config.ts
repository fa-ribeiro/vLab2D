import type { KinematicIntegrator } from "../kinematics/kinematic-integrator.ts";
import type { Vector2 } from "../math/vector2.ts";

/**
 * Canonical fallback values for optional World solver policy.
 *
 * Required experiment-defining choices such as gravity and the integration
 * strategy intentionally have no defaults. Alternative reusable environment
 * configurations should be expressed as named presets rather than by mutating
 * these values.
 */
export const WORLD_DEFAULTS: Readonly<{
  readonly restitutionThreshold: number;
  readonly velocityIterations: number;
}> = Object.freeze({
  restitutionThreshold: 0,
  velocityIterations: 8,
});

/**
 * Complete configuration required to construct a World.
 *
 * Gravity and the integration strategy are explicit required choices. Optional
 * solver policy resolves through {@link WORLD_DEFAULTS}.
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
   *
   * No default is provided because integration policy is an explicit injected
   * dependency.
   */
  readonly integrator: KinematicIntegrator;

  /**
   * Minimum relative normal closing speed required for restitution to apply.
   *
   * Impacts at or below this threshold are solved inelastically. Defaults to
   * `WORLD_DEFAULTS.restitutionThreshold`.
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
   * Defaults to `WORLD_DEFAULTS.velocityIterations`.
   */
  readonly velocityIterations?: number;
}
