import type { BodyId } from "../world/body-id.ts";

/**
 * Describes one broad-phase candidate pair of observed World body instances.
 *
 * The pair's world-space AABBs overlap or touch, so narrow-phase collision
 * detection is required before deciding whether the physical shapes actually
 * collide.
 *
 * Candidate pairs are deliberately directionless. `bodyAId` and `bodyBId`
 * preserve deterministic pair ordering only; they do not imply a collision
 * normal, response direction, or ownership relationship.
 */
export interface BodyCollisionCandidate {
  /** World-local identity of the first candidate Body. */
  readonly bodyAId: BodyId;

  /** World-local identity of the second candidate Body. */
  readonly bodyBId: BodyId;
}
