import type { Body } from "../body/body.ts";
import type { BodyId } from "./body-id.ts";
import type { BodyState } from "./body-state.ts";

/**
 * Describes an observation of a body instance at a particular moment.
 *
 * A snapshot combines world-local identity, the reusable immutable Body
 * definition, and a detached runtime-state observation. The definition is
 * intentionally shared by reference because it is intrinsic immutable data;
 * runtime state remains detached from authoritative World storage.
 */
export interface BodySnapshot {
  /** The world-local identifier of the observed body instance. */
  readonly id: BodyId;

  /**
   * The reusable immutable Body definition instantiated by this World body.
   *
   * The reference is shared intentionally rather than copied. Body definitions
   * do not own authoritative World runtime state.
   */
  readonly definition: Body;

  /** The body's detached runtime state at the time of observation. */
  readonly state: BodyState;
}
