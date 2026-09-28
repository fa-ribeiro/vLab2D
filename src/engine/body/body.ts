/**
 * Defines the intrinsic properties of a reusable simulated body.
 *
 * A body definition does not own world-specific position, velocity, or other
 * runtime state. Those values are established when the body is added to a
 * world and are subsequently owned by that world.
 *
 * `Body` currently has no intrinsic properties. Future properties should be
 * added only when concrete simulation features require them.
 */
export class Body {
  /** Creates a body definition with the currently supported intrinsic defaults. */
  public constructor() {}
}
