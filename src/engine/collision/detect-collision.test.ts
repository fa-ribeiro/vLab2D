import { assert, assertAlmostEquals, assertEquals } from "@std/assert";

import type { BodyShape } from "../geometry/body-shape.ts";
import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import { detectCollision } from "./detect-collision.ts";

Deno.test("detectCollision supports every current BodyShape pair", () => {
  const shapes: readonly BodyShape[] = [
    new Circle(1),
    new Rectangle(2, 2),
    new RegularPolygon(6, 1),
  ];

  for (const shapeA of shapes) {
    for (const shapeB of shapes) {
      const collision = detectCollision(
        shapeA,
        new Vector2(0, 0),
        0,
        shapeB,
        new Vector2(0, 0),
        0,
      );

      assert(collision !== undefined);
    }
  }
});

Deno.test("detectCollision preserves Circle-to-Polygon normal direction", () => {
  const collision = detectCollision(
    new Circle(0.5),
    new Vector2(1.25, 0),
    0,
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(-1, 0));
  assertEquals(collision.penetrationDepth, 0.25);
});

Deno.test("detectCollision reverses Circle-Polygon normal for Polygon-to-Circle order", () => {
  const collision = detectCollision(
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
    new Circle(0.5),
    new Vector2(1.25, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(1, 0));
  assertEquals(collision.penetrationDepth, 0.25);
});

Deno.test("detectCollision routes Polygon-Polygon collision", () => {
  const collision = detectCollision(
    new Rectangle(4, 2),
    new Vector2(0, 0),
    0,
    new RegularPolygon(4, Math.SQRT2),
    new Vector2(2, 0),
    Math.PI / 4,
  );

  assert(collision !== undefined);
  assertAlmostEquals(collision.normal.x, 1, 1e-12);
  assertAlmostEquals(collision.normal.y, 0, 1e-12);
  assertAlmostEquals(collision.penetrationDepth, 1, 1e-12);
});

Deno.test("detectCollision returns undefined for separated shapes", () => {
  const collision = detectCollision(
    new Circle(1),
    new Vector2(0, 0),
    0,
    new RegularPolygon(5, 1),
    new Vector2(5, 0),
    0,
  );

  assertEquals(collision, undefined);
});

Deno.test("detectCollision translation moves contained shape B to touching", () => {
  const shapeA = new Rectangle(10, 10);
  const shapeB = new Rectangle(2, 2);
  const positionA = new Vector2(0, 0);
  const positionB = new Vector2(0, 0);

  const collision = detectCollision(shapeA, positionA, 0, shapeB, positionB, 0);

  assert(collision !== undefined);
  assertEquals(collision.penetrationDepth, 6);

  const translatedB = positionB.add(collision.normal.scale(collision.penetrationDepth));

  const touching = detectCollision(shapeA, positionA, 0, shapeB, translatedB, 0);

  assert(touching !== undefined);
  assertAlmostEquals(touching.penetrationDepth, 0, 1e-12);
});
