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
 * The broad phase deliberately answers only the cheap question "could these
 * Bodies collide?". Its pipeline is:
 *
 * 1. **Prepare broad-phase bodies** — ignore shapeless Bodies and compute one
 *    world-space AABB for every shaped Body.
 * 2. **Generate unordered pairs** — visit each unique Body pair once.
 * 3. **AABB overlap test** — keep pairs whose bounds overlap or touch.
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
  // Step 1 — Preparation: retain only Bodies that have physical geometry and
  // compute each world-space AABB once for this broad-phase query.
  const bodies = prepareBroadPhaseBodies(snapshots);
  const candidates: BodyCollisionCandidate[] = [];

  // Step 2 — Pair generation: indexB starts after indexA so every unordered
  // Body pair is visited exactly once and self-pairs are never produced.
  for (let indexA = 0; indexA < bodies.length; indexA += 1) {
    const bodyA = bodies[indexA];

    for (let indexB = indexA + 1; indexB < bodies.length; indexB += 1) {
      const bodyB = bodies[indexB];

      // Step 3 — Conservative overlap test: AABB overlap means "possible
      // collision", never "confirmed collision".
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

    // Shapeless Bodies have no physical extent and therefore no collision AABB.
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
