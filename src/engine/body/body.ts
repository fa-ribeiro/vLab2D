import type { BodyShape } from "../geometry/body-shape.ts";
import type { BodyOptions } from "./body-options.ts";

/**
 * Defines the intrinsic properties of a reusable simulated body.
 *
 * A body definition does not own world-specific position, velocity, or other
 * runtime state. Those values are established when the body is added to a
 * world and are subsequently owned by that world.
 *
 * Geometry is optional. A shapeless Body remains valid for capabilities that
 * require identity and motion state but no spatial extent.
 */
export class Body {
  /**
   * Optional intrinsic geometry attached to this reusable definition.
   *
   * Phase 2 currently supports Circle geometry only. The reference is retained
   * directly because Circle is immutable and reusable.
   */
  public readonly shape: BodyShape | undefined;

  /**
   * Creates a reusable body definition.
   *
   * @param options Optional intrinsic Body configuration.
   */
  public constructor(options: BodyOptions = {}) {
    this.shape = options.shape;
  }
}
