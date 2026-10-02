import { assertAlmostEquals, assertEquals, assertThrows } from "@std/assert";

import { RegularPolygon } from "./regular-polygon.ts";

Deno.test("RegularPolygon stores vertex count and circumradius", () => {
  const polygon = new RegularPolygon(6, 2.5);

  assertEquals(polygon.vertexCount, 6);
  assertEquals(polygon.radius, 2.5);
  assertEquals(polygon.vertices.length, 6);
});

Deno.test("RegularPolygon places vertex zero on local positive X", () => {
  const polygon = new RegularPolygon(5, 2);

  assertEquals(polygon.vertices[0].x, 2);
  assertEquals(polygon.vertices[0].y, 0);
});

Deno.test("RegularPolygon vertices proceed counter-clockwise", () => {
  const polygon = new RegularPolygon(4, 2);

  assertAlmostEquals(polygon.vertices[0].x, 2, 1e-12);
  assertAlmostEquals(polygon.vertices[0].y, 0, 1e-12);

  assertAlmostEquals(polygon.vertices[1].x, 0, 1e-12);
  assertAlmostEquals(polygon.vertices[1].y, 2, 1e-12);

  assertAlmostEquals(polygon.vertices[2].x, -2, 1e-12);
  assertAlmostEquals(polygon.vertices[2].y, 0, 1e-12);

  assertAlmostEquals(polygon.vertices[3].x, 0, 1e-12);
  assertAlmostEquals(polygon.vertices[3].y, -2, 1e-12);
});

Deno.test("RegularPolygon rejects fewer than three vertices", () => {
  assertThrows(
    () => new RegularPolygon(2, 1),
    RangeError,
    "RegularPolygon vertex count must be at least 3.",
  );
});

Deno.test("RegularPolygon rejects a non-integer vertex count", () => {
  assertThrows(
    () => new RegularPolygon(3.5, 1),
    RangeError,
    "RegularPolygon vertex count must be an integer.",
  );
});

Deno.test("RegularPolygon rejects a non-finite vertex count", () => {
  for (const vertexCount of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertThrows(
      () => new RegularPolygon(vertexCount, 1),
      RangeError,
      "RegularPolygon vertex count must be finite.",
    );
  }
});

Deno.test("RegularPolygon rejects a zero radius", () => {
  assertThrows(
    () => new RegularPolygon(3, 0),
    RangeError,
    "RegularPolygon radius must be positive.",
  );
});

Deno.test("RegularPolygon rejects a negative radius", () => {
  assertThrows(
    () => new RegularPolygon(3, -1),
    RangeError,
    "RegularPolygon radius must be positive.",
  );
});

Deno.test("RegularPolygon rejects a non-finite radius", () => {
  for (const radius of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assertThrows(
      () => new RegularPolygon(3, radius),
      RangeError,
      "RegularPolygon radius must be finite.",
    );
  }
});
