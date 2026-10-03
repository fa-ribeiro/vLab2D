/**
 * Public API for the vLab2D simulation engine.
 *
 * External consumers should import engine functionality from this module
 * rather than depending directly on internal engine modules.
 *
 * @module
 */

export { Body } from "./body/body.ts";
export type { BodyOptions } from "./body/body-options.ts";
export type { BodyType } from "./body/body-type.ts";

export type { Aabb } from "./collision/aabb.ts";
export { aabbsOverlap, computeShapeAabb } from "./collision/aabb.ts";
export type { BodyCollisionCandidate } from "./collision/body-collision-candidate.ts";
export type { BodyCollision } from "./collision/body-collision.ts";
export { detectBodyCollisionCandidates } from "./collision/detect-body-collision-candidates.ts";
export type { Collision } from "./collision/collision.ts";
export { detectBodyCollisions } from "./collision/detect-body-collisions.ts";
export { detectCircleCircleCollision } from "./collision/circle-circle-collision.ts";
export { detectCirclePolygonCollision } from "./collision/circle-polygon-collision.ts";
export { detectCollision } from "./collision/detect-collision.ts";
export { detectPolygonPolygonCollision } from "./collision/polygon-polygon-collision.ts";

export type { BodyShape } from "./geometry/body-shape.ts";

export { Circle } from "./geometry/circle.ts";
export { Rectangle } from "./geometry/rectangle.ts";
export { RegularPolygon } from "./geometry/regular-polygon.ts";

export type { KinematicIntegrator } from "./kinematics/kinematic-integrator.ts";

export { ExplicitEulerIntegrator } from "./kinematics/explicit-euler-integrator.ts";
export { SemiImplicitEulerIntegrator } from "./kinematics/semi-implicit-euler-integrator.ts";

export { Vector2 } from "./math/vector2.ts";

export type { CollisionNormalImpulse } from "./response/collision-normal-impulse.ts";
export { computeCollisionNormalImpulse } from "./response/collision-normal-impulse.ts";
export type { CollisionPositionCorrections } from "./response/collision-position-correction.ts";
export { computeCollisionPositionCorrections } from "./response/collision-position-correction.ts";

export type { BodyId } from "./world/body-id.ts";
export type { BodyInitialConditions } from "./world/body-initial-conditions.ts";
export type { BodySnapshot } from "./world/body-snapshot.ts";
export type { BodyState } from "./world/body-state.ts";

export { World } from "./world/world.ts";
