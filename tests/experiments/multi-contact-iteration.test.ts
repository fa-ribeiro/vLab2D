import { assertEquals } from "@std/assert";

import type { Collision } from "../../src/engine/collision/collision.ts";
import { Vector2 } from "../../src/engine/math/vector2.ts";
import { computeCollisionNormalImpulse } from "../../src/engine/response/collision-normal-impulse.ts";

type Contact = readonly [bodyAIndex: number, bodyBIndex: number];

type ThreeVelocities = readonly [bodyA: Vector2, bodyB: Vector2, bodyC: Vector2];

type IterationPass = (velocities: ThreeVelocities) => ThreeVelocities;

const COLLISION: Collision = {
  normal: new Vector2(1, 0),
  penetrationDepth: 0,
};

const LEFT_TO_RIGHT_CONTACTS: readonly Contact[] = [
  [0, 1],
  [1, 2],
];

const RIGHT_TO_LEFT_CONTACTS: readonly Contact[] = [
  [1, 2],
  [0, 1],
];

const ITERATION_COUNTS = [1, 2, 4, 8] as const;

/**
 * Experimental batch/Jacobi-like pass.
 *
 * Every contact reads the same input velocity snapshot. Velocity changes are
 * accumulated and become visible only after every contact has been visited.
 *
 * This intentionally mirrors the coupling behavior of the current World
 * response pipeline without changing production code.
 */
function applyBatchPass(
  velocities: ThreeVelocities,
  contacts: readonly Contact[] = LEFT_TO_RIGHT_CONTACTS,
): ThreeVelocities {
  const changes: [Vector2, Vector2, Vector2] = [
    new Vector2(0, 0),
    new Vector2(0, 0),
    new Vector2(0, 0),
  ];

  for (const [bodyAIndex, bodyBIndex] of contacts) {
    const response = computeCollisionNormalImpulse(
      COLLISION,
      velocities[bodyAIndex],
      velocities[bodyBIndex],
      1,
      1,
    );

    changes[bodyAIndex] = changes[bodyAIndex].add(response.bodyAVelocityChange);
    changes[bodyBIndex] = changes[bodyBIndex].add(response.bodyBVelocityChange);
  }

  return [
    velocities[0].add(changes[0]),
    velocities[1].add(changes[1]),
    velocities[2].add(changes[2]),
  ];
}

/**
 * Experimental sequential/Gauss-Seidel-like pass.
 *
 * Each contact immediately updates temporary velocities, so every later
 * contact in the same pass sees the response produced by earlier contacts.
 *
 * Contact order is therefore observable and is deliberately kept explicit in
 * this experiment.
 */
function applySequentialPass(
  velocities: ThreeVelocities,
  contacts: readonly Contact[] = LEFT_TO_RIGHT_CONTACTS,
): ThreeVelocities {
  const working: [Vector2, Vector2, Vector2] = [velocities[0], velocities[1], velocities[2]];

  for (const [bodyAIndex, bodyBIndex] of contacts) {
    const response = computeCollisionNormalImpulse(
      COLLISION,
      working[bodyAIndex],
      working[bodyBIndex],
      1,
      1,
    );

    working[bodyAIndex] = working[bodyAIndex].add(response.bodyAVelocityChange);
    working[bodyBIndex] = working[bodyBIndex].add(response.bodyBVelocityChange);
  }

  return working;
}

function repeatPass(
  initial: ThreeVelocities,
  iterationCount: number,
  pass: IterationPass,
): ThreeVelocities {
  let velocities = initial;

  for (let iteration = 0; iteration < iterationCount; iteration++) {
    velocities = pass(velocities);
  }

  return velocities;
}

function xComponents(velocities: ThreeVelocities): readonly number[] {
  return velocities.map((velocity) => velocity.x);
}

Deno.test("multi-contact experiment compares batch and sequential momentum propagation", () => {
  const initial: ThreeVelocities = [new Vector2(3, 0), new Vector2(0, 0), new Vector2(0, 0)];

  const observations = ITERATION_COUNTS.map((iterations) => ({
    iterations,
    batch: xComponents(repeatPass(initial, iterations, applyBatchPass)),
    sequentialLeftToRight: xComponents(
      repeatPass(
        initial,
        iterations,
        (velocities) => applySequentialPass(velocities, LEFT_TO_RIGHT_CONTACTS),
      ),
    ),
  }));

  assertEquals(observations, [
    {
      iterations: 1,
      batch: [1.5, 1.5, 0],
      sequentialLeftToRight: [1.5, 0.75, 0.75],
    },
    {
      iterations: 2,
      batch: [1.5, 0.75, 0.75],
      sequentialLeftToRight: [1.125, 0.9375, 0.9375],
    },
    {
      iterations: 4,
      batch: [1.125, 0.9375, 0.9375],
      sequentialLeftToRight: [1.0078125, 0.99609375, 0.99609375],
    },
    {
      iterations: 8,
      batch: [1.0078125, 0.99609375, 0.99609375],
      sequentialLeftToRight: [1.000030517578125, 0.9999847412109375, 0.9999847412109375],
    },
  ]);
});

Deno.test(
  "multi-contact experiment exposes batch symmetry and sequential order dependence",
  () => {
    const initial: ThreeVelocities = [new Vector2(2, 0), new Vector2(0, 0), new Vector2(-2, 0)];

    const observations = ITERATION_COUNTS.map((iterations) => ({
      iterations,
      batch: xComponents(repeatPass(initial, iterations, applyBatchPass)),
      sequentialLeftToRight: xComponents(
        repeatPass(
          initial,
          iterations,
          (velocities) => applySequentialPass(velocities, LEFT_TO_RIGHT_CONTACTS),
        ),
      ),
      sequentialRightToLeft: xComponents(
        repeatPass(
          initial,
          iterations,
          (velocities) => applySequentialPass(velocities, RIGHT_TO_LEFT_CONTACTS),
        ),
      ),
    }));

    assertEquals(observations, [
      {
        iterations: 1,
        batch: [1, 0, -1],
        sequentialLeftToRight: [1, -0.5, -0.5],
        sequentialRightToLeft: [0.5, 0.5, -1],
      },
      {
        iterations: 2,
        batch: [0.5, 0, -0.5],
        sequentialLeftToRight: [0.25, -0.125, -0.125],
        sequentialRightToLeft: [0.125, 0.125, -0.25],
      },
      {
        iterations: 4,
        batch: [0.125, 0, -0.125],
        sequentialLeftToRight: [0.015625, -0.0078125, -0.0078125],
        sequentialRightToLeft: [0.0078125, 0.0078125, -0.015625],
      },
      {
        iterations: 8,
        batch: [0.0078125, 0, -0.0078125],
        sequentialLeftToRight: [0.00006103515625, -0.000030517578125, -0.000030517578125],
        sequentialRightToLeft: [0.000030517578125, 0.000030517578125, -0.00006103515625],
      },
    ]);
  },
);
