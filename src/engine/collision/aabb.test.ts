import { assertAlmostEquals, assertEquals } from "@std/assert";

import { Circle } from "../geometry/circle.ts";
import { Rectangle } from "../geometry/rectangle.ts";
import { RegularPolygon } from "../geometry/regular-polygon.ts";
import { Vector2 } from "../math/vector2.ts";
import { type Aabb, aabbsOverlap, computeShapeAabb } from "./aabb.ts";

Deno.test("computeShapeAabb bounds Circle geometry in world space", () => {
  const bounds = computeShapeAabb(new Circle(1.5), new Vector2(2, -1), Math.PI / 3);

  assertEquals(bounds.min, new Vector2(0.5, -2.5));
  assertEquals(bounds.max, new Vector2(3.5, 0.5));
});

Deno.test("computeShapeAabb bounds axis-aligned Rectangle geometry", () => {
  const bounds = computeShapeAabb(new Rectangle(4, 2), new Vector2(3, 4), 0);

  assertEquals(bounds.min, new Vector2(1, 3));
  assertEquals(bounds.max, new Vector2(5, 5));
});

Deno.test("computeShapeAabb encloses rotated Rectangle geometry", () => {
  const bounds = computeShapeAabb(new Rectangle(4, 2), new Vector2(0, 0), Math.PI / 4);

  const expectedExtent = 3 / Math.sqrt(2);

  assertAlmostEquals(bounds.min.x, -expectedExtent, 1e-12);
  assertAlmostEquals(bounds.min.y, -expectedExtent, 1e-12);
  assertAlmostEquals(bounds.max.x, expectedExtent, 1e-12);
  assertAlmostEquals(bounds.max.y, expectedExtent, 1e-12);
});

Deno.test("computeShapeAabb bounds rotated RegularPolygon geometry", () => {
  const bounds = computeShapeAabb(
    new RegularPolygon(4, Math.SQRT2),
    new Vector2(2, 3),
    Math.PI / 4,
  );

  assertAlmostEquals(bounds.min.x, 1, 1e-12);
  assertAlmostEquals(bounds.min.y, 2, 1e-12);
  assertAlmostEquals(bounds.max.x, 3, 1e-12);
  assertAlmostEquals(bounds.max.y, 4, 1e-12);
});

Deno.test("aabbsOverlap rejects boxes separated on world X", () => {
  assertEquals(aabbsOverlap(aabb(0, 0, 1, 1), aabb(2, 0, 3, 1)), false);
});

Deno.test("aabbsOverlap rejects boxes separated on world Y", () => {
  assertEquals(aabbsOverlap(aabb(0, 0, 1, 1), aabb(0, 2, 1, 3)), false);
});

Deno.test("aabbsOverlap accepts overlapping boxes", () => {
  assertEquals(aabbsOverlap(aabb(0, 0, 2, 2), aabb(1, 1, 3, 3)), true);
});

Deno.test("aabbsOverlap accepts containment", () => {
  assertEquals(aabbsOverlap(aabb(0, 0, 4, 4), aabb(1, 1, 2, 2)), true);
});

Deno.test("aabbsOverlap treats touching as overlap", () => {
  assertEquals(aabbsOverlap(aabb(0, 0, 1, 1), aabb(1, 0, 2, 1)), true);
});

function aabb(minX: number, minY: number, maxX: number, maxY: number): Aabb {
  return {
    min: new Vector2(minX, minY),
    max: new Vector2(maxX, maxY),
  };
}
