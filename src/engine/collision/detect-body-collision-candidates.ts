import type { BodySnapshot } from "../world/body-snapshot.ts";
import { type Aabb, aabbsOverlap, computeShapeAabb } from "./aabb.ts";
import type { BodyCollisionCandidate } from "./body-collision-candidate.ts";

interface BroadPhaseBody {
  readonly snapshot: BodySnapshot;
  readonly aabb: Aabb;
}

/**
 * Finds broad-phase collision candidate pairs among detached body observations.
 *
 * Shapeless Bodies are ignored because they have no physical collision
 * geometry. Each shaped Body's world-space AABB is computed once for this
 * query, then every unordered pair is tested for AABB overlap or touching.
 *
 * A returned pair is only a candidate: overlapping AABBs are a conservative
 * "maybe" and may still be rejected by narrow-phase collision detection.
 *
 * Pair generation deliberately remains O(n²). This function currently reduces
 * narrow-phase work, not the asymptotic cost of generating body pairs.
 *
 * @param snapshots Detached observations from a single World.
 * @returns Unique unordered Body pairs whose AABBs overlap or touch.
 */
export function detectBodyCollisionCandidates(
  snapshots: readonly BodySnapshot[],
): readonly BodyCollisionCandidate[] {
  const bodies = prepareBroadPhaseBodies(snapshots);
  const candidates: BodyCollisionCandidate[] = [];

  for (let indexA = 0; indexA < bodies.length; indexA += 1) {
    const bodyA = bodies[indexA];

    for (let indexB = indexA + 1; indexB < bodies.length; indexB += 1) {
      const bodyB = bodies[indexB];

      if (aabbsOverlap(bodyA.aabb, bodyB.aabb)) {
        candidates.push({
          bodyAId: bodyA.snapshot.id,
          bodyBId: bodyB.snapshot.id,
        });
      }
    }
  }

  return candidates;
}

function prepareBroadPhaseBodies(
  snapshots: readonly BodySnapshot[],
): readonly BroadPhaseBody[] {
  const bodies: BroadPhaseBody[] = [];

  for (const snapshot of snapshots) {
    const shape = snapshot.definition.shape;

    if (shape === undefined) {
      continue;
    }

    bodies.push({
      snapshot,
      aabb: computeShapeAabb(shape, snapshot.state.position, snapshot.state.orientation),
    });
  }

  return bodies;
}
