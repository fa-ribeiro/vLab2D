import { assert, assertAlmostEquals, assertEquals } from "@std/assert";

import { Circle } from "../geometry/circle.ts";
import { Vector2 } from "../math/vector2.ts";
import { detectCircleCircleCollision } from "./circle-circle-collision.ts";

Deno.test("Circle-Circle returns undefined for strictly separated circles", () => {
  const collision = detectCircleCircleCollision(
    new Circle(1),
    new Vector2(0, 0),
    new Circle(1),
    new Vector2(3, 0),
  );

  assertEquals(collision, undefined);
});

Deno.test("Circle-Circle treats touching circles as zero-depth collision", () => {
  const collision = detectCircleCircleCollision(
    new Circle(1),
    new Vector2(0, 0),
    new Circle(1),
    new Vector2(2, 0),
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(1, 0));
  assertEquals(collision.penetrationDepth, 0);
});

Deno.test("Circle-Circle returns A-to-B unit normal and penetration depth", () => {
  const collision = detectCircleCircleCollision(
    new Circle(3),
    new Vector2(0, 0),
    new Circle(3),
    new Vector2(3, 4),
  );

  assert(collision !== undefined);

  assertAlmostEquals(collision.normal.x, 0.6, 1e-12);
  assertAlmostEquals(collision.normal.y, 0.8, 1e-12);
  assertAlmostEquals(collision.penetrationDepth, 1, 1e-12);
});

Deno.test("Circle-Circle reverses the collision normal when argument order reverses", () => {
  const collision = detectCircleCircleCollision(
    new Circle(2),
    new Vector2(3, 0),
    new Circle(2),
    new Vector2(0, 0),
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(-1, 0));
  assertEquals(collision.penetrationDepth, 1);
});

Deno.test("Circle-Circle uses deterministic positive X normal for coincident centers", () => {
  const collision = detectCircleCircleCollision(
    new Circle(1),
    new Vector2(4, -2),
    new Circle(2),
    new Vector2(4, -2),
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(1, 0));
  assertEquals(collision.penetrationDepth, 3);
});
