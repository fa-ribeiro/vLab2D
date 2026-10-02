import { assert, assertEquals } from "@std/assert";

import { Body } from "../body/body.ts";
import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { Vector2 } from "../math/vector2.ts";
import type { BodyId } from "../world/body-id.ts";
import type { BodySnapshot } from "../world/body-snapshot.ts";
import type { BodyState } from "../world/body-state.ts";
import { aabbsOverlap, computeShapeAabb } from "./aabb.ts";
import { detectBodyCollisions } from "./detect-body-collisions.ts";

function state(position: Vector2, orientation = 0): BodyState {
  return {
    position,
    velocity: new Vector2(0, 0),
    orientation,
    angularVelocity: 0,
  };
}

function snapshot(id: BodyId, body: Body, position: Vector2, orientation = 0): BodySnapshot {
  return {
    id,
    definition: body,
    state: state(position, orientation),
  };
}

Deno.test("detectBodyCollisions reports a colliding shaped pair", () => {
  const circle = new Body({ shape: new Circle(1) });

  const collisions = detectBodyCollisions([
    snapshot(1, circle, new Vector2(0, 0)),
    snapshot(2, circle, new Vector2(1.5, 0)),
  ]);

  assertEquals(collisions.length, 1);
  assertEquals(collisions[0].bodyAId, 1);
  assertEquals(collisions[0].bodyBId, 2);
  assertEquals(collisions[0].collision.normal, new Vector2(1, 0));
  assertEquals(collisions[0].collision.penetrationDepth, 0.5);
});

Deno.test("detectBodyCollisions omits separated shaped pairs", () => {
  const circle = new Body({ shape: new Circle(1) });

  assertEquals(
    detectBodyCollisions([
      snapshot(1, circle, new Vector2(0, 0)),
      snapshot(2, circle, new Vector2(3, 0)),
    ]),
    [],
  );
});

Deno.test("detectBodyCollisions skips shapeless Bodies", () => {
  const shapeless = new Body();
  const circle = new Body({ shape: new Circle(1) });

  assertEquals(
    detectBodyCollisions([
      snapshot(1, shapeless, new Vector2(0, 0)),
      snapshot(2, circle, new Vector2(0, 0)),
    ]),
    [],
  );
});

Deno.test("detectBodyCollisions reports each colliding unordered shaped pair once", () => {
  const circle = new Body({ shape: new Circle(2) });

  const collisions = detectBodyCollisions([
    snapshot(1, circle, new Vector2(0, 0)),
    snapshot(2, circle, new Vector2(1, 0)),
    snapshot(3, circle, new Vector2(2, 0)),
  ]);

  assertEquals(
    collisions.map(({ bodyAId, bodyBId }) => [bodyAId, bodyBId]),
    [
      [1, 2],
      [1, 3],
      [2, 3],
    ],
  );
});

Deno.test("detectBodyCollisions forwards body orientation to broad and narrow phases", () => {
  const rectangle = new Body({ shape: new Rectangle(4, 1) });
  const circle = new Body({ shape: new Circle(0.5) });

  const unrotated = detectBodyCollisions([
    snapshot(1, rectangle, new Vector2(0, 0)),
    snapshot(2, circle, new Vector2(0, 1.5)),
  ]);

  const rotated = detectBodyCollisions([
    snapshot(1, rectangle, new Vector2(0, 0), Math.PI / 2),
    snapshot(2, circle, new Vector2(0, 1.5)),
  ]);

  assertEquals(unrotated, []);
  assert(rotated.length === 1);
});

Deno.test("detectBodyCollisions lets narrow phase reject an AABB false positive", () => {
  const shape = new Circle(1);
  const circle = new Body({ shape });
  const positionA = new Vector2(0, 0);
  const positionB = new Vector2(1.9, 1.9);

  const aabbA = computeShapeAabb(shape, positionA, 0);
  const aabbB = computeShapeAabb(shape, positionB, 0);

  assert(aabbsOverlap(aabbA, aabbB));

  assertEquals(
    detectBodyCollisions([snapshot(1, circle, positionA), snapshot(2, circle, positionB)]),
    [],
  );
});

Deno.test("detectBodyCollisions preserves touching collisions through AABB filtering", () => {
  const circle = new Body({ shape: new Circle(1) });

  const collisions = detectBodyCollisions([
    snapshot(1, circle, new Vector2(0, 0)),
    snapshot(2, circle, new Vector2(2, 0)),
  ]);

  assertEquals(collisions.length, 1);
  assertEquals(collisions[0].collision.penetrationDepth, 0);
});
