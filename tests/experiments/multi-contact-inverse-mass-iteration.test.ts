import { assert } from "@std/assert";

import type { Collision } from "../../src/engine/collision/collision.ts";
import { Vector2 } from "../../src/engine/math/vector2.ts";
import { computeCollisionNormalImpulse } from "../../src/engine/response/collision-normal-impulse.ts";

type Contact = readonly [bodyAIndex: number, bodyBIndex: number];

type ThreeVelocities = readonly [bodyA: Vector2, bodyB: Vector2, bodyC: Vector2];

type ThreeInverseMasses = readonly [bodyA: number, bodyB: number, bodyC: number];

type IterationPass = (
  velocities: ThreeVelocities,
  inverseMasses: ThreeInverseMasses,
  contacts: readonly Contact[],
) => ThreeVelocities;

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
const TOLERANCE = 1e-12;

/**
 * Experimental batch/Jacobi-like pass with arbitrary inverse masses.
 *
 * Every contact reads the same velocity snapshot. Per-contact changes are
 * accumulated and become visible only after the complete pass.
 */
function applyBatchPass(
  velocities: ThreeVelocities,
  inverseMasses: ThreeInverseMasses,
  contacts: readonly Contact[],
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
      inverseMasses[bodyAIndex],
      inverseMasses[bodyBIndex],
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
 * Experimental sequential/Gauss-Seidel-like pass with arbitrary inverse masses.
 *
 * Each contact immediately updates temporary velocities. Later contacts in the
 * same pass therefore observe responses produced by earlier contacts.
 */
function applySequentialPass(
  velocities: ThreeVelocities,
  inverseMasses: ThreeInverseMasses,
  contacts: readonly Contact[],
): ThreeVelocities {
  const working: [Vector2, Vector2, Vector2] = [velocities[0], velocities[1], velocities[2]];

  for (const [bodyAIndex, bodyBIndex] of contacts) {
    const response = computeCollisionNormalImpulse(
      COLLISION,
      working[bodyAIndex],
      working[bodyBIndex],
      inverseMasses[bodyAIndex],
      inverseMasses[bodyBIndex],
    );

    working[bodyAIndex] = working[bodyAIndex].add(response.bodyAVelocityChange);
    working[bodyBIndex] = working[bodyBIndex].add(response.bodyBVelocityChange);
  }

  return working;
}

function repeatPass(
  initial: ThreeVelocities,
  inverseMasses: ThreeInverseMasses,
  contacts: readonly Contact[],
  iterationCount: number,
  pass: IterationPass,
): ThreeVelocities {
  let velocities = initial;

  for (let iteration = 0; iteration < iterationCount; iteration++) {
    velocities = pass(velocities, inverseMasses, contacts);
  }

  return velocities;
}

function assertXComponentsAlmostEqual(
  actual: ThreeVelocities,
  expected: readonly [number, number, number],
): void {
  for (let index = 0; index < actual.length; index++) {
    const difference = Math.abs(actual[index].x - expected[index]);

    assert(
      difference <= TOLERANCE,
      `Body ${index} x velocity ${actual[index].x} differs from expected ${expected[index]}.`,
    );
  }
}

function dynamicMomentum(
  velocities: ThreeVelocities,
  inverseMasses: ThreeInverseMasses,
): number {
  let momentum = 0;

  for (let index = 0; index < velocities.length; index++) {
    const inverseMass = inverseMasses[index];

    if (inverseMass === 0) {
      continue;
    }

    momentum += velocities[index].x / inverseMass;
  }

  return momentum;
}

Deno.test(
  "multi-contact iteration converges toward the momentum-conserving velocity for unequal masses",
  () => {
    // inverseMass = 1 / mass, so these correspond to masses 1, 2, and 1.
    const inverseMasses: ThreeInverseMasses = [1, 0.5, 1];
    const initial: ThreeVelocities = [new Vector2(3, 0), new Vector2(0, 0), new Vector2(0, 0)];

    // Initial momentum is 1×3 = 3. Total mass is 1+2+1 = 4, so a completely
    // inelastic coupled solution must approach a common velocity of 3/4.
    const expectedCommonVelocity = 0.75;

    const expectedBatch: Readonly<Record<number, readonly [number, number, number]>> = {
      1: [1, 1, 0],
      2: [1, 2 / 3, 2 / 3],
      4: [7 / 9, 20 / 27, 20 / 27],
      8: [0.7503429355281207, 0.7498856881572931, 0.7498856881572931],
    };

    const expectedSequential: Readonly<Record<number, readonly [number, number, number]>> = {
      1: [1, 2 / 3, 2 / 3],
      2: [7 / 9, 20 / 27, 20 / 27],
      4: [0.7503429355281207, 0.7498856881572931, 0.7498856881572931],
      8: [0.7500000522687895, 0.7499999825770701, 0.7499999825770701],
    };

    for (const iterations of ITERATION_COUNTS) {
      const batch = repeatPass(
        initial,
        inverseMasses,
        LEFT_TO_RIGHT_CONTACTS,
        iterations,
        applyBatchPass,
      );

      const sequential = repeatPass(
        initial,
        inverseMasses,
        LEFT_TO_RIGHT_CONTACTS,
        iterations,
        applySequentialPass,
      );

      assertXComponentsAlmostEqual(batch, expectedBatch[iterations]);
      assertXComponentsAlmostEqual(sequential, expectedSequential[iterations]);

      // Both strategies use equal/opposite impulses, so finite-mass momentum is
      // conserved throughout the experiment.
      assert(Math.abs(dynamicMomentum(batch, inverseMasses) - 3) <= TOLERANCE);
      assert(Math.abs(dynamicMomentum(sequential, inverseMasses) - 3) <= TOLERANCE);
    }

    const batchAfterEight = repeatPass(
      initial,
      inverseMasses,
      LEFT_TO_RIGHT_CONTACTS,
      8,
      applyBatchPass,
    );

    const sequentialAfterEight = repeatPass(
      initial,
      inverseMasses,
      LEFT_TO_RIGHT_CONTACTS,
      8,
      applySequentialPass,
    );

    const batchError = Math.max(
      ...batchAfterEight.map((velocity) => Math.abs(velocity.x - expectedCommonVelocity)),
    );

    const sequentialError = Math.max(
      ...sequentialAfterEight.map((velocity) => Math.abs(velocity.x - expectedCommonVelocity)),
    );

    assert(sequentialError < batchError);
  },
);

Deno.test(
  "multi-contact iteration with a static end-stop exposes propagation and contact-order effects",
  () => {
    const inverseMasses: ThreeInverseMasses = [1, 1, 0];
    const initial: ThreeVelocities = [new Vector2(3, 0), new Vector2(0, 0), new Vector2(0, 0)];

    const expectedBatch: Readonly<Record<number, readonly [number, number, number]>> = {
      1: [1.5, 1.5, 0],
      2: [1.5, 0, 0],
      4: [0.75, 0, 0],
      8: [0.1875, 0, 0],
    };

    const expectedSequentialLeftToRight: Readonly<
      Record<number, readonly [number, number, number]>
    > = {
      1: [1.5, 0, 0],
      2: [0.75, 0, 0],
      4: [0.1875, 0, 0],
      8: [0.01171875, 0, 0],
    };

    const expectedSequentialRightToLeft: Readonly<
      Record<number, readonly [number, number, number]>
    > = {
      1: [1.5, 1.5, 0],
      2: [0.75, 0.75, 0],
      4: [0.1875, 0.1875, 0],
      8: [0.01171875, 0.01171875, 0],
    };

    for (const iterations of ITERATION_COUNTS) {
      const batch = repeatPass(
        initial,
        inverseMasses,
        LEFT_TO_RIGHT_CONTACTS,
        iterations,
        applyBatchPass,
      );

      const sequentialLeftToRight = repeatPass(
        initial,
        inverseMasses,
        LEFT_TO_RIGHT_CONTACTS,
        iterations,
        applySequentialPass,
      );

      const sequentialRightToLeft = repeatPass(
        initial,
        inverseMasses,
        RIGHT_TO_LEFT_CONTACTS,
        iterations,
        applySequentialPass,
      );

      assertXComponentsAlmostEqual(batch, expectedBatch[iterations]);
      assertXComponentsAlmostEqual(
        sequentialLeftToRight,
        expectedSequentialLeftToRight[iterations],
      );
      assertXComponentsAlmostEqual(
        sequentialRightToLeft,
        expectedSequentialRightToLeft[iterations],
      );

      // Body C has zero inverse mass and remains immovable under every impulse.
      assert(Math.abs(batch[2].x) <= TOLERANCE);
      assert(Math.abs(sequentialLeftToRight[2].x) <= TOLERANCE);
      assert(Math.abs(sequentialRightToLeft[2].x) <= TOLERANCE);
    }
  },
);
