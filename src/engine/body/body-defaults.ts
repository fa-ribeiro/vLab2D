import type { BodyType } from "./body-type.ts";

/**
 * Safe default values used when optional Body configuration is omitted.
 *
 * The object is frozen so defaults are process-wide constants rather than
 * mutable global configuration. Callers customize an individual Body through
 * {@link BodyOptions}; they do not mutate these shared values.
 *
 * Inverse mass has separate dynamic/static defaults because Body type changes
 * the semantic default rather than merely overriding one common scalar.
 */
export const BODY_DEFAULTS = Object.freeze({
  type: "dynamic" as BodyType,
  dynamicInverseMass: 1,
  staticInverseMass: 0,
  restitution: 0,
  friction: 0,
});
