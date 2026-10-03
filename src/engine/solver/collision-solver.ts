import type { BodyCollision } from "../collision/body-collision.ts";
import type { BodyId } from "../world/body-id.ts";
import type { BodySnapshot } from "../world/body-snapshot.ts";
import type { BodyState } from "../world/body-state.ts";

/**
 * Resolves detected collisions against a detached candidate body-state set.
 *
 * A solver owns collision-response policy, not authoritative World state. It
 * receives snapshots produced after integration together with the collisions
 * detected from those snapshots, and returns one resolved candidate state for
 * every input Body.
 *
 * Different implementations may use different contact preparation, positional
 * correction, impulse, iteration, or convergence strategies. World remains
 * responsible for validating and atomically committing the returned states.
 */
export interface CollisionSolver {
  /**
   * Calculates resolved candidate states for one collision set.
   *
   * @param bodies Detached Body observations representing the complete
   * post-integration candidate state set.
   * @param collisions Collisions detected from that same candidate state set.
   * @returns A complete BodyId-to-BodyState map for the supplied Bodies.
   */
  solve(
    bodies: readonly BodySnapshot[],
    collisions: readonly BodyCollision[],
  ): ReadonlyMap<BodyId, BodyState>;
}
