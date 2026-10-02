import type { BodyShape } from "../geometry/body-shape.ts";
import type { BodySnapshot } from "../world/body-snapshot.ts";
import { type Aabb, aabbsOverlap, computeShapeAabb } from "./aabb.ts";
import type { BodyCollision } from "./body-collision.ts";
import { detectCollision } from "./detect-collision.ts";

interface BroadPhaseBody {
  readonly snapshot: BodySnapshot;
  readonly shape: BodyShape;
  readonly aabb: Aabb;
}

/**
 * Detects collisions among detached body observations from one World.
 *
 * Shapeless bodies are ignored because they have no physical collision
 * geometry. Every unordered pair of shaped bodies is considered once.
 *
 * Each shaped Body's world-space AABB is computed once for this query.
 * Pairs whose AABBs are separated are rejected by the broad phase without
 * running narrow-phase geometry. Pairs whose AABBs overlap or touch are passed
 * to {@link detectCollision}; touching narrow-phase geometry is therefore still
 * reported with zero penetration depth.
 *
 * Pair generation deliberately remains the simple O(n²) approach for now.
 * AABB filtering reduces the number of more expensive narrow-phase tests; it
 * does not yet reduce the asymptotic number of body pairs considered.
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
  const bodies = prepareBroadPhaseBodies(snapshots);
  const collisions: BodyCollision[] = [];

  for (let indexA = 0; indexA < bodies.length; indexA += 1) {
    const bodyA = bodies[indexA];

    for (let indexB = indexA + 1; indexB < bodies.length; indexB += 1) {
      const bodyB = bodies[indexB];

      if (!aabbsOverlap(bodyA.aabb, bodyB.aabb)) {
        continue;
      }

      const collision = detectCollision(
        bodyA.shape,
        bodyA.snapshot.state.position,
        bodyA.snapshot.state.orientation,
        bodyB.shape,
        bodyB.snapshot.state.position,
        bodyB.snapshot.state.orientation,
      );

      if (collision !== undefined) {
        collisions.push({
          bodyAId: bodyA.snapshot.id,
          bodyBId: bodyB.snapshot.id,
          collision,
        });
      }
    }
  }

  return collisions;
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
      shape,
      aabb: computeShapeAabb(shape, snapshot.state.position, snapshot.state.orientation),
    });
  }

  return bodies;
}
