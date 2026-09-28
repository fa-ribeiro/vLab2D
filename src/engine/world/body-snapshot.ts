import type { BodyId } from "./body-id.ts";
import type { BodyState } from "./body-state.ts";

/**
 * Describes a detached observation of a body instance at a particular moment.
 *
 * A snapshot combines world-local identity with a detached runtime-state
 * observation. Modifying a returned snapshot or its nested values cannot change
 * authoritative state owned by the world.
 */
export interface BodySnapshot {
  /** The world-local identifier of the observed body instance. */
  readonly id: BodyId;

  /** The body's detached runtime state at the time of observation. */
  readonly state: BodyState;
}
