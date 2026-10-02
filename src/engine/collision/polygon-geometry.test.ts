import { assert, assertAlmostEquals, assertEquals } from "@std/assert";

import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import { getLocalVertices, transformVerticesToWorld } from "./polygon-geometry.ts";

function assertVectorAlmostEquals(actual: Vector2, expectedX: number, expectedY: number): void {
  assertAlmostEquals(actual.x, expectedX, 1e-12);
  assertAlmostEquals(actual.y, expectedY, 1e-12);
}

Deno.test("getLocalVertices derives Rectangle vertices in counter-clockwise order", () => {
  const vertices = getLocalVertices(new Rectangle(4, 2));

  assertEquals(vertices.length, 4);
  assertEquals(vertices[0], new Vector2(-2, -1));
  assertEquals(vertices[1], new Vector2(2, -1));
  assertEquals(vertices[2], new Vector2(2, 1));
  assertEquals(vertices[3], new Vector2(-2, 1));
});

Deno.test("getLocalVertices reuses RegularPolygon intrinsic vertices", () => {
  const polygon = new RegularPolygon(5, 2);

  const vertices = getLocalVertices(polygon);

  assert(vertices === polygon.vertices);
});

Deno.test("transformVerticesToWorld translates vertices when orientation is zero", () => {
  const vertices = [new Vector2(-1, -1), new Vector2(1, -1)];

  const transformed = transformVerticesToWorld(vertices, new Vector2(4, 3), 0);

  assertEquals(transformed[0], new Vector2(3, 2));
  assertEquals(transformed[1], new Vector2(5, 2));
});

Deno.test("transformVerticesToWorld rotates then translates local vertices", () => {
  const vertices = [new Vector2(2, 0), new Vector2(0, 1)];

  const transformed = transformVerticesToWorld(vertices, new Vector2(3, -2), Math.PI / 2);

  assertVectorAlmostEquals(transformed[0], 3, 0);
  assertVectorAlmostEquals(transformed[1], 2, -2);
});

Deno.test("transformVerticesToWorld does not modify local vertices", () => {
  const local = new Vector2(2, 0);
  const vertices = [local];

  const transformed = transformVerticesToWorld(vertices, new Vector2(1, 1), Math.PI / 2);

  assert(transformed !== vertices);
  assert(transformed[0] !== local);
  assertEquals(local, new Vector2(2, 0));
});
