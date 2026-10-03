/**
 * Safe default values for optional World solver policy.
 *
 * Required experiment-defining choices such as gravity and the integrator are
 * intentionally absent. The object is frozen so it is a readable source of
 * defaults, not mutable process-wide configuration.
 */
export const WORLD_DEFAULTS = Object.freeze({
  restitutionThreshold: 0,
});
