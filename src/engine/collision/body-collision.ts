import type { BodyId } from "../world/body-id.ts";
import type { Collision } from "./collision.ts";

/**
 * Describes one detected collision between two observed World body instances.
 *
 * `bodyAId` and `bodyBId` identify the pair ordering used by narrow-phase
 * detection. The nested {@link Collision} therefore describes the minimum
 * separation translation for body B relative to body A.
 *
 * Body identifiers are world-local. A collection of BodyCollision values
 * should therefore be interpreted in the context of the World snapshots from
 * which it was produced.
 */
export interface BodyCollision {
  /** World-local identity of shape/body A. */
  readonly bodyAId: BodyId;

  /** World-local identity of shape/body B. */
  readonly bodyBId: BodyId;

  /** Narrow-phase minimum-separation information for this body pair. */
  readonly collision: Collision;
}
