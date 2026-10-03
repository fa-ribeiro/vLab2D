import { assert, assertEquals, assertThrows } from "@std/assert";

import { Body } from "../body/body.ts";
import type { BodyCollision } from "../collision/body-collision.ts";
import { Circle } from "../geometry/circle.ts";
import { Vector2 } from "../math/vector2.ts";
import type { BodyId } from "../world/body-id.ts";
import type { BodySnapshot } from "../world/body-snapshot.ts";
import { ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS } from "./iterative-batch-collision-solver-config.ts";
import { IterativeBatchCollisionSolver } from "./iterative-batch-collision-solver.ts";

function createSnapshot(
  id: BodyId,
  definition: Body,
  position: Vector2,
  velocity = new Vector2(0, 0),
): BodySnapshot {
  return {
    id,
    definition,
    state: {
      position,
      velocity,
      orientation: 0,
      angularVelocity: 0,
    },
  };
}

function createCollision(
  bodyAId: BodyId,
  bodyBId: BodyId,
  penetrationDepth = 0,
): BodyCollision {
  return {
    bodyAId,
    bodyBId,
    collision: {
      normal: new Vector2(1, 0),
      penetrationDepth,
    },
  };
}

Deno.test("IterativeBatchCollisionSolver exposes canonical defaults", () => {
  assertEquals(ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.restitutionThreshold, 0);
  assertEquals(ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.velocityIterations, 8);
  assert(Object.isFrozen(ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS));

  const solver = new IterativeBatchCollisionSolver();

  assertEquals(
    solver.restitutionThreshold,
    ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.restitutionThreshold,
  );
  assertEquals(
    solver.velocityIterations,
    ITERATIVE_BATCH_COLLISION_SOLVER_DEFAULTS.velocityIterations,
  );
});

Deno.test("IterativeBatchCollisionSolver retains configured policy", () => {
  const solver = new IterativeBatchCollisionSolver({
    restitutionThreshold: 0.5,
    velocityIterations: 3,
  });

  assertEquals(solver.restitutionThreshold, 0.5);
  assertEquals(solver.velocityIterations, 3);
});

Deno.test("IterativeBatchCollisionSolver rejects invalid restitution threshold", () => {
  assertThrows(
    () => new IterativeBatchCollisionSolver({ restitutionThreshold: -0.1 }),
    RangeError,
    "Restitution threshold must not be negative.",
  );

  assertThrows(
    () =>
      new IterativeBatchCollisionSolver({
        restitutionThreshold: Number.POSITIVE_INFINITY,
      }),
    RangeError,
    "Restitution threshold must be finite.",
  );
});

Deno.test("IterativeBatchCollisionSolver rejects invalid velocity iteration count", () => {
  for (const velocityIterations of [0, -1, 1.5, Number.POSITIVE_INFINITY]) {
    assertThrows(
      () => new IterativeBatchCollisionSolver({ velocityIterations }),
      RangeError,
      "Velocity iterations must be a positive integer.",
    );
  }
});

Deno.test(
  "IterativeBatchCollisionSolver preserves candidates when there are no collisions",
  () => {
    const body = new Body();
    const snapshots = [
      createSnapshot(1, body, new Vector2(1, 2), new Vector2(3, 4)),
      createSnapshot(2, body, new Vector2(5, 6), new Vector2(7, 8)),
    ];

    const result = new IterativeBatchCollisionSolver().solve(snapshots, []);

    assertEquals(result.get(1), snapshots[0].state);
    assertEquals(result.get(2), snapshots[1].state);
  },
);

Deno.test("IterativeBatchCollisionSolver resolves position and normal velocity", () => {
  const body = new Body({ shape: new Circle(1) });
  const snapshots = [
    createSnapshot(1, body, new Vector2(0, 0), new Vector2(3, 4)),
    createSnapshot(2, body, new Vector2(1, 0), new Vector2(-5, 6)),
  ];

  const result = new IterativeBatchCollisionSolver().solve(snapshots, [
    createCollision(1, 2, 1),
  ]);

  assertEquals(result.get(1)?.position, new Vector2(-0.5, 0));
  assertEquals(result.get(2)?.position, new Vector2(1.5, 0));
  assertEquals(result.get(1)?.velocity, new Vector2(-1, 4));
  assertEquals(result.get(2)?.velocity, new Vector2(-1, 6));
});

Deno.test("IterativeBatchCollisionSolver mixes friction using the geometric mean", () => {
  const dynamicBody = new Body({ shape: new Circle(1), friction: 0.25 });
  const staticBody = new Body({
    type: "static",
    shape: new Circle(1),
    friction: 1,
  });
  const snapshots = [
    createSnapshot(1, dynamicBody, new Vector2(0, 0), new Vector2(3, 4)),
    createSnapshot(2, staticBody, new Vector2(1, 0)),
  ];

  const result = new IterativeBatchCollisionSolver().solve(snapshots, [
    createCollision(1, 2, 1),
  ]);

  // Mixed friction = sqrt(0.25 * 1) = 0.5. Normal impulse magnitude 3
  // therefore limits friction to 1.5, reducing tangential speed 4 -> 2.5.
  assertEquals(result.get(1)?.velocity, new Vector2(0, 2.5));
  assertEquals(result.get(2)?.velocity, new Vector2(0, 0));
});

Deno.test("IterativeBatchCollisionSolver captures restitution target at impact time", () => {
  const body = new Body({ shape: new Circle(1), restitution: 0.9 });
  const snapshots = [
    createSnapshot(1, body, new Vector2(0, 0), new Vector2(2, 0)),
    createSnapshot(2, body, new Vector2(2, 0)),
    createSnapshot(3, body, new Vector2(4, 0), new Vector2(-2, 0)),
  ];
  const collisions = [createCollision(1, 2), createCollision(2, 3)];

  const result = new IterativeBatchCollisionSolver().solve(snapshots, collisions);

  assertEquals(result.get(1)?.velocity, new Vector2(-1.78515625, 0));
  assertEquals(result.get(2)?.velocity, new Vector2(0, 0));
  assertEquals(result.get(3)?.velocity, new Vector2(1.78515625, 0));
});

Deno.test("IterativeBatchCollisionSolver suppresses restitution at or below threshold", () => {
  const dynamicBody = new Body({ shape: new Circle(1), restitution: 1 });
  const staticBody = new Body({ type: "static", shape: new Circle(1) });
  const snapshots = [
    createSnapshot(1, dynamicBody, new Vector2(0, 0), new Vector2(0.4, 2)),
    createSnapshot(2, staticBody, new Vector2(1, 0)),
  ];

  const result = new IterativeBatchCollisionSolver({ restitutionThreshold: 0.5 }).solve(
    snapshots,
    [createCollision(1, 2, 1)],
  );

  assertEquals(result.get(1)?.velocity, new Vector2(0, 2));
});

Deno.test("IterativeBatchCollisionSolver mixes Body restitution using the larger value", () => {
  const dynamicBody = new Body({ shape: new Circle(1), restitution: 0.25 });
  const staticBody = new Body({
    type: "static",
    shape: new Circle(1),
    restitution: 0.75,
  });
  const snapshots = [
    createSnapshot(1, dynamicBody, new Vector2(0, 0), new Vector2(3, 2)),
    createSnapshot(2, staticBody, new Vector2(1, 0)),
  ];

  const result = new IterativeBatchCollisionSolver().solve(snapshots, [
    createCollision(1, 2, 1),
  ]);

  assertEquals(result.get(1)?.velocity, new Vector2(-2.25, 2));
  assertEquals(result.get(2)?.velocity, new Vector2(0, 0));
});

Deno.test(
  "IterativeBatchCollisionSolver contact is frictionless when either coefficient is zero",
  () => {
    const dynamicBody = new Body({ shape: new Circle(1), friction: 1 });
    const staticBody = new Body({ type: "static", shape: new Circle(1) });
    const snapshots = [
      createSnapshot(1, dynamicBody, new Vector2(0, 0), new Vector2(3, 4)),
      createSnapshot(2, staticBody, new Vector2(1, 0)),
    ];

    const result = new IterativeBatchCollisionSolver().solve(snapshots, [
      createCollision(1, 2, 1),
    ]);

    assertEquals(result.get(1)?.velocity, new Vector2(0, 4));
  },
);
