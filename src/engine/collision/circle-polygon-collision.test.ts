import { assert, assertAlmostEquals, assertEquals } from "@std/assert";

import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import { detectCirclePolygonCollision } from "./circle-polygon-collision.ts";

Deno.test(
  "Circle-Polygon returns undefined when Circle is separated from Rectangle edge",
  () => {
    const collision = detectCirclePolygonCollision(
      new Circle(0.5),
      new Vector2(2, 0),
      new Rectangle(2, 2),
      new Vector2(0, 0),
      0,
    );

    assertEquals(collision, undefined);
  },
);

Deno.test("Circle-Polygon treats touching Rectangle edge as zero-depth collision", () => {
  const collision = detectCirclePolygonCollision(
    new Circle(0.5),
    new Vector2(1.5, 0),
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(-1, 0));
  assertEquals(collision.penetrationDepth, 0);
});

Deno.test("Circle-Polygon returns Circle-to-Rectangle normal and edge penetration", () => {
  const collision = detectCirclePolygonCollision(
    new Circle(0.5),
    new Vector2(1.25, 0),
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(-1, 0));
  assertEquals(collision.penetrationDepth, 0.25);
});

Deno.test("Circle-Polygon closest-vertex axis detects Rectangle corner separation", () => {
  const collision = detectCirclePolygonCollision(
    new Circle(0.5),
    new Vector2(1.4, 1.4),
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
  );

  // The Circle overlaps the Rectangle projections on world X and Y, but its
  // distance from the corner is still greater than its radius.
  assertEquals(collision, undefined);
});

Deno.test("Circle-Polygon closest-vertex axis resolves Rectangle corner overlap", () => {
  const collision = detectCirclePolygonCollision(
    new Circle(0.5),
    new Vector2(1.3, 1.3),
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
  );

  const expectedComponent = -Math.SQRT1_2;
  const expectedDepth = 0.5 - Math.hypot(0.3, 0.3);

  assert(collision !== undefined);
  assertAlmostEquals(collision.normal.x, expectedComponent, 1e-12);
  assertAlmostEquals(collision.normal.y, expectedComponent, 1e-12);
  assertAlmostEquals(collision.penetrationDepth, expectedDepth, 1e-12);
});

Deno.test("Circle-Polygon supports rotated Rectangles", () => {
  const angle = Math.PI / 4;
  const outward = new Vector2(1, 0).rotate(angle);

  const collision = detectCirclePolygonCollision(
    new Circle(0.5),
    outward.scale(1.25),
    new Rectangle(2, 2),
    new Vector2(0, 0),
    angle,
  );

  assert(collision !== undefined);
  assertAlmostEquals(collision.normal.x, -outward.x, 1e-12);
  assertAlmostEquals(collision.normal.y, -outward.y, 1e-12);
  assertAlmostEquals(collision.penetrationDepth, 0.25, 1e-12);
});

Deno.test("Circle-Polygon supports RegularPolygon collision", () => {
  const collision = detectCirclePolygonCollision(
    new Circle(0.5),
    new Vector2(1.2, 0),
    new RegularPolygon(6, 1),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assert(collision.penetrationDepth > 0);
});

Deno.test("Circle-Polygon handles Circle contained inside Rectangle", () => {
  const collision = detectCirclePolygonCollision(
    new Circle(1),
    new Vector2(0, 0),
    new Rectangle(10, 10),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(0, 1));
  assertEquals(collision.penetrationDepth, 6);
});

Deno.test("Circle-Polygon skips zero-length closest-vertex axis", () => {
  const collision = detectCirclePolygonCollision(
    new Circle(0.2),
    new Vector2(1, 1),
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assertAlmostEquals(collision.penetrationDepth, 0.2, 1e-12);
});
