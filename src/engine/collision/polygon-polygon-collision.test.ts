import { assert, assertAlmostEquals, assertEquals } from "@std/assert";

import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import { detectPolygonPolygonCollision } from "./polygon-polygon-collision.ts";

Deno.test("Polygon-Polygon returns undefined when Rectangles have a separating axis", () => {
  const collision = detectPolygonPolygonCollision(
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
    new Rectangle(2, 2),
    new Vector2(3, 0),
    0,
  );

  assertEquals(collision, undefined);
});

Deno.test("Polygon-Polygon treats touching Rectangles as zero-depth collision", () => {
  const collision = detectPolygonPolygonCollision(
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
    new Rectangle(2, 2),
    new Vector2(2, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(1, 0));
  assertEquals(collision.penetrationDepth, 0);
});

Deno.test(
  "Polygon-Polygon returns A-to-B normal and penetration for overlapping Rectangles",
  () => {
    const collision = detectPolygonPolygonCollision(
      new Rectangle(4, 2),
      new Vector2(0, 0),
      0,
      new Rectangle(4, 2),
      new Vector2(3, 0),
      0,
    );

    assert(collision !== undefined);
    assertEquals(collision.normal, new Vector2(1, 0));
    assertEquals(collision.penetrationDepth, 1);
  },
);

Deno.test("Polygon-Polygon reverses normal when Rectangle argument order reverses", () => {
  const collision = detectPolygonPolygonCollision(
    new Rectangle(4, 2),
    new Vector2(3, 0),
    0,
    new Rectangle(4, 2),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(-1, 0));
  assertEquals(collision.penetrationDepth, 1);
});

Deno.test("Polygon-Polygon handles complete projection containment", () => {
  const collision = detectPolygonPolygonCollision(
    new Rectangle(10, 10),
    new Vector2(0, 0),
    0,
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
  );

  assert(collision !== undefined);
  assertEquals(collision.normal, new Vector2(0, 1));
  assertEquals(collision.penetrationDepth, 6);
});

Deno.test("Polygon-Polygon uses rotated edge normals", () => {
  const angle = Math.PI / 4;
  const normal = new Vector2(0, 1).rotate(angle);

  const collision = detectPolygonPolygonCollision(
    new Rectangle(4, 2),
    new Vector2(0, 0),
    angle,
    new Rectangle(4, 2),
    normal.scale(1.5),
    angle,
  );

  assert(collision !== undefined);
  assertAlmostEquals(collision.normal.x, normal.x, 1e-12);
  assertAlmostEquals(collision.normal.y, normal.y, 1e-12);
  assertAlmostEquals(collision.penetrationDepth, 0.5, 1e-12);
});

Deno.test("Polygon-Polygon supports Rectangle-RegularPolygon pairs", () => {
  const collision = detectPolygonPolygonCollision(
    new Rectangle(2, 2),
    new Vector2(0, 0),
    0,
    new RegularPolygon(3, 1),
    new Vector2(0.5, 0),
    0,
  );

  assert(collision !== undefined);
  assert(collision.penetrationDepth > 0);
});

Deno.test("Polygon-Polygon supports RegularPolygon-RegularPolygon separation", () => {
  const collision = detectPolygonPolygonCollision(
    new RegularPolygon(6, 1),
    new Vector2(0, 0),
    0,
    new RegularPolygon(5, 1),
    new Vector2(4, 0),
    Math.PI / 5,
  );

  assertEquals(collision, undefined);
});
