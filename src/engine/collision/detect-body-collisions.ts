import type { BodySnapshot } from "../world/body-snapshot.ts";
import type { BodyCollisionCandidate } from "./body-collision-candidate.ts";
import type { BodyCollision } from "./body-collision.ts";
import { detectBodyCollisionCandidates } from "./detect-body-collision-candidates.ts";
import { detectCollision } from "./detect-collision.ts";

/**
 * Detects collisions among detached body observations from one World.
 *
 * By default, broad-phase AABB candidates are produced by
 * {@link detectBodyCollisionCandidates}. Callers that already need those
 * candidates for another purpose, such as visualization, may supply the same
 * candidate set to avoid repeating broad-phase work.
 *
 * Every candidate is passed to exact narrow-phase geometry. AABB false
 * positives are therefore rejected before a BodyCollision is reported.
 * Touching geometry remains a collision with zero penetration depth.
 *
 * The function is a pure query over detached observations. It does not mutate
 * snapshots, Body definitions, or authoritative World state.
 *
 * @param snapshots Detached observations from a single World.
 * @param candidates Optional broad-phase candidates produced from the same
 * snapshot set.
 * @returns Confirmed body-pair collisions.
 */
export function detectBodyCollisions(
  snapshots: readonly BodySnapshot[],
  candidates: readonly BodyCollisionCandidate[] = detectBodyCollisionCandidates(snapshots),
): readonly BodyCollision[] {
  const snapshotsById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot] as const));
  const collisions: BodyCollision[] = [];

  for (const candidate of candidates) {
    const snapshotA = snapshotsById.get(candidate.bodyAId);
    const snapshotB = snapshotsById.get(candidate.bodyBId);

    // Supplied candidates are expected to come from this snapshot set. Ignore
    // stale or mismatched observations instead of inventing geometry.
    if (snapshotA === undefined || snapshotB === undefined) {
      continue;
    }

    const shapeA = snapshotA.definition.shape;
    const shapeB = snapshotB.definition.shape;

    if (shapeA === undefined || shapeB === undefined) {
      continue;
    }

    const collision = detectCollision(
      shapeA,
      snapshotA.state.position,
      snapshotA.state.orientation,
      shapeB,
      snapshotB.state.position,
      snapshotB.state.orientation,
    );

    if (collision !== undefined) {
      collisions.push({
        bodyAId: snapshotA.id,
        bodyBId: snapshotB.id,
        collision,
      });
    }
  }

  return collisions;
}
