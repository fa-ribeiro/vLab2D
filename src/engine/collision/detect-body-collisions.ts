import type { BodySnapshot } from "../world/body-snapshot.ts";
import type { BodyCollision } from "./body-collision.ts";
import { detectCollision } from "./detect-collision.ts";

/**
 * Detects collisions among detached body observations from one World.
 *
 * Shapeless bodies are ignored because they have no physical collision
 * geometry. Every unordered pair of shaped bodies is tested exactly once using
 * {@link detectCollision}; touching pairs are included with zero penetration
 * depth.
 *
 * Pair generation is deliberately the simple O(n²) approach for now. This
 * function establishes the body-level collision-query boundary so a future
 * broad phase can reduce candidate pairs without changing callers such as
 * visualization.
 *
 * The function is a pure query over detached observations. It does not mutate
 * snapshots, Body definitions, or authoritative World state.
 *
 * @param snapshots Detached observations from a single World.
 * @returns Detected body-pair collisions. `bodyAId` and `bodyBId` preserve the
 * pair ordering used for each narrow-phase query.
 */
export function detectBodyCollisions(
  snapshots: readonly BodySnapshot[],
): readonly BodyCollision[] {
  const collisions: BodyCollision[] = [];

  for (let indexA = 0; indexA < snapshots.length; indexA += 1) {
    const snapshotA = snapshots[indexA];
    const shapeA = snapshotA.definition.shape;

    if (shapeA === undefined) {
      continue;
    }

    for (let indexB = indexA + 1; indexB < snapshots.length; indexB += 1) {
      const snapshotB = snapshots[indexB];
      const shapeB = snapshotB.definition.shape;

      if (shapeB === undefined) {
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
  }

  return collisions;
}
