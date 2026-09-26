import type { KinematicState } from "../kinematics/kinematic-state.ts";
import type { BodyId } from "./body-id.ts";

/**
 * Describes the observed state of a body at the time a world snapshot is
 * requested.
 *
 * A snapshot is detached from the world's authoritative storage. Modifying a
 * returned snapshot or its state cannot change the body stored by the world.
 */
export interface KinematicBodySnapshot {
  /** The world-local identifier of the observed body. */
  readonly id: BodyId;

  /** The body's kinematic state at the time the snapshot was created. */
  readonly state: KinematicState;
}
